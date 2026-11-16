// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import pagefind from 'astro-pagefind';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeGlossary from './src/lib/glossary/rehype-glossary.ts';
import rehypeTableWrap from './src/lib/rehype-table-wrap.ts';
import cspHashes from './src/lib/build/csp-hashes.ts';
import pruneCitations from './src/lib/build/prune-citations.ts';

// https://astro.build/config
const site = (process.env.PUBLIC_SITE_URL && /^https?:\/\//.test(process.env.PUBLIC_SITE_URL) ? process.env.PUBLIC_SITE_URL : 'https://atlas.merces.ai').replace(/\/+$/, '');

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), mdx({ rehypePlugins: [rehypeGlossary, rehypeTableWrap] }), pagefind(), pruneCitations(), cspHashes()],
  vite: {
    plugins: [tailwindcss()],
    // Fonts and scripts stay files. Under 4 KB, Vite would turn a font subset into a data: URL,
    // which the Content Security Policy blocks (font-src 'self'), and Astro would inline a
    // processed <script> as an inline module; after a client-side navigation into a page whose
    // last new module script is inline, the ClientRouter appends a data: module script to wait
    // for it, which script-src blocks. Other small assets (CSS, images) keep the default.
    build: { assetsInlineLimit: (filePath) => (/\.(woff2?|ttf|otf|eot|m?js)$/i.test(filePath) ? false : undefined) },
  },
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
    shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' }, defaultColor: false },
  },
});
