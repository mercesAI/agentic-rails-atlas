/** Build-time loader for the personas hub and persona pages. */
import { getPersonas, getProtocols, getSidecar } from '../../../lib/content';
import { PERSONA_IDS, type Persona, type PersonasFile, type ProtocolMeta } from '../../../lib/schemas';
import { relevance, relevanceScore, type Relevance } from './personas';

export interface PersonaData {
  personas: Persona[];
  protocols: ProtocolMeta[];
  files: Map<string, PersonasFile | null>;
  matrix: Map<string, Map<string, Relevance>>;
  score: Map<string, number>;
}

/** Two-letter abstract monogram from a persona name (no avatars, no photos). */
export function personaMonogram(name: string): string {
  const words = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean);
  const pick = words.length >= 2 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? '?').slice(0, 2);
  return pick.toUpperCase();
}

export async function loadPersonaData(): Promise<PersonaData> {
  const order = new Map<string, number>(PERSONA_IDS.map((id, i) => [id, i]));
  const personas = (await getPersonas()).sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  const protocols = await getProtocols();
  const files = new Map<string, PersonasFile | null>();
  for (const p of protocols) files.set(p.slug, (await getSidecar('protocolPersonas', p.slug)) as PersonasFile | null);
  const matrix = new Map<string, Map<string, Relevance>>();
  const score = new Map<string, number>();
  for (const persona of personas) {
    const row = new Map<string, Relevance>();
    for (const p of protocols) row.set(p.slug, relevance(persona.id, files.get(p.slug)));
    matrix.set(persona.id, row);
    score.set(persona.id, relevanceScore([...row.values()]));
  }
  return { personas, protocols, files, matrix, score };
}
