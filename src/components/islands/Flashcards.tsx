import { useEffect, useMemo, useState } from 'react';
import { getJSON, setJSON } from '../../lib/storage';

interface Card {
  id: string;
  front: string;
  back: string;
}

interface Props {
  slug: string;
  cards: Card[];
}

interface Stored {
  known: string[];
}

export const cardsKey = (slug: string): string => `atlas:cards:${slug}`;

/** Flip cards, mark known, filter to the unknown ones. Progress in atlas:cards:<slug>. */
export default function Flashcards({ slug, cards }: Props) {
  const key = cardsKey(slug);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const raw = getJSON<Stored | null>(key, null);
    const ids = new Set(cards.map((c) => c.id));
    setKnown(new Set((raw?.known ?? []).filter((id) => ids.has(id))));
  }, [key, cards]);

  const deck = useMemo(() => (onlyUnknown ? cards.filter((c) => !known.has(c.id)) : cards), [cards, known, onlyUnknown]);
  const safeIndex = deck.length ? Math.min(index, deck.length - 1) : 0;
  const card = deck[safeIndex];

  const go = (delta: number) => {
    if (!deck.length) return;
    setIndex((safeIndex + delta + deck.length) % deck.length);
    setFlipped(false);
  };

  const toggleKnown = () => {
    if (!card) return;
    const next = new Set(known);
    if (next.has(card.id)) next.delete(card.id);
    else next.add(card.id);
    setKnown(next);
    setJSON(key, { known: [...next] } satisfies Stored);
  };

  const reset = () => {
    setKnown(new Set());
    setJSON(key, { known: [] } satisfies Stored);
    setIndex(0);
    setFlipped(false);
  };

  return (
    <div className="fc">
      <div className="fc__bar">
        <p className="fc__count" role="status">
          {known.size} of {cards.length} marked known.
          {deck.length > 0 && ` Card ${safeIndex + 1} of ${deck.length}.`}
        </p>
        <label className="fp__check">
          <input
            type="checkbox"
            checked={onlyUnknown}
            onChange={(e) => {
              setOnlyUnknown(e.currentTarget.checked);
              setIndex(0);
              setFlipped(false);
            }}
          />
          <span>Only cards not yet known</span>
        </label>
      </div>
      {card ? (
        <>
          <div className="fc__card" data-flipped={flipped ? 'true' : undefined} data-known={known.has(card.id) ? 'true' : undefined}>
            <p className="fc__side-label">{flipped ? 'Answer' : 'Prompt'}</p>
            <p className="fc__text" aria-live="polite">
              {flipped ? card.back : card.front}
            </p>
            {known.has(card.id) && <p className="fc__known">Marked known</p>}
          </div>
          <div className="fc__actions">
            <button type="button" className="btn" onClick={() => go(-1)}>
              Previous
            </button>
            <button type="button" className="btn" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
              {flipped ? 'Show prompt' : 'Flip card'}
            </button>
            <button type="button" className="btn" aria-pressed={known.has(card.id)} onClick={toggleKnown}>
              {known.has(card.id) ? 'Known' : 'Mark known'}
            </button>
            <button type="button" className="btn" onClick={() => go(1)}>
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="fc__done">Every card is marked known.</p>
      )}
      {known.size > 0 && (
        <button type="button" className="link-btn fc__reset" onClick={reset}>
          Reset card progress
        </button>
      )}
    </div>
  );
}
