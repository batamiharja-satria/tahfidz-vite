import { indexedDBService } from './indexedDBService';

class CacheService {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await indexedDBService.init();
      this.isInitialized = true;
      
      console.log('CacheService initialized with IndexedDB');
    } catch (error) {
      console.error('Error initializing CacheService:', error);
    }
  }

  // Generate cache key
  generateKey(userId, surah, ayat, kataIndex = null) {
    if (kataIndex !== null) {
      return `${userId}_${surah}_${ayat}_${kataIndex}`;
    }
    return `${userId}_${surah}_${ayat}`;
  }

  // MAKNA METHODS - All are async now
  async getMakna(userId, surah, ayat, kataIndex) {
    await this.init();
    const key = this.generateKey(userId, surah, ayat, kataIndex);
    return await indexedDBService.get('makna', key);
  }

  async setMakna(userId, surah, ayat, kataIndex, data) {
    await this.init();
    const key = this.generateKey(userId, surah, ayat, kataIndex);
    const dataToStore = {
      ...data,
      _cachedAt: new Date().toISOString(),
      _isDirty: true
    };
    return await indexedDBService.set('makna', key, dataToStore);
  }

  async deleteMakna(userId, surah, ayat, kataIndex) {
    await this.init();
    const key = this.generateKey(userId, surah, ayat, kataIndex);
    return await indexedDBService.delete('makna', key);
  }

  // CATATAN METHODS - All are async now
  async getCatatan(userId, surah, ayat) {
    await this.init();
    const key = this.generateKey(userId, surah, ayat);
    return await indexedDBService.get('catatan', key);
  }

  async setCatatan(userId, surah, ayat, data) {
    await this.init();
    const key = this.generateKey(userId, surah, ayat);
    const dataToStore = {
      ...data,
      _cachedAt: new Date().toISOString(),
      _isDirty: true
    };
    return await indexedDBService.set('catatan', key, dataToStore);
  }

  async deleteCatatan(userId, surah, ayat) {
    await this.init();
    const key = this.generateKey(userId, surah, ayat);
    return await indexedDBService.delete('catatan', key);
  }

  // BATCH OPERATIONS
  async getAllMakna() {
    await this.init();
    return await indexedDBService.getAll('makna');
  }

  async getAllCatatan() {
    await this.init();
    return await indexedDBService.getAll('catatan');
  }

  async getAllMaknaByUser(userId) {
    await this.init();
    return await indexedDBService.getAllByUser('makna', userId);
  }

  async getAllCatatanByUser(userId) {
    await this.init();
    return await indexedDBService.getAllByUser('catatan', userId);
  }

  async getUnsavedChanges() {
    await this.init();
    const [allMakna, allCatatan] = await Promise.all([
      this.getAllMakna(),
      this.getAllCatatan()
    ]);

    const unsavedMakna = Object.entries(allMakna)
      .filter(([key, value]) => value._isDirty)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    const unsavedCatatan = Object.entries(allCatatan)
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

  async markAllAsSaved() {
    await this.init();
    const [allMakna, allCatatan] = await Promise.all([
      this.getAllMakna(),
      this.getAllCatatan()
    ]);

    // Update all dirty items to mark as saved
    const updatePromises = [];

    Object.keys(allMakna).forEach(key => {
      if (allMakna[key]._isDirty) {
        const updated = { ...allMakna[key], _isDirty: false };
        updatePromises.push(indexedDBService.set('makna', key, updated));
      }
    });

    Object.keys(allCatatan).forEach(key => {
      if (allCatatan[key]._isDirty) {
        const updated = { ...allCatatan[key], _isDirty: false };
        updatePromises.push(indexedDBService.set('catatan', key, updated));
      }
    });

    await Promise.all(updatePromises);
    await indexedDBService.setMetadata('last_sync', new Date().toISOString());
  }

  // IMPORT/EXPORT
  async importFromDatabase(data) {
    await this.init();
    await indexedDBService.importAllData(data);
    await this.markAllAsSaved();
  }

  async exportForDatabase() {
    await this.init();
    const allData = await indexedDBService.exportAllData();

    // Remove cache metadata before sending to database
    const cleanMakna = Object.entries(allData.makna).reduce((acc, [key, value]) => {
      const { _cachedAt, _isDirty, ...cleanData } = value;
      acc[key] = cleanData;
      return acc;
    }, {});

    const cleanCatatan = Object.entries(allData.catatan).reduce((acc, [key, value]) => {
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
  async hasUnsavedChanges() {
    await this.init();
    const unsaved = await this.getUnsavedChanges();
    return Object.keys(unsaved.makna).length > 0 || Object.keys(unsaved.catatan).length > 0;
  }

  async getStats() {
    await this.init();
    const stats = await indexedDBService.getStats();
    const unsaved = await this.getUnsavedChanges();

    return {
      ...stats,
      unsavedMakna: Object.keys(unsaved.makna).length,
      unsavedCatatan: Object.keys(unsaved.catatan).length
    };
  }

  async clear() {
    await this.init();
    await indexedDBService.clear('makna');
    await indexedDBService.clear('catatan');
    console.log('Cache cleared successfully');
  }

  // Backup to localStorage (optional, for migration)
  async backupToLocalStorage() {
    const allData = await indexedDBService.exportAllData();
    localStorage.setItem('quran_cache_backup', JSON.stringify(allData));
    console.log('Backup created in localStorage');
  }

  // Restore from localStorage (optional, for migration)
  async restoreFromLocalStorage() {
    const backup = localStorage.getItem('quran_cache_backup');
    if (backup) {
      const data = JSON.parse(backup);
      await indexedDBService.importAllData(data);
      console.log('Restored from localStorage backup');
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();