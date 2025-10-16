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
    
    // TANDAI SEBAGAI PENGHAPUSAN YANG PERLU DISINKRONKASI
    await this.markForDeletion('makna', key);
    
    // Hapus dari store makna
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
    
    // TANDAI SEBAGAI PENGHAPUSAN YANG PERLU DISINKRONKASI
    await this.markForDeletion('catatan', key);
    
    // Hapus dari store catatan
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

  // METHOD BARU: Tracking deletions
  async markForDeletion(storeName, key) {
    await this.init();
    const deletionRecord = {
      key: key,
      storeName: storeName,
      deletedAt: new Date().toISOString(),
      _isDirty: true
    };
    return await indexedDBService.set('deletions', key, deletionRecord);
  }

  async getPendingDeletions() {
    await this.init();
    return await indexedDBService.getAll('deletions');
  }

  async clearPendingDeletions() {
    await this.init();
    await indexedDBService.clear('deletions');
  }

  async getUnsavedChanges() {
    await this.init();
    const [allMakna, allCatatan, pendingDeletions] = await Promise.all([
      this.getAllMakna(),
      this.getAllCatatan(),
      this.getPendingDeletions()
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
      catatan: unsavedCatatan,
      deletions: pendingDeletions
    };
  }

  async hasUnsavedChanges() {
    await this.init();
    const unsaved = await this.getUnsavedChanges();
    return Object.keys(unsaved.makna).length > 0 || 
           Object.keys(unsaved.catatan).length > 0 || 
           Object.keys(unsaved.deletions).length > 0;
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

    // Clear pending deletions
    updatePromises.push(this.clearPendingDeletions());

    await Promise.all(updatePromises);
    await indexedDBService.setMetadata('last_sync', new Date().toISOString());
    
    // Return updated stats untuk immediate update
    return await this.getStats();
  }

  // IMPORT/EXPORT
  async importFromDatabase(data) {
    await this.init();
    await indexedDBService.importAllData(data);
    const stats = await this.markAllAsSaved();
    return stats;
  }

  async exportForDatabase() {
    await this.init();
    const allData = await indexedDBService.exportAllData();
    const pendingDeletions = await this.getPendingDeletions();

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
      catatan: cleanCatatan,
      deletions: pendingDeletions
    };
  }

  // UTILITIES
  async hasUnsavedChanges() {
    await this.init();
    const unsaved = await this.getUnsavedChanges();
    return Object.keys(unsaved.makna).length > 0 || 
           Object.keys(unsaved.catatan).length > 0 || 
           Object.keys(unsaved.deletions).length > 0;
  }

  async getStats() {
    await this.init();
    const stats = await indexedDBService.getStats();
    const unsaved = await this.getUnsavedChanges();

    return {
      ...stats,
      unsavedMakna: Object.keys(unsaved.makna).length,
      unsavedCatatan: Object.keys(unsaved.catatan).length,
      pendingDeletions: Object.keys(unsaved.deletions).length,
      totalUnsaved: Object.keys(unsaved.makna).length + 
                    Object.keys(unsaved.catatan).length + 
                    Object.keys(unsaved.deletions).length
    };
  }

  // METHOD BARU: Reset cache untuk user tertentu
  async resetUserCache(userId) {
    await this.init();
    
    // Hapus semua data untuk user tertentu
    const [userMakna, userCatatan] = await Promise.all([
      this.getAllMaknaByUser(userId),
      this.getAllCatatanByUser(userId)
    ]);

    const deletionPromises = [
      ...Object.keys(userMakna).map(key => indexedDBService.delete('makna', key)),
      ...Object.keys(userCatatan).map(key => indexedDBService.delete('catatan', key))
    ];

    await Promise.all(deletionPromises);
    
    // Juga hapus deletions untuk user ini
    const allDeletions = await this.getPendingDeletions();
    const userDeletions = Object.keys(allDeletions).filter(key => key.startsWith(userId + '_'));
    const userDeletionPromises = userDeletions.map(key => 
      indexedDBService.delete('deletions', key)
    );
    
    await Promise.all(userDeletionPromises);
    
    console.log(`Cache reset for user: ${userId}`);
    return await this.getStats();
  }

  async clear() {
    await this.init();
    await indexedDBService.clear('makna');
    await indexedDBService.clear('catatan');
    await indexedDBService.clear('deletions');
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