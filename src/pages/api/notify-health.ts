import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getNotifyHealth, getNotifyConfig } from '../../lib/notifyEmail';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const getEnv = (key: string): string => {
  let val = '';
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    val = String(process.env[key]);
  } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    val = String(import.meta.env[key]);
  }
  return val.replace(/^["']|["']$/g, '').trim();
};

/**
 * GET /api/notify-health — redacted diagnostics for email delivery.
 * - No secrets exposed (key is masked).
 * - Checks RESEND config, NOTIFY_EMAIL, Supabase persistence, and webhook presence.
 * - Useful after deploy to confirm HelloKinsFan@gmail.com will actually receive mail.
 *
 * Optional query: ?check=send  (requires ?token=<HEALTHCHECK_TOKEN> if set)
 *   — sends a test email via Resend to NOTIFY_EMAIL to verify end-to-end delivery.
 */
export const GET: APIRoute = async ({ url }) => {
  const notifyHealth = getNotifyHealth();
  const notifyConfig = getNotifyConfig();

  const hasSupabase =
    !!getSupabaseServiceClient() ||
    !!(getEnv('PUBLIC_SUPABASE_URL') && (getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY')));

  const webhookStatus = {
    DISCORD_WEBHOOK_URL: !!getEnv('DISCORD_WEBHOOK_URL'),
    DISCORD_FEEDBACK_WEBHOOK_IMPROVEMENT: !!getEnv('DISCORD_FEEDBACK_WEBHOOK_IMPROVEMENT'),
    DISCORD_FEEDBACK_WEBHOOK_BUG: !!getEnv('DISCORD_FEEDBACK_WEBHOOK_BUG'),
    DISCORD_FEEDBACK_WEBHOOK_CONTENT: !!getEnv('DISCORD_FEEDBACK_WEBHOOK_CONTENT'),
    DISCORD_REQUEST_SONG_WEBHOOK_URL: !!getEnv('DISCORD_REQUEST_SONG_WEBHOOK_URL'),
    DISCORD_TIP_WEBHOOK_URL: !!getEnv('DISCORD_TIP_WEBHOOK_URL'),
    DISCORD_COMMUNITY_CLIP_WEBHOOK_URL: !!getEnv('DISCORD_COMMUNITY_CLIP_WEBHOOK_URL'),
  };

  const health: Record<string, unknown> = {
    status: notifyConfig.hasResendKey ? 'ready' : 'degraded',
    message: notifyConfig.hasResendKey
      ? `Email delivery configured → ${notifyConfig.notifyEmail}`
      : 'RESEND_API_KEY missing — feedback & cover requests will be logged + stored to Supabase only (no email).',
    notifyEmail: notifyHealth,
    supabase: {
      configured: hasSupabase,
      urlPresent: !!getEnv('PUBLIC_SUPABASE_URL'),
      serviceKeyPresent: !!getEnv('SUPABASE_SERVICE_ROLE_KEY'),
      note: hasSupabase ? 'DB persistence active for feedback & cover requests' : 'DB persistence unavailable — check Supabase env vars.'
    },
    webhooks: webhookStatus,
    sandboxWarning: notifyConfig.isSandbox
      ? 'Sandbox FROM (onboarding@resend.dev) only delivers to Resend account owner. Verify kinsband.com at https://resend.com/domains then set RESEND_FROM_EMAIL="Kins Band <noreply@kinsband.com>" to deliver to HelloKinsFan@gmail.com.'
      : null,
    checks: {
      notifyEmailIsGmail: notifyConfig.notifyEmail.toLowerCase().endsWith('@gmail.com'),
      fromIsSandbox: notifyConfig.isSandbox,
      resendKeyValidFormat: notifyConfig.hasResendKey
    },
    timestamp: new Date().toISOString()
  };

  // Optional live send test — guarded by optional HEALTHCHECK_TOKEN
  const shouldSend = url.searchParams.get('check') === 'send';
  if (shouldSend) {
    const expectedToken = getEnv('HEALTHCHECK_TOKEN') || getEnv('NOTIFY_HEALTH_TOKEN');
    const providedToken = url.searchParams.get('token') || '';
    if (expectedToken && providedToken !== expectedToken) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Unauthorized health check token.', health }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!notifyConfig.hasResendKey) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Cannot send test — RESEND_API_KEY missing.', health }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const { sendNotifyEmail, generateBrutalistEmailHtml } = await import('../../lib/notifyEmail');
      const html = generateBrutalistEmailHtml({
        title: '✅ Kins Notify Health — Test OK',
        badge: 'HEALTH CHECK • RESEND',
        badgeBg: '#53fc18',
        badgeColor: '#000000',
        fields: [
          { label: 'Timestamp', value: new Date().toISOString(), isCode: true },
          { label: 'To', value: notifyConfig.notifyEmail, isCode: true },
          { label: 'From', value: notifyConfig.fromEmail, isCode: true },
          { label: 'Endpoint', value: '/api/notify-health?check=send' }
        ],
        description: 'If you received this, Resend is correctly delivering Feedback & Cover Request emails to HelloKinsFan@gmail.com',
        footerNote: 'Kins Notify Health Probe'
      });
      const result = await sendNotifyEmail({
        subject: '[Kins Health] Test email — notify pipeline OK',
        html,
        text: `Health probe OK at ${new Date().toISOString()} — Resend delivers to ${notifyConfig.notifyEmail}`
      });
      return new Response(
        JSON.stringify({
          status: result.ok ? 'success' : 'error',
          message: result.ok ? `Test email sent to ${notifyConfig.notifyEmail} (ID: ${result.id})` : `Test send failed: ${result.error}`,
          health,
          sendResult: result
        }),
        { status: result.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ status: 'error', message: String(err), health }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
};
