import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import {
  getNotifyConfig,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField
} from '../../lib/notifyEmail';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';
const AMOUNT_RE = /^\$?\d{1,4}(\.\d{1,2})?$/;

const TipShoutoutSchema = z.object({
  amount: z.string().regex(AMOUNT_RE, 'Invalid tip amount'),
  message: z.string().max(400).nullable().optional()
}).passthrough();

function getDiscordWebhookUrl(): string {
  if (typeof process !== 'undefined' && process.env) {
    const url = process.env.DISCORD_TIP_WEBHOOK_URL || process.env.DISCORD_COMMUNITY_WEBHOOK_URL;
    if (url) return String(url).replace(/^["']|["']$/g, '').trim();
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const url = import.meta.env.DISCORD_TIP_WEBHOOK_URL || import.meta.env.DISCORD_COMMUNITY_WEBHOOK_URL;
    if (url) return String(url).replace(/^["']|["']$/g, '').trim();
  }
  return '';
}

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Fan shoutout intent submitted alongside opening the Ko-fi page.
 * This is NOT a payment confirmation — it is delivered flagged as pending
 * so the band can reconcile against the Ko-fi dashboard.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`tip-shoutout:${getClientIp(request)}`, 5, 60 * 1000)) {
      return jsonResponse(
        { status: 'error', message: 'Too many requests. Please try again in a minute.' },
        429
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = TipShoutoutSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonResponse(
        { status: 'error', message: 'Invalid tip amount or payload.' },
        400
      );
    }

    const body = parsed.data;
    const rawAmount = body.amount.trim();
    const amount = rawAmount.startsWith('$') ? rawAmount : `$${rawAmount}`;
    const message = sanitizeText(body.message || '', 200) || 'No message attached';

    const notifyConfig = getNotifyConfig();
    const discordWebhookUrl = getDiscordWebhookUrl();

    if (!notifyConfig.resendApiKey && (!discordWebhookUrl || !discordWebhookUrl.startsWith('https://'))) {
      console.error('[tip-shoutout] Neither Resend API key nor Discord webhook is configured.');
      return jsonResponse(
        { status: 'error', message: 'Shoutout service is not available right now.' },
        503
      );
    }

    const subject = `[Tip Shoutout][Pending] ${amount} from Fan`;

    const fields: BrutalistField[] = [
      { label: 'Intended Amount', value: amount },
      { label: 'Status', value: 'Pending Ko-fi Reconciliation' }
    ];

    const html = generateBrutalistEmailHtml({
      title: `⚡ Tip Shoutout: ${amount}`,
      badge: 'TIP SHOUTOUT • PENDING PAYMENT',
      badgeBg: '#53fc18',
      badgeColor: '#000000',
      description: message,
      fields,
      footerNote: 'Reconcile against Ko-fi dashboard — payment not yet confirmed'
    });

    // 1. Primary: Send email notification via Resend
    if (notifyConfig.resendApiKey) {
      const emailResult = await sendNotifyEmail({
        subject,
        html,
        text: `[Tip Shoutout: Pending] ${amount}\n\nMessage:\n${message}\n\nNote: Reconcile against Ko-fi dashboard.`
      });

      if (!emailResult.ok) {
        console.warn('[tip-shoutout] Resend email delivery failed:', emailResult.error);
      }
    }

    // 2. Secondary fallback: Send Discord webhook if configured
    if (discordWebhookUrl && discordWebhookUrl.startsWith('https://')) {
      try {
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

        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        }).catch(() => {});
      } catch (hookErr) {
        console.warn('[tip-shoutout] Discord webhook fallback failed:', hookErr);
      }
    }

    return jsonResponse(
      { status: 'success', message: 'Shoutout sent to the band!' },
      200
    );
  } catch (err) {
    console.error('[tip-shoutout] error:', err);
    return jsonResponse(
      { status: 'error', message: 'Failed to process shoutout.' },
      500
    );
  }
};
