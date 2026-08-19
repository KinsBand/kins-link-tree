import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://kins-link-tree.vercel.app',
  build: {
    format: 'directory'
  },
  vite: {
    server: {
      allowedHosts: ['sb-4dn1wlyjamnj.vercel.run']
    }
  }
});

