// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://benefactor.cc',
  base: '/',
  server: {
    port: 4323,
  },
});
