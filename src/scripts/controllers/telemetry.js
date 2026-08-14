/**
 * Kins Essential Diagnostics & Telemetry Collector
 * Lightweight (~1KB), zero-dependency utility collecting the 5 essentials for UI/frontend bug reproduction.
 */

let lastUnhandledError = '';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    try {
      lastUnhandledError = `${e.message || 'Unknown error'} (${e.filename ? e.filename.split('/').pop() : ''}:${e.lineno || 0})`;
    } catch (_) {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
      lastUnhandledError = `Unhandled: ${reason.slice(0, 100)}`;
    } catch (_) {}
  });
}

/**
 * Collects lightweight essential diagnostics.
 */
export function getEssentialDiagnostics() {
  if (typeof window === 'undefined') {
    return {
      viewport: '0x0',
      pixelRatio: 1,
      platform: 'Server',
      environment: 'Server',
      url: '',
      userAgent: '',
      timestamp: new Date().toISOString(),
      formattedDate: ''
    };
  }

  const ua = navigator.userAgent || '';
  const dpr = Math.round((window.devicePixelRatio || 1) * 10) / 10;

  // In-App browser detection
  let inAppName = '';
  if (/Instagram/i.test(ua)) inAppName = 'Instagram';
  else if (/TikTok|musical_ly/i.test(ua)) inAppName = 'TikTok';
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) inAppName = 'Facebook';
  else if (/Discord/i.test(ua)) inAppName = 'Discord';
  else if (/Reddit/i.test(ua)) inAppName = 'Reddit';
  else if (/Line/i.test(ua)) inAppName = 'Line';
  else if (/Snapchat/i.test(ua)) inAppName = 'Snapchat';

  // OS detection
  let os = 'Unknown OS';
  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  const environment = inAppName
    ? `In-App Browser (${inAppName} ${os})`
    : `Standard Browser (${os})`;

  // Formatted date (e.g. 14 Aug 2026, 21:40)
  const now = new Date();
  const dateOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  let formattedDate = now.toISOString();
  try {
    formattedDate = new Intl.DateTimeFormat('en-GB', dateOptions).format(now);
  } catch (_) {}

  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: dpr,
    viewportWithDpr: `${window.innerWidth}x${window.innerHeight} (@${dpr}x)`,
    platform: navigator.platform || os,
    environment: environment,
    url: window.location.href,
    buildVersion: '2026.08.1-prod',
    lastError: lastUnhandledError,
    timestamp: now.toISOString(),
    formattedDate: formattedDate,
    userAgent: ua
  };
}
