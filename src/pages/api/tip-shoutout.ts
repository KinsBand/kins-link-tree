import type { APIRoute } from 'astro';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';
const AMOUNT_RE = /^\$?\d{1,4}(\.\d{1,2})?$/;

function getWebhookUrl(): string {
  return (
    import.meta.env.DISCORD_TIP_WEBHOOK_URL ||
    process.env.DISCORD_TIP_WEBHOOK_URL ||
    import.meta.env.DISCORD_COMMUNITY_WEBHOOK_URL ||
    process.env.DISCORD_COMMUNITY_WEBHOOK_URL ||
    ''
  );
}

/**
 * Fan shoutout intent submitted alongside opening the Ko-fi page.
 * This is NOT a payment confirmation — it is delivered to Discord flagged
 * as pending so the band can reconcile against the Ko-fi dashboard.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`tip-shoutout:${getClientIp(request)}`, 5, 60 * 1000)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Too many requests. Please try again in a minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid payload.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rawAmount = String(body.amount || '').trim();
    if (!AMOUNT_RE.test(rawAmount)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid tip amount.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const amount = rawAmount.startsWith('$') ? rawAmount : `$${rawAmount}`;
    const message = sanitizeText(String(body.message || ''), 200) || 'No message attached';

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      console.error('[tip-shoutout] No tip Discord webhook configured.');
      return new Response(
        JSON.stringify({ status: 'error', message: 'Shoutout service is not available right now.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const discordPayload = {
      username: 'Kins Tip Line',
      avatar_url: AVATAR_URL,
      embeds: [
        {
          title: '⚡ Tip Shoutout (PENDING PAYMENT)',
          color: 0x53fc18,
          description: `**Amount (intended):** ${amount}\n**Message:** ${message}`,
          footer: { text: 'Reconcile against Ko-fi dashboard — payment not yet confirmed.' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordRes.ok) {
      const resText = await discordRes.text().catch(() => '');
      console.error('[tip-shoutout] Discord webhook failed:', discordRes.status, resText.slice(0, 200));
      return new Response(
        JSON.stringify({ status: 'error', message: 'Could not send your shoutout right now.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'success', message: 'Shoutout sent to the band!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[tip-shoutout] error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to process shoutout.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
