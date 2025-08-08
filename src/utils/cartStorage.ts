import { CartItem } from '../contexts/CartContext';
import { Coupon } from '../firebase/schema';

// Storage keys
const CART_STORAGE_PREFIX = 'vrisham_cart_';
const ANONYMOUS_USER_PREFIX = 'anonymous_';
const CART_ITEMS_KEY = 'items';
const CART_COUPON_KEY = 'coupon';
const CART_COUPON_DISCOUNT_KEY = 'coupon_discount';
const CART_DELIVERY_FEE_KEY = 'delivery_fee';

// Cart storage interface
export interface CartStorageData {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  deliveryFee: number;
}

// Generate a unique anonymous user ID
export const generateAnonymousUserId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${ANONYMOUS_USER_PREFIX}${timestamp}_${random}`;
};

// Get or create anonymous user ID
export const getAnonymousUserId = (): string => {
  const existingId = localStorage.getItem('vrisham_anonymous_user_id');
  if (existingId) {
    return existingId;
  }

  const newId = generateAnonymousUserId();
  localStorage.setItem('vrisham_anonymous_user_id', newId);
  return newId;
};

// Clear anonymous user ID (when user logs in)
export const clearAnonymousUserId = (): void => {
  localStorage.removeItem('vrisham_anonymous_user_id');
};

/**
 * Get storage key for a specific user
 */
const getUserStorageKey = (userId: string, key: string): string => {
  return `${CART_STORAGE_PREFIX}${userId}_${key}`;
};

/**
 * Save cart items to localStorage for a specific user
 */
export const saveCartItems = (userId: string, items: CartItem[]): void => {
  try {
    const key = getUserStorageKey(userId, CART_ITEMS_KEY);
    localStorage.setItem(key, JSON.stringify(items));
    console.log('Cart items saved to localStorage for user:', userId);
  } catch (error) {
    console.error('Error saving cart items to localStorage:', error);
  }
};

/**
 * Load cart items from localStorage for a specific user
 */
export const loadCartItems = (userId: string): CartItem[] => {
  try {
    const key = getUserStorageKey(userId, CART_ITEMS_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      const items = JSON.parse(stored) as CartItem[];
      console.log('Cart items loaded from localStorage for user:', userId, items);
      return items;
    }
  } catch (error) {
    console.error('Error loading cart items from localStorage:', error);
  }
  return [];
};

/**
 * Save applied coupon to localStorage for a specific user
 */
export const saveAppliedCoupon = (userId: string, coupon: Coupon | null): void => {
  try {
    const key = getUserStorageKey(userId, CART_COUPON_KEY);
    if (coupon) {
      localStorage.setItem(key, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(key);
    }
    console.log('Applied coupon saved to localStorage for user:', userId);
  } catch (error) {
    console.error('Error saving applied coupon to localStorage:', error);
  }
};

/**
 * Load applied coupon from localStorage for a specific user
 */
export const loadAppliedCoupon = (userId: string): Coupon | null => {
  try {
    const key = getUserStorageKey(userId, CART_COUPON_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      const coupon = JSON.parse(stored) as Coupon;
      console.log('Applied coupon loaded from localStorage for user:', userId);
      return coupon;
    }
  } catch (error) {
    console.error('Error loading applied coupon from localStorage:', error);
  }
  return null;
};

/**
 * Save coupon discount to localStorage for a specific user
 */
export const saveCouponDiscount = (userId: string, discount: number): void => {
  try {
    const key = getUserStorageKey(userId, CART_COUPON_DISCOUNT_KEY);
    localStorage.setItem(key, discount.toString());
    console.log('Coupon discount saved to localStorage for user:', userId);
  } catch (error) {
    console.error('Error saving coupon discount to localStorage:', error);
  }
};

/**
 * Load coupon discount from localStorage for a specific user
 */
export const loadCouponDiscount = (userId: string): number => {
  try {
    const key = getUserStorageKey(userId, CART_COUPON_DISCOUNT_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      const discount = parseFloat(stored);
      console.log('Coupon discount loaded from localStorage for user:', userId);
      return discount;
    }
  } catch (error) {
    console.error('Error loading coupon discount from localStorage:', error);
  }
  return 0;
};

/**
 * Save delivery fee to localStorage for a specific user
 */
export const saveDeliveryFee = (userId: string, fee: number): void => {
  try {
    const key = getUserStorageKey(userId, CART_DELIVERY_FEE_KEY);
    localStorage.setItem(key, fee.toString());
    console.log('Delivery fee saved to localStorage for user:', userId);
  } catch (error) {
    console.error('Error saving delivery fee to localStorage:', error);
  }
};

/**
 * Load delivery fee from localStorage for a specific user
 */
export const loadDeliveryFee = (userId: string): number => {
  try {
    const key = getUserStorageKey(userId, CART_DELIVERY_FEE_KEY);
    const stored = localStorage.getItem(key);
    if (stored) {
      const fee = parseFloat(stored);
      console.log('Delivery fee loaded from localStorage for user:', userId);
      return fee;
    }
  } catch (error) {
    console.error('Error loading delivery fee from localStorage:', error);
  }
  return 0;
};

/**
 * Load all cart data from localStorage for a specific user
 */
export const loadCartData = (userId: string): CartStorageData => {
  return {
    items: loadCartItems(userId),
    appliedCoupon: loadAppliedCoupon(userId),
    couponDiscount: loadCouponDiscount(userId),
    deliveryFee: loadDeliveryFee(userId)
  };
};

/**
 * Save all cart data to localStorage for a specific user
 */
export const saveCartData = (userId: string, data: CartStorageData): void => {
  saveCartItems(userId, data.items);
  saveAppliedCoupon(userId, data.appliedCoupon);
  saveCouponDiscount(userId, data.couponDiscount);
  saveDeliveryFee(userId, data.deliveryFee);
};

/**
 * Clear all cart data from localStorage for a specific user
 */
export const clearCartData = (userId: string): void => {
  try {
    const keys = [
      getUserStorageKey(userId, CART_ITEMS_KEY),
      getUserStorageKey(userId, CART_COUPON_KEY),
      getUserStorageKey(userId, CART_COUPON_DISCOUNT_KEY),
      getUserStorageKey(userId, CART_DELIVERY_FEE_KEY)
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log('Cart data cleared from localStorage for user:', userId);
  } catch (error) {
    console.error('Error clearing cart data from localStorage:', error);
  }
};

/**
 * Merge anonymous cart with authenticated user cart
 */
export const mergeAnonymousCartWithUserCart = (authenticatedUserId: string): CartStorageData => {
  const anonymousUserId = getAnonymousUserId();

  console.log('=== CART MERGE: Starting merge operation ===');
  console.log('Anonymous user ID:', anonymousUserId);
  console.log('Authenticated user ID:', authenticatedUserId);

  const anonymousCart = loadCartData(anonymousUserId);
  const userCart = loadCartData(authenticatedUserId);

  console.log('Anonymous cart items:', anonymousCart.items.length);
  console.log('User cart items:', userCart.items.length);

  // Merge cart items (avoid duplicates by checking product ID and selected size)
  const mergedItems: CartItem[] = [...userCart.items];

  anonymousCart.items.forEach(anonymousItem => {
    console.log('Processing anonymous item:', anonymousItem.name, 'ID:', anonymousItem.id);

    const existingItemIndex = mergedItems.findIndex(item =>
      item.id === anonymousItem.id &&
      ((!item.selectedSize && !anonymousItem.selectedSize) ||
       (item.selectedSize?.id === anonymousItem.selectedSize?.id))
    );

    if (existingItemIndex >= 0) {
      // Item exists, add quantities
      console.log('Item exists in user cart, merging quantities:', mergedItems[existingItemIndex].quantity, '+', anonymousItem.quantity);
      mergedItems[existingItemIndex].quantity += anonymousItem.quantity;
    } else {
      // New item, add to cart
      console.log('New item, adding to cart:', anonymousItem.name);
      mergedItems.push(anonymousItem);
    }
  });

  // Use authenticated user's coupon if they have one, otherwise use anonymous coupon
  const mergedCoupon = userCart.appliedCoupon || anonymousCart.appliedCoupon;
  const mergedCouponDiscount = userCart.appliedCoupon ? userCart.couponDiscount : anonymousCart.couponDiscount;

  // Use higher delivery fee (more conservative approach)
  const mergedDeliveryFee = Math.max(userCart.deliveryFee, anonymousCart.deliveryFee);

  const mergedCart: CartStorageData = {
    items: mergedItems,
    appliedCoupon: mergedCoupon,
    couponDiscount: mergedCouponDiscount,
    deliveryFee: mergedDeliveryFee
  };

  console.log('=== CART MERGE: Final merged cart ===');
  console.log('Total items:', mergedCart.items.length);
  console.log('Items:', mergedCart.items.map(item => ({ name: item.name, quantity: item.quantity })));

  // Save merged cart to authenticated user's storage
  saveCartData(authenticatedUserId, mergedCart);

  // Clear anonymous cart data
  clearCartData(anonymousUserId);
  clearAnonymousUserId();

  console.log('=== CART MERGE: Merge operation completed ===');
  return mergedCart;
};

/**
 * Get effective user ID (authenticated user ID or anonymous user ID)
 */
export const getEffectiveUserId = (authenticatedUserId?: string | null): string => {
  return authenticatedUserId || getAnonymousUserId();
};

/**
 * Clear all cart data for all users (useful for debugging or complete reset)
 */
export const clearAllCartData = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(CART_STORAGE_PREFIX) || key === 'vrisham_anonymous_user_id')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('All cart data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing all cart data from localStorage:', error);
  }
};
