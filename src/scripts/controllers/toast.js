let activeToast = null;
let activeToastTimeout = null;

function inferToastType(message, explicitType) {
  if (explicitType) return explicitType;
  const msgLower = (message || '').toLowerCase();
  if (msgLower.includes('now playing') || msgLower.includes('resumed') || msgLower.includes('paused') || msgLower.includes('preview')) {
    return 'music';
  }
  if (msgLower.includes('copied') || msgLower.includes('link') || msgLower.includes('clipboard')) {
    return 'clipboard';
  }
  if (msgLower.includes('subscribed') || msgLower.includes('welcome') || msgLower.includes('success')) {
    return 'success';
  }
  if (msgLower.includes('unable') || msgLower.includes('error') || msgLower.includes('failed') || msgLower.includes('unavailable')) {
    return 'warning';
  }
  return 'info';
}

function getToastIconMarkup(type) {
  switch (type) {
    case 'music':
      return `<i class="fa-solid fa-compact-disc fa-spin" style="animation-duration: 4s;"></i>`;
    case 'clipboard':
      return `<i class="fa-regular fa-copy"></i>`;
    case 'success':
      return `<i class="fa-solid fa-circle-check"></i>`;
    case 'warning':
      return `<i class="fa-solid fa-triangle-exclamation"></i>`;
    default:
      return `<i class="fa-solid fa-circle-info"></i>`;
  }
}

function stripEmojis(str) {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE0F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function showToast(message, explicitType = null) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  if (activeToast) {
    clearTimeout(activeToastTimeout);
    activeToast.remove();
    activeToast = null;
  }

  const cleanMessage = stripEmojis(message);
  const toastType = inferToastType(cleanMessage, explicitType);
  const iconMarkup = getToastIconMarkup(toastType);

  const toast = document.createElement('div');
  toast.className = `toast toast-type-${toastType}`;
  toast.innerHTML = `
    <div class="toast-icon-box">${iconMarkup}</div>
    <span class="toast-text-content">${cleanMessage}</span>
    <button type="button" class="toast-close-btn" aria-label="Dismiss notification">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="toast-progress-bar"></div>
  `;

  const dismissToast = () => {
    clearTimeout(activeToastTimeout);
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 240);
  };

  toast.addEventListener('click', dismissToast);

  toastContainer.appendChild(toast);
  activeToast = toast;

  activeToastTimeout = setTimeout(() => {
    if (toast) {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        toast.remove();
        if (activeToast === toast) activeToast = null;
      }, 240);
    }
  }, 2800);
}
