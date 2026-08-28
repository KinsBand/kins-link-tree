import { showToast } from './toast.js';
import { animateCopySuccess } from './clipboard.js';

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

export async function createBrandedQrCanvas(textUrl, totalSize = 1200, callback) {
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

  // 76% of total size for QR matrix -> 12% quiet-zone white margin on every side
  const qrSize = Math.round(totalSize * 0.76);
  const padding = Math.round((totalSize - qrSize) / 2);

  new window.QRCode(tempDiv, {
    text: textUrl,
    width: qrSize,
    height: qrSize,
    colorDark: "#000000",
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

    // Draw QR matrix centered
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rawCanvas, padding, padding, qrSize, qrSize);
    ctx.imageSmoothingEnabled = true;

    const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';

    const finishCanvas = (logoImg) => {
      const center = totalSize / 2;
      const radius = Math.round(totalSize * 0.065);
      const logoSize = Math.round(radius * 1.4);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(center, center, radius + Math.round(totalSize * 0.012), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

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
    logoImg.onerror = () => finishCanvas(null);
    logoImg.src = `${baseUrl}/new.png`;
  }, 70);
}

function generateVectorQr(textUrl, format, callback) {
  createBrandedQrCanvas(textUrl, 800, (canvas) => {
    if (!canvas) {
      if (callback) callback(null);
      return;
    }
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

/**
 * Attaches swipe-to-dismiss gesture tracking to a bottom sheet modal with accidental scroll protection.
 */
function setupBottomSheetGestures(modalBackdrop, sheetWrapper, dragHandle, floatingPill, scrollContainer) {
  if (!modalBackdrop || !sheetWrapper) return;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let isTouchActive = false;
  let startedFromTop = false;

  const scrollEl = scrollContainer || sheetWrapper.querySelector('.modal-body, .qr-format-modal-content, .qr-fullscreen-content, .share-modal-enhanced') || sheetWrapper;

  // Direct handle / pill touch (always allows dragging down)
  const onHandleTouchStart = (e) => {
    startY = e.touches[0].clientY;
    currentY = startY;
    isDragging = true;
    isTouchActive = true;
    startedFromTop = true;
  };

  // Content body touch (ONLY allows dragging when at the absolute top of content)
  const onBodyTouchStart = (e) => {
    if (scrollEl && scrollEl.scrollTop <= 0) {
      startY = e.touches[0].clientY;
      currentY = startY;
      isDragging = false;
      isTouchActive = true;
      startedFromTop = true;
    } else {
      startedFromTop = false;
      isDragging = false;
      isTouchActive = false;
    }
  };

  const onTouchMove = (e) => {
    if (!isTouchActive || !startedFromTop || !sheetWrapper) return;

    // If content has been scrolled down, never drag the sheet
    if (scrollEl && scrollEl.scrollTop > 0) {
      if (isDragging) {
        isDragging = false;
        sheetWrapper.style.transform = '';
      }
      return;
    }

    const deltaY = e.touches[0].clientY - startY;

    // Require deadzone threshold of 10px downward to prevent accidental triggers while scrolling content
    if (deltaY > 10) {
      isDragging = true;
      if (e.cancelable) e.preventDefault();
      const visualDelta = deltaY - 10;
      sheetWrapper.style.transform = `translateY(${visualDelta}px)`;
      sheetWrapper.style.transition = 'none';
    } else {
      if (isDragging) {
        sheetWrapper.style.transform = '';
      }
    }
    currentY = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!isTouchActive || !sheetWrapper) return;
    isTouchActive = false;
    startedFromTop = false;

    if (!isDragging) return;
    isDragging = false;

    const deltaY = currentY - startY;
    sheetWrapper.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';

    if (deltaY > 80) {
      closeSheetSmoothly(modalBackdrop, sheetWrapper);
    } else {
      sheetWrapper.style.transform = '';
    }
  };

  if (dragHandle) {
    dragHandle.addEventListener('touchstart', onHandleTouchStart, { passive: false });
    dragHandle.addEventListener('touchmove', onTouchMove, { passive: false });
    dragHandle.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  if (floatingPill) {
    floatingPill.addEventListener('touchstart', onHandleTouchStart, { passive: false });
    floatingPill.addEventListener('touchmove', onTouchMove, { passive: false });
    floatingPill.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  sheetWrapper.addEventListener('touchstart', onBodyTouchStart, { passive: true });
  sheetWrapper.addEventListener('touchmove', onTouchMove, { passive: false });
  sheetWrapper.addEventListener('touchend', onTouchEnd, { passive: true });
}

function closeSheetSmoothly(modalBackdrop, modalContent, onClosed) {
  if (!modalBackdrop) return;
  if (modalContent) {
    modalContent.style.transform = 'translateY(100%)';
  }
  setTimeout(() => {
    modalBackdrop.classList.remove('active');
    modalBackdrop.classList.add('hidden');
    if (modalContent) modalContent.style.transform = '';
    if (onClosed) onClosed();
  }, 220);
}

// Real-time PWA Installation State Engine
let deferredInstallPrompt = (typeof window !== 'undefined' && window.__kinsDeferredInstallPrompt) || null;
let isAppInstalledOnDevice = false;

async function detectActualInstalledState() {
  if (typeof window === 'undefined') return false;

  // 1. Standalone display mode check
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       (typeof document !== 'undefined' && document.referrer.includes('android-app://'));

  if (isStandalone) {
    return true;
  }

  // 2. Native getInstalledRelatedApps() API check (Chrome/Android/Desktop PWA)
  if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
    try {
      const related = await navigator.getInstalledRelatedApps();
      if (related && related.length > 0) {
        return true;
      }
    } catch (e) {}
  }

  return false;
}

export function initShareModal() {
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const shareSheetWrapper = document.getElementById('shareSheetWrapper');
  const shareModalContent = document.getElementById('shareModalContent');
  const sheetDragHandle = document.getElementById('sheetDragHandle');
  const closeShareModal = document.getElementById('closeShareModal');
  const nativeShareCtaBtn = document.getElementById('nativeShareCtaBtn');
  const downloadPwaCtaBtn = document.getElementById('downloadPwaCtaBtn');
  
  // Interactive Copy Rows
  const copyUrlRow = document.getElementById('copyUrlRow');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const shareUrlInput = document.getElementById('shareUrlInput');

  const copyHandleRow = document.getElementById('copyHandleRow');
  const handleCopyBtn = document.getElementById('handleCopyBtn');

  // QR fullscreen & format selector modal elements
  const qrcodeCanvasWrapper = document.getElementById('qrcodeCanvasWrapper');
  const qrFullscreenModal = document.getElementById('qrFullscreenModal');
  const qrFullscreenSheetWrapper = document.getElementById('qrFullscreenSheetWrapper');
  const qrFullscreenFloatingPill = document.getElementById('qrFullscreenFloatingPillHeader');
  const qrFullscreenContent = document.getElementById('qrFullscreenContent');
  const qrFullscreenDragHandle = document.getElementById('qrFullscreenDragHandle');
  const closeQrFullscreenBtn = document.getElementById('closeQrFullscreenBtn');
  const openQrDownloadModalBtn = document.getElementById('openQrDownloadModalBtn');
  const qrDownloadFormatModal = document.getElementById('qrDownloadFormatModal');
  const qrDownloadSheetWrapper = document.getElementById('qrDownloadSheetWrapper');
  const qrDownloadFloatingPill = document.getElementById('qrDownloadFloatingPillHeader');
  const qrDownloadFormatContent = document.getElementById('qrDownloadFormatContent');
  const qrFormatDragHandle = document.getElementById('qrFormatDragHandle');
  const closeQrFormatModalBtn = document.getElementById('closeQrFormatModalBtn');

  // Band Logo format elements
  const openLogoDownloadModalBtn = document.getElementById('openLogoDownloadModalBtn');
  const openLogoDownloadModalBox = document.getElementById('openLogoDownloadModalBox');
  const logoDownloadFormatModal = document.getElementById('logoDownloadFormatModal');
  const logoDownloadSheetWrapper = document.getElementById('logoDownloadSheetWrapper');
  const logoDownloadFloatingPill = document.getElementById('logoDownloadFloatingPillHeader');
  const logoDownloadFormatContent = document.getElementById('logoDownloadFormatContent');
  const logoFormatDragHandle = document.getElementById('logoFormatDragHandle');
  const closeLogoFormatModalBtn = document.getElementById('closeLogoFormatModalBtn');
  const shareFloatingPill = document.getElementById('shareFloatingPillHeader');

  // Production domain & dynamic UTM attribution matrix
  const baseDomain = 'https://kinsband-hub.vercel.app/';
  const directLinkUrl = baseDomain + '?utm_source=direct_link&utm_medium=share_modal&utm_campaign=fan_share';
  const qrCodeUrl = baseDomain + '?utm_source=qr_code&utm_medium=offline_scan&utm_campaign=gig_share';
  const nativeShareUrl = baseDomain + '?utm_source=native_share&utm_medium=social&utm_campaign=fan_share';

  if (shareUrlInput) {
    shareUrlInput.value = directLinkUrl;
  }

  // Capability detection: elevate or streamline native share
  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  if (!hasNativeShare && nativeShareCtaBtn) {
    nativeShareCtaBtn.style.display = 'none';
  }

  // Setup Bottom Sheet Gestures on all dialogs on mobile with accidental scroll protection
  setupBottomSheetGestures(shareModal, shareSheetWrapper || shareModalContent, sheetDragHandle, shareFloatingPill, shareModalContent);
  setupBottomSheetGestures(qrFullscreenModal, qrFullscreenSheetWrapper || qrFullscreenContent, qrFullscreenDragHandle, qrFullscreenFloatingPill, qrFullscreenContent);
  setupBottomSheetGestures(qrDownloadFormatModal, qrDownloadSheetWrapper || qrDownloadFormatContent, qrFormatDragHandle, qrDownloadFloatingPill, qrDownloadFormatContent);
  setupBottomSheetGestures(logoDownloadFormatModal, logoDownloadSheetWrapper || logoDownloadFormatContent, logoFormatDragHandle, logoDownloadFloatingPill, logoDownloadFormatContent);

  // Helper to set Download Button Stage 1 (Installable / Uninstalled)
  function setInstallableStage() {
    isAppInstalledOnDevice = false;
    if (!downloadPwaCtaBtn) return;
    const pwaBtnIcon = document.getElementById('pwaBtnIcon');
    const pwaBtnLabel = document.getElementById('pwaBtnLabel');
    const pwaBtnSub = document.getElementById('pwaBtnSub');
    const pwaProgressBar = document.getElementById('pwaProgressBar');
    const pwaProgressStatus = document.getElementById('pwaProgressStatus');

    downloadPwaCtaBtn.classList.remove('downloading', 'download-complete');
    if (pwaBtnIcon) pwaBtnIcon.className = 'fa-solid fa-download';
    if (pwaBtnLabel) pwaBtnLabel.textContent = 'Download Kins App';
    if (pwaBtnSub) pwaBtnSub.textContent = 'Install to home screen • Offline ready';
    if (pwaProgressBar) pwaProgressBar.style.width = '0%';
    if (pwaProgressStatus) pwaProgressStatus.textContent = 'INSTALL';
  }

  // Helper to set Download Button Stage 2 (Actually Installed / Downloaded)
  function setDownloadedStage() {
    isAppInstalledOnDevice = true;
    if (!downloadPwaCtaBtn) return;
    const pwaBtnIcon = document.getElementById('pwaBtnIcon');
    const pwaBtnLabel = document.getElementById('pwaBtnLabel');
    const pwaBtnSub = document.getElementById('pwaBtnSub');
    const pwaProgressBar = document.getElementById('pwaProgressBar');
    const pwaProgressStatus = document.getElementById('pwaProgressStatus');

    downloadPwaCtaBtn.classList.remove('downloading');
    downloadPwaCtaBtn.classList.add('download-complete');

    if (pwaBtnIcon) pwaBtnIcon.className = 'fa-solid fa-circle-check';
    if (pwaBtnLabel) pwaBtnLabel.textContent = 'App Downloaded & Ready';
    if (pwaBtnSub) pwaBtnSub.textContent = '✓ Offline enabled on this device';
    if (pwaProgressBar) pwaProgressBar.style.width = '100%';
    if (pwaProgressStatus) pwaProgressStatus.textContent = 'READY ✓';
  }

  // Real-time Installation State Synchronization
  async function syncAppInstalledStatus() {
    const actuallyInstalled = await detectActualInstalledState();
    if (actuallyInstalled) {
      setDownloadedStage();
      try { localStorage.setItem('kins_pwa_downloaded', 'true'); } catch (e) {}
    } else {
      // Check if previously recorded in localStorage and if cache still exists
      let hasCache = false;
      try {
        if ('caches' in window) {
          hasCache = await caches.has('kins-link-bio-v32');
        }
      } catch (e) {}

      try {
        const stored = localStorage.getItem('kins_pwa_downloaded');
        if (stored === 'true' && hasCache && !deferredInstallPrompt) {
          setDownloadedStage();
        } else {
          setInstallableStage();
        }
      } catch (e) {
        setInstallableStage();
      }
    }
  }

  syncAppInstalledStatus();

  // Listen to beforeinstallprompt: browser fires this when app is NOT installed
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.__kinsDeferredInstallPrompt = e;
    // App is currently NOT installed -> reset to Stage 1
    setInstallableStage();
  });

  // Listen to appinstalled: fires immediately when user installs app
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
    setDownloadedStage();
    try { localStorage.setItem('kins_pwa_downloaded', 'true'); } catch (e) {}
    showToast('🎉 Kins App installed successfully!', 'success');
  });

  // Listen to standalone mode changes (e.g. desktop PWA window opens/closes)
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        setDownloadedStage();
      } else {
        syncAppInstalledStatus();
      }
    });
  } catch (e) {}

  // Generic Clipboard Copy Helper with Inline Tick Micro-Interaction
  async function performCopy(textToCopy, iconElement) {
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
      try {
        const tempInput = document.createElement('input');
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        success = document.execCommand('copy');
        document.body.removeChild(tempInput);
      } catch (e) {
        success = false;
      }
    }

    if (success && iconElement) {
      animateCopySuccess(iconElement.parentElement || iconElement);
    }
  }

  // 1. Direct Link Tap-to-Copy Full Row Interaction
  if (copyUrlRow) {
    const handleUrlCopyAction = (e) => {
      e.preventDefault();
      const icon = document.getElementById('copyUrlIcon');
      performCopy(directLinkUrl, icon);
    };

    copyUrlRow.addEventListener('click', handleUrlCopyAction);
    copyUrlRow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleUrlCopyAction(e);
      }
    });
  }

  // 2. Band Handle Tap-to-Copy Full Row Interaction
  if (copyHandleRow) {
    const handleHandleCopyAction = (e) => {
      e.preventDefault();
      const icon = document.getElementById('copyHandleIcon');
      performCopy('@KinsBandOfficial', icon);
    };

    copyHandleRow.addEventListener('click', handleHandleCopyAction);
    copyHandleRow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleHandleCopyAction(e);
      }
    });
  }

  // 3. Social App Share Buttons with Dynamic UTM tracking
  const shareAppButtons = document.querySelectorAll('#shareAppsGrid .share-app-pill-btn');
  shareAppButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const app = btn.getAttribute('data-share-app') || 'other';
      const shareMessage = 'Check out official music releases, merch, and tour dates for Kins!';
      const appShareUrl = `${baseDomain}?utm_source=${app}_share&utm_medium=social&utm_campaign=fan_share`;

      if (app === 'whatsapp') {
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${appShareUrl}`)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        showToast('Opening WhatsApp...');
      } else if (app === 'instagram') {
        performCopy(appShareUrl, btn.querySelector('i'));
        showToast('Link copied! Opening Instagram...');
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      } else if (app === 'sms') {
        const smsUrl = `sms:?&body=${encodeURIComponent(`${shareMessage} ${appShareUrl}`)}`;
        window.location.href = smsUrl;
        showToast('Opening Messages...');
      } else if (app === 'discord') {
        performCopy(appShareUrl, btn.querySelector('i'));
        showToast('Link copied! Opening Discord...');
        window.open('https://discord.com/channels/@me', '_blank', 'noopener,noreferrer');
      }
    });
  });

  // 4. Native Web Share CTA Handler
  async function triggerNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kins | Official Link in Bio',
          text: 'Check out official music releases, merch, and tour dates for Kins!',
          url: nativeShareUrl
        });
      } catch (err) {}
    } else {
      performCopy(nativeShareUrl, nativeShareCtaBtn?.querySelector('i'));
      showToast('Share link copied to clipboard!');
    }
  }

  if (nativeShareCtaBtn) {
    nativeShareCtaBtn.addEventListener('click', triggerNativeShare);
  }

  // 5. Two-Stage Download / Install App CTA Handler
  if (downloadPwaCtaBtn) {
    let isDownloading = false;

    downloadPwaCtaBtn.addEventListener('click', async () => {
      // If already in Stage 2 & installed:
      if (downloadPwaCtaBtn.classList.contains('download-complete')) {
        showToast('✓ Kins App is installed on this device & ready offline!', 'success');
        return;
      }

      if (isDownloading) return;

      const actuallyInstalled = await detectActualInstalledState();
      if (actuallyInstalled) {
        setDownloadedStage();
        try { localStorage.setItem('kins_pwa_downloaded', 'true'); } catch (e) {}
        showToast('✓ Kins App is installed & offline ready!', 'success');
        return;
      }

      // STAGE 1: Request to Download & In-Progress Caching
      const pwaBtnIcon = document.getElementById('pwaBtnIcon');
      const pwaBtnLabel = document.getElementById('pwaBtnLabel');
      const pwaBtnSub = document.getElementById('pwaBtnSub');
      const pwaProgressBar = document.getElementById('pwaProgressBar');
      const pwaProgressStatus = document.getElementById('pwaProgressStatus');

      isDownloading = true;
      downloadPwaCtaBtn.classList.add('downloading');
      if (pwaBtnIcon) pwaBtnIcon.className = 'fa-solid fa-spinner fa-spin';
      if (pwaBtnLabel) pwaBtnLabel.textContent = 'Downloading & Caching...';
      if (pwaBtnSub) pwaBtnSub.textContent = 'Preparing offline app storage';
      if (pwaProgressBar) pwaProgressBar.style.width = '12%';
      if (pwaProgressStatus) pwaProgressStatus.textContent = '12%';

      // Trigger native install prompt if available
      const promptEvent = deferredInstallPrompt || (typeof window !== 'undefined' && window.__kinsDeferredInstallPrompt);
      if (promptEvent) {
        try {
          promptEvent.prompt();
          promptEvent.userChoice.then((choice) => {
            if (choice && choice.outcome === 'accepted') {
              showToast('🎉 Kins App installed to your device!', 'success');
              deferredInstallPrompt = null;
              if (typeof window !== 'undefined') window.__kinsDeferredInstallPrompt = null;
            }
          }).catch(() => {});
        } catch (err) {}
      }

      // Cache core assets
      const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';
      const assetUrls = [
        `${baseUrl}/`,
        `${baseUrl}/manifest.json`,
        `${baseUrl}/new.png`,
        `${baseUrl}/followers.json`
      ];

      document.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(el => {
        const src = el.href || el.src;
        if (src && !assetUrls.includes(src) && !src.startsWith('chrome-extension')) {
          assetUrls.push(src);
        }
      });

      let cacheStorage = null;
      try {
        if ('caches' in window) {
          cacheStorage = await caches.open('kins-link-bio-v32');
        }
      } catch (e) {}

      let completedItems = 0;
      for (const url of assetUrls) {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.ok && cacheStorage) {
            await cacheStorage.put(url, response.clone()).catch(() => {});
          }
        } catch (err) {}

        completedItems += 1;
        const percent = Math.min(96, Math.round((completedItems / assetUrls.length) * 100));
        if (pwaProgressBar) pwaProgressBar.style.width = `${percent}%`;
        if (pwaProgressStatus) pwaProgressStatus.textContent = `${percent}%`;
      }

      if (pwaProgressBar) pwaProgressBar.style.width = '100%';
      if (pwaProgressStatus) pwaProgressStatus.textContent = '100%';

      await new Promise(r => setTimeout(r, 200));

      // STAGE 2: Transition to Completed & Verified State
      setDownloadedStage();
      try { localStorage.setItem('kins_pwa_downloaded', 'true'); } catch (e) {}

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        showToast("📱 Ready! Tap Safari Share (↑) → 'Add to Home Screen' (+)", 'success');
      } else {
        showToast('✓ Kins App is downloaded and ready for offline use!', 'success');
      }

      isDownloading = false;
    });
  }

  // 6. Render High-Resolution QR Code preview
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

  // 7. Open / Close Share Modal
  if (shareBtn && shareModal && closeShareModal) {
    shareBtn.addEventListener('click', () => {
      shareModal.classList.remove('hidden');
      shareModal.classList.add('active');
      if (shareSheetWrapper) shareSheetWrapper.style.transform = 'translateY(0)';
      else if (shareModalContent) shareModalContent.style.transform = 'translateY(0)';
      lockScroll();
      renderQrCode('qrcodeCanvas', 100);
      syncAppInstalledStatus();
    });

    closeShareModal.addEventListener('click', () => {
      closeSheetSmoothly(shareModal, shareSheetWrapper || shareModalContent, unlockScroll);
    });

    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        closeSheetSmoothly(shareModal, shareSheetWrapper || shareModalContent, unlockScroll);
      }
    });
  }

  // 8. QR Code Fullscreen Lightbox & 1-Click Fast Vector/HD Export
  if (qrcodeCanvasWrapper && qrFullscreenModal) {
    qrcodeCanvasWrapper.addEventListener('click', () => {
      qrFullscreenModal.classList.remove('hidden');
      if (qrFullscreenSheetWrapper) qrFullscreenSheetWrapper.style.transform = 'translateY(0)';
      else if (qrFullscreenContent) qrFullscreenContent.style.transform = 'translateY(0)';
      renderQrCode('qrcodeFullscreenCanvas', 260);
    });

    closeQrFullscreenBtn?.addEventListener('click', () => {
      closeSheetSmoothly(qrFullscreenModal, qrFullscreenSheetWrapper || qrFullscreenContent);
    });

    qrFullscreenModal.addEventListener('click', (e) => {
      if (e.target === qrFullscreenModal) {
        closeSheetSmoothly(qrFullscreenModal, qrFullscreenSheetWrapper || qrFullscreenContent);
      }
    });

    const fastExportBtns = qrFullscreenModal.querySelectorAll('[data-qr-quick-format]');
    fastExportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.getAttribute('data-qr-quick-format') || 'png';
        const triggerDownload = (dataUrl, filename) => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = filename;
          a.click();
          showToast(`✓ Downloaded QR Code (${format.toUpperCase()})!`);
        };

        if (format === 'png') {
          createBrandedQrCanvas(qrCodeUrl, 1200, (canvas) => {
            if (canvas) triggerDownload(canvas.toDataURL('image/png'), 'kins-official-qrcode.png');
          });
        } else if (format === 'svg') {
          generateVectorQr(qrCodeUrl, 'svg', (dataUrl) => {
            if (dataUrl) triggerDownload(dataUrl, 'kins-official-qrcode.svg');
          });
        } else if (format === 'eps') {
          generateVectorQr(qrCodeUrl, 'eps', (dataUrl) => {
            if (dataUrl) triggerDownload(dataUrl, 'kins-official-qrcode.eps');
          });
        }
      });
    });
  }

  // 9. QR Format Download Modal
  if (openQrDownloadModalBtn && qrDownloadFormatModal) {
    openQrDownloadModalBtn.addEventListener('click', () => {
      qrDownloadFormatModal.classList.remove('hidden');
      if (qrDownloadSheetWrapper) qrDownloadSheetWrapper.style.transform = 'translateY(0)';
      else if (qrDownloadFormatContent) qrDownloadFormatContent.style.transform = 'translateY(0)';
    });

    closeQrFormatModalBtn?.addEventListener('click', () => {
      closeSheetSmoothly(qrDownloadFormatModal, qrDownloadSheetWrapper || qrDownloadFormatContent);
    });

    qrDownloadFormatModal.addEventListener('click', (e) => {
      if (e.target === qrDownloadFormatModal) {
        closeSheetSmoothly(qrDownloadFormatModal, qrDownloadSheetWrapper || qrDownloadFormatContent);
      }
    });
  }

  const formatCards = document.querySelectorAll('#qrDownloadFormatModal .format-option-card');
  formatCards.forEach(card => {
    card.addEventListener('click', () => {
      const format = card.getAttribute('data-format') || 'png';
      closeSheetSmoothly(qrDownloadFormatModal, qrDownloadSheetWrapper || qrDownloadFormatContent);

      showToast(`Preparing ${format.toUpperCase()} export...`);

      const triggerDownload = (dataUrl, filename) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
        showToast(`✓ Downloaded Kins QR Code (${format.toUpperCase()})!`);
      };

      if (format === 'jpeg') {
        createBrandedQrCanvas(qrCodeUrl, 1200, (canvas) => {
          if (canvas) triggerDownload(canvas.toDataURL('image/jpeg', 0.98), 'kins-official-qrcode.jpg');
        });
      } else if (format === 'png') {
        createBrandedQrCanvas(qrCodeUrl, 1200, (canvas) => {
          if (canvas) triggerDownload(canvas.toDataURL('image/png'), 'kins-official-qrcode.png');
        });
      } else if (format === 'eps') {
        generateVectorQr(qrCodeUrl, 'eps', (dataUrl) => {
          if (dataUrl) triggerDownload(dataUrl, 'kins-official-qrcode.eps');
        });
      } else if (format === 'svg') {
        generateVectorQr(qrCodeUrl, 'svg', (dataUrl) => {
          if (dataUrl) triggerDownload(dataUrl, 'kins-official-qrcode.svg');
        });
      }
    });
  });

  // 10. Band Logo Format Download Modal
  if (logoDownloadFormatModal) {
    const openLogoModal = () => {
      logoDownloadFormatModal.classList.remove('hidden');
      if (logoDownloadSheetWrapper) logoDownloadSheetWrapper.style.transform = 'translateY(0)';
      else if (logoDownloadFormatContent) logoDownloadFormatContent.style.transform = 'translateY(0)';
    };

    openLogoDownloadModalBtn?.addEventListener('click', openLogoModal);
    openLogoDownloadModalBox?.addEventListener('click', openLogoModal);

    closeLogoFormatModalBtn?.addEventListener('click', () => {
      closeSheetSmoothly(logoDownloadFormatModal, logoDownloadSheetWrapper || logoDownloadFormatContent);
    });

    logoDownloadFormatModal.addEventListener('click', (e) => {
      if (e.target === logoDownloadFormatModal) {
        closeSheetSmoothly(logoDownloadFormatModal, logoDownloadSheetWrapper || logoDownloadFormatContent);
      }
    });
  }

  const logoFormatCards = document.querySelectorAll('#logoDownloadFormatModal .format-option-card');
  logoFormatCards.forEach(card => {
    card.addEventListener('click', () => {
      const format = card.getAttribute('data-logo-format') || 'png';
      closeSheetSmoothly(logoDownloadFormatModal, logoDownloadSheetWrapper || logoDownloadFormatContent);

      showToast(`Preparing Band Logo (${format.toUpperCase()})...`);
      const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : '';

      const triggerDownload = (dataUrl, filename) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
        showToast(`✓ Downloaded Band Logo (${format.toUpperCase()})!`);
      };

      if (format === 'png') {
        triggerDownload(`${baseUrl}/new.png`, 'kins-band-official-logo.png');
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
        img.src = `${baseUrl}/new.png`;
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
        img.src = `${baseUrl}/new.png`;
      }
    });
  });

  // 11. Keyboard Shortcuts (ESC to close modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (logoDownloadFormatModal && !logoDownloadFormatModal.classList.contains('hidden')) {
        closeSheetSmoothly(logoDownloadFormatModal, logoDownloadFormatContent);
      } else if (qrDownloadFormatModal && !qrDownloadFormatModal.classList.contains('hidden')) {
        closeSheetSmoothly(qrDownloadFormatModal, qrDownloadFormatContent);
      } else if (qrFullscreenModal && !qrFullscreenModal.classList.contains('hidden')) {
        closeSheetSmoothly(qrFullscreenModal, qrFullscreenContent);
      } else if (shareModal && shareModal.classList.contains('active')) {
        closeSheetSmoothly(shareModal, shareSheetWrapper || shareModalContent, unlockScroll);
      }
    }
  });
}
