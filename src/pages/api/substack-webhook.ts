import type { APIRoute } from 'astro';
import { supabase, getSupabaseClient } from '../../lib/supabase';
import { validateRealEmail } from '../../scripts/utils/emailValidator.js';
import { removeSubscriberRole, getDiscordConfig } from '../../lib/discord';

export const prerender = false;

/**
 * Handles Unsubscribe Webhook events from Substack, Zapier, or custom services.
 * Automatically marks subscriber as inactive and removes the Discord "Subscribed" role.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));

    // Extract email from diverse webhook structures (Substack, Zapier, Make, custom)
    const rawEmail =
      body.email ||
      body.data?.email ||
      body.data?.subscriber?.email ||
      body.subscriber?.email ||
      body.record?.email ||
      body.user?.email ||
      body.payload?.email ||
      '';

    const eventType =
      body.event ||
      body.type ||
      body.event_type ||
      body.action ||
      'subscriber.unsubscribed';

    if (!rawEmail || typeof rawEmail !== 'string') {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Email address is required in webhook payload.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validation = await validateRealEmail(rawEmail.trim());
    const cleanEmail = validation.valid ? validation.cleanEmail! : rawEmail.trim().toLowerCase();

    let dbUpdated = false;
    const db = getSupabaseClient() || supabase;

    // 1. Update Supabase Database record (is_subscribed = false)
    if (db) {
      try {
        const { error } = await db
          .from('subscribers')
          .update({
            is_subscribed: false,
            unsubscribed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('email', cleanEmail);

        if (!error) {
          dbUpdated = true;
        } else {
          console.error('[Supabase Error] unsubscribe update error:', error.message || error);
        }
      } catch (dbErr) {
        console.error('[Supabase Connection Error]:', dbErr);
      }
    }

    // 2. Remove "Subscribed" Role from Discord
    let discordResult: {
      success: boolean;
      memberFound: boolean;
      memberId?: string;
      memberTag?: string;
      removedRoles: string[];
      message: string;
    } = {
      success: false,
      memberFound: false,
      removedRoles: [],
      message: ''
    };

    try {
      discordResult = await removeSubscriberRole(cleanEmail, body.discordId || body.discordUsername);
    } catch (discordErr) {
      console.error('Discord role removal error:', discordErr);
    }

    // 3. Dispatch alert to Discord Webhook
    const discordConfig = getDiscordConfig();
    const discordWebhookUrl = discordConfig.webhookUrl;

    if (discordWebhookUrl) {
      try {
        const roleRemovalStatus = discordResult.removedRoles.length > 0
          ? `❌ Removed: ${discordResult.removedRoles.map((r) => `\`@${r}\``).join(', ')}`
          : (discordResult.memberFound
              ? `⚠️ Removal Pending (${discordResult.message || 'Check Bot Permissions'})`
              : `ℹ️ Member Not Found in Server`);

        const memberLine = discordResult.memberFound
          ? `• **Discord Account:** ${discordResult.memberTag ? `\`${discordResult.memberTag}\`` : ''} (<@${discordResult.memberId}>)\n`
          : '';

        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Kins Subscribers Bot',
            avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png',
            embeds: [
              {
                title: '🚫 Fan Club Unsubscribed (Substack/Webhook)',
                description: `**Email:** \`${cleanEmail}\`\n${memberLine}• **Discord Role Status:** ${roleRemovalStatus}\n• **Event:** \`${eventType}\`\n• **Database Updated:** ${dbUpdated ? '✅ Yes' : '⚠️ Record Not Found / DB Off'}\n• **Timestamp:** ${new Date().toISOString()}`,
                color: 0xff4d4d, // Crimson Red
                footer: { text: 'Kins Subscription & Substack Listener' }
              }
            ]
          })
        }).catch(() => {});
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Unsubscribed successfully and Discord role removed.',
        email: cleanEmail,
        discord: discordResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Substack unsubscribe webhook error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to process unsubscribe webhook.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
