// Test script to verify delivery date logic
import { getDeliveryInfoForItem } from './firebase/products.js';

// Test delivery logic for different days of the week
const testDeliveryLogic = () => {
  console.log('=== Testing Delivery Date Logic ===');
  
  // Test for each day of the week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    // Create a test date for each day of the week
    const testDate = new Date();
    testDate.setDate(testDate.getDate() - testDate.getDay() + dayOfWeek);
    
    // Test regular items
    const regularItemInfo = getDeliveryInfoForItem('in-stock', testDate);
    
    // Test pre-order items
    const preOrderItemInfo = getDeliveryInfoForItem('pre-order', testDate);
    
    console.log(`\n${days[dayOfWeek]} Orders:`);
    console.log(`  Regular items: ${regularItemInfo.label}`);
    console.log(`  Pre-order items: ${preOrderItemInfo.label}`);
    console.log(`  Delivery date: ${regularItemInfo.date.toDateString()}`);
  }
  
  console.log('\n=== Test Complete ===');
};

// Run the test
testDeliveryLogic();
