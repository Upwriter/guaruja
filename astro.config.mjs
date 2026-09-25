// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { rehypeAdSlots } from './src/lib/rehype-ad-slots.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://destinoguaruja.com.br',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Evita que o Vite suba pastas acima do projeto e ache um postcss.config.js
    // de outro projeto (o Tailwind 4 já funciona via plugin do Vite, sem PostCSS).
    css: {
      postcss: {
        plugins: [],
      },
    },
  },
  markdown: {
    processor: unified({ rehypePlugins: [rehypeAdSlots] }),
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-sans',
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
    },
  ],
});
