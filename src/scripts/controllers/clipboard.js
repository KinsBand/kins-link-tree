/**
 * Clipboard utility module.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
}

/**
 * Smooth spring micro-animation for copy buttons transitioning from copy icon -> checkmark -> copy icon.
 */
export function animateCopySuccess(btn, duration = 2000) {
  if (!btn || btn.classList.contains('copied-animating')) return;

  btn.classList.add('copied-animating');
  const icon = btn.querySelector('i');
  if (!icon) return;

  const originalClass = icon.className;

  // Step 1: Smooth shrink & fade out copy icon
  icon.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease';
  icon.style.transform = 'scale(0.4) rotate(-25deg)';
  icon.style.opacity = '0';

  setTimeout(() => {
    // Step 2: Swap to checkmark & spring pop in
    icon.className = 'fa-solid fa-check text-check-success';
    icon.style.transform = 'scale(1.25) rotate(0deg)';
    icon.style.opacity = '1';

    // Settle to normal size
    setTimeout(() => {
      icon.style.transform = 'scale(1)';
    }, 120);

    // Step 3: Revert back after duration
    setTimeout(() => {
      icon.style.transform = 'scale(0.4) rotate(25deg)';
      icon.style.opacity = '0';

      setTimeout(() => {
        icon.className = originalClass;
        icon.style.transform = 'scale(1) rotate(0deg)';
        icon.style.opacity = '1';
        btn.classList.remove('copied-animating');
      }, 150);
    }, duration);
  }, 150);
}
