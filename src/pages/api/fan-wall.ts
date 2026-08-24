import type { APIRoute } from 'astro';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const GIG_ID_RE = /^[a-zA-Z0-9_-]{1,60}$/;
const MAX_ITEMS = 60;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    if (isRateLimited(`fan-wall:${getClientIp(request)}`, 30, 60 * 1000)) {
      return json({ status: 'error', message: 'Too many requests.' }, 429);
    }

    let gigId = '';
    const rawGigId = url?.searchParams.get('gigId');
    if (rawGigId && rawGigId.trim()) {
      gigId = rawGigId.trim();
      if (!GIG_ID_RE.test(gigId)) {
        return json({ status: 'error', message: 'Invalid gig reference.' }, 400);
      }
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      console.error('[fan-wall] Supabase service client unavailable.');
      return json({ status: 'error', message: 'Fan wall service is not available right now.' }, 503);
    }

    let query = supabase
      .from('fan_uploads')
      .select('id, storage_path, media_type, caption, handle, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS);

    if (gigId) {
      query = query.eq('gig_id', gigId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[fan-wall] approved query failed:', error.message);
      return json({ status: 'error', message: 'Could not load fan wall media.' }, 502);
    }

    // Moderation moves files from pending/ to approved/. getPublicUrl only
    // composes the URL — it does not require object access rights.
    const items = (data || [])
      .map((row) => {
        const publicUrl = supabase.storage
          .from('fan-uploads')
          .getPublicUrl(String(row.storage_path || '').replace(/^pending\//, 'approved/')).data?.publicUrl;

        if (!publicUrl) return null;

        return {
          id: row.id,
          url: publicUrl,
          mediaType: row.media_type === 'video' ? 'video' : 'image',
          caption: row.caption || '',
          handle: row.handle || '',
          createdAt: row.created_at
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return json({ status: 'success', items });
  } catch (err) {
    console.error('[fan-wall] GET error:', err);
    return json({ status: 'error', message: 'Could not load fan wall media.' }, 500);
  }
};
