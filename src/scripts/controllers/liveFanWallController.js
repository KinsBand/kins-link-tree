/**
 * Live Fan Wall & Upload Controller
 * Handles fan media likes, category filtering, lightbox viewing,
 * dynamic category pill counts, empty state handling, and hydration of
 * server-approved fan uploads from /api/fan-wall.
 */

import { initLiveFanUploadForm } from './liveUploadController.js';

let fanWallControllerInitialized = false;

export function initLiveFanWallController() {
  if (fanWallControllerInitialized) return;
  fanWallControllerInitialized = true;

  const wallGrid = document.getElementById('liveFanWallGrid');
  const uploadModal = document.getElementById('liveUploadModal');
  const openUploadBtns = document.querySelectorAll('.open-live-upload-modal-btn');
  const closeUploadBtn = document.getElementById('closeLiveUploadModal');
  const mediaFileInput = document.getElementById('liveMediaFileInput');
  const mediaPreviewContainer = document.getElementById('liveMediaPreviewContainer');
  const mediaPreviewImg = document.getElementById('liveMediaPreviewImg');
  const lightbox = document.getElementById('liveMediaLightbox');
  const closeLightboxBtn = document.getElementById('closeLiveLightboxBtn');
  const lightboxMediaContainer = document.getElementById('liveLightboxMediaContainer');
  const lightboxAuthor = document.getElementById('liveLightboxAuthor');
  const lightboxCaption = document.getElementById('liveLightboxCaption');

  let activeFilterCategory = 'All';
  let approvedItemsLoadStarted = false;

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
  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function safeStorageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function bindLikeButtons() {
    const likeBtns = wallGrid ? wallGrid.querySelectorAll('.fan-wall-like-btn') : document.querySelectorAll('.fan-wall-like-btn');
    likeBtns.forEach(btn => {
      const postId = btn.getAttribute('data-post-id');
      const countSpan = btn.querySelector('.fan-wall-like-count');
      const heartIcon = btn.querySelector('i');
      const likedKey = `kins_fanwall_liked_${postId}`;
      const isLiked = safeStorageGet(likedKey) === 'true';

      // Restore initial state on mount
      if (isLiked) {
        btn.classList.add('liked');
        if (heartIcon) heartIcon.className = 'fa-solid fa-heart';
      }

      // Re-assign onclick to avoid duplicate listeners
      btn.onclick = (e) => {
        e.stopPropagation();
        const alreadyLiked = safeStorageGet(likedKey) === 'true';
        let currentCount = parseInt(countSpan?.textContent || '0', 10);

        if (alreadyLiked) {
          // Unlike
          safeStorageRemove(likedKey);
          btn.classList.remove('liked');
          if (countSpan) countSpan.textContent = String(Math.max(0, currentCount - 1));
          if (heartIcon) heartIcon.className = 'fa-regular fa-heart';
        } else {
          // Like
          safeStorageSet(likedKey, 'true');
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

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (mediaPreviewImg) mediaPreviewImg.src = ev.target.result;
        if (mediaPreviewContainer) mediaPreviewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  // 7. Approved Uploads Loader — hydrates moderation-approved media from the API.
  // Cards mirror the seeded .fan-wall-card DOM exactly; all dynamic strings go
  // through textContent/createElement (no innerHTML interpolation of API data).
  function relativeTimeLabel(isoString) {
    const then = Date.parse(isoString || '');
    if (isNaN(then)) return 'Recently';
    const diffMs = Date.now() - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function buildApprovedCard(item) {
    const mediaType = item.mediaType === 'video' ? 'video' : 'image';
    const category = mediaType === 'video' ? 'Videos' : 'Photos';
    const handle = item.handle || '@fan';
    const caption = item.caption || '';
    const postId = `wall-live-${item.id}`;

    const card = document.createElement('div');
    card.className = 'fan-wall-card';
    card.setAttribute('data-post-id', postId);
    card.setAttribute('data-category', category);
    card.setAttribute('data-media-url', item.url || '');
    card.setAttribute('data-media-type', mediaType);
    card.setAttribute('data-author', handle);
    card.setAttribute('data-caption', caption);

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'fan-wall-media-wrap';

    const thumb = document.createElement('img');
    thumb.className = 'fan-wall-media-thumb';
    thumb.loading = 'lazy';
    thumb.src = item.url || '';
    thumb.alt = caption;
    mediaWrap.appendChild(thumb);

    const categoryTag = document.createElement('span');
    categoryTag.className = 'fan-wall-category-tag';
    categoryTag.textContent = category;
    mediaWrap.appendChild(categoryTag);

    if (mediaType === 'video') {
      const playIndicator = document.createElement('div');
      playIndicator.className = 'video-play-indicator';
      playIndicator.setAttribute('aria-label', 'Video post');
      const playIcon = document.createElement('i');
      playIcon.className = 'fa-solid fa-play';
      playIndicator.appendChild(playIcon);
      mediaWrap.appendChild(playIndicator);
    }

    const content = document.createElement('div');
    content.className = 'fan-wall-card-content';

    const header = document.createElement('div');
    header.className = 'fan-wall-card-header';

    const handleEl = document.createElement('span');
    handleEl.className = 'fan-wall-handle';
    handleEl.textContent = handle;

    const timeEl = document.createElement('span');
    timeEl.className = 'fan-wall-time';
    timeEl.textContent = relativeTimeLabel(item.createdAt);

    header.appendChild(handleEl);
    header.appendChild(timeEl);

    const captionEl = document.createElement('p');
    captionEl.className = 'fan-wall-caption';
    captionEl.textContent = caption;

    const footer = document.createElement('div');
    footer.className = 'fan-wall-card-footer';

    const likeBtn = document.createElement('button');
    likeBtn.type = 'button';
    likeBtn.className = 'fan-wall-like-btn';
    likeBtn.setAttribute('data-post-id', postId);
    likeBtn.setAttribute('aria-label', 'Like post');
    const likeIcon = document.createElement('i');
    likeIcon.className = 'fa-regular fa-heart';
    const likeCount = document.createElement('span');
    likeCount.className = 'fan-wall-like-count';
    likeCount.textContent = '0';
    likeBtn.appendChild(likeIcon);
    likeBtn.appendChild(likeCount);
    footer.appendChild(likeBtn);

    content.appendChild(header);
    content.appendChild(captionEl);
    content.appendChild(footer);

    card.appendChild(mediaWrap);
    card.appendChild(content);
    return card;
  }

  async function loadApprovedWallItems() {
    if (approvedItemsLoadStarted) return;
    approvedItemsLoadStarted = true;

    try {
      const res = await fetch('/api/fan-wall', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => null);
      if (!data || data.status !== 'success' || !Array.isArray(data.items)) {
        throw new Error('Malformed /api/fan-wall payload');
      }
      if (!data.items.length) return;

      const grid = document.getElementById('liveFanWallGrid');
      if (!grid) return;

      const frag = document.createDocumentFragment();
      data.items.forEach((item) => frag.appendChild(buildApprovedCard(item)));

      const emptyState = document.getElementById('liveFanWallEmptyState');
      if (emptyState && emptyState.parentNode === grid && grid.firstElementChild === emptyState) {
        grid.insertBefore(frag, emptyState.nextSibling);
      } else {
        grid.prepend(frag);
      }

      updateCategoryPillCounts();
      applyCategoryFilter();
      bindLikeButtons();
      bindLightboxCards();
    } catch (err) {
      // Honest degradation: seeded posts remain, no fake items injected.
      console.warn('[liveFanWall] could not load approved uploads:', err);
    }
  }

  // Initialize listeners and counts on load
  bindFilterPills();
  bindLikeButtons();
  bindLightboxCards();
  updateCategoryPillCounts();
  applyCategoryFilter();

  // Real upload submission (POST /api/fan-upload). Replaces the old fake-persist path.
  initLiveFanUploadForm();

  // Hydrate moderation-approved uploads from the server.
  loadApprovedWallItems();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
