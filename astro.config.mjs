import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),
  site: 'https://kinshub.vercel.app',
  devToolbar: { enabled: false },
  build: {
    format: 'directory',
    inlineStylesheets: 'auto'
  },
  vite: {
    server: {
      watch: {
        ignored: ['**/.vercel/**', '**/.git/**', '**/dist/**']
      }
    },
    build: {
      cssMinify: true,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            supabase: ['@supabase/supabase-js']
          }
        }
      }
    }
  }
});

