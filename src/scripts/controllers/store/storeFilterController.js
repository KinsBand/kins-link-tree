/**
 * Store Filter & Search Controller — Kins Official
 * Coordinates category pill filtering, search text indexing, and product sorting.
 */

let activeCategory = 'all';
let searchQuery = '';
let activeSort = 'featured';

/**
 * Initialize Store Filter Controller
 */
export function initStoreFilter() {
  const filterPills = document.querySelectorAll('.store-category-pill');
  const searchInput = document.getElementById('storeSearchInput');
  const clearSearchBtn = document.getElementById('storeSearchClearBtn');
  const sortSelect = document.getElementById('storeSortSelect');

  // Read initial query params from URL
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    const searchParam = urlParams.get('search');
    const sortParam = urlParams.get('sort');

    if (catParam) activeCategory = catParam;
    if (searchParam && searchInput) {
      searchQuery = searchParam.toLowerCase().trim();
      searchInput.value = searchParam;
    }
    if (sortParam && sortSelect) {
      activeSort = sortParam;
      sortSelect.value = sortParam;
    }
  }

  // Bind category pills
  filterPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const targetCat = pill.getAttribute('data-category') || 'all';
      setCategory(targetCat);
    });
  });

  // Bind search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }
      applyFiltersAndSort();
    });
  }

  // Bind clear search button
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      applyFiltersAndSort();
    });
  }

  // Bind sort select
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      applyFiltersAndSort();
    });
  }

  // Initial render
  updateActivePillUI();
  applyFiltersAndSort();
}

/**
 * Switch active category
 * @param {string} categoryId
 */
export function setCategory(categoryId) {
  activeCategory = categoryId;
  updateActivePillUI();
  updateUrlParams();
  applyFiltersAndSort();
}

/**
 * Update active category button styling
 */
function updateActivePillUI() {
  const filterPills = document.querySelectorAll('.store-category-pill');
  filterPills.forEach((pill) => {
    const cat = pill.getAttribute('data-category') || 'all';
    if (cat === activeCategory) {
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
    } else {
      pill.classList.remove('active');
      pill.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * Sync URL parameters silently without full reload
 */
function updateUrlParams() {
  if (typeof window === 'undefined' || !window.history) return;
  const url = new URL(window.location.href);
  
  if (activeCategory && activeCategory !== 'all') {
    url.searchParams.set('category', activeCategory);
  } else {
    url.searchParams.delete('category');
  }

  if (searchQuery) {
    url.searchParams.set('search', searchQuery);
  } else {
    url.searchParams.delete('search');
  }

  if (activeSort && activeSort !== 'featured') {
    url.searchParams.set('sort', activeSort);
  } else {
    url.searchParams.delete('sort');
  }

  window.history.replaceState({}, '', url.toString());
}

/**
 * Filter and sort visible product cards in the DOM
 */
export function applyFiltersAndSort() {
  const gridContainer = document.getElementById('storeProductGrid');
  const emptyState = document.getElementById('storeEmptyState');
  const countBadge = document.getElementById('storeVisibleCount');
  if (!gridContainer) return;

  const productCards = Array.from(gridContainer.querySelectorAll('.store-product-card'));
  let visibleCount = 0;

  productCards.forEach((card) => {
    const cardCat = card.getAttribute('data-category') || '';
    const title = (card.getAttribute('data-title') || '').toLowerCase();
    const desc = (card.getAttribute('data-desc') || '').toLowerCase();
    const tags = (card.getAttribute('data-tags') || '').toLowerCase();

    // Category match
    const categoryMatches = activeCategory === 'all' || cardCat === activeCategory;

    // Search query match
    const searchMatches =
      !searchQuery ||
      title.includes(searchQuery) ||
      desc.includes(searchQuery) ||
      tags.includes(searchQuery);

    if (categoryMatches && searchMatches) {
      card.classList.remove('hidden-by-filter');
      card.style.display = '';
      visibleCount++;
    } else {
      card.classList.add('hidden-by-filter');
      card.style.display = 'none';
    }
  });

  // Sort visible product cards
  const sortedCards = productCards.sort((a, b) => {
    const priceA = parseFloat(a.getAttribute('data-price') || '0');
    const priceB = parseFloat(b.getAttribute('data-price') || '0');
    const featuredA = a.getAttribute('data-featured') === 'true' ? 1 : 0;
    const featuredB = b.getAttribute('data-featured') === 'true' ? 1 : 0;

    if (activeSort === 'price_asc') {
      return priceA - priceB;
    } else if (activeSort === 'price_desc') {
      return priceB - priceA;
    } else if (activeSort === 'newest') {
      const idxA = parseInt(a.getAttribute('data-index') || '0', 10);
      const idxB = parseInt(b.getAttribute('data-index') || '0', 10);
      return idxB - idxA;
    }
    // Default: 'featured'
    return featuredB - featuredA;
  });

  // Re-append sorted cards to DOM
  sortedCards.forEach((card) => gridContainer.appendChild(card));

  // Toggle empty state
  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
  }

  // Update visible count text
  if (countBadge) {
    countBadge.textContent = `${visibleCount} item${visibleCount === 1 ? '' : 's'}`;
  }
}
