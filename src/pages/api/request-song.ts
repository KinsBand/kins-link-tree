import type { APIRoute } from 'astro';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { generalEmail } from '../../settings/contact.config';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

function getWebhookUrl(): string {
  return (
    import.meta.env.DISCORD_REQUEST_SONG_WEBHOOK_URL ||
    process.env.DISCORD_REQUEST_SONG_WEBHOOK_URL ||
    ''
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`request-song:${getClientIp(request)}`, 5, 60 * 1000)) {
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

    const songTitle = sanitizeText(body.songTitle, 120);
    const artist = sanitizeText(body.artist, 120);

    if (!songTitle || !artist) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please provide both Song Title and Original Artist.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reason = sanitizeText(body.reason, 500) || 'None provided';
    const email = sanitizeText(body.email, 200) || 'Not provided';
    const isSubscribed = body.isSubscribed === true;

    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      console.error('[request-song] DISCORD_REQUEST_SONG_WEBHOOK_URL is not configured.');
      return new Response(
        JSON.stringify({ status: 'error', message: 'Cover request service is not available right now.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!discordRes.ok) {
      const resText = await discordRes.text().catch(() => '');
      console.error('[request-song] Discord webhook failed:', discordRes.status, resText.slice(0, 200));
      return new Response(
        JSON.stringify({ status: 'error', message: 'Failed to submit your request. Please try again later.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ status: 'success', message: 'Cover request received!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Request song API error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to process cover request.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
