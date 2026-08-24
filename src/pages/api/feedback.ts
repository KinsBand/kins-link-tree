import type { APIRoute } from 'astro';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';

export const prerender = false;

const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

function getWebhookUrl(feedbackType: string): string {
  const env = (name: string): string =>
    (import.meta.env[name] as string | undefined) || process.env[name] || '';

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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid payload.', 400);
    }

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

    // Route to the correct Discord channel based on feedback type
    let embedColor = 0x3498db;
    let typeEmoji = '💡';

    if (feedbackType.includes('Bug') || feedbackType === 'bug_report') {
      embedColor = 0xe74c3c;
      typeEmoji = '🐛';
    } else if (feedbackType.includes('Content')) {
      embedColor = 0xe67e22;
      typeEmoji = '📝';
    }

    const webhookUrl = getWebhookUrl(feedbackType);
    if (!webhookUrl || !webhookUrl.startsWith('https://')) {
      console.error('[feedback] No Discord feedback webhook configured for type:', feedbackType);
      return jsonError('Feedback service is not available right now. Please try again later.', 503);
    }

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

    if (lastError) {
      descriptionLines.push(`• **Last Error:** \`${lastError}\``);
    }

    if (url && url !== 'https://kinsband.com') {
      descriptionLines.push(`• **Page:** \`${url}\``);
    }

    const embed: Record<string, unknown> = {
      title: `${typeEmoji} ${feedbackType}: ${category}`,
      description: descriptionLines.join('\n').slice(0, 4000),
      color: embedColor,
      footer: { text: 'Kins Site Diagnostics' },
      timestamp: new Date().toISOString()
    };

    // Optional screenshot attachment sent as data URL by the client
    const screenshotDataUrl =
      typeof body.screenshotDataUrl === 'string' &&
      /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(body.screenshotDataUrl) &&
      body.screenshotDataUrl.length <= 2_800_000
        ? body.screenshotDataUrl
        : null;

    let discordRes: Response;

    if (screenshotDataUrl) {
      const [meta, base64] = screenshotDataUrl.split(',');
      const extMatch = meta.match(/image\/(png|jpe?g|webp)/);
      const ext = extMatch ? extMatch[1].replace('jpeg', 'jpg') : 'png';
      const buffer = Buffer.from(base64, 'base64');

      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({
        username: 'Kins Website Feedback',
        avatar_url: AVATAR_URL,
        embeds: [{ ...embed, image: { url: `attachment://screenshot.${ext}` } }]
      }));
      formData.append('files[0]', new Blob([buffer]), `screenshot.${ext}`);

      discordRes = await fetch(webhookUrl, { method: 'POST', body: formData });
    } else {
      discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Kins Website Feedback',
          avatar_url: AVATAR_URL,
          embeds: [embed]
        })
      });
    }

    if (!discordRes.ok) {
      const resText = await discordRes.text().catch(() => '');
      console.error('[feedback] Discord webhook failed:', discordRes.status, resText.slice(0, 200));
      return jsonError("Couldn't deliver your feedback. Please try again later.", 502);
    }

    return new Response(
      JSON.stringify({ status: 'success', message: 'Feedback received! Thank you for helping Kins improve the site.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Feedback API error:', err);
    return jsonError('Failed to process feedback.', 500);
  }
};
