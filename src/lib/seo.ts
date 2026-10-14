/**
 * SEO helpers: per-page titles and descriptions, and JSON-LD builders.
 * Everything here is derived from content that already exists on the page;
 * nothing is invented for search engines.
 */
import { BUILD_DATE, ORG_DESCRIPTION, ORG_NAME, ORG_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './constants';

export const MAX_DESCRIPTION = 160;

/** Trim a description to about 160 characters at a sentence or word boundary. */
export function trimDescription(text: string, max = MAX_DESCRIPTION): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const sentence = cut.lastIndexOf('. ');
  if (sentence >= max * 0.55) return cut.slice(0, sentence + 1);
  const word = cut.lastIndexOf(' ');
  return `${cut.slice(0, word > 0 ? word : max).replace(/[,;:]$/, '')}.`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

/** Hand-written search titles for the eight protocol pages (name plus what the page answers). */
export const PROTOCOL_SEO_TITLES: Record<string, string> = {
  'erc-8004': 'ERC-8004 Trustless Agents explained: on-chain agent identity, reputation and validation',
  x402: 'x402 protocol explained: HTTP 402 machine payments, V2 flow, security and controls',
  'visa-tap': 'Visa Trusted Agent Protocol (TAP) explained: signed agent requests for card checkout',
  'openai-acp': 'Agentic Commerce Protocol (ACP) explained: ChatGPT checkout and delegated payment tokens',
  ucp: 'Universal Commerce Protocol (UCP) explained: discovery, negotiation, checkout and orders',
  'stripe-mpp': 'Machine Payments Protocol (MPP) explained: the Stripe and Tempo HTTP Payment scheme',
  ap2: 'Agent Payments Protocol (AP2) explained: signed mandates for agent purchases',
  'mastercard-agent-pay': 'Mastercard Agent Pay explained: agentic tokens, Verifiable Intent and Know Your Agent',
};

export type JsonLd = Record<string, unknown>;

export function organizationLd(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': `${ORG_URL}/#organization`,
    name: ORG_NAME,
    url: ORG_URL,
    description: ORG_DESCRIPTION,
  };
}

export function webSiteLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: organizationLd(),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function articleLd(opts: {
  type?: 'TechArticle' | 'Article';
  path: string;
  headline: string;
  description: string;
  dateModified?: string;
  about?: string;
  keywords?: string[];
  image?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': opts.type ?? 'TechArticle',
    '@id': `${absoluteUrl(opts.path)}#article`,
    mainEntityOfPage: absoluteUrl(opts.path),
    headline: opts.headline,
    description: opts.description,
    inLanguage: 'en',
    datePublished: opts.dateModified ?? BUILD_DATE,
    dateModified: opts.dateModified ?? BUILD_DATE,
    author: organizationLd(),
    publisher: organizationLd(),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    ...(opts.about ? { about: { '@type': 'Thing', name: opts.about } } : {}),
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(', ') } : {}),
    ...(opts.image ? { image: absoluteUrl(opts.image) } : {}),
  };
}

/** FAQPage from a protocol's faq.json; answers are plain text already. */
export function faqLd(items: { q: string; a: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function definedTermSetLd(terms: { id: string; term: string; plain: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${absoluteUrl('/glossary/')}#terms`,
    name: `${SITE_NAME} glossary`,
    hasDefinedTerm: terms.map((t) => ({
      '@type': 'DefinedTerm',
      '@id': absoluteUrl(`/glossary/#${t.id}`),
      name: t.term,
      description: t.plain,
    })),
  };
}
