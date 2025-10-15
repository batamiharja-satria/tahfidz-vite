class IndexedDBService {
  constructor() {
    this.dbName = 'QuranCacheDB';
    this.version = 1;
    this.db = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('makna')) {
          const maknaStore = db.createObjectStore('makna', { keyPath: 'key' });
          maknaStore.createIndex('userId', 'userId', { unique: false });
          maknaStore.createIndex('surah', 'surah', { unique: false });
          maknaStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('catatan')) {
          const catatanStore = db.createObjectStore('catatan', { keyPath: 'key' });
          catatanStore.createIndex('userId', 'userId', { unique: false });
          catatanStore.createIndex('surah', 'surah', { unique: false });
          catatanStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async get(storeName, key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
    });
  }

  async set(storeName, key, value) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ key, value, ...this.extractIndexFields(key, value) });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(value);
    });
  }

  async delete(storeName, key) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll(storeName) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = {};
        request.result.forEach(item => {
          result[item.key] = item.value;
        });
        resolve(result);
      };
    });
  }

  async getAllByUser(storeName, userId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = {};
        request.result.forEach(item => {
          result[item.key] = item.value;
        });
        resolve(result);
      };
    });
  }

  async clear(storeName) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getStats() {
    await this.init();
    
    const [maknaData, catatanData] = await Promise.all([
      this.getAll('makna'),
      this.getAll('catatan')
    ]);

    return {
      totalMakna: Object.keys(maknaData).length,
      totalCatatan: Object.keys(catatanData).length,
      totalSize: await this.estimateSize(),
      lastSync: await this.getMetadata('last_sync')
    };
  }

  async estimateSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 'unknown';
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: estimate.quota ? (estimate.usage / estimate.quota * 100).toFixed(2) + '%' : 'unknown'
      };
    } catch (error) {
      console.error('Error estimating storage:', error);
      return 'unknown';
    }
  }

  async getMetadata(key) {
    return this.get('metadata', key);
  }

  async setMetadata(key, value) {
    return this.set('metadata', key, value);
  }

  extractIndexFields(key, value) {
    // Extract userId, surah, ayat from key for indexing
    const parts = key.split('_');
    const indexes = {
      userId: parts[0],
      timestamp: value._cachedAt || new Date().toISOString()
    };

    if (parts.length >= 3) {
      indexes.surah = parts[1];
    }

    return indexes;
  }

  async exportAllData() {
    const [makna, catatan] = await Promise.all([
      this.getAll('makna'),
      this.getAll('catatan')
    ]);

    return { makna, catatan };
  }

  async importAllData(data) {
    // Clear existing data first
    await this.clear('makna');
    await this.clear('catatan');

    // Import new data
    const maknaPromises = Object.entries(data.makna || {}).map(([key, value]) => 
      this.set('makna', key, value)
    );
    
    const catatanPromises = Object.entries(data.catatan || {}).map(([key, value]) => 
      this.set('catatan', key, value)
    );

    await Promise.all([...maknaPromises, ...catatanPromises]);
  }
}

// Create singleton instance
export const indexedDBService = new IndexedDBService();