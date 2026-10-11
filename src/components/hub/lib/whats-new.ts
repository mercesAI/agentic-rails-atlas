/**
 * What's new (pure, unit tested): spec repository snapshots from
 * src/generated/github/*.json and timeline events inside the 90-day window.
 */
import { shiftDays } from './dates';

export const WINDOW_DAYS = 90;

export interface RepoSnapshot {
  repo: string;
  url: string;
  description?: string | null;
  stars?: number;
  archived?: boolean;
  pushedAt?: string | null;
  lastCommit?: { sha: string; date: string } | null;
  latestRelease?: { tag: string; name?: string | null; publishedAt: string; url: string } | null;
  latestTag?: string | null;
  fetchedAt?: string;
}

export interface RepoActivity {
  repo: string;
  url: string;
  description: string;
  archived: boolean;
  release: { tag: string; date: string; url: string; recent: boolean } | null;
  commit: { sha: string; date: string; recent: boolean } | null;
  /** Latest of release and commit dates (YYYY-MM-DD), or ''. */
  latest: string;
  recent: boolean;
  fetchedAt: string;
}

/** First day of the window that ends on `buildDate`. */
export function windowStart(buildDate: string, days = WINDOW_DAYS): string {
  return shiftDays(buildDate, days);
}

const day = (iso?: string | null): string => (iso ? iso.slice(0, 10) : '');

export function isRepoSnapshot(v: unknown): v is RepoSnapshot {
  return Boolean(v && typeof v === 'object' && typeof (v as RepoSnapshot).repo === 'string' && typeof (v as RepoSnapshot).url === 'string');
}

/** Repo activity sorted newest first; snapshots that are not repo records are skipped. */
export function repoActivity(snapshots: unknown[], since: string): RepoActivity[] {
  return snapshots
    .filter(isRepoSnapshot)
    .map((s) => {
      const rDate = day(s.latestRelease?.publishedAt);
      const cDate = day(s.lastCommit?.date);
      const release = s.latestRelease && rDate ? { tag: s.latestRelease.tag, date: rDate, url: s.latestRelease.url, recent: rDate >= since } : null;
      const commit = s.lastCommit && cDate ? { sha: s.lastCommit.sha.slice(0, 7), date: cDate, recent: cDate >= since } : null;
      const latest = [rDate, cDate].sort().at(-1) ?? '';
      return {
        repo: s.repo,
        url: s.url,
        description: s.description ?? '',
        archived: Boolean(s.archived),
        release,
        commit,
        latest,
        recent: latest >= since && latest !== '',
        fetchedAt: day(s.fetchedAt),
      };
    })
    .sort((a, b) => b.latest.localeCompare(a.latest) || a.repo.localeCompare(b.repo));
}

/** Events dated inside [since, until], newest first; later-dated events are returned separately as upcoming. */
export function recentEvents<T extends { date: string }>(events: T[], since: string, until: string): { recent: T[]; upcoming: T[] } {
  const recent = events.filter((e) => e.date >= since && e.date <= until).sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = events.filter((e) => e.date > until).sort((a, b) => a.date.localeCompare(b.date));
  return { recent, upcoming };
}
