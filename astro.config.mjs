import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  output: 'static',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),
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

