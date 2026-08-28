import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { generalEmail } from '../../settings/contact.config';
import {
  getNotifyConfig,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField
} from '../../lib/notifyEmail';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

const RequestSongSchema = z.object({
  songTitle: z.string().min(1).max(120),
  artist: z.string().min(1).max(120),
  reason: z.string().max(1000).nullable().optional(),
  email: z.string().max(254).nullable().optional(),
  isSubscribed: z.boolean().nullable().optional()
}).passthrough();

function getDiscordWebhookUrl(): string {
  if (typeof process !== 'undefined' && process.env && process.env.DISCORD_REQUEST_SONG_WEBHOOK_URL) {
    return String(process.env.DISCORD_REQUEST_SONG_WEBHOOK_URL).replace(/^["']|["']$/g, '').trim();
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DISCORD_REQUEST_SONG_WEBHOOK_URL) {
    return String(import.meta.env.DISCORD_REQUEST_SONG_WEBHOOK_URL).replace(/^["']|["']$/g, '').trim();
  }
  return '';
}

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`request-song:${getClientIp(request)}`, 5, 60 * 1000)) {
      return jsonResponse(
        { status: 'error', message: 'Too many requests. Please try again in a minute.' },
        429
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = RequestSongSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonResponse(
        { status: 'error', message: 'Please provide valid Song Title and Original Artist.' },
        400
      );
    }

    const body = parsed.data;
    const songTitle = sanitizeText(body.songTitle, 120);
    const artist = sanitizeText(body.artist, 120);
    const reason = sanitizeText(body.reason || '', 500) || 'None provided';
    const email = sanitizeText(body.email || '', 200) || 'Not provided';
    const isSubscribed = body.isSubscribed === true;

    const notifyConfig = getNotifyConfig();
    const discordWebhookUrl = getDiscordWebhookUrl();

    if (!notifyConfig.resendApiKey && (!discordWebhookUrl || !discordWebhookUrl.startsWith('https://'))) {
      console.error('[request-song] Neither Resend API key nor Discord webhook is configured.');
      return jsonResponse(
        { status: 'error', message: 'Cover request service is not available right now.' },
        503
      );
    }

    const subject = `[Cover Request] ${songTitle} - ${artist}`;

    const fields: BrutalistField[] = [
      { label: 'Song Title', value: songTitle },
      { label: 'Original Artist', value: artist },
      {
        label: 'Fan Status',
        value: isSubscribed ? 'Subscribed Fan (Substack)' : 'Guest / Unsubscribed'
      },
      {
        label: 'Fan Email',
        value: email,
        isCode: email !== 'Not provided'
      }
    ];

    const html = generateBrutalistEmailHtml({
      title: `🎵 Cover Request: ${songTitle}`,
      badge: isSubscribed ? 'VIP SUBSCRIBER REQUEST' : 'FAN COVER REQUEST',
      badgeBg: isSubscribed ? '#f2fd43' : '#e9e9eb',
      badgeColor: '#000000',
      description: reason,
      fields,
      footerNote: `Kins Cover Request System • Forwarded to ${generalEmail}`
    });

    const isContactEmail = email.includes('@') && !email.includes(' ');

    // 1. Primary: Send structured HTML email via Resend
    if (notifyConfig.resendApiKey) {
      const emailResult = await sendNotifyEmail({
        subject,
        html,
        text: `[Cover Request] ${songTitle} - ${artist}\n\nFan Status: ${isSubscribed ? 'Subscribed' : 'Guest'}\nContact: ${email}\n\nWhy should Kins cover this?\n${reason}`,
        replyTo: isContactEmail ? email : undefined
      });

      if (!emailResult.ok) {
        console.warn('[request-song] Resend email delivery failed:', emailResult.error);
      }
    }

    // 2. Secondary fallback: Send Discord webhook if configured
    if (discordWebhookUrl && discordWebhookUrl.startsWith('https://')) {
      try {
        const discordPayload = {
          username: 'Kins Cover Request System',
          avatar_url: AVATAR_URL,
          embeds: [
            {
              title: '🎵 New Cover Song Request',
              color: isSubscribed ? 0xf2fd43 : 0x5865f2,
              fields: [
                { name: 'Song Title', value: `**${songTitle}**`, inline: true },
                { name: 'Original Artist', value: `**${artist}**`, inline: true },
                {
                  name: 'Fan Status',
                  value: isSubscribed
                    ? '✅ **Subscribed Fan** (Notified via Substack)'
                    : '👤 Guest / Unsubscribed',
                  inline: true
                },
                { name: 'Why should Kins cover this?', value: reason, inline: false },
                { name: 'Contact Email', value: email === 'Not provided' ? 'Not provided' : `\`${email}\``, inline: false }
              ],
              footer: {
                text: `Kins Cover Request System • Forwarded to ${generalEmail}`
              },
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
        console.warn('[request-song] Discord webhook fallback failed:', hookErr);
      }
    }

    return jsonResponse(
      { status: 'success', message: 'Cover request received!' },
      200
    );
  } catch (err) {
    console.error('Request song API error:', err);
    return jsonResponse(
      { status: 'error', message: 'Failed to process cover request.' },
      500
    );
  }
};
