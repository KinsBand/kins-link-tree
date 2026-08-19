import { showToast } from './toast.js';
import { animateCopySuccess } from './clipboard.js';
import { trackKinsInteraction } from '../../lib/analytics';

const trackClick = (event, data = {}) => {
  trackKinsInteraction(event, 'social', {
    container_scope: 'modal:share',
    ...data
  });
};

function lockScroll() {
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
}

export async function ensureQrCodeLoaded() {
  if (typeof window !== 'undefined' && window.QRCode) return true;
  if (!document.getElementById('qrcode-js-dyn')) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = 'qrcode-js-dyn';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }
  return true;
}

async function createBrandedQrCanvas(textUrl, totalSize = 1200, callback) {
  await ensureQrCodeLoaded();
  if (typeof window.QRCode === 'undefined') {
    if (callback) callback(null);
    return;
  }

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);

  // 76% of total size for QR matrix → 12% quiet-zone white margin on every side
  // Wider quiet zone = faster finder-pattern detection by camera scanners
  const qrSize = Math.round(totalSize * 0.76);
  const padding = Math.round((totalSize - qrSize) / 2);

  new window.QRCode(tempDiv, {
    text: textUrl,
    width: qrSize,
    height: qrSize,
    colorDark: "#000000",   // Pure black for maximum scanner contrast
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.H
  });

  setTimeout(() => {
    const rawCanvas = tempDiv.querySelector('canvas');
    if (!rawCanvas) {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d');

    // Fill entire canvas with white quiet-zone background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalSize, totalSize);

    // Draw QR matrix centered with crisp nearest-neighbor rendering (no anti-alias blur)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rawCanvas, padding, padding, qrSize, qrSize);
    ctx.imageSmoothingEnabled = true;

    const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';

    const finishCanvas = (logoImg) => {
      const center = totalSize / 2;
      // Reduced badge: ~13% diameter (6.5% radius) — safely within Level H 30% tolerance
      // Smaller badge = less data modules obscured = faster & more reliable scans
      const radius = Math.round(totalSize * 0.065);
      const logoSize = Math.round(radius * 1.4);

      ctx.save();
      // White quiet ring around badge to separate it from QR data modules
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(center, center, radius + Math.round(totalSize * 0.012), 0, Math.PI * 2);
      ctx.fill();

      // Solid dark circle badge
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

      // Crisp white border ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, Math.round(totalSize * 0.005));
      ctx.stroke();

      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
        let w = logoSize;
        let h = logoSize;
        if (aspect > 1) {
          h = w / aspect;
        } else {
          w = h * aspect;
        }
        ctx.drawImage(logoImg, center - w / 2, center - h / 2, w, h);
      } else {
        // High contrast white text fallback
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.round(totalSize * 0.042)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('KINS', center, center);
      }
      ctx.restore();

      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
      if (callback) callback(canvas);
    };

    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => finishCanvas(logoImg);
    logoImg.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => finishCanvas(fallbackImg);
      fallbackImg.onerror = () => finishCanvas(null);
      fallbackImg.src = `${baseUrl}/kins-logo-new.jpg`;
    };
    logoImg.src = `${baseUrl}/kins-logo-new.png`;
  }, 70);
}

function generateVectorQr(textUrl, format, callback) {
  createBrandedQrCanvas(textUrl, 800, (canvas) => {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, 800, 800);
    const data = imgData.data;

    if (format === 'svg') {
      let rects = '';
      const step = 8;
      for (let y = 0; y < 800; y += step) {
        for (let x = 0; x < 800; x += step) {
          const idx = (y * 800 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const dx = x - 400;
          const dy = y - 400;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if ((r + g + b) / 3 < 100 && dist > 72) {
            rects += `<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="#0a0a0c"/>\n`;
          }
        }
      }

      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <rect width="800" height="800" fill="#ffffff"/>
  <g>${rects}</g>
  <circle cx="400" cy="400" r="70" fill="#0a0a0c" stroke="#ffffff" stroke-width="5"/>
  <text x="400" y="414" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="900" fill="#ffffff" letter-spacing="4" text-anchor="middle">KINS</text>
</svg>`;
      callback('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString));
    } else if (format === 'eps') {
      let epsModules = '';
      const step = 8;
      for (let y = 0; y < 800; y += step) {
        for (let x = 0; x < 800; x += step) {
          const idx = (y * 800 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const dx = x - 400;
          const dy = y - 400;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if ((r + g + b) / 3 < 100 && dist > 72) {
            const epsY = 800 - y - step;
            epsModules += `${x} ${epsY} ${step} ${step} rectfill\n`;
          }
        }
      }

      const epsString = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 800 800
%%Title: Kins Official Branded QR Code
%%Creator: Kins Band Official Website
%%Pages: 1
%%EndComments

% White Background
1 1 1 setrgbcolor
0 0 800 800 rectfill

% Dark Modules
0.039 0.039 0.047 setrgbcolor
${epsModules}
% Center Quiet Zone Badge
0.039 0.039 0.047 setrgbcolor
newpath 400 400 70 0 360 arc fill
1 1 1 setrgbcolor
newpath 400 400 70 0 360 arc 5 setlinewidth stroke

% KINS Text
/Helvetica-Bold findfont 42 scalefont setfont
400 398 moveto
(KINS) dup stringwidth pop 2 div neg 0 rmoveto show

showpage
%%EOF`;
      callback('data:application/postscript;charset=utf-8,' + encodeURIComponent(epsString));
    }
  });
}

export function initShareModal() {
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');
  const nativeShareCtaBtn = document.getElementById('nativeShareCtaBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const handleCopyBtn = document.getElementById('handleCopyBtn');

  // QR fullscreen & format selector modal elements
  const qrcodeCanvasWrapper = document.getElementById('qrcodeCanvasWrapper');
  const qrFullscreenModal = document.getElementById('qrFullscreenModal');
  const closeQrFullscreenBtn = document.getElementById('closeQrFullscreenBtn');
  const openQrDownloadModalBtn = document.getElementById('openQrDownloadModalBtn');
  const qrDownloadFormatModal = document.getElementById('qrDownloadFormatModal');
  const closeQrFormatModalBtn = document.getElementById('closeQrFormatModalBtn');

  // Calculate live production domain
  const rawUrl = window.location.origin + window.location.pathname;
  const baseDomain = rawUrl.includes('localhost') ? 'https://kinsband.com/' : rawUrl;
  const directLinkUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + 'utm_source=share_modal&utm_medium=direct_link';
  const qrCodeUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + 'utm_source=share_modal&utm_medium=qr_code';
  const nativeShareUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + 'utm_source=share_modal&utm_medium=native_share';

  if (shareUrlInput) {
    shareUrlInput.value = directLinkUrl;
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

  // Social App Share Buttons Handler
  const shareAppButtons = document.querySelectorAll('#shareAppsGrid .share-app-pill-btn');
  shareAppButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const app = btn.getAttribute('data-share-app') || 'other';
      const shareTitle = 'Kins | Official Link in Bio';
      const shareMessage = 'Check out official music releases, merch, and tour dates for Kins!';
      const appShareUrl = baseDomain + (baseDomain.includes('?') ? '&' : '?') + `utm_source=share_modal&utm_medium=app_${app}&utm_campaign=fan_share`;

      // Track telemetry event for specific app clicked
      trackClick('share_app_selected', {
        app: app,
        app_name: app.toUpperCase(),
        share_url: appShareUrl,
        method: 'app_button'
      });
      trackClick('share_action', {
        action_type: 'app_share',
        destination_app: app
      });

      if (app === 'whatsapp') {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${appShareUrl}`)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening WhatsApp...');
      } else if (app === 'instagram') {
        performCopy(appShareUrl, btn, 'Link copied! Open Instagram to share in Stories or DM.');
      } else if (app === 'twitter') {
        const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(appShareUrl)}`;
        window.open(twUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening X / Twitter...');
      } else if (app === 'facebook') {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appShareUrl)}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening Facebook...');
      } else if (app === 'telegram') {
        const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(appShareUrl)}&text=${encodeURIComponent(shareMessage)}`;
        window.open(tgUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening Telegram...');
      } else if (app === 'reddit') {
        const rdUrl = `https://reddit.com/submit?url=${encodeURIComponent(appShareUrl)}&title=${encodeURIComponent(shareTitle)}`;
        window.open(rdUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening Reddit...');
      } else if (app === 'sms') {
        const smsUrl = `sms:?&body=${encodeURIComponent(`${shareMessage} ${appShareUrl}`)}`;
        window.location.href = smsUrl;
        showToast('Opening Messages...');
      } else if (app === 'email') {
        const mailUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareMessage}\n\n${appShareUrl}`)}`;
        window.location.href = mailUrl;
        showToast('Opening Email...');
      }
    });
  });

  // Native Web Share CTA Handler
  async function triggerNativeShare() {
    trackClick('share_native_invoked', {
      method: 'native_web_share_api',
      app: 'native'
    });
    trackClick('share_app_selected', {
      app: 'native',
      app_name: 'NATIVE_SYSTEM_SHEET',
      share_url: nativeShareUrl,
      method: 'native_cta'
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kins | Official Link in Bio',
          text: 'Check out official music releases, merch, and tour dates for Kins!',
          url: nativeShareUrl
        });
        trackClick('native_share_success', { app: 'native', outcome: 'completed' });
        trackClick('share_action', { action_type: 'app_share', destination_app: 'native_sheet' });
      } catch (err) {
        trackClick('native_share_dismissed', { app: 'native' });
        console.log('Native share dismissed:', err);
      }
    } else {
      performCopy(nativeShareUrl, nativeShareCtaBtn, 'Share link copied to clipboard!');
      trackClick('share_native_fallback_copy', { app: 'native' });
    }
  }

  if (nativeShareCtaBtn) {
    nativeShareCtaBtn.addEventListener('click', triggerNativeShare);
  }

  // Render High-Resolution QR Code image with 100% scan accuracy
  async function renderQrCode(containerId, displaySize) {
    const container = document.getElementById(containerId);
    if (!container) return;
    await ensureQrCodeLoaded();
    if (typeof window.QRCode === 'undefined') return;

    createBrandedQrCanvas(qrCodeUrl, 600, (canvas) => {
      if (!canvas) return;
      container.innerHTML = '';
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/png');
      img.alt = 'Kins Official Branded QR Code';
      img.style.width = `${displaySize}px`;
      img.style.height = `${displaySize}px`;
      img.style.display = 'block';
      img.style.borderRadius = '4px';
      container.appendChild(img);
    });
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

  // Download Format Selector Pop-Up Modal Controls
  if (openQrDownloadModalBtn && qrDownloadFormatModal) {
    openQrDownloadModalBtn.addEventListener('click', () => {
      qrDownloadFormatModal.classList.remove('hidden');
    });

    closeQrFormatModalBtn?.addEventListener('click', () => {
      qrDownloadFormatModal.classList.add('hidden');
    });

    qrDownloadFormatModal.addEventListener('click', (e) => {
      if (e.target === qrDownloadFormatModal) {
        qrDownloadFormatModal.classList.add('hidden');
      }
    });
  }

  // Format Selection Card Handlers (JPEG, PNG, EPS, SVG)
  const formatCards = document.querySelectorAll('#qrDownloadFormatModal .format-option-card');
  formatCards.forEach(card => {
    card.addEventListener('click', () => {
      const format = card.getAttribute('data-format') || 'png';
      if (qrDownloadFormatModal) qrDownloadFormatModal.classList.add('hidden');

      showToast(`Preparing ${format.toUpperCase()} export...`);

      const triggerDownload = (dataUrl, filename) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
        showToast(`Downloaded Kins QR Code (${format.toUpperCase()})!`);
      };

      if (format === 'jpeg') {
        createBrandedQrCanvas(qrCodeUrl, 1200, (canvas) => {
          triggerDownload(canvas.toDataURL('image/jpeg', 0.98), 'kins-official-qrcode.jpg');
          trackClick('share_qr_downloaded', { format: 'jpg' });
          trackClick('share_action', { action_type: 'qr_download', format: 'jpg' });
        });
      } else if (format === 'png') {
        createBrandedQrCanvas(qrCodeUrl, 1200, (canvas) => {
          triggerDownload(canvas.toDataURL('image/png'), 'kins-official-qrcode.png');
          trackClick('share_qr_downloaded', { format: 'png' });
          trackClick('share_action', { action_type: 'qr_download', format: 'png' });
        });
      } else if (format === 'eps') {
        generateVectorQr(qrCodeUrl, 'eps', (dataUrl) => {
          triggerDownload(dataUrl, 'kins-official-qrcode.eps');
          trackClick('share_qr_downloaded', { format: 'eps' });
          trackClick('share_action', { action_type: 'qr_download', format: 'eps' });
        });
      } else if (format === 'svg') {
        generateVectorQr(qrCodeUrl, 'svg', (dataUrl) => {
          triggerDownload(dataUrl, 'kins-official-qrcode.svg');
          trackClick('share_qr_downloaded', { format: 'svg' });
          trackClick('share_action', { action_type: 'qr_download', format: 'svg' });
        });
      }
    });
  });

  // Band Logo Format Selector Modal Controls
  const openLogoDownloadModalBtn = document.getElementById('openLogoDownloadModalBtn');
  const openLogoDownloadModalBox = document.getElementById('openLogoDownloadModalBox');
  const logoDownloadFormatModal = document.getElementById('logoDownloadFormatModal');
  const closeLogoFormatModalBtn = document.getElementById('closeLogoFormatModalBtn');

  if (logoDownloadFormatModal) {
    openLogoDownloadModalBtn?.addEventListener('click', () => {
      logoDownloadFormatModal.classList.remove('hidden');
    });

    openLogoDownloadModalBox?.addEventListener('click', () => {
      logoDownloadFormatModal.classList.remove('hidden');
    });

    closeLogoFormatModalBtn?.addEventListener('click', () => {
      logoDownloadFormatModal.classList.add('hidden');
    });

    logoDownloadFormatModal.addEventListener('click', (e) => {
      if (e.target === logoDownloadFormatModal) {
        logoDownloadFormatModal.classList.add('hidden');
      }
    });
  }

  // Band Logo Export Format Handlers (PNG, JPG, SVG, WEBP)
  const logoFormatCards = document.querySelectorAll('#logoDownloadFormatModal .format-option-card');
  logoFormatCards.forEach(card => {
    card.addEventListener('click', () => {
      const format = card.getAttribute('data-logo-format') || 'png';
      if (logoDownloadFormatModal) logoDownloadFormatModal.classList.add('hidden');

      showToast(`Preparing Band Logo (${format.toUpperCase()})...`);
      const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';

      const triggerDownload = (dataUrl, filename) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
        showToast(`Downloaded Band Logo (${format.toUpperCase()})!`);
        trackClick('share_logo_downloaded', { format });
        trackClick('share_action', { action_type: 'logo_download', format });
      };

      if (format === 'png') {
        triggerDownload(`${baseUrl}/kins-logo-new.png`, 'kins-band-official-logo.png');
      } else if (format === 'jpeg') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 800;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0a0a0c';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          triggerDownload(canvas.toDataURL('image/jpeg', 0.95), 'kins-band-official-logo.jpg');
        };
        img.src = `${baseUrl}/kins-logo-new.png`;
      } else if (format === 'svg') {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
  <rect width="800" height="400" fill="#0a0a0c"/>
  <text x="400" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="120" font-weight="900" fill="#ffffff" letter-spacing="12" text-anchor="middle">KINS</text>
</svg>`;
        triggerDownload('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString), 'kins-band-official-logo.svg');
      } else if (format === 'webp') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 800;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          triggerDownload(canvas.toDataURL('image/webp', 0.95), 'kins-band-official-logo.webp');
        };
        img.src = `${baseUrl}/kins-logo-new.png`;
      }
    });
  });

  // Keyboard Shortcuts (ESC to close modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (logoDownloadFormatModal && !logoDownloadFormatModal.classList.contains('hidden')) {
        logoDownloadFormatModal.classList.add('hidden');
      } else if (qrDownloadFormatModal && !qrDownloadFormatModal.classList.contains('hidden')) {
        qrDownloadFormatModal.classList.add('hidden');
      } else if (qrFullscreenModal && !qrFullscreenModal.classList.contains('hidden')) {
        qrFullscreenModal.classList.add('hidden');
      } else if (shareModal && shareModal.classList.contains('active')) {
        shareModal.classList.remove('active');
        shareModal.classList.add('hidden');
        unlockScroll();
      }
    }
  });
}
