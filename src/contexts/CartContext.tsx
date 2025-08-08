import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Coupon } from '../firebase/schema';
import { useAuth } from './AuthContext';
import {
  loadCartData,
  saveCartItems,
  saveAppliedCoupon,
  saveCouponDiscount,
  saveDeliveryFee,
  clearCartData,
  getEffectiveUserId,
  mergeAnonymousCartWithUserCart
} from '../utils/cartStorage';
import { safeMultiply, ensureSafeNumber, roundToDecimals } from '../utils/numberUtils';

export interface CartItem {
  id: string;
  name: string;
  nameTamil: string;
  image: string;
  price: number;
  quantity: number;
  unit: string;
  status: 'pending' | 'confirmed';
  selectedSize?: {
    id: string;
    label: string;
    weightRange: string;
    price?: number;
  };
  type?: 'pre-order' | 'in-stock';
  // Quantity control fields
  incrementalQuantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, change: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  // Coupon functionality
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  applyCoupon: (coupon: Coupon, discountAmount: number) => void;
  removeCoupon: () => void;
  // Delivery functionality
  setDeliveryFee: (fee: number) => void;
  // Loading state
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true);
  const [previousAuthState, setPreviousAuthState] = useState<{
    isAuthenticated: boolean;
    userId: string | null;
  }>({ isAuthenticated: false, userId: null });

  // Load cart data when component mounts or when authentication changes
  useEffect(() => {
    const loadCart = async () => {
      setIsCartLoading(true);

      const currentAuthState = {
        isAuthenticated,
        userId: currentUser?.uid || null
      };

      const effectiveUserId = getEffectiveUserId(currentUser?.uid);
      console.log('=== CART CONTEXT: Loading cart data for effective user:', effectiveUserId, 'isAuthenticated:', isAuthenticated);

      let cartData;

      // Check if user just logged in (transition from anonymous to authenticated)
      const userJustLoggedIn = !previousAuthState.isAuthenticated &&
                               isAuthenticated &&
                               currentUser?.uid &&
                               previousAuthState.userId !== currentUser.uid;

      if (userJustLoggedIn) {
        // User just logged in - merge anonymous cart with user cart
        console.log('=== CART CONTEXT: User just logged in, merging carts');
        console.log('=== CART CONTEXT: Previous state:', previousAuthState);
        console.log('=== CART CONTEXT: Current state:', currentAuthState);

        // Add a small delay to ensure localStorage operations are complete
        await new Promise(resolve => setTimeout(resolve, 50));

        cartData = mergeAnonymousCartWithUserCart(currentUser.uid);
        console.log('=== CART CONTEXT: Cart merge completed, items count:', cartData.items.length);
      } else {
        // Normal cart loading (anonymous or authenticated user)
        console.log('=== CART CONTEXT: Normal cart loading for user:', effectiveUserId);
        cartData = loadCartData(effectiveUserId);
        console.log('=== CART CONTEXT: Cart loaded, items count:', cartData.items.length);
      }

      // Update cart state
      setItems(cartData.items);
      setAppliedCoupon(cartData.appliedCoupon);
      setCouponDiscount(cartData.couponDiscount);
      setDeliveryFee(cartData.deliveryFee);
      setIsLoaded(true);
      setIsCartLoading(false);

      // Update previous auth state for next comparison
      setPreviousAuthState(currentAuthState);

      console.log('=== CART CONTEXT: Cart state updated with:', {
        itemsCount: cartData.items.length,
        appliedCoupon: cartData.appliedCoupon?.code || 'none',
        couponDiscount: cartData.couponDiscount,
        deliveryFee: cartData.deliveryFee,
        userJustLoggedIn
      });
    };

    loadCart();
  }, [currentUser?.uid, isAuthenticated]);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      const effectiveUserId = getEffectiveUserId(currentUser?.uid);
      saveCartItems(effectiveUserId, items);
    }
  }, [items, isLoaded, currentUser?.uid]);

  // Save applied coupon to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const effectiveUserId = getEffectiveUserId(currentUser?.uid);
      saveAppliedCoupon(effectiveUserId, appliedCoupon);
    }
  }, [appliedCoupon, isLoaded, currentUser?.uid]);

  // Save coupon discount to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const effectiveUserId = getEffectiveUserId(currentUser?.uid);
      saveCouponDiscount(effectiveUserId, couponDiscount);
    }
  }, [couponDiscount, isLoaded, currentUser?.uid]);

  // Save delivery fee to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      const effectiveUserId = getEffectiveUserId(currentUser?.uid);
      saveDeliveryFee(effectiveUserId, deliveryFee);
    }
  }, [deliveryFee, isLoaded, currentUser?.uid]);

  const addToCart = (item: CartItem) => {
    setItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(i =>
        i.id === item.id &&
        ((!i.selectedSize && !item.selectedSize) ||
         (i.selectedSize?.id === item.selectedSize?.id))
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item exists, respecting max quantity
        const existingItem = prevItems[existingItemIndex];
        const safeExistingQuantity = ensureSafeNumber(existingItem.quantity);
        const safeNewItemQuantity = ensureSafeNumber(item.quantity);
        const newQuantity = roundToDecimals(safeExistingQuantity + safeNewItemQuantity, 2);
        const maxAllowed = ensureSafeNumber(item.maxQuantity, 100);

        if (newQuantity <= maxAllowed) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity = newQuantity;
          return updatedItems;
        } else {
          // Don't add if it would exceed max quantity
          console.warn(`Cannot add ${safeNewItemQuantity} more. Maximum quantity is ${maxAllowed}`);
          return prevItems;
        }
      } else {
        // Add new item, ensuring it meets minimum quantity
        const minAllowed = ensureSafeNumber(item.minQuantity, 1);
        const safeItemQuantity = ensureSafeNumber(item.quantity);
        const adjustedQuantity = Math.max(safeItemQuantity, minAllowed);
        return [...prevItems, { ...item, quantity: adjustedQuantity }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, change: number) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const safeChange = ensureSafeNumber(change);
          const newQuantity = roundToDecimals(item.quantity + safeChange, 2);
          const minAllowed = ensureSafeNumber(item.minQuantity, 1);
          const maxAllowed = ensureSafeNumber(item.maxQuantity, 100);

          // For decrements, check if we should remove the item or just decrease quantity
          if (safeChange < 0) {
            // If decrementing and the new quantity would be below minimum, remove the item
            if (newQuantity < minAllowed) {
              return { ...item, quantity: 0 };
            } else {
              // Otherwise, decrease by the incremental amount
              return { ...item, quantity: newQuantity };
            }
          } else {
            // For increments, validate against maximum
            if (newQuantity <= maxAllowed) {
              return { ...item, quantity: newQuantity };
            } else {
              // If above maximum, don't change quantity
              console.warn(`Cannot exceed maximum quantity of ${maxAllowed}`);
              return item;
            }
          }
        }
        return item;
      }).filter(item => item.quantity > 0) // Remove items with 0 quantity
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);

    // Also clear from localStorage
    const effectiveUserId = getEffectiveUserId(currentUser?.uid);
    clearCartData(effectiveUserId);
  };

  const isInCart = (id: string) => {
    return items.some(item => item.id === id);
  };

  const getItemQuantity = (id: string) => {
    const item = items.find(item => item.id === id);
    return item ? item.quantity : 0;
  };

  const applyCouponToCart = (coupon: Coupon, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discountAmount);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const updateDeliveryFee = (fee: number) => {
    setDeliveryFee(fee);
  };

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = ensureSafeNumber(item.price);
    const itemQuantity = ensureSafeNumber(item.quantity);
    const itemTotal = safeMultiply(itemPrice, itemQuantity);
    return roundToDecimals(sum + itemTotal, 2);
  }, 0);

  const safeDeliveryFee = ensureSafeNumber(deliveryFee);
  const safeCouponDiscount = ensureSafeNumber(couponDiscount);
  const total = roundToDecimals(subtotal + safeDeliveryFee - safeCouponDiscount, 2);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart,
      getItemQuantity,
      subtotal,
      deliveryFee,
      total,
      appliedCoupon,
      couponDiscount,
      applyCoupon: applyCouponToCart,
      removeCoupon,
      setDeliveryFee: updateDeliveryFee,
      isCartLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};
