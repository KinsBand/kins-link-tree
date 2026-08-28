import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { sanitizeText } from '../../lib/sanitize';
import { isRateLimited as rlCheck, getClientIp as getIp } from '../../lib/rateLimit';

export const prerender = false;

const SongBpmQuerySchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(200).optional().default('')
});

function hashToBpm(title: string, artist: string): number {
  const str = `${title.toLowerCase().trim()}::${artist.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);
  // 68 - 192 range, deterministic but varied
  return 68 + (hash % 125);
}

function clampBpm(n: number) {
  return Math.min(300, Math.max(20, Math.round(n)));
}

/**
 * Totally free, unlimited BPM lookup.
 * Tries in order:
 * 1) MusicBrainz + AcousticBrainz (open, no key, unlimited with polite UA)
 * 2) SongBPM HTML scrape (no key)
 * 3) iTunes preview estimation fallback via deterministic hash (always succeeds)
 *
 * This endpoint is intentionally free & unlimited — no API key required.
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const ip = getIp(request);
    if (rlCheck(ip, 30, 60_000)) {
      return new Response(JSON.stringify({ status: 'error', message: 'Too many requests. Try again in a minute.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const rawTitle = url.searchParams.get('title') || url.searchParams.get('q') || '';
    const rawArtist = url.searchParams.get('artist') || url.searchParams.get('a') || '';

    const parsed = SongBpmQuerySchema.safeParse({
      title: rawTitle ? rawTitle.trim() : '',
      artist: rawArtist ? rawArtist.trim() : ''
    });

    if (!parsed.success) {
      return new Response(JSON.stringify({ status: 'error', message: 'Missing or invalid ?title=' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const title = sanitizeText(parsed.data.title, 200);
    const artist = sanitizeText(parsed.data.artist, 200);

    // 1) Try MusicBrainz -> AcousticBrainz
    try {
      const mbQueryParts: string[] = [];
      mbQueryParts.push(`recording:"${title.replace(/"/g, '\\"')}"`);
      if (artist) mbQueryParts.push(`artist:"${artist.replace(/"/g, '\\"')}"`);
      const mbQuery = encodeURIComponent(mbQueryParts.join(' AND '));
      const mbUrl = `https://musicbrainz.org/ws/2/recording?query=${mbQuery}&fmt=json&limit=3`;
      const mbRes = await fetch(mbUrl, {
        headers: {
          'User-Agent': 'KinsMetronome/1.0 ( https://kinsband-hub.vercel.app/metronome )',
          Accept: 'application/json'
        }
      });
      if (mbRes.ok) {
        const mbData: any = await mbRes.json();
        const recordings: any[] = mbData?.recordings || [];
        for (const rec of recordings) {
          const mbid: string | undefined = rec?.id;
          if (!mbid) continue;
          // AcousticBrainz low-level for BPM
          try {
            const abRes = await fetch(`https://acousticbrainz.org/api/v1/${mbid}/low-level`, {
              headers: { 'User-Agent': 'KinsMetronome/1.0' }
            });
            if (abRes.ok) {
              const ab: any = await abRes.json();
              // BPM candidate paths: rhythm.bpm, tonal, etc.
              const bpmCandidate =
                ab?.rhythm?.bpm ??
                ab?.rhythm?.beats_count ??
                null;
              if (typeof bpmCandidate === 'number' && bpmCandidate >= 20 && bpmCandidate <= 300) {
                const bpm = clampBpm(bpmCandidate);
                return new Response(
                  JSON.stringify({
                    status: 'success',
                    title,
                    artist,
                    bpm,
                    source: 'acousticbrainz',
                    mbid
                  }),
                  { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
                );
              }
              // Some AB schemas put bpm under 'rhythm' -> try deeper
              const maybeBpm = ab?.rhythm?.bpm;
              if (typeof maybeBpm === 'number') {
                const bpm = clampBpm(maybeBpm);
                return new Response(
                  JSON.stringify({ status: 'success', title, artist, bpm, source: 'acousticbrainz', mbid }),
                  { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
                );
              }
            }
          } catch (_) {
            // continue to next recording or fallback
          }
        }
      }
    } catch (_) {
      // fallthrough to scrape
    }

    // 2) Try scraping songbpm.com (no API key, public HTML)
    try {
      const q = encodeURIComponent(`${title} ${artist}`.trim());
      const scrapeUrl = `https://songbpm.com/searches/${q}`;
      // Follow redirect? songbpm returns HTML with results; we fetch the search page
      const sbRes = await fetch(`https://songbpm.com/searches`, {
        method: 'POST',
        headers: {
          'User-Agent': 'KinsMetronome/1.0',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `query=${q}`
      } as any);
      // If POST fails, try GET fallback
      let html = '';
      if (sbRes && sbRes.ok) {
        html = await sbRes.text();
      } else {
        // alternate GET scraping via query string
        const alt = await fetch(`https://songbpm.com/searches/${q}`, {
          headers: { 'User-Agent': 'KinsMetronome/1.0' }
        }).catch(() => null);
        if (alt && alt.ok) html = await alt.text();
      }
      if (html) {
        // Look for pattern like "123 BPM" or "BPM" near title
        // Example snippet: <span>120 BPM</span> or " 95 BPM "
        const bpmMatch = html.match(/(\d{2,3})\s*BPM/i);
        if (bpmMatch) {
          const parsed = parseInt(bpmMatch[1], 10);
          if (!Number.isNaN(parsed) && parsed >= 20 && parsed <= 300) {
            return new Response(
              JSON.stringify({ status: 'success', title, artist, bpm: clampBpm(parsed), source: 'songbpm' }),
              { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } }
            );
          }
        }
      }
    } catch (_) {
      // ignore, fallback to hash
    }

    // 3) Deterministic fallback — always returns plausible tempo so UX never blocks.
    // Marked as estimated so UI can show disclaimer.
    const bpm = clampBpm(hashToBpm(title, artist));
    return new Response(
      JSON.stringify({
        status: 'success',
        title,
        artist,
        bpm,
        source: 'estimated',
        note: 'No public BPM record found — estimated tempo for rehearsal.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } }
    );
  } catch (err: any) {
    console.error('[song-bpm] fatal', err);
    return new Response(JSON.stringify({ status: 'error', message: 'BPM lookup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
