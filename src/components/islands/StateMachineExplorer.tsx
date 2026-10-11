import { useMemo, useState } from 'react';
import type { StateMachine } from '../../lib/schemas';
import { layoutStateMachine } from '../protocol/lib/state-layout';

interface Props {
  machine: StateMachine;
  /** Optional spec base URL: a relative or anchor specRef is shown as text, a full URL as a link. */
  specUrl?: string;
}

const isUrl = (s: string) => /^https?:\/\//.test(s);

/** Up to two lines of about 20 characters; a longer label is cut at a word with "...". */
function wrapLabel(label: string, max = 20): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= 2) return lines.map((l) => (l.length > max + 4 ? `${l.slice(0, max)}...` : l));
  return [lines[0] ?? '', `${(lines[1] ?? '').slice(0, max)}...`];
}

/**
 * State machine as a layered SVG (no graph library). Click a transition, in the
 * drawing or in the list, to see its trigger, API call and spec reference.
 */
export default function StateMachineExplorer({ machine, specUrl }: Props) {
  const layout = useMemo(() => layoutStateMachine(machine), [machine]);
  const [selected, setSelected] = useState<number | null>(machine.transitions.length ? 0 : null);
  const [focusState, setFocusState] = useState<string | null>(null);
  const states = useMemo(() => new Map(machine.states.map((s) => [s.id, s])), [machine.states]);
  const label = (id: string) => states.get(id)?.label ?? id;
  const t = selected === null ? undefined : machine.transitions[selected];
  const baseId = `sm-${machine.id}`;
  const noted = machine.states.filter((s) => s.note);

  const pick = (i: number) => {
    setSelected(i);
    setFocusState(null);
  };

  return (
    <div className="sm">
      <div
        className="sm__canvas"
        role="region"
        aria-label={`State diagram: ${machine.title}`}
        // Focusable so a wide diagram can be scrolled with the keyboard.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          className="sm__svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <marker id={`${baseId}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="sm__arrowhead" />
            </marker>
          </defs>
          {layout.edges.map((e) =>
            e.path ? (
              <g
                key={e.index}
                className="sm__edge"
                data-kind={e.kind}
                data-selected={selected === e.index ? 'true' : undefined}
                onClick={() => pick(e.index)}
              >
                <path d={e.path} className="sm__edge-hit" />
                <path d={e.path} className="sm__edge-line" markerEnd={`url(#${baseId}-arrow)`} />
                <circle cx={e.labelX} cy={e.labelY} r="9" className="sm__edge-dot" />
                <text x={e.labelX} y={e.labelY} className="sm__edge-num" dominantBaseline="central" textAnchor="middle">
                  {e.index + 1}
                </text>
              </g>
            ) : null,
          )}
          {layout.nodes.map((n) => {
            const s = states.get(n.id);
            const active = t && (t.from === n.id || t.to === n.id);
            return (
              <g
                key={n.id}
                className="sm__node"
                data-initial={s?.initial ? 'true' : undefined}
                data-terminal={s?.terminal ? 'true' : undefined}
                data-active={active || focusState === n.id ? 'true' : undefined}
                onClick={() => setFocusState(n.id)}
              >
                <rect x={n.x} y={n.y} width={layout.nodeW} height={layout.nodeH} rx="8" />
                {s?.terminal && (
                  <rect x={n.x + 3} y={n.y + 3} width={layout.nodeW - 6} height={layout.nodeH - 6} rx="6" className="sm__inner" />
                )}
                {s?.initial && (
                  <>
                    <circle cx={n.x - 14} cy={n.y + layout.nodeH / 2} r="5" className="sm__start" />
                    <line x1={n.x - 9} y1={n.y + layout.nodeH / 2} x2={n.x} y2={n.y + layout.nodeH / 2} className="sm__start-line" />
                  </>
                )}
                <text x={n.x + layout.nodeW / 2} y={n.y + layout.nodeH / 2} textAnchor="middle">
                  {wrapLabel(s?.label ?? n.id).map((line, li, all) => (
                    <tspan key={li} x={n.x + layout.nodeW / 2} dy={li === 0 ? `${0.35 - (all.length - 1) * 0.6}em` : '1.2em'}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="sm__legend">
        A filled dot marks the initial state; terminal states have a double border; dashed lines go back to an earlier
        state. Numbers on the lines match the transition list.
      </p>

      <div className="sm__panel">
        <ol className="sm__list" aria-label="Transitions">
          {machine.transitions.map((tr, i) => (
            <li key={i}>
              <button
                type="button"
                className="sm__tbtn"
                aria-pressed={selected === i}
                onClick={() => pick(i)}
              >
                <span className="sm__tnum">{i + 1}</span>
                <span>
                  {label(tr.from)} <span aria-hidden="true">to</span>
                  <span className="sr-only">to</span> {label(tr.to)}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="sm__detail" aria-live="polite">
          {t ? (
            <dl>
              <div>
                <dt>Transition</dt>
                <dd>
                  {label(t.from)} to {label(t.to)}
                </dd>
              </div>
              <div>
                <dt>Trigger</dt>
                <dd>{t.trigger}</dd>
              </div>
              <div>
                <dt>API call</dt>
                <dd>{t.apiCall ? <code>{t.apiCall}</code> : 'None named in the spec'}</dd>
              </div>
              <div>
                <dt>Spec reference</dt>
                <dd>
                  {t.specRef ? (
                    isUrl(t.specRef) ? (
                      <a href={t.specRef} rel="noopener noreferrer external">
                        {t.specRef}
                      </a>
                    ) : specUrl ? (
                      <a href={specUrl} rel="noopener noreferrer external">
                        {t.specRef}
                      </a>
                    ) : (
                      t.specRef
                    )
                  ) : (
                    'Not given'
                  )}
                </dd>
              </div>
              {states.get(t.to)?.note && (
                <div>
                  <dt>About {label(t.to)}</dt>
                  <dd>{states.get(t.to)?.note}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p>Select a transition.</p>
          )}
          {focusState && states.get(focusState) && (
            <p className="sm__state-note">
              <strong>{label(focusState)}</strong>
              {states.get(focusState)?.initial ? ' (initial)' : ''}
              {states.get(focusState)?.terminal ? ' (terminal)' : ''}
              {states.get(focusState)?.note ? `: ${states.get(focusState)?.note}` : ''}
            </p>
          )}
        </div>
      </div>
      {noted.length > 0 && (
        <details className="sm__notes">
          <summary>State notes</summary>
          <dl>
            {noted.map((s) => (
              <div key={s.id}>
                <dt>{s.label}</dt>
                <dd>{s.note}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <p className="sm__meta">Spec version {machine.specVersion}.</p>
    </div>
  );
}
