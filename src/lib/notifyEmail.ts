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
  isSandbox: boolean;
  hasResendKey: boolean;
}

function getEnv(key: string): string {
  let val = '';
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    val = String(process.env[key]);
  } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    val = String(import.meta.env[key]);
  }
  return val.replace(/^["']|["']$/g, '').trim();
}

/**
 * Resolves destination and sender configuration for notification emails.
 * Canonical inbox is HelloKinsFan@gmail.com unless NOTIFY_EMAIL / HELLO_EMAIL overrides it.
 */
export function getNotifyConfig(): NotifyConfig {
  const notifyEmail = (
    getEnv('NOTIFY_EMAIL') ||
    getEnv('HELLO_EMAIL') ||
    getEnv('ADMIN_EMAIL') ||
    generalEmail ||
    'HelloKinsFan@gmail.com'
  ).trim();

  // RESEND_API_KEY is primary; also accept common alternates to avoid silent misconfig
  const resendApiKey = (
    getEnv('RESEND_API_KEY') ||
    getEnv('RESEND_KEY') ||
    getEnv('RESEND_TOKEN') ||
    getEnv('RESEND_API_TOKEN')
  ).trim();

  const fromEmail = (
    getEnv('RESEND_FROM_EMAIL') ||
    getEnv('RESEND_FROM') ||
    getEnv('FROM_EMAIL') ||
    getEnv('RESEND_EMAIL_FROM') ||
    'Kins Band <onboarding@resend.dev>'
  ).trim();

  const replyToEmail = (
    getEnv('RESEND_REPLY_TO') ||
    getEnv('RESEND_REPLY_TO_EMAIL') ||
    getEnv('REPLY_TO') ||
    notifyEmail
  ).trim();

  const isSandbox = fromEmail.toLowerCase().includes('resend.dev');
  const hasResendKey = resendApiKey.length > 0 && resendApiKey.startsWith('re_');

  return {
    notifyEmail,
    resendApiKey,
    fromEmail,
    replyToEmail,
    isSandbox,
    hasResendKey
  };
}

/**
 * Redacted health snapshot for logging / diagnostics without leaking secrets.
 * Use in /api health checks or server logs.
 */
export function getNotifyHealth(): Record<string, unknown> {
  const c = getNotifyConfig();
  const maskedKey = c.resendApiKey
    ? `${c.resendApiKey.slice(0, 5)}...${c.resendApiKey.slice(-4)}`
    : '(missing)';
  return {
    notifyEmail: c.notifyEmail,
    fromEmail: c.fromEmail,
    replyToEmail: c.replyToEmail,
    isSandbox: c.isSandbox,
    hasResendKey: c.hasResendKey,
    resendKeyPreview: maskedKey,
    resendKeyValidFormat: c.hasResendKey,
    timestamp: new Date().toISOString()
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
 * Returns structured result; caller decides whether to fallback to Discord or DB.
 */
export async function sendNotifyEmail(
  options: SendNotifyEmailOptions
): Promise<SendNotifyEmailResult> {
  const config = getNotifyConfig();

  if (!config.resendApiKey) {
    console.warn(
      '[notifyEmail] RESEND_API_KEY missing — cannot deliver to',
      config.notifyEmail,
      '— set RESEND_API_KEY in Vercel env (see .env.example / SETUP-CHECKLIST.md)'
    );
    return {
      ok: false,
      error: 'RESEND_API_KEY is not configured on server. Set it in Vercel → Settings → Environment Variables.'
    };
  }

  if (!config.hasResendKey) {
    console.warn(
      '[notifyEmail] RESEND_API_KEY format invalid (expected re_... prefix) — check Vercel env value.'
    );
  }

  const rawRecipients = options.to
    ? Array.isArray(options.to)
      ? options.to
      : [options.to]
    : [config.notifyEmail];

  const recipients = rawRecipients
    .map((r) => String(r || '').trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return {
      ok: false,
      error: 'No valid recipient email provided.'
    };
  }

  // Mirror welcome-email logic: sandbox must be bare onboarding@resend.dev
  // (Resend example: "Acme <onboarding@resend.dev>" also works, but bare is most compatible)
  const effectiveFrom = config.isSandbox ? 'onboarding@resend.dev' : config.fromEmail;

  // Validate reply_to — Resend 422s if not a real email. Fall back to config value if invalid.
  const rawReplyTo = (options.replyTo || config.replyToEmail).trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawReplyTo);
  const replyTo = isValidEmail ? rawReplyTo : config.replyToEmail;

  const payload: Record<string, unknown> = {
    from: effectiveFrom,
    to: recipients,
    subject: options.subject,
    html: options.html,
    reply_to: replyTo
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
    const abortCtl = new AbortController();
    const abortTimer = setTimeout(() => abortCtl.abort(), 8000);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: abortCtl.signal
      });
      clearTimeout(abortTimer);

      lastStatus = res.status;

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        console.info(`[notifyEmail] Delivered successfully via Resend (ID: ${data.id || 'OK'}) to: ${recipients.join(', ')}`);
        return {
          ok: true,
          id: data.id,
          status: res.status
        };
      }

      const resText = await res.text().catch(() => '');
      lastError = resText || `Resend HTTP ${res.status}`;

      // 403 Forbidden: unverified sending domain or sandbox recipient restriction
      if (res.status === 403) {
        console.warn(
          '[notifyEmail] Resend 403 (Domain/Recipient restricted) to',
          recipients.join(', '),
          '—',
          resText.slice(0, 400),
          '— FIX: verify kinsband.com at https://resend.com/domains then set RESEND_FROM_EMAIL="Kins Band <noreply@kinsband.com>" in Vercel env. Sandbox onboarding@resend.dev only delivers to the Resend account owner.'
        );
        break;
      }

      // 400/401/422: bad request or key invalid — try minimal payload once if 422 (often reply_to or attachment issue)
      if (res.status === 400 || res.status === 401 || res.status === 422) {
        console.warn(`[notifyEmail] Resend ${res.status} (bad request/auth) – check RESEND_API_KEY and payload:`, resText.slice(0, 400));
        // One minimal retry for 422: strip optional fields that often cause validation failures (reply_to, text, attachments)
        if (res.status === 422 && attempt === 1 && (payload.reply_to || payload.text || payload.attachments)) {
          console.warn('[notifyEmail] Retrying with minimal payload (stripping reply_to/text/attachments) to isolate 422 cause...');
          const minimal = { from: payload.from, to: payload.to, subject: payload.subject, html: payload.html };
          // Overwrite payload for next loop iteration
          (payload as Record<string, unknown>).reply_to = undefined;
          delete (payload as Record<string, unknown>).reply_to;
          delete (payload as Record<string, unknown>).text;
          delete (payload as Record<string, unknown>).attachments;
          // Keep from/to/subject/html
          await sleep(300);
          // Continue to next attempt (which will use minimal payload)
          continue;
        }
        break;
      }

      // If rate-limited (429) and attempts remaining, wait 700ms and retry
      if (res.status === 429 && attempt < maxAttempts) {
        console.warn(`[notifyEmail] Resend 429 burst rate limit on attempt ${attempt}. Retrying in 700ms...`);
        await sleep(700);
        continue;
      }

      // 5xx: transient, retry once
      if (res.status >= 500 && attempt < maxAttempts) {
        console.warn(`[notifyEmail] Resend ${res.status} transient — retrying in 500ms...`, resText.slice(0, 200));
        await sleep(500);
        continue;
      }

      console.warn(`[notifyEmail] Resend API error (${res.status}) to ${recipients.join(', ')}:`, resText.slice(0, 400));
      break;
    } catch (err: unknown) {
      clearTimeout(abortTimer);
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
