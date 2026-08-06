let activeToast = null;
let activeToastTimeout = null;

export function showToast(message) {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  if (activeToast) {
    clearTimeout(activeToastTimeout);
    activeToast.remove();
    activeToast = null;
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color: #53c678;"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  activeToast = toast;

  activeToastTimeout = setTimeout(() => {
    if (toast) {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        toast.remove();
        if (activeToast === toast) activeToast = null;
      }, 220);
    }
  }, 2800);
}
