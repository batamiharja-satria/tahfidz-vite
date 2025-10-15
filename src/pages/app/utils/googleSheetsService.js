// Google Sheets Service untuk komunikasi dengan Google Apps Script
// Ganti YOUR_SCRIPT_URL dengan URL Google Apps Script yang sudah di-deploy

const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // Ganti dengan URL Apps Script Anda

class GoogleSheetsService {
  constructor() {
    this.baseUrl = SCRIPT_URL;
  }

  // Helper method untuk memanggil API
  async callAPI(action, data = {}) {
    try {
      const formData = new FormData();
      formData.append('action', action);
      formData.append('data', JSON.stringify(data));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Google Sheets API Error:', error);
      throw error;
    }
  }

  // ===== SERVICE UNTUK DATA MAKNA (PER KATA) =====

  // Ambil semua makna untuk user dan surat tertentu
  async getMaknaBySurah(userId, surahNumber) {
    return this.callAPI('getMaknaBySurah', { userId, surah: surahNumber });
  }

  // Ambil makna spesifik untuk sebuah kata
  async getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex) {
    return this.callAPI('getMaknaByKata', {
      userId,
      surah: surahNumber,
      ayat: ayatNumber,
      kata_index: kataIndex
    });
  }

  // Simpan atau update makna
  async saveMakna(maknaData) {
    return this.callAPI('saveMakna', maknaData);
  }

  // Hapus makna
  async deleteMakna(userId, surahNumber, ayatNumber, kataIndex) {
    return this.callAPI('deleteMakna', {
      userId,
      surah: surahNumber,
      ayat: ayatNumber,
      kata_index: kataIndex
    });
  }

  // ===== SERVICE UNTUK DATA CATATAN (PER AYAT) =====

  // Ambil semua catatan untuk user dan surat tertentu
  async getCatatanBySurah(userId, surahNumber) {
    return this.callAPI('getCatatanBySurah', { userId, surah: surahNumber });
  }

  // Ambil catatan spesifik untuk sebuah ayat
  async getCatatanByAyat(userId, surahNumber, ayatNumber) {
    return this.callAPI('getCatatanByAyat', {
      userId,
      surah: surahNumber,
      ayat: ayatNumber
    });
  }

  // Simpan atau update catatan
  async saveCatatan(catatanData) {
    return this.callAPI('saveCatatan', catatanData);
  }

  // Hapus catatan
  async deleteCatatan(userId, surahNumber, ayatNumber) {
    return this.callAPI('deleteCatatan', {
      userId,
      surah: surahNumber,
      ayat: ayatNumber
    });
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();

// Fallback service menggunakan localStorage jika Google Sheets tidak tersedia
class LocalStorageFallback {
  constructor() {
    this.maknaKey = 'quran_makna_data';
    this.catatanKey = 'quran_catatan_data';
  }

  // Helper methods
  getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Makna methods
  async getMaknaBySurah(userId, surahNumber) {
    const allData = this.getFromStorage(this.maknaKey);
    return allData.filter(item => 
      item.user_id === userId && 
      parseInt(item.surah) === parseInt(surahNumber)
    );
  }

  async getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex) {
    const allData = this.getFromStorage(this.maknaKey);
    return allData.find(item => 
      item.user_id === userId &&
      parseInt(item.surah) === parseInt(surahNumber) &&
      parseInt(item.ayat) === parseInt(ayatNumber) &&
      parseInt(item.kata_index) === parseInt(kataIndex)
    );
  }

  async saveMakna(maknaData) {
    const allData = this.getFromStorage(this.maknaKey);
    const existingIndex = allData.findIndex(item => 
      item.user_id === maknaData.user_id &&
      parseInt(item.surah) === parseInt(maknaData.surah) &&
      parseInt(item.ayat) === parseInt(maknaData.ayat) &&
      parseInt(item.kata_index) === parseInt(maknaData.kata_index)
    );

    const dataToSave = {
      ...maknaData,
      id: maknaData.id || this.generateId(),
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      allData[existingIndex] = dataToSave;
    } else {
      allData.push(dataToSave);
    }

    this.saveToStorage(this.maknaKey, allData);
    return dataToSave;
  }

  async deleteMakna(userId, surahNumber, ayatNumber, kataIndex) {
    const allData = this.getFromStorage(this.maknaKey);
    const newData = allData.filter(item => 
      !(item.user_id === userId &&
        parseInt(item.surah) === parseInt(surahNumber) &&
        parseInt(item.ayat) === parseInt(ayatNumber) &&
        parseInt(item.kata_index) === parseInt(kataIndex))
    );
    
    this.saveToStorage(this.maknaKey, newData);
    return { success: true };
  }

  // Catatan methods
  async getCatatanBySurah(userId, surahNumber) {
    const allData = this.getFromStorage(this.catatanKey);
    return allData.filter(item => 
      item.user_id === userId && 
      parseInt(item.surah) === parseInt(surahNumber)
    );
  }

  async getCatatanByAyat(userId, surahNumber, ayatNumber) {
    const allData = this.getFromStorage(this.catatanKey);
    return allData.find(item => 
      item.user_id === userId &&
      parseInt(item.surah) === parseInt(surahNumber) &&
      parseInt(item.ayat) === parseInt(ayatNumber)
    );
  }

  async saveCatatan(catatanData) {
    const allData = this.getFromStorage(this.catatanKey);
    const existingIndex = allData.findIndex(item => 
      item.user_id === catatanData.user_id &&
      parseInt(item.surah) === parseInt(catatanData.surah) &&
      parseInt(item.ayat) === parseInt(catatanData.ayat)
    );

    const dataToSave = {
      ...catatanData,
      id: catatanData.id || this.generateId(),
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      allData[existingIndex] = dataToSave;
    } else {
      allData.push(dataToSave);
    }

    this.saveToStorage(this.catatanKey, allData);
    return dataToSave;
  }

  async deleteCatatan(userId, surahNumber, ayatNumber) {
    const allData = this.getFromStorage(this.catatanKey);
    const newData = allData.filter(item => 
      !(item.user_id === userId &&
        parseInt(item.surah) === parseInt(surahNumber) &&
        parseInt(item.ayat) === parseInt(ayatNumber))
    );
    
    this.saveToStorage(this.catatanKey, newData);
    return { success: true };
  }
}

export const localStorageService = new LocalStorageFallback();

// Service utama yang akan digunakan - otomatis fallback ke localStorage jika Google Sheets gagal
export class QuranDataService {
  constructor() {
    this.useGoogleSheets = true;
    this.testConnection();
  }

  async testConnection() {
    try {
      // Test koneksi ke Google Sheets
      await googleSheetsService.callAPI('test');
      this.useGoogleSheets = true;
      console.log('✅ Connected to Google Sheets API');
    } catch (error) {
      this.useGoogleSheets = false;
      console.log('⚠️ Using localStorage fallback for data storage');
    }
  }

  getService() {
    return this.useGoogleSheets ? googleSheetsService : localStorageService;
  }

  // Makna methods
  async getMaknaBySurah(userId, surahNumber) {
    return this.getService().getMaknaBySurah(userId, surahNumber);
  }

  async getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex) {
    return this.getService().getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex);
  }

  async saveMakna(maknaData) {
    return this.getService().saveMakna(maknaData);
  }

  async deleteMakna(userId, surahNumber, ayatNumber, kataIndex) {
    return this.getService().deleteMakna(userId, surahNumber, ayatNumber, kataIndex);
  }

  // Catatan methods
  async getCatatanBySurah(userId, surahNumber) {
    return this.getService().getCatatanBySurah(userId, surahNumber);
  }

  async getCatatanByAyat(userId, surahNumber, ayatNumber) {
    return this.getService().getCatatanByAyat(userId, surahNumber, ayatNumber);
  }

  async saveCatatan(catatanData) {
    return this.getService().saveCatatan(catatanData);
  }

  async deleteCatatan(userId, surahNumber, ayatNumber) {
    return this.getService().deleteCatatan(userId, surahNumber, ayatNumber);
  }
}

// Export instance utama
export const quranDataService = new QuranDataService();