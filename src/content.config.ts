import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import {
  ProtocolMeta,
  ClaimsFile,
  FactsFile,
  PersonasFile,
  ResourcesFile,
  SecurityFile,
  ControlsFile,
  ComplianceFile,
  ObservabilityFile,
  EcosystemFile,
  TimelineFile,
  FaqFile,
  OpenQuestionsFile,
  QuizFile,
  FlashcardsFile,
  CodeFile,
  Flow,
  StateMachine,
  DiagramMeta,
  Persona,
  Source,
  Publication,
  GlossaryTerm,
  Relation,
  CompareFile,
  ControlsMapFile,
  TimelineEvent,
  ScenarioMeta,
  OrbitMeta,
} from './lib/schemas';
import { z } from 'zod';

const PROTOCOLS_BASE = './src/content/protocols';

/** One collection per per-protocol sidecar file. Entry ids are "<slug>/<file>". */
const sidecar = <T extends z.ZodType>(name: string, schema: T) =>
  defineCollection({ loader: glob({ base: PROTOCOLS_BASE, pattern: `*/${name}.json` }), schema });

/** STE pages: a frontmatter object with the protocol slug; body is MDX. */
const SteMeta = z.object({
  protocol: ProtocolMeta.shape.slug,
  title: z.string(),
  lastVerified: z.string(),
});

export const collections = {
  protocols: defineCollection({ loader: glob({ base: PROTOCOLS_BASE, pattern: '*/index.mdx' }), schema: ProtocolMeta }),
  ste: defineCollection({ loader: glob({ base: PROTOCOLS_BASE, pattern: '*/ste.mdx' }), schema: SteMeta }),
  claims: sidecar('claims', ClaimsFile),
  facts: sidecar('facts', FactsFile),
  protocolPersonas: sidecar('personas', PersonasFile),
  resources: sidecar('resources', ResourcesFile),
  security: sidecar('security', SecurityFile),
  controls: sidecar('controls', ControlsFile),
  compliance: sidecar('compliance', ComplianceFile),
  observability: sidecar('observability', ObservabilityFile),
  ecosystem: sidecar('ecosystem', EcosystemFile),
  timeline: sidecar('timeline', TimelineFile),
  faq: sidecar('faq', FaqFile),
  openQuestions: sidecar('open-questions', OpenQuestionsFile),
  quiz: sidecar('quiz', QuizFile),
  flashcards: sidecar('flashcards', FlashcardsFile),
  code: sidecar('code', CodeFile),

  flows: defineCollection({ loader: glob({ base: './src/content/flows', pattern: '*.json' }), schema: Flow }),
  states: defineCollection({ loader: glob({ base: './src/content/states', pattern: '*.json' }), schema: StateMachine }),
  diagrams: defineCollection({ loader: glob({ base: './src/content/diagrams', pattern: '*.json' }), schema: DiagramMeta }),

  personas: defineCollection({ loader: glob({ base: './src/content/personas', pattern: '*.json' }), schema: Persona }),
  scenarios: defineCollection({ loader: glob({ base: './src/content/scenarios', pattern: '*.mdx' }), schema: ScenarioMeta }),
  orbit: defineCollection({ loader: glob({ base: './src/content/orbit', pattern: '*.mdx' }), schema: OrbitMeta }),

  sources: defineCollection({ loader: file('./src/content/sources/sources.json'), schema: Source }),
  publications: defineCollection({ loader: file('./src/content/publications/publications.json'), schema: Publication }),
  glossary: defineCollection({ loader: file('./src/content/glossary/terms.json'), schema: GlossaryTerm }),
  relations: defineCollection({
    loader: file('./src/content/relations.json', {
      parser: (text) => (JSON.parse(text) as Relation[]).map((r, i) => ({ id: `${r.from}--${r.type}--${r.to}--${i}`, ...r })),
    }),
    schema: Relation,
  }),
  timelineGlobal: defineCollection({
    loader: file('./src/content/timeline-global.json', {
      parser: (text) => (JSON.parse(text) as TimelineEvent[]).map((e, i) => ({ id: `${e.date}-${e.lane}-${i}`, ...e })),
    }),
    schema: TimelineEvent,
  }),
  compare: defineCollection({
    loader: file('./src/content/compare.json', { parser: (text) => [{ id: 'compare', ...JSON.parse(text) }] }),
    schema: CompareFile,
  }),
  controlsMap: defineCollection({
    loader: file('./src/content/controls-map.json', { parser: (text) => [{ id: 'controls-map', ...JSON.parse(text) }] }),
    schema: ControlsMapFile,
  }),
};
