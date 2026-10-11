import { useEffect, useState } from 'react';
import { getJSON, setJSON } from '../../lib/storage';
import Quiz from '../islands/Quiz';
import { quizKey, type QuizQuestion } from '../protocol/lib/quiz';
import {
  LEARN_KEY,
  formatMinutes,
  gatePassed,
  levelMinutes,
  levelStatus,
  normalizeProgress,
  quizBest,
  toggleItem,
  type LearnLevel,
  type LearnProgress,
} from './lib/learn';

interface Props {
  levels: LearnLevel[];
  quizzes: Record<string, QuizQuestion[]>;
}

function readBest(levels: LearnLevel[]): Record<string, number | undefined> {
  const out: Record<string, number | undefined> = {};
  for (const l of levels) for (const g of l.gates) out[g.slug] = quizBest(getJSON<unknown>(quizKey(g.slug), null));
  return out;
}

/**
 * Five-level learning path. Checklist state is stored in atlas:learn; quiz
 * gates reuse each protocol's self-test (the same Quiz island and the same
 * atlas:quiz:<slug> record as the protocol page). Everything stays local.
 */
export default function LearnPath({ levels, quizzes }: Props) {
  const [progress, setProgress] = useState<LearnProgress>({ checked: [] });
  const [best, setBest] = useState<Record<string, number | undefined>>({});
  const [openQuiz, setOpenQuiz] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const refresh = () => {
      setProgress(normalizeProgress(getJSON<unknown>(LEARN_KEY, null)));
      setBest(readBest(levels));
    };
    refresh();
    document.addEventListener('atlas:quiz', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      document.removeEventListener('atlas:quiz', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [levels]);

  const onToggle = (id: string) => {
    const next = toggleItem(normalizeProgress(getJSON<unknown>(LEARN_KEY, null)), id, new Date().toISOString());
    setProgress(next);
    setJSON(LEARN_KEY, next);
  };

  const resetAll = () => {
    const next: LearnProgress = { checked: [], updated: new Date().toISOString() };
    setProgress(next);
    setJSON(LEARN_KEY, next);
    setStatus('Checklist cleared. Quiz results stay with each protocol page.');
  };

  const statuses = levels.map((l) => levelStatus(l, progress, best));
  const units = statuses.reduce((s, x) => s + x.total + x.gatesTotal, 0);
  const doneUnits = statuses.reduce((s, x) => s + x.done + x.gatesPassed, 0);
  const percent = units ? Math.round((doneUnits / units) * 100) : 0;
  const totalMinutes = levels.reduce((s, l) => s + levelMinutes(l), 0);

  return (
    <div className="learn" data-no-copy-link="">
      <div className="learn__overall">
        <strong>
          {percent}% complete ({doneUnits} of {units} steps)
        </strong>
        <span className="learn__bar" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </span>
        <span className="hub-small">About {formatMinutes(totalMinutes)} in total. Progress is saved in this browser only.</span>
        <button type="button" className="btn btn--ghost" onClick={resetAll}>
          Clear checklist
        </button>
        <span className="sr-only" role="status">
          {status}
        </span>
      </div>

      {levels.map((level, li) => {
        const st = statuses[li]!;
        return (
          <section key={level.id} id={`level-${level.n}`} className="learn-level" data-complete={st.complete || undefined} aria-labelledby={`level-${level.n}-h`}>
            <header className="learn-level__head">
              <span className="learn-level__n">Level {level.n}</span>
              <h2 id={`level-${level.n}-h`}>{level.title}</h2>
              <span className="learn-level__meta">
                About {formatMinutes(levelMinutes(level))}. {st.done} of {st.total} done
                {st.gatesTotal > 0 && `, ${st.gatesPassed} of ${st.gatesTotal} gates passed`}
                {st.complete && '. Level complete'}.
              </span>
            </header>
            <p className="learn-level__summary">{level.summary}</p>
            <ul className="learn-list">
              {level.items.map((item) => {
                const id = `learn-${item.id}`;
                return (
                  <li key={item.id} className="learn-item">
                    <input type="checkbox" id={id} checked={progress.checked.includes(item.id)} onChange={() => onToggle(item.id)} />
                    <span>
                      <label htmlFor={id}>{item.label}</label>
                      {item.href && (
                        <>
                          {' '}
                          <a href={item.href}>
                            Open<span className="sr-only">: {item.label}</span>
                          </a>
                        </>
                      )}
                      {item.note && <span className="learn-item__note">For example: {item.note}</span>}
                    </span>
                    <span className="learn-item__time">{item.minutes} min</span>
                  </li>
                );
              })}
            </ul>
            {level.gates.length > 0 && (
              <>
                <h3 className="hub-small">Quiz gates</h3>
                <ul className="learn-gates">
                  {level.gates.map((g) => {
                    const b = best[g.slug];
                    const passed = gatePassed(g, b);
                    return (
                      <li key={g.slug} className="learn-gate" data-passed={passed || undefined}>
                        <strong>{g.name}</strong>
                        <span className="learn-gate__state">
                          {passed ? 'Passed' : 'Not passed yet'}
                          {typeof b === 'number' ? `, best ${b} of ${g.total}` : ''}. Pass mark {g.pass} of {g.total}.
                        </span>
                        {quizzes[g.slug] && (
                          <button
                            type="button"
                            className="btn"
                            aria-expanded={openQuiz === g.slug}
                            aria-controls={`quiz-${g.slug}`}
                            onClick={() => setOpenQuiz(openQuiz === g.slug ? null : g.slug)}
                          >
                            {openQuiz === g.slug ? 'Close quiz' : 'Take the quiz here'}
                          </button>
                        )}
                        <a href={`/p/${g.slug}/#s-self-test`}>
                          On the {g.name} page<span className="sr-only"> (self-test section)</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                {openQuiz && quizzes[openQuiz] && level.gates.some((g) => g.slug === openQuiz) && (
                  <div className="learn-quiz" id={`quiz-${openQuiz}`}>
                    <h3>{level.gates.find((g) => g.slug === openQuiz)?.name} self-test</h3>
                    <Quiz slug={openQuiz} questions={quizzes[openQuiz]!} />
                  </div>
                )}
              </>
            )}
            {level.pending && <p className="learn-pending">{level.pending}</p>}
          </section>
        );
      })}
    </div>
  );
}
