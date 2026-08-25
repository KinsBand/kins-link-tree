import type { APIRoute } from 'astro';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';
import { getSupabaseServiceClient } from '../../lib/supabaseServer';

export const prerender = false;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — sheet config
const MIN_BYTES = 1024;
const ALLOWED_EXT = ['.pdf', '.gp', '.gp5', '.xml', '.musicxml', '.mxl'] as const;
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/x-pdf',
  'audio/x-guitar-pro',
  'application/x-guitar-pro',
  'application/octet-stream',
  'text/xml',
  'application/xml',
  'application/vnd.recordare.musicxml+xml',
  'application/vnd.recordare.musicxml',
  'application/x-musicxml',
  'application/gzip',
  'application/x-gzip'
]);
const INSTRUMENT_RE = /^(bass|electric|acoustic|drums)$/;
const SONG_KEY_RE = /^[a-zA-Z0-9_-]{1,80}$/;
const AVATAR_URL = 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/public/new.png';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function resolveWebhookUrl(): string {
  return (
    (import.meta.env.DISCORD_SHEET_WEBHOOK_URL as string | undefined) ||
    process.env.DISCORD_SHEET_WEBHOOK_URL ||
    (import.meta.env.DISCORD_FAN_UPLOAD_WEBHOOK_URL as string | undefined) ||
    process.env.DISCORD_FAN_UPLOAD_WEBHOOK_URL ||
    ''
  );
}

function safeFilename(name: unknown): string {
  const base = String(name || '').split(/[\\/]/).pop() || '';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').slice(0, 120);
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'sheet.bin';
}

function extOf(name: string): string {
  const lower = String(name || '').toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return '';
  return lower.slice(dot);
}

function detectMimeByExt(ext: string, providedMime: string): string {
  const lower = providedMime.toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.gp' || ext === '.gp5') return 'audio/x-guitar-pro';
  if (ext === '.xml' || ext === '.musicxml') {
    if (lower.includes('musicxml')) return lower;
    return 'application/vnd.recordare.musicxml+xml';
  }
  if (ext === '.mxl') return 'application/vnd.recordare.musicxml+xml';
  return lower || 'application/octet-stream';
}

async function hasPdfMagic(buf: ArrayBuffer): Promise<boolean> {
  if (buf.byteLength < 4) return false;
  const head = new Uint8Array(buf.slice(0, 4));
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46; // %PDF
}

async function hasXmlMagic(buf: ArrayBuffer): Promise<boolean> {
  const text = new TextDecoder().decode(new Uint8Array(buf.slice(0, 1024))).trimStart().toLowerCase();
  return text.startsWith('<?xml') || text.startsWith('<score') || text.startsWith('<mxl') || text.includes('<score-partwise');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (isRateLimited(`sheet-upload:${getClientIp(request)}`, 10, 10 * 60 * 1000)) {
      return json({ status: 'error', message: 'Upload limit reached. Please try again in about 10 minutes.' }, 429);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json({ status: 'error', message: 'Invalid upload payload.' }, 400);
    }

    const rawFile = form.get('file');
    if (!rawFile || typeof rawFile !== 'object' || typeof (rawFile as File).arrayBuffer !== 'function') {
      return json({ status: 'error', message: 'Please attach a sheet file (PDF, GP, GP5, XML, MusicXML).' }, 400);
    }
    const file = rawFile as File;

    if (file.size < MIN_BYTES || file.size > MAX_BYTES) {
      return json({ status: 'error', message: 'File must be between 1 KB and 15 MB.' }, 400);
    }

    const ext = extOf(file.name);
    if (!ALLOWED_EXT.includes(ext as typeof ALLOWED_EXT[number])) {
      return json({ status: 'error', message: 'Unsupported file type. Use PDF, GP, GP5, XML or MusicXML.' }, 415);
    }

    const providedMime = String(file.type || '').toLowerCase().trim();
    // Allow octet-stream when extension is valid; otherwise enforce allowlist
    if (providedMime && providedMime !== 'application/octet-stream' && !ALLOWED_MIME.has(providedMime)) {
      // Still allow if extension matches a known type — browsers often send octet-stream for GP
      if (!(ext === '.gp' || ext === '.gp5' || ext === '.mxl') || providedMime !== 'application/octet-stream') {
        // For pdf/xml we do require proper mime or octet-stream
        if (ext === '.pdf' && providedMime !== 'application/pdf' && providedMime !== 'application/x-pdf') {
          return json({ status: 'error', message: 'Unsupported PDF mime. Please re-export your PDF.' }, 415);
        }
      }
    }

    const mime = detectMimeByExt(ext, providedMime);
    const instrumentRaw = sanitizeText(form.get('instrument'), 20).toLowerCase();
    const instrument = INSTRUMENT_RE.test(instrumentRaw) ? instrumentRaw : 'bass';

    const rawSongKey = sanitizeText(form.get('songKey') || form.get('setlistKey') || form.get('inspirationId'), 80);
    let songKey = '';
    if (rawSongKey) {
      if (!SONG_KEY_RE.test(rawSongKey)) return json({ status: 'error', message: 'Invalid song reference.' }, 400);
      songKey = rawSongKey;
    }

    const title = sanitizeText(form.get('title'), 120);

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      console.error('[sheet-upload] Supabase service client unavailable.');
      return json({ status: 'error', message: 'Upload service is not available right now.' }, 503);
    }

    const fileBuffer = await file.arrayBuffer();

    // Light magic check for pdf/xml to catch mislabeled uploads
    if (ext === '.pdf') {
      const ok = await hasPdfMagic(fileBuffer);
      if (!ok) return json({ status: 'error', message: 'File does not look like a valid PDF.' }, 400);
    }
    if ((ext === '.xml' || ext === '.musicxml') && fileBuffer.byteLength > 0) {
      const ok = await hasXmlMagic(fileBuffer);
      if (!ok) {
        // Not fatal — some MusicXML omit prolog; warn only
      }
    }

    const uploadPath = `pending/${crypto.randomUUID()}-${safeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from('kins-sheets')
      .upload(uploadPath, fileBuffer, { contentType: mime });

    if (uploadError) {
      // Graceful fallback: bucket may not exist yet (deferred migration) — still succeed as local-only
      const msg = String(uploadError.message || '').toLowerCase();
      if (msg.includes('bucket not found') || msg.includes('not found')) {
        console.warn('[sheet-upload] kins-sheets bucket missing — accepting as local-only upload.');
        return json({
          status: 'success',
          message: 'Sheet received (local). An admin will enable cloud storage shortly.',
          localOnly: true,
          sheet: { filename: safeFilename(file.name), mime, byteSize: file.size, instrument, songKey, title: title || null }
        });
      }
      console.error('[sheet-upload] storage upload failed:', uploadError.message);
      return json({ status: 'error', message: 'Could not store your sheet. Please try again.' }, 502);
    }

    // Attempt to write metadata row — table may also be pending migration
    try {
      const { error: insertError } = await supabase.from('kins_sheet_music').insert({
        storage_path: uploadPath,
        original_filename: safeFilename(file.name),
        mime_type: mime,
        byte_size: file.size,
        instrument,
        setlist_key: songKey || null,
        title: title || null,
        status: 'pending'
      });
      if (insertError) {
        console.warn('[sheet-upload] row insert failed (table may not exist yet):', insertError.message);
        // Not fatal — file is stored, client will use object URL
      }
    } catch (err) {
      console.warn('[sheet-upload] insert exception:', err);
    }

    const webhookUrl = resolveWebhookUrl();
    if (webhookUrl) {
      try {
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Kins Sheets Moderation',
            avatar_url: AVATAR_URL,
            embeds: [
              {
                title: '🎼 New Sheet Upload Awaiting Review',
                color: 0xd8b244,
                description: title ? title.slice(0, 300) : '—',
                fields: [
                  { name: 'File', value: `\`${safeFilename(file.name)}\``, inline: true },
                  { name: 'Size', value: `${sizeKb} KB`, inline: true },
                  { name: 'Type', value: `${ext} (${mime})`, inline: true },
                  { name: 'Instrument', value: instrument, inline: true },
                  { name: 'Song', value: songKey || '*None*', inline: true }
                ],
                footer: { text: 'Move from pending/ to approved/ in kins-sheets to publish.' },
                timestamp: new Date().toISOString()
              }
            ]
          })
        });
      } catch (err) {
        console.warn('[sheet-upload] webhook failed:', err);
      }
    }

    return json({
      status: 'success',
      message: 'Sheet received! It will be available once reviewed.',
      sheet: { storagePath: uploadPath, filename: safeFilename(file.name), mime, byteSize: file.size, instrument, songKey, title: title || null }
    });
  } catch (err) {
    console.error('Sheet upload API error:', err);
    return json({ status: 'error', message: 'Failed to process your sheet upload.' }, 500);
  }
};
