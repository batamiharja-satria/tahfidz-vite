// utils/googleSheetsService.js

const API_URL = 'https://script.google.com/macros/s/AKfycbyTv6L24baNAE-uNHM-BHb-00utmckYDEWMLsck9Qi2RykUPVkK-i1eEZuRa7L756iD/exec';

class QuranDataService {
  constructor() {
    this.apiUrl = API_URL;
  }

  // Helper method untuk handle API calls
  async apiCall(action, data = {}) {
    try {
      console.log(`Making API call: ${action}`, data);

      // Build URL dengan parameter
      const params = new URLSearchParams();
      params.append('action', action);
      
      // Tambahkan semua data sebagai parameter
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          // Jika data adalah object, stringify
          if (typeof data[key] === 'object') {
            params.append(key, JSON.stringify(data[key]));
          } else {
            params.append(key, data[key]);
          }
        }
      });

      const url = `${this.apiUrl}?${params.toString()}`;
      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`API Response for ${action}:`, result);

      if (result.status === 'success') {
        return result.data;
      } else {
        throw new Error(result.message || `API error in ${action}`);
      }
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      throw error;
    }
  }

  // Test koneksi
  async testConnection() {
    return await this.apiCall('testConnection');
  }

  // GET - Ambil semua data user
  async getAllUserData(userId) {
    return await this.apiCall('getAllUserData', { user_id: userId });
  }

  // POST - Simpan semua data sekaligus
  async saveAllData(userId, maknaData, catatanData) {
    return await this.apiCall('saveAllData', {
      user_id: userId,
      makna: maknaData,
      catatan: catatanData
    });
  }

  // POST - Hapus semua data user (untuk reset)
  async clearUserData(userId) {
    return await this.apiCall('clearUserData', { user_id: userId });
  }
}

export const quranDataService = new QuranDataService();