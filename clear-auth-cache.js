// Clear authentication cache script
// Run this in the browser console to clear all authentication-related data

console.log('=== CLEARING AUTHENTICATION CACHE ===');

// Clear localStorage
console.log('Clearing localStorage...');
Object.keys(localStorage).forEach(key => {
  if (key.includes('firebase') || key.includes('auth') || key.includes('user')) {
    console.log('Removing localStorage key:', key);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
console.log('Clearing sessionStorage...');
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('firebase') || key.includes('auth') || key.includes('user')) {
    console.log('Removing sessionStorage key:', key);
    sessionStorage.removeItem(key);
  }
});

// Clear IndexedDB (Firebase uses this for persistence)
console.log('Clearing IndexedDB...');
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name && (db.name.includes('firebase') || db.name.includes('firestore'))) {
        console.log('Deleting IndexedDB:', db.name);
        indexedDB.deleteDatabase(db.name);
      }
    });
  }).catch(err => {
    console.log('Could not clear IndexedDB:', err);
  });
}

// Clear cookies
console.log('Clearing cookies...');
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('=== CACHE CLEARING COMPLETE ===');
console.log('Please refresh the page to test the authentication flow.');
