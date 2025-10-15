// Quran App - Google Apps Script API
// Hanya menggunakan satu sheet: MaknaData

const CONFIG = {
  SHEET_ID: '1MCG4TC3sj2o0w8Z3K84Y0usfsh-ILU75JPvC6MuPbuQ',
  SHEET_MAKNA: 'MaknaData'
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const action = e.parameter.action;
    let data = {};
    
    // Parse data from POST or GET
    if (e.postData) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }
    
    console.log('Action:', action, 'Data:', data);
    
    let result;
    
    switch(action) {
      case 'testConnection':
        result = { status: 'success', message: "API is working!" };
        break;
      case 'getAllUserData':
        result = getAllUserData(data);
        break;
      case 'getCatatanByAyat':
        result = getCatatanByAyat(data);
        break;
      case 'getMaknaByKata':
        result = getMaknaByKata(data);
        break;
      case 'saveCatatan':
        result = saveData(data);
        break;
      case 'saveMakna':
        result = saveData(data);
        break;
      case 'updateData':
        result = updateData(data);
        break;
      case 'deleteData':
        result = deleteData(data);
        break;
      case 'getData':
        result = getData(data);
        break;
      case 'save':
        result = saveData(data);
        break;
      default:
        result = { status: 'error', message: "Action not recognized: " + action };
    }
    
    return createResponse(result);
  } catch (error) {
    console.error('Error:', error);
    return createResponse({ 
      status: 'error', 
      message: error.message 
    });
  }
}

// Helper functions
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_MAKNA);
  
  // Buat sheet jika belum ada
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_MAKNA);
    // Buat header untuk semua data (STRUKTUR BARU)
    sheet.getRange('A1:H1').setValues([[
      'id', 'user_id', 'surah', 'ayat', 'kata_index', 'kata_text', 'makna', 'keterangan', 'timestamp'
    ]]);
  }
  
  return sheet;
}

function createResponse(data) {
  // Tambahkan CORS headers untuk mengizinkan akses dari semua domain
  const response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  return response;
}

// FUNGSI BARU: Get all data for a user
function getAllUserData(data) {
  try {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const userId = data.user_id;
    let userData = [];
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[0] === '') continue;
      
      // Cek jika user_id cocok
      if (row[headers.indexOf('user_id')] == userId) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        obj.id = i; // ID adalah nomor baris
        userData.push(obj);
      }
    }
    
    return { 
      status: 'success',
      data: userData 
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// FUNGSI BARU: Get catatan by ayat (kata_index = -1)
function getCatatanByAyat(data) {
  try {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const userId = data.user_id;
    const surah = data.surah;
    const ayat = data.ayat;
    
    let result = [];
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[0] === '') continue;
      
      if (row[headers.indexOf('user_id')] == userId &&
          row[headers.indexOf('surah')] == surah &&
          row[headers.indexOf('ayat')] == ayat &&
          row[headers.indexOf('kata_index')] == -1) {
        
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        obj.id = i;
        result.push(obj);
      }
    }
    
    return { 
      status: 'success',
      data: result 
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// FUNGSI BARU: Get makna by kata
function getMaknaByKata(data) {
  try {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const userId = data.user_id;
    const surah = data.surah;
    const ayat = data.ayat;
    const kataIndex = data.kata_index;
    
    let result = [];
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[0] === '') continue;
      
      if (row[headers.indexOf('user_id')] == userId &&
          row[headers.indexOf('surah')] == surah &&
          row[headers.indexOf('ayat')] == ayat &&
          row[headers.indexOf('kata_index')] == kataIndex) {
        
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        obj.id = i;
        result.push(obj);
      }
    }
    
    return { 
      status: 'success',
      data: result 
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// FUNGSI BARU: Update data
function updateData(data) {
  try {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const rowId = data.id; // ID adalah nomor baris
    
    if (rowId < 1 || rowId >= allData.length) {
      return {
        status: 'error',
        message: 'Data not found'
      };
    }
    
    // Update data
    const rowData = [
      data.id || allData[rowId][headers.indexOf('id')],
      data.user_id || allData[rowId][headers.indexOf('user_id')],
      data.surah || allData[rowId][headers.indexOf('surah')],
      data.ayat || allData[rowId][headers.indexOf('ayat')],
      data.kata_index !== undefined ? data.kata_index : allData[rowId][headers.indexOf('kata_index')],
      data.kata_text || allData[rowId][headers.indexOf('kata_text')],
      data.makna || allData[rowId][headers.indexOf('makna')],
      data.keterangan || allData[rowId][headers.indexOf('keterangan')],
      new Date().toISOString() // Update timestamp
    ];
    
    sheet.getRange(rowId + 1, 1, 1, rowData.length).setValues([rowData]);
    
    return { 
      status: 'success',
      message: 'Data updated successfully',
      data: data
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// CRUD Operations (YANG SUDAH ADA - DIPERBAIKI)
function getData(filters = {}) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    let result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === '') continue;
      
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      obj.id = i; // Tambahkan ID sebagai nomor baris
      
      // Filter berdasarkan parameter
      let match = true;
      
      if (filters.user_id && obj.user_id != filters.user_id) {
        match = false;
      }
      
      if (filters.surah && obj.surah != filters.surah) {
        match = false;
      }
      
      if (filters.ayat && obj.ayat != filters.ayat) {
        match = false;
      }
      
      if (filters.kata_index !== undefined && obj.kata_index != filters.kata_index) {
        match = false;
      }
      
      if (match) {
        result.push(obj);
      }
    }
    
    return { 
      status: 'success',
      data: result 
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function saveData(newData) {
  try {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    // Cari data yang sudah ada berdasarkan kombinasi unik
    let existingRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[headers.indexOf('user_id')] == newData.user_id && 
          row[headers.indexOf('surah')] == newData.surah && 
          row[headers.indexOf('ayat')] == newData.ayat &&
          row[headers.indexOf('kata_index')] == (newData.kata_index || -1)) {
        existingRow = i;
        break;
      }
    }
    
    // Generate ID jika tidak ada
    if (!newData.id) {
      newData.id = Utilities.getUuid();
    }
    
    // Add timestamp
    if (!newData.timestamp) {
      newData.timestamp = new Date().toISOString();
    }
    
    // Struktur data baru dengan kolom tambahan
    const rowData = [
      newData.id,
      newData.user_id,
      newData.surah,
      newData.ayat,
      newData.kata_index !== undefined ? newData.kata_index : -1,
      newData.kata_text || '',
      newData.makna || newData.arti || '', // Support both 'makna' and 'arti'
      newData.keterangan || '',
      newData.timestamp
    ];
    
    if (existingRow > 0) {
      // Update existing row
      sheet.getRange(existingRow + 1, 1, 1, rowData.length).setValues([rowData]);
      return { 
        status: 'success',
        message: 'Data updated successfully',
        id: newData.id,
        data: newData
      };
    } else {
      // Tambah row baru
      sheet.appendRow(rowData);
      return { 
        status: 'success',
        message: 'Data saved successfully',
        id: newData.id,
        data: newData
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

function deleteData(data) {
  try {
    const sheet = getSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = allData.length - 1; i >= 1; i--) {
      const row = allData[i];
      if (row[0] === data.id) {
        sheet.deleteRow(i + 1);
        return { 
          status: 'success',
          message: 'Data deleted successfully' 
        };
      }
    }
    
    return {
      status: 'error',
      message: 'Data not found'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}