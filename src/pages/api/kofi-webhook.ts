import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';
import {
  getNotifyConfig,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField
} from '../../lib/notifyEmail';

export const prerender = false;

function getEnv(key: string): string {
  return (import.meta.env[key] as string | undefined) || process.env[key] || '';
}

const KofiDataSchema = z.object({
  message_id: z.string().min(1).max(120),
  type: z.string().max(50).optional(),
  from_name: z.string().max(100).optional(),
  amount: z.union([z.string(), z.number()]),
  currency: z.string().max(10).optional(),
  message: z.string().max(500).optional(),
  is_public: z.union([z.boolean(), z.string()]).optional(),
  is_subscription_payment: z.boolean().optional()
}).passthrough();

/**
 * Ko-fi payment webhook. Ko-fi POSTs application/x-www-form-urlencoded with
 * a `data` field containing JSON. Confirmed tips land in `tips` and become
 * the ONLY source of live-chat superchats.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let raw = '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      raw = String(form.get('data') || '');
    } else {
      const body = await request.json().catch(() => null);
      raw = body && typeof body === 'object' ? String((body as { data?: string }).data || '') : '';
    }

    if (!raw) {
      return new Response('Missing payload', { status: 400 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch (_) {
      return new Response('Malformed payload', { status: 400 });
    }

    const validated = KofiDataSchema.safeParse(parsedJson);
    if (!validated.success) {
      return new Response('Invalid tip payload schema', { status: 400 });
    }

    const parsed = validated.data;

    const expectedToken = getEnv('KOFI_VERIFICATION_TOKEN');
    const providedToken =
      request.headers.get('x-kofi-token') ||
      new URL(request.url).searchParams.get('token') ||
      '';
    if (!expectedToken || providedToken !== expectedToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const amountNum = parseFloat(String(parsed.amount || '0').replace(/[^0-9.]/g, ''));
    if (!parsed.message_id || !Number.isFinite(amountNum) || amountNum <= 0) {
      return new Response('Invalid tip payload', { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      console.error('[kofi-webhook] Supabase service client unavailable.');
      return new Response('Storage unavailable', { status: 503 });
    }

    const supporterName = sanitizeText(String(parsed.from_name || 'Ko-fi Supporter'), 60);
    const tipMessage = sanitizeText(String(parsed.message || ''), 200);
    const currency = sanitizeText(String(parsed.currency || 'AUD'), 8) || 'AUD';
    const isPublic = parsed.is_public !== false && parsed.is_public !== 'false';

    const { error: upsertError } = await supabase.from('tips').upsert(
      {
        kofi_id: String(parsed.message_id).slice(0, 120),
        amount: amountNum,
        currency,
        supporter_name: supporterName,
        message: tipMessage,
        is_public: isPublic,
        published: true
      },
      { onConflict: 'kofi_id' }
    );

    if (upsertError) {
      console.error('[kofi-webhook] tip upsert failed:', upsertError.message);
      return new Response('Persist failed', { status: 502 });
    }

    // 1. Primary: Send email notification via Resend
    const notifyConfig = getNotifyConfig();
    if (notifyConfig.resendApiKey) {
      const subject = `[Ko-fi Tip] ${currency} ${amountNum.toFixed(2)} from ${supporterName}`;

      const fields: BrutalistField[] = [
        { label: 'Amount', value: `${currency} ${amountNum.toFixed(2)}` },
        { label: 'Supporter', value: supporterName },
        { label: 'Visibility', value: isPublic ? 'Public Superchat' : 'Private Tip' },
        { label: 'Ko-fi ID', value: String(parsed.message_id), isCode: true }
      ];

      const html = generateBrutalistEmailHtml({
        title: `💰 Confirmed Tip: ${currency} ${amountNum.toFixed(2)}`,
        badge: 'KO-FI TIP • CONFIRMED',
        badgeBg: '#f2fd43',
        badgeColor: '#000000',
        description: tipMessage || 'No message attached',
        fields,
        footerNote: 'Kins Tip Alert System'
      });

      sendNotifyEmail({
        subject,
        html,
        text: `[Ko-fi Tip] ${currency} ${amountNum.toFixed(2)} from ${supporterName}\n\nMessage:\n${tipMessage || '—'}\n\nPublic: ${isPublic}`
      }).catch((emailErr) => {
        console.warn('[kofi-webhook] Resend email alert failed:', emailErr);
      });
    }

    // 2. Secondary fallback: Send Discord webhook if configured
    const webhookUrl =
      import.meta.env.DISCORD_TIP_WEBHOOK_URL ||
      process.env.DISCORD_TIP_WEBHOOK_URL ||
      import.meta.env.DISCORD_COMMUNITY_WEBHOOK_URL ||
      process.env.DISCORD_COMMUNITY_WEBHOOK_URL ||
      '';

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Kins Tip Line',
            embeds: [
              {
                title: '💰 CONFIRMED TIP (via Ko-fi)',
                color: 0xf2fd43,
                description: `**Amount:** ${currency} ${amountNum.toFixed(2)}\n**From:** \`${supporterName}\`\n**Message:** ${tipMessage || '—'}`,
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (hookErr) {
        console.warn('[kofi-webhook] Discord alert failed:', hookErr);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('[kofi-webhook] error:', err);
    return new Response('Server error', { status: 500 });
  }
};
