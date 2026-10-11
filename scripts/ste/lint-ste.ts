/**
 * pnpm lint:ste [--protocol <slug>]
 *
 * Scans src/content/protocols/<slug>/ste.mdx, writes
 * src/generated/ste-report/<slug>.json, prints a summary, and exits non-zero
 * when a procedural sentence is over 20 words or a descriptive sentence is
 * over 25 words. Other error flags are reported but do not fail the build.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadApprovedWords } from '../../src/lib/ste/approved-words';
import { lintSteSource, type SteReport } from '../../src/lib/ste/lint';

const ROOT = process.env.STE_ROOT ? resolve(process.env.STE_ROOT) : resolve(import.meta.dirname, '..', '..');
const PROTOCOLS_DIR = join(ROOT, 'src', 'content', 'protocols');
const OUT_DIR = join(ROOT, 'src', 'generated', 'ste-report');

function parseArgs(argv: string[]): { protocol?: string } {
  const i = argv.indexOf('--protocol');
  if (i >= 0) {
    const slug = argv[i + 1];
    if (!slug || slug.startsWith('--')) {
      console.error('lint:ste: --protocol needs a slug, for example --protocol x402');
      process.exit(2);
    }
    return { protocol: slug };
  }
  const eq = argv.find((a) => a.startsWith('--protocol='));
  return eq ? { protocol: eq.slice('--protocol='.length) } : {};
}

function findFiles(only?: string): { slug: string; file: string }[] {
  if (!existsSync(PROTOCOLS_DIR)) return [];
  return readdirSync(PROTOCOLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && (!only || d.name === only))
    .map((d) => ({ slug: d.name, file: join(PROTOCOLS_DIR, d.name, 'ste.mdx') }))
    .filter((f) => existsSync(f.file))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function summary(r: SteReport): string {
  const status = r.lengthPassed ? (r.passed ? 'pass' : 'pass (length), errors to fix') : 'FAIL (length)';
  return [
    r.protocol.padEnd(14),
    String(r.sentences).padStart(5),
    String(r.maxProcedureWords).padStart(6),
    String(r.maxDescriptiveWords).padStart(6),
    String(r.counts.errors).padStart(6),
    String(r.counts.warnings).padStart(6),
    String(r.counts.reviews).padStart(6),
    `  ${status}`,
  ].join(' ');
}

function main(): void {
  const { protocol } = parseArgs(process.argv.slice(2));
  const files = findFiles(protocol);
  if (files.length === 0) {
    console.log(
      protocol
        ? `lint:ste: no ste.mdx found for "${protocol}". Nothing to check.`
        : 'lint:ste: no ste.mdx files exist yet under src/content/protocols/. Nothing to check.',
    );
    process.exit(0);
  }

  const approved = loadApprovedWords(ROOT);
  if (approved) console.log(`lint:ste: vocabulary check on (${approved.size} words in the local list).`);

  mkdirSync(OUT_DIR, { recursive: true });
  console.log(
    `${'protocol'.padEnd(14)} ${'sent'.padStart(5)} ${'maxP'.padStart(6)} ${'maxD'.padStart(6)} ${'err'.padStart(6)} ${'warn'.padStart(6)} ${'rev'.padStart(6)}`,
  );
  let failed = false;
  for (const { slug, file } of files) {
    const report = lintSteSource(readFileSync(file, 'utf8'), slug, { approved });
    writeFileSync(join(OUT_DIR, `${slug}.json`), `${JSON.stringify(report, null, 2)}\n`);
    console.log(summary(report));
    for (const f of report.flags.filter((x) => x.severity === 'error')) {
      console.log(`  ${f.severity} ${f.rule} [${f.blockType}] ${f.message}\n    "${f.text}"`);
    }
    if (!report.lengthPassed) failed = true;
  }
  console.log(`\n${files.length} file(s) checked. Reports in src/generated/ste-report/.`);
  if (failed) {
    console.error('lint:ste: a sentence is over its length limit (procedure 20, descriptive 25).');
    process.exit(1);
  }
}

main();
