import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const LiveTipsQuerySchema = z.object({
  after: z.string().max(100).optional().default('')
});

/**
 * Confirmed (Ko-fi webhook-verified) tips for live-chat superchat rendering.
 * Only published + public tips are returned; the client renders these as
 * superchats. No other tip source exists.
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (isRateLimited(`live-tips:${getClientIp(request)}`, 30, 60 * 1000)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Too many requests.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parsedQuery = LiveTipsQuerySchema.safeParse({
      after: url.searchParams.get('after') || ''
    });

    const afterParam = parsedQuery.success ? parsedQuery.data.after : '';
    const afterMs = afterParam ? Date.parse(afterParam) : NaN;
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Tips unavailable.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let query = supabase
      .from('tips')
      .select('id, amount, currency, supporter_name, message, created_at')
      .eq('published', true)
      .eq('is_public', true)
      .order('created_at', { ascending: true })
      .limit(20);

    if (Number.isFinite(afterMs)) {
      query = query.gt('created_at', new Date(afterMs).toISOString());
    }

    const { data, error } = await query;
    if (error) {
      if (
        (error as any).code === 'PGRST205' ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('relation "public.tips" does not exist')
      ) {
        console.warn('[live-tips] Table "tips" not initialized yet — returning empty tips array.');
        return new Response(
          JSON.stringify({ status: 'success', tips: [], serverTime: new Date().toISOString() }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
        );
      }
      console.error('[live-tips] query failed:', error.message);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Could not load tips.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tips = (data || []).map((t) => ({
      id: t.id,
      amount: `$${Number(t.amount).toFixed(0)}`,
      name: t.supporter_name || 'Superfan',
      message: t.message || 'Rock on Kins!',
      createdAt: t.created_at
    }));

    return new Response(
      JSON.stringify({ status: 'success', tips, serverTime: new Date().toISOString() }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[live-tips] error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to load tips.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
