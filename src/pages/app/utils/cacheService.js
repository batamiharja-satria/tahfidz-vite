// utils/cacheService.js

const CACHE_KEYS = {
  MAKNA_DATA: 'quran_makna_data',
  CATATAN_DATA: 'quran_catatan_data',
  LAST_SYNC: 'quran_last_sync'
};

class CacheService {
  constructor() {
    this.isInitialized = false;
    this.cache = {
      makna: {},
      catatan: {}
    };
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      // Load from localStorage
      const maknaData = localStorage.getItem(CACHE_KEYS.MAKNA_DATA);
      const catatanData = localStorage.getItem(CACHE_KEYS.CATATAN_DATA);
      
      this.cache.makna = maknaData ? JSON.parse(maknaData) : {};
      this.cache.catatan = catatanData ? JSON.parse(catatanData) : {};
      this.isInitialized = true;
      
      console.log('Cache initialized:', {
        maknaCount: Object.keys(this.cache.makna).length,
        catatanCount: Object.keys(this.cache.catatan).length
      });
    } catch (error) {
      console.error('Error initializing cache:', error);
      this.clear();
    }
  }

  // Generate cache key
  generateKey(userId, surah, ayat, kataIndex = null) {
    if (kataIndex !== null) {
      return `${userId}_${surah}_${ayat}_${kataIndex}`;
    }
    return `${userId}_${surah}_${ayat}`;
  }

  // MAKNA METHODS
  getMakna(userId, surah, ayat, kataIndex) {
    const key = this.generateKey(userId, surah, ayat, kataIndex);
    return this.cache.makna[key] || null;
  }

  setMakna(userId, surah, ayat, kataIndex, data) {
    const key = this.generateKey(userId, surah, ayat, kataIndex);
    this.cache.makna[key] = {
      ...data,
      _cachedAt: new Date().toISOString(),
      _isDirty: true // Mark as unsaved
    };
    this.saveToStorage();
    return this.cache.makna[key];
  }

  deleteMakna(userId, surah, ayat, kataIndex) {
    const key = this.generateKey(userId, surah, ayat, kataIndex);
    delete this.cache.makna[key];
    this.saveToStorage();
  }

  // CATATAN METHODS
  getCatatan(userId, surah, ayat) {
    const key = this.generateKey(userId, surah, ayat);
    return this.cache.catatan[key] || null;
  }

  setCatatan(userId, surah, ayat, data) {
    const key = this.generateKey(userId, surah, ayat);
    this.cache.catatan[key] = {
      ...data,
      _cachedAt: new Date().toISOString(),
      _isDirty: true // Mark as unsaved
    };
    this.saveToStorage();
    return this.cache.catatan[key];
  }

  deleteCatatan(userId, surah, ayat) {
    const key = this.generateKey(userId, surah, ayat);
    delete this.cache.catatan[key];
    this.saveToStorage();
  }

  // BATCH OPERATIONS
  getAllMakna() {
    return this.cache.makna;
  }

  getAllCatatan() {
    return this.cache.catatan;
  }

  getUnsavedChanges() {
    const unsavedMakna = Object.entries(this.cache.makna)
      .filter(([key, value]) => value._isDirty)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    const unsavedCatatan = Object.entries(this.cache.catatan)
      .filter(([key, value]) => value._isDirty)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return {
      makna: unsavedMakna,
      catatan: unsavedCatatan
    };
  }

  markAllAsSaved() {
    // Mark all as saved (after successful sync)
    Object.keys(this.cache.makna).forEach(key => {
      if (this.cache.makna[key]._isDirty) {
        this.cache.makna[key]._isDirty = false;
      }
    });
    
    Object.keys(this.cache.catatan).forEach(key => {
      if (this.cache.catatan[key]._isDirty) {
        this.cache.catatan[key]._isDirty = false;
      }
    });
    
    this.saveToStorage();
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  // IMPORT/EXPORT
  importFromDatabase(data) {
    if (data.makna) {
      this.cache.makna = data.makna;
    }
    if (data.catatan) {
      this.cache.catatan = data.catatan;
    }
    this.markAllAsSaved();
    this.saveToStorage();
  }

  exportForDatabase() {
    // Remove cache metadata before sending to database
    const cleanMakna = Object.entries(this.cache.makna).reduce((acc, [key, value]) => {
      const { _cachedAt, _isDirty, ...cleanData } = value;
      acc[key] = cleanData;
      return acc;
    }, {});

    const cleanCatatan = Object.entries(this.cache.catatan).reduce((acc, [key, value]) => {
      const { _cachedAt, _isDirty, ...cleanData } = value;
      acc[key] = cleanData;
      return acc;
    }, {});

    return {
      makna: cleanMakna,
      catatan: cleanCatatan
    };
  }

  // UTILITIES
  hasUnsavedChanges() {
    const unsaved = this.getUnsavedChanges();
    return Object.keys(unsaved.makna).length > 0 || Object.keys(unsaved.catatan).length > 0;
  }

  getStats() {
    return {
      totalMakna: Object.keys(this.cache.makna).length,
      totalCatatan: Object.keys(this.cache.catatan).length,
      unsavedMakna: Object.keys(this.getUnsavedChanges().makna).length,
      unsavedCatatan: Object.keys(this.getUnsavedChanges().catatan).length,
      lastSync: localStorage.getItem(CACHE_KEYS.LAST_SYNC)
    };
  }

  clear() {
    this.cache = { makna: {}, catatan: {} };
    localStorage.removeItem(CACHE_KEYS.MAKNA_DATA);
    localStorage.removeItem(CACHE_KEYS.CATATAN_DATA);
    localStorage.removeItem(CACHE_KEYS.LAST_SYNC);
    this.isInitialized = true;
  }

  saveToStorage() {
    try {
      localStorage.setItem(CACHE_KEYS.MAKNA_DATA, JSON.stringify(this.cache.makna));
      localStorage.setItem(CACHE_KEYS.CATATAN_DATA, JSON.stringify(this.cache.catatan));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();