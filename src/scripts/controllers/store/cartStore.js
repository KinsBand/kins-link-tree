/**
 * Kins Official Cart Store — Local-First Reactive State
 * Strictly complies with AGENTS.md: zero bare localStorage (uses safeStorage).
 * Dispatches 'kins:cart-updated' CustomEvent for multi-island reactivity.
 */

import { safeGet, safeSet, safeRemove } from '../../utils/safeStorage.js';
import { storeConfig } from '../../../settings/store.config.ts';

const CART_STORAGE_KEY = 'kins_store_cart_v1';
const PROMO_STORAGE_KEY = 'kins_store_promo_v1';

let activePromoCode = safeGet(PROMO_STORAGE_KEY, null);

/**
 * @typedef {Object} CartItem
 * @property {string} itemId - Composite ID (productId + variantId)
 * @property {string} productId
 * @property {string} slug
 * @property {string} title
 * @property {string} variantId
 * @property {string} variantName
 * @property {number} price
 * @property {number} quantity
 * @property {string} image
 * @property {string} [badge]
 */

/**
 * Retrieve raw cart items from safeStorage
 * @returns {CartItem[]}
 */
export function getCartItems() {
  const raw = safeGet(CART_STORAGE_KEY, '[]');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save cart items and dispatch event
 * @param {CartItem[]} items
 */
function saveCartItems(items) {
  safeSet(CART_STORAGE_KEY, JSON.stringify(items));
  notifyCartSubscribers();
}

/**
 * Calculate totals, discounts, shipping, and item counts
 */
export function getCartTotals() {
  const items = getCartItems();
  const count = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  
  let discountAmount = 0;
  let promoInfo = null;

  if (activePromoCode && storeConfig.promoCodes[activePromoCode]) {
    const promo = storeConfig.promoCodes[activePromoCode];
    discountAmount = (subtotal * promo.discountPercent) / 100;
    promoInfo = {
      code: promo.code,
      label: promo.label,
      percent: promo.discountPercent,
      amount: discountAmount
    };
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const freeThreshold = storeConfig.freeShippingThreshold || 75;
  const isFreeShipping = subtotal >= freeThreshold;
  const shippingFee = (subtotal > 0 && !isFreeShipping) ? 10 : 0;
  const total = discountedSubtotal + shippingFee;
  const progressToFreeShipping = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const remainingForFreeShipping = Math.max(0, freeThreshold - subtotal);

  return {
    count,
    subtotal,
    discountAmount,
    discountedSubtotal,
    promoInfo,
    freeThreshold,
    isFreeShipping,
    shippingFee,
    total,
    progressToFreeShipping,
    remainingForFreeShipping,
    currencySymbol: storeConfig.currencySymbol || '$'
  };
}

/**
 * Notify all UI components of cart state change
 */
export function notifyCartSubscribers() {
  if (typeof window === 'undefined') return;
  const totals = getCartTotals();
  const items = getCartItems();
  
  window.dispatchEvent(
    new CustomEvent('kins:cart-updated', {
      detail: {
        items,
        totals
      }
    })
  );
}

/**
 * Add an item to the cart
 * @param {import('../../../settings/store.config.ts').StoreProduct} product
 * @param {import('../../../settings/store.config.ts').ProductVariant} variant
 * @param {number} [quantity=1]
 */
export function addToCart(product, variant, quantity = 1) {
  if (!product || !variant) return false;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const items = getCartItems();
  const compositeId = `${product.id}__${variant.id}`;
  
  const existingIdx = items.findIndex((i) => i.itemId === compositeId);
  const unitPrice = (product.price || 0) + (variant.priceOffset || 0);

  if (existingIdx >= 0) {
    items[existingIdx].quantity += qty;
  } else {
    items.push({
      itemId: compositeId,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      variantId: variant.id,
      variantName: variant.name,
      price: unitPrice,
      quantity: qty,
      image: product.images?.primary || '',
      badge: product.badge || ''
    });
  }

  saveCartItems(items);
  return true;
}

/**
 * Update item quantity
 * @param {string} itemId
 * @param {number} quantity
 */
export function updateItemQuantity(itemId, quantity) {
  const items = getCartItems();
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    return removeFromCart(itemId);
  }

  const idx = items.findIndex((i) => i.itemId === itemId);
  if (idx >= 0) {
    items[idx].quantity = qty;
    saveCartItems(items);
    return true;
  }
  return false;
}

/**
 * Remove an item from cart
 * @param {string} itemId
 */
export function removeFromCart(itemId) {
  const items = getCartItems();
  const filtered = items.filter((i) => i.itemId !== itemId);
  saveCartItems(filtered);
  return true;
}

/**
 * Clear entire cart
 */
export function clearCart() {
  saveCartItems([]);
  return true;
}

/**
 * Apply promo discount code
 * @param {string} code
 * @returns {{ success: boolean, message: string }}
 */
export function applyPromoCode(code) {
  if (!code) return { success: false, message: 'Please enter a promo code.' };
  const cleanCode = code.trim().toUpperCase();
  
  if (storeConfig.promoCodes && storeConfig.promoCodes[cleanCode]) {
    activePromoCode = cleanCode;
    safeSet(PROMO_STORAGE_KEY, cleanCode);
    notifyCartSubscribers();
    return {
      success: true,
      message: `Code ${cleanCode} applied! (${storeConfig.promoCodes[cleanCode].label})`
    };
  }

  return { success: false, message: 'Invalid or expired promo code.' };
}

/**
 * Remove active promo code
 */
export function removePromoCode() {
  activePromoCode = null;
  safeRemove(PROMO_STORAGE_KEY);
  notifyCartSubscribers();
}
