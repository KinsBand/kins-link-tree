/**
 * Kins Essential Diagnostics & Telemetry Collector
 * Lightweight zero-dependency utility providing precise browser, in-app webview, and device environment detection.
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
 * Detects precise browser and operating system / device name.
 * Output examples: "Chrome (Android)", "Safari (iPhone)", "DuckDuckGo (iPhone)", "Brave (Mac)", "Instagram In-App (iPhone)"
 */
function detectEnvironment(ua = '') {
  // Device & OS detection
  let device = 'Device';
  if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/iPad/i.test(ua)) device = 'iPad';
  else if (/Android/i.test(ua)) device = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) {
    // Check if it's an iPad requesting desktop site
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) {
      device = 'iPad';
    } else {
      device = 'Mac';
    }
  } else if (/Windows/i.test(ua)) device = 'Windows';
  else if (/CrOS/i.test(ua)) device = 'ChromeOS';
  else if (/Linux/i.test(ua)) device = 'Linux';

  // Check Brave browser
  let isBrave = false;
  if (typeof navigator !== 'undefined') {
    try {
      if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        isBrave = true;
      }
    } catch (_) {}
  }

  let browser = 'Browser';

  // In-App WebViews & Social Browsers
  if (/Instagram/i.test(ua)) browser = 'Instagram In-App';
  else if (/TikTok|musical_ly/i.test(ua)) browser = 'TikTok In-App';
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) browser = 'Facebook In-App';
  else if (/Discord/i.test(ua)) browser = 'Discord In-App';
  else if (/Twitter|TwitterAndroid/i.test(ua)) browser = 'Twitter In-App';
  else if (/Reddit/i.test(ua)) browser = 'Reddit In-App';
  else if (/Snapchat/i.test(ua)) browser = 'Snapchat In-App';
  else if (/Line\//i.test(ua)) browser = 'Line In-App';
  // Standalone Browsers
  else if (/DuckDuckGo|Ddg\//i.test(ua)) browser = 'DuckDuckGo';
  else if (isBrave || /Brave/i.test(ua)) browser = 'Brave';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Arc/i.test(ua)) browser = 'Arc';
  else if (/EdgA?\/|Edge\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Vivaldi/i.test(ua)) browser = 'Vivaldi';
  else if (/UCBrowser/i.test(ua)) browser = 'UC Browser';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Android/i.test(ua)) browser = 'Safari';

  return `${browser} (${device})`;
}

/**
 * Collects lightweight essential diagnostics.
 */
export function getEssentialDiagnostics() {
  if (typeof window === 'undefined') {
    return {
      viewport: '0x0',
      pixelRatio: 1,
      viewportWithDpr: '0x0 (@1x)',
      platform: 'Server',
      environment: 'Server',
      url: '',
      userAgent: '',
      buildVersion: '2026.08.1-prod',
      lastError: '',
      timestamp: new Date().toISOString(),
      formattedDate: ''
    };
  }

  const ua = navigator.userAgent || '';
  const dpr = Math.round((window.devicePixelRatio || 1) * 10) / 10;
  const environment = detectEnvironment(ua);

  // Formatted date (e.g. 14 Aug 2026, 22:20)
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
    platform: navigator.platform,
    environment: environment,
    url: window.location.href,
    buildVersion: '2026.08.1-prod',
    lastError: lastUnhandledError,
    timestamp: now.toISOString(),
    formattedDate: formattedDate,
    userAgent: ua
  };
}
