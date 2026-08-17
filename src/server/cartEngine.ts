/**
 * OptiCraft Eyewear - Backend Cart Engine & Configuration Snapshot Handler
 */

import { Cart, CartItem, SavedForLaterItem, ProductConfiguration, Prescription } from '../types.js';
import { db } from './db.js';
import { buildAndValidateConfiguration } from './configurationEngine.js';

export function areConfigurationsEqual(c1: ProductConfiguration, c2: ProductConfiguration): boolean {
  if (c1.productId !== c2.productId) return false;
  if (c1.lensTypeId !== c2.lensTypeId) return false;
  if ((c1.materialId || '') !== (c2.materialId || '')) return false;

  const c1Coatings = [...(c1.coatingIds || [])].sort();
  const c2Coatings = [...(c2.coatingIds || [])].sort();
  if (c1Coatings.length !== c2Coatings.length) return false;
  for (let i = 0; i < c1Coatings.length; i++) {
    if (c1Coatings[i] !== c2Coatings[i]) return false;
  }

  const mode1 = c1.prescriptionMode || 'none';
  const mode2 = c2.prescriptionMode || 'none';
  if (mode1 !== mode2) return false;

  if (c1.requiresPrescription || c2.requiresPrescription) {
    const rx1 = c1.prescription;
    const rx2 = c2.prescription;

    if (!rx1 && !rx2) return true;
    if (!rx1 || !rx2) return false;

    if (mode1 === 'upload' || mode2 === 'upload') {
      if ((rx1.uploadedFilePath || '') !== (rx2.uploadedFilePath || '')) return false;
    }

    if (Number(rx1.pd || 0) !== Number(rx2.pd || 0)) return false;

    if (Number(rx1.odRight?.sph || 0) !== Number(rx2.odRight?.sph || 0)) return false;
    if (Number(rx1.odRight?.cyl || 0) !== Number(rx2.odRight?.cyl || 0)) return false;
    if (Number(rx1.odRight?.axis || 0) !== Number(rx2.odRight?.axis || 0)) return false;
    if (Number(rx1.odRight?.add || 0) !== Number(rx2.odRight?.add || 0)) return false;

    if (Number(rx1.osLeft?.sph || 0) !== Number(rx2.osLeft?.sph || 0)) return false;
    if (Number(rx1.osLeft?.cyl || 0) !== Number(rx2.osLeft?.cyl || 0)) return false;
    if (Number(rx1.osLeft?.axis || 0) !== Number(rx2.osLeft?.axis || 0)) return false;
    if (Number(rx1.osLeft?.add || 0) !== Number(rx2.osLeft?.add || 0)) return false;
  }

  return true;
}

export function getOrCreateCart(cartKey: string, userId?: string): Cart {
  let cart = db.carts.get(cartKey);
  if (!cart) {
    cart = {
      id: cartKey,
      userId,
      items: [],
      updatedAt: new Date().toISOString(),
    };
    db.carts.set(cartKey, cart);
  } else if (userId && !cart.userId) {
    cart.userId = userId;
  }
  return cart;
}

export function addCartItem(
  cartKey: string,
  configInput: any,
  requestedQuantity: number = 1,
  userId?: string
): { success: boolean; cart?: Cart; addedItemId?: string; error?: string } {
  const cart = getOrCreateCart(cartKey, userId);

  // 1. Validate configuration server-side
  const validation = buildAndValidateConfiguration(configInput);
  if (!validation.success || !validation.configuration) {
    return {
      success: false,
      error: validation.error || 'Invalid eyewear configuration.',
    };
  }

  const validatedConfig = validation.configuration;

  // 2. Validate Inventory
  const product = db.products.get(validatedConfig.productId);
  if (!product || !product.active) {
    return { success: false, error: 'Product frame is currently unavailable.' };
  }

  const qtyToAdd = Math.max(1, Number(requestedQuantity) || 1);

  // Check if identical configuration already exists in cart
  const existingItemIndex = cart.items.findIndex((item) =>
    areConfigurationsEqual(item.configuration, validatedConfig)
  );

  let currentItemQtyInCart = 0;
  if (existingItemIndex >= 0) {
    currentItemQtyInCart = cart.items[existingItemIndex].quantity;
  }

  if (currentItemQtyInCart + qtyToAdd > product.stock) {
    return {
      success: false,
      error: `Cannot add item. Only ${product.stock} units of ${product.name} are available in stock.`,
    };
  }

  let resultItemId = '';

  if (existingItemIndex >= 0) {
    // Increase quantity for duplicate configuration
    cart.items[existingItemIndex].quantity += qtyToAdd;
    // Update snapshot price to current authoritative price if needed
    cart.items[existingItemIndex].configuration = validatedConfig;
    resultItemId = cart.items[existingItemIndex].id;
  } else {
    // Add new distinct cart item
    const newItem: CartItem = {
      id: `ci-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      configuration: validatedConfig,
      quantity: qtyToAdd,
      addedAt: new Date().toISOString(),
    };
    cart.items.unshift(newItem);
    resultItemId = newItem.id;
  }

  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);

  return { success: true, cart, addedItemId: resultItemId };
}

export function updateCartItem(
  cartKey: string,
  itemId: string,
  update: { quantity?: number; configuration?: any },
  userId?: string
): { success: boolean; cart?: Cart; error?: string } {
  const cart = getOrCreateCart(cartKey, userId);

  const itemIndex = cart.items.findIndex((i) => i.id === itemId);
  if (itemIndex < 0) {
    return { success: false, error: 'Cart item not found.' };
  }

  const existingItem = cart.items[itemIndex];

  // If updating quantity
  if (update.quantity !== undefined) {
    const newQty = Number(update.quantity);
    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = db.products.get(existingItem.configuration.productId);
      if (product && newQty > product.stock) {
        return {
          success: false,
          error: `Only ${product.stock} units available in stock.`,
        };
      }
      existingItem.quantity = newQty;
    }
  }

  // If editing configuration
  if (update.configuration) {
    const validation = buildAndValidateConfiguration(update.configuration);
    if (!validation.success || !validation.configuration) {
      return {
        success: false,
        error: validation.error || 'Invalid edited configuration.',
      };
    }

    const newValidatedConfig = validation.configuration;
    const product = db.products.get(newValidatedConfig.productId);
    if (!product || !product.active) {
      return { success: false, error: 'Selected frame is unavailable.' };
    }

    if (existingItem.quantity > product.stock) {
      return {
        success: false,
        error: `Only ${product.stock} units available for this frame.`,
      };
    }

    existingItem.configuration = newValidatedConfig;
  }

  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);

  return { success: true, cart };
}

export function deleteCartItem(cartKey: string, itemId: string, userId?: string): { success: boolean; cart: Cart } {
  const cart = getOrCreateCart(cartKey, userId);
  cart.items = cart.items.filter((i) => i.id !== itemId);
  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);
  return { success: true, cart };
}

export function clearCart(cartKey: string, userId?: string): { success: boolean; cart: Cart } {
  const cart = getOrCreateCart(cartKey, userId);
  cart.items = [];
  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);
  return { success: true, cart };
}

export function mergeCarts(guestCartKey: string, userCartKey: string, userId?: string): { success: boolean; cart: Cart } {
  const guestCart = db.carts.get(guestCartKey);
  const userCart = getOrCreateCart(userCartKey, userId);
  userCart.userId = userId;

  if (!guestCart || guestCart.items.length === 0) {
    return { success: true, cart: userCart };
  }

  for (const guestItem of guestCart.items) {
    const product = db.products.get(guestItem.configuration.productId);
    const stock = product ? product.stock : 99;

    const existingIndex = userCart.items.findIndex((uItem) =>
      areConfigurationsEqual(uItem.configuration, guestItem.configuration)
    );

    if (existingIndex >= 0) {
      const currentQty = userCart.items[existingIndex].quantity;
      userCart.items[existingIndex].quantity = Math.min(stock, currentQty + guestItem.quantity);
    } else {
      userCart.items.unshift({
        ...guestItem,
        id: `ci-merged-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        quantity: Math.min(stock, guestItem.quantity),
      });
    }
  }

  // Clear guest cart after merge
  guestCart.items = [];
  guestCart.updatedAt = new Date().toISOString();
  db.carts.set(guestCartKey, guestCart);

  userCart.updatedAt = new Date().toISOString();
  db.carts.set(userCartKey, userCart);

  return { success: true, cart: userCart };
}

export function validateCart(cartKey: string, userId?: string): {
  success: boolean;
  cart: Cart;
  priceChanged: boolean;
  stockWarnings: string[];
} {
  const cart = getOrCreateCart(cartKey, userId);
  let priceChanged = false;
  const stockWarnings: string[] = [];

  for (let i = cart.items.length - 1; i >= 0; i--) {
    const item = cart.items[i];
    const product = db.products.get(item.configuration.productId);

    if (!product || !product.active) {
      stockWarnings.push(`Item "${item.configuration.productName}" is no longer available and was removed.`);
      cart.items.splice(i, 1);
      continue;
    }

    if (item.quantity > product.stock) {
      if (product.stock === 0) {
        stockWarnings.push(`Frame "${product.name}" is out of stock and was removed from cart.`);
        cart.items.splice(i, 1);
      } else {
        stockWarnings.push(`Quantity for "${product.name}" adjusted to ${product.stock} due to available stock.`);
        item.quantity = product.stock;
      }
    }

    // Re-run configuration pricing validation
    const reval = buildAndValidateConfiguration({
      productId: item.configuration.productId,
      lensTypeId: item.configuration.lensTypeId,
      materialId: item.configuration.materialId,
      coatingIds: item.configuration.coatingIds,
      prescription: item.configuration.prescription,
      prescriptionMode: item.configuration.prescriptionMode,
    });

    if (reval.success && reval.configuration) {
      if (reval.configuration.calculatedTotalPrice !== item.configuration.calculatedTotalPrice) {
        priceChanged = true;
        item.configuration = reval.configuration;
      }
    }
  }

  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);

  return { success: true, cart, priceChanged, stockWarnings };
}

export function getSavedForLater(savedKey: string): SavedForLaterItem[] {
  return db.savedForLater.get(savedKey) || [];
}

export function saveCartItemForLater(
  cartKey: string,
  savedKey: string,
  itemId: string,
  userId?: string
): { success: boolean; cart?: Cart; savedItems?: SavedForLaterItem[]; error?: string } {
  const cart = getOrCreateCart(cartKey, userId);
  const itemIndex = cart.items.findIndex((i) => i.id === itemId);

  if (itemIndex < 0) {
    return { success: false, error: 'Item not found in cart.' };
  }

  const [itemToSave] = cart.items.splice(itemIndex, 1);
  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);

  const savedList = [...(db.savedForLater.get(savedKey) || [])];
  const savedItem: SavedForLaterItem = {
    ...itemToSave,
    savedAt: new Date().toISOString(),
  };

  // Check if identical config exists in saved items
  const existingSavedIndex = savedList.findIndex((i) =>
    areConfigurationsEqual(i.configuration, itemToSave.configuration)
  );

  if (existingSavedIndex >= 0) {
    savedList[existingSavedIndex].quantity += itemToSave.quantity;
    savedList[existingSavedIndex].savedAt = new Date().toISOString();
  } else {
    savedList.unshift(savedItem);
  }

  db.savedForLater.set(savedKey, savedList);

  return { success: true, cart, savedItems: savedList };
}

export function moveSavedItemToCart(
  savedKey: string,
  cartKey: string,
  itemId: string,
  userId?: string
): { success: boolean; cart?: Cart; savedItems?: SavedForLaterItem[]; error?: string } {
  const savedList = [...(db.savedForLater.get(savedKey) || [])];
  const itemIndex = savedList.findIndex((i) => i.id === itemId);

  if (itemIndex < 0) {
    return { success: false, error: 'Saved item not found.' };
  }

  const savedItem = savedList[itemIndex];
  // Add to cart using addCartItem
  const addRes = addCartItem(cartKey, savedItem.configuration, savedItem.quantity, userId);
  if (!addRes.success) {
    return { success: false, error: addRes.error || 'Failed to move item to cart.' };
  }

  // Remove from saved for later
  savedList.splice(itemIndex, 1);
  db.savedForLater.set(savedKey, savedList);

  return {
    success: true,
    cart: addRes.cart,
    savedItems: savedList,
  };
}

export function deleteSavedItem(
  savedKey: string,
  itemId: string
): { success: boolean; savedItems: SavedForLaterItem[] } {
  const savedList = (db.savedForLater.get(savedKey) || []).filter((i) => i.id !== itemId);
  db.savedForLater.set(savedKey, savedList);
  return { success: true, savedItems: savedList };
}

export function moveCartItemToWishlist(
  cartKey: string,
  wishlistKey: string,
  itemId: string,
  userId?: string
): { success: boolean; cart?: Cart; wishlist?: string[]; error?: string } {
  const cart = getOrCreateCart(cartKey, userId);
  const itemIndex = cart.items.findIndex((i) => i.id === itemId);

  if (itemIndex < 0) {
    return { success: false, error: 'Item not found in cart.' };
  }

  const [item] = cart.items.splice(itemIndex, 1);
  cart.updatedAt = new Date().toISOString();
  db.carts.set(cartKey, cart);

  // Add to wishlist
  let wishlist = db.wishlists.get(wishlistKey);
  if (!wishlist) {
    wishlist = new Set<string>();
  }
  wishlist.add(item.configuration.productId);
  db.wishlists.set(wishlistKey, wishlist);

  return {
    success: true,
    cart,
    wishlist: Array.from(wishlist),
  };
}

export function moveSavedItemToWishlist(
  savedKey: string,
  wishlistKey: string,
  itemId: string
): { success: boolean; savedItems?: SavedForLaterItem[]; wishlist?: string[]; error?: string } {
  const savedList = [...(db.savedForLater.get(savedKey) || [])];
  const itemIndex = savedList.findIndex((i) => i.id === itemId);

  if (itemIndex < 0) {
    return { success: false, error: 'Item not found in saved list.' };
  }

  const [item] = savedList.splice(itemIndex, 1);
  db.savedForLater.set(savedKey, savedList);

  let wishlist = db.wishlists.get(wishlistKey);
  if (!wishlist) {
    wishlist = new Set<string>();
  }
  wishlist.add(item.configuration.productId);
  db.wishlists.set(wishlistKey, wishlist);

  return {
    success: true,
    savedItems: savedList,
    wishlist: Array.from(wishlist),
  };
}

