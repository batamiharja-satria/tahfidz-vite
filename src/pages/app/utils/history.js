// Utility untuk menyimpan dan mengambil history user
export const HistoryManager = {
  // Simpan halaman terakhir untuk fitur tertentu
  setLastPage(fitur, path) {
    try {
      localStorage.setItem(`last_page_${fitur}`, path);
      console.log(`Saved last page for ${fitur}:`, path);
    } catch (error) {
      console.error('Error saving history:', error);
    }
  },

  // Ambil halaman terakhir untuk fitur tertentu
  getLastPage(fitur) {
    try {
      return localStorage.getItem(`last_page_${fitur}`);
    } catch (error) {
      console.error('Error getting history:', error);
      return null;
    }
  },

  // Hapus history untuk fitur tertentu
  clearLastPage(fitur) {
    try {
      localStorage.removeItem(`last_page_${fitur}`);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
};