import { showToast } from './toast.js';
import { getEssentialDiagnostics } from './telemetry.js';

let isInitialized = false;

export function initFeedbackModal() {
  if (isInitialized && typeof document !== 'undefined') {
    // If re-initializing on view transition
    const modal = document.getElementById('feedbackModal');
    if (modal) return;
  }
  isInitialized = true;

  const modal = document.getElementById('feedbackModal');
  const closeBtn = document.getElementById('closeFeedbackModal');
  const form = document.getElementById('siteFeedbackForm') as HTMLFormElement | null;
  const successView = document.getElementById('feedbackSuccessView');
  const submitBtn = document.getElementById('submitFeedbackBtn') as HTMLButtonElement | null;
  const btnText = submitBtn?.querySelector('.btn-text');
  const btnIcon = submitBtn?.querySelector('.btn-icon');
  const spinner = document.getElementById('feedbackSpinner');
  const detailsInput = document.getElementById('feedbackDetailsInput') as HTMLTextAreaElement | null;
  const charCounter = document.getElementById('charCounter');
  const detailsLabel = document.getElementById('detailsLabel');
  const headerIcon = document.getElementById('feedbackPillIcon');
  const categoryDisplayLabel = document.getElementById('categoryDisplayLabel');
  const selectedTypeInput = document.getElementById('selectedFeedbackTypeInput') as HTMLInputElement | null;
  const selectedCategoryInput = document.getElementById('selectedCategoryInput') as HTMLInputElement | null;
  const submitAnotherBtn = document.getElementById('submitAnotherFeedbackBtn');
  const doneBtn = document.getElementById('closeFeedbackDoneBtn');

  // Screenshot Upload Elements
  const screenshotInput = document.getElementById('feedbackScreenshotInput') as HTMLInputElement | null;
  const uploadSkeleton = document.getElementById('imageUploadSkeleton');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('feedbackPreviewImg') as HTMLImageElement | null;
  const previewFileName = document.getElementById('previewFileName');
  const previewFileSize = document.getElementById('previewFileSize');
  const removeImageBtn = document.getElementById('removeImageBtn');

  let currentAttachedFile: File | null = null;

  // Format File Size
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Handle Image Selection
  function handleImageFile(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("Please select a valid image (PNG, JPG, WebP, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size exceeds 5MB limit.");
      return;
    }

    currentAttachedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg && e.target?.result) {
        previewImg.src = e.target.result as string;
      }
      if (previewFileName) previewFileName.textContent = file.name;
      if (previewFileSize) previewFileSize.textContent = formatBytes(file.size);

      // Hide skeleton and show preview in the exact same space
      uploadSkeleton?.classList.add('hidden');
      previewContainer?.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Keyboard accessibility for label dropzone
  uploadSkeleton?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      screenshotInput?.click();
    }
  });

  // File Input Change listener
  screenshotInput?.addEventListener('change', () => {
    if (screenshotInput.files && screenshotInput.files[0]) {
      handleImageFile(screenshotInput.files[0]);
    }
  });

  // Drag & Drop onto Skeleton
  uploadSkeleton?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadSkeleton.classList.add('drag-over');
  });

  uploadSkeleton?.addEventListener('dragleave', () => {
    uploadSkeleton.classList.remove('drag-over');
  });

  uploadSkeleton?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadSkeleton.classList.remove('drag-over');
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  // Remove Attached Image
  function removeAttachedImage() {
    currentAttachedFile = null;
    if (screenshotInput) screenshotInput.value = '';
    if (previewImg) previewImg.src = '';
    previewContainer?.classList.add('hidden');
    uploadSkeleton?.classList.remove('hidden');
  }

  removeImageBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeAttachedImage();
  });

  // Close handlers
  const CLOSE_ANIM_MS = 190;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isOtherModalOpen(): boolean {
    const ids = ['termsModal', 'communitySubmissionModal', 'privacyModal', 'shareModal'];
    return ids.some((id) => {
      const el = document.getElementById(id);
      return !!el && !el.classList.contains('hidden');
    });
  }

  function finishCloseFeedback() {
    closeTimer = null;
    if (!modal) return;
    modal.classList.remove('is-closing');
    modal.classList.add('hidden');

    // Only unlock page scrolling if no other modal took over while we were closing
    if (!isOtherModalOpen()) {
      document.body.classList.remove('modal-open');
    }
  }

  function closeModal() {
    if (!modal) return;
    if (modal.classList.contains('hidden') || modal.classList.contains('is-closing')) return;

    if (prefersReducedMotion) {
      finishCloseFeedback();
      return;
    }

    modal.classList.add('is-closing');
    closeTimer = setTimeout(finishCloseFeedback, CLOSE_ANIM_MS);
  }

  closeBtn?.addEventListener('click', closeModal);
  doneBtn?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // Swipe-to-Dismiss Bottom Sheet Gestures
  const feedbackSheetWrapper = document.getElementById('feedbackSheetWrapper');
  const feedbackDragHandle = document.getElementById('feedbackDragHandle');
  const feedbackFloatingPill = document.getElementById('feedbackFloatingPillHeader');
  const feedbackContent = document.getElementById('feedbackModalContent');

  function setupBottomSheetGestures() {
    if (!modal || !feedbackSheetWrapper) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let isTouchActive = false;
    let startedFromTop = false;

    // Direct handle touch (always allows dragging down)
    const onHandleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      currentY = startY;
      isDragging = true;
      isTouchActive = true;
      startedFromTop = true;
    };

    // Body content touch (ONLY allows dragging when at the absolute top of the form)
    const onBodyTouchStart = (e: TouchEvent) => {
      if (feedbackContent && feedbackContent.scrollTop <= 0) {
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

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchActive || !startedFromTop || !feedbackSheetWrapper) return;

      // If form content has been scrolled down, never drag the sheet
      if (feedbackContent && feedbackContent.scrollTop > 0) {
        if (isDragging) {
          isDragging = false;
          feedbackSheetWrapper.style.transform = '';
        }
        return;
      }

      const deltaY = e.touches[0].clientY - startY;

      // Require a deadzone threshold of 10px downward to prevent accidental triggers while scrolling form
      if (deltaY > 10) {
        isDragging = true;
        if (e.cancelable) e.preventDefault();
        const visualDelta = deltaY - 10;
        feedbackSheetWrapper.style.transform = `translateY(${visualDelta}px)`;
        feedbackSheetWrapper.style.transition = 'none';
      } else {
        if (isDragging) {
          feedbackSheetWrapper.style.transform = '';
        }
      }
      currentY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      if (!isTouchActive || !feedbackSheetWrapper) return;
      isTouchActive = false;
      startedFromTop = false;

      if (!isDragging) return;
      isDragging = false;

      const deltaY = currentY - startY;
      feedbackSheetWrapper.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';

      // Must be pulled down at least 80px when at the top to dismiss
      if (deltaY > 80) {
        feedbackSheetWrapper.style.transform = 'translateY(100%)';
        setTimeout(() => {
          finishCloseFeedback();
          if (feedbackSheetWrapper) feedbackSheetWrapper.style.transform = '';
        }, 180);
      } else {
        feedbackSheetWrapper.style.transform = '';
      }
    };

    if (feedbackDragHandle) {
      feedbackDragHandle.addEventListener('touchstart', onHandleTouchStart, { passive: false });
      feedbackDragHandle.addEventListener('touchmove', onTouchMove, { passive: false });
      feedbackDragHandle.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    if (feedbackFloatingPill) {
      feedbackFloatingPill.addEventListener('touchstart', onHandleTouchStart, { passive: false });
      feedbackFloatingPill.addEventListener('touchmove', onTouchMove, { passive: false });
      feedbackFloatingPill.addEventListener('touchend', onTouchEnd, { passive: true });
    }

    if (feedbackContent) {
      feedbackContent.addEventListener('touchstart', onBodyTouchStart, { passive: true });
      feedbackContent.addEventListener('touchmove', onTouchMove, { passive: false });
      feedbackContent.addEventListener('touchend', onTouchEnd, { passive: true });
    }
  }

  setupBottomSheetGestures();

  // Category Selection
  const categoryChips = document.querySelectorAll('.category-chip');
  function applyCategory(cat: string) {
    if (!cat) return false;
    const match = Array.from(categoryChips).find((c) => c.getAttribute('data-category') === cat);
    if (!match) return false;
    categoryChips.forEach((c) => c.classList.toggle('active', c === match));
    if (selectedCategoryInput) selectedCategoryInput.value = cat;
    if (categoryDisplayLabel) categoryDisplayLabel.textContent = cat;
    return true;
  }

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      applyCategory(chip.getAttribute('data-category') || 'General Site');
    });
  });

  // Global Open Helper & Triggers
  (window as any).openFeedbackModal = function(presetCategory?: string) {
    if (!modal) return;

    // Cancel any in-flight close animation before re-opening
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    modal.classList.remove('is-closing');

    // Reset view if previously showing success screen
    if (successView && !successView.classList.contains('hidden')) {
      form?.reset();
      removeAttachedImage();
      if (charCounter) charCounter.textContent = "0 / 1000";
      successView.classList.add('hidden');
      form?.classList.remove('hidden');
    }

    if (presetCategory) applyCategory(presetCategory);

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  };

  // Delegated click listener for any footer/page triggers
  document.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement)?.closest?.('#openSuggestImprovementFooterBtn, .open-feedback-trigger, [data-open-feedback]');
    if (trigger) {
      e.preventDefault();
      const preset = trigger.getAttribute('data-feedback-category') || undefined;
      (window as any).openFeedbackModal?.(preset);
    }
  });

  // Type Pills Selection
  const typePills = document.querySelectorAll('.type-pill-btn');
  typePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      typePills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const type = pill.getAttribute('data-type') || 'Improvement / Idea';
      if (selectedTypeInput) selectedTypeInput.value = type;

      // Update placeholders & icons based on type
      if (type.includes('Bug')) {
        if (detailsLabel) detailsLabel.textContent = "What is broken or not working as expected?";
        if (detailsInput) detailsInput.placeholder = "Describe the issue, where it happened, and what went wrong...";
        if (btnText) btnText.textContent = "Report Issue";
        if (headerIcon) {
          headerIcon.className = "fa-solid fa-bug";
        }
      } else if (type.includes('Content')) {
        if (detailsLabel) detailsLabel.textContent = "What text or information should be corrected?";
        if (detailsInput) detailsInput.placeholder = "Describe the typo, missing credit, or outdated detail...";
        if (btnText) btnText.textContent = "Send Correction";
        if (headerIcon) {
          headerIcon.className = "fa-solid fa-pen-nib";
        }
      } else {
        if (detailsLabel) detailsLabel.textContent = "What improvement would you like to see?";
        if (detailsInput) detailsInput.placeholder = "Tell us what you'd like added, changed, or refined...";
        if (btnText) btnText.textContent = "Send Improvement";
        if (headerIcon) {
          headerIcon.className = "fa-solid fa-lightbulb";
        }
      }
    });
  });

  // Character Counter
  detailsInput?.addEventListener('input', () => {
    const len = detailsInput.value.length;
    if (charCounter) charCounter.textContent = `${len} / 1000`;
  });

  // Form Submission with Essential Diagnostics & Image Attachment
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const details = detailsInput?.value?.trim() || '';

    if (!details) {
      showToast("Please enter feedback details.");
      detailsInput?.focus();
      return;
    }

    const feedbackType = selectedTypeInput?.value || 'Improvement / Idea';
    const category = selectedCategoryInput?.value || 'General Site';
    const contact = (document.getElementById('feedbackContactInput') as HTMLInputElement | null)?.value?.trim() || '';

    // Collect Essential Diagnostics
    const diagnostics = getEssentialDiagnostics();

    // Optional screenshot, sent as data URL (server forwards it to Discord)
    let screenshotDataUrl: string | null = null;
    if (currentAttachedFile) {
      if (currentAttachedFile.size <= 2 * 1024 * 1024) {
        screenshotDataUrl = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(currentAttachedFile as File);
        });
      } else {
        showToast("Screenshot is too large (max 2 MB) — sending feedback without it.");
      }
    }

    // UI Loading State
    if (submitBtn) submitBtn.disabled = true;
    btnIcon?.classList.add('hidden');
    spinner?.classList.remove('hidden');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: {
            type: feedbackType,
            category: category,
            user_message: details,
            contact: contact
          },
          ...diagnostics,
          screenshotDataUrl
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Feedback failed (${res.status})`);
      }

      form.classList.add('hidden');
      successView?.classList.remove('hidden');
      showToast("Thanks! Your feedback has been sent.");
    } catch (err) {
      console.warn("Feedback submission failed:", err);
      showToast((err instanceof Error && err.message ? err.message : "⚠️ Couldn't send your feedback — please try again in a moment."));
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      btnIcon?.classList.remove('hidden');
      spinner?.classList.add('hidden');
    }
  });

  // Submit Another Button
  submitAnotherBtn?.addEventListener('click', () => {
    form?.reset();
    removeAttachedImage();
    if (charCounter) charCounter.textContent = "0 / 1000";
    successView?.classList.add('hidden');
    form?.classList.remove('hidden');

    // Reset default selections
    typePills.forEach((p, idx) => {
      if (idx === 0) p.classList.add('active');
      else p.classList.remove('active');
    });
    if (selectedTypeInput) selectedTypeInput.value = 'Improvement / Idea';

    categoryChips.forEach((c, idx) => {
      if (idx === 0) c.classList.add('active');
      else c.classList.remove('active');
    });
    if (selectedCategoryInput) selectedCategoryInput.value = 'General Site';
    if (categoryDisplayLabel) categoryDisplayLabel.textContent = 'General Site';
    if (headerIcon) {
      headerIcon.className = 'fa-solid fa-comment-dots';
    }
    if (btnText) btnText.textContent = 'Send Improvement';
  });
}
