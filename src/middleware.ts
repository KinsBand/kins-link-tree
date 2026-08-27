import { defineMiddleware } from 'astro:middleware';

/**
 * Security headers on every server-rendered response (pages + API routes).
 *
 * CSP ships in Report-Only mode first: the site currently relies on inline
 * scripts/styles (Astro `define:vars`, component <style> blocks) and third-party
 * CDNs, so an enforcing policy needs a nonce migration. Watch the browser
 * console for CSP violation reports, fix the sources below as they surface,
 * then flip `Content-Security-Policy-Report-Only` -> `Content-Security-Policy`.
 */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline'/'unsafe-eval' needed until nonce migration; accounts.google.com serves the GIS loader,
  // cdnjs loads qrcode.js, unpkg loads Leaflet when the gig map opens, jsdelivr loads sheet music deps.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  // data:/blob: cover fan-wall uploads and canvas-generated QR downloads
  "img-src 'self' data: blob: https://*.supabase.co https://*.cartocdn.com https://*.basemaps.cartocdn.com https://images.unsplash.com https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://itunes.apple.com https://accounts.google.com https://oauth2.googleapis.com https://cdn.jsdelivr.net https://*.basemaps.cartocdn.com https://*.cartocdn.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

const ENFORCED_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(self), payment=(), usb=(), interest-cohort=()',
  // Google One Tap opens popups — same-origin-allow-popups keeps it working under a COOP
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1'
};

export const onRequest = defineMiddleware((context, next) => {
  const response = next();

  if (!(response instanceof Response)) return response;

  const headers = response.headers;
  for (const [name, value] of Object.entries(ENFORCED_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }

  // HSTS is only meaningful over HTTPS — skip on localhost dev
  if (context.url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  if (!headers.has('Content-Security-Policy-Report-Only')) {
    headers.set('Content-Security-Policy-Report-Only', CSP_DIRECTIVES);
  }

  return response;
});
