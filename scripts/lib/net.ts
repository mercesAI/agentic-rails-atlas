/**
 * Network helpers shared by the data fetchers and the verify scripts. No astro:* imports.
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface JsonResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Headers;
  json: T | null;
  text: string;
}

/**
 * fetch with a timeout that returns a structured response instead of throwing
 * on HTTP errors. Network errors are converted into status 0.
 */
export async function fetchJson<T = unknown>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 20_000,
): Promise<JsonResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    if (!headers.has('user-agent')) headers.set('user-agent', 'agentic-rails-atlas-data (build-time fetcher)');
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    const text = await res.text();
    let json: T | null = null;
    try {
      json = text ? (JSON.parse(text) as T) : null;
    } catch {
      json = null;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, json, text };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: 0, ok: false, headers: new Headers(), json: null, text: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * System error code behind a failed fetch. Node reports it on the `cause`
 * (for example getaddrinfo ENOTFOUND); a connection refused on several
 * addresses arrives as an AggregateError. Undefined for aborts and timeouts.
 */
export function errorCode(err: unknown): string | undefined {
  const codeOf = (e: unknown): string | undefined => {
    const code = e && typeof e === 'object' ? (e as { code?: unknown }).code : undefined;
    return typeof code === 'string' ? code : undefined;
  };
  if (!err || typeof err !== 'object') return undefined;
  const cause = (err as { cause?: unknown }).cause;
  const direct = codeOf(cause) ?? codeOf(err);
  if (direct) return direct;
  const nested = cause && typeof cause === 'object' ? (cause as { errors?: unknown }).errors : undefined;
  if (Array.isArray(nested)) {
    for (const e of nested) {
      const code = codeOf(e);
      if (code) return code;
    }
  }
  return undefined;
}

export interface ProbeResult {
  status: number;
  headers: Headers;
  finalUrl: string;
  /** Message of the network error when status is 0. */
  error?: string;
  /** System error code of the network error (ENOTFOUND, ECONNREFUSED, ECONNRESET, ...) when known. */
  code?: string;
}

/**
 * One HEAD or GET request that follows redirects and discards the body, with a
 * timeout. Network errors become status 0 with the message and the error code
 * instead of an exception.
 */
export async function probe(
  url: string,
  init: { method?: 'HEAD' | 'GET'; headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 20_000);
  try {
    const res = await fetch(url, { method: init.method ?? 'GET', redirect: 'follow', signal: controller.signal, headers: init.headers ?? {} });
    await res.body?.cancel().catch(() => undefined);
    return { status: res.status, headers: res.headers, finalUrl: res.url };
  } catch (err) {
    const cause = err instanceof Error && 'cause' in err && err.cause instanceof Error ? `: ${err.cause.message}` : '';
    const code = errorCode(err);
    return {
      status: 0,
      headers: new Headers(),
      finalUrl: url,
      error: `${err instanceof Error ? err.message : String(err)}${cause}`,
      ...(code ? { code } : {}),
    };
  } finally {
    clearTimeout(timer);
  }
}
