import { createClient } from '@supabase/supabase-js';

// Offline reproduction: all network requests are intercepted with synthetic data.
const headersSeen = [];
const client = createClient('https://audit.invalid', 'synthetic-service-key', {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (url, options) => {
      if (String(url).includes('/auth/v1/token')) {
        return new Response(JSON.stringify({
          access_token: 'synthetic-user-token', refresh_token: 'synthetic-refresh',
          token_type: 'bearer', expires_in: 3600,
          user: { id: 'audit-user', email: 'audit@example.invalid' }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      headersSeen.push(new Headers(options.headers).get('Authorization'));
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }
});
await client.from('subscribers').select('email');
const result = await client.auth.signInWithIdToken({ provider: 'google', token: 'synthetic-google-token' });
if (result.error) throw result.error;
await client.from('subscribers').select('email');
console.log(JSON.stringify({ beforeSignIn: headersSeen[0], afterSignIn: headersSeen[1] }, null, 2));
await client.auth.stopAutoRefresh();
