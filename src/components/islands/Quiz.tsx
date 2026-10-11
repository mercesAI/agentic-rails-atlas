import { useEffect, useState } from 'react';
import { getJSON, setJSON } from '../../lib/storage';
import {
  allAnswered,
  normalizeStored,
  quizKey,
  scoreQuiz,
  submitQuiz,
  type QuizAnswers,
  type QuizQuestion,
  type QuizStored,
} from '../protocol/lib/quiz';

interface Props {
  slug: string;
  questions: QuizQuestion[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const today = () => new Date().toISOString().slice(0, 10);

/** Ten multiple-choice questions with explanations. Answers and scores are stored in atlas:quiz:<slug>. */
export default function Quiz({ slug, questions }: Props) {
  const key = quizKey(slug);
  const [stored, setStored] = useState<QuizStored>({ answers: {}, submitted: false });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setStored(normalizeStored(getJSON<unknown>(key, null), questions));
  }, [key, questions]);

  const save = (next: QuizStored) => {
    setStored(next);
    setJSON(key, next);
    document.dispatchEvent(new CustomEvent('atlas:quiz', { detail: { slug } }));
  };

  const choose = (id: string, i: number) => {
    if (stored.submitted) return;
    const answers: QuizAnswers = { ...stored.answers, [id]: i };
    save({ ...stored, answers });
  };

  const submit = () => {
    if (!allAnswered(questions, stored.answers)) {
      const missing = questions.length - scoreQuiz(questions, stored.answers).answered;
      setMessage(`Answer every question first (${missing} left).`);
      return;
    }
    const next = submitQuiz(questions, stored.answers, stored, today());
    save(next);
    setMessage(`You scored ${next.score} of ${next.total}.`);
  };

  const retake = () => {
    save({ answers: {}, submitted: false, best: stored.best, date: stored.date });
    setMessage('Answers cleared. Your best score is kept.');
  };

  const score = scoreQuiz(questions, stored.answers);

  return (
    <div className="quiz">
      <p className="quiz__status">
        {stored.submitted
          ? `Score: ${score.correct} of ${score.total}.`
          : `${score.answered} of ${questions.length} answered.`}
        {typeof stored.best === 'number' && ` Best: ${stored.best} of ${questions.length}.`}
      </p>
      <ol className="quiz__list">
        {questions.map((q, qi) => {
          const chosen = stored.answers[q.id];
          const result = score.perQuestion[qi];
          return (
            <li key={q.id} className="quiz__item" data-result={stored.submitted ? (result?.correct ? 'right' : 'wrong') : undefined}>
              <fieldset>
                <legend>
                  <span className="quiz__qn">Question {qi + 1}.</span> {q.question}
                </legend>
                <div className="quiz__options">
                  {q.options.map((opt, oi) => {
                    const isAnswer = stored.submitted && oi === q.answer;
                    const isWrongPick = stored.submitted && chosen === oi && oi !== q.answer;
                    return (
                      <label
                        key={oi}
                        className="quiz__option"
                        data-answer={isAnswer ? 'true' : undefined}
                        data-wrong={isWrongPick ? 'true' : undefined}
                      >
                        <input
                          type="radio"
                          name={`quiz-${slug}-${q.id}`}
                          value={oi}
                          checked={chosen === oi}
                          disabled={stored.submitted}
                          onChange={() => choose(q.id, oi)}
                        />
                        <span className="quiz__letter" aria-hidden="true">
                          {LETTERS[oi]}
                        </span>
                        <span>{opt}</span>
                        {isAnswer && <span className="quiz__mark">Correct answer</span>}
                        {isWrongPick && <span className="quiz__mark">Your answer</span>}
                      </label>
                    );
                  })}
                </div>
                {stored.submitted && (
                  <p className="quiz__explain">
                    <strong>{result?.correct ? 'Right.' : 'Not quite.'}</strong> {q.explanation}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div className="quiz__actions">
        {stored.submitted ? (
          <button type="button" className="btn" onClick={retake}>
            Retake the quiz
          </button>
        ) : (
          <button type="button" className="btn" onClick={submit}>
            Check answers
          </button>
        )}
        <p className="quiz__message" role="status">
          {message}
        </p>
      </div>
    </div>
  );
}
