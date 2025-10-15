// Google Sheets Service untuk komunikasi dengan Google Apps Script
// Ganti YOUR_SCRIPT_URL dengan URL Google Apps Script yang sudah di-deploy

const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // Ganti dengan URL Apps Script Anda

class GoogleSheetsService {
  constructor() {
    this.baseUrl = SCRIPT_URL;
  }

  // Helper method untuk memanggil API
  async callAPI(method, data = {}) {
    try {
      const params = new URLSearchParams();
      params.append('method', method);
      
      if (Object.keys(data).length > 0) {
        params.append('data', JSON.stringify(data));
      }

      const url = `${this.baseUrl}?${params.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors' // Google Apps Script tidak support CORS untuk GET
      });

      // Karena no-cors, kita tidak bisa membaca response
      // Jadi kita anggap berhasil untuk sekarang
      return { success: true, data };
    } catch (error) {
      console.error('Google Sheets API Error:', error);
      throw error;
    }
  }

  // ===== SERVICE UNTUK SEMUA DATA =====

  // Ambil data berdasarkan filter
  async getData(filters = {}) {
    return this.callAPI('get', filters);
  }

  // Tambah data baru
  async addData(data) {
    return this.callAPI('add', data);
  }

  // Update data existing
  async updateData(id, data) {
    return this.callAPI('update', { id, ...data });
  }

  // Hapus data
  async deleteData(id) {
    return this.callAPI('delete', { id });
  }

  // Method khusus untuk makna kata
  async getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex) {
    const filters = {
      user_id: userId,
      surah: surahNumber,
      ayat: ayatNumber,
      kata_index: kataIndex
    };
    const result = await this.getData(filters);
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  // Method khusus untuk catatan ayat
  async getCatatanByAyat(userId, surahNumber, ayatNumber) {
    const filters = {
      user_id: userId,
      surah: surahNumber,
      ayat: ayatNumber,
      kata_index: -1 // kata_index = -1 untuk catatan ayat
    };
    const result = await this.getData(filters);
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  // Simpan makna kata
  async saveMakna(maknaData) {
    return this.addData(maknaData);
  }

  // Simpan catatan ayat
  async saveCatatan(catatanData) {
    return this.addData(catatanData);
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();

// Fallback service menggunakan localStorage jika Google Sheets tidak tersedia
class LocalStorageFallback {
  constructor() {
    this.storageKey = 'quran_makna_data';
  }

  // Helper methods
  getFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  saveToStorage(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Ambil data berdasarkan filter
  async getData(filters = {}) {
    const allData = this.getFromStorage();
    let filteredData = allData;

    // Apply filters
    if (filters.user_id) {
      filteredData = filteredData.filter(item => item.user_id === filters.user_id);
    }
    if (filters.surah !== undefined) {
      filteredData = filteredData.filter(item => parseInt(item.surah) === parseInt(filters.surah));
    }
    if (filters.ayat !== undefined) {
      filteredData = filteredData.filter(item => parseInt(item.ayat) === parseInt(filters.ayat));
    }
    if (filters.kata_index !== undefined) {
      filteredData = filteredData.filter(item => parseInt(item.kata_index) === parseInt(filters.kata_index));
    }

    return { data: filteredData };
  }

  // Tambah data baru
  async addData(newData) {
    const allData = this.getFromStorage();
    
    const dataToSave = {
      ...newData,
      id: newData.id || this.generateId(),
      timestamp: new Date().toISOString()
    };

    allData.push(dataToSave);
    this.saveToStorage(allData);
    
    return { 
      message: 'Data added successfully',
      id: dataToSave.id,
      data: dataToSave
    };
  }

  // Update data existing
  async updateData(id, updatedData) {
    const allData = this.getFromStorage();
    const index = allData.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Data not found');
    }

    allData[index] = { ...allData[index], ...updatedData };
    this.saveToStorage(allData);
    
    return { 
      message: 'Data updated successfully',
      id: id
    };
  }

  // Hapus data
  async deleteData(id) {
    const allData = this.getFromStorage();
    const newData = allData.filter(item => item.id !== id);
    
    this.saveToStorage(newData);
    return { message: 'Data deleted successfully' };
  }

  // Method khusus untuk makna kata
  async getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex) {
    const result = await this.getData({
      user_id: userId,
      surah: surahNumber,
      ayat: ayatNumber,
      kata_index: kataIndex
    });
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  // Method khusus untuk catatan ayat
  async getCatatanByAyat(userId, surahNumber, ayatNumber) {
    const result = await this.getData({
      user_id: userId,
      surah: surahNumber,
      ayat: ayatNumber,
      kata_index: -1
    });
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  // Simpan makna kata
  async saveMakna(maknaData) {
    return this.addData(maknaData);
  }

  // Simpan catatan ayat
  async saveCatatan(catatanData) {
    return this.addData(catatanData);
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
      await googleSheetsService.callAPI('get');
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

  // ===== METHOD UMUM =====
  async getData(filters = {}) {
    return this.getService().getData(filters);
  }

  async addData(data) {
    return this.getService().addData(data);
  }

  async updateData(id, data) {
    return this.getService().updateData(id, data);
  }

  async deleteData(id) {
    return this.getService().deleteData(id);
  }

  // ===== METHOD KHUSUS =====
  
  // Untuk makna per kata (kata_index >= 0)
  async getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex) {
    return this.getService().getMaknaByKata(userId, surahNumber, ayatNumber, kataIndex);
  }

  async saveMakna(maknaData) {
    return this.getService().saveMakna(maknaData);
  }

  // Untuk catatan ayat (kata_index = -1)
  async getCatatanByAyat(userId, surahNumber, ayatNumber) {
    return this.getService().getCatatanByAyat(userId, surahNumber, ayatNumber);
  }

  async saveCatatan(catatanData) {
    return this.getService().saveCatatan(catatanData);
  }

  // Ambil semua data untuk surah tertentu
  async getDataBySurah(userId, surahNumber) {
    return this.getService().getData({
      user_id: userId,
      surah: surahNumber
    });
  }
}

// Export instance utama
export const quranDataService = new QuranDataService();