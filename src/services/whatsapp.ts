// WhatsApp service for sending template messages via Interakt API
import { Order, OrderedItem } from '../firebase/schema';

// WhatsApp API Configuration
const WHATSAPP_API_CONFIG = {
  apiKey: 'V2VrZ3BrVGc4S2Q0ekRoeWpyeU1QS1R2MXU2Nl9GZEliQXdTWFdBWnNvRTo=',
  endpoint: 'https://api.interakt.ai/v1/public/message/',
  template: {
    name: 'order_confirmation',
    languageCode: 'en'
  }
};

// TypeScript interfaces
export interface WhatsAppTemplateRequest {
  countryCode: string;
  phoneNumber: string;
  type: string;
  callbackData?: string;
  template: {
    name: string;
    languageCode: string;
    headerValues?: string[];
    bodyValues?: string[];
    buttonValues?: Record<string, string[]>;
  };
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface OrderMessageData {
  customerName: string;
  orderId: string;
  orderNumber: number;
  itemsList: string;
  paymentMethod: string;
  totalAmount: number;
  phoneNumber: string;
}

/**
 * Format phone number for WhatsApp API (remove country code prefix)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Remove country code if present (91 for India)
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return cleanPhone.substring(2);
  }

  // If already 10 digits, return as is
  if (cleanPhone.length === 10) {
    return cleanPhone;
  }

  // Handle cases where phone might have +91 prefix
  if (cleanPhone.length === 13 && cleanPhone.startsWith('91')) {
    return cleanPhone.substring(2);
  }

  // If phone number is not in expected format, throw error
  throw new Error(`Invalid phone number format: ${phone}. Expected 10 digits or 91xxxxxxxxxx format.`);
};

/**
 * Format order items list for WhatsApp message
 */
export const formatOrderItems = (items: OrderedItem[]): string => {
  return items
    .map(item => `${item.name} x ${item.quantity}`)
    .join(', ');
};

/**
 * Map payment method to user-friendly text
 */
export const formatPaymentMethod = (paymentMethod: string): string => {
  switch (paymentMethod.toLowerCase()) {
    case 'cod':
      return 'Cash on Delivery';
    case 'online':
      return 'Online Payment';
    default:
      return paymentMethod;
  }
};

/**
 * Extract message data from order
 */
export const extractOrderMessageData = (order: Partial<Order>): OrderMessageData => {
  if (!order.customerName || !order.orderID || !order.phoneNumber) {
    throw new Error('Missing required order data for WhatsApp message');
  }

  return {
    customerName: order.customerName,
    orderId: order.id || 'N/A',
    orderNumber: order.orderID,
    itemsList: formatOrderItems(order.orderedItem || []),
    paymentMethod: formatPaymentMethod(order.modeOfPayment || ''),
    totalAmount: order.grandTotal || 0,
    phoneNumber: formatPhoneNumber(order.phoneNumber)
  };
};

/**
 * Send WhatsApp template message via Interakt API
 */
export const sendOrderConfirmationMessage = async (
  messageData: OrderMessageData
): Promise<WhatsAppResponse> => {
  try {
    console.log('Sending WhatsApp message for order:', messageData.orderNumber);

    const requestBody: WhatsAppTemplateRequest = {
      countryCode: '+91',
      phoneNumber: messageData.phoneNumber,
      type: 'Template',
      callbackData: `order_${messageData.orderNumber}`,
      template: {
        name: WHATSAPP_API_CONFIG.template.name,
        languageCode: WHATSAPP_API_CONFIG.template.languageCode,
        bodyValues: [
          messageData.customerName,
          messageData.orderNumber.toString(),
          messageData.itemsList,
          messageData.paymentMethod,
          messageData.totalAmount.toString()
        ]
      }
    };

    console.log('WhatsApp API request:', requestBody);

    const response = await fetch(WHATSAPP_API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${WHATSAPP_API_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });
      return {
        success: false,
        error: responseData.message || `API Error: ${response.status} ${response.statusText}`,
        details: responseData
      };
    }

    console.log('WhatsApp message sent successfully:', responseData);
    return {
      success: true,
      messageId: responseData.id || responseData.messageId,
      details: responseData
    };

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Send WhatsApp message for order with retry logic
 */
export const sendOrderConfirmationWithRetry = async (
  order: Partial<Order>,
  maxRetries: number = 3
): Promise<WhatsAppResponse> => {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const messageData = extractOrderMessageData(order);
      const result = await sendOrderConfirmationMessage(messageData);

      if (result.success) {
        console.log(`WhatsApp message sent successfully on attempt ${attempt}`);
        return result;
      }

      lastError = result.error || 'Unknown error';
      console.warn(`WhatsApp message attempt ${attempt} failed:`, lastError);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`WhatsApp message attempt ${attempt} error:`, error);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
  };
};

/**
 * Send WhatsApp message for an existing order by ID
 */
export const sendWhatsAppMessageForOrder = async (orderId: string): Promise<WhatsAppResponse> => {
  try {
    // Import here to avoid circular dependency
    const { getDocument, updateDocument } = await import('../firebase/firestore');
    const { serverTimestamp, Timestamp } = await import('firebase/firestore');

    // Get order data
    const order = await getDocument<Order>('Orders', orderId);
    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }

    // Send WhatsApp message
    const result = await sendOrderConfirmationWithRetry(order);

    // Update order with WhatsApp message status
    const whatsappUpdate: Partial<Order> = {
      whatsappMessageSent: result.success,
      whatsappMessageId: result.messageId || null,
      whatsappMessageError: result.success ? null : result.error,
      whatsappMessageSentAt: result.success ? serverTimestamp() as Timestamp : null
    };

    await updateDocument('Orders', orderId, whatsappUpdate);

    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message for order:', orderId, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
