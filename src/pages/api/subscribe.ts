import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { Resend } from 'resend';

export const prerender = false;

const resendApiKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || '';
const resend = resendApiKey && !resendApiKey.includes('your_api_key') ? new Resend(resendApiKey) : null;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Insert email into Supabase database (if configured)
    if (supabase) {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: cleanEmail }]);

      if (error) {
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ status: 'success', message: "You're already on the list!" }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        console.warn('Supabase insert warning/error:', error);
      }
    }

    // 2. Send Automated Instant Welcome Email via Resend API
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Kins <onboarding@resend.dev>',
          to: [cleanEmail],
          subject: 'Welcome to The Kins! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #121214; color: #ffffff; padding: 28px; border-radius: 8px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.12);">
              <h2 style="color: #1DB954; font-size: 20px; margin-bottom: 12px;">Welcome to The Kins! 🎉</h2>
              <p style="font-size: 14px; color: #e4e4e7; line-height: 1.5;">Hey,</p>
              <p style="font-size: 14px; color: #e4e4e7; line-height: 1.5;">Thanks for joining The Kins!</p>
              <p style="font-size: 14px; color: #e4e4e7; line-height: 1.5;">You'll be the first to hear about new music, covers, behind-the-scenes moments, gigs, and everything we're working on.</p>
              <p style="font-size: 14px; color: #e4e4e7; line-height: 1.5;">If you've got a question, an idea, or just want to say hi, simply reply to this email. We'd love to hear from you!</p>
              <p style="font-size: 12px; color: #a1a1aa; margin-top: 18px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 14px;">
                <em>One last thing—if this email landed in your Promotions or Spam folder, move it to your Primary inbox so you don't miss future updates.</em>
              </p>
              <p style="font-size: 14px; color: #ffffff; font-weight: bold; margin-top: 16px;">— KINS</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.warn('Resend email dispatch notice:', emailErr);
      }
    }

    return new Response(
      JSON.stringify({ status: 'success', message: "You're subscribed! Welcome email sent." }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Subscription processing error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
