// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://oresoftware.github.io',
  base: '/benefactor.cc',
  server: {
    port: 4323,
  },
});
