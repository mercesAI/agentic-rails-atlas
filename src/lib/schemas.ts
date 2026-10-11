/**
 * Content schemas for the Agentic Rails Atlas.
 * Mirrors ATLAS_PROMPT.md Section 12.3, with the per-protocol sidecar files
 * (facts, claims, personas, resources, security, controls, compliance,
 * observability, ecosystem, timeline, code, faq, open questions, quiz,
 * flashcards) spelled out so every content file is validated at build time.
 *
 * One Zod instance (zod 4.x, the same version Astro 7 depends on) is used by
 * Astro content collections and by the scripts under scripts/.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives and enums
// ---------------------------------------------------------------------------

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isoDate = z.string().regex(ISO_DATE, 'expected YYYY-MM-DD');

export const Confidence = z.enum(['verified', 'reported', 'unverified']);
export type Confidence = z.infer<typeof Confidence>;

export const PROTOCOL_SLUGS = [
  'erc-8004',
  'x402',
  'visa-tap',
  'openai-acp',
  'ucp',
  'stripe-mpp',
  'ap2',
  'mastercard-agent-pay',
] as const;
export const ProtocolSlug = z.enum(PROTOCOL_SLUGS);
export type ProtocolSlug = z.infer<typeof ProtocolSlug>;

export const LAYERS = [
  'discovery',
  'identity-trust',
  'intent-authorization',
  'checkout-orders',
  'payment-credential',
  'settlement-rails',
  'post-purchase-disputes',
  'reputation-feedback',
] as const;
export const Layer = z.enum(LAYERS);
export type Layer = z.infer<typeof Layer>;

export const FAMILIES = ['identity-trust', 'authorization-intent', 'checkout-orders', 'payment-execution'] as const;
export const Family = z.enum(FAMILIES);
export type Family = z.infer<typeof Family>;

export const PERSONA_IDS = [
  'consumer',
  'agent-dev',
  'ai-platform',
  'merchant-smb',
  'merchant-enterprise',
  'api-seller',
  'psp',
  'issuer',
  'network',
  'wallet-cp',
  'facilitator',
  'validator',
  'cdn-security',
  'fraud-risk',
  'compliance',
  'security-researcher',
  'controls-builder',
  'autonomous-agent',
  'researcher',
] as const;
export const PersonaId = z.enum(PERSONA_IDS);
export type PersonaId = z.infer<typeof PersonaId>;

export const Rail = z.enum(['crypto', 'card', 'bank', 'rail-agnostic', 'multi-rail']);
export type Rail = z.infer<typeof Rail>;

export const Status = z.enum(['draft', 'beta', 'pilot', 'live', 'mixed']);
export type Status = z.infer<typeof Status>;

export const RelationType = z.enum([
  'embeds',
  'uses-as-rail',
  'complements',
  'competes-with',
  'compatible-with',
  'same-steward',
  'lineage',
]);
export type RelationType = z.infer<typeof RelationType>;

/** Stable section identifiers of the protocol page template (ATLAS_PROMPT.md 4.4). */
export const SECTION_IDS = [
  'a-tldr',
  'b-explanation',
  'c-diagrams',
  'd-ste',
  'e-personas',
  'f-resources',
  'g-publications',
  'h-security',
  'i-controls',
  'j-compliance',
  'k-observability',
  'l-ecosystem',
  'm-timeline',
  'n-code',
  'o-playground',
  'p-compare',
  'q-faq',
  'r-open-questions',
  's-self-test',
  't-notes',
] as const;
export const SectionId = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionId>;

export const SECTION_TITLES: Record<SectionId, string> = {
  'a-tldr': 'TL;DR and key facts',
  'b-explanation': 'Detailed explanation',
  'c-diagrams': 'Diagrams',
  'd-ste': 'Simplified Technical English version',
  'e-personas': 'Main personas',
  'f-resources': 'Resources',
  'g-publications': 'Scientific publications',
  'h-security': 'Security and threat model',
  'i-controls': 'Controls lens',
  'j-compliance': 'Compliance and regulation',
  'k-observability': 'Observability lens',
  'l-ecosystem': 'Ecosystem and adoption',
  'm-timeline': 'Timeline and changelog',
  'n-code': 'Code and labs',
  'o-playground': 'Playground',
  'p-compare': 'Compare and compose',
  'q-faq': 'FAQ and misconceptions',
  'r-open-questions': 'Open questions and research frontier',
  's-self-test': 'Self-test',
  't-notes': 'My notes',
};

export const READING_MODES = ['eli5', 'practitioner', 'spec', 'ste'] as const;
export const ReadingMode = z.enum(READING_MODES);
export type ReadingMode = z.infer<typeof ReadingMode>;

// ---------------------------------------------------------------------------
// Sources and claims
// ---------------------------------------------------------------------------

export const SourceType = z.enum([
  'spec',
  'repo',
  'docs',
  'announcement',
  'standard',
  'paper',
  'news',
  'analysis',
  'dataset',
  'video',
  'other',
]);

export const Source = z.object({
  id: z.string().regex(/^src-[a-z0-9-]+$/, 'source ids look like src-<topic>-<slug>'),
  url: z.string().url(),
  title: z.string().min(1),
  publisher: z.string().min(1),
  type: SourceType,
  primary: z.boolean(),
  published: isoDate.optional(),
  accessed: isoDate,
  archiveUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

export const ClaimTopic = z.enum([
  'identity',
  'governance',
  'versions',
  'actors',
  'objects',
  'flow',
  'states',
  'transports',
  'crypto',
  'security',
  'controls',
  'observability',
  'compliance',
  'ecosystem',
  'metrics',
  'relations',
  'criticism',
  'dates',
  'other',
]);

export const Claim = z.object({
  id: z.string().regex(/^clm-[a-z0-9-]+$/, 'claim ids look like clm-<protocol>-NNN'),
  text: z.string().min(1).refine((t) => !t.includes('—'), 'no em dashes'),
  sources: z.array(z.string()).min(1),
  confidence: Confidence,
  asOf: isoDate.optional(),
  specVersion: z.string().optional(),
  topic: ClaimTopic.optional(),
});
export type Claim = z.infer<typeof Claim>;

/** Per-protocol claim pool: src/content/protocols/<slug>/claims.json */
export const ClaimsFile = z.object({
  protocol: ProtocolSlug,
  generatedAt: isoDate,
  claims: z.array(Claim),
});
export type ClaimsFile = z.infer<typeof ClaimsFile>;

// ---------------------------------------------------------------------------
// Protocol page frontmatter (src/content/protocols/<slug>/index.mdx)
// ---------------------------------------------------------------------------

export const ProtocolMeta = z.object({
  slug: ProtocolSlug,
  order: z.number().int().min(1).max(8),
  name: z.string(),
  bubbleLabel: z.string(),
  /** Short text for the monogram badge, for example "x402" or "8004". */
  monogram: z.string().max(5),
  tagline: z.string(),
  intro: z.string(),
  family: Family,
  layerPrimary: Layer,
  layersSecondary: z.array(Layer),
  rails: z.array(Rail).min(1),
  stewards: z.array(z.string()).min(1),
  governance: z.string(),
  license: z.object({ spec: z.string(), code: z.string().optional() }),
  status: Status,
  statusNote: z.string().optional(),
  firstAnnounced: isoDate,
  latestVersion: z.object({ label: z.string(), date: isoDate }),
  lastVerified: isoDate,
  transports: z.array(z.string()),
  buildsOn: z.array(z.string()),
  composesWith: z.array(ProtocolSlug),
  personas: z.array(PersonaId).min(4),
  disambiguation: z.array(z.string()).optional(),
  /** Flow id of the main happy-path sequence (src/content/flows/<id>.json). */
  mainFlow: z.string(),
  /** State machine id (src/content/states/<id>.json). */
  stateMachine: z.string(),
  /** Diagram ids (hand-written .mmd in src/content/diagrams/) shown in section C, in order. */
  diagrams: z.array(z.string()),
  playground: z.object({
    status: z.enum(['ready', 'coming-next']),
    component: z.string().optional(),
    note: z.string().optional(),
  }),
  /** Key facts for the section A table. Each row cites claim ids. */
  keyFacts: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      claimIds: z.array(z.string()).min(1),
    }),
  ),
});
export type ProtocolMeta = z.infer<typeof ProtocolMeta>;

/** Section A data: src/content/protocols/<slug>/facts.json */
export const FactsFile = z.object({
  protocol: ProtocolSlug,
  tldr: z.string().refine((t) => t.trim().split(/\s+/).length <= 40, 'tldr is at most 40 words'),
  whyItExists: z.string(),
  whatItIsNot: z.array(z.object({ text: z.string(), claimIds: z.array(z.string()) })),
  changedRecently: z.array(
    z.object({ date: isoDate, text: z.string(), claimIds: z.array(z.string()).min(1) }),
  ),
});
export type FactsFile = z.infer<typeof FactsFile>;

// ---------------------------------------------------------------------------
// Flows and state machines (single source of truth for sequence diagrams)
// ---------------------------------------------------------------------------

export const ActorKind = z.enum([
  'human',
  'agent',
  'merchant',
  'psp',
  'network',
  'issuer',
  'wallet',
  'facilitator',
  'chain',
  'cdn',
  'registry',
  'validator',
  'trusted-surface',
  'platform',
  'server',
]);

export const FlowActor = z.object({ id: z.string(), label: z.string(), kind: ActorKind });

export const PayloadFormat = z.enum(['http', 'json', 'jwt', 'sd-jwt', 'eip712', 'solidity', 'text']);

export const FlowStep = z.object({
  n: z.number().int().min(1),
  from: z.string(),
  to: z.string(),
  label: z.string(),
  detail: z.string(),
  /** Which protocol owns this step in a multi-protocol scenario. */
  protocol: ProtocolSlug.optional(),
  payload: z
    .object({
      format: PayloadFormat,
      content: z.string(),
      illustrative: z.literal(true),
    })
    .optional(),
  crossesTrustBoundary: z.boolean().optional(),
  specRef: z.object({ url: z.string().url(), section: z.string().optional() }).optional(),
  failures: z.array(z.object({ condition: z.string(), outcome: z.string() })).optional(),
  /** Where an independent controls layer could act on this step (scenarios). */
  controlPoint: z.string().optional(),
  /** What an outside observer can see of this step (scenarios). */
  observable: z.string().optional(),
});

export const Flow = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  protocol: z.union([ProtocolSlug, z.literal('multi')]),
  title: z.string(),
  summary: z.string().optional(),
  specVersion: z.string(),
  specVersionDate: isoDate,
  actors: z.array(FlowActor).min(2),
  steps: z.array(FlowStep).min(2),
  sources: z.array(z.string()).min(1),
});
export type Flow = z.infer<typeof Flow>;

export const StateMachine = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  protocol: ProtocolSlug,
  title: z.string(),
  specVersion: z.string(),
  states: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      initial: z.boolean().optional(),
      terminal: z.boolean().optional(),
      note: z.string().optional(),
    }),
  ),
  transitions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      trigger: z.string(),
      apiCall: z.string().optional(),
      specRef: z.string().optional(),
    }),
  ),
  sources: z.array(z.string()).min(1),
});
export type StateMachine = z.infer<typeof StateMachine>;

/** Hand-written Mermaid diagram metadata, stored next to the .mmd as <id>.json. */
export const DiagramType = z.enum([
  'context',
  'sequence',
  'failure-sequence',
  'state',
  'data-model',
  'composition',
  'architecture',
  'comparison',
  'flowchart',
  'other',
]);
export const DiagramMeta = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  protocol: z.union([ProtocolSlug, z.literal('multi'), z.literal('global')]),
  type: DiagramType,
  title: z.string(),
  caption: z.string(),
  /** Accessible text alternative. */
  alt: z.string(),
  sourceOfTruth: z.object({ url: z.string().url(), label: z.string() }),
  sources: z.array(z.string()).optional(),
});
export type DiagramMeta = z.infer<typeof DiagramMeta>;

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

export const Persona = z.object({
  id: PersonaId,
  name: z.string(),
  oneLine: z.string(),
  goals: z.array(z.string()).min(1),
  pains: z.array(z.string()).min(1),
  decisions: z.array(z.string()).min(1),
  vocabulary: z.array(z.string()).min(1),
});
export type Persona = z.infer<typeof Persona>;

export const ProtocolPersona = z.object({
  persona: PersonaId,
  role: z.string(),
  goals: z.array(z.string()).min(1),
  pains: z.array(z.string()).min(1),
  implements: z.array(z.string()).min(1),
  mustTrust: z.array(z.string()).min(1),
  questions: z.array(z.string()).min(1),
  firstSteps: z.tuple([z.string(), z.string(), z.string()]),
  metrics: z.array(z.string()).min(1),
  story: z.string().refine((s) => {
    const n = s.trim().split(/\s+/).length;
    return n >= 70 && n <= 140;
  }, 'story is 80 to 120 words (tolerance 70 to 140)'),
  sources: z.array(z.string()).min(1),
});
export type ProtocolPersona = z.infer<typeof ProtocolPersona>;

export const ResponsibilityMark = z.enum(['owns', 'implements', 'verifies', 'relies-on', 'observes', '']);

export const PersonasFile = z.object({
  protocol: ProtocolSlug,
  personas: z.array(ProtocolPersona).min(4),
  responsibilities: z.object({
    columns: z.array(PersonaId).min(2),
    rows: z.array(
      z.object({
        step: z.string(),
        marks: z.record(z.string(), ResponsibilityMark),
      }),
    ),
  }),
});
export type PersonasFile = z.infer<typeof PersonasFile>;

// ---------------------------------------------------------------------------
// Resources and publications
// ---------------------------------------------------------------------------

export const ResourceType = z.enum([
  'spec',
  'repo',
  'sdk',
  'docs',
  'announcement',
  'standard',
  'analysis',
  'talk',
  'podcast',
  'tutorial',
  'tool',
  'dataset',
  'community',
]);

export const Resource = z.object({
  id: z.string().regex(/^res-[a-z0-9-]+$/),
  protocols: z.array(z.string()).min(1),
  title: z.string(),
  url: z.string().url(),
  publisher: z.string(),
  type: ResourceType,
  badge: z.enum(['official', 'partner', 'community', 'academic']),
  date: isoDate.optional(),
  note: z.string(),
  startHere: z.boolean().optional(),
  /** GitHub "owner/repo" for build-time metadata (stars, last commit, latest tag). */
  github: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
});
export type Resource = z.infer<typeof Resource>;

export const ResourcesFile = z.object({ protocol: ProtocolSlug, resources: z.array(Resource).min(1) });

export const Publication = z.object({
  id: z.string().regex(/^pub-[a-z0-9-]+$/),
  title: z.string(),
  authors: z.array(z.string()).min(1),
  year: z.number().int().min(1980).max(2030),
  venue: z.string().optional(),
  peerReviewed: z.boolean(),
  arxiv: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().url(),
  themes: z.array(z.string()),
  protocols: z.array(z.string()),
  relation: z.enum(['direct', 'related', 'foundation', 'grey']),
  summary: z.string(),
  whyItMatters: z.string(),
  verifiedAt: isoDate,
  verifiedVia: z.enum(['crossref', 'datacite', 'arxiv', 'publisher', 'doi-negotiation']),
  bibtex: z.string(),
});
export type Publication = z.infer<typeof Publication>;

// ---------------------------------------------------------------------------
// Security, controls, compliance, observability, ecosystem
// ---------------------------------------------------------------------------

export const Stride = z.enum(['S', 'T', 'R', 'I', 'D', 'E']);

export const Threat = z.object({
  id: z.string(),
  stride: Stride,
  title: z.string(),
  description: z.string(),
  preconditions: z.array(z.string()),
  impact: z.string(),
  mitigatedBySpec: z.enum(['yes', 'partial', 'no']),
  implementerNotes: z.string(),
  sources: z.array(z.string()).min(1),
});

export const SecurityFile = z.object({
  protocol: ProtocolSlug,
  summary: z.string(),
  threats: z.array(Threat).min(8),
  scenarios: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      preconditions: z.array(z.string()),
      steps: z.array(z.string()),
      impact: z.string(),
      sources: z.array(z.string()).min(1),
    }),
  ),
  research: z.array(
    z.object({
      title: z.string(),
      date: isoDate,
      finding: z.string(),
      publicationId: z.string().optional(),
      sources: z.array(z.string()).min(1),
    }),
  ),
  cves: z.array(
    z.object({
      id: z.string(),
      date: isoDate,
      summary: z.string(),
      severity: z.string().optional(),
      confidence: Confidence,
      sources: z.array(z.string()).min(1),
    }),
  ),
  /** Diagram id of the trust-boundary diagram. */
  trustBoundaryDiagram: z.string(),
});
export type SecurityFile = z.infer<typeof SecurityFile>;

export const CONTROL_IDS = [
  'agent-identity-verification',
  'agent-registration-kya',
  'user-consent-capture',
  'spending-caps',
  'merchant-payee-scoping',
  'time-windows-expiry',
  'revocation',
  'step-up-authentication',
  'replay-protection',
  'receipts-evidence',
  'dispute-support',
  'reputation',
  'monitoring-signals',
  'kill-switch',
] as const;
export const ControlId = z.enum(CONTROL_IDS);
export type ControlId = z.infer<typeof ControlId>;

export const ControlSupport = z.enum(['native', 'partial', 'external', 'none']);

export const ControlCell = z.object({
  protocol: ProtocolSlug,
  control: ControlId,
  support: ControlSupport,
  note: z.string(),
  sources: z.array(z.string()).min(1),
});
export type ControlCell = z.infer<typeof ControlCell>;

export const ControlPoint = z.enum([
  'before-authorization',
  'at-signing',
  'at-edge',
  'at-settlement',
  'after-the-fact',
]);

export const ControlsFile = z.object({
  protocol: ProtocolSlug,
  summary: z.string(),
  native: z.array(ControlCell).length(CONTROL_IDS.length),
  gaps: z.array(z.object({ title: z.string(), description: z.string(), sources: z.array(z.string()).min(1) })),
  controlPoints: z.array(
    z.object({ point: ControlPoint, what: z.string(), how: z.string(), sources: z.array(z.string()) }),
  ).min(3),
  checklist: z.array(z.object({ item: z.string(), why: z.string(), sources: z.array(z.string()).optional() })).min(5),
});
export type ControlsFile = z.infer<typeof ControlsFile>;

export const Jurisdiction = z.enum(['US', 'EU', 'UK', 'CA', 'SG', 'card-networks']);
export const ComplianceTopic = z.enum(['liability', 'aml', 'stablecoin', 'sca', 'ai-rules', 'data-protection']);

export const ComplianceFile = z.object({
  protocol: ProtocolSlug,
  notLegalAdvice: z.literal(true),
  summary: z.string(),
  rows: z.array(
    z.object({
      jurisdiction: Jurisdiction,
      topic: ComplianceTopic,
      text: z.string(),
      sources: z.array(z.string()).min(1),
      confidence: Confidence,
    }),
  ).min(12),
});
export type ComplianceFile = z.infer<typeof ComplianceFile>;

export const ObservabilityFile = z.object({
  protocol: ProtocolSlug,
  score: z.number().int().min(0).max(5),
  scoreReasons: z.array(z.string()).min(1),
  public: z.array(
    z.object({
      what: z.string(),
      where: z.string(),
      how: z.string(),
      sources: z.array(z.string()).min(1),
    }),
  ).min(1),
  private: z.array(z.object({ what: z.string(), why: z.string() })).min(1),
  indexerCaptures: z.array(
    z.object({ signal: z.string(), from: z.string(), identifiers: z.array(z.string()), sources: z.array(z.string()) }),
  ).min(1),
});
export type ObservabilityFile = z.infer<typeof ObservabilityFile>;

export const Metric = z.object({
  id: z.string(),
  metric: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string(),
  asOf: isoDate,
  definition: z.string(),
  sources: z.array(z.string()).min(1),
  caveat: z.string().optional(),
  disputed: z.boolean().optional(),
  disputeSources: z.array(z.string()).optional(),
});
export type Metric = z.infer<typeof Metric>;

export const EcosystemFile = z.object({
  protocol: ProtocolSlug,
  stewards: z.array(z.object({ name: z.string(), role: z.string(), sources: z.array(z.string()).min(1) })),
  implementers: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      status: z.enum(['announced', 'pilot', 'beta', 'live', 'unknown']),
      sources: z.array(z.string()).min(1),
    }),
  ),
  sdks: z.array(
    z.object({
      registry: z.enum(['npm', 'pypi', 'crates', 'go', 'rubygems', 'maven', 'other']),
      name: z.string(),
      version: z.string().optional(),
      url: z.string().url(),
      note: z.string().optional(),
    }),
  ),
  metrics: z.array(Metric),
  /** Optional chart definition rendered by MetricChart. */
  chart: z
    .object({
      title: z.string(),
      unit: z.string(),
      series: z.array(z.object({ label: z.string(), points: z.array(z.object({ date: isoDate, value: z.number() })) })),
      sourceLine: z.string(),
    })
    .optional(),
});
export type EcosystemFile = z.infer<typeof EcosystemFile>;

// ---------------------------------------------------------------------------
// Timeline, glossary, relations, compare, controls map
// ---------------------------------------------------------------------------

export const TimelineKind = z.enum([
  'announce',
  'release',
  'governance',
  'launch',
  'pilot',
  'security',
  'policy',
  'market',
  'prehistory',
]);

export const TimelineEvent = z.object({
  date: isoDate,
  lane: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  kind: TimelineKind,
  sources: z.array(z.string()).min(1),
  confidence: Confidence,
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

export const TimelineFile = z.object({ protocol: ProtocolSlug, events: z.array(TimelineEvent).min(8) });

export const GlossaryTerm = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  term: z.string(),
  aliases: z.array(z.string()),
  plain: z.string(),
  ste: z.string(),
  protocols: z.array(z.string()),
  sources: z.array(z.string()).min(1),
});
export type GlossaryTerm = z.infer<typeof GlossaryTerm>;

export const Relation = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationType,
  note: z.string(),
  sources: z.array(z.string()).min(1),
});
export type Relation = z.infer<typeof Relation>;

export const CompareCell = z.object({
  protocol: ProtocolSlug,
  dimension: z.string(),
  value: z.string(),
  detail: z.string().optional(),
  sources: z.array(z.string()).min(1),
  confidence: Confidence,
});
export type CompareCell = z.infer<typeof CompareCell>;

export const RADAR_AXES = [
  'openness',
  'decentralization',
  'maturity',
  'adoption-evidence',
  'human-not-present',
  'dispute-support',
] as const;
export const RadarAxis = z.enum(RADAR_AXES);

export const CompareFile = z.object({
  dimensions: z.array(z.object({ id: z.string(), label: z.string(), group: z.string().optional() })).min(30),
  cells: z.array(CompareCell),
  radar: z.array(
    z.object({
      protocol: ProtocolSlug,
      axis: RadarAxis,
      value: z.number().min(0).max(5),
      justification: z.string(),
      sources: z.array(z.string()).min(1),
    }),
  ),
});
export type CompareFile = z.infer<typeof CompareFile>;

export const ControlsMapFile = z.object({
  controls: z.array(z.object({ id: ControlId, label: z.string(), description: z.string() })).length(CONTROL_IDS.length),
  cells: z.array(ControlCell),
  independentLayerNotes: z.array(z.object({ control: ControlId, note: z.string() })),
});
export type ControlsMapFile = z.infer<typeof ControlsMapFile>;

// ---------------------------------------------------------------------------
// FAQ, open questions, self-test, code
// ---------------------------------------------------------------------------

export const FaqFile = z.object({
  protocol: ProtocolSlug,
  items: z.array(
    z.object({
      q: z.string(),
      a: z.string(),
      misconception: z.boolean().optional(),
      claimIds: z.array(z.string()).min(1),
    }),
  ).min(8),
});

export const OpenQuestionsFile = z.object({
  protocol: ProtocolSlug,
  items: z.array(z.object({ question: z.string(), context: z.string(), sources: z.array(z.string()) })).min(6),
});

export const QuizItem = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(3).max(5),
  answer: z.number().int().min(0),
  explanation: z.string(),
  claimIds: z.array(z.string()).min(1),
});
export type QuizItem = z.infer<typeof QuizItem>;

export const QuizFile = z.object({ protocol: ProtocolSlug, questions: z.array(QuizItem).length(10) });

export const Flashcard = z.object({ id: z.string(), front: z.string(), back: z.string(), claimIds: z.array(z.string()).min(1) });
export const FlashcardsFile = z.object({ protocol: ProtocolSlug, cards: z.array(Flashcard).length(15) });

export const CodeSnippet = z.object({
  title: z.string(),
  sdk: z.string(),
  version: z.string(),
  language: z.string(),
  side: z.enum(['client', 'server', 'contract', 'cli', 'other']),
  code: z.string(),
  docsUrl: z.string().url(),
  note: z.string().optional(),
  sources: z.array(z.string()).min(1),
});
export const CodeFile = z.object({
  protocol: ProtocolSlug,
  snippets: z.array(CodeSnippet).min(1),
  labs: z.array(z.object({ title: z.string(), path: z.string(), status: z.enum(['ready', 'planned']) })),
});

// ---------------------------------------------------------------------------
// Scenarios, orbit, manual metrics, waivers
// ---------------------------------------------------------------------------

export const ScenarioMeta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int(),
  title: z.string(),
  summary: z.string(),
  protocols: z.array(ProtocolSlug).min(1),
  flow: z.string(),
  personas: z.array(PersonaId).optional(),
  lastVerified: isoDate,
});
export type ScenarioMeta = z.infer<typeof ScenarioMeta>;

export const OrbitCategory = z.enum([
  'agent-communication',
  'agent-identity',
  'wallet-permissions',
  'machine-payments',
  'card-wallet-commerce',
  'legal-policy',
]);

export const OrbitMeta = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  category: OrbitCategory,
  starred: z.boolean(),
  oneLiner: z.string(),
  steward: z.string(),
  status: z.string(),
  latestVersion: z.object({ label: z.string(), date: isoDate }).optional(),
  relations: z.array(z.object({ to: ProtocolSlug, type: RelationType, note: z.string() })),
  sources: z.array(z.string()).min(1),
  lastVerified: isoDate,
});
export type OrbitMeta = z.infer<typeof OrbitMeta>;

export const ManualMetricsFile = z.object({
  generatedAt: isoDate,
  metrics: z.array(Metric.extend({ protocol: z.union([ProtocolSlug, z.literal('market')]) })),
});

export const CoverageWaiver = z.object({
  protocol: ProtocolSlug,
  check: z.string(),
  reason: z.string(),
  date: isoDate,
});
export const CoverageWaiversFile = z.object({ waivers: z.array(CoverageWaiver) });

// ---------------------------------------------------------------------------
// Convenience maps
// ---------------------------------------------------------------------------

export const FAMILY_LABELS: Record<Family, string> = {
  'identity-trust': 'Identity and trust',
  'authorization-intent': 'Authorization and intent',
  'checkout-orders': 'Checkout and orders',
  'payment-execution': 'Payment execution and credentials',
};

export const LAYER_LABELS: Record<Layer, string> = {
  discovery: 'Discovery',
  'identity-trust': 'Identity and trust',
  'intent-authorization': 'Intent and authorization',
  'checkout-orders': 'Checkout and orders',
  'payment-credential': 'Payment credential',
  'settlement-rails': 'Settlement rails',
  'post-purchase-disputes': 'Post-purchase and disputes',
  'reputation-feedback': 'Reputation and feedback',
};

export const CONTROL_LABELS: Record<ControlId, string> = {
  'agent-identity-verification': 'Agent identity verification',
  'agent-registration-kya': 'Agent registration (know your agent)',
  'user-consent-capture': 'User consent capture',
  'spending-caps': 'Spending caps',
  'merchant-payee-scoping': 'Merchant or payee scoping',
  'time-windows-expiry': 'Time windows and expiry',
  revocation: 'Revocation',
  'step-up-authentication': 'Step-up authentication',
  'replay-protection': 'Replay protection',
  'receipts-evidence': 'Receipts and evidence',
  'dispute-support': 'Dispute support',
  reputation: 'Reputation',
  'monitoring-signals': 'Monitoring signals',
  'kill-switch': 'Kill switch',
};
