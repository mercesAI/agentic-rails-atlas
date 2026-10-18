import { isTypingTarget } from '../../lib/shortcuts';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Flow } from '../../lib/schemas';
import {
  SPEEDS,
  announceStep,
  arrowGeometry,
  initialPlayerState,
  keyToAction,
  orderSteps,
  playerReducer,
  stepDelay,
  type PlayerAction,
  type PlayerState,
} from '../protocol/lib/flow-player';

interface Props {
  flow: Flow;
  /** Source id to footer number, so the player can show [N] for the flow sources. */
  sourceIndex?: Record<string, number>;
  /** Heading id prefix when several players share a page. */
  idPrefix?: string;
  /** Heading level of the step title. Use 3 when the player sits directly under an h2. Default 4. */
  headingLevel?: 3 | 4;
}

const PAYLOAD_LABELS: Record<string, string> = {
  http: 'HTTP',
  json: 'JSON',
  jwt: 'JWT',
  'sd-jwt': 'SD-JWT',
  eip712: 'EIP-712 typed data',
  solidity: 'Solidity',
  text: 'Text',
};

function formatPayload(format: string, content: string): string {
  if (format === 'json' || format === 'eip712') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  }
  return content;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Interactive sequence player for a Flow (ARCHITECTURE.md Section 6).
 * Play, pause, step, speed, payload view, trust-boundary highlight, failure
 * branches toggle, spec links, keyboard (arrows, space, Home, End), aria-live.
 */
export default function FlowPlayer({ flow, sourceIndex = {}, idPrefix, headingLevel = 4 }: Props) {
  const StepHeading = `h${headingLevel}` as 'h3' | 'h4';
  const steps = useMemo(() => orderSteps(flow.steps), [flow.steps]);
  const actorIds = useMemo(() => flow.actors.map((a) => a.id), [flow.actors]);
  const labels = useMemo(() => new Map(flow.actors.map((a) => [a.id, a.label])), [flow.actors]);
  const label = (id: string) => labels.get(id) ?? id;
  const total = steps.length;

  const [state, dispatch] = useReducer(
    (s: PlayerState, a: PlayerAction) => playerReducer(s, a, total),
    initialPlayerState,
  );
  const [showPayload, setShowPayload] = useState(true);
  const [showFailures, setShowFailures] = useState(false);
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const baseId = idPrefix ?? `fp-${flow.id}`;

  useEffect(() => {
    if (!state.playing) return;
    const t = window.setTimeout(() => dispatch({ type: 'tick' }), stepDelay(state.speed));
    return () => window.clearTimeout(t);
  }, [state.playing, state.index, state.speed, dispatch]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (isTypingTarget(target)) return;
      // The payload scrolls with every key; the step list (a column of buttons) keeps the vertical keys for scrolling; links keep Enter and Space.
      if (target?.closest('pre, a')) return;
      if (target?.closest('.fp__steps') && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) return;
      if ((e.key === ' ' || e.key === 'Spacebar') && tag === 'BUTTON') return;
      const action = keyToAction(e.key);
      if (!action) return;
      e.preventDefault();
      dispatch(action);
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [dispatch]);

  const step = steps[state.index];
  if (!step) return <p className="fp-empty">This flow has no steps yet.</p>;
  const geo = arrowGeometry(step, actorIds);
  const n = actorIds.length;
  const center = (i: number) => ((i + 0.5) / n) * 100;
  const left = Math.min(center(geo.from), center(geo.to));
  const width = Math.abs(center(geo.to) - center(geo.from));
  const flowSourceNums = [...new Set(flow.sources.map((s) => sourceIndex[s]).filter((x): x is number => Boolean(x)))].sort(
    (a, b) => a - b,
  );

  return (
    <div
      className="fp"
      ref={stageRef}
      data-reduced-motion={reduced ? 'true' : undefined}
      data-playing={state.playing ? 'true' : undefined}
    >
      <div className="fp__toolbar" role="toolbar" aria-label={`Flow player controls: ${flow.title}`}>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'first' })} disabled={state.index === 0}>
          <span aria-hidden="true">|&lt;</span>
          <span className="sr-only">First step</span>
        </button>
        <button type="button" className="btn" onClick={() => dispatch({ type: 'prev' })} disabled={state.index === 0}>
          <span aria-hidden="true">&lt;</span> Back
        </button>
        <button
          type="button"
          className="btn fp__play"
          onClick={() => dispatch({ type: 'toggle' })}
          aria-pressed={state.playing}
          disabled={total < 2}
        >
          {state.playing ? 'Pause' : state.index >= total - 1 ? 'Replay' : 'Play'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => dispatch({ type: 'next' })}
          disabled={state.index >= total - 1}
        >
          Next <span aria-hidden="true">&gt;</span>
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => dispatch({ type: 'last' })}
          disabled={state.index >= total - 1}
        >
          <span aria-hidden="true">&gt;|</span>
          <span className="sr-only">Last step</span>
        </button>
        <label className="fp__field">
          <span>Speed</span>
          <select
            value={state.speed}
            onChange={(e) => dispatch({ type: 'speed', speed: Number(e.currentTarget.value) })}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </label>
        <label className="fp__check">
          <input type="checkbox" checked={showPayload} onChange={(e) => setShowPayload(e.currentTarget.checked)} />
          <span>Payload</span>
        </label>
        <label className="fp__check">
          <input type="checkbox" checked={showFailures} onChange={(e) => setShowFailures(e.currentTarget.checked)} />
          <span>Failure branches</span>
        </label>
      </div>

      {/* The stage is focusable so arrow keys and space work without reaching for the buttons. */}
      <div
        className="fp__stage"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="group"
        aria-roledescription="sequence step"
        aria-labelledby={`${baseId}-step-title`}
        aria-describedby={`${baseId}-keys`}
        data-boundary={step.crossesTrustBoundary ? 'true' : undefined}
      >
        <div className="fp__lanes" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {flow.actors.map((a, i) => (
            <div
              key={a.id}
              className="fp__lane"
              data-kind={a.kind}
              data-active={i === geo.from || i === geo.to ? 'true' : undefined}
            >
              <span className="fp__actor">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="fp__track" aria-hidden="true">
          {geo.dir === 'self' ? (
            <div className="fp__self" style={{ left: `${center(geo.from)}%` }} />
          ) : (
            <div className="fp__arrow" data-dir={geo.dir} style={{ left: `${left}%`, width: `${width}%` }}>
              <span className="fp__arrow-label">{step.n}</span>
            </div>
          )}
        </div>
        {step.crossesTrustBoundary && (
          <p className="fp__boundary">
            <span className="fp__boundary-mark" aria-hidden="true" />
            Crosses a trust boundary
          </p>
        )}
      </div>
      <p className="sr-only" id={`${baseId}-keys`}>
        Use the left and right arrow keys to step, space to play or pause, Home and End to jump.
      </p>

      <div className="fp__detail">
        <p className="fp__count">
          Step {step.n} of {total}
          <span className="fp__route">
            {label(step.from)} <span aria-hidden="true">to</span>
            <span className="sr-only">to</span> {label(step.to)}
          </span>
        </p>
        <StepHeading className="fp__title" id={`${baseId}-step-title`}>
          {step.label}
        </StepHeading>
        <p className="fp__text">{step.detail}</p>
        {step.specRef && (
          <p className="fp__spec">
            <a href={step.specRef.url} rel="noopener noreferrer external">
              Spec{step.specRef.section ? `: ${step.specRef.section}` : ''}
              <span className="sr-only"> for step {step.n} (external link)</span>
            </a>
          </p>
        )}
        {showPayload && step.payload && (
          <figure className="fp__payload">
            <figcaption>
              {PAYLOAD_LABELS[step.payload.format] ?? step.payload.format} payload. Illustrative example, spec version{' '}
              {flow.specVersion}.
            </figcaption>
            {/* Focusable so a long payload can be scrolled with the keyboard. */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <pre tabIndex={0}>
              <code>{formatPayload(step.payload.format, step.payload.content)}</code>
            </pre>
          </figure>
        )}
        {showFailures && (
          <div className="fp__failures">
            <p className="fp__failures-title">Failure branches at this step</p>
            {step.failures?.length ? (
              <ul>
                {step.failures.map((f, i) => (
                  <li key={i}>
                    <strong>If {f.condition.replace(/\.$/, '')}:</strong> {f.outcome}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No failure branch is defined for this step.</p>
            )}
          </div>
        )}
        {step.controlPoint && (
          <p className="fp__note">
            <strong>Control point:</strong> {step.controlPoint}
          </p>
        )}
        {step.observable && (
          <p className="fp__note">
            <strong>Observable:</strong> {step.observable}
          </p>
        )}
      </div>

      <ol className="fp__steps" aria-label="All steps">
        {steps.map((s, i) => (
          <li key={s.n}>
            <button
              type="button"
              className="fp__step-btn"
              aria-current={i === state.index ? 'step' : undefined}
              onClick={() => dispatch({ type: 'goto', index: i })}
            >
              <span className="fp__step-n">{s.n}</span>
              <span className="fp__step-label">{s.label}</span>
              {s.crossesTrustBoundary && <span className="fp__tag">Boundary</span>}
              {showFailures && s.failures?.length ? <span className="fp__tag">Failures</span> : null}
            </button>
          </li>
        ))}
      </ol>

      <p className="fp__meta">
        Spec version {flow.specVersion} ({flow.specVersionDate}).
        {flowSourceNums.length > 0 && (
          <>
            {' '}
            Sources:{' '}
            {flowSourceNums.map((num, i) => (
              <span key={num}>
                {i > 0 && ', '}
                <a href={`#src-${num}`}>[{num}]</a>
              </span>
            ))}
          </>
        )}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announceStep(step, total, label)}
      </p>
    </div>
  );
}
