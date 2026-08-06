import { showToast } from '../../sites/link-in-bio/scripts/toast.js';

export async function copyToClipboard(text, customMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(customMessage || `Copied ${text} to clipboard!`);
  } catch (err) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showToast(customMessage || `Copied ${text} to clipboard!`);
  }
}
