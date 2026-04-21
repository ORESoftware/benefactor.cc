// @ts-check
import { defineConfig } from 'astro/config';

const customDomain = process.env.CUSTOM_DOMAIN?.trim();

// https://astro.build/config
export default defineConfig({
  site: customDomain ? `https://${customDomain}` : 'https://oresoftware.github.io',
  base: customDomain ? '/' : '/benefactor.cc',
  trailingSlash: 'always',
  server: {
    port: 4323,
  },
});
