import { Timestamp } from "firebase/firestore";

// Category collection
export interface Category {
  branchCode: string;
  id: string;
  image: string;
  index: number;
  isParentCategory: boolean; // = true when level == 0 (kept for backward compatibility)
  keyword: string[];
  name: string;
  parentCategoryID: string | null; // null for root
  level: number; // NEW. 0 = root, 1 = sub, etc.
}

// OnlinePayStatus collection
export interface OnlinePayStatus {
  amount: number;
  code: string;
  fullResponse: string;
  merchantId: string;
  message: string;
  payResponseCode: string;
  paymentInstrument: string;
  paymentState: string;
  phonepeTransactionId: string;
  success: boolean;
  transactionId: string;
}

// DeleteAccountRequest collection
export interface DeleteAccountRequest {
  requestTime: Timestamp;
  userID: string;
}

// OrderExportHistory collection
export interface OrderExportHistory {
  fromDate: string;
  toDate: string;
  queryTime: Timestamp;
  resultCount: number;
}

// OrderedItem sub-document
export interface OrderedItem {
  addedTime: Timestamp;
  barcode: string;
  branchCode: string;
  categoryID: string; // Primary category at purchase time
  variantID: string | null; // NEW. Variant doc-ID if item has variants
  variationValues: Record<string, string> | null; // NEW. e.g. { Size: "Medium" }
  description: string;
  id: string; // Product doc-ID
  image: string;
  incrementalQuantity: number;
  index: number;
  keyword: string[];
  maxQuantity: number;
  minQuantity: number;
  mrp: number;
  name: string;
  nutrition: string;
  price: number; // Unit price at purchase
  quantity: number;
  sourcingStory: string;
  status: string;
  unit: string;
}

// Orders collection
export interface Order {
  id: string; // Firestore document ID
  addressID: string | number;
  addressLandmark: string;
  addressLines: string;
  addressName: string;
  addressPhoneNumber: string;
  addressPincode: string;
  assignedAgentID: string;
  assignedAgentName: string;
  assignedTime?: Timestamp;
  branchCode: string;
  completedTime?: Timestamp;
  confirmedTime: Timestamp;
  customerID: string;
  customerName: string;
  deliveryCharge: number;
  deliveryDate?: Timestamp; // Expected delivery date
  grandTotal: number;
  modeOfPayment: 'cod' | 'online';
  orderID: number;
  orderedItem: OrderedItem[];
  orderedTime: Timestamp;
  paymentStatus: 'paid' | 'unpaid' | 'pending' | 'failed';
  phoneNumber: string;
  pickedTime?: Timestamp;
  status: 'placed' | 'assigned' | 'delivered' | 'payment_pending' | 'payment_failed' | string;
  // WhatsApp message tracking
  whatsappMessageSent?: boolean;
  whatsappMessageId?: string;
  whatsappMessageError?: string;
  whatsappMessageSentAt?: Timestamp;
  subTotal: number;
  couponCode?: string | null; // Copied from Coupons.code when coupon is applied
  couponDiscount?: number | null; // Rupees discounted from grandTotal when coupon is applied
  // Razorpay payment fields
  paymentId?: string | null;
  razorpayOrderId?: string | null;
  paymentSignature?: string | null;
}

// Pincodes collection
export interface Pincode {
  areaName: string;
  branchCode: string;
  branchName: string;
  deliveryCharge: number;
  pincode: string;
}

// Products collection
export interface Product {
  barcode: string;
  branchCode: string;
  categoryIDs: string[]; // NEW. All categories & sub-categories this product belongs to
  primaryCategoryID: string; // NEW (opt.) Main breadcrumb
  description: string;
  id: string;
  image: string;
  incrementalQuantity: number;
  index: number;
  keyword: string[];
  maxQuantity: number;
  minQuantity: number;
  mrp: number;
  name: string;
  nutrition: string;
  price: number; // Default (fallback) price
  sourcingStory: string;
  status: 'active' | 'inActive';
  unit: string;
  farmerId: string | null;
  hasVariants: boolean; // NEW. true if using /Variants sub-collection
  defaultVariantID: string | null; // NEW. Doc-ID of the variant to show first
  isPreOrder: boolean; // NEW. Toggle for pre-order state (default: false)
  preOrderStartAt: Timestamp | null; // NEW. Pre-order window start (null = open immediately)
  preOrderEndAt: Timestamp | null; // NEW. Pre-order window end
  harvestOffsetDays: number; // NEW. Harvest timing: -1 (yesterday), 0 (today), +1 (tomorrow)
}

// Product Variants sub-collection
export interface ProductVariant {
  sku: string; // Barcode / SKU
  variationValues: Record<string, string>; // Keys are VariationType names or IDs, e.g. { Size: "Small" }
  price: number;
  mrp: number;
  stock: number; // Current inventory
  image: string | null; // Override parent
  status: 'active' | 'inActive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Returns collection
export interface Return {
  branchCode: string;
  customerID: string;
  customerName: string;
  deliveryAgentID: string;
  deliveryAgentName: string;
  minimumQuantity: number;
  modeOfPayment: string;
  orderID: number;
  price: number;
  productID: string;
  variantID: string | null;
  variationValues: Record<string, string> | null;
  productImage: string;
  productName: string;
  quantity: number;
  returnInitiatedTime: Timestamp;
  returnStatus: 'pending' | 'approved' | 'rejected';
  unit: string;
}

// Support collection
export interface Support {
  branchCode: string;
  contactedOn: Timestamp;
  customerID: string;
  customerName: string;
  id: string;
  message: string;
  resolvedOn?: Timestamp;
  status: 'open' | 'resolved';
  ticketRaisedOn: Timestamp;
}

// Transactions collection
export interface Transaction {
  amount: number;
  currentBalance: number;
  remark: string;
  role: string;
  runningBalance: number;
  transactionTime: Timestamp;
  typeOfTransactions: 'inward' | 'outward';
  userID: string;
}

// Address sub-document
export interface Address {
  addressID: number;
  addressLines: string;
  addressName: string;
  branchCode: string;
  branchName: string;
  landmark: string;
  pincode: number;
  phoneNumber: string;
  // Google Maps location data (optional for backward compatibility)
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  placeId?: string;
}

// Users collection
export interface User {
  id?: string; // Firestore document ID
  createdTime: Timestamp;
  displayName: string;
  phone_number?: string; // Phone number stored with underscore
  phoneNumber?: string; // Alternative camelCase format
  isDeactivated: boolean;
  isNewCustomer: boolean;
  keywords: string[];
  listOfAddress: Address[];
  role: string;
  uid: string;
  // Additional fields that might exist in the database
  lastName?: string;
  display_name?: string;
  dob?: Timestamp;
  email?: string;
  updatedAt?: Timestamp;
}

// Conversations collection
export interface Conversation {
  chatFlow: string[] | Record<string, unknown>[];
  endTime: Timestamp;
  id: string;
  isExistingUser: boolean;
  phoneNumber: string;
  startTime: Timestamp;
  status: 'open' | 'closed';
  tempAddressId: number;
  userName: string;
}

// FF_Push_Notifications collection
export interface PushNotification {
  initialPageName: string;
  notificationSound: string;
  notificationText: string;
  notificationTitle: string;
  numSent: number;
  parameterData: string;
  status: string;
  targetAudience: string;
  timestamp: Timestamp;
}

// MessageUpdates collection
export interface MessageUpdate {
  customer: Record<string, unknown>;
  message: Record<string, unknown>;
  id: string;
  phoneNumber: string;
}

// TempOrderItem sub-document
export interface TempOrderItem {
  itemId: string;
  variantID: string | null;
  variationValues: Record<string, string> | null;
  price: number;
  quantity: number;
}

// TempOrders collection
export interface TempOrder {
  cartId: string;
  createdDate: Timestamp;
  orderItems: TempOrderItem[];
  phoneNumber: string;
  status: string;
}

// Farmers collection
export interface Farmer {
  id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmLocation: string;
  experience: string;
  philosophy: string;
  certifications: string[];
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Coupons collection
export interface Coupon {
  id: string; // Document ID (same as code)
  code: string; // Human-readable coupon text (also use as doc-ID). Example: NEWUSER50
  type: 'FLAT' | 'PERCENT';
  flatAmount?: number; // Amount off in rupees (₹) - required when type === "FLAT"
  percent?: number; // Discount percentage (e.g. 10 for 10%) - required when type === "PERCENT"
  maxDiscount?: number | null; // Cap for percentage coupons (₹). Ignored for flat.
  minCartTotal?: number | null; // Minimum order subtotal required to apply.
  startAt?: Timestamp | null; // Valid-from; null → immediately active.
  expiresAt: Timestamp | null; // Expiry date/time.
  usageLimitGlobal?: number; // How many times in total the coupon can be redeemed. null → unlimited.
  usageLimitPerUser?: number; // How many times a single UID can redeem (set 1 for "once per user"). null → unlimited per user.
  usedCount: number; // Auto-incremented counter (for quick catalog queries). Default 0.
  isActive: boolean; // Admin kill-switch. Default true.
  description?: string | null; // For admin dashboard display.
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Redemptions sub-collection
export interface Redemption {
  id: string; // Auto-generated ID
  uid: string; // Customer UID who redeemed.
  orderID: number; // Order that consumed the coupon.
  discountAmount: number; // Rupees knocked off that order.
  redeemedAt: Timestamp;
  branchCode?: string; // Optional auditing.
}

// VariationTypes collection - NEW
export interface VariationType {
  id: string; // Doc-ID
  name: string; // "Size", "Colour", ...
  options: string[]; // List in display order
  description: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
