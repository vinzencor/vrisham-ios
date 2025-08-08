/**
 * Test user lookup functionality
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase config (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyBJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ",
  authDomain: "vrisham-customer.firebaseapp.com",
  projectId: "vrisham-customer",
  storageBucket: "vrisham-customer.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUserLookup() {
  console.log('🧪 Testing user lookup functionality...');
  
  // Test phone numbers (replace with actual numbers from your database)
  const testPhoneNumbers = [
    '+919995580712',
    '+917902467075',
    '+916238211018'
  ];
  
  for (const phoneNumber of testPhoneNumbers) {
    console.log(`\n🔍 Looking up user: ${phoneNumber}`);
    
    try {
      // Try phoneNumber field first
      const phoneNumberQuery = query(
        collection(db, 'Users'),
        where('phoneNumber', '==', phoneNumber)
      );
      
      const phoneNumberSnapshot = await getDocs(phoneNumberQuery);
      
      if (!phoneNumberSnapshot.empty) {
        const user = phoneNumberSnapshot.docs[0];
        console.log(`✅ Found user by phoneNumber field:`);
        console.log(`   UID: ${user.id}`);
        console.log(`   Name: ${user.data().displayName}`);
        console.log(`   Phone: ${user.data().phoneNumber}`);
        console.log(`   Addresses: ${user.data().listOfAddress?.length || 0}`);
        continue;
      }
      
      // Try phone_number field as fallback
      const phoneUnderscoreQuery = query(
        collection(db, 'Users'),
        where('phone_number', '==', phoneNumber)
      );
      
      const phoneUnderscoreSnapshot = await getDocs(phoneUnderscoreQuery);
      
      if (!phoneUnderscoreSnapshot.empty) {
        const user = phoneUnderscoreSnapshot.docs[0];
        console.log(`✅ Found user by phone_number field:`);
        console.log(`   UID: ${user.id}`);
        console.log(`   Name: ${user.data().displayName}`);
        console.log(`   Phone: ${user.data().phone_number}`);
        console.log(`   Addresses: ${user.data().listOfAddress?.length || 0}`);
        continue;
      }
      
      console.log(`❌ No user found with phone number: ${phoneNumber}`);
      
    } catch (error) {
      console.error(`❌ Error looking up ${phoneNumber}:`, error.message);
    }
  }
  
  console.log('\n🏁 User lookup test completed!');
}

// Run the test
testUserLookup().catch(console.error);
