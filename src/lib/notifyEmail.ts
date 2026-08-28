import { generalEmail } from '../settings/contact.config';

/**
 * Pure server-side email dispatch utility using Resend REST API.
 * NEVER import this file into client components (src/components/** or src/scripts/**).
 */

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string
  contentType?: string;
}

export interface SendNotifyEmailOptions {
  to?: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendNotifyEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  status?: number;
}

export interface NotifyConfig {
  notifyEmail: string;
  resendApiKey: string;
  fromEmail: string;
  replyToEmail: string;
}

function getEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
}

/**
 * Resolves destination and sender configuration for notification emails.
 */
export function getNotifyConfig(): NotifyConfig {
  const notifyEmail =
    getEnv('NOTIFY_EMAIL') ||
    getEnv('HELLO_EMAIL') ||
    generalEmail ||
    'HelloKinsBand@gmail.com';

  const resendApiKey = getEnv('RESEND_API_KEY').trim();
  const fromEmail = getEnv('RESEND_FROM_EMAIL') || 'Kins Band <onboarding@resend.dev>';
  const replyToEmail = getEnv('RESEND_REPLY_TO') || notifyEmail;

  return {
    notifyEmail,
    resendApiKey,
    fromEmail,
    replyToEmail
  };
}

/**
 * Helper to pause execution for backoff retries.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dispatches an email notification via Resend with automatic retry on 429 burst limits.
 */
export async function sendNotifyEmail(
  options: SendNotifyEmailOptions
): Promise<SendNotifyEmailResult> {
  const config = getNotifyConfig();

  if (!config.resendApiKey) {
    return {
      ok: false,
      error: 'RESEND_API_KEY is not configured on server.'
    };
  }

  const recipients = options.to
    ? Array.isArray(options.to)
      ? options.to
      : [options.to]
    : [config.notifyEmail];

  const payload: Record<string, unknown> = {
    from: config.fromEmail,
    to: recipients,
    subject: options.subject,
    html: options.html,
    reply_to: options.replyTo || config.replyToEmail
  };

  if (options.text) {
    payload.text = options.text;
  }

  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments.map((att) => ({
      filename: att.filename,
      content: att.content
    }));
  }

  const maxAttempts = 2;
  let lastError = '';
  let lastStatus = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      lastStatus = res.status;

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return {
          ok: true,
          id: data.id,
          status: res.status
        };
      }

      const resText = await res.text().catch(() => '');
      lastError = resText;

      // If rate-limited (429) and attempts remaining, wait 700ms and retry
      if (res.status === 429 && attempt < maxAttempts) {
        console.warn(`[notifyEmail] Resend 429 burst rate limit on attempt ${attempt}. Retrying in 700ms...`);
        await sleep(700);
        continue;
      }

      console.warn(`[notifyEmail] Resend API error (${res.status}):`, resText.slice(0, 300));
      break;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < maxAttempts) {
        await sleep(500);
        continue;
      }
    }
  }

  return {
    ok: false,
    error: lastError,
    status: lastStatus
  };
}

export interface BrutalistField {
  label: string;
  value: string;
  isCode?: boolean;
  isLink?: boolean;
  linkHref?: string;
}

export interface BrutalistTemplateOptions {
  title: string;
  badge: string;
  badgeBg?: string;
  badgeColor?: string;
  description?: string;
  fields: BrutalistField[];
  footerNote?: string;
}

/**
 * Generates an email-client-friendly Neo-Brutalist HTML template matching Kins Band design tokens.
 */
export function generateBrutalistEmailHtml(options: BrutalistTemplateOptions): string {
  const {
    title,
    badge,
    badgeBg = '#f2fd43',
    badgeColor = '#000000',
    description,
    fields,
    footerNote = 'Kins Band Automated Notification Dispatch'
  } = options;

  const fieldsHtml = fields
    .map((field) => {
      let renderedValue = field.value;
      if (field.isLink && field.linkHref) {
        renderedValue = `<a href="${field.linkHref}" style="color: #000000; text-decoration: underline; font-weight: 700;" target="_blank" rel="noopener noreferrer">${field.value}</a>`;
      } else if (field.isCode) {
        renderedValue = `<code style="background-color: #e9e9eb; padding: 2px 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; border: 1px solid #000000; word-break: break-all;">${field.value}</code>`;
      }

      return `
        <tr>
          <td style="padding: 10px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555555; width: 140px; border-bottom: 2px solid #000000; background-color: #f7f7f5; vertical-align: top;">
            ${field.label}
          </td>
          <td style="padding: 10px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #0a0a0c; border-bottom: 2px solid #000000; background-color: #ffffff; vertical-align: top;">
            ${renderedValue}
          </td>
        </tr>
      `;
    })
    .join('');

  const descriptionSection = description
    ? `
      <div style="margin-top: 18px; padding: 14px 16px; background-color: #ffffff; border: 3px solid #000000; box-shadow: 3px 3px 0px #000000;">
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #555555; margin-bottom: 6px;">
          Details / User Message
        </div>
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #0a0a0c; white-space: pre-wrap;">${description}</div>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #141416; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;" border="0" cellspacing="0" cellpadding="0">
          <!-- Main Brutalist Card Container -->
          <tr>
            <td style="background-color: #f5f4ef; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; padding: 24px;">
              
              <!-- Header with Badge -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000;">
                      ${badge}
                    </span>
                    <h1 style="margin: 12px 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 900; line-height: 1.25; color: #000000; letter-spacing: -0.02em;">
                      ${title}
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Fields Table -->
              <div style="border: 3px solid #000000; box-shadow: 3px 3px 0px #000000; overflow: hidden; background-color: #000000;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  ${fieldsHtml}
                </table>
              </div>

              <!-- Optional Description Block -->
              ${descriptionSection}

              <!-- Footer -->
              <div style="margin-top: 24px; padding-top: 14px; border-top: 2px dashed #000000; text-align: center; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #666666;">
                ${footerNote} • ${new Date().toUTCString()}
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
