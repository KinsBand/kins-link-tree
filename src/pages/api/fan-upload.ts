import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';
import {
  getNotifyConfig,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField
} from '../../lib/notifyEmail';

export const prerender = false;

const MIN_BYTES = 1024;
const MAX_BYTES = 83886080; // 80 MB — mirrors fan_uploads.byte_size check + bucket limit
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm'
]);
const GIG_ID_RE = /^[a-zA-Z0-9_-]{1,60}$/;
const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

const FanUploadFormSchema = z.object({
  caption: z.string().max(240).optional().default(''),
  handle: z.string().max(60).optional().default(''),
  gigId: z.string().regex(GIG_ID_RE, 'Invalid gig reference').optional().or(z.literal(''))
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function resolveWebhookUrl(): string {
  return (
    (import.meta.env.DISCORD_FAN_UPLOAD_WEBHOOK_URL as string | undefined) ||
    process.env.DISCORD_FAN_UPLOAD_WEBHOOK_URL ||
    (import.meta.env.DISCORD_COMMUNITY_WEBHOOK_URL as string | undefined) ||
    process.env.DISCORD_COMMUNITY_WEBHOOK_URL ||
    ''
  );
}

/** Strips path components and any character that could escape a storage key or HTML attr. */
function safeFilename(name: unknown): string {
  const base = String(name || '').split(/[\\/]/).pop() || '';
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 120);
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'media.bin';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`fan-upload:${getClientIp(request)}`, 5, 10 * 60 * 1000)) {
      return json({ status: 'error', message: 'Upload limit reached. Please try again in about 10 minutes.' }, 429);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json({ status: 'error', message: 'Invalid upload payload.' }, 400);
    }

    const rawFile = form.get('file');
    if (!rawFile || typeof rawFile !== 'object' || typeof (rawFile as File).arrayBuffer !== 'function') {
      return json({ status: 'error', message: 'Please attach a photo or video file.' }, 400);
    }
    const file = rawFile as File;

    if (file.size < MIN_BYTES || file.size > MAX_BYTES) {
      return json(
        { status: 'error', message: 'File must be between 1 KB and 80 MB.' },
        400
      );
    }

    const mime = String(file.type || '').toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      return json(
        { status: 'error', message: 'Unsupported file type. Use JPG, PNG, WEBP, HEIC, MP4, MOV or WEBM.' },
        415
      );
    }
    const mediaType = mime.startsWith('video/') ? 'video' : 'image';

    const parsedFields = FanUploadFormSchema.safeParse({
      caption: form.get('caption')?.toString() || '',
      handle: form.get('handle')?.toString() || '',
      gigId: form.get('gigId')?.toString() || undefined
    });

    if (!parsedFields.success) {
      return json({ status: 'error', message: 'Invalid form fields in upload payload.' }, 400);
    }

    const caption = sanitizeText(parsedFields.data.caption, 240);
    const handle = sanitizeText(parsedFields.data.handle, 60);
    const gigId = parsedFields.data.gigId || '';

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      console.error('[fan-upload] Supabase service client unavailable.');
      return json({ status: 'error', message: 'Upload service is not available right now.' }, 503);
    }

    const uploadPath = `pending/${crypto.randomUUID()}-${safeFilename(file.name)}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('fan-uploads')
      .upload(uploadPath, fileBuffer, { contentType: mime });

    if (uploadError) {
      console.error('[fan-upload] storage upload failed:', uploadError.message);
      return json({ status: 'error', message: 'Could not store your file. Please try again.' }, 502);
    }

    const { error: insertError } = await supabase.from('fan_uploads').insert({
      storage_path: uploadPath,
      media_type: mediaType,
      mime_type: mime,
      byte_size: file.size,
      caption: caption || null,
      handle: handle || null,
      gig_id: gigId || null,
      status: 'pending'
    });

    if (insertError) {
      console.error('[fan-upload] row insert failed:', insertError.message);
      // Don't leave orphaned objects behind when the DB write fails.
      await supabase.storage.from('fan-uploads').remove([uploadPath]).catch(() => {});
      return json({ status: 'error', message: 'Could not register your upload. Please try again.' }, 502);
    }

    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const captionPreview = caption ? caption.slice(0, 300) : '—';
    const filename = safeFilename(file.name);

    // 1. Primary: Best-effort moderation alert email via Resend
    const notifyConfig = getNotifyConfig();
    if (notifyConfig.resendApiKey) {
      const subject = `[Fan Upload][Moderation] ${filename}`;

      const fields: BrutalistField[] = [
        { label: 'File', value: filename, isCode: true },
        { label: 'Size', value: `${sizeKb} KB` },
        { label: 'Type', value: `${mediaType} (${mime})` },
        { label: 'Handle', value: handle || 'Not provided', isCode: !!handle },
        { label: 'Gig Ref', value: gigId || 'None' }
      ];

      const html = generateBrutalistEmailHtml({
        title: `📸 New Fan Upload: ${filename}`,
        badge: 'FAN UPLOAD • MODERATION',
        badgeBg: '#f2fd43',
        badgeColor: '#000000',
        description: captionPreview !== '—' ? captionPreview : undefined,
        fields,
        footerNote: 'Approve or move to approved/ folder in Supabase to publish.'
      });

      sendNotifyEmail({
        subject,
        html,
        text: `[Fan Upload: Moderation] ${filename}\n\nSize: ${sizeKb} KB\nHandle: ${handle || 'N/A'}\nGig: ${gigId || 'N/A'}\nCaption: ${captionPreview}`
      }).catch((emailErr) => {
        console.warn('[fan-upload] Resend moderation email alert failed:', emailErr);
      });
    }

    // 2. Secondary: Best-effort Discord webhook alert
    const webhookUrl = resolveWebhookUrl();
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Kins Fan Wall Moderation',
            avatar_url: AVATAR_URL,
            embeds: [
              {
                title: '📸 New Fan Upload Awaiting Approval',
                color: 0xf2fd43,
                description: captionPreview,
                fields: [
                  { name: 'File', value: `\`${filename}\``, inline: true },
                  { name: 'Size', value: `${sizeKb} KB`, inline: true },
                  { name: 'Type', value: `${mediaType} (${mime})`, inline: true },
                  { name: 'Handle', value: handle ? `\`${handle}\`` : '*Not provided*', inline: true },
                  { name: 'Gig', value: gigId || '*None*', inline: true }
                ],
                footer: { text: 'Approve/move to approved/ folder in Supabase to publish.' },
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (err) {
        console.warn('[fan-upload] moderation webhook failed:', err);
      }
    }

    return json({
      status: 'success',
      message: 'Upload received! It will appear on the fan wall once approved.'
    });
  } catch (err) {
    console.error('Fan upload API error:', err);
    return json({ status: 'error', message: 'Failed to process your upload.' }, 500);
  }
};
