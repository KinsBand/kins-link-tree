import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { isValidHttpUrl, sanitizeText } from '../../lib/sanitize';
import {
  getNotifyConfig,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField
} from '../../lib/notifyEmail';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

const CommunitySubmissionSchema = z.object({
  url: z.string().min(1).max(1000),
  category: z.string().max(100).nullable().optional(),
  handle: z.string().max(100).nullable().optional(),
  title: z.string().max(200).nullable().optional()
}).passthrough();

function getDiscordWebhookUrl(): string {
  if (typeof process !== 'undefined' && process.env && process.env.DISCORD_COMMUNITY_CLIP_WEBHOOK_URL) {
    return String(process.env.DISCORD_COMMUNITY_CLIP_WEBHOOK_URL).replace(/^["']|["']$/g, '').trim();
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DISCORD_COMMUNITY_CLIP_WEBHOOK_URL) {
    return String(import.meta.env.DISCORD_COMMUNITY_CLIP_WEBHOOK_URL).replace(/^["']|["']$/g, '').trim();
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
    if (isRateLimited(`community-clip:${getClientIp(request)}`, 5, 60 * 1000)) {
      return jsonResponse(
        { status: 'error', message: 'Too many requests. Please try again in a minute.' },
        429
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = CommunitySubmissionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonResponse(
        { status: 'error', message: 'Invalid clip submission payload.' },
        400
      );
    }

    const body = parsed.data;
    const clipUrl = body.url.trim();
    if (!isValidHttpUrl(clipUrl)) {
      return jsonResponse(
        { status: 'error', message: 'Please provide a valid video or post link.' },
        400
      );
    }

    const category = sanitizeText(body.category || '', 60) || 'Other';
    const handle = sanitizeText(body.handle || '', 80);
    const title = sanitizeText(body.title || '', 120);

    const notifyConfig = getNotifyConfig();
    const discordWebhookUrl = getDiscordWebhookUrl();

    if (!notifyConfig.resendApiKey && (!discordWebhookUrl || !discordWebhookUrl.startsWith('https://'))) {
      console.warn('[community-submission] Received clip submission (Note: RESEND_API_KEY and Discord webhooks not configured in env):', {
        category,
        title,
        clipUrl
      });
    }

    const subject = `[Community Clip][${category}] ${title || 'Untitled'}`;

    const fields: BrutalistField[] = [
      { label: 'Category', value: category },
      { label: 'Social Handle', value: handle || 'Not provided', isCode: !!handle },
      { label: 'Song / Title', value: title || 'Untitled' },
      {
        label: 'Video Link',
        value: clipUrl,
        isLink: true,
        linkHref: clipUrl
      }
    ];

    const html = generateBrutalistEmailHtml({
      title: `🎬 Community Clip: ${title || 'New Fan Video'}`,
      badge: `FAN CLIP • ${category.toUpperCase()}`,
      badgeBg: '#57f287',
      badgeColor: '#000000',
      fields,
      footerNote: 'Kins Community Hub Dispatch'
    });

    // 1. Primary: Send structured HTML email via Resend
    if (notifyConfig.resendApiKey) {
      const emailResult = await sendNotifyEmail({
        subject,
        html,
        text: `[Community Clip: ${category}] ${title || 'Untitled'}\n\nHandle: ${handle || 'N/A'}\nLink: ${clipUrl}`
      });

      if (!emailResult.ok) {
        console.warn('[community-submission] Resend email delivery failed:', emailResult.error);
      }
    }

    // 2. Secondary fallback: Send Discord webhook if configured
    if (discordWebhookUrl && discordWebhookUrl.startsWith('https://')) {
      try {
        const discordPayload = {
          username: 'Kins Community Hub',
          avatar_url: AVATAR_URL,
          embeds: [
            {
              title: '🎬 New Fan Clip Submission',
              color: 0x57f287,
              fields: [
                { name: 'Category', value: `**${category}**`, inline: true },
                { name: 'Social Handle', value: handle ? `\`${handle}\`` : '*Not provided*', inline: true },
                { name: 'Song / Title', value: title || 'Untitled', inline: true },
                {
                  name: 'Video / Post Link',
                  value: `[Watch Clip / Open Post](${clipUrl})\n\`${clipUrl}\``,
                  inline: false
                }
              ],
              footer: { text: 'Kins Community Hub' },
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
        console.warn('[community-submission] Discord webhook fallback failed:', hookErr);
      }
    }

    return jsonResponse(
      { status: 'success', message: 'Clip submitted!' },
      200
    );
  } catch (err) {
    console.error('Community submission API error:', err);
    return jsonResponse(
      { status: 'error', message: 'Failed to process clip submission.' },
      500
    );
  }
};
