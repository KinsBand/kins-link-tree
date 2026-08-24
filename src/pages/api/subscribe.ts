import type { APIRoute } from 'astro';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';
import { validateRealEmail } from '../../scripts/utils/emailValidator.js';
import { assignSubscriberRoles, getDiscordConfig } from '../../lib/discord';

export const prerender = false;

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

// Simple in-memory rate limiter: 10 requests per minute per IP.
// Per-instance on serverless, but still blunts obvious abuse/flooding.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) rateBuckets.delete(k);
    }
  }
  return hits.length > RATE_LIMIT_MAX;
}

/**
 * Verifies a Google ID token through Supabase Auth (signature, aud, iss, exp
 * and optional nonce are all validated server-side). Only verified claims are
 * returned — raw token payloads are never trusted.
 */
async function verifyGoogleCredential(
  credential: string,
  nonce?: string
): Promise<{ email?: string; name?: string; avatar?: string } | null> {
  const admin = getSupabaseServiceClient();
  if (!admin) return null;
  try {
    const { data, error } = await admin.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
      nonce: nonce || undefined
    });
    if (error || !data?.user) {
      console.warn('[Auth] Google credential rejected by Supabase:', error?.message);
      return null;
    }
    const meta = (data.user.user_metadata || {}) as Record<string, string>;
    return {
      email: data.user.email || meta.email,
      name: meta.full_name || meta.name,
      avatar: meta.avatar_url || meta.picture
    };
  } catch (err) {
    console.warn('[Auth] Credential verification error:', err);
    return null;
  }
}


// Generates modern brutalist HTML Welcome Email for Kins Band
function generateWelcomeEmailHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Kins Band!</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
    }
    .email-container {
      max-width: 580px;
      margin: 30px auto;
      background: #ffffff;
      border: 3px solid #000000;
      border-radius: 8px;
      box-shadow: 5px 5px 0px #000000;
      overflow: hidden;
    }
    .email-header {
      background: #ffeb3b;
      border-bottom: 3px solid #000000;
      padding: 24px 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #000000;
      text-transform: uppercase;
    }
    .email-header p {
      margin: 6px 0 0 0;
      font-size: 14px;
      font-weight: 700;
      color: #222222;
      letter-spacing: 0.5px;
    }
    .email-body {
      padding: 28px 24px;
    }
    .email-body h2 {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 12px 0;
      color: #111111;
    }
    .email-body p {
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      margin: 0 0 16px 0;
    }
    .card-highlight {
      background: #fdfdfd;
      border: 2px solid #000000;
      border-radius: 6px;
      box-shadow: 3px 3px 0px #000000;
      padding: 16px 18px;
      margin: 20px 0;
    }
    .card-highlight ul {
      margin: 8px 0;
      padding-left: 20px;
    }
    .card-highlight li {
      font-size: 14px;
      font-weight: 600;
      color: #222222;
      margin-bottom: 8px;
    }
    .btn-row {
      text-align: center;
      margin: 28px 0 20px 0;
    }
    .cta-btn {
      display: inline-block;
      background: #ffeb3b;
      color: #000000 !important;
      text-decoration: none;
      font-weight: 900;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 12px 24px;
      border: 2.5px solid #000000;
      border-radius: 6px;
      box-shadow: 3px 3px 0px #000000;
    }
    .socials-row {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 2px solid #eaeaea;
    }
    .socials-row a {
      color: #111111;
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;
      margin: 0 8px;
      display: inline-block;
    }
    .socials-row a:hover {
      text-decoration: underline;
    }
    .email-footer {
      background: #111111;
      color: #888888;
      padding: 16px 20px;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
    }
    .email-footer a {
      color: #ffeb3b;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>KINS BAND</h1>
      <p>Official Fan Club & VIP Drops</p>
    </div>
    <div class="email-body">
      <h2>You're In! 🎸🔥</h2>
      <p>Thanks for subscribing! You are now locked in to receive the latest updates directly from Kins.</p>
      
      <div class="card-highlight">
        <strong style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">What you'll get:</strong>
        <ul>
          <li>🔥 <strong>Early Releases:</strong> Hear new covers & original tracks before anyone else.</li>
          <li>🎟️ <strong>Gig & Tour Alerts:</strong> First access to show dates & secret gigs.</li>
          <li>🎬 <strong>Behind-The-Scenes:</strong> Studio footage, jam sessions & band diaries.</li>
          <li>🎵 <strong>Cover Request Priority:</strong> Your song suggestions move straight to the top of our queue.</li>
        </ul>
      </div>

      <div class="btn-row">
        <a href="https://kinsband.com" class="cta-btn" target="_blank">Explore Kins Site & Music</a>
      </div>

      <div class="socials-row">
        <a href="https://open.spotify.com/artist/0F4YhJc3cI8rVq6U7v7q7C" target="_blank">Spotify</a> •
        <a href="https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ" target="_blank">YouTube</a> •
        <a href="https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx" target="_blank">Instagram</a> •
        <a href="https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ" target="_blank">TikTok</a> •
        <a href="https://x.com/KinsBandOfficia" target="_blank">X</a>
      </div>
    </div>
    <div class="email-footer">
      <p>You received this email because you subscribed at <a href="https://kinsband.com">kinsband.com</a> (${email}).</p>
      <p>&copy; ${new Date().getFullYear()} Kins Band. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Too many requests. Please wait a minute and try again.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json().catch(() => ({}));
    let email = body.email;
    let userName = body.name || body.full_name || '';
    let avatarUrl = body.avatar || body.picture || '';

    // If a Google credential is presented, verify it properly via Supabase Auth
    // and let the VERIFIED claims override anything sent in the request body.
    if (body.credential || body.id_token) {
      const verified = await verifyGoogleCredential(body.credential || body.id_token, body.nonce);
      if (!verified) {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Google sign-in could not be verified. Please sign in again.' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (verified.email) email = verified.email;
      if (verified.name) userName = verified.name;
      if (verified.avatar) avatarUrl = verified.avatar;
    }

    const validation = await validateRealEmail(email);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ status: 'error', message: validation.error || 'Please enter a valid, active email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = validation.cleanEmail!;
    let dbSuccess = false;
    let welcomeEmailSent = false;

    const db = getSupabaseServiceClient();

    // 1. Save Subscriber to Supabase Database (subscribers table)
    if (db) {
      try {
        const subscriberRecord: Record<string, any> = {
          email: cleanEmail,
          source: body.source || 'website',
          is_subscribed: true,
          unsubscribed_at: null,
          updated_at: new Date().toISOString()
        };

        if (userName) {
          subscriberRecord.name = userName;
        }

        const { error } = await db
          .from('subscribers')
          .upsert(subscriberRecord, { onConflict: 'email', ignoreDuplicates: false });

        if (!error) {
          dbSuccess = true;
        } else {
          // If upsert fails because `name` column doesn't exist yet on a legacy schema, retry without `name`
          if (error.message && error.message.includes('column "name"')) {
            const fallbackRecord = { ...subscriberRecord };
            delete fallbackRecord.name;
            const fallbackRes = await db
              .from('subscribers')
              .upsert(fallbackRecord, { onConflict: 'email', ignoreDuplicates: false });
            if (!fallbackRes.error) {
              dbSuccess = true;
            }
          } else {
            console.error('[Supabase Error] subscribers upsert failed:', error.message || error);
          }
        }
      } catch (dbErr) {
        console.error('[Supabase Connection Error]:', dbErr);
      }
    } else {
      console.warn('[Supabase Warning] Client not initialized. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    }

    // 2. Assign Subscribed and Listener Roles on Discord
    let discordRoleResult: {
      success: boolean;
      memberFound: boolean;
      memberId?: string;
      memberTag?: string;
      assignedRoles: string[];
      message: string;
    } = {
      success: false,
      memberFound: false,
      assignedRoles: [],
      message: ''
    };

    try {
      discordRoleResult = await assignSubscriberRoles(cleanEmail, body.discordId || body.discordUsername);
    } catch (discordErr) {
      console.error('Discord role assignment error:', discordErr);
    }

    // 3. Send Welcome Email via Resend
    const resendApiKey = getEnv('RESEND_API_KEY');
    const fromEmail = getEnv('RESEND_FROM_EMAIL') || 'Kins Band <onboarding@resend.dev>';

    if (resendApiKey) {
      try {
        const resendPayload = {
          from: fromEmail,
          to: [cleanEmail],
          subject: 'Welcome to the Kins Band Fan Club! 🎸✨',
          html: generateWelcomeEmailHtml(cleanEmail)
        };

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(resendPayload)
        });

        if (resendRes.ok) {
          welcomeEmailSent = true;
          // Mark welcome_email_sent = true in Supabase
          if (db) {
            await db
              .from('subscribers')
              .update({ welcome_email_sent: true })
              .eq('email', cleanEmail);
          }
        } else {
          const resendErrText = await resendRes.text().catch(() => '');
          console.warn('Resend email delivery warning:', resendRes.status, resendErrText);
        }
      } catch (emailErr) {
        console.error('Resend dispatch error:', emailErr);
      }
    }

    // 4. Send Discord Webhook notification with role assignment & subscriber details
    const discordConfig = getDiscordConfig();
    const discordWebhookUrl = discordConfig.webhookUrl;

    if (discordWebhookUrl) {
      try {
        const roleStatusLine = discordRoleResult.assignedRoles.length > 0
          ? `✅ Assigned: ${discordRoleResult.assignedRoles.map((r) => `\`@${r}\``).join(', ')}`
          : (discordRoleResult.memberFound
              ? `⚠️ Roles Pending (${discordRoleResult.message || 'Check Bot Permissions'})`
              : `ℹ️ Roles: \`@Subscribed\` + \`@Listener\` (Auto-grants on join / handle match)`);

        const memberLine = discordRoleResult.memberFound
          ? `• **Discord Account:** ${discordRoleResult.memberTag ? `\`${discordRoleResult.memberTag}\`` : ''} (<@${discordRoleResult.memberId}>)\n`
          : '';

        const nameLine = userName ? `\n• **Name:** ${userName}` : '';

        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Kins Subscribers Bot',
            avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png',
            embeds: [
              {
                title: '✉️ New Fan Club Subscriber!',
                description: `**Email:** \`${cleanEmail}\`${nameLine}\n${memberLine}• **Discord Roles:** ${roleStatusLine}\n• **Database Saved:** ${dbSuccess ? '✅ Yes' : '⚠️ Pending Setup'}\n• **Welcome Email:** ${welcomeEmailSent ? '✅ Sent via Resend' : (resendApiKey ? '⚠️ Failed/Queued' : 'ℹ️ Resend Key Not Set')}\n• **Timestamp:** ${new Date().toISOString()}`,
                color: 0xffeb3b, // Neon Yellow
                footer: { text: 'Kins Subscription System' }
              }
            ]
          })
        }).catch(() => {});
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: "You're subscribed! Check your inbox for your welcome email.",
        email: cleanEmail
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Subscription API fatal error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Subscription processing error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
