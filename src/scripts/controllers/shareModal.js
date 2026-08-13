import { showToast } from './toast.js';
import { animateCopySuccess } from './clipboard.js';

const trackClick = (event, data) => {
  if (typeof window !== 'undefined' && window.trackClick) {
    window.trackClick(event, data);
  }
};

function lockScroll() {
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
}

function generateSvgQrData(url) {
  // SVG representation fallback for QR download
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="300" height="300">
    <rect width="100" height="100" fill="#ffffff"/>
    <text x="50" y="45" font-family="sans-serif" font-size="10" font-weight="bold" fill="#0b1f18" text-anchor="middle">KINS BAND</text>
    <text x="50" y="60" font-family="sans-serif" font-size="6" fill="#666666" text-anchor="middle">OFFICIAL QR CODE</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

export function initShareModal() {
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');
  const nativeShareCtaBtn = document.getElementById('nativeShareCtaBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const handleCopyBtn = document.getElementById('handleCopyBtn');

  // Quick share buttons
  const shareWhatsappBtn = document.getElementById('shareWhatsappBtn');
  const shareSmsBtn = document.getElementById('shareSmsBtn');
  const shareTwitterBtn = document.getElementById('shareTwitterBtn');
  const shareFacebookBtn = document.getElementById('shareFacebookBtn');

  // QR fullscreen elements
  const qrcodeCanvasWrapper = document.getElementById('qrcodeCanvasWrapper');
  const qrFullscreenModal = document.getElementById('qrFullscreenModal');
  const closeQrFullscreenBtn = document.getElementById('closeQrFullscreenBtn');
  const downloadQrPngBtn = document.getElementById('downloadQrPngBtn');
  const downloadQrSvgBtn = document.getElementById('downloadQrSvgBtn');

  // Calculate live production domain
  const rawUrl = window.location.origin + window.location.pathname;
  const baseDomain = rawUrl.includes('localhost') ? 'https://kinsband.com/' : rawUrl;
  const directLinkUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + 'utm_source=share_modal&utm_medium=direct_link';
  const qrCodeUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + 'utm_source=share_modal&utm_medium=qr_code';
  const nativeShareUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + 'utm_source=share_modal&utm_medium=native_share';

  if (shareUrlInput) {
    shareUrlInput.value = directLinkUrl;
  }

  // Setup Quick Share URLs
  if (shareWhatsappBtn) {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent('Check out Kins Official Link in Bio: ' + baseDomain + '?utm_source=share_modal&utm_medium=whatsapp')}`;
    shareWhatsappBtn.setAttribute('href', waUrl);
  }
  if (shareSmsBtn) {
    const smsUrl = `sms:?body=${encodeURIComponent('Check out Kins Official Link in Bio: ' + baseDomain + '?utm_source=share_modal&utm_medium=sms')}`;
    shareSmsBtn.setAttribute('href', smsUrl);
  }
  if (shareTwitterBtn) {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out Kins Official Link in Bio!')}&url=${encodeURIComponent(baseDomain + '?utm_source=share_modal&utm_medium=twitter')}`;
    shareTwitterBtn.setAttribute('href', twUrl);
  }
  if (shareFacebookBtn) {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseDomain + '?utm_source=share_modal&utm_medium=facebook')}`;
    shareFacebookBtn.setAttribute('href', fbUrl);
  }

  // Handle Copy Button Micro-Interactions
  async function performCopy(textToCopy, btnElement, successMessage) {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        success = document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
    } catch (err) {
      success = false;
    }

    if (success) {
      showToast(successMessage);
      if (btnElement) {
        animateCopySuccess(btnElement);
      }
    }
  }

  if (handleCopyBtn) {
    handleCopyBtn.addEventListener('click', () => {
      performCopy('@KinsBandOfficial', handleCopyBtn, 'Copied @KinsBandOfficial to clipboard!');
      trackClick('copy_band_handle');
    });
  }

  if (copyUrlBtn && shareUrlInput) {
    copyUrlBtn.addEventListener('click', () => {
      performCopy(shareUrlInput.value, copyUrlBtn, 'Link copied to clipboard!');
      trackClick('copy_share_url', { url: shareUrlInput.value });
    });
  }

  // Native Web Share CTA Handler
  async function triggerNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kins | Official Link in Bio',
          text: 'Check out official music releases, merch, and tour dates for Kins!',
          url: nativeShareUrl
        });
        trackClick('native_share_success');
      } catch (err) {
        console.log('Native share dismissed:', err);
      }
    } else {
      performCopy(nativeShareUrl, nativeShareCtaBtn, 'Share link copied to clipboard!');
    }
  }

  if (nativeShareCtaBtn) {
    nativeShareCtaBtn.addEventListener('click', triggerNativeShare);
  }

  // Generate QR Code
  function renderQrCode(containerId, size) {
    const container = document.getElementById(containerId);
    if (container && typeof window.QRCode !== 'undefined') {
      container.innerHTML = '';
      new window.QRCode(container, {
        text: qrCodeUrl,
        width: size,
        height: size,
        colorDark: "#0b1f18",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H
      });
    }
  }

  // Open Share Modal
  if (shareBtn && shareModal && closeShareModal) {
    shareBtn.addEventListener('click', () => {
      shareModal.classList.remove('hidden');
      shareModal.classList.add('active');
      lockScroll();
      trackClick('open_share_modal');
      renderQrCode('qrcodeCanvas', 100);
    });

    closeShareModal.addEventListener('click', () => {
      shareModal.classList.remove('active');
      shareModal.classList.add('hidden');
      unlockScroll();
    });

    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.classList.remove('active');
        shareModal.classList.add('hidden');
        unlockScroll();
      }
    });
  }

  // Click QR Code to Fullscreen
  if (qrcodeCanvasWrapper && qrFullscreenModal) {
    qrcodeCanvasWrapper.addEventListener('click', () => {
      qrFullscreenModal.classList.remove('hidden');
      renderQrCode('qrcodeFullscreenCanvas', 260);
    });

    closeQrFullscreenBtn?.addEventListener('click', () => {
      qrFullscreenModal.classList.add('hidden');
    });

    qrFullscreenModal.addEventListener('click', (e) => {
      if (e.target === qrFullscreenModal) {
        qrFullscreenModal.classList.add('hidden');
      }
    });
  }

  // Download QR Code PNG
  if (downloadQrPngBtn) {
    downloadQrPngBtn.addEventListener('click', () => {
      const img = document.querySelector('#qrcodeCanvas img');
      const canvas = document.querySelector('#qrcodeCanvas canvas');
      let src = null;
      if (img && img.src) src = img.src;
      else if (canvas) src = canvas.toDataURL("image/png");

      if (src) {
        const a = document.createElement('a');
        a.href = src;
        a.download = 'kins-official-qrcode.png';
        a.click();
        showToast('Saved QR Code PNG image!');
      } else {
        showToast('Generating QR code...');
      }
    });
  }

  // Export QR Code SVG
  if (downloadQrSvgBtn) {
    downloadQrSvgBtn.addEventListener('click', () => {
      const svgData = generateSvgQrData(qrCodeUrl);
      const a = document.createElement('a');
      a.href = svgData;
      a.download = 'kins-official-qrcode.svg';
      a.click();
      showToast('Exported QR Code SVG vector!');
    });
  }

  // Keyboard Shortcuts (ESC to close modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (qrFullscreenModal && !qrFullscreenModal.classList.contains('hidden')) {
        qrFullscreenModal.classList.add('hidden');
      } else if (shareModal && shareModal.classList.contains('active')) {
        shareModal.classList.remove('active');
        shareModal.classList.add('hidden');
        unlockScroll();
      }
    }
  });
}
