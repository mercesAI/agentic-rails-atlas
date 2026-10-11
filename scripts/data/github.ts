/**
 * GitHub fetcher (ATLAS_PROMPT.md 11): stars, open issues, last push, last
 * commit, latest release or tag for every repository in scripts/data/repos.json.
 * Token: GITHUB_TOKEN, then `gh auth token`, then unauthenticated (fewer calls).
 * Never throws. A repository that fails keeps its previous snapshot record
 * (marked stale). Writes src/data/snapshots/github/<date>.json, a copy at
 * src/generated/github/latest.json and one src/generated/github/<owner>__<repo>.json each.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import {
  type FetchResult,
  ROOT,
  errorMessage,
  fetchJson,
  isMain,
  log,
  nowIso,
  readJsonFile,
  readLatestSnapshot,
  sleep,
  warn,
  writeSnapshot,
} from './lib.ts';

export interface RepoRecord {
  repo: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  archived: boolean;
  defaultBranch: string;
  pushedAt: string | null;
  lastCommit: { sha: string; date: string | null } | null;
  latestRelease: { tag: string; name: string | null; publishedAt: string | null; url: string } | null;
  latestTag: string | null;
  license: string | null;
  fetchedAt: string;
  stale?: boolean;
  error?: string;
}

export interface GithubSnapshot {
  fetchedAt: string;
  authenticated: boolean;
  repos: Record<string, RepoRecord>;
}

function token(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const t = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).trim();
    return t || undefined;
  } catch {
    return undefined;
  }
}

export async function fetchGithub(): Promise<FetchResult<GithubSnapshot>> {
  const started = Date.now();
  try {
    const repos = readJsonFile<string[]>(join(ROOT, 'scripts', 'data', 'repos.json')) ?? [];
    const tok = token();
    const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
    if (tok) headers.authorization = `Bearer ${tok}`;
    const previous = readLatestSnapshot<GithubSnapshot>('github')?.data;
    const out: Record<string, RepoRecord> = {};
    const warnings: string[] = [];
    let fresh = 0;
    const api = <T>(path: string) => fetchJson<T>(`https://api.github.com${path}`, { headers });

    for (const full of repos) {
      try {
        const r = await api<{
          html_url: string;
          description: string | null;
          stargazers_count: number;
          forks_count: number;
          open_issues_count: number;
          archived: boolean;
          default_branch: string;
          pushed_at: string | null;
          license: { spdx_id?: string } | null;
        }>(`/repos/${full}`);
        if (!r.ok || !r.json) {
          const remaining = r.headers.get('x-ratelimit-remaining');
          throw new Error(`HTTP ${r.status}${remaining === '0' ? ' (rate limited)' : ''}`);
        }
        const repo = r.json;
        let latestRelease: RepoRecord['latestRelease'] = null;
        let latestTag: string | null = null;
        let lastCommit: RepoRecord['lastCommit'] = null;
        const rel = await api<{ tag_name: string; name: string | null; published_at: string | null; html_url: string }>(`/repos/${full}/releases/latest`);
        if (rel.ok && rel.json) latestRelease = { tag: rel.json.tag_name, name: rel.json.name, publishedAt: rel.json.published_at, url: rel.json.html_url };
        if (tok || !latestRelease) {
          const tags = await api<{ name: string }[]>(`/repos/${full}/tags?per_page=1`);
          if (tags.ok && Array.isArray(tags.json)) latestTag = tags.json[0]?.name ?? null;
        }
        if (tok) {
          const commits = await api<{ sha: string; commit: { committer: { date: string } | null } }[]>(`/repos/${full}/commits?per_page=1`);
          const c = Array.isArray(commits.json) ? commits.json[0] : undefined;
          if (commits.ok && c) lastCommit = { sha: c.sha, date: c.commit.committer?.date ?? null };
        }
        out[full] = {
          repo: full,
          url: repo.html_url,
          description: repo.description,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          archived: repo.archived,
          defaultBranch: repo.default_branch,
          pushedAt: repo.pushed_at,
          lastCommit,
          latestRelease,
          latestTag: latestTag ?? latestRelease?.tag ?? null,
          license: repo.license?.spdx_id ?? null,
          fetchedAt: nowIso(),
        };
        fresh++;
      } catch (err) {
        const prev = previous?.repos[full];
        const msg = `${full}: ${errorMessage(err)}${prev ? '; kept previous record' : ''}`;
        warnings.push(msg);
        warn('github', msg);
        if (prev) out[full] = { ...prev, stale: true, error: errorMessage(err) };
      }
      await sleep(tok ? 100 : 750);
    }
    if (!fresh) return { ok: false, source: 'github', error: 'no repository could be fetched; previous snapshot kept', warnings, durationMs: Date.now() - started };
    const data: GithubSnapshot = { fetchedAt: nowIso(), authenticated: !!tok, repos: out };
    const extras = Object.fromEntries(Object.entries(out).map(([k, v]) => [`${k.replace('/', '__')}.json`, v]));
    const snapshotPath = writeSnapshot('github', data, extras);
    log('github', `${fresh} of ${repos.length} repositories fetched${tok ? ' (authenticated)' : ' (unauthenticated)'}`);
    return { ok: true, source: 'github', data, warnings, snapshotPath, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, source: 'github', error: errorMessage(err), durationMs: Date.now() - started };
  }
}

if (isMain(import.meta.url)) {
  void fetchGithub().then((r) => {
    if (!r.ok) warn('github', r.error ?? 'failed');
  });
}
