import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  allAnswered,
  normalizeStored,
  quizKey,
  scoreQuiz,
  submitQuiz,
  type QuizQuestion,
} from '../../../src/components/protocol/lib/quiz';

const { questions } = JSON.parse(
  readFileSync(new URL('../../fixtures/protocol/quiz.json', import.meta.url), 'utf8'),
) as { questions: QuizQuestion[] };

describe('quiz scoring', () => {
  it('uses the atlas:quiz:<slug> key', () => {
    expect(quizKey('x402')).toBe('atlas:quiz:x402');
  });

  it('scores all correct', () => {
    const s = scoreQuiz(questions, { q1: 1, q2: 3, q3: 0 });
    expect(s).toMatchObject({ correct: 3, answered: 3, total: 3, percent: 100 });
  });

  it('scores partial and unanswered questions', () => {
    const s = scoreQuiz(questions, { q1: 1, q2: 0 });
    expect(s.correct).toBe(1);
    expect(s.answered).toBe(2);
    expect(s.percent).toBe(33);
    expect(s.perQuestion.find((p) => p.id === 'q3')).toEqual({ id: 'q3', chosen: null, correct: false });
    expect(allAnswered(questions, { q1: 1, q2: 0 })).toBe(false);
  });

  it('ignores out-of-range and non-integer choices', () => {
    const s = scoreQuiz(questions, { q1: 9, q2: 1.5, q3: -1 });
    expect(s.answered).toBe(0);
    expect(s.correct).toBe(0);
  });

  it('never counts an answer index outside the options as correct', () => {
    const broken: QuizQuestion[] = [{ id: 'b', question: '?', options: ['a', 'b', 'c'], answer: 5, explanation: '' }];
    expect(scoreQuiz(broken, { b: 2 }).correct).toBe(0);
  });

  it('handles an empty quiz', () => {
    expect(scoreQuiz([], {})).toMatchObject({ correct: 0, total: 0, percent: 0 });
  });

  it('stores the submission and keeps the best score', () => {
    const first = submitQuiz(questions, { q1: 1, q2: 3, q3: 0 }, undefined, '2026-10-11');
    expect(first).toMatchObject({ submitted: true, score: 3, total: 3, best: 3, date: '2026-10-11' });
    const second = submitQuiz(questions, { q1: 0, q2: 0, q3: 0 }, first, '2026-10-12');
    expect(second.score).toBe(1);
    expect(second.best).toBe(3);
  });

  it('normalizes stored values and drops unknown ids', () => {
    expect(normalizeStored(null, questions)).toEqual({ answers: {}, submitted: false });
    const n = normalizeStored({ answers: { q1: 1, zz: 2, q2: 'x' }, submitted: true, score: 1 }, questions);
    expect(n.answers).toEqual({ q1: 1 });
    expect(n.submitted).toBe(true);
    expect(n.score).toBe(1);
  });
});
