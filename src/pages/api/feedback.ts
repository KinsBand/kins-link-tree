import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';
import {
  getNotifyConfig,
  getNotifyHealth,
  sendNotifyEmail,
  generateBrutalistEmailHtml,
  type BrutalistField,
  type EmailAttachment
} from '../../lib/notifyEmail';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

const FeedbackRequestSchema = z.object({
  feedback: z.object({
    type: z.string().max(100).nullable().optional(),
    category: z.string().max(100).nullable().optional(),
    user_message: z.string().max(4000).nullable().optional(),
    details: z.string().max(4000).nullable().optional(),
    contact: z.string().max(300).nullable().optional()
  }).passthrough().nullable().optional(),
  feedbackType: z.string().max(100).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  details: z.string().max(4000).nullable().optional(),
  contact: z.string().max(300).nullable().optional(),
  viewportWithDpr: z.string().max(200).nullable().optional(),
  viewport: z.string().max(200).nullable().optional(),
  environment: z.string().max(300).nullable().optional(),
  url: z.string().max(1000).nullable().optional(),
  formattedDate: z.string().max(200).nullable().optional(),
  lastError: z.string().max(2000).nullable().optional(),
  screenshotDataUrl: z.string().max(6_000_000).nullable().optional()
}).passthrough();

function getDiscordWebhookUrl(feedbackType: string): string {
  const env = (name: string): string => {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return String(process.env[name]).replace(/^["']|["']$/g, '').trim();
    }
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return String(import.meta.env[name]).replace(/^["']|["']$/g, '').trim();
    }
    return '';
  };

  if (feedbackType.includes('Bug')) {
    return env('DISCORD_FEEDBACK_WEBHOOK_BUG') || env('DISCORD_FEEDBACK_WEBHOOK_URL');
  }
  if (feedbackType.includes('Content')) {
    return env('DISCORD_FEEDBACK_WEBHOOK_CONTENT') || env('DISCORD_FEEDBACK_WEBHOOK_URL');
  }
  return env('DISCORD_FEEDBACK_WEBHOOK_IMPROVEMENT') || env('DISCORD_FEEDBACK_WEBHOOK_URL');
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ status: 'error', message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`feedback:${getClientIp(request)}`, 5, 60 * 1000)) {
      return jsonError('Too many requests. Please try again in a minute.', 429);
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = FeedbackRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.warn('[feedback] validation failed:', JSON.stringify(parsed.error.format()));
      return jsonError('Invalid feedback payload.', 400);
    }

    const body = parsed.data;
    const feedback = body.feedback || {};
    const feedbackType = sanitizeText(
      feedback.type || body.feedbackType || 'Improvement / Idea',
      40
    );
    const category = sanitizeText(feedback.category || body.category || 'General Site', 60);
    const details = sanitizeText(
      feedback.user_message || feedback.details || body.details || '',
      2000
    );
    const contact = sanitizeText(feedback.contact || body.contact || '', 200);

    if (!details) {
      return jsonError('Please provide feedback details.', 400);
    }

    const viewport = sanitizeText(body.viewportWithDpr || body.viewport || 'N/A', 80);
    const environment = sanitizeText(body.environment || 'Standard Browser', 120);
    const url = sanitizeText(body.url || '', 300);
    const formattedDate = sanitizeText(body.formattedDate || new Date().toISOString(), 40);
    const lastError = sanitizeText(body.lastError || '', 500);

    // Determine prefix tag & badge styling
    let subjectTypeTag = 'Improvement';
    let badgeBg = '#f2fd43';
    let badgeColor = '#000000';
    let embedColor = 0x3498db;
    let typeEmoji = '💡';

    if (feedbackType.toLowerCase().includes('bug') || feedbackType === 'bug_report') {
      subjectTypeTag = 'Bug';
      badgeBg = '#ef4444';
      badgeColor = '#ffffff';
      embedColor = 0xe74c3c;
      typeEmoji = '🐛';
    } else if (feedbackType.toLowerCase().includes('content')) {
      subjectTypeTag = 'Content';
      badgeBg = '#e67e22';
      badgeColor = '#ffffff';
      embedColor = 0xe67e22;
      typeEmoji = '📝';
    }

    const subject = `[Feedback][${subjectTypeTag}] ${category}`;

    // Optional screenshot attachment sent as data URL by the client
    const screenshotDataUrl =
      typeof body.screenshotDataUrl === 'string' &&
      /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(body.screenshotDataUrl) &&
      body.screenshotDataUrl.length <= 2_800_000
        ? body.screenshotDataUrl
        : null;

    const attachments: EmailAttachment[] = [];
    let screenshotExt = 'png';
    let screenshotBase64 = '';

    if (screenshotDataUrl) {
      const [meta, base64] = screenshotDataUrl.split(',');
      const extMatch = meta.match(/image\/(png|jpe?g|webp)/);
      screenshotExt = extMatch ? extMatch[1].replace('jpeg', 'jpg') : 'png';
      screenshotBase64 = base64;

      attachments.push({
        filename: `screenshot.${screenshotExt}`,
        content: base64,
        contentType: `image/${screenshotExt}`
      });
    }

    const fields: BrutalistField[] = [
      { label: 'Category', value: category },
      { label: 'Submitter', value: contact || 'Anonymous Fan', isCode: !!contact },
      { label: 'Viewport', value: viewport, isCode: true },
      { label: 'Environment', value: environment },
      { label: 'Timestamp', value: formattedDate }
    ];

    if (url && url !== 'https://kinsband.com') {
      fields.push({ label: 'Page URL', value: url, isLink: true, linkHref: url });
    }

    if (lastError) {
      fields.push({ label: 'Last Error', value: lastError, isCode: true });
    }

    if (attachments.length > 0) {
      fields.push({ label: 'Attachment', value: `screenshot.${screenshotExt} (Attached to email)` });
    }

    const html = generateBrutalistEmailHtml({
      title: `${typeEmoji} Feedback: ${category}`,
      badge: `FEEDBACK • ${subjectTypeTag.toUpperCase()}`,
      badgeBg,
      badgeColor,
      description: details,
      fields,
      footerNote: 'Kins Site Diagnostics'
    });

    const notifyConfig = getNotifyConfig();
    const discordWebhookUrl = getDiscordWebhookUrl(feedbackType);

    // 0. Persistent fallback: store in Supabase so no submission is ever lost
    let dbPersisted = false;
    try {
      const supabase = getSupabaseServiceClient();
      if (supabase) {
        const { error: dbError } = await supabase.from('feedback_submissions').insert({
          type: feedbackType,
          category,
          details,
          contact: contact || null,
          viewport,
          environment,
          url: url || null,
          has_screenshot: attachments.length > 0
        });
        if (!dbError) {
          dbPersisted = true;
        } else {
          // If table missing, log actionable hint
          if (
            (dbError as { code?: string }).code === 'PGRST205' ||
            dbError.message?.includes('Could not find the table') ||
            dbError.message?.includes('relation')
          ) {
            console.warn('[feedback] Table feedback_submissions missing — run supabase_schema_complete.sql in Supabase SQL Editor.');
          } else {
            console.warn('[feedback] DB insert failed:', dbError.message);
          }
        }
      } else {
        console.warn('[feedback] Supabase service client unavailable — skipping DB persistence (check PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in Vercel env).');
      }
    } catch (dbErr) {
      console.warn('[feedback] DB persistence exception:', dbErr);
    }

    if (!notifyConfig.resendApiKey && (!discordWebhookUrl || !discordWebhookUrl.startsWith('https://'))) {
      console.warn('[feedback] No delivery channel configured! RESEND_API_KEY and Discord webhooks both missing. Health:', getNotifyHealth(), {
        category,
        feedbackType,
        details: details.slice(0, 120),
        dbPersisted
      });
    }

    if (notifyConfig.isSandbox && notifyConfig.resendApiKey) {
      console.info('[feedback] Resend sandbox mode active (from:', notifyConfig.fromEmail, ') — if HelloKinsFan@gmail.com is not the Resend owner, delivery will 403 until a verified domain is added at https://resend.com/domains');
    }

    let emailDelivered = false;

    // 1. Primary: Send structured HTML email via Resend
    if (notifyConfig.resendApiKey) {
      const isContactEmail = contact.includes('@') && !contact.includes(' ');
      const emailResult = await sendNotifyEmail({
        subject,
        html,
        text: `[Feedback: ${subjectTypeTag}] ${category}\n\nSubmitter: ${contact || 'Anonymous'}\n\nMessage:\n${details}\n\nViewport: ${viewport}\nEnvironment: ${environment}\nDate: ${formattedDate}`,
        replyTo: isContactEmail ? contact : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      emailDelivered = emailResult.ok;
      if (!emailDelivered) {
        console.warn('[feedback] Resend email delivery failed:', emailResult.error);
      }
    }

    // 2. Secondary fallback: Send Discord webhook if configured
    if (discordWebhookUrl && discordWebhookUrl.startsWith('https://')) {
      try {
        const descriptionLines = [
          '**User Message:**',
          `"${details}"`,
          '',
          `• **Category:** ${category}`,
          `• **Submitter:** ${contact ? `\`${contact}\`` : '*Anonymous Fan*'}`,
          `• **Viewport:** \`${viewport}\``,
          `• **Environment:** ${environment}`,
          `• **Date:** ${formattedDate}`
        ];

        if (lastError) descriptionLines.push(`• **Last Error:** \`${lastError}\``);
        if (url && url !== 'https://kinsband.com') descriptionLines.push(`• **Page:** \`${url}\``);

        const embed = {
          title: `${typeEmoji} ${feedbackType}: ${category}`,
          description: descriptionLines.join('\n').slice(0, 4000),
          color: embedColor,
          footer: { text: 'Kins Site Diagnostics' },
          timestamp: new Date().toISOString()
        };

        if (screenshotDataUrl && screenshotBase64) {
          const buffer = Buffer.from(screenshotBase64, 'base64');
          const formData = new FormData();
          formData.append('payload_json', JSON.stringify({
            username: 'Kins Website Feedback',
            avatar_url: AVATAR_URL,
            embeds: [{ ...embed, image: { url: `attachment://screenshot.${screenshotExt}` } }]
          }));
          formData.append('files[0]', new Blob([buffer]), `screenshot.${screenshotExt}`);

          await fetch(discordWebhookUrl, { method: 'POST', body: formData }).catch(() => {});
        } else {
          await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Kins Website Feedback',
              avatar_url: AVATAR_URL,
              embeds: [embed]
            })
          }).catch(() => {});
        }
      } catch (hookErr) {
        console.warn('[feedback] Discord webhook fallback failed:', hookErr);
      }
    }

    // Always return success to user; server logs capture delivery health
    console.info('[feedback] Submission processed —', {
      category,
      feedbackType,
      hasScreenshot: attachments.length > 0,
      emailDelivered,
      discordConfigured: !!(discordWebhookUrl && discordWebhookUrl.startsWith('https://')),
      dbPersisted,
      notifyEmail: notifyConfig.notifyEmail
    });

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Feedback received! Thank you for helping Kins improve the site.',
        delivered: emailDelivered || dbPersisted,
        channel: emailDelivered ? 'email' : dbPersisted ? 'database' : 'logged'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Feedback API error:', err);
    return jsonError('Failed to process feedback.', 500);
  }
};
