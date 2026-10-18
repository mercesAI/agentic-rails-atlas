import { describe, expect, it } from 'vitest';
import { modeBannerText, modeToastText, modeTarget, syncFromStorageEvent } from '../../../src/lib/reading-mode';

describe('reading mode helpers', () => {
  it('describes each mode in the banner', () => {
    expect(modeBannerText('eli5', 3)).toBe('plain-language version only');
    expect(modeBannerText('practitioner', 3)).toBe('the full explanation');
    expect(modeBannerText('spec', 4)).toBe('the full explanation plus 4 spec-deep blocks of field tables and wire examples');
    expect(modeBannerText('spec', 1)).toBe('the full explanation plus 1 spec-deep block of field tables and wire examples');
    expect(modeBannerText('ste', 4)).toContain('section D');
  });
  it('points STE at section D and the rest at section B', () => {
    expect(modeTarget('ste')).toEqual({ id: 'd-ste', letter: 'D' });
    expect(modeTarget('spec')).toEqual({ id: 'b-explanation', letter: 'B' });
    expect(modeToastText('spec')).toBe('Spec-deep applied to section B');
    expect(modeToastText('ste')).toBe('STE applied to section D');
  });
  it('applies a mode from a storage event and ignores unrelated ones', () => {
    const root = { dataset: {} } as unknown as HTMLElement;
    expect(syncFromStorageEvent({ key: 'atlas:reading-mode', newValue: 'eli5' }, root)).toBe('eli5');
    expect(root.dataset.readingMode).toBe('eli5');
    expect(syncFromStorageEvent({ key: 'other', newValue: 'ste' }, root)).toBeNull();
    expect(syncFromStorageEvent({ key: 'atlas:reading-mode', newValue: 'bogus' }, root)).toBeNull();
    expect(root.dataset.readingMode).toBe('eli5');
  });
});
