/**
 * Universal Modal / Drawer 3-Phase Animation Coordinator
 * Ensures exit animations (modalPopOut / sheetSlideDown) always play to completion
 * before removing elements from the accessibility tree and adding .hidden.
 */

export function animateOpen(modalEl, wrapperEl, options = {}) {
  if (!modalEl) return;
  const { onOpened } = options;

  modalEl.classList.remove('is-closing', 'hidden');
  if (wrapperEl) wrapperEl.classList.remove('is-closing');
  modalEl.inert = false;
  modalEl.removeAttribute('aria-hidden');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('modal-open');

  requestAnimationFrame(() => {
    modalEl.classList.add('active');
    if (wrapperEl) wrapperEl.classList.add('active');
    if (typeof onOpened === 'function') onOpened();
  });
}

export function animateClose(modalEl, wrapperEl, options = {}) {
  if (!modalEl) return;
  const {
    duration = 190,
    closingClass = 'is-closing',
    returnFocus = null,
    onClosed
  } = options;

  if (modalEl.classList.contains('hidden') || modalEl.classList.contains(closingClass)) {
    return;
  }

  // Restore focus to trigger element if provided
  if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
    returnFocus.focus({ preventScroll: true });
  }

  modalEl.classList.add(closingClass);
  if (wrapperEl) wrapperEl.classList.add(closingClass);

  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;

    modalEl.classList.remove('active', closingClass);
    if (wrapperEl) wrapperEl.classList.remove('active', closingClass);

    modalEl.classList.add('hidden');
    modalEl.inert = true;
    modalEl.setAttribute('aria-hidden', 'true');

    // Only unlock scroll if no other modals remain open
    const openModals = document.querySelectorAll('.modal-backdrop.active, .bottom-sheet-backdrop.active, .covers-search-overlay.active');
    if (openModals.length === 0) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }

    if (typeof onClosed === 'function') {
      onClosed();
    }
  };

  const animTarget = wrapperEl || modalEl;
  animTarget.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, duration + 40);
}
