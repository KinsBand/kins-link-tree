import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import type { APIContext } from 'astro';
import { resolve } from 'node:path';

test.describe('audit — server isolation and validation', () => {
  test.describe.configure({ mode: 'serial' });
  let server: ViteDevServer;
  let health: typeof import('../src/pages/api/notify-health');
  let upload: typeof import('../src/pages/api/fan-upload');
  let supabase: typeof import('../src/lib/supabaseServer');
  const savedFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  const calls: { url: string; authorization: string | null }[] = [];
  let identity = 0;

  const context = (method: string, path = '/api/notify-health', body?: unknown, authorized = false, ip = `audit-${++identity}`) => {
    const url = new URL(path, 'https://audit.invalid');
    const request = new Request(url, {
      method,
      headers: { 'x-forwarded-for': ip, ...(authorized ? { authorization: 'Bearer synthetic-health-token' } : {}),
        ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { request, url } as APIContext;
  };

  test.beforeAll(async () => {
    // No real services: synthetic credentials, no dotenv loading, and every fetch intercepted.
    Object.assign(process.env, {
      SUPABASE_URL: 'https://audit.invalid', PUBLIC_SUPABASE_URL: 'https://audit.invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key', PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
      RESEND_API_KEY: 're_synthetic_key', NOTIFY_EMAIL: 'audit@example.invalid',
      RESEND_FROM_EMAIL: 'Kins <audit@example.invalid>', RESEND_REPLY_TO: 'audit@example.invalid',
    });
    globalThis.fetch = async (input, options) => {
      const url = String(input);
      calls.push({ url, authorization: new Headers(options?.headers).get('authorization') });
      const body = url.includes('/auth/v1/token') ? {
        access_token: 'synthetic-user-token', refresh_token: 'synthetic-refresh', token_type: 'bearer',
        expires_in: 3600, user: { id: 'audit-user', email: 'audit@example.invalid' },
      } : url.includes('/rest/v1/') ? [] : { id: 'synthetic-email-id' };
      return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
    };
    server = await createServer({ configFile: false, envDir: resolve('e2e/fixtures/no-env'),
      server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
    health = await server.ssrLoadModule('/src/pages/api/notify-health.ts') as typeof health;
    upload = await server.ssrLoadModule('/src/pages/api/fan-upload.ts') as typeof upload;
    supabase = await server.ssrLoadModule('/src/lib/supabaseServer.ts') as typeof supabase;
  });

  test.beforeEach(() => {
    calls.length = 0;
    process.env.HEALTHCHECK_TOKEN = 'synthetic-health-token';
    delete process.env.NOTIFY_HEALTH_TOKEN;
  });

  test.afterAll(async () => {
    await server?.close();
    globalThis.fetch = savedFetch;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  });

  test('user authentication cannot replace the shared service authorization', async () => {
    const service = supabase.getSupabaseServiceClient()!;
    await service.from('subscribers').select('email');
    const auth = supabase.createSupabaseAuthClient()!;
    expect(auth).not.toBe(service);
    const result = await auth.auth.signInWithIdToken({ provider: 'google', token: 'synthetic-id-token' });
    expect(result.error).toBeNull();
    expect(supabase.getSupabaseServiceClient()).toBe(service);
    await service.from('subscribers').select('email');
    expect(calls.filter(call => call.url.includes('/rest/v1/')).map(call => call.authorization))
      .toEqual(['Bearer synthetic-service-key', 'Bearer synthetic-service-key']);
    const nextRequest = supabase.createSupabaseAuthClient()!;
    expect((await nextRequest.auth.getSession()).data.session).toBeNull();
  });

  test('health fails closed when configuration or authentication is missing', async () => {
    delete process.env.HEALTHCHECK_TOKEN;
    expect((await health.GET(context('GET'))).status).toBe(503);
    expect((await health.POST(context('POST', '/api/notify-health', {}))).status).toBe(503);
    process.env.HEALTHCHECK_TOKEN = 'synthetic-health-token';
    const rejected = await health.GET(context('GET'));
    expect(rejected.status).toBe(401);
    expect(await rejected.json()).not.toHaveProperty('health');
    expect(calls).toHaveLength(0);
  });

  test('GET never sends and POST rejects invalid payloads', async () => {
    expect((await health.GET(context('GET', '/api/notify-health?check=send&mode=full', undefined, true))).status).toBe(400);
    expect((await health.GET(context('GET', '/api/notify-health', undefined, true))).status).toBe(200);
    expect((await health.POST(context('POST', '/api/notify-health', { mode: 'unknown' }, true))).status).toBe(400);
    expect((await health.POST(context('POST', '/api/notify-health', undefined, true))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  test('authenticated POST sends bounded probes and is rate limited', async () => {
    const response = await health.POST(context('POST', '/api/notify-health', { mode: 'full' }, true, 'audit-rate'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(calls.filter(call => call.url === 'https://api.resend.com/emails')).toHaveLength(3);
    for (let n = 0; n < 4; n++) await health.GET(context('GET', '/api/notify-health', undefined, true, 'audit-rate'));
    expect((await health.POST(context('POST', '/api/notify-health', {}, true, 'audit-rate'))).status).toBe(429);
    expect(calls).toHaveLength(3);
  });

  test('oversize uploads are rejected before any storage or notification call', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }));
    const response = await upload.POST({ request: new Request('https://audit.invalid/api/fan-upload', { method: 'POST', body: form }) } as APIContext);
    expect(response.status).toBe(400);
    expect((await response.json()).message).toContain('4 MB');
    const oversizedBody = new Request('https://audit.invalid/api/fan-upload', { method: 'POST', headers: { 'content-length': '5000000' }, body: 'oversize' });
    expect((await upload.POST({ request: oversizedBody } as APIContext)).status).toBe(413);
    expect(calls).toHaveLength(0);
  });
});
