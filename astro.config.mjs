import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://KinsBandOfficial.github.io',
  base: process.env.GITHUB_ACTIONS ? '/kins-link-in-bio/' : '/',
  build: {
    format: 'directory'
  }
});
