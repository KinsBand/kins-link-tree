import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { generalEmail } from '../../settings/contact.config';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';
import {
  getNotifyConfig,
  getNotifyHealth,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField
} from '../../lib/notifyEmail';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

function getDiscordWebhookUrl(): string {
  const env = (name: string): string => {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return String(process.env[name]).replace(/^["']|["']$/g, '').trim();
    }
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return String(import.meta.env[name]).replace(/^["']|["']$/g, '').trim();
    }
    return '';
  };

  return (
    env('DISCORD_REQUEST_SONG_WEBHOOK_URL') ||
    env('DISCORD_COVER_REQUEST_WEBHOOK_URL') ||
    env('DISCORD_COVERS_WEBHOOK_URL') ||
    env('DISCORD_WEBHOOK_URL')
  );
}

const RequestSongSchema = z.object({
  songTitle: z.string().min(1).max(120),
  artist: z.string().min(1).max(120),
  reason: z.string().max(1000).nullable().optional(),
  email: z.string().max(254).nullable().optional(),
  isSubscribed: z.boolean().nullable().optional(),
  requestType: z.enum(['video', 'setlist']).optional().default('video')
}).passthrough();

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
    const requestType = body.requestType === 'setlist' ? 'setlist' : 'video';
    const isSetlist = requestType === 'setlist';

    const notifyConfig = getNotifyConfig();

    // 0. Persistent fallback: store in Supabase so no cover request is ever lost
    let dbPersisted = false;
    try {
      const supabase = getSupabaseServiceClient();
      if (supabase) {
        const { error: dbError } = await supabase.from('cover_requests').insert({
          song_title: songTitle,
          artist,
          reason: reason === 'None provided' 
            ? (isSetlist ? '[Type: Live Setlist]' : null) 
            : (isSetlist ? `[Live Setlist] ${reason}` : reason),
          email: email === 'Not provided' ? null : email,
          is_subscribed: isSubscribed
        });
        if (!dbError) {
          dbPersisted = true;
        } else {
          if (
            (dbError as { code?: string }).code === 'PGRST205' ||
            dbError.message?.includes('Could not find the table') ||
            dbError.message?.includes('relation')
          ) {
            console.warn('[request-song] Table cover_requests missing — run supabase_schema_complete.sql in Supabase SQL Editor.');
          } else {
            console.warn('[request-song] DB insert failed:', dbError.message);
          }
        }
      } else {
        console.warn('[request-song] Supabase service client unavailable — skipping DB persistence (check PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
      }
    } catch (dbErr) {
      console.warn('[request-song] DB persistence exception:', dbErr);
    }

    if (!notifyConfig.resendApiKey) {
      console.warn('[request-song] RESEND_API_KEY missing — email will not be sent. Health:', getNotifyHealth(), {
        songTitle,
        artist,
        email,
        dbPersisted
      });
    }

    if (notifyConfig.isSandbox && notifyConfig.resendApiKey) {
      console.info('[request-song] Resend sandbox mode active (from:', notifyConfig.fromEmail, ') — if HelloKinsFan@gmail.com is not the Resend owner, delivery will 403 until a verified domain is added at https://resend.com/domains');
    }

    const subject = isSetlist
      ? `[Live Setlist Request] ${songTitle} - ${artist}`
      : `[Cover Request] ${songTitle} - ${artist}`;

    const typeLabel = isSetlist ? '⚡ Live Gig Performance' : '🎬 Cover Video Release';

    const fields: BrutalistField[] = [
      { label: 'Song Title', value: songTitle },
      { label: 'Original Artist', value: artist },
      { label: 'Request Type', value: typeLabel },
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
      title: isSetlist ? `⚡ Live Setlist Request: ${songTitle}` : `🎵 Cover Request: ${songTitle}`,
      badge: isSetlist ? 'LIVE SETLIST REQUEST' : (isSubscribed ? 'VIP SUBSCRIBER REQUEST' : 'FAN COVER REQUEST'),
      badgeBg: isSetlist ? '#ff9f1c' : (isSubscribed ? '#f2fd43' : '#e9e9eb'),
      badgeColor: '#000000',
      description: reason,
      fields,
      footerNote: `Kins Cover Request System • Forwarded to ${generalEmail}`
    });

    const isContactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // 1. Primary: Send structured HTML email via Resend
    let emailDelivered = false;
    if (notifyConfig.resendApiKey) {
      const emailResult = await sendNotifyEmail({
        subject,
        html,
        text: `${subject}\n\nType: ${typeLabel}\nFan Status: ${isSubscribed ? 'Subscribed' : 'Guest'}\nContact: ${email}\n\n${isSetlist ? 'Why should Kins play this live?' : 'Why should Kins cover this?'}\n${reason}`,
        replyTo: isContactEmail ? email : undefined
      });

      emailDelivered = emailResult.ok;
      if (!emailResult.ok) {
        console.warn('[request-song] Resend email delivery failed:', emailResult.error, '— Health:', getNotifyHealth());
      } else {
        console.info('[request-song] Email delivered via Resend to', notifyConfig.notifyEmail);
      }
    }

    // 2. Secondary: Send Discord webhook if configured
    let discordDelivered = false;
    const discordWebhookUrl = getDiscordWebhookUrl();
    if (discordWebhookUrl && discordWebhookUrl.startsWith('https://')) {
      try {
        const discordPayload = {
          username: 'Kins Cover Request System',
          avatar_url: AVATAR_URL,
          embeds: [
            {
              title: isSetlist ? '⚡ New Live Setlist Request' : '🎵 New Cover Song Request',
              color: isSetlist ? 0xff9f1c : (isSubscribed ? 0xf2fd43 : 0x5865f2),
              fields: [
                { name: 'Song Title', value: `**${songTitle}**`, inline: true },
                { name: 'Original Artist', value: `**${artist}**`, inline: true },
                { name: 'Request Type', value: `**${typeLabel}**`, inline: true },
                {
                  name: 'Fan Status',
                  value: isSubscribed
                    ? '✅ **Subscribed Fan** (Notified via Substack)'
                    : '👤 Guest / Unsubscribed',
                  inline: true
                },
                { name: isSetlist ? 'Why should Kins play this live?' : 'Why should Kins cover this?', value: reason, inline: false },
                { name: 'Contact Email', value: email === 'Not provided' ? 'Not provided' : `\`${email}\``, inline: false }
              ],
              footer: {
                text: `Kins Cover Request System • Forwarded to ${generalEmail}`
              },
              timestamp: new Date().toISOString()
            }
          ]
        };

        const res = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        });
        discordDelivered = res.ok;
      } catch (hookErr) {
        console.warn('[request-song] Discord webhook dispatch failed:', hookErr);
      }
    }

    console.info('[request-song] Processed —', {
      songTitle,
      artist,
      emailDelivered,
      discordDelivered,
      discordConfigured: !!(discordWebhookUrl && discordWebhookUrl.startsWith('https://')),
      dbPersisted,
      notifyEmail: notifyConfig.notifyEmail
    });

    return jsonResponse(
      {
        status: 'success',
        message: 'Cover request received!',
        delivered: emailDelivered || discordDelivered || dbPersisted,
        channel: emailDelivered ? 'email' : discordDelivered ? 'discord' : dbPersisted ? 'database' : 'logged'
      },
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
