/**
 * Quiz scoring and the stored result shape for `atlas:quiz:<slug>` (pure, unit tested).
 */
import type { QuizItem } from '../../../lib/schemas';

export type QuizQuestion = Pick<QuizItem, 'id' | 'question' | 'options' | 'answer' | 'explanation'> & {
  claimIds?: string[];
};

/** Chosen option index per question id. */
export type QuizAnswers = Record<string, number>;

export interface QuizStored {
  answers: QuizAnswers;
  submitted: boolean;
  score?: number;
  total?: number;
  /** YYYY-MM-DD of the last submission. */
  date?: string;
  /** Best score seen across attempts. */
  best?: number;
}

export interface QuizScore {
  correct: number;
  answered: number;
  total: number;
  percent: number;
  perQuestion: { id: string; chosen: number | null; correct: boolean }[];
}

export const quizKey = (slug: string): string => `atlas:quiz:${slug}`;

/** A question counts as correct only when its chosen index equals a valid `answer`. */
export function scoreQuiz(questions: readonly QuizQuestion[], answers: QuizAnswers): QuizScore {
  const perQuestion = questions.map((q) => {
    const raw = answers[q.id];
    const chosen = typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < q.options.length ? raw : null;
    const validAnswer = q.answer >= 0 && q.answer < q.options.length;
    return { id: q.id, chosen, correct: chosen !== null && validAnswer && chosen === q.answer };
  });
  const correct = perQuestion.filter((p) => p.correct).length;
  const answered = perQuestion.filter((p) => p.chosen !== null).length;
  const total = questions.length;
  return { correct, answered, total, percent: total ? Math.round((correct / total) * 100) : 0, perQuestion };
}

export function allAnswered(questions: readonly QuizQuestion[], answers: QuizAnswers): boolean {
  return scoreQuiz(questions, answers).answered === questions.length;
}

/** Parses whatever is stored, dropping unknown question ids and invalid values. */
export function normalizeStored(raw: unknown, questions: readonly QuizQuestion[]): QuizStored {
  const empty: QuizStored = { answers: {}, submitted: false };
  if (!raw || typeof raw !== 'object') return empty;
  const r = raw as Partial<QuizStored>;
  const ids = new Set(questions.map((q) => q.id));
  const answers: QuizAnswers = {};
  if (r.answers && typeof r.answers === 'object') {
    for (const [k, v] of Object.entries(r.answers)) if (ids.has(k) && typeof v === 'number') answers[k] = v;
  }
  return {
    answers,
    submitted: Boolean(r.submitted),
    score: typeof r.score === 'number' ? r.score : undefined,
    total: typeof r.total === 'number' ? r.total : undefined,
    date: typeof r.date === 'string' ? r.date : undefined,
    best: typeof r.best === 'number' ? r.best : undefined,
  };
}

/** The stored value after a submission. */
export function submitQuiz(
  questions: readonly QuizQuestion[],
  answers: QuizAnswers,
  previous: QuizStored | undefined,
  date: string,
): QuizStored {
  const s = scoreQuiz(questions, answers);
  return {
    answers,
    submitted: true,
    score: s.correct,
    total: s.total,
    date,
    best: Math.max(previous?.best ?? 0, s.correct),
  };
}
