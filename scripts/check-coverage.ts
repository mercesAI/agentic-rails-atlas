/**
 * check-coverage.ts (ARCHITECTURE.md §9, ATLAS_PROMPT.md 14.2, ATLAS_FOLLOWUP.md 3.6).
 * Applies the per-protocol coverage thresholds, reads coverage-waivers.json,
 * prints a table, writes src/generated/coverage.json and exits non-zero on
 * unwaived failures.
 *
 * Flags:
 *   --protocol <slug>  check one protocol (other entries in coverage.json are kept)
 *   --allow-empty      missing protocol folders do not fail the run
 *   --json             print the JSON report instead of the table
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ClaimsFile, CoverageWaiversFile, PROTOCOL_SLUGS, type ProtocolSlug } from '../src/lib/schemas.ts';
import { ROOT, isMain, listDir, parseArgs, readJson, rel, today, writeJsonIfChanged } from './lib/io.ts';
import {
  PAGE_SIDECAR_NAMES,
  citeIds,
  countWords,
  findModeBlocks,
  loadGlobal,
  loadJson,
  loadProtocol,
  mdxToPlainText,
  outsideModeBlocks,
  type GlobalContent,
} from './lib/content.ts';
import { protocolName } from './lib/protocols.ts';

export const THRESHOLDS = {
  practitionerWords: 2000,
  eli5Min: 200,
  eli5Max: 350,
  diagrams: 6,
  resources: 12,
  publications: 8,
  personas: 4,
  threats: 8,
  faq: 8,
  openQuestions: 6,
  quiz: 10,
  flashcards: 15,
  glossary: 10,
  timeline: 8,
} as const;

export const REQUIRED_DIAGRAM_TYPES = ['context', 'sequence', 'failure-sequence', 'state', 'data-model', 'composition'] as const;

export interface CheckResult {
  id: string;
  label: string;
  actual: string | number;
  expected: string;
  pass: boolean;
  waived?: boolean;
  waiverReason?: string;
  detail?: string;
}

export interface ProtocolCoverage {
  slug: string;
  name: string;
  status: 'pass' | 'fail' | 'missing';
  checks: CheckResult[];
  claims: number;
  unverifiedClaims: number;
  reportedClaims: number;
}

export interface CoverageReport {
  generatedAt: string;
  thresholds: typeof THRESHOLDS;
  protocols: ProtocolCoverage[];
  summary: { pass: number; fail: number; missing: number };
}

function checkProtocol(root: string, slug: ProtocolSlug, g: GlobalContent, allClaimIds: Set<string>): ProtocolCoverage {
  const content = join(root, 'src', 'content');
  const b = loadProtocol(content, slug);
  const name = b.index.data?.name ?? protocolName(content, slug);
  const checks: CheckResult[] = [];
  const add = (id: string, label: string, actual: string | number, expected: string, pass: boolean, detail?: string): void => {
    checks.push({ id, label, actual, expected, pass, ...(detail ? { detail } : {}) });
  };
  const atLeast = (id: string, label: string, n: number, min: number): void => add(id, label, n, `>= ${min}`, n >= min);
  const exactly = (id: string, label: string, n: number, want: number): void => add(id, label, n, `= ${want}`, n === want);

  if (!b.exists) {
    add('folder', 'Protocol folder', 'missing', 'present', false, `src/content/protocols/${slug}/ has no files`);
    return { slug, name, status: 'missing', checks, claims: 0, unverifiedClaims: 0, reportedClaims: 0 };
  }

  // Sections A to T: the MDX files and every sidecar exist and parse.
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const f of [b.index, b.ste]) {
    if (!f.exists) missing.push(rel(b.dir, f.path));
    else if (f.error) invalid.push(`${rel(b.dir, f.path)} (${f.error})`);
  }
  for (const n of PAGE_SIDECAR_NAMES) {
    const l = b.sidecars[n];
    if (!l.exists) missing.push(`${n}.json`);
    else if (l.error) invalid.push(`${n}.json (${l.error})`);
  }
  add(
    'sections',
    'Sections A to T (MDX and sidecars)',
    missing.length + invalid.length ? `${missing.length} missing, ${invalid.length} invalid` : 'all present',
    'all present',
    !missing.length && !invalid.length,
    [missing.length ? `missing: ${missing.join(', ')}` : '', invalid.length ? `invalid: ${invalid.join('; ')}` : ''].filter(Boolean).join(' | ') || undefined,
  );

  // Section B text.
  const body = b.index.body;
  atLeast('practitioner-words', 'Practitioner words (outside Mode blocks)', countWords(mdxToPlainText(outsideModeBlocks(body))), THRESHOLDS.practitionerWords);
  const blocks = findModeBlocks(body);
  const eli5 = blocks.filter((m) => m.modes.includes('eli5')).reduce((n, m) => n + countWords(mdxToPlainText(m.inner)), 0);
  add('eli5-words', 'ELI5 words', eli5, `${THRESHOLDS.eli5Min} to ${THRESHOLDS.eli5Max}`, eli5 >= THRESHOLDS.eli5Min && eli5 <= THRESHOLDS.eli5Max);
  const specBlocks = blocks.filter((m) => m.modes.includes('spec'));
  const specWithTable = specBlocks.filter((m) => /<FieldTable\b/.test(m.inner)).length;
  add('spec-tables', 'Spec-deep blocks with a FieldTable', specWithTable, '>= 1', specWithTable >= 1, `${specBlocks.length} spec blocks`);

  // Section C diagrams.
  const meta = b.index.data;
  const flowIds = new Map(g.flows.filter((f) => f.data).map((f) => [f.data!.id, f.data!]));
  const stateIds = new Set(g.states.filter((s) => s.data).map((s) => s.data!.id));
  const diagramMeta = new Map(g.diagrams.filter((d) => d.data).map((d) => [d.data!.id, d.data!]));
  const types = new Set<string>();
  const unresolved: string[] = [];
  let diagramCount = 0;
  if (meta) {
    if (flowIds.has(meta.mainFlow)) {
      diagramCount++;
      types.add('sequence');
    } else unresolved.push(`mainFlow ${meta.mainFlow}`);
    if (stateIds.has(meta.stateMachine)) {
      diagramCount++;
      types.add('state');
    } else unresolved.push(`stateMachine ${meta.stateMachine}`);
    for (const id of new Set(meta.diagrams)) {
      if (id === meta.mainFlow || id === meta.stateMachine) continue;
      const dm = diagramMeta.get(id);
      if (dm) {
        diagramCount++;
        types.add(dm.type);
      } else if (flowIds.has(id)) {
        diagramCount++;
        types.add('failure-sequence');
      } else if (stateIds.has(id)) {
        diagramCount++;
        types.add('state');
      } else unresolved.push(id);
    }
  }
  atLeast('diagrams', 'Diagrams (main flow, state machine, meta.diagrams)', diagramCount, THRESHOLDS.diagrams);
  const missingTypes = REQUIRED_DIAGRAM_TYPES.filter((t) => !types.has(t));
  add('diagram-types', 'Required diagram types', missingTypes.length ? `missing ${missingTypes.join(', ')}` : 'all', REQUIRED_DIAGRAM_TYPES.join(', '), !missingTypes.length);
  const tb = b.sidecars.security.data?.trustBoundaryDiagram;
  if (tb && !diagramMeta.has(tb) && !flowIds.has(tb) && !stateIds.has(tb)) unresolved.push(`trustBoundaryDiagram ${tb}`);
  add('diagram-refs', 'Diagram references resolve', unresolved.length, '= 0', unresolved.length === 0, unresolved.length ? unresolved.join(', ') : undefined);

  // Counts from sidecars and shared files.
  atLeast('resources', 'Resources', b.sidecars.resources.data?.resources.length ?? 0, THRESHOLDS.resources);
  atLeast('publications', 'Verified publications tagged', (g.publications.data ?? []).filter((p) => p.protocols.includes(slug)).length, THRESHOLDS.publications);
  atLeast('personas', 'Personas', b.sidecars.personas.data?.personas.length ?? 0, THRESHOLDS.personas);
  atLeast('threats', 'STRIDE threats', b.sidecars.security.data?.threats.length ?? 0, THRESHOLDS.threats);
  atLeast('faq', 'FAQ items', b.sidecars.faq.data?.items.length ?? 0, THRESHOLDS.faq);
  atLeast('open-questions', 'Open questions', b.sidecars['open-questions'].data?.items.length ?? 0, THRESHOLDS.openQuestions);
  exactly('quiz', 'Quiz questions', b.sidecars.quiz.data?.questions.length ?? 0, THRESHOLDS.quiz);
  exactly('flashcards', 'Flashcards', b.sidecars.flashcards.data?.cards.length ?? 0, THRESHOLDS.flashcards);
  // ATLAS_FOLLOWUP.md 3.6: only fully written terms count (no stubs).
  const glossary = (g.glossary.data ?? []).filter(
    (t) => !t.stub && t.protocols.includes(slug) && t.plain.trim() && t.ste.trim() && t.sources.length > 0,
  ).length;
  atLeast('glossary', 'Glossary terms (full, linked to this protocol)', glossary, THRESHOLDS.glossary);
  atLeast('timeline', 'Timeline events', b.sidecars.timeline.data?.events.length ?? 0, THRESHOLDS.timeline);

  // Compare matrix: a cell per dimension ("not published" with a source counts as filled).
  const dims = g.compare.data?.dimensions.map((d) => d.id) ?? [];
  const cells = new Set((g.compare.data?.cells ?? []).filter((c) => c.protocol === slug && c.value.trim()).map((c) => c.dimension));
  const missingDims = dims.filter((d) => !cells.has(d));
  add('compare-cells', 'Compare matrix cells', `${dims.length - missingDims.length} of ${dims.length}`, `${dims.length} of ${dims.length}`, dims.length > 0 && !missingDims.length);
  const controlCells = new Set((g.controlsMap.data?.cells ?? []).filter((c) => c.protocol === slug).map((c) => c.control));
  const controlTotal = g.controlsMap.data?.controls.length ?? 0;
  add('controls-cells', 'Controls map cells', `${controlCells.size} of ${controlTotal}`, `${controlTotal} of ${controlTotal}`, controlTotal > 0 && controlCells.size >= controlTotal);

  // Playground (section O): a ready playground has its component.
  if (meta?.playground.status === 'ready') {
    const has = existsSync(join(root, 'src', 'playgrounds', slug, 'Playground.tsx'));
    add('playground', 'Playground component', has ? 'present' : 'missing', 'present when ready', has);
  }

  // Claims.
  const claims = b.sidecars.claims.data?.claims ?? [];
  const unsourced = claims.filter((c) => c.sources.length === 0).map((c) => c.id);
  add('claims-sourced', 'Claims with sources', `${claims.length - unsourced.length} of ${claims.length}`, '100%', claims.length > 0 && unsourced.length === 0);
  const refs = new Set<string>();
  for (const k of meta?.keyFacts ?? []) k.claimIds.forEach((id) => refs.add(id));
  const facts = b.sidecars.facts.data;
  for (const x of [...(facts?.whatItIsNot ?? []), ...(facts?.changedRecently ?? [])]) x.claimIds.forEach((id) => refs.add(id));
  for (const x of b.sidecars.faq.data?.items ?? []) x.claimIds.forEach((id) => refs.add(id));
  for (const x of b.sidecars.quiz.data?.questions ?? []) x.claimIds.forEach((id) => refs.add(id));
  for (const x of b.sidecars.flashcards.data?.cards ?? []) x.claimIds.forEach((id) => refs.add(id));
  for (const id of [...citeIds(b.index.body), ...citeIds(b.ste.body)]) if (id.startsWith('clm-')) refs.add(id);
  const dangling = [...refs].filter((id) => !allClaimIds.has(id)).sort();
  add('claim-refs', 'Referenced claim ids exist', dangling.length, '= 0', dangling.length === 0, dangling.length ? dangling.slice(0, 20).join(', ') : undefined);
  const unverified = claims.filter((c) => c.confidence === 'unverified').length;
  const reported = claims.filter((c) => c.confidence === 'reported').length;

  return { slug, name, status: checks.every((c) => c.pass) ? 'pass' : 'fail', checks, claims: claims.length, unverifiedClaims: unverified, reportedClaims: reported };
}

export interface CoverageOptions {
  root?: string;
  protocol?: string;
  allowEmpty?: boolean;
}

export function runCoverage(options: CoverageOptions = {}): { report: CoverageReport; failing: string[]; errors: string[] } {
  const root = options.root ?? ROOT;
  const content = join(root, 'src', 'content');
  const errors: string[] = [];
  if (options.protocol && !(PROTOCOL_SLUGS as readonly string[]).includes(options.protocol)) {
    errors.push(`unknown protocol "${options.protocol}" (expected one of ${PROTOCOL_SLUGS.join(', ')})`);
  }
  const waiversFile = loadJson(join(root, 'coverage-waivers.json'), CoverageWaiversFile);
  if (waiversFile.error) errors.push(`coverage-waivers.json: ${waiversFile.error}`);
  const waivers = waiversFile.data?.waivers ?? [];

  const g = loadGlobal(content);
  const allClaimIds = new Set<string>();
  for (const slug of PROTOCOL_SLUGS) for (const c of loadProtocol(content, slug).sidecars.claims.data?.claims ?? []) allClaimIds.add(c.id);
  for (const f of listDir(join(content, 'scenarios')).filter((f) => f.endsWith('.claims.json'))) {
    for (const c of loadJson(join(content, 'scenarios', f), ClaimsFile).data?.claims ?? []) allClaimIds.add(c.id);
  }

  const slugs = (options.protocol ? [options.protocol] : [...PROTOCOL_SLUGS]) as ProtocolSlug[];
  const results = errors.length ? [] : slugs.map((s) => checkProtocol(root, s, g, allClaimIds));
  const failing: string[] = [];
  for (const r of results) {
    for (const c of r.checks) {
      const w = waivers.find((w) => w.protocol === r.slug && (w.check === c.id || w.check === '*'));
      if (!c.pass && w) {
        c.waived = true;
        c.waiverReason = w.reason;
      }
    }
    const unwaived = r.checks.filter((c) => !c.pass && !c.waived);
    if (r.status === 'missing') {
      if (!options.allowEmpty && unwaived.length) failing.push(`${r.slug}: folder missing`);
    } else {
      r.status = unwaived.length ? 'fail' : 'pass';
      for (const c of unwaived) failing.push(`${r.slug}: ${c.id} (${c.actual}, expected ${c.expected})`);
    }
  }

  // Keep entries of other protocols when --protocol limits the run.
  const outPath = join(root, 'src', 'generated', 'coverage.json');
  let prev: CoverageReport | undefined;
  try {
    prev = readJson<CoverageReport>(outPath);
  } catch {
    prev = undefined;
  }
  const byslug = new Map((prev?.protocols ?? []).map((p) => [p.slug, p]));
  for (const r of results) byslug.set(r.slug, r);
  const protocols = options.protocol ? PROTOCOL_SLUGS.map((s) => byslug.get(s)).filter((p): p is ProtocolCoverage => !!p) : results;
  const summary = {
    pass: protocols.filter((p) => p.status === 'pass').length,
    fail: protocols.filter((p) => p.status === 'fail').length,
    missing: protocols.filter((p) => p.status === 'missing').length,
  };
  const body = { thresholds: THRESHOLDS, protocols, summary };
  const sameAsPrev = prev && JSON.stringify({ thresholds: prev.thresholds, protocols: prev.protocols, summary: prev.summary }) === JSON.stringify(body);
  const report: CoverageReport = { generatedAt: sameAsPrev && prev ? prev.generatedAt : today(), ...body };
  if (!errors.length) writeJsonIfChanged(outPath, report);
  return { report, failing, errors };
}

function printTable(report: CoverageReport, only?: string): void {
  const rows = report.protocols.filter((p) => !only || p.slug === only);
  for (const p of rows) {
    console.log(`\n${p.name} (${p.slug}): ${p.status.toUpperCase()}${p.claims ? `; claims ${p.claims}, reported ${p.reportedClaims}, unverified ${p.unverifiedClaims}` : ''}`);
    const w1 = Math.max(...p.checks.map((c) => c.label.length));
    const w2 = Math.max(...p.checks.map((c) => String(c.actual).length));
    for (const c of p.checks) {
      const mark = c.pass ? 'ok  ' : c.waived ? 'WAIV' : 'FAIL';
      const extra = c.waived ? `  waived: ${c.waiverReason}` : c.detail && !c.pass ? `  ${c.detail}` : '';
      console.log(`  ${mark} ${c.label.padEnd(w1)}  ${String(c.actual).padEnd(w2)}  expected ${c.expected}${extra}`);
    }
  }
  console.log(`\ncoverage: ${report.summary.pass} pass, ${report.summary.fail} fail, ${report.summary.missing} missing`);
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const only = args.values.get('protocol');
  const { report, failing, errors } = runCoverage({ root: args.values.get('root') ?? ROOT, protocol: only, allowEmpty: args.flags.has('allow-empty') });
  for (const e of errors) console.error(`error: ${e}`);
  if (errors.length) process.exit(1);
  if (args.flags.has('json')) console.log(JSON.stringify(report, null, 2));
  else printTable(report, only);
  if (failing.length) {
    console.error(`\n${failing.length} unwaived coverage failure(s):`);
    for (const f of failing.slice(0, 60)) console.error(`  ${f}`);
    if (failing.length > 60) console.error(`  ... and ${failing.length - 60} more`);
    process.exit(1);
  }
  console.log('coverage: all checks pass or are waived');
}
