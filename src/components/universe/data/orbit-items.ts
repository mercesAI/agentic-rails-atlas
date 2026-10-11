/**
 * Orbit items for the universe satellites, taken from the item indexes in
 * research/orbit.a.md and research/orbit.b.md (lastVerified 2026-10-11).
 * Until an orbit mini page exists (src/content/orbit/<slug>.mdx), a satellite
 * links to the item's first primary link and is marked external
 * (ATLAS_FOLLOWUP.md 2.3.5). One-liners are short paraphrases, not quotations.
 */
import type { OrbitCategoryId } from '../lib/types';

export interface OrbitSeed {
  slug: string;
  name: string;
  category: OrbitCategoryId;
  oneLiner: string;
  primaryLink: string;
}

export const ORBIT_SEEDS: readonly OrbitSeed[] = [
  { slug: 'mcp', name: 'MCP', category: 'agent-communication', oneLiner: 'JSON-RPC protocol that connects LLM apps to tool, resource and prompt servers.', primaryLink: 'https://modelcontextprotocol.io/specification/2026-07-28' },
  { slug: 'a2a', name: 'A2A', category: 'agent-communication', oneLiner: 'Agents find each other through Agent Cards and delegate tasks.', primaryLink: 'https://a2a-protocol.org/latest/specification/' },
  { slug: 'agntcy-oasf', name: 'AGNTCY and OASF', category: 'agent-communication', oneLiner: 'Linux Foundation project for agent discovery, identity and records.', primaryLink: 'https://www.linuxfoundation.org/press/linux-foundation-welcomes-the-agntcy-project-to-standardize-open-multi-agent-system-infrastructure-and-break-down-ai-agent-silos' },
  { slug: 'anp', name: 'ANP', category: 'agent-communication', oneLiner: 'DID-based protocol suite for agent identity, discovery and messaging.', primaryLink: 'https://github.com/agent-network-protocol/AgentNetworkProtocol' },
  { slug: 'agents-md', name: 'AGENTS.md', category: 'agent-communication', oneLiner: 'Markdown file format with project instructions for coding agents.', primaryLink: 'https://agents.md' },
  { slug: 'goose', name: 'goose', category: 'agent-communication', oneLiner: 'Open-source agent that loads MCP servers as extensions.', primaryLink: 'https://github.com/aaif-goose/goose' },
  { slug: 'openai-apps-sdk', name: 'OpenAI Apps SDK', category: 'agent-communication', oneLiner: 'MCP-based apps and plugins inside ChatGPT, including checkout.', primaryLink: 'https://developers.openai.com/plugins' },
  { slug: 'erc-3643', name: 'ERC-3643 and ONCHAINID', category: 'agent-identity', oneLiner: 'Permissioned token standard whose holders carry on-chain identity claims.', primaryLink: 'https://eips.ethereum.org/EIPS/eip-3643' },
  { slug: 'erc-8226', name: 'ERC-8226', category: 'agent-identity', oneLiner: 'Draft ERC for scoped, capped agent mandates over regulated tokens.', primaryLink: 'https://eips.ethereum.org/EIPS/eip-8226' },
  { slug: 'l402', name: 'L402', category: 'machine-payments', oneLiner: 'HTTP 402 scheme that pairs a Lightning invoice with a bearer token.', primaryLink: 'https://github.com/lightninglabs/L402' },
  { slug: 'interledger', name: 'Interledger Open Payments', category: 'machine-payments', oneLiner: 'REST standard with GNAP authorization for wallet-to-wallet payments.', primaryLink: 'https://openpayments.dev/' },
  { slug: 'circle', name: 'Circle', category: 'machine-payments', oneLiner: 'USDC issuer with Nanopayments, an agent stack and the Arc chain.', primaryLink: 'https://www.circle.com/blog/nanopayments-powered-by-circle-gateway-is-now-live-on-mainnet' },
  { slug: 'coinbase-agent-products', name: 'Coinbase agent products', category: 'machine-payments', oneLiner: 'Agent wallets and payment tools built around x402.', primaryLink: 'https://www.coinbase.com/developer-platform/discover/launches/payments-mcp' },
  { slug: 'cloudflare-agent-payments', name: 'Cloudflare agent payments', category: 'machine-payments', oneLiner: 'Monetization Gateway, wallets and Radar data for agent traffic.', primaryLink: 'https://blog.cloudflare.com/monetization-gateway-beta/' },
  { slug: 'tempo', name: 'Tempo', category: 'machine-payments', oneLiner: 'Payments-focused EVM chain and the home rail of MPP.', primaryLink: 'https://tempo.xyz/blog/mainnet/' },
  { slug: 'kite-ai', name: 'Kite AI', category: 'machine-payments', oneLiner: 'Settlement chain plus an Agent Passport with spending limits.', primaryLink: 'https://www.theblock.co/press-releases/399534/kite-launches-kite-chain-and-kite-agent-passport-enabling-autonomous-ai-agent-payments' },
  { slug: 'nevermined', name: 'Nevermined', category: 'machine-payments', oneLiner: 'x402 facilitator with smart-account plans, credits and subscriptions.', primaryLink: 'https://nevermined.ai/docs/products/payments-facilitator/how-it-works.md' },
  { slug: 'crossmint', name: 'Crossmint Agentic Cards', category: 'machine-payments', oneLiner: 'API that connects eligible US Visa cards to agents as tokens.', primaryLink: 'https://crossmint.com/announcement/agentic-cards-api-launch-visa-basistheory' },
  { slug: 'x402r-a402', name: 'x402r and A402', category: 'machine-payments', oneLiner: 'A refund protocol for x402 and an unrelated academic proposal.', primaryLink: 'https://x402r.org' },
  { slug: 'visa-intelligent-commerce', name: 'Visa Intelligent Commerce', category: 'card-wallet-commerce', oneLiner: 'Visa program and APIs for agent-initiated card payments.', primaryLink: 'https://developer.visa.com/capabilities/visa-intelligent-commerce/overview' },
  { slug: 'amex-ace', name: 'American Express ACE', category: 'card-wallet-commerce', oneLiner: 'Developer kit for agent registration, credentials and cart context.', primaryLink: 'https://www.nasdaq.com/press-release/american-express-debuts-agentic-commerce-experiences-acetm-developer-kit-and' },
  { slug: 'paypal-agentic', name: 'PayPal agentic services', category: 'card-wallet-commerce', oneLiner: 'Agent Ready payments and Store Sync catalogs for AI assistants.', primaryLink: 'https://developer.paypal.com/agentic-commerce-services/about.md' },
  { slug: 'stripe-acs', name: 'Stripe Agentic Commerce Suite', category: 'card-wallet-commerce', oneLiner: 'Merchant suite and Shared Payment Tokens for agent sales.', primaryLink: 'https://stripe.com/newsroom/news/agentic-commerce-suite' },
  { slug: 'adyen-agentic', name: 'Adyen Agentic', category: 'card-wallet-commerce', oneLiner: 'Modular feed, cart and payment APIs for AI platforms.', primaryLink: 'https://www.adyen.com/press-and-media/adyen-agentic' },
  { slug: 'klarna-app', name: 'Klarna Agentic Product Protocol', category: 'card-wallet-commerce', oneLiner: 'Open product-feed spec with live price and stock data for agents.', primaryLink: 'https://www.businesswire.com/news/home/20251215227830/en/Klarna-Launches-Agentic-Product-Protocol-The-Open-Standard-That-Makes-100M-Products-Instantly-Discoverable-by-AI-Agents' },
  { slug: 'microsoft-copilot-checkout', name: 'Microsoft Copilot Checkout', category: 'card-wallet-commerce', oneLiner: 'In-chat checkout where the merchant stays merchant of record.', primaryLink: 'https://about.ads.microsoft.com/en/blog/post/january-2026/conversations-that-convert-copilot-checkout-and-brand-agents' },
  { slug: 'perplexity-instant-buy', name: 'Perplexity Instant Buy', category: 'card-wallet-commerce', oneLiner: 'In-chat checkout for PayPal merchants inside Perplexity.', primaryLink: 'https://newsroom.paypal-corp.com/2025-11-PayPal-and-Perplexity-Launch-Instant-Buy' },
  { slug: 'google-universal-cart', name: 'Google Universal Cart', category: 'card-wallet-commerce', oneLiner: 'Cross-merchant cart that checks out through UCP (not UCP itself).', primaryLink: 'https://blog.google/products-and-platforms/products/shopping/google-shopping-cart/' },
  { slug: 'shopify-agentic-storefronts', name: 'Shopify Agentic Storefronts', category: 'card-wallet-commerce', oneLiner: 'Admin channel that syndicates catalogs to AI assistants.', primaryLink: 'https://www.shopify.com/news/ai-commerce-at-scale' },
  { slug: 'npci-upi-agentic', name: 'NPCI UPI agentic payments', category: 'card-wallet-commerce', oneLiner: 'Pilots where assistants pay Indian merchants over UPI Reserve Pay.', primaryLink: 'https://razorpay.com/newsroom/razorpay-npci-and-openai-come-together-to-launch-agentic-payments-ushering-in-ai-driven-commerce-at-national-scale/' },
  { slug: 'amazon-v-perplexity', name: 'Amazon v. Perplexity', category: 'legal-policy', oneLiner: 'US lawsuit over a browser agent that shops on Amazon for users.', primaryLink: 'https://cdn.ca9.uscourts.gov/datastore/opinions/2026/08/04/26-1444.pdf' },
];
