// ✅ PERBAIKAN: Clear hanya data session, TIDAK data hafalan
clearUserData: (session) => {
  try {
    if (session) {
      const userIdentifier = UserStorage.getUserIdentifier(session);
      
      // ✅ HAPUS HANYA DATA SESSION, BUKAN DATA HAFALAN
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userIdentifier)) {
          // ❌ JANGAN hapus data hafalan, history, scroll position
          if (!key.includes('hafalan') && 
              !key.includes('last_page') && 
              !key.includes('scroll_')) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('✅ Removed session data:', key);
      });
      
      console.log(`✅ Cleared ${keysToRemove.length} session items for user: ${userIdentifier}`);
    }
  } catch (error) {
    console.error('Error clearUserData:', error);
  }
},

// ✅ FUNGSI BARU: Migrate data dari guest ke user saat login
migrateGuestToUser: async (session, guestDeviceUUID) => {
  try {
    if (!session || !guestDeviceUUID) return;
    
    const guestIdentifier = `guest_${guestDeviceUUID}`;
    const userIdentifier = UserStorage.getUserIdentifier(session);
    
    console.log('🔄 Migrating data from:', guestIdentifier, 'to:', userIdentifier);
    
    let migratedCount = 0;
    
    // Cari semua data guest
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(guestIdentifier)) {
        const value = localStorage.getItem(key);
        const newKey = key.replace(guestIdentifier, userIdentifier);
        
        // Migrasikan data hafalan, history, dan scroll
        if (key.includes('hafalan') || key.includes('last_page') || key.includes('scroll_')) {
          localStorage.setItem(newKey, value);
          migratedCount++;
          console.log('✅ Migrated:', key, '→', newKey);
        }
      }
    }
    
    // Juga migrasikan dari IndexedDB
    const indexedDBData = await UserStorage._getAllFromIndexedDB();
    for (const [key, value] of Object.entries(indexedDBData)) {
      if (key.includes(guestIdentifier)) {
        const newKey = key.replace(guestIdentifier, userIdentifier);
        if (key.includes('hafalan') || key.includes('last_page') || key.includes('scroll_')) {
          await UserStorage._setInIndexedDB(newKey, value);
          migratedCount++;
          console.log('✅ Migrated IndexedDB:', key, '→', newKey);
        }
      }
    }
    
    console.log(`✅ Total migrated ${migratedCount} items from guest to user`);
    return migratedCount;
  } catch (error) {
    console.error('Error migrateGuestToUser:', error);
    return 0;
  }
},

// ✅ FUNGSI BARU: Get all data dari IndexedDB (untuk migrasi)
_getAllFromIndexedDB: () => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve({});
      return;
    }
    
    const request = indexedDB.open('TahfidzAppStorage', 1);
    const allData = {};
    
    request.onerror = () => resolve({});
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['persistentData'], 'readonly');
      const store = transaction.objectStore('persistentData');
      const getAllRequest = store.getAll();
      
      getAllRequest.onerror = () => resolve({});
      getAllRequest.onsuccess = () => {
        getAllRequest.result.forEach(item => {
          if (item && item.key && item.value) {
            allData[item.key] = item.value;
          }
        });
        resolve(allData);
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('persistentData')) {
        db.createObjectStore('persistentData');
      }
    };
  });
},