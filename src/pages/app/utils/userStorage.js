// utils/userStorage.js
// Utility untuk user-specific localStorage

export const UserStorage = {
  // Dapatkan user identifier
  getUserIdentifier: (session) => {
    if (session?.user?.id) {
      return `user_${session.user.id}`;
    }
    const deviceUUID = localStorage.getItem("deviceUUID");
    return `guest_${deviceUUID || 'anonymous'}`;
  },

  // User-specific key generator
  getUserKey: (session, baseKey) => {
    const userIdentifier = UserStorage.getUserIdentifier(session);
    return `${userIdentifier}_${baseKey}`;
  },

  // Hafalan functions
  getHafalan: (session, suratId, ayatNomor) => {
    const key = UserStorage.getUserKey(session, `hafalan_${suratId}_${ayatNomor}`);
    return localStorage.getItem(key) === 'true';
  },

  setHafalan: (session, suratId, ayatNomor, value) => {
    const key = UserStorage.getUserKey(session, `hafalan_${suratId}_${ayatNomor}`);
    localStorage.setItem(key, value.toString());
  },

  // History functions
  getHistory: (session, feature) => {
    const key = UserStorage.getUserKey(session, `last_page_${feature}`);
    return localStorage.getItem(key);
  },

  setHistory: (session, feature, path) => {
    const key = UserStorage.getUserKey(session, `last_page_${feature}`);
    if (path) {
      localStorage.setItem(key, path);
    }
  },

  // Scroll position functions
  getScrollPosition: (session, feature, suratId) => {
    const key = UserStorage.getUserKey(session, `scroll_${feature}_${suratId}`);
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved) : 0;
  },

  setScrollPosition: (session, feature, suratId, position) => {
    const key = UserStorage.getUserKey(session, `scroll_${feature}_${suratId}`);
    localStorage.setItem(key, position.toString());
  },

  // Cleanup old data (optional - untuk migrasi)
  cleanupOldData: (session) => {
    const userIdentifier = UserStorage.getUserIdentifier(session);
    const keysToRemove = [];
    
    // Cari keys lama tanpa user identifier
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('hafalan_') || 
        key.startsWith('last_page_') || 
        key.startsWith('scroll_')
      ) && !key.includes(userIdentifier)) {
        keysToRemove.push(key);
      }
    }
    
    // Hapus keys lama
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};