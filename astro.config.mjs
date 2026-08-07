import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kinsband.github.io',
  base: '/kins-official-website/',
  build: {
    format: 'directory'
  }
});

