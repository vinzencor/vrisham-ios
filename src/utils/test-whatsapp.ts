// Test utility for WhatsApp integration
import { 
  sendOrderConfirmationMessage, 
  formatPhoneNumber, 
  formatOrderItems, 
  formatPaymentMethod,
  OrderMessageData 
} from '../services/whatsapp';
import { OrderedItem } from '../firebase/schema';

/**
 * Test WhatsApp message formatting functions
 */
export const testWhatsAppFormatting = () => {
  console.log('=== Testing WhatsApp Formatting Functions ===');

  // Test phone number formatting
  console.log('\n--- Phone Number Formatting ---');
  const testPhones = ['9876543210', '919876543210', '+919876543210', '98765 43210'];
  testPhones.forEach(phone => {
    try {
      const formatted = formatPhoneNumber(phone);
      console.log(`${phone} -> ${formatted}`);
    } catch (error) {
      console.log(`${phone} -> ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Test payment method formatting
  console.log('\n--- Payment Method Formatting ---');
  const testPayments = ['cod', 'online', 'COD', 'ONLINE', 'cash'];
  testPayments.forEach(payment => {
    const formatted = formatPaymentMethod(payment);
    console.log(`${payment} -> ${formatted}`);
  });

  // Test order items formatting
  console.log('\n--- Order Items Formatting ---');
  const testItems: OrderedItem[] = [
    {
      id: '1',
      name: 'Organic Tomatoes',
      quantity: 2,
      unit: 'kg',
      price: 80,
      mrp: 100,
      image: '',
      description: '',
      addedTime: new Date() as any,
      barcode: '',
      branchCode: 'MAIN',
      categoryID: 'vegetables',
      variantID: null,
      variationValues: null,
      incrementalQuantity: 1,
      index: 0,
      keyword: [],
      maxQuantity: 10,
      minQuantity: 1,
      nutrition: '',
      sourcingStory: '',
      status: 'active'
    },
    {
      id: '2',
      name: 'Fresh Spinach',
      quantity: 1,
      unit: 'bunch',
      price: 25,
      mrp: 30,
      image: '',
      description: '',
      addedTime: new Date() as any,
      barcode: '',
      branchCode: 'MAIN',
      categoryID: 'vegetables',
      variantID: null,
      variationValues: null,
      incrementalQuantity: 1,
      index: 1,
      keyword: [],
      maxQuantity: 5,
      minQuantity: 1,
      nutrition: '',
      sourcingStory: '',
      status: 'active'
    }
  ];

  const formattedItems = formatOrderItems(testItems);
  console.log(`Items: ${formattedItems}`);
};

/**
 * Test WhatsApp message sending with mock data
 */
export const testWhatsAppMessage = async () => {
  console.log('\n=== Testing WhatsApp Message Sending ===');

  const mockMessageData: OrderMessageData = {
    customerName: 'Test Customer',
    orderId: 'test-order-123',
    orderNumber: 1234567890,
    itemsList: 'Organic Tomatoes x 2, Fresh Spinach x 1',
    paymentMethod: 'Cash on Delivery',
    totalAmount: 105,
    phoneNumber: '9876543210' // Use a test phone number
  };

  console.log('Sending test WhatsApp message with data:', mockMessageData);

  try {
    const result = await sendOrderConfirmationMessage(mockMessageData);
    console.log('WhatsApp API Response:', result);

    if (result.success) {
      console.log('✅ WhatsApp message sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ WhatsApp message failed:', result.error);
      console.log('Details:', result.details);
    }
  } catch (error) {
    console.error('❌ Error testing WhatsApp message:', error);
  }
};

/**
 * Test API connectivity and authentication
 */
export const testWhatsAppAPI = async () => {
  console.log('\n=== Testing WhatsApp API Connectivity ===');

  const testPayload = {
    countryCode: '+91',
    phoneNumber: '9876543210',
    type: 'Template',
    callbackData: 'test_message',
    template: {
      name: 'order_confirmation',
      languageCode: 'en',
      bodyValues: [
        'Test Customer',
        '1234567890',
        'Test Product x 1',
        'Cash on Delivery',
        '100'
      ]
    }
  };

  console.log('Testing API with payload:', testPayload);

  try {
    const response = await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic V2VrZ3BrVGc4S2Q0ekRoeWpyeU1QS1R2MXU2Nl9GZEliQXdTWFdBWnNvRTo='
      },
      body: JSON.stringify(testPayload)
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.text();
    console.log('Response body (raw):', responseData);

    try {
      const jsonData = JSON.parse(responseData);
      console.log('Response body (parsed):', jsonData);
    } catch (parseError) {
      console.log('Response is not valid JSON');
    }

    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

/**
 * Run all WhatsApp tests
 */
export const runWhatsAppTests = async () => {
  console.log('🧪 Running WhatsApp Integration Tests...\n');

  // Test formatting functions
  testWhatsAppFormatting();

  // Test API connectivity
  await testWhatsAppAPI();

  // Test message sending (comment out if you don't want to send actual messages)
  // await testWhatsAppMessage();

  console.log('\n✅ WhatsApp tests completed!');
};

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testWhatsApp = {
    testFormatting: testWhatsAppFormatting,
    testAPI: testWhatsAppAPI,
    testMessage: testWhatsAppMessage,
    runAllTests: runWhatsAppTests
  };
}
