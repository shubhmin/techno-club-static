import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  security: {
    checkOrigin: false,
  },
  integrations: [tailwind()],
  output: 'server',
  adapter: vercel(),
});
