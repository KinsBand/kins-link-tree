import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

const MerchIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.string().max(100).optional().default('T-Shirt / Apparel'),
  link: z.string().max(1000).optional().nullable(),
  contact: z.string().min(1, 'Contact is required').max(200)
});

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(`merch-idea:${ip}`, 5, 60 * 1000)) {
      return jsonResponse({ status: 'error', message: 'Too many requests. Please try again in a minute.' }, 429);
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = MerchIdeaSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonResponse({ status: 'error', message: 'Please fill in all required fields.' }, 400);
    }

    const title = sanitizeText(parsed.data.title, 200);
    const description = sanitizeText(parsed.data.description, 2000);
    const category = sanitizeText(parsed.data.category, 100);
    const link = parsed.data.link ? sanitizeText(parsed.data.link, 1000) : '';
    const contact = sanitizeText(parsed.data.contact, 200);

    // 1. Supabase persistence
    try {
      const supabase = getSupabaseServiceClient();
      if (supabase) {
        await supabase.from('feedback_submissions').insert({
          type: 'Merch Design Idea',
          category,
          details: `[Title: ${title}]\n\n${description}${link ? `\n\n[Reference: ${link}]` : ''}`,
          contact
        });
      }
    } catch (dbErr) {
      console.warn('[merch-idea] DB note:', dbErr);
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
            username: 'Kins Merch Idea Bot',
            avatar_url: AVATAR_URL,
            embeds: [
              {
                title: `💡 New Fan Merch Idea: ${title}`,
                description: description,
                fields: [
                  { name: 'Category', value: category, inline: true },
                  { name: 'Submitter', value: `\`${contact}\``, inline: true },
                  ...(link ? [{ name: 'Reference Link', value: link, inline: false }] : []),
                  { name: 'Submitted At', value: new Date().toISOString(), inline: false }
                ],
                color: 0xf2fd43,
                footer: { text: 'Kins Official Store Ideas' }
              }
            ]
          })
        });
      } catch (hookErr) {
        console.warn('[merch-idea] Discord webhook warning:', hookErr);
      }
    }

    return jsonResponse({
      status: 'success',
      message: 'Merch design idea submitted! Thank you for supporting Kins.'
    }, 200);
  } catch (err) {
    console.error('[merch-idea] Error:', err);
    return jsonResponse({ status: 'error', message: 'Internal server error.' }, 500);
  }
};
