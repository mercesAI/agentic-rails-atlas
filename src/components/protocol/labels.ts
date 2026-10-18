/** Display labels shared by protocol page components; the cross-area tables live in src/lib/labels.ts. */
export { RAIL_LABELS, RELATION_LABELS, SUPPORT_LABELS } from '../../lib/labels';

export const STRIDE_LABELS: Record<string, string> = {
  S: 'Spoofing',
  T: 'Tampering',
  R: 'Repudiation',
  I: 'Information disclosure',
  D: 'Denial of service',
  E: 'Elevation of privilege',
};

export const MITIGATION_LABELS: Record<string, string> = { yes: 'Mitigated by spec', partial: 'Partly', no: 'Left to implementers' };

export const JURISDICTION_LABELS: Record<string, string> = {
  US: 'United States',
  EU: 'European Union',
  UK: 'United Kingdom',
  CA: 'Canada',
  SG: 'Singapore',
  'card-networks': 'Card network rules',
};

export const COMPLIANCE_TOPIC_LABELS: Record<string, string> = {
  liability: 'Consumer protection and liability',
  aml: 'AML and sanctions',
  stablecoin: 'Stablecoin rules',
  sca: 'Strong customer authentication',
  'ai-rules': 'AI-specific rules',
  'data-protection': 'Data protection',
};

export const CONTROL_POINT_LABELS: Record<string, string> = {
  'before-authorization': 'Before authorization',
  'at-signing': 'At signing',
  'at-edge': 'At the edge',
  'at-settlement': 'At settlement',
  'after-the-fact': 'After the fact',
};

export const PERSONA_MARK_LABELS: Record<string, string> = {
  owns: 'Owns',
  implements: 'Implements',
  verifies: 'Verifies',
  'relies-on': 'Relies on',
  observes: 'Observes',
  '': '',
};
