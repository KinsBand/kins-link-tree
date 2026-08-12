import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kinsband.github.io',
  base: '/kins-link-tree/',
  build: {
    format: 'directory'
  }
});

