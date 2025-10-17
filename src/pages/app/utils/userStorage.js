// utils/userStorage.js
// Utility untuk user-specific localStorage dengan Error Handling dan Persistent Device ID

export const UserStorage = {
  // ✅ FUNGSI BARU: Get Device UUID yang PERSISTENT (IndexedDB + localStorage)
  getPersistentDeviceUUID: async () => {
    try {
      // 1. Coba IndexedDB pertama (lebih persistent)
      let deviceUUID = await UserStorage._getFromIndexedDB('deviceUUID');
      
      // 2. Cek localStorage (fallback)
      if (!deviceUUID) {
        deviceUUID = localStorage.getItem("deviceUUID");
        
        // Jika ada di localStorage, backup ke IndexedDB
        if (deviceUUID) {
          await UserStorage._setInIndexedDB('deviceUUID', deviceUUID);
          console.log('✅ Migrated deviceUUID to IndexedDB');
        }
      }
      
      // 3. Generate baru jika benar-benar kosong
      if (!deviceUUID) {
        const { v4: uuidv4 } = await import('uuid');
        deviceUUID = uuidv4();
        
        // Simpan di kedua tempat
        localStorage.setItem("deviceUUID", deviceUUID);
        await UserStorage._setInIndexedDB('deviceUUID', deviceUUID);
        
        console.log('✅ New Persistent Device UUID created:', deviceUUID);
      }
      
      return deviceUUID;
    } catch (error) {
      console.error('Error getPersistentDeviceUUID:', error);
      // Fallback ke localStorage saja
      let deviceUUID = localStorage.getItem("deviceUUID");
      if (!deviceUUID) {
        const { v4: uuidv4 } = await import('uuid');
        deviceUUID = uuidv4();
        localStorage.setItem("deviceUUID", deviceUUID);
      }
      return deviceUUID;
    }
  },

  // ✅ FUNGSI BARU: IndexedDB Helper (PRIVATE)
  _getFromIndexedDB: (key) => {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      
      const request = indexedDB.open('TahfidzAppStorage', 1);
      
      request.onerror = () => resolve(null);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['persistentData'], 'readonly');
        const store = transaction.objectStore('persistentData');
        const getRequest = store.get(key);
        
        getRequest.onerror = () => resolve(null);
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result?.value || null);
        };
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('persistentData')) {
          const store = db.createObjectStore('persistentData');
        }
      };
    });
  },

  _setInIndexedDB: (key, value) => {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(false);
        return;
      }
      
      const request = indexedDB.open('TahfidzAppStorage', 1);
      
      request.onerror = () => resolve(false);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['persistentData'], 'readwrite');
        const store = transaction.objectStore('persistentData');
        const putRequest = store.put({ value, timestamp: Date.now() }, key);
        
        putRequest.onerror = () => resolve(false);
        putRequest.onsuccess = () => resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('persistentData')) {
          db.createObjectStore('persistentData');
        }
      };
    });
  },

  // ✅ FUNGSI BARU: Get all data dari IndexedDB (FIXED VERSION)
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
          const results = getAllRequest.result;
          results.forEach(item => {
            if (item && item.key) {
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

  // ✅ PERBAIKAN: getUserIdentifier HYBRID (sync untuk existing code, async untuk device UUID)
  getUserIdentifier: (session) => {
    try {
      // Untuk kompatibilitas dengan kode existing, kita buat sync version
      // Device UUID akan di-resolve sync dari localStorage dulu
      let deviceUUID = localStorage.getItem("deviceUUID");
      
      if (!deviceUUID) {
        // Fallback: generate simple UUID sync
        deviceUUID = 'device_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now().toString(36);
        localStorage.setItem("deviceUUID", deviceUUID);
        
        // Async backup ke IndexedDB
        UserStorage._setInIndexedDB('deviceUUID', deviceUUID).catch(console.error);
      }
      
      if (session?.user?.id) {
        return `user_${session.user.id}_${deviceUUID}`;
      }
      
      return `guest_${deviceUUID}`;
    } catch (error) {
      console.error('Error getUserIdentifier:', error);
      return 'guest_anonymous';
    }
  },

  // ✅ PERBAIKAN: Kembalikan ke SYNCHRONOUS untuk fungsi yang dipakai di render
  getUserKey: (session, baseKey) => {
    try {
      const userIdentifier = UserStorage.getUserIdentifier(session);
      return `${userIdentifier}_${baseKey}`;
    } catch (error) {
      console.error('Error getUserKey:', error);
      return `fallback_${baseKey}`;
    }
  },

  // ✅ PERBAIKAN: Kembalikan ke SYNCHRONOUS untuk hafalan (penting!)
  getHafalan: (session, suratId, ayatNomor) => {
    try {
      const key = UserStorage.getUserKey(session, `hafalan_${suratId}_${ayatNomor}`);
      const value = localStorage.getItem(key);
      return value === 'true'; // ✅ Return boolean, bukan Promise
    } catch (error) {
      console.error('Error getHafalan:', error);
      return false;
    }
  },

  setHafalan: (session, suratId, ayatNomor, value) => {
    try {
      const key = UserStorage.getUserKey(session, `hafalan_${suratId}_${ayatNomor}`);
      localStorage.setItem(key, value.toString());
    } catch (error) {
      console.error('Error setHafalan:', error);
    }
  },

  // ✅ PERBAIKAN: History functions tetap SYNC
  getHistory: (session, feature) => {
    try {
      const key = UserStorage.getUserKey(session, `last_page_${feature}`);
      return localStorage.getItem(key) || null;
    } catch (error) {
      console.error('Error getHistory:', error);
      return null;
    }
  },

  setHistory: (session, feature, path) => {
    try {
      if (path) {
        const key = UserStorage.getUserKey(session, `last_page_${feature}`);
        localStorage.setItem(key, path);
      }
    } catch (error) {
      console.error('Error setHistory:', error);
    }
  },

  // ✅ PERBAIKAN: Scroll position functions tetap SYNC
  getScrollPosition: (session, feature, suratId) => {
    try {
      const key = UserStorage.getUserKey(session, `scroll_${feature}_${suratId}`);
      const saved = localStorage.getItem(key);
      return saved ? parseInt(saved) : 0;
    } catch (error) {
      console.error('Error getScrollPosition:', error);
      return 0;
    }
  },

  setScrollPosition: (session, feature, suratId, position) => {
    try {
      const key = UserStorage.getUserKey(session, `scroll_${feature}_${suratId}`);
      localStorage.setItem(key, position.toString());
    } catch (error) {
      console.error('Error setScrollPosition:', error);
    }
  },

  // ✅ FUNGSI BARU: Initialize default data jika kosong (SYNC)
  initializeDefaultData: (session) => {
    try {
      const userIdentifier = UserStorage.getUserIdentifier(session);
      
      // Default history untuk fitur1
      const historyFitur1Key = `${userIdentifier}_last_page_fitur1`;
      if (!localStorage.getItem(historyFitur1Key)) {
        localStorage.setItem(historyFitur1Key, '/app2/app/fitur1/panduan1');
        console.log('✅ Default history fitur1 created');
      }
      
      // Default history untuk fitur2
      const historyFitur2Key = `${userIdentifier}_last_page_fitur2`;
      if (!localStorage.getItem(historyFitur2Key)) {
        localStorage.setItem(historyFitur2Key, '/app2/app/fitur2/panduan2');
        console.log('✅ Default history fitur2 created');
      }
      
      console.log('✅ Default data initialized for:', userIdentifier);
    } catch (error) {
      console.error('Error initializeDefaultData:', error);
    }
  },

  // ✅ PERBAIKAN: Safe navigation sesuai permintaan
  safeNavigate: (session, feature, navigate) => {
    // Jika ingin ke beranda, langsung navigate
    if (feature === 'beranda') {
      navigate('/app2');
      return;
    }
    
    // Logic existing untuk fitur1 dan fitur2...
    const lastPage = UserStorage.getHistory(session, feature);
    if (lastPage && lastPage !== `/app2/app/${feature}`) {
      navigate(lastPage);
    } else {
      navigate(`/app2/app/${feature}`);
    }
  },

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

  // ✅ FUNGSI BARU: Migrate data dari guest ke user saat login (FULL VERSION)
  migrateGuestToUser: async (session, guestDeviceUUID) => {
    try {
      if (!session || !guestDeviceUUID) return;
      
      const guestIdentifier = `guest_${guestDeviceUUID}`;
      const userIdentifier = UserStorage.getUserIdentifier(session);
      
      console.log('🔄 Migrating data from:', guestIdentifier, 'to:', userIdentifier);
      
      let migratedCount = 0;
      
      // Migrasi dari localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(guestIdentifier)) {
          const value = localStorage.getItem(key);
          const newKey = key.replace(guestIdentifier, userIdentifier);
          
          // Migrasikan data hafalan, history, dan scroll
          if (key.includes('hafalan') || key.includes('last_page') || key.includes('scroll_')) {
            localStorage.setItem(newKey, value);
            migratedCount++;
            console.log('✅ Migrated localStorage:', key, '→', newKey);
          }
        }
      }
      
      // Migrasi dari IndexedDB
      try {
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
      } catch (indexedDBError) {
        console.warn('IndexedDB migration skipped:', indexedDBError);
      }
      
      console.log(`✅ Total migrated ${migratedCount} items from guest to user`);
      return migratedCount;
    } catch (error) {
      console.error('Error migrateGuestToUser:', error);
      return 0;
    }
  },

  // ✅ FUNGSI BARU: Untuk device validation di Login/Register (ASYNC)
  getPersistentDeviceUUIDAsync: async () => {
    return await UserStorage.getPersistentDeviceUUID();
  },

  // ✅ FUNGSI BARU: Untuk App2 device validation (ASYNC)
  validateDeviceWithSession: async (session) => {
    try {
      const currentDeviceUUID = await UserStorage.getPersistentDeviceUUID();
      const userIdentifier = `user_${session.user.id}_${currentDeviceUUID}`;
      return userIdentifier;
    } catch (error) {
      console.error('Error validateDeviceWithSession:', error);
      return null;
    }
  },

  // Cleanup old data (optional - untuk migrasi) dengan error handling
  cleanupOldData: (session) => {
    try {
      const userIdentifier = UserStorage.getUserIdentifier(session);
      const keysToRemove = [];
      
      // Cari keys lama tanpa user identifier
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('hafalan_') || 
          key.startsWith('last_page_') || 
          key.startsWith('scroll_') ||
          key.startsWith('history_')
        ) && !key.includes(userIdentifier)) {
          keysToRemove.push(key);
        }
      }
      
      // Hapus keys lama
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🧹 Cleaned old data:', key);
      });
      
      console.log(`🧹 Cleaned ${keysToRemove.length} old data items`);
    } catch (error) {
      console.error('Error cleanupOldData:', error);
    }
  },

  // ✅ FUNGSI BARU: Debug - Lihat semua data user
  debugUserData: (session) => {
    try {
      const userIdentifier = UserStorage.getUserIdentifier(session);
      const userData = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userIdentifier)) {
          userData[key] = localStorage.getItem(key);
        }
      }
      
      console.log('🔍 User Data Debug:', {
        userIdentifier,
        totalItems: Object.keys(userData).length,
        data: userData
      });
      
      return userData;
    } catch (error) {
      console.error('Error debugUserData:', error);
      return {};
    }
  },

  // ✅ FUNGSI BARU: Check localStorage availability
  isLocalStorageAvailable: () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      console.error('LocalStorage not available:', error);
      return false;
    }
  }
};