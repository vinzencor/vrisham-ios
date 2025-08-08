import { where, orderBy, limit, Timestamp, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import { queryDocuments, getAllDocuments, getDocument, addDocument, updateDocument } from './firestore';
import { db } from './config';
import { Order, OrderedItem } from './schema';
import { CartItem } from '../contexts/CartContext';
import { sendOrderConfirmationWithRetry } from '../services/whatsapp';
import { getDeliveryInfoForItem } from './products';

/**
 * Calculate the maximum delivery date from cart items
 */
const calculateConsolidatedDeliveryDate = (items: CartItem[]): Date => {
  if (items.length === 0) {
    return getDeliveryInfoForItem('in-stock').date;
  }

  // Get delivery info for all items and find the one with maximum days
  const deliveryInfos = items.map(item => getDeliveryInfoForItem(item.type));

  // Find the delivery info with the maximum days from now
  const maxDeliveryInfo = deliveryInfos.reduce((max, current) => {
    return current.daysFromNow > max.daysFromNow ? current : max;
  });

  return maxDeliveryInfo.date;
};

/**
 * Fetch all orders from Firestore
 */
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    return await getAllDocuments<Order>('Orders');
  } catch (error) {
    console.error('Error fetching all orders:', error);
    throw error;
  }
};

/**
 * Fetch orders by customer ID
 */
export const getOrdersByCustomer = async (customerID: string): Promise<Order[]> => {
  try {
    // First try the compound query (requires index)
    return await queryDocuments<Order>(
      'Orders',
      where('customerID', '==', customerID),
      orderBy('orderedTime', 'desc')
    );
  } catch (error) {
    console.warn(`Compound query failed for customer ${customerID}, falling back to simple query:`, error);

    // Fallback: Simple query without ordering (no index required)
    try {
      const orders = await queryDocuments<Order>(
        'Orders',
        where('customerID', '==', customerID)
      );

      // Sort manually in JavaScript
      return orders.sort((a, b) => {
        const timeA = a.orderedTime?.toDate?.()?.getTime() || 0;
        const timeB = b.orderedTime?.toDate?.()?.getTime() || 0;
        return timeB - timeA; // Descending order (newest first)
      });
    } catch (fallbackError) {
      console.error(`Error fetching orders for customer ${customerID}:`, fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Fetch orders by phone number
 */
export const getOrdersByPhoneNumber = async (phoneNumber: string): Promise<Order[]> => {
  try {
    // First try the compound query (requires index)
    return await queryDocuments<Order>(
      'Orders',
      where('phoneNumber', '==', phoneNumber),
      orderBy('orderedTime', 'desc')
    );
  } catch (error) {
    console.warn(`Compound query failed for phone ${phoneNumber}, falling back to simple query:`, error);

    // Fallback: Simple query without ordering (no index required)
    try {
      const orders = await queryDocuments<Order>(
        'Orders',
        where('phoneNumber', '==', phoneNumber)
      );

      // Sort manually in JavaScript
      return orders.sort((a, b) => {
        const timeA = a.orderedTime?.toDate?.()?.getTime() || 0;
        const timeB = b.orderedTime?.toDate?.()?.getTime() || 0;
        return timeB - timeA; // Descending order (newest first)
      });
    } catch (fallbackError) {
      console.error(`Error fetching orders for phone ${phoneNumber}:`, fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Fetch a specific order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    return await getDocument<Order>('Orders', orderId);
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Fetch recent orders (limited number)
 */
export const getRecentOrders = async (limitCount: number = 10): Promise<Order[]> => {
  try {
    return await queryDocuments<Order>(
      'Orders',
      orderBy('orderedTime', 'desc'),
      limit(limitCount)
    );
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    throw error;
  }
};

/**
 * Fetch orders by status
 */
export const getOrdersByStatus = async (status: string): Promise<Order[]> => {
  try {
    // First try the compound query (requires index)
    return await queryDocuments<Order>(
      'Orders',
      where('status', '==', status),
      orderBy('orderedTime', 'desc')
    );
  } catch (error) {
    console.warn(`Compound query failed for status ${status}, falling back to simple query:`, error);

    // Fallback: Simple query without ordering (no index required)
    try {
      const orders = await queryDocuments<Order>(
        'Orders',
        where('status', '==', status)
      );

      // Sort manually in JavaScript
      return orders.sort((a, b) => {
        const timeA = a.orderedTime?.toDate?.()?.getTime() || 0;
        const timeB = b.orderedTime?.toDate?.()?.getTime() || 0;
        return timeB - timeA; // Descending order (newest first)
      });
    } catch (fallbackError) {
      console.error(`Error fetching orders with status ${status}:`, fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Create a new order in the database
 */
export const createOrder = async (orderData: {
  customerID: string;
  customerName: string;
  phoneNumber?: string | null;
  address: {
    id: string;
    name: string;
    address: string;
    phone: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'cod' | 'online';
  couponCode?: string | null;
  couponDiscount?: number | null;
  // Razorpay payment fields
  paymentId?: string;
  razorpayOrderId?: string;
  paymentSignature?: string;
}): Promise<string> => {
  try {
    console.log('Creating order with data:', orderData);

    // Generate unique order ID (timestamp-based)
    const orderID = Date.now();

    // Create a timestamp for all items (cannot use serverTimestamp inside arrays)
    const currentTime = Timestamp.now();

    // Map cart items to OrderedItem format according to schema
    const orderedItems: OrderedItem[] = orderData.items.map((item, index) => ({
      addedTime: currentTime, // Use regular timestamp instead of serverTimestamp
      barcode: item.barcode || '', // Use item barcode if available
      branchCode: 'MAIN', // Default branch code
      categoryID: item.categoryID || '', // Use item categoryID if available
      variantID: item.selectedSize?.id || null,
      variationValues: item.selectedSize ? { Size: item.selectedSize.label } : null,
      description: item.description || '', // Use item description if available
      id: item.id,
      image: item.image,
      incrementalQuantity: 1,
      index: index,
      keyword: item.keyword || [],
      maxQuantity: item.maxQuantity || 100,
      minQuantity: item.minQuantity || 1,
      mrp: item.mrp || (item.price * 1.2), // Use item MRP or calculate
      name: item.name,
      nutrition: item.nutrition || '',
      price: item.price,
      quantity: item.quantity,
      sourcingStory: item.sourcingStory || '',
      status: 'active',
      unit: item.unit
    }));

    // Calculate consolidated delivery date (maximum delivery time among all items)
    const consolidatedDeliveryDate = calculateConsolidatedDeliveryDate(orderData.items);
    const deliveryTimestamp = Timestamp.fromDate(consolidatedDeliveryDate);

    // Create order object according to schema
    const order: Partial<Order> = {
      addressID: orderData.address.id,
      addressLandmark: '', // Not provided in current address structure
      addressLines: orderData.address.address,
      addressName: orderData.address.name,
      addressPhoneNumber: orderData.address.phone,
      addressPincode: orderData.address.pincode,
      assignedAgentID: '', // Will be assigned later by admin
      assignedAgentName: '', // Will be assigned later by admin
      // assignedTime is optional, so we omit it until agent is assigned
      branchCode: 'MAIN', // Default branch code
      // completedTime is optional, so we omit it
      confirmedTime: serverTimestamp() as Timestamp,
      customerID: orderData.customerID,
      customerName: orderData.customerName,
      deliveryCharge: orderData.deliveryFee,
      deliveryDate: deliveryTimestamp, // Add calculated delivery date
      grandTotal: orderData.grandTotal,
      modeOfPayment: orderData.paymentMethod,
      orderID: orderID,
      orderedItem: orderedItems,
      orderedTime: serverTimestamp() as Timestamp,
      paymentStatus: orderData.paymentMethod === 'cod' ? 'unpaid' : 'pending',
      phoneNumber: orderData.phoneNumber || orderData.address.phone || '',
      // pickedTime is optional, so we omit it
      status: orderData.paymentMethod === 'cod' ? 'placed' : 'payment_pending',
      subTotal: orderData.subtotal,
      couponCode: orderData.couponCode || null,
      couponDiscount: orderData.couponDiscount || null,
      // Add Razorpay payment fields
      paymentId: orderData.paymentId || null,
      razorpayOrderId: orderData.razorpayOrderId || null,
      paymentSignature: orderData.paymentSignature || null,
    };

    console.log('Order object to be saved:', order);

    // Save order to Firestore
    const orderId = await addDocument('Orders', order);

    console.log('Order created successfully with ID:', orderId);

    // Send WhatsApp confirmation message for COD orders
    if (orderData.paymentMethod === 'cod') {
      try {
        const orderWithId = { ...order, id: orderId };
        const whatsappResult = await sendOrderConfirmationWithRetry(orderWithId);

        // Update order with WhatsApp message status
        const whatsappUpdate: Partial<Order> = {
          whatsappMessageSent: whatsappResult.success,
          whatsappMessageId: whatsappResult.messageId || null,
          whatsappMessageError: whatsappResult.success ? null : whatsappResult.error,
          whatsappMessageSentAt: whatsappResult.success ? serverTimestamp() as Timestamp : null
        };

        await updateDocument('Orders', orderId, whatsappUpdate);
        console.log('WhatsApp message status updated for order:', orderId);
      } catch (whatsappError) {
        console.error('Error sending WhatsApp message for order:', orderId, whatsappError);
        // Don't throw error - order creation should succeed even if WhatsApp fails
        try {
          await updateDocument('Orders', orderId, {
            whatsappMessageSent: false,
            whatsappMessageError: whatsappError instanceof Error ? whatsappError.message : 'Unknown WhatsApp error'
          });
        } catch (updateError) {
          console.error('Error updating WhatsApp error status:', updateError);
        }
      }
    }

    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Create a new order for online payment (without payment details)
 */
export const createOrderForPayment = async (orderData: {
  customerID: string;
  customerName: string;
  phoneNumber?: string | null;
  address: {
    id: string;
    name: string;
    address: string;
    phone: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  couponCode?: string | null;
  couponDiscount?: number | null;
}): Promise<{ orderId: string; orderNumber: number }> => {
  try {
    console.log('Creating order for payment with data:', orderData);

    // Generate unique order ID (timestamp-based)
    const orderNumber = Date.now();

    // Create a timestamp for all items (cannot use serverTimestamp inside arrays)
    const currentTime = Timestamp.now();

    // Map cart items to OrderedItem format according to schema
    const orderedItems: OrderedItem[] = orderData.items.map((item, index) => ({
      addedTime: currentTime, // Use regular timestamp instead of serverTimestamp
      barcode: item.barcode || '', // Use item barcode if available
      branchCode: 'MAIN', // Default branch code
      categoryID: item.categoryID || '', // Use item categoryID if available
      variantID: item.selectedSize?.id || null,
      variationValues: item.selectedSize ? { Size: item.selectedSize.label } : null,
      description: item.description || '', // Use item description if available
      id: item.id,
      image: item.image,
      incrementalQuantity: 1,
      index: index,
      keyword: item.keyword || [],
      maxQuantity: item.maxQuantity || 100,
      minQuantity: item.minQuantity || 1,
      mrp: item.mrp || (item.price * 1.2), // Use item MRP or calculate
      name: item.name,
      nutrition: item.nutrition || '',
      price: item.price,
      quantity: item.quantity,
      sourcingStory: item.sourcingStory || '',
      status: 'active',
      unit: item.unit
    }));

    // Calculate consolidated delivery date (maximum delivery time among all items)
    const consolidatedDeliveryDate = calculateConsolidatedDeliveryDate(orderData.items);
    const deliveryTimestamp = Timestamp.fromDate(consolidatedDeliveryDate);

    // Create order object according to schema
    const order: Partial<Order> = {
      addressID: orderData.address.id,
      addressLandmark: '', // Not provided in current address structure
      addressLines: orderData.address.address,
      addressName: orderData.address.name,
      addressPhoneNumber: orderData.address.phone,
      addressPincode: orderData.address.pincode,
      assignedAgentID: '', // Will be assigned later by admin
      assignedAgentName: '', // Will be assigned later by admin
      // assignedTime is optional, so we omit it until agent is assigned
      branchCode: 'MAIN', // Default branch code
      // completedTime is optional, so we omit it
      confirmedTime: serverTimestamp() as Timestamp,
      customerID: orderData.customerID,
      customerName: orderData.customerName,
      deliveryCharge: orderData.deliveryFee,
      deliveryDate: deliveryTimestamp, // Add calculated delivery date
      grandTotal: orderData.grandTotal,
      modeOfPayment: 'online',
      orderID: orderNumber,
      orderedItem: orderedItems,
      orderedTime: serverTimestamp() as Timestamp,
      paymentStatus: 'pending',
      phoneNumber: orderData.phoneNumber || orderData.address.phone || '',
      // pickedTime is optional, so we omit it
      status: 'payment_pending',
      subTotal: orderData.subtotal,
      couponCode: orderData.couponCode || null,
      couponDiscount: orderData.couponDiscount || null,
      // Payment fields will be updated after successful payment
      paymentId: null,
      razorpayOrderId: null,
      paymentSignature: null,
    };

    console.log('Order object to be saved:', order);

    // Save order to Firestore
    const orderId = await addDocument('Orders', order);

    console.log('Order created successfully with ID:', orderId, 'Order Number:', orderNumber);
    return { orderId, orderNumber };
  } catch (error) {
    console.error('Error creating order for payment:', error);
    throw error;
  }
};

/**
 * Update order payment status
 */
export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: 'paid' | 'failed',
  paymentDetails?: {
    paymentId?: string;
    razorpayOrderId?: string;
    paymentSignature?: string;
  }
): Promise<void> => {
  try {
    const updateData: Partial<Order> = {
      paymentStatus,
      status: paymentStatus === 'paid' ? 'placed' : 'payment_failed',
    };

    // Add payment details if provided
    if (paymentDetails) {
      if (paymentDetails.paymentId) updateData.paymentId = paymentDetails.paymentId;
      if (paymentDetails.razorpayOrderId) updateData.razorpayOrderId = paymentDetails.razorpayOrderId;
      if (paymentDetails.paymentSignature) updateData.paymentSignature = paymentDetails.paymentSignature;
    }

    await updateDocument('Orders', orderId, updateData);
    console.log(`Order ${orderId} payment status updated to ${paymentStatus}`);

    // Send WhatsApp confirmation message for successful online payments
    if (paymentStatus === 'paid') {
      try {
        // Get the updated order data to send WhatsApp message
        const updatedOrder = await getDocument<Order>('Orders', orderId);
        if (updatedOrder) {
          const whatsappResult = await sendOrderConfirmationWithRetry(updatedOrder);

          // Update order with WhatsApp message status
          const whatsappUpdate: Partial<Order> = {
            whatsappMessageSent: whatsappResult.success,
            whatsappMessageId: whatsappResult.messageId || null,
            whatsappMessageError: whatsappResult.success ? null : whatsappResult.error,
            whatsappMessageSentAt: whatsappResult.success ? serverTimestamp() as Timestamp : null
          };

          await updateDocument('Orders', orderId, whatsappUpdate);
          console.log('WhatsApp message status updated for paid order:', orderId);
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp message for paid order:', orderId, whatsappError);
        // Don't throw error - payment update should succeed even if WhatsApp fails
        try {
          await updateDocument('Orders', orderId, {
            whatsappMessageSent: false,
            whatsappMessageError: whatsappError instanceof Error ? whatsappError.message : 'Unknown WhatsApp error'
          });
        } catch (updateError) {
          console.error('Error updating WhatsApp error status:', updateError);
        }
      }
    }
  } catch (error) {
    console.error(`Error updating order ${orderId} payment status:`, error);
    throw error;
  }
};

/**
 * Listen to order status changes
 */
export const listenToOrderStatus = (
  orderId: string,
  callback: (order: Order | null) => void
): (() => void) => {
  const orderRef = doc(db, 'Orders', orderId);

  const unsubscribe = onSnapshot(orderRef, (doc) => {
    if (doc.exists()) {
      const orderData = { id: doc.id, ...doc.data() } as Order;
      callback(orderData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to order status:', error);
    callback(null);
  });

  return unsubscribe;
};

/**
 * Map Firestore order to UI-friendly format
 */
export const mapOrderForUI = (order: Order): any => {
  // Ensure orderedItem exists and is an array
  const orderedItems = Array.isArray(order.orderedItem) ? order.orderedItem : [];

  // Helper function to safely convert Firestore timestamp to ISO string
  const safeTimestampToISO = (timestamp: any): string | null => {
    try {
      if (!timestamp) return null;
      if (typeof timestamp.toDate === 'function') {
        const date = timestamp.toDate();
        return date.toISOString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      return null;
    } catch (error) {
      console.warn('Error converting timestamp:', timestamp, error);
      return null;
    }
  };

  const mappedOrder = {
    id: order.orderID?.toString() || order.id || 'Unknown',
    firestoreId: order.id, // Keep the Firestore document ID
    date: safeTimestampToISO(order.orderedTime) || new Date().toISOString(),
    status: mapOrderStatus(order.status),
    items: orderedItems.map(item => ({
      id: item.id || '',
      name: item.name || 'Unknown Item',
      quantity: item.quantity || 0,
      unit: item.unit || '',
      price: item.price || 0,
      image: item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkgyOFYyNEgxMlYxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE0IDE4SDE4VjIySDE0VjE4WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K',
      variantID: item.variantID || null,
      variationValues: item.variationValues || null
    })),
    total: order.grandTotal || 0,
    subtotal: order.subTotal || 0,
    deliveryCharge: order.deliveryCharge || 0,
    deliveryDate: safeTimestampToISO(order.deliveryDate) || safeTimestampToISO(order.confirmedTime),
    customerName: order.customerName || '',
    phoneNumber: order.phoneNumber || '',
    address: {
      name: order.addressName || '',
      lines: order.addressLines || '',
      landmark: order.addressLandmark || '',
      pincode: order.addressPincode || '',
      phone: order.addressPhoneNumber || ''
    },
    paymentStatus: order.paymentStatus || 'unpaid',
    modeOfPayment: order.modeOfPayment || 'cod',
    assignedAgent: {
      id: order.assignedAgentID || '',
      name: order.assignedAgentName || ''
    }
  };

  return mappedOrder;
};

/**
 * Map Firestore order status to UI status
 */
const mapOrderStatus = (status: string): 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'payment_pending' | 'payment_failed' => {
  switch (status?.toLowerCase()) {
    case 'placed':
      return 'pending';
    case 'assigned':
    case 'confirmed':
      return 'confirmed';
    case 'shipped':
    case 'picked':
      return 'shipped';
    case 'delivered':
    case 'completed':
      return 'delivered';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'payment_pending':
      return 'payment_pending';
    case 'payment_failed':
      return 'payment_failed';
    default:
      return 'pending';
  }
};
