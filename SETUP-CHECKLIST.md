# Owner Setup Checklist — finish these once, in order

Everything below is outside the codebase (Vercel dashboard, Discord, Supabase, browser).
Time estimate: ~30 min. Do steps in order; each has a verification so you know it worked.

---

## 1. Rotate the Discord webhooks  ⚠️ DO THIS FIRST

The old webhook URLs are burned — they sat in git history and in previously deployed
bundles. Anyone could have saved them. Rotating invalidates every copy.

1. Discord → your server → **Server Settings → Integrations → Webhooks**
2. For each webhook used by the site (subscribers, #improvement, #bug, #content,
   cover-requests, community clips): open it → **Copy Webhook URL** after clicking
   "Reset" (or delete + recreate)
3. Keep the new URLs somewhere safe temporarily — you'll paste them into Vercel next

**Verify:** old URLs now return `401/404` when POSTed to.

## 2. Add environment variables in Vercel

Project → **Settings → Environment Variables**. Add for Production + Preview:

| Name | Value |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API → service_role key (**server secret**) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys → Create API Key |
| `RESEND_FROM_EMAIL` | e.g. `Kins Band <newsletter@kinsband.com>` (requires verified domain at resend.com/domains) or default sandbox `onboarding@resend.dev` |
| `NOTIFY_EMAIL` | Admin email to receive subscriber/feedback alerts (e.g. `HelloKinsFan@gmail.com`) |
| `DISCORD_WEBHOOK_URL` | rotated subscribers webhook |
| `DISCORD_FEEDBACK_WEBHOOK_IMPROVEMENT` | rotated #improvement webhook |
| `DISCORD_FEEDBACK_WEBHOOK_BUG` | rotated #bug webhook |
| `DISCORD_FEEDBACK_WEBHOOK_CONTENT` | rotated #content webhook |
| `DISCORD_REQUEST_SONG_WEBHOOK_URL` | rotated cover-requests webhook |
| `DISCORD_COMMUNITY_CLIP_WEBHOOK_URL` | rotated community-clips webhook |
| `SUBSTACK_WEBHOOK_SECRET` | random string you generate (below) |
| `GOOGLE_CLIENT_ID` *(optional)* | only if you want it server-injected; browser uses `PUBLIC_GOOGLE_CLIENT_ID` |

Generate the webhook secret locally:

```powershell
-join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

Mirror all values into local `.env` too (copy `.env.example` as the template).

**Verify:** Vercel shows all vars green for both environments.

## 3. Update the Substack/Zapier unsubscribe automation

Your unsubscribe caller must send the shared secret header or it gets a 401:

```
POST https://kinsband-hub.vercel.app/api/substack-webhook
Authorization: Bearer <value of SUBSTACK_WEBHOOK_SECRET>
Content-Type: application/json

{ "email": "fan@example.com", "event": "subscriber.unsubscribed" }
```

**Verify:** curl without the header → `401`; with it → `200 {"status":"success"...}`
and the Discord alert fires.

## 4. Run the database migration (All-in-One)

Supabase Dashboard → **SQL Editor → New query** → paste all of
`supabase_schema_complete.sql` → **Run (Ctrl+Enter / Cmd+Enter)**.

This creates all required tables (`subscribers`, `votes`, `checkins`, `player_state`, `fan_uploads`, `qr_scans`, `tips`, `live_chat`, **`feedback_submissions`**, **`cover_requests`**), adds storage buckets, configures hardened RLS policies, and triggers `NOTIFY pgrst, 'reload schema'` so the schema cache refreshes immediately.

**Verify:** Table Editor in Supabase shows all tables present and healthy. Also hit `/api/notify-health` — it should report `supabase.configured: true`.

> **Why the new tables?** Feedback & cover requests now persist to `feedback_submissions` / `cover_requests` before emailing, so even if Resend is down or 403s, no submission is lost. View them in Supabase Table Editor.

## 5. Redeploy + smoke test

```powershell
git push   # or redeploy from Vercel dashboard
```

Then on the preview URL check, in order:
- [ ] Homepage loads, hero image sharp, no console errors
- [ ] Play/pause/resume a preview track rapidly ×5 — audio never dies
- [ ] Countdown shows zeros (or correct time if you set a future date in `hero.config.ts`)
- [ ] Feedback modal: submit with screenshot → appears in the right Discord channel
- [ ] Cover request form → arrives in cover-requests channel
- [ ] Community clip form with junk URL → rejected with toast; valid URL → arrives
- [ ] Share modal QR points at current domain
- [ ] DevTools console: zero CSP violation reports (note any that appear)

## 6. Google One Tap test (preview URL, not localhost)

FedCM suppresses One Tap on localhost. On the Vercel preview:
- If no prompt appears: Chrome address-bar lock icon → **Site settings → Reset permissions**, reload
- Sign in → verify session survives a hard reload (Subscribed state persists)
- "Subscribe another email" → signs out cleanly, prompt can reappear

## 7. Performance baseline (record & keep)

Chrome DevTools → Lighthouse → Mobile, on the deployed prod URL:

| Check | Target |
|---|---|
| Performance score | ≥ 90 |
| LCP | ≤ 2.5 s |
| TBT | ≤ 200 ms |
| CLS | ≤ 0.05 |

Then Performance panel → 6× CPU throttle → scroll home page + play audio +
open modals: expect flat green FPS (~60), no long red tasks >150 ms.
Save the report JSON next to this file (`lighthouse-baseline.json`) so future
regressions have something to compare against.

---

### Email pipeline — Feedback & Cover Requests not arriving at HelloKinsFan@gmail.com

This is the #1 post-deploy issue. Diagnose in 30 s:

```powershell
# 1. Redacted health (no secrets leak)
curl https://kinshub.vercel.app/api/notify-health | jq

# 2. Live probe (sends real test mail to NOTIFY_EMAIL) — requires ?token=HEALTHCHECK_TOKEN if set
curl "https://kinshub.vercel.app/api/notify-health?check=send&token=YOUR_TOKEN"

# Locally:
node tools/verify-notify.mjs
node tools/verify-notify.mjs --send-test
```

| Health output says | Meaning | Fix |
|---|---|---|
| `hasResendKey: false` | `RESEND_API_KEY` missing in Vercel | Vercel → Settings → Environment Variables → add `RESEND_API_KEY=re_...` (from https://resend.com/api-keys) → Redeploy. Preview + Production both. |
| `isSandbox: true` + `Resend 403` in logs | `RESEND_FROM_EMAIL` is `onboarding@resend.dev` — sandbox only delivers to Resend account owner | Verify `kinsband.com` at https://resend.com/domains → set `RESEND_FROM_EMAIL="Kins Band <noreply@kinsband.com>"` (or `<hello@kinsband.com>`) in Vercel → Redeploy. Do NOT keep `onboarding@resend.dev` in production. |
| `hasResendKey: true` but still no mail | Check spam / promotions + `notifyEmail` field in /api/notify-health — must be `HelloKinsFan@gmail.com` | Set `NOTIFY_EMAIL=HelloKinsFan@gmail.com` (or `HELLO_EMAIL`) in Vercel env. Also confirm `RESEND_REPLY_TO`. |
| `supabase.configured: false` | DB fallback disabled | Set `PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Step 2) and re-run `supabase_schema_complete.sql`. Feedback still logs but won't persist. |
| 403 `Domain not verified` | FROM domain fails SPF/DKIM | Wait ~10 min after verifying domain in Resend, re-check DNS, redeploy. |

**After fixing env, always Redeploy** (Vercel → Deployments → Redeploy) — serverless functions read env at build.

**Verify end-to-end:**
- [ ] Submit feedback (with screenshot) → email arrives at `HelloKinsFan@gmail.com` within 60 s (check Spam) + row appears in `feedback_submissions`
- [ ] Submit cover request → email arrives + row in `cover_requests`
- [ ] `/api/notify-health?check=send` returns `200` and email arrives

### If something else breaks after deploy

| Symptom | Likely cause | Fix |
|---|---|---|
| Forms fail with 503 | Discord env vars missing/mistyped in Vercel (legacy) | Re-check names exactly (case-sensitive) — new code no longer 503s for feedback/cover, but logs health |
| Unsubscribe automation 401s | Missing/wrong Bearer header | Step 3 |
| Chat shows "not available" | `PUBLIC_SUPABASE_*` not set | Step 2 |
| One Tap never prompts | FedCM permission cache / localhost | Step 6 reset trick |
| Icons/fonts flash unstyled briefly first visit | Expected async-load tradeoff; cached after | Ignore unless persistent |
