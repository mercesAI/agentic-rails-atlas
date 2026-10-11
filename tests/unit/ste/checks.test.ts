import { describe, expect, it } from 'vitest';
import {
  checkContractions,
  checkEmDash,
  checkImperativeStart,
  checkIngWords,
  checkLatinAbbreviations,
  checkNounClusters,
  checkParagraphLength,
  checkPhrasalVerbs,
  checkSemicolons,
  checkSentence,
  checkSentenceLength,
  checkVagueModals,
  checkVerbs,
  startsWithImperative,
  type BlockType,
  type Flag,
} from '../../../src/lib/ste/checks';
import { segmentParagraph, type Segment } from '../../../src/lib/ste/segment';

const seg = (text: string): Segment => {
  const s = segmentParagraph(text)[0];
  if (!s) throw new Error(`no sentence in "${text}"`);
  return s;
};
const ctx = (blockType: BlockType, isStep = blockType === 'procedure') => ({ blockType, isStep });
const rules = (flags: Flag[]) => flags.map((f) => f.rule);

describe('sentence length', () => {
  const words = (n: number) => `${Array.from({ length: n - 1 }, () => 'word').join(' ')} end.`;
  it('allows 20 words in a procedure and flags 21', () => {
    expect(checkSentenceLength(seg(words(20)), ctx('procedure'))).toHaveLength(0);
    expect(checkSentenceLength(seg(words(21)), ctx('procedure'))[0]?.severity).toBe('error');
  });
  it('allows 25 words in a description and flags 26', () => {
    expect(checkSentenceLength(seg(words(25)), ctx('description'))).toHaveLength(0);
    expect(checkSentenceLength(seg(words(26)), ctx('description'))).toHaveLength(1);
  });
  it('uses the procedural limit for a caution', () => {
    expect(checkSentenceLength(seg(words(21)), ctx('caution'))).toHaveLength(1);
  });
});

describe('paragraph length', () => {
  const para = segmentParagraph('One. Two. Three. Four. Five. Six. Seven.');
  it('is an error in a description', () => {
    expect(checkParagraphLength(para, 'description')[0]?.severity).toBe('error');
  });
  it('is a warning in a procedure', () => {
    expect(checkParagraphLength(para, 'procedure')[0]?.severity).toBe('warning');
  });
  it('allows six sentences', () => {
    expect(checkParagraphLength(para.slice(0, 6), 'description')).toHaveLength(0);
  });
});

describe('-ing words', () => {
  it('flags an -ing verb form', () => {
    expect(rules(checkIngWords(seg('Start signing the payload.'), ctx('procedure')))).toEqual(['ing-word']);
  });
  it('allows -ing technical nouns and ordinary nouns', () => {
    expect(checkIngWords(seg('Rotate the signing key during onboarding.'), ctx('procedure'))).toHaveLength(0);
    expect(checkIngWords(seg('The value is a string.'), ctx('description'))).toHaveLength(0);
  });
  it('ignores -ing words inside code spans', () => {
    expect(checkIngWords(seg('Set the status to `pending`.'), ctx('procedure'))).toHaveLength(0);
  });
});

describe('passive voice', () => {
  it('is an error in a procedure', () => {
    const f = checkVerbs(seg('The header is read by the client.'), ctx('procedure'));
    expect(f.find((x) => x.rule === 'passive-voice')?.severity).toBe('error');
  });
  it('is a warning in a description', () => {
    const f = checkVerbs(seg('The payment is settled by the facilitator.'), ctx('description'));
    expect(f.find((x) => x.rule === 'passive-voice')?.severity).toBe('warning');
  });
  it('accepts a passive in a description when the writer marks the agent as unknown', () => {
    const f = checkVerbs(seg('The payment is settled by the facilitator.'), { ...ctx('description'), agentUnknown: true });
    expect(f).toHaveLength(0);
  });
  it('does not flag a stative participle', () => {
    expect(checkVerbs(seg('Make sure that the key is loaded.'), ctx('procedure'))).toHaveLength(0);
  });
  it('does not flag an adjective after "are"', () => {
    expect(checkVerbs(seg('Make sure that the amount and the payTo address are correct.'), ctx('procedure'))).toHaveLength(0);
  });
  it('flags a progressive form', () => {
    expect(rules(checkVerbs(seg('The facilitator is sending the transaction.'), ctx('description')))).toContain('verb-form');
  });
});

describe('raw-text checks', () => {
  it('flags contractions but not possessives', () => {
    expect(rules(checkContractions(seg("The server doesn't keep the key."), ctx('description')))).toEqual(['contraction']);
    expect(rules(checkContractions(seg("It's the key."), ctx('description')))).toEqual(['contraction']);
    expect(checkContractions(seg("The server's key is valid."), ctx('description'))).toHaveLength(0);
  });
  it('flags semicolons outside code spans only', () => {
    expect(checkSemicolons(seg('Sign the payment; send it.'), ctx('procedure'))).toHaveLength(1);
    expect(checkSemicolons(seg('Set the header to `a; b`.'), ctx('procedure'))).toHaveLength(0);
  });
  it('flags an em dash', () => {
    expect(checkEmDash(seg('The server — not the client — settles.'), ctx('description'))).toHaveLength(1);
  });
  it('flags Latin abbreviations', () => {
    expect(checkLatinAbbreviations(seg('Use a stablecoin, e.g. USDC.'), ctx('description'))).toHaveLength(1);
  });
});

describe('phrasal verbs', () => {
  it('flags a listed phrasal verb with its alternative', () => {
    const f = checkPhrasalVerbs(seg('Set up the wallet.'), ctx('procedure'));
    expect(f[0]?.message).toContain('install or configure');
  });
  it('does not flag "make sure"', () => {
    expect(checkPhrasalVerbs(seg('Make sure that the amount is correct.'), ctx('procedure'))).toHaveLength(0);
  });
  it('does not flag a verb and a later preposition', () => {
    expect(checkPhrasalVerbs(seg('Put the signed payment in the PAYMENT-SIGNATURE header.'), ctx('procedure'))).toHaveLength(0);
  });
});

describe('noun clusters', () => {
  it('flags four nouns in a row', () => {
    expect(rules(checkNounClusters(seg('The client reads the payment channel settlement batch proof.'), ctx('description')))).toEqual([
      'noun-cluster',
    ]);
  });
  it('counts a protected technical noun as one noun', () => {
    expect(checkNounClusters(seg('Read the payment requirements object.'), ctx('procedure'))).toHaveLength(0);
  });
});

describe('vague modals', () => {
  it('flags should, would, may, might and could for review', () => {
    const f = checkVagueModals(seg('The server may return 402 and the client should retry.'), ctx('description'));
    expect(f.map((x) => x.severity)).toEqual(['review', 'review']);
  });
  it('does not flag must, can or will', () => {
    expect(checkVagueModals(seg('The client must sign. It can retry. It will stop.'), ctx('description'))).toHaveLength(0);
  });
});

describe('imperative start', () => {
  it('accepts imperatives, negative imperatives and condition-first steps', () => {
    for (const s of [
      'Send the request to the server.',
      'Do not sign the payment.',
      'If the server sends status 402, read the PAYMENT-REQUIRED header.',
      'Make sure that the amount is correct.',
      'Keep the transaction identifier.',
    ]) {
      expect(startsWithImperative(seg(s).protectedText), s).toBe(true);
    }
  });
  it('flags a step that starts with a subject', () => {
    expect(rules(checkImperativeStart(seg('The client sends the request.'), ctx('procedure')))).toEqual(['imperative-start']);
  });
  it('does not apply outside procedure steps', () => {
    expect(checkImperativeStart(seg('The client sends the request.'), ctx('description'))).toHaveLength(0);
    expect(checkImperativeStart(seg('The client sends the request.'), ctx('procedure', false))).toHaveLength(0);
  });
});

describe('checkSentence', () => {
  it('returns no flags for a clean procedural sentence', () => {
    expect(checkSentence(seg('Sign the payment with your key.'), ctx('procedure'))).toEqual([]);
  });
  it('handles an all-capitals caution sentence', () => {
    expect(
      checkSentence(
        seg('DO NOT SIGN A PAYMENT IF THE payTo ADDRESS IS NOT THE ADDRESS THAT YOU EXPECT.'),
        ctx('caution', false),
      ),
    ).toEqual([]);
  });
});
