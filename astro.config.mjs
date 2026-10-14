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

// https://astro.build/config
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), mdx({ rehypePlugins: [rehypeGlossary, rehypeTableWrap] }), pagefind(), cspHashes()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
    shikiConfig: { themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' }, defaultColor: false },
  },
});
