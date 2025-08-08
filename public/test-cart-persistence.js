// Cart Persistence Test Script
// Run this in the browser console to test cart persistence functionality

console.log('=== CART PERSISTENCE TEST ===');

// Test function to check localStorage
function testCartPersistence() {
  console.log('Testing cart persistence...');
  
  // Check if localStorage is available
  if (typeof Storage !== "undefined") {
    console.log('✅ localStorage is available');
    
    // List all cart-related keys in localStorage
    const cartKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vrisham_cart_')) {
        cartKeys.push(key);
      }
    }
    
    console.log('Cart keys in localStorage:', cartKeys);
    
    // Display cart data for each user
    cartKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    });
    
    if (cartKeys.length === 0) {
      console.log('ℹ️ No cart data found in localStorage. Add items to cart and refresh to test persistence.');
    } else {
      console.log('✅ Cart data found in localStorage');
    }
    
  } else {
    console.log('❌ localStorage is not available');
  }
}

// Test function to simulate cart operations
function simulateCartOperations() {
  console.log('Simulating cart operations...');
  
  // Mock user ID for testing
  const testUserId = 'test-user-123';
  
  // Mock cart item
  const testItem = {
    id: 'test-product-1',
    name: 'Test Product',
    nameTamil: 'டெஸ்ட் பொருள்',
    image: '/test-image.jpg',
    price: 100,
    quantity: 2,
    unit: 'kg',
    status: 'pending',
    type: 'in-stock'
  };
  
  // Test saving cart items
  try {
    const key = `vrisham_cart_${testUserId}_items`;
    localStorage.setItem(key, JSON.stringify([testItem]));
    console.log('✅ Test cart item saved to localStorage');
    
    // Test loading cart items
    const loaded = localStorage.getItem(key);
    const parsedItems = JSON.parse(loaded);
    console.log('✅ Test cart item loaded from localStorage:', parsedItems);
    
    // Clean up test data
    localStorage.removeItem(key);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error during cart simulation:', error);
  }
}

// Instructions for manual testing
function showTestInstructions() {
  console.log(`
=== MANUAL TESTING INSTRUCTIONS ===

1. Login to the app with your phone number
2. Navigate to a product page and add items to cart
3. Check cart page to verify items are there
4. Refresh the page (F5 or Ctrl+R)
5. Check if cart items are still there
6. Navigate to different pages and come back to cart
7. Close browser tab and reopen the app
8. Login again and check if cart items persist

To check localStorage data:
- Run: testCartPersistence()

To simulate cart operations:
- Run: simulateCartOperations()

To clear all cart data:
- Run: clearAllCartData()
  `);
}

// Function to clear all cart data (for testing)
function clearAllCartData() {
  console.log('Clearing all cart data...');
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('vrisham_cart_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  });
  
  console.log(`✅ Cleared ${keysToRemove.length} cart data entries`);
}

// Make functions available globally for console testing
window.testCartPersistence = testCartPersistence;
window.simulateCartOperations = simulateCartOperations;
window.clearAllCartData = clearAllCartData;
window.showTestInstructions = showTestInstructions;

// Run initial test
testCartPersistence();
showTestInstructions();

console.log('=== CART PERSISTENCE TEST COMPLETE ===');
console.log('Functions available: testCartPersistence(), simulateCartOperations(), clearAllCartData(), showTestInstructions()');
