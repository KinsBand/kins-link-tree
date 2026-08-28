import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const ALLOWED_SCOPES = /^hero-poll:[a-z0-9_]{1,40}$|^cover-request:[a-zA-Z0-9_-]{1,60}$/;
const MAX_CHOICE_LEN = 60;

const VoteGetQuerySchema = z.object({
  scope: z.string().regex(ALLOWED_SCOPES, 'Invalid poll scope')
});

const VotePostBodySchema = z.object({
  scope: z.string().regex(ALLOWED_SCOPES, 'Invalid poll scope'),
  choice: z.string().max(MAX_CHOICE_LEN).optional().default('')
});

function getEnv(key: string): string {
  return (import.meta.env[key] as string | undefined) || process.env[key] || '';
}

function voterKeyFromRequest(request: Request): string {
  const ip = getClientIp(request);
  const salt = getEnv('VOTE_SALT') || 'kins-vote-default-salt';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsedQuery = VoteGetQuerySchema.safeParse({
      scope: url.searchParams.get('scope') || ''
    });

    if (!parsedQuery.success) {
      return json({ status: 'error', message: 'Invalid poll scope.' }, 400);
    }

    const scope = parsedQuery.data.scope;

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      // Unconfigured environment (local dev / preview): degrade quietly with
      // empty tallies instead of a console-noisy 503 on page load.
      return json({ status: 'success', scope, tallies: {}, configured: false });
    }

    const { data, error } = await supabase
      .from('votes')
      .select('choice')
      .eq('scope', scope);

    if (error) {
      if (
        (error as any).code === 'PGRST205' ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('relation "public.votes" does not exist')
      ) {
        console.warn('[vote] Table "public.votes" not initialized yet — returning empty tallies. Run supabase_schema_complete.sql in Supabase SQL editor.');
        return json({ status: 'success', scope, tallies: {}, initialized: false }, 200);
      }
      console.error('[vote] tally query failed:', error.message);
      return json({ status: 'error', message: 'Could not load results.' }, 502);
    }

    const tallies: Record<string, number> = {};
    for (const row of data || []) {
      tallies[row.choice] = (tallies[row.choice] || 0) + 1;
    }

    return json({ status: 'success', scope, tallies });
  } catch (err) {
    console.error('[vote] GET error:', err);
    return json({ status: 'error', message: 'Could not load results.' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`vote:${getClientIp(request)}`, 10, 60 * 1000)) {
      return json({ status: 'error', message: 'Too many votes. Try again shortly.' }, 429);
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = VotePostBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return json({ status: 'error', message: 'Invalid payload.' }, 400);
    }

    const { scope, choice: rawChoice } = parsed.data;
    const choice = sanitizeText(rawChoice, MAX_CHOICE_LEN);

    const supabase = getSupabaseServiceClient();
    if (!supabase) return json({ status: 'error', message: 'Vote service unavailable.' }, 503);

    const voterKey = voterKeyFromRequest(request);

    // Empty choice = explicit deselection (matches the UI's toggle behaviour)
    if (!choice && !rawChoice) {
      const { error: delError } = await supabase
        .from('votes')
        .delete()
        .eq('scope', scope)
        .eq('voter_key', voterKey);

      if (delError) {
        if (
          (delError as any).code === 'PGRST205' ||
          delError.message?.includes('Could not find the table') ||
          delError.message?.includes('relation "public.votes" does not exist')
        ) {
          console.warn('[vote] Table "public.votes" not found in Supabase.');
          return json({ status: 'error', message: 'Voting is temporarily unavailable.' }, 503);
        }
        console.error('[vote] delete failed:', delError.message);
        return json({ status: 'error', message: 'Could not remove your vote.' }, 502);
      }
      return json({ status: 'success', action: 'removed', scope });
    }

    if (!choice) {
      return json({ status: 'error', message: 'Invalid selection.' }, 400);
    }

    const { error: upsertError } = await supabase
      .from('votes')
      .upsert(
        { scope, choice, voter_key: voterKey },
        { onConflict: 'scope,voter_key' }
      );

    if (upsertError) {
      if (
        (upsertError as any).code === 'PGRST205' ||
        upsertError.message?.includes('Could not find the table') ||
        upsertError.message?.includes('relation "public.votes" does not exist')
      ) {
        console.warn('[vote] Table "public.votes" not found in Supabase.');
        return json({ status: 'error', message: 'Voting is temporarily unavailable.' }, 503);
      }
      console.error('[vote] upsert failed:', upsertError.message);
      return json({ status: 'error', message: 'Your vote could not be saved. Please try again.' }, 502);
    }

    return json({ status: 'success', action: 'recorded', scope });
  } catch (err) {
    console.error('[vote] POST error:', err);
    return json({ status: 'error', message: 'Failed to process vote.' }, 500);
  }
};
