/**
 * Live Fan Upload Form Controller
 * Owns the REAL submit path for #liveMediaUploadForm (shared by / and /live
 * via LiveUploadModal.astro). POSTs multipart/form-data to /api/fan-upload.
 * Success = server confirmed persistence (pending moderation queue);
 * failure = honest error toast, form stays usable. No optimistic rendering.
 */

import { showToast } from './toast.js';

export function initLiveFanUploadForm() {
  const form = document.getElementById('liveMediaUploadForm');
  if (!form || form.dataset.uploadWired === 'true') return;
  form.dataset.uploadWired = 'true';

  const submitBtn = document.getElementById('submitLiveUploadBtn');
  const originalBtnHtml = submitBtn?.innerHTML || '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('liveMediaFileInput');
    const file = fileInput && 'files' in fileInput ? fileInput.files?.[0] : null;
    if (!file) {
      showToast('Choose a photo or video first.', 'warning');
      return;
    }

    const handleInput = document.getElementById('liveUploadHandleInput');
    const captionInput = document.getElementById('liveUploadCaptionInput');

    const fd = new FormData();
    fd.append('file', file);
    const handle = (handleInput?.value || '').trim();
    if (handle) fd.append('handle', handle);
    const caption = (captionInput?.value || '').trim();
    if (caption) fd.append('caption', caption);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-spin"></i> <span>UPLOADING...</span>';
    }

    try {
      const res = await fetch('/api/fan-upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.status !== 'success') {
        throw new Error((data && data.message) || `Upload failed (${res.status})`);
      }

      form.reset();

      const previewBox = document.getElementById('liveMediaPreviewContainer');
      if (previewBox) previewBox.classList.add('hidden');
      const previewImg = document.getElementById('liveMediaPreviewImg');
      if (previewImg) previewImg.src = '';

      const uploadModal = document.getElementById('liveUploadModal');
      if (uploadModal) {
        uploadModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
      }

      showToast('Upload received! Pending band approval.', 'success');
    } catch (err) {
      console.warn('[liveUpload] submission failed:', err);
      const msg = err instanceof Error && err.message ? err.message : 'Upload failed — please try again.';
      showToast(msg, 'warning');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });
}
