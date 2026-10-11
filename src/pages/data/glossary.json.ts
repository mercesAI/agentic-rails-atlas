/** Static JSON of glossary definitions for the tooltip script (id, term, plain). */
import type { APIRoute } from 'astro';
import { loadGlossaryTerms, toTooltipTerms } from '../../lib/glossary/lookup';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(toTooltipTerms(loadGlossaryTerms())), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
