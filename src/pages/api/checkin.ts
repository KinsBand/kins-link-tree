import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const GIG_ID_RE = /^[a-zA-Z0-9_-]{1,60}$/;
const DEVICE_RE = /^[0-9a-f-]{36}$/i;

const PassportGetQuerySchema = z.object({
  deviceId: z.string().regex(DEVICE_RE, 'Invalid device identity')
});

const CheckinPostBodySchema = z.object({
  gigId: z.string().regex(GIG_ID_RE, 'Invalid show reference'),
  deviceId: z.string().regex(DEVICE_RE, 'Invalid device identity'),
  email: z.string().max(200).optional().default('')
});

const BADGE_DEFS: Record<string, { label: string; test: (ctx: BadgeCtx) => boolean }> = {
  FIRST_SHOW: {
    label: 'First Show',
    test: (c) => c.totalGigs >= 1
  },
  NEWCASTLE_LOCAL: {
    label: 'Newcastle Local',
    test: (c) => c.newcastleCount >= 2
  },
  ROAD_DOG: {
    label: 'Road Dog',
    test: (c) => c.distinctCities >= 3
  },
  REGULAR: {
    label: 'Regular',
    test: (c) => c.totalGigs >= 5
  }
};

interface BadgeCtx {
  totalGigs: number;
  newcastleCount: number;
  distinctCities: number;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

async function loadPassportState(supabase: NonNullable<ReturnType<typeof getSupabaseServiceClient>>, deviceId: string) {
  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('gig_id, created_at')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: true });

  if (error) {
    if (
      (error as any).code === 'PGRST205' ||
      error.message?.includes('Could not find the table') ||
      error.message?.includes('relation "public.checkins" does not exist')
    ) {
      console.warn('[passport] Table "checkins" not initialized yet — returning empty passport state.');
      return {
        gigs: [],
        totalGigs: 0,
        ctx: { totalGigs: 0, newcastleCount: 0, distinctCities: 0 },
        currentBadges: [],
        allBadges: [],
        earnedNow: []
      };
    }
    throw new Error(error.message);
  }

  const gigs = (checkins || []).map((row) => ({ gigId: row.gig_id, at: row.created_at }));
  const totalGigs = gigs.length;
  const newcastleCount = gigs.filter((g) => /newcastle/i.test(g.gigId)).length;
  const distinctCities = new Set(
    gigs.map((g) => {
      const m = g.gigId.match(/^(.*?)-gig-/) || g.gigId.match(/^([a-z]+)-/i);
      return (m ? m[1] : g.gigId).toLowerCase();
    })
  ).size;

  let state = null;
  const { data: existingState, error: stateError } = await supabase
    .from('player_state')
    .select('xp, badges')
    .eq('identity_key', `device:${deviceId}`)
    .maybeSingle();

  if (!stateError && existingState) state = existingState;

  const ctx: BadgeCtx = { totalGigs, newcastleCount, distinctCities };
  const currentBadges: string[] = Array.isArray(state?.badges) ? state.badges : [];
  const earnedNow: string[] = [];
  for (const [key, def] of Object.entries(BADGE_DEFS)) {
    if (!currentBadges.includes(key) && def.test(ctx)) earnedNow.push(key);
  }
  const allBadges = [...currentBadges, ...earnedNow];

  return { gigs, totalGigs, ctx, currentBadges, allBadges, earnedNow };
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (isRateLimited(`passport:${getClientIp(request)}`, 30, 60 * 1000)) {
      return json({ status: 'error', message: 'Too many requests.' }, 429);
    }

    const parsed = PassportGetQuerySchema.safeParse({
      deviceId: url.searchParams.get('deviceId') || ''
    });

    if (!parsed.success) {
      return json({ status: 'error', message: 'Invalid device identity.' }, 400);
    }

    const deviceId = parsed.data.deviceId;

    const supabase = getSupabaseServiceClient();
    if (!supabase) return json({ status: 'error', message: 'Passport unavailable.' }, 503);

    const state = await loadPassportState(supabase, deviceId);
    return json({
      status: 'success',
      totalGigs: state.totalGigs,
      xp: state.totalGigs * 10,
      badges: state.allBadges,
      badgeLabels: state.allBadges.map((b) => ({ key: b, label: BADGE_DEFS[b]?.label || b })),
      checkins: state.gigs
    });
  } catch (err) {
    console.error('[passport] GET error:', err);
    return json({ status: 'error', message: 'Could not load your passport.' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`checkin:${getClientIp(request)}`, 8, 60 * 1000)) {
      return json({ status: 'error', message: 'Slow down a moment.' }, 429);
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = CheckinPostBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ status: 'error', message: 'Invalid check-in payload.' }, 400);
    }

    const { gigId: rawGigId, deviceId: rawDeviceId, email: rawEmail } = parsed.data;
    const gigId = sanitizeText(rawGigId, 60);
    const deviceId = sanitizeText(rawDeviceId, 40);
    const email = sanitizeText(rawEmail, 200);

    const supabase = getSupabaseServiceClient();
    if (!supabase) return json({ status: 'error', message: 'Check-in service unavailable.' }, 503);

    // Unique(gig_id, device_id) makes repeat check-ins idempotent no-ops.
    const { error: insertError } = await supabase.from('checkins').insert({
      gig_id: gigId,
      device_id: deviceId,
      email: email || null
    });

    if (insertError && insertError.code !== '23505') {
      console.error('[checkin] insert failed:', insertError.message);
      return json({ status: 'error', message: 'Check-in could not be saved. Try again.' }, 502);
    }

    const alreadyCheckedIn = Boolean(insertError); // unique violation ⇒ existed

    const state = await loadPassportState(supabase, deviceId);

    const newXp = state.totalGigs * 10;
    await supabase.from('player_state').upsert(
      {
        identity_key: `device:${deviceId}`,
        xp: newXp,
        badges: state.allBadges,
        last_seen: new Date().toISOString()
      },
      { onConflict: 'identity_key' }
    );

    return json({
      status: 'success',
      alreadyCheckedIn,
      totalGigs: state.totalGigs,
      xp: newXp,
      newBadges: state.earnedNow.map((b) => ({ key: b, label: BADGE_DEFS[b]?.label || b })),
      badgeLabels: state.allBadges.map((b) => ({ key: b, label: BADGE_DEFS[b]?.label || b }))
    });
  } catch (err) {
    console.error('[checkin] POST error:', err);
    return json({ status: 'error', message: 'Failed to process check-in.' }, 500);
  }
};
