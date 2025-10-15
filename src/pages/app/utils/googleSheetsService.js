const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9zYuDUxTXaStygUAIZUhpg-jZ0T5j4KKKGp4vnCKJm0hQttDuYJ3MAMbeGRSPscj5DA/exec';

class QuranDataService {
  constructor() {
    this.baseUrl = SCRIPT_URL;
  }

  // Generic API call method
  async callAPI(action, data = {}) {
    try {
      const formData = new URLSearchParams();
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
        return result;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to localStorage
      return this.localStorageFallback(action, data);
    }
  }

  // localStorage fallback
  localStorageFallback(action, data) {
    const storageKey = 'quran_app_data';
    let allData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    switch(action) {
      case 'save':
        const id = data.id || Date.now().toString();
        const dataToSave = {
          ...data,
          id: id,
          timestamp: new Date().toISOString()
        };
        
        if (!allData[data.user_id]) {
          allData[data.user_id] = [];
        }
        
        // Remove existing entry if exists
        allData[data.user_id] = allData[data.user_id].filter(
          item => !(item.surah === data.surah && item.ayat === data.ayat)
        );
        
        // Add new entry
        allData[data.user_id].push(dataToSave);
        localStorage.setItem(storageKey, JSON.stringify(allData));
        
        return {
          success: true,
          message: 'Data saved to localStorage',
          id: id,
          data: dataToSave
        };

      case 'get':
        const userData = allData[data.user_id] || [];
        let filteredData = userData;
        
        if (data.surah) {
          filteredData = filteredData.filter(item => item.surah == data.surah);
        }
        if (data.ayat) {
          filteredData = filteredData.filter(item => item.ayat == data.ayat);
        }
        
        return {
          success: true,
          data: filteredData
        };

      case 'delete':
        if (allData[data.user_id]) {
          allData[data.user_id] = allData[data.user_id].filter(
            item => item.id !== data.id
          );
          localStorage.setItem(storageKey, JSON.stringify(allData));
        }
        
        return {
          success: true,
          message: 'Data deleted from localStorage'
        };

      default:
        return { success: false, error: 'Action not supported' };
    }
  }

  // Save data (both makna and catatan)
  async saveData(data) {
    return this.callAPI('save', data);
  }

  // Get data with filters
  async getData(filters = {}) {
    return this.callAPI('get', filters);
  }

  // Delete data
  async deleteData(data) {
    return this.callAPI('delete', data);
  }

  // Specific methods for different data types
  async saveMakna(maknaData) {
    return this.saveData({
      ...maknaData,
      type: 'makna'
    });
  }

  async saveCatatan(catatanData) {
    return this.saveData({
      ...catatanData,
      type: 'catatan'
    });
  }

  async getMaknaByAyat(userId, surah, ayat) {
    const result = await this.getData({
      user_id: userId,
      surah: surah,
      ayat: ayat,
      type: 'makna'
    });
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async getCatatanByAyat(userId, surah, ayat) {
    const result = await this.getData({
      user_id: userId,
      surah: surah,
      ayat: ayat,
      type: 'catatan'
    });
    return result.data && result.data.length > 0 ? result.data[0] : null;
  }
}

// Export singleton instance
export const quranDataService = new QuranDataService();