/**
 * Live Fan Wall & Upload Controller
 * Handles fan media likes, category filtering, lightbox viewing,
 * dynamic category pill counts, empty state handling, and client
 * media uploads with instant optimistic wall rendering.
 */

import { showToast } from './toast.js';
import { supabase } from '../../lib/supabase';

export function initLiveFanWallController() {
  const wallGrid = document.getElementById('liveFanWallGrid');
  const filterPills = document.querySelectorAll('.fan-wall-filter-pill');
  const uploadModal = document.getElementById('liveUploadModal');
  const openUploadBtns = document.querySelectorAll('.open-live-upload-modal-btn');
  const closeUploadBtn = document.getElementById('closeLiveUploadModal');
  const uploadForm = document.getElementById('liveMediaUploadForm');
  const mediaFileInput = document.getElementById('liveMediaFileInput');
  const mediaPreviewContainer = document.getElementById('liveMediaPreviewContainer');
  const mediaPreviewImg = document.getElementById('liveMediaPreviewImg');
  const lightbox = document.getElementById('liveMediaLightbox');
  const closeLightboxBtn = document.getElementById('closeLiveLightboxBtn');
  const lightboxMediaContainer = document.getElementById('liveLightboxMediaContainer');
  const lightboxAuthor = document.getElementById('liveLightboxAuthor');
  const lightboxCaption = document.getElementById('liveLightboxCaption');

  let selectedFile = null;
  let activeFilterCategory = 'All';

  // Helper to normalize strings for robust matching
  function normalizeCategory(cat) {
    return (cat || '').trim().toLowerCase();
  }

  // 1. Dynamic Category Pill Counts
  function updateCategoryPillCounts() {
    const grid = document.getElementById('liveFanWallGrid');
    const cards = grid?.querySelectorAll('.fan-wall-card') || document.querySelectorAll('.fan-wall-card');
    const totalCount = cards.length;
    const allPills = document.querySelectorAll('.fan-wall-filter-pill');

    allPills.forEach(pill => {
      const cat = pill.getAttribute('data-category') || 'All';
      const normalizedCat = normalizeCategory(cat);
      
      let count = 0;
      if (normalizedCat === 'all') {
        count = totalCount;
      } else {
        cards.forEach(card => {
          const cardCategory = normalizeCategory(card.getAttribute('data-category'));
          const cardMediaType = normalizeCategory(card.getAttribute('data-media-type'));
          if (cardCategory === normalizedCat || (normalizedCat === 'videos' && cardMediaType === 'video')) {
            count++;
          }
        });
      }

      // Update inner .pill-count span safely without destroying the pill DOM
      const countSpan = pill.querySelector('.pill-count');
      if (countSpan) {
        countSpan.textContent = String(count);
      }
    });
  }

  // 2. Category Filtering with Normalized String Matching & Empty State Handling
  function applyCategoryFilter() {
    const grid = document.getElementById('liveFanWallGrid');
    const cards = grid?.querySelectorAll('.fan-wall-card') || document.querySelectorAll('.fan-wall-card');
    const normalizedFilter = normalizeCategory(activeFilterCategory);
    let visibleCount = 0;

    cards.forEach(card => {
      const cardCategory = normalizeCategory(card.getAttribute('data-category'));
      const cardMediaType = normalizeCategory(card.getAttribute('data-media-type'));
      const isMatch = normalizedFilter === 'all' || 
                      cardCategory === normalizedFilter || 
                      (normalizedFilter === 'videos' && cardMediaType === 'video');
      
      if (isMatch) {
        card.classList.remove('hidden-by-filter');
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.classList.add('hidden-by-filter');
        card.style.display = 'none';
      }
    });

    // Show/hide empty state container
    const emptyState = document.getElementById('liveFanWallEmptyState');
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'flex';
      } else {
        emptyState.classList.add('hidden');
        emptyState.style.display = 'none';
      }
    }
  }

  // Direct click bindings for filter pills
  function bindFilterPills() {
    const allPills = document.querySelectorAll('.fan-wall-filter-pill');
    allPills.forEach(pill => {
      pill.onclick = (e) => {
        e.preventDefault();
        allPills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        activeFilterCategory = pill.getAttribute('data-category') || 'All';
        applyCategoryFilter();
      };
    });
  }

  // Delegated click listener on document for 100% filter pill reliability
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;
    const pill = target.closest('.fan-wall-filter-pill');
    if (pill) {
      e.preventDefault();
      const allPills = document.querySelectorAll('.fan-wall-filter-pill');
      allPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      activeFilterCategory = pill.getAttribute('data-category') || 'All';
      applyCategoryFilter();
    }
  });

  // 3. Like Buttons with Local Storage Persistence & Heart Bounce
  function bindLikeButtons() {
    const likeBtns = wallGrid ? wallGrid.querySelectorAll('.fan-wall-like-btn') : document.querySelectorAll('.fan-wall-like-btn');
    likeBtns.forEach(btn => {
      const postId = btn.getAttribute('data-post-id');
      const countSpan = btn.querySelector('.fan-wall-like-count');
      const heartIcon = btn.querySelector('i');
      const likedKey = `kins_fanwall_liked_${postId}`;
      const isLiked = localStorage.getItem(likedKey) === 'true';

      // Restore initial state on mount
      if (isLiked) {
        btn.classList.add('liked');
        if (heartIcon) heartIcon.className = 'fa-solid fa-heart';
      }

      // Re-assign onclick to avoid duplicate listeners
      btn.onclick = (e) => {
        e.stopPropagation();
        const alreadyLiked = localStorage.getItem(likedKey) === 'true';
        let currentCount = parseInt(countSpan?.textContent || '0', 10);

        if (alreadyLiked) {
          // Unlike
          localStorage.removeItem(likedKey);
          btn.classList.remove('liked');
          if (countSpan) countSpan.textContent = String(Math.max(0, currentCount - 1));
          if (heartIcon) heartIcon.className = 'fa-regular fa-heart';
        } else {
          // Like
          localStorage.setItem(likedKey, 'true');
          btn.classList.add('liked');
          btn.classList.add('heart-bounce-anim');
          setTimeout(() => btn.classList.remove('heart-bounce-anim'), 350);
          if (countSpan) countSpan.textContent = String(currentCount + 1);
          if (heartIcon) heartIcon.className = 'fa-solid fa-heart';
        }
      };
    });
  }

  // 4. Media Lightbox
  function bindLightboxCards() {
    const cards = wallGrid?.querySelectorAll('.fan-wall-card') || [];
    cards.forEach(card => {
      card.onclick = () => {
        const mediaUrl = card.getAttribute('data-media-url');
        const mediaType = card.getAttribute('data-media-type') || 'image';
        const author = card.getAttribute('data-author') || '@fan';
        const caption = card.getAttribute('data-caption') || '';

        if (!lightbox || !lightboxMediaContainer) return;

        if (mediaType === 'video') {
          lightboxMediaContainer.innerHTML = `<video src="${mediaUrl}" controls autoplay loop playsinline class="lightbox-video"></video>`;
        } else {
          lightboxMediaContainer.innerHTML = `<img src="${mediaUrl}" alt="${escapeHtml(caption)}" class="lightbox-image" />`;
        }

        if (lightboxAuthor) lightboxAuthor.textContent = author;
        if (lightboxCaption) lightboxCaption.textContent = caption;

        lightbox.classList.remove('hidden');
        document.body.classList.add('modal-open');
      };
    });
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.add('hidden');
      document.body.classList.remove('modal-open');
      if (lightboxMediaContainer) lightboxMediaContainer.innerHTML = '';
    }
  }

  if (closeLightboxBtn && lightbox) {
    closeLightboxBtn.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // 5. Upload Modal Open/Close
  function closeUploadModal() {
    if (uploadModal) {
      uploadModal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
  }

  openUploadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (uploadModal) {
        uploadModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }
    });
  });

  if (closeUploadBtn && uploadModal) {
    closeUploadBtn.addEventListener('click', closeUploadModal);

    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) {
        closeUploadModal();
      }
    });
  }

  // Close Lightbox & Upload Modal on Escape Key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightbox && !lightbox.classList.contains('hidden')) {
        closeLightbox();
      }
      if (uploadModal && !uploadModal.classList.contains('hidden')) {
        closeUploadModal();
      }
    }
  });

  // 6. File Picker & Preview
  if (mediaFileInput) {
    mediaFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (mediaPreviewImg) mediaPreviewImg.src = ev.target.result;
        if (mediaPreviewContainer) mediaPreviewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // 7. Form Submission
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const handleInput = document.getElementById('liveUploadHandleInput');
      const captionInput = document.getElementById('liveUploadCaptionInput');

      let handle = (handleInput?.value || '').trim();
      if (!handle) handle = '@fan_' + Math.floor(100 + Math.random() * 900);
      if (!handle.startsWith('@')) handle = '@' + handle;

      let caption = (captionInput?.value || '').trim();
      if (!caption) caption = 'Rocking out at The Cambridge Hotel with Kins! 🔥 #KinsLive';
      if (!caption.includes('#KinsLive')) caption += ' #KinsLive';

      const mediaUrl = mediaPreviewImg?.src || 'new.png';
      const isVideo = selectedFile ? selectedFile.type.startsWith('video') : false;
      const mediaType = isVideo ? 'video' : 'image';
      const newPostId = 'wall-user-' + Date.now();
      const postCategory = 'Pit Shots';

      // Optimistically insert card at top of grid
      const card = document.createElement('div');
      card.className = 'fan-wall-card new-post-pop-anim';
      card.setAttribute('data-post-id', newPostId);
      card.setAttribute('data-category', postCategory);
      card.setAttribute('data-media-url', mediaUrl);
      card.setAttribute('data-media-type', mediaType);
      card.setAttribute('data-author', handle);
      card.setAttribute('data-caption', caption);

      card.innerHTML = `
        <div class="fan-wall-media-wrap">
          <img src="${mediaUrl}" alt="${escapeHtml(caption)}" class="fan-wall-media-thumb" loading="lazy" />
          <span class="fan-wall-category-tag">${postCategory}</span>
          ${mediaType === 'video' ? `
            <div class="video-play-indicator" aria-label="Video post">
              <i class="fa-solid fa-play"></i>
            </div>
          ` : ''}
        </div>
        <div class="fan-wall-card-content">
          <div class="fan-wall-card-header">
            <span class="fan-wall-handle">${escapeHtml(handle)}</span>
            <span class="fan-wall-time">Just now</span>
          </div>
          <p class="fan-wall-caption">${escapeHtml(caption)}</p>
          <div class="fan-wall-card-footer">
            <button type="button" class="fan-wall-like-btn" data-post-id="${newPostId}" aria-label="Like post">
              <i class="fa-regular fa-heart"></i>
              <span class="fan-wall-like-count">1</span>
            </button>
          </div>
        </div>
      `;

      if (wallGrid) {
        // Insert after empty state if empty state is the first child, or prepend
        const emptyState = document.getElementById('liveFanWallEmptyState');
        if (emptyState && emptyState.parentNode === wallGrid && wallGrid.firstElementChild === emptyState) {
          wallGrid.insertBefore(card, emptyState.nextSibling);
        } else {
          wallGrid.prepend(card);
        }
      }

      // Update pill counts, category filtering, and re-bind handlers
      updateCategoryPillCounts();
      applyCategoryFilter();
      bindLikeButtons();
      bindLightboxCards();

      // Reset form & preview & close modal
      uploadForm.reset();
      selectedFile = null;
      if (mediaPreviewContainer) mediaPreviewContainer.classList.add('hidden');
      if (mediaPreviewImg) mediaPreviewImg.src = '';
      if (uploadModal) uploadModal.classList.add('hidden');
      document.body.classList.remove('modal-open');

      showToast('🎉 Photo submitted! You are live on the Fan Wall.', 'success');
    });
  }

  // Initialize listeners and counts on load
  bindFilterPills();
  bindLikeButtons();
  bindLightboxCards();
  updateCategoryPillCounts();
  applyCategoryFilter();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
