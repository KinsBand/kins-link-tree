export function trackClick(eventName, details = {}) {
  console.log(`[Analytics Track] Event: "${eventName}"`, details, `Timestamp: ${new Date().toISOString()}`);
}

export function initOutboundLinkAnalytics() {
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      const text = link.innerText.trim();
      trackClick('outbound_click', { text, href });
    });
  });
}
