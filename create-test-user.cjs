/**
 * Create a test user in Firebase for testing authentication
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase config (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyCH3NSH_EB-AX9hunvkdqrj0vS34IbDKpQ",
  authDomain: "vrisham-cad24.firebaseapp.com",
  projectId: "vrisham-cad24",
  storageBucket: "vrisham-cad24.appspot.com",
  messagingSenderId: "404878904416",
  appId: "1:404878904416:web:e48d6d054a35ecb5de8705"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestUser() {
  console.log('👤 Creating test user in Firebase...');
  
  const testPhoneNumber = '+919995580712';
  const testUID = `test_user_9995580712`; // Use a simpler UID for testing
  
  const userData = {
    uid: testUID,
    displayName: 'Test User',
    phoneNumber: testPhoneNumber, // camelCase format
    phone_number: testPhoneNumber, // underscore format for compatibility
    createdTime: new Date(),
    isDeactivated: false,
    isNewCustomer: false, // Existing user
    keywords: ['test', 'user'],
    role: 'customer',
    listOfAddress: [
      {
        addressID: 1,
        addressName: 'Home',
        addressLines: '123 Test Street, Test City',
        landmark: 'Near Test Mall',
        pincode: 123456,
        phoneNumber: testPhoneNumber,
        branchCode: 'MAIN',
        branchName: 'Main Branch'
      }
    ]
  };
  
  try {
    // Create user document with specific UID
    await setDoc(doc(db, 'Users', testUID), userData);
    
    console.log('✅ Test user created successfully!');
    console.log('📋 User details:');
    console.log(`   UID: ${testUID}`);
    console.log(`   Name: ${userData.displayName}`);
    console.log(`   Phone: ${userData.phoneNumber}`);
    console.log(`   Addresses: ${userData.listOfAddress.length}`);
    console.log('');
    console.log('🧪 You can now test authentication with:');
    console.log(`   Phone Number: ${testPhoneNumber}`);
    console.log('   Expected: Should skip address collection and login directly');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

// Run the script
createTestUser().catch(console.error);
