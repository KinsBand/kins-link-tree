import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://trapjgpjrfsdteg.github.io',
  base: '/kins-official-website/',
  build: {
    format: 'directory'
  }
});

