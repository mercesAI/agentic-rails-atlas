/**
 * Display fields of one GitHub snapshot record (src/generated/github/<owner>__<repo>.json,
 * written by scripts/data/github.ts). Pure, so it can be unit tested without astro:content.
 * Shape tolerant: older snapshots and hand-made records use several key spellings.
 */
export interface GithubMeta {
  stars?: number;
  lastCommit?: string;
  /** Tag of the latest GitHub release, when the repository has one. */
  latestRelease?: string;
  latestTag?: string;
  /** Snapshot date (YYYY-MM-DD) from the record's `fetchedAt`. */
  fetchedAt?: string;
}

export function githubMetaFromRecord(file: unknown): GithubMeta | null {
  if (!file || typeof file !== 'object') return null;
  const r = file as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = k.split('.').reduce<unknown>((o, p) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[p] : undefined), r);
      // Only scalars count: a key such as `lastCommit` may hold an object ({ sha, date }), and the
      // nested path listed after it ('lastCommit.date') must get its turn.
      if ((typeof v === 'string' && v !== '') || typeof v === 'number') return v;
    }
    return undefined;
  };
  const stars = pick('stars', 'stargazers_count', 'stargazerCount', 'repo.stargazers_count');
  const lastCommit = pick('lastCommit', 'lastCommitDate', 'pushed_at', 'pushedAt', 'lastCommit.date', 'repo.pushed_at');
  const latestRelease = pick('latestRelease.tag', 'latestRelease.tag_name', 'release.tag_name');
  const latestTag = pick('latestTag', 'latestRelease');
  const fetchedAt = pick('fetchedAt');
  return {
    stars: typeof stars === 'number' ? stars : undefined,
    lastCommit: typeof lastCommit === 'string' ? lastCommit.slice(0, 10) : undefined,
    latestRelease: typeof latestRelease === 'string' ? latestRelease : undefined,
    latestTag: typeof latestTag === 'string' ? latestTag : undefined,
    fetchedAt: typeof fetchedAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fetchedAt) ? fetchedAt.slice(0, 10) : undefined,
  };
}
