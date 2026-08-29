import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

const StoreWaitlistSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  productTitle: z.string().max(200).optional().default('General Merch Drop')
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ status: 'error', message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`store-waitlist:${ip}`, 5, 60 * 1000)) {
      return jsonError('Too many requests. Please try again in a minute.', 429);
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = StoreWaitlistSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError('Please provide a valid email address.', 400);
    }

    const email = sanitizeText(parsed.data.email, 255);
    const productTitle = sanitizeText(parsed.data.productTitle, 200);

    // 1. Supabase persistence
    let dbSaved = false;
    try {
      const supabase = getSupabaseServiceClient();
      if (supabase) {
        const { error } = await supabase.from('subscribers').insert({
          email,
          source: `store_waitlist:${productTitle.slice(0, 50)}`,
          status: 'active'
        });
        if (!error) dbSaved = true;
      }
    } catch (dbErr) {
      console.warn('[store-waitlist] Supabase insert note:', dbErr);
    }

    // 2. Discord Webhook notification
    const env = (name: string): string => {
      if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return String(process.env[name]).replace(/^["']|["']$/g, '').trim();
      }
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
        return String(import.meta.env[name]).replace(/^["']|["']$/g, '').trim();
      }
      return '';
    };

    const webhookUrl = env('DISCORD_COMMUNITY_WEBHOOK_URL') || env('DISCORD_FEEDBACK_WEBHOOK_URL') || env('DISCORD_WEBHOOK_URL');
    if (webhookUrl && webhookUrl.startsWith('https://')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Kins Merch Alert Bot',
            avatar_url: AVATAR_URL,
            embeds: [
              {
                title: '🛍️ New Store Drop Waitlist Signup',
                description: `A fan joined the drop alert list for **${productTitle}**!`,
                fields: [
                  { name: 'Fan Email', value: `\`${email}\``, inline: true },
                  { name: 'Product', value: productTitle, inline: true },
                  { name: 'Timestamp', value: new Date().toISOString(), inline: false }
                ],
                color: 0xf2fd43,
                footer: { text: 'Kins Official Store Engine' }
              }
            ]
          })
        });
      } catch (hookErr) {
        console.warn('[store-waitlist] Discord dispatch warning:', hookErr);
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Successfully joined the waitlist! You will be the first to know.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[store-waitlist] Error:', err);
    return jsonError('Server error processing waitlist request.', 500);
  }
};
