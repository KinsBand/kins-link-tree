/**
 * Store Master Lifecycle Controller — Kins Official
 * Coordinates Cart Drawer, Quick View Modal, Waitlist Modal, and Drop Countdown.
 * Follows AGENTS.md §6.2 lifecycle teardown contract.
 */

import {
  getCartItems,
  getCartTotals,
  addToCart,
  updateItemQuantity,
  removeFromCart,
  applyPromoCode,
  removePromoCode,
  notifyCartSubscribers
} from './cartStore.js';
import { initStoreFilter } from './storeFilterController.js';
import { showToast } from '../toast.js';
import { storeConfig } from '../../../settings/store.config.ts';

let countdownInterval = null;
let boundKeyHandler = null;

/**
 * Initialize Store Controller
 */
export function initStoreController() {
  teardownStoreController();

  // Initialize filters
  initStoreFilter();

  // Initialize Cart Drawer & Nav Badges
  initCartDrawer();

  // Initialize Product Cards (Variant clicks, Add-to-cart, Quick-view triggers)
  initProductCardBindings();

  // Initialize Quick View Modal
  initQuickViewModal();

  // Initialize Waitlist Modal
  initWaitlistModal();

  // Initialize Fan Merch Idea Submission
  initMerchIdeaForm();

  // Initialize Countdown Clock
  initDropCountdown();

  // Global ESC Key Listener
  boundKeyHandler = (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeQuickViewModal();
      closeWaitlistModal();
      closeMerchIdeaModal();
    }
  };
  document.addEventListener('keydown', boundKeyHandler);

  // Subscribe to Cart Updates
  window.addEventListener('kins:cart-updated', onCartUpdated);

  // Initial render of cart state
  notifyCartSubscribers();
}

/**
 * Teardown Store Controller (called before swap or route transition)
 */
export function teardownStoreController() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (boundKeyHandler) {
    document.removeEventListener('keydown', boundKeyHandler);
    boundKeyHandler = null;
  }
  window.removeEventListener('kins:cart-updated', onCartUpdated);
  document.body.classList.remove('store-drawer-locked');
}

/**
 * Initialize Cart Drawer Bindings
 */
function initCartDrawer() {
  const openCartBtns = document.querySelectorAll('[data-action="open-cart"], #openCartBtn, #storeNavCartBtn');
  const closeCartBtns = document.querySelectorAll('[data-action="close-cart"], #closeCartDrawerBtn, #cartBackdropOverlay, #continueShoppingBtn');
  const promoForm = document.getElementById('cartPromoForm');
  const promoInput = document.getElementById('cartPromoInput');
  const removePromoBtn = document.getElementById('removePromoBtn');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  openCartBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  closeCartBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeCartDrawer();
    });
  });

  if (promoForm && promoInput) {
    promoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = promoInput.value.trim();
      const res = applyPromoCode(code);
      showToast(res.message, res.success ? 'success' : 'warning');
      if (res.success) promoInput.value = '';
    });
  }

  if (removePromoBtn) {
    removePromoBtn.addEventListener('click', () => {
      removePromoCode();
      showToast('Promo code removed.', 'info');
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const items = getCartItems();
      if (items.length === 0) {
        showToast('Your cart is empty!', 'warning');
        return;
      }
      showToast('Redirecting to secure checkout...', 'success');
      // Simulated checkout or link out
      setTimeout(() => {
        showToast('Checkout test completed. Thank you for supporting Kins!', 'success');
      }, 1500);
    });
  }
}

/**
 * Open Cart Drawer
 */
export function openCartDrawer() {
  const drawer = document.getElementById('storeCartDrawer');
  const overlay = document.getElementById('cartBackdropOverlay');
  if (drawer && overlay) {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.classList.add('store-drawer-locked');
    drawer.setAttribute('aria-hidden', 'false');
  }
}

/**
 * Close Cart Drawer
 */
export function closeCartDrawer() {
  const drawer = document.getElementById('storeCartDrawer');
  const overlay = document.getElementById('cartBackdropOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.classList.remove('store-drawer-locked');
    drawer.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Handle reactive cart updates
 * @param {CustomEvent} e
 */
function onCartUpdated(e) {
  const { items, totals } = e.detail;

  // Update Nav Badge Counters
  const badgeEls = document.querySelectorAll('.cart-badge-count, #cartBadgeCount, #storeNavBadgeCount');
  badgeEls.forEach((badge) => {
    badge.textContent = totals.count;
    if (totals.count > 0) {
      badge.classList.remove('is-empty');
      badge.style.display = 'inline-flex';
    } else {
      badge.classList.add('is-empty');
      badge.style.display = 'none';
    }
  });

  // Update Cart Header Count
  const headerCount = document.getElementById('cartItemCountHeader');
  if (headerCount) {
    headerCount.textContent = `(${totals.count})`;
  }

  // Update Free Shipping Progress Bar
  const freeShippingBar = document.getElementById('freeShippingProgressBar');
  const freeShippingText = document.getElementById('freeShippingProgressText');
  if (freeShippingBar && freeShippingText) {
    freeShippingBar.style.width = `${totals.progressToFreeShipping}%`;
    if (totals.isFreeShipping) {
      freeShippingText.innerHTML = `🎉 <strong>FREE SHIPPING UNLOCKED!</strong>`;
      freeShippingBar.classList.add('is-unlocked');
    } else {
      freeShippingText.innerHTML = `Add <strong>$${totals.remainingForFreeShipping.toFixed(2)}</strong> more for <strong>FREE SHIPPING</strong>`;
      freeShippingBar.classList.remove('is-unlocked');
    }
  }

  // Render Line Items
  renderCartDrawerItems(items, totals);
}

/**
 * Render Cart Line Items inside drawer
 */
function renderCartDrawerItems(items, totals) {
  const itemsContainer = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('cartDrawerEmptyState');
  const subtotalEl = document.getElementById('cartSubtotalAmount');
  const discountRow = document.getElementById('cartDiscountRow');
  const discountAmountEl = document.getElementById('cartDiscountAmount');
  const discountLabelEl = document.getElementById('cartDiscountLabel');
  const shippingEl = document.getElementById('cartShippingAmount');
  const totalEl = document.getElementById('cartTotalAmount');

  if (!itemsContainer) return;

  if (items.length === 0) {
    itemsContainer.innerHTML = '';
    itemsContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    itemsContainer.style.display = 'flex';

    itemsContainer.innerHTML = items
      .map(
        (item) => `
        <div class="cart-line-item" data-item-id="${item.itemId}">
          <div class="cart-item-img-box">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-title-row">
              <h4 class="cart-item-title">${item.title}</h4>
              <button type="button" class="cart-item-remove-btn brutal-press" data-action="remove-item" data-id="${item.itemId}" aria-label="Remove ${item.title}">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
            <div class="cart-item-variant">Variant: <strong>${item.variantName}</strong></div>
            <div class="cart-item-price-row">
              <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
              <div class="cart-qty-stepper">
                <button type="button" class="cart-qty-btn brutal-press" data-action="qty-minus" data-id="${item.itemId}" aria-label="Decrease quantity">−</button>
                <span class="cart-qty-value">${item.quantity}</span>
                <button type="button" class="cart-qty-btn brutal-press" data-action="qty-plus" data-id="${item.itemId}" aria-label="Increase quantity">+</button>
              </div>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    // Bind quantity and remove buttons
    itemsContainer.querySelectorAll('[data-action="qty-minus"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = items.find((i) => i.itemId === id);
        if (item) updateItemQuantity(id, item.quantity - 1);
      });
    });

    itemsContainer.querySelectorAll('[data-action="qty-plus"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = items.find((i) => i.itemId === id);
        if (item) updateItemQuantity(id, item.quantity + 1);
      });
    });

    itemsContainer.querySelectorAll('[data-action="remove-item"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        removeFromCart(id);
        showToast('Item removed from bag.', 'info');
      });
    });
  }

  // Update Summary Readouts
  if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
  
  if (discountRow && discountAmountEl) {
    if (totals.promoInfo && totals.discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountAmountEl.textContent = `-$${totals.discountAmount.toFixed(2)}`;
      if (discountLabelEl) discountLabelEl.textContent = totals.promoInfo.label;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (shippingEl) {
    if (totals.subtotal === 0) {
      shippingEl.textContent = '$0.00';
    } else if (totals.isFreeShipping) {
      shippingEl.innerHTML = `<span class="free-shipping-tag">FREE</span>`;
    } else {
      shippingEl.textContent = `$${totals.shippingFee.toFixed(2)}`;
    }
  }

  if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)}`;
}

/**
 * Bind Product Card Interactions
 */
function initProductCardBindings() {
  const cards = document.querySelectorAll('.store-product-card');

  cards.forEach((card) => {
    const productId = card.getAttribute('data-product-id');
    const product = storeConfig.products.find((p) => p.id === productId);
    if (!product) return;

    // Variant Chip Selection
    const variantChips = card.querySelectorAll('.card-variant-chip');
    let selectedVariant = product.variants.find((v) => v.inStock) || product.variants[0];

    variantChips.forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const vId = chip.getAttribute('data-variant-id');
        const matched = product.variants.find((v) => v.id === vId);
        if (matched && matched.inStock) {
          selectedVariant = matched;
          variantChips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
        }
      });
    });

    // Add to Cart Button
    const addBtn = card.querySelector('.btn-add-to-cart');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (product.status === 'sold_out') {
          openWaitlistModal(product);
          return;
        }
        if (!selectedVariant) {
          showToast('Please select a variant.', 'warning');
          return;
        }

        // Add visual feedback
        const originalHtml = addBtn.innerHTML;
        addBtn.classList.add('btn-added');
        addBtn.innerHTML = `<span>ADDED ✓</span>`;
        setTimeout(() => {
          addBtn.classList.remove('btn-added');
          addBtn.innerHTML = originalHtml;
        }, 1200);

        addToCart(product, selectedVariant, 1);
        showToast(`Added "${product.title}" (${selectedVariant.name}) to bag!`, 'success');
        openCartDrawer();
      });
    }

    // Quick View Trigger
    const quickViewBtn = card.querySelector('.btn-quick-view');
    if (quickViewBtn) {
      quickViewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openQuickViewModal(product);
      });
    }
  });
}

/**
 * Quick View Modal Logic
 */
let activeQuickViewProduct = null;
let activeQuickViewVariant = null;

function initQuickViewModal() {
  const modal = document.getElementById('productQuickViewModal');
  const closeBtn = document.getElementById('closeQuickViewBtn');
  const backdrop = document.getElementById('quickViewBackdrop');

  if (closeBtn) closeBtn.addEventListener('click', closeQuickViewModal);
  if (backdrop) backdrop.addEventListener('click', closeQuickViewModal);
}

export function openQuickViewModal(product) {
  const modal = document.getElementById('productQuickViewModal');
  if (!modal || !product) return;

  activeQuickViewProduct = product;
  activeQuickViewVariant = product.variants.find((v) => v.inStock) || product.variants[0];

  // Populate Modal Fields
  const titleEl = modal.querySelector('#quickViewTitle');
  const subtitleEl = modal.querySelector('#quickViewSubtitle');
  const priceEl = modal.querySelector('#quickViewPrice');
  const comparePriceEl = modal.querySelector('#quickViewComparePrice');
  const badgeEl = modal.querySelector('#quickViewBadge');
  const descEl = modal.querySelector('#quickViewDesc');
  const imgEl = modal.querySelector('#quickViewMainImg');
  const variantsContainer = modal.querySelector('#quickViewVariants');
  const specsContainer = modal.querySelector('#quickViewSpecsList');
  const addBtn = modal.querySelector('#quickViewAddBtn');

  if (titleEl) titleEl.textContent = product.title;
  if (subtitleEl) subtitleEl.textContent = product.subtitle;
  if (priceEl) priceEl.textContent = `$${product.price.toFixed(2)}`;
  if (comparePriceEl) {
    if (product.compareAtPrice) {
      comparePriceEl.textContent = `$${product.compareAtPrice.toFixed(2)}`;
      comparePriceEl.style.display = 'inline';
    } else {
      comparePriceEl.style.display = 'none';
    }
  }

  if (badgeEl) {
    if (product.badge) {
      badgeEl.textContent = product.badge;
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  if (descEl) descEl.textContent = product.description;
  if (imgEl) {
    imgEl.src = product.images.primary;
    imgEl.alt = product.images.alt || product.title;
  }

  // Populate Specifications / Tracklist
  if (specsContainer) {
    const list = product.details.specifications || product.details.tracklist || [];
    if (list.length > 0) {
      specsContainer.innerHTML = list.map((item) => `<li><i class="fa-solid fa-angle-right"></i> ${item}</li>`).join('');
      specsContainer.parentElement.style.display = 'block';
    } else {
      specsContainer.parentElement.style.display = 'none';
    }
  }

  // Populate Variants
  if (variantsContainer) {
    variantsContainer.innerHTML = product.variants
      .map(
        (v) => `
        <button type="button" class="quick-view-variant-chip brutal-press ${v.id === activeQuickViewVariant?.id ? 'active' : ''} ${!v.inStock ? 'disabled' : ''}" data-variant-id="${v.id}" ${!v.inStock ? 'disabled' : ''}>
          ${v.name} ${!v.inStock ? '(Sold Out)' : ''}
        </button>
      `
      )
      .join('');

    variantsContainer.querySelectorAll('.quick-view-variant-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const vId = chip.getAttribute('data-variant-id');
        const matched = product.variants.find((v) => v.id === vId);
        if (matched && matched.inStock) {
          activeQuickViewVariant = matched;
          variantsContainer.querySelectorAll('.quick-view-variant-chip').forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
        }
      });
    });
  }

  // Bind Add to Cart CTA
  if (addBtn) {
    addBtn.onclick = () => {
      if (activeQuickViewProduct && activeQuickViewVariant) {
        addToCart(activeQuickViewProduct, activeQuickViewVariant, 1);
        showToast(`Added "${activeQuickViewProduct.title}" (${activeQuickViewVariant.name}) to bag!`, 'success');
        closeQuickViewModal();
        openCartDrawer();
      }
    };
  }

  modal.classList.add('is-open');
  document.body.classList.add('store-drawer-locked');
}

export function closeQuickViewModal() {
  const modal = document.getElementById('productQuickViewModal');
  if (modal) {
    modal.classList.remove('is-open');
    document.body.classList.remove('store-drawer-locked');
  }
}

/**
 * Waitlist / Drop Alert Modal
 */
function initWaitlistModal() {
  const modal = document.getElementById('storeWaitlistModal');
  const closeBtn = document.getElementById('closeWaitlistBtn');
  const backdrop = document.getElementById('waitlistBackdrop');
  const form = document.getElementById('storeWaitlistForm');

  if (closeBtn) closeBtn.addEventListener('click', closeWaitlistModal);
  if (backdrop) backdrop.addEventListener('click', closeWaitlistModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('#waitlistEmailInput');
      const itemInput = form.querySelector('#waitlistProductInput');
      const submitBtn = form.querySelector('#waitlistSubmitBtn');
      const email = emailInput?.value.trim();
      const product = itemInput?.value || 'General Drop Notification';

      if (!email) {
        showToast('Please enter your email.', 'warning');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'JOINING...';
      }

      try {
        const res = await fetch('/api/store-waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, productTitle: product })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('You are on the list! We will notify you first.', 'success');
          closeWaitlistModal();
          form.reset();
        } else {
          showToast(data.message || 'Submission failed. Please try again.', 'warning');
        }
      } catch (err) {
        showToast('Submission error. Please check your connection.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'NOTIFY ME';
        }
      }
    });
  }
}

export function openWaitlistModal(product = null) {
  const modal = document.getElementById('storeWaitlistModal');
  const itemInput = document.getElementById('waitlistProductInput');
  const itemNameEl = document.getElementById('waitlistProductName');

  if (modal) {
    if (product) {
      if (itemInput) itemInput.value = product.title;
      if (itemNameEl) itemNameEl.textContent = `for "${product.title}"`;
    } else {
      if (itemInput) itemInput.value = '2026 Debut Capsule Drop';
      if (itemNameEl) itemNameEl.textContent = 'for the upcoming Merch Drop';
    }
    modal.classList.add('is-open');
    document.body.classList.add('store-drawer-locked');
  }
}

export function closeWaitlistModal() {
  const modal = document.getElementById('storeWaitlistModal');
  if (modal) {
    modal.classList.remove('is-open');
    document.body.classList.remove('store-drawer-locked');
  }
}

/**
 * Drop Countdown Timer
 */
function initDropCountdown() {
  const daysEl = document.getElementById('dropDays');
  const hoursEl = document.getElementById('dropHours');
  const minutesEl = document.getElementById('dropMinutes');
  const secondsEl = document.getElementById('dropSeconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  const targetDate = new Date(storeConfig.dropDateIso).getTime();

  function update() {
    const now = new Date().getTime();
    const diff = Math.max(0, targetDate - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minutesEl.textContent = String(m).padStart(2, '0');
    secondsEl.textContent = String(s).padStart(2, '0');
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

/**
 * Merch Lab / Fan Concept Submission Modal Controller
 */
export function openMerchIdeaModal() {
  const modal = document.getElementById('merchIdeaModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
}

export function closeMerchIdeaModal() {
  const modal = document.getElementById('merchIdeaModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
}

function initMerchIdeaForm() {
  const openBtn = document.getElementById('openMerchIdeaModalBtn');
  const modal = document.getElementById('merchIdeaModal');
  const closeBtn = document.getElementById('closeMerchIdeaModalBtn');
  const doneBtn = document.getElementById('modalDoneBtn');
  const form = document.getElementById('merchIdeaModalForm');
  const successView = document.getElementById('modalIdeaSuccessView');
  const submitAnotherBtn = document.getElementById('modalSubmitAnotherBtn');
  const chips = document.querySelectorAll('#modalCategoryChipsGrid .category-chip');
  const categoryInput = document.getElementById('modalCategoryInput');
  const categoryLabel = document.getElementById('modalSelectedCategoryLabel');
  const descInput = document.getElementById('modalIdeaDesc');
  const charCounter = document.getElementById('modalCharCounter');
  const pasteBtn = document.getElementById('modalPasteLinkBtn');
  const linkInput = document.getElementById('modalIdeaLink');

  if (openBtn) openBtn.addEventListener('click', openMerchIdeaModal);
  if (closeBtn) closeBtn.addEventListener('click', closeMerchIdeaModal);
  if (doneBtn) doneBtn.addEventListener('click', closeMerchIdeaModal);

  // Close when clicking outer backdrop
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeMerchIdeaModal();
    });
  }

  // Category selection chips
  chips.forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-category') || 'Apparel / Tees';
      if (categoryInput) categoryInput.value = cat;
      if (categoryLabel) categoryLabel.textContent = cat;
    });
  });

  // Live Character Counter
  if (descInput && charCounter) {
    descInput.addEventListener('input', () => {
      const len = descInput.value.length;
      charCounter.textContent = `${len} / 600`;
    });
  }

  // 1-Tap Paste Helper
  if (pasteBtn && linkInput) {
    pasteBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            linkInput.value = text.trim();
            showToast('Link pasted from clipboard.', 'info');
          }
        }
      } catch (err) {
        showToast('Clipboard access denied. Please paste manually.', 'warning');
      }
    });
  }

  // Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('modalSubmitConceptBtn');
      const title = document.getElementById('modalIdeaTitle')?.value?.trim();
      const description = descInput?.value?.trim();
      const link = linkInput?.value?.trim();
      const contact = document.getElementById('modalIdeaContact')?.value?.trim();
      const category = categoryInput?.value || 'Apparel / Tees';

      if (!title || !description || !contact) {
        showToast('Please fill in all required fields.', 'warning');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>SUBMITTING...</span>`;
      }

      try {
        const res = await fetch('/api/merch-idea', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            title,
            description,
            link: link || null,
            contact
          })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          showToast('Merch concept submitted to the Kins vault!', 'success');
          form.classList.add('hidden');
          if (successView) successView.classList.remove('hidden');
          form.reset();
          if (charCounter) charCounter.textContent = '0 / 600';
        } else {
          showToast(data.message || 'Submission error. Please try again.', 'warning');
        }
      } catch (err) {
        showToast('Failed to submit. Please check your connection.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>SUBMIT CONCEPT TO BAND</span> <i class="fa-solid fa-paper-plane btn-arrow-slide" aria-hidden="true"></i>`;
        }
      }
    });
  }

  // Submit Another Button
  if (submitAnotherBtn) {
    submitAnotherBtn.addEventListener('click', () => {
      if (successView) successView.classList.add('hidden');
      if (form) form.classList.remove('hidden');
    });
  }
}
