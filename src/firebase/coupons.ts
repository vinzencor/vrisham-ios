import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';
import { getDocument, queryDocuments, addDocument } from './firestore';
import { Coupon, Redemption } from './schema';

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}

export interface ApplyCouponResult {
  success: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}

/**
 * Validate a coupon code and calculate discount
 */
export const validateCoupon = async (
  couponCode: string,
  userId: string,
  cartTotal: number
): Promise<CouponValidationResult> => {
  try {
    // Fetch coupon by code (using code as document ID)
    const coupon = await getDocument<Coupon>('Coupons', couponCode.toUpperCase());

    if (!coupon) {
      return {
        isValid: false,
        error: 'Invalid coupon code'
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        isValid: false,
        error: 'This coupon is no longer active'
      };
    }

    const now = Timestamp.now();

    // Check if coupon has started (if startAt is set)
    if (coupon.startAt && now.toMillis() < coupon.startAt.toMillis()) {
      return {
        isValid: false,
        error: 'This coupon is not yet active'
      };
    }

    // Check if coupon has expired
    if (coupon.expiresAt && now.toMillis() > coupon.expiresAt.toMillis()) {
      return {
        isValid: false,
        error: 'This coupon has expired'
      };
    }

    // Check global usage limit
    if (coupon.usageLimitGlobal && coupon.usedCount >= coupon.usageLimitGlobal) {
      return {
        isValid: false,
        error: 'This coupon has reached its usage limit'
      };
    }

    // Check per-user usage limit
    if (coupon.usageLimitPerUser) {
      const userRedemptions = await getUserCouponRedemptions(couponCode.toUpperCase(), userId);

      if (userRedemptions.length >= coupon.usageLimitPerUser) {
        return {
          isValid: false,
          error: 'You have already used this coupon the maximum number of times'
        };
      }
    }

    // Check minimum cart total
    if (coupon.minCartTotal && cartTotal < coupon.minCartTotal) {
      return {
        isValid: false,
        error: `Minimum order value of ₹${coupon.minCartTotal} required for this coupon`
      };
    }

    // Calculate discount amount
    let discountAmount = 0;

    if (coupon.type === 'FLAT') {
      discountAmount = coupon.flatAmount || 0;
    } else if (coupon.type === 'PERCENT') {
      const percentDiscount = (cartTotal * (coupon.percent || 0)) / 100;
      discountAmount = coupon.maxDiscount
        ? Math.min(percentDiscount, coupon.maxDiscount)
        : percentDiscount;
    }

    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);

    return {
      isValid: true,
      coupon,
      discountAmount
    };

  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      isValid: false,
      error: 'Failed to validate coupon. Please try again.'
    };
  }
};

/**
 * Apply a coupon and create redemption record
 * This should be called when the order is successfully placed
 */
export const applyCoupon = async (
  couponCode: string,
  userId: string,
  orderID: number,
  discountAmount: number,
  branchCode: string = 'MAIN'
): Promise<ApplyCouponResult> => {
  try {
    return await runTransaction(db, async (transaction) => {
      // Get coupon document reference
      const couponRef = doc(db, 'Coupons', couponCode.toUpperCase());
      const couponDoc = await transaction.get(couponRef);

      if (!couponDoc.exists()) {
        throw new Error('Coupon not found');
      }

      const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      // Double-check usage limits in transaction
      if (coupon.usageLimitGlobal && coupon.usedCount >= coupon.usageLimitGlobal) {
        throw new Error('Coupon usage limit exceeded');
      }

      // Increment usage count
      transaction.update(couponRef, {
        usedCount: coupon.usedCount + 1,
        updatedAt: serverTimestamp()
      });

      // Create redemption record in subcollection
      const redemptionRef = doc(collection(db, 'Coupons', couponCode.toUpperCase(), 'Redemptions'));
      transaction.set(redemptionRef, {
        uid: userId,
        orderID: orderID,
        discountAmount: discountAmount,
        redeemedAt: serverTimestamp(),
        branchCode: branchCode
      });

      return {
        success: true,
        coupon,
        discountAmount
      };
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply coupon'
    };
  }
};

/**
 * Get user's redemption history for a specific coupon
 */
export const getUserCouponRedemptions = async (
  couponCode: string,
  userId: string
): Promise<Redemption[]> => {
  try {
    const redemptionsRef = collection(db, 'Coupons', couponCode.toUpperCase(), 'Redemptions');
    const q = query(redemptionsRef, where('uid', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Redemption);

  } catch (error) {
    console.error('Error fetching user coupon redemptions:', error);
    return [];
  }
};

/**
 * Get all active coupons (for admin or promotional display)
 */
export const getActiveCoupons = async (): Promise<Coupon[]> => {
  try {
    const now = Timestamp.now();

    // Note: This is a simplified query. In production, you might want to use composite indexes
    // for more complex queries combining multiple conditions
    return await queryDocuments<Coupon>(
      'Coupons',
      where('isActive', '==', true)
    );

  } catch (error) {
    console.error('Error fetching active coupons:', error);
    return [];
  }
};
