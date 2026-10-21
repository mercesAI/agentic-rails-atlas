import { describe, expect, it } from 'vitest';
import { latestTagOf } from '../../../scripts/data/github';
import { githubMetaFromRecord } from '../../../src/components/protocol/lib/github-meta';

describe('GitHub snapshot: latest tag', () => {
  it('prefers the latest release over the first listed tag', () => {
    // The tags endpoint orders by name, so a hash-suffixed tag of an older commit can come first.
    const release = { tag: 'spec-artifacts-ecc5f5c' };
    expect(latestTagOf(release, 'spec-artifacts-fe0d414')).toBe('spec-artifacts-ecc5f5c');
  });
  it('falls back to the first listed tag without a release', () => {
    expect(latestTagOf(null, 'v1.2.0')).toBe('v1.2.0');
    expect(latestTagOf(null, null)).toBeNull();
  });
});

describe('GitHub snapshot: display fields', () => {
  const record = {
    repo: 'tempoxyz/mpp-specs',
    stars: 95,
    lastCommit: { sha: 'ecc5f5c', date: '2026-10-20T07:10:00Z' },
    latestRelease: { tag: 'spec-artifacts-ecc5f5c', name: 'Latest spec artifacts', publishedAt: '2026-10-20T07:11:00Z', url: 'https://github.com/x' },
    latestTag: 'spec-artifacts-ecc5f5c',
    fetchedAt: '2026-10-21T14:00:00.000Z',
  };
  it('returns the release tag, the snapshot date and the stars', () => {
    const meta = githubMetaFromRecord(record);
    expect(meta?.latestRelease).toBe('spec-artifacts-ecc5f5c');
    expect(meta?.fetchedAt).toBe('2026-10-21');
    expect(meta?.stars).toBe(95);
  });
  it('reads the last commit date when lastCommit is an object', () => {
    expect(githubMetaFromRecord(record)?.lastCommit).toBe('2026-10-20');
    expect(githubMetaFromRecord({ lastCommit: '2026-09-01T00:00:00Z' })?.lastCommit).toBe('2026-09-01');
  });
  it('keeps a tag-only record as a tag, not a release', () => {
    const meta = githubMetaFromRecord({ stars: 3, latestRelease: null, latestTag: 'v0.2.1', fetchedAt: '2026-10-21T14:00:00.000Z' });
    expect(meta?.latestRelease).toBeUndefined();
    expect(meta?.latestTag).toBe('v0.2.1');
  });
  it('ignores a missing or malformed snapshot date and a missing record', () => {
    expect(githubMetaFromRecord({ stars: 1 })?.fetchedAt).toBeUndefined();
    expect(githubMetaFromRecord({ stars: 1, fetchedAt: 'yesterday' })?.fetchedAt).toBeUndefined();
    expect(githubMetaFromRecord(undefined)).toBeNull();
  });
});
