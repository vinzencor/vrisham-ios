/**
 * Test to list existing users in Firebase
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

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

async function listUsers() {
  console.log('📋 Listing existing users in Firebase...');
  
  try {
    // Get first 10 users
    const usersQuery = query(collection(db, 'Users'), limit(10));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firebase Users collection');
      return;
    }
    
    console.log(`✅ Found ${usersSnapshot.size} users:`);
    console.log('');
    
    usersSnapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`${index + 1}. User ID: ${doc.id}`);
      console.log(`   Name: ${userData.displayName || 'N/A'}`);
      console.log(`   Phone (camelCase): ${userData.phoneNumber || 'N/A'}`);
      console.log(`   Phone (underscore): ${userData.phone_number || 'N/A'}`);
      console.log(`   UID: ${userData.uid || 'N/A'}`);
      console.log(`   Addresses: ${userData.listOfAddress?.length || 0}`);
      console.log(`   Created: ${userData.createdTime?.toDate?.() || 'N/A'}`);
      console.log(`   Deactivated: ${userData.isDeactivated || false}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

// Run the test
listUsers().catch(console.error);
