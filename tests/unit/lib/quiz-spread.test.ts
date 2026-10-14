import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// QA-016: correct answers must not cluster on one option position.
describe('quiz answer positions', () => {
  const dir = 'src/content/protocols';
  const counts = [0, 0, 0, 0, 0];
  for (const slug of readdirSync(dir)) {
    try {
      const quiz = JSON.parse(readFileSync(`${dir}/${slug}/quiz.json`, 'utf8')) as { questions: { answer: number }[] };
      for (const q of quiz.questions) counts[q.answer] = (counts[q.answer] ?? 0) + 1;
    } catch {
      // protocol without a quiz file
    }
  }
  const total = counts.reduce((a, b) => a + b, 0);
  it('spreads correct answers across positions', () => {
    expect(total).toBeGreaterThan(0);
    for (const n of counts.slice(0, 4)) expect(n / total).toBeGreaterThan(0.1);
    expect(Math.max(...counts) / total).toBeLessThan(0.4);
  });
});
