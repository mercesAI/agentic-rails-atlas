import { describe, expect, it } from 'vitest';
import { recentEvents, repoActivity, windowStart } from '../../../src/components/hub/lib/whats-new';

describe("what's new", () => {
  it('starts the 90-day window on 2026-07-13 for a 2026-10-11 build', () => {
    expect(windowStart('2026-10-11')).toBe('2026-07-13');
  });

  it('summarizes repo snapshots newest first and skips non-repo files', () => {
    const rows = repoActivity(
      [
        { repo: 'a/old', url: 'https://github.com/a/old', lastCommit: { sha: 'abcdef123', date: '2026-01-02T00:00:00Z' }, latestRelease: null },
        {
          repo: 'b/new',
          url: 'https://github.com/b/new',
          lastCommit: { sha: '1234567890', date: '2026-10-01T00:00:00Z' },
          latestRelease: { tag: 'v1', publishedAt: '2026-08-01T00:00:00Z', url: 'https://github.com/b/new/releases/tag/v1' },
        },
        { fetchedAt: 'x', repos: {} },
      ],
      '2026-07-13',
    );
    expect(rows.map((r) => r.repo)).toEqual(['b/new', 'a/old']);
    expect(rows[0]?.recent).toBe(true);
    expect(rows[0]?.release?.recent).toBe(true);
    expect(rows[0]?.commit?.sha).toBe('1234567');
    expect(rows[1]?.recent).toBe(false);
    expect(rows[1]?.release).toBeNull();
  });

  it('splits events into the recent window and upcoming', () => {
    const { recent, upcoming } = recentEvents(
      [{ date: '2026-07-12' }, { date: '2026-07-13' }, { date: '2026-10-11' }, { date: '2027-01-18' }],
      '2026-07-13',
      '2026-10-11',
    );
    expect(recent.map((e) => e.date)).toEqual(['2026-10-11', '2026-07-13']);
    expect(upcoming.map((e) => e.date)).toEqual(['2027-01-18']);
  });
});
