// Validate a protocol's research JSON files against the site schemas.
// Usage: pnpm tsx research/validate.ts <slug>
import fs from 'node:fs';
import { ClaimsFile, Source } from '../src/lib/schemas';

const slug = process.argv[2];
if (!slug) { console.error('usage: pnpm tsx research/validate.ts <slug>'); process.exit(2); }
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const claims = ClaimsFile.parse(read(`research/protocols/${slug}.claims.json`));
const sources = Source.array().parse(read(`research/protocols/${slug}.sources.json`));
const ids = new Set(sources.map((s) => s.id));
const missing = [...new Set(claims.claims.flatMap((c) => c.sources).filter((id) => !ids.has(id)))];
const dupes = claims.claims.map((c) => c.id).filter((id, i, a) => a.indexOf(id) !== i);
const em = claims.claims.filter((c) => c.text.includes('—')).map((c) => c.id);
const byConf = claims.claims.reduce<Record<string, number>>((m, c) => ((m[c.confidence] = (m[c.confidence] ?? 0) + 1), m), {});
console.log(`${slug}: ${sources.length} sources, ${claims.claims.length} claims`, byConf);
if (missing.length || dupes.length || em.length) {
  console.error({ missingSourceIds: missing, duplicateClaimIds: dupes, emDashClaims: em });
  process.exit(1);
}
console.log('ok');
