#!/usr/bin/env node
/**
 * tools/verify-notify.mjs — local diagnostic for HelloKinsFan@gmail.com delivery
 *
 * Usage:
 *   node tools/verify-notify.mjs
 *   node tools/verify-notify.mjs --send-test   (sends real test email via Resend)
 *
 * Checks:
 *   - .env / env vars for RESEND_API_KEY, NOTIFY_EMAIL, SUPABASE, Discord webhooks
 *   - Resend sandbox vs verified domain
 *   - Supabase table availability (if env set)
 *   - Optionally sends a live probe to /api/feedback or direct Resend
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return {};
  const raw = fs.readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    v = v.replace(/^["']|["']$/g, '');
    out[k] = v;
  }
  return out;
}

function getEnv(dotEnv, key) {
  if (process.env[key]) return String(process.env[key]).replace(/^["']|["']$/g, '').trim();
  if (dotEnv[key]) return String(dotEnv[key]).replace(/^["']|["']$/g, '').trim();
  return '';
}

const dotEnv = loadDotEnv();
const args = process.argv.slice(2);

console.log('\n🔍 Kins Notify Pipeline — Diagnostic\n' + '='.repeat(50));

const notifyEmail = getEnv(dotEnv, 'NOTIFY_EMAIL') || getEnv(dotEnv, 'HELLO_EMAIL') || 'HelloKinsFan@gmail.com';
const resendKey = getEnv(dotEnv, 'RESEND_API_KEY');
const fromEmail = getEnv(dotEnv, 'RESEND_FROM_EMAIL') || 'Kins Band <onboarding@resend.dev>';
const replyTo = getEnv(dotEnv, 'RESEND_REPLY_TO') || notifyEmail;
const supaUrl = getEnv(dotEnv, 'PUBLIC_SUPABASE_URL') || getEnv(dotEnv, 'SUPABASE_URL');
const supaKey = getEnv(dotEnv, 'SUPABASE_SERVICE_ROLE_KEY');

const isSandbox = fromEmail.toLowerCase().includes('resend.dev');
const hasResendKey = resendKey.length > 0 && resendKey.startsWith('re_');

console.log(`\n📧 Destination inbox (NOTIFY_EMAIL): ${notifyEmail}`);
console.log(`   Expected: HelloKinsFan@gmail.com → ${notifyEmail === 'HelloKinsFan@gmail.com' ? '✅ MATCH' : '⚠️ MISMATCH (will NOT deliver to HelloKinsFan@gmail.com)'}`);

console.log(`\n🔑 RESEND_API_KEY: ${hasResendKey ? `${resendKey.slice(0, 5)}...${resendKey.slice(-4)} ✅` : resendKey ? '⚠️ present but bad format (expected re_...)' : '❌ MISSING — NO EMAILS WILL SEND'}`);
if (!hasResendKey) {
  console.log('   FIX: Add RESEND_API_KEY in Vercel → Settings → Environment Variables (and locally in .env)');
  console.log('        Get key at https://resend.com/api-keys');
}

console.log(`\n✉️  RESEND_FROM_EMAIL: ${fromEmail} ${isSandbox ? '⚠️ SANDBOX' : '✅ custom domain'}`);
if (isSandbox) {
  console.log('   SANDBOX LIMIT: onboarding@resend.dev ONLY delivers to Resend account owner email.');
  console.log('   External Gmail like HelloKinsFan@gmail.com will 403 until you:');
  console.log('     1. Verify kinsband.com at https://resend.com/domains');
  console.log('     2. Set RESEND_FROM_EMAIL="Kins Band <noreply@kinsband.com>" in Vercel env');
  console.log('     3. Redeploy');
}
console.log(`   Reply-To: ${replyTo}`);

console.log(`\n🗄️  Supabase:`);
console.log(`   URL: ${supaUrl ? '✅ present' : '❌ missing (DB fallback disabled)'}`);
console.log(`   SERVICE_ROLE: ${supaKey ? '✅ present' : '❌ missing (feedback/cover_requests fallback disabled)'}`);
if (!supaUrl || !supaKey) {
  console.log('   FIX: Add PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel env, then run supabase_schema_complete.sql');
}

console.log(`\n💬 Discord webhooks (secondary):`);
for (const k of ['DISCORD_WEBHOOK_URL', 'DISCORD_FEEDBACK_WEBHOOK_IMPROVEMENT', 'DISCORD_FEEDBACK_WEBHOOK_BUG', 'DISCORD_FEEDBACK_WEBHOOK_CONTENT', 'DISCORD_REQUEST_SONG_WEBHOOK_URL']) {
  const v = getEnv(dotEnv, k);
  console.log(`   ${k}: ${v ? '✅ set' : '— not set (optional)'}`);
}

console.log('\n' + '='.repeat(50));
if (!hasResendKey) {
  console.log('❌ PIPELINE DEGRADED: No RESEND_API_KEY → feedback & cover requests will be stored/logged only, NOT emailed.');
  console.log('   Deploy health check: curl https://YOUR_DOMAIN/api/notify-health');
} else if (isSandbox) {
  console.log('⚠️ PIPELINE RISKY: Sandbox FROM may 403 to HelloKinsFan@gmail.com unless that address is the Resend owner.');
  console.log('   Verify domain for reliable delivery.');
} else {
  console.log('✅ PIPELINE READY: Resend key + custom FROM present — expect delivery to', notifyEmail);
}
console.log('='.repeat(50) + '\n');

// Optional live probe
if (args.includes('--send-test')) {
  if (!hasResendKey) {
    console.error('✖ Cannot --send-test without RESEND_API_KEY');
    process.exit(1);
  }
  console.log('🚀 Sending live test email via Resend to', notifyEmail, '...\n');
  const payload = {
    from: fromEmail,
    to: [notifyEmail],
    subject: '[Kins Notify] CLI probe — feedback pipeline test',
    html: `<p>CLI probe at ${new Date().toISOString()} — if you see this at ${notifyEmail}, the feedback & cover request pipeline is working.</p>`,
    reply_to: replyTo
  };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Resend HTTP ${res.status}:`, text.slice(0, 600));
    if (!res.ok && res.status === 403) {
      console.log('\n💡 403 fix: verify domain at https://resend.com/domains and update RESEND_FROM_EMAIL');
    }
  } catch (e) {
    console.error('Send failed:', e);
  }
} else {
  console.log('Tip: run with --send-test to send a real probe email (requires RESEND_API_KEY)\n');
}
