import type { APIRoute } from 'astro';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { isValidHttpUrl, sanitizeText } from '../../lib/sanitize';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

function getWebhookUrl(): string {
  return (
    import.meta.env.DISCORD_COMMUNITY_CLIP_WEBHOOK_URL ||
    process.env.DISCORD_COMMUNITY_CLIP_WEBHOOK_URL ||
    ''
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`community-clip:${getClientIp(request)}`, 5, 60 * 1000)) {
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

    const clipUrl = typeof body.url === 'string' ? body.url.trim() : '';
    if (!isValidHttpUrl(clipUrl)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please provide a valid video or post link.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const category = sanitizeText(body.category, 60) || 'Other';
    const handle = sanitizeText(body.handle, 80);
    const title = sanitizeText(body.title, 120);

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      console.error('[community-submission] DISCORD_COMMUNITY_CLIP_WEBHOOK_URL is not configured.');
      return new Response(
        JSON.stringify({ status: 'error', message: 'Clip submission service is not available right now.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordRes.ok) {
      const resText = await discordRes.text().catch(() => '');
      console.error('[community-submission] Discord webhook failed:', discordRes.status, resText.slice(0, 200));
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to submit your clip. Please try again later.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'success', message: 'Clip submitted!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Community submission API error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to process clip submission.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
