import { showToast } from './toast.js';
import { trackClick } from '../../../shared/scripts/analytics.js';

function lockScroll() {
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');
}

function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('modal-open');
}

export function initShareModal() {
  const shareBtn = document.getElementById('shareBtn');
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const handleCopyBtn = document.getElementById('handleCopyBtn');

  if (shareUrlInput) {
    shareUrlInput.value = window.location.href;
  }

  if (handleCopyBtn) {
    handleCopyBtn.addEventListener('click', async () => {
      const handleText = '@KinsBandOfficial';
      try {
        await navigator.clipboard.writeText(handleText);
        showToast(`Copied ${handleText} to clipboard!`);
      } catch (err) {
        const tempInput = document.createElement('input');
        tempInput.value = handleText;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showToast(`Copied ${handleText} to clipboard!`);
      }
    });
  }

  if (shareBtn && shareModal && closeShareModal) {
    shareBtn.addEventListener('click', async () => {
      shareModal.classList.add('active');
      lockScroll();
      trackClick('open_share_modal');

      const pageUrl = window.location.href;
      const shareTitle = "Kins Official | Link in Bio";

      const qrCanvasContainer = document.getElementById('qrcodeCanvas');
      if (qrCanvasContainer && typeof window.QRCode !== 'undefined') {
        qrCanvasContainer.innerHTML = '';
        new window.QRCode(qrCanvasContainer, {
          text: pageUrl,
          width: 90,
          height: 90,
          colorDark: "#0b1f18",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: 'Check out official music releases, merch, and tour dates for Kins!',
            url: pageUrl
          });
        } catch (err) {
          console.log('Native share dismissed:', err);
        }
      }
    });

    const downloadQrBtn = document.getElementById('downloadQrBtn');
    if (downloadQrBtn) {
      downloadQrBtn.addEventListener('click', () => {
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
          showToast('QR Code image downloaded!');
        } else {
          showToast('Generating QR code...');
        }
      });
    }

    closeShareModal.addEventListener('click', () => {
      shareModal.classList.remove('active');
      unlockScroll();
    });

    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) {
        shareModal.classList.remove('active');
        unlockScroll();
      }
    });
  }

  if (copyUrlBtn && shareUrlInput) {
    copyUrlBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrlInput.value);
        showToast('Link copied to clipboard!');
        trackClick('copy_share_url', { url: shareUrlInput.value });
        copyUrlBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
          copyUrlBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
      } catch (err) {
        shareUrlInput.select();
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
      }
    });
  }
}
