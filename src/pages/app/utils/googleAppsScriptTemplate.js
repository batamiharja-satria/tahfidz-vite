// Quran App - Google Apps Script API
// Hanya menggunakan satu sheet: MaknaData

const CONFIG = {
  SHEET_ID: '1hYIwGs6WTlmFt6-3tj3w90n-nHync42Amk9WKKaWT4I', // Ganti dengan ID spreadsheet Anda
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
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : null;
    
    let result;
    
    switch(action) {
      case 'test':
        result = { success: true, message: "API is working!" };
        break;
      case 'save':
        result = saveData(data);
        break;
      case 'get':
        result = getData(data);
        break;
      case 'delete':
        result = deleteData(data);
        break;
      default:
        throw new Error('Action not supported');
    }
    
    return createResponse(result);
  } catch (error) {
    return createResponse({ error: error.message }, true);
  }
}

// Helper functions
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_MAKNA);
  
  // Buat sheet jika belum ada
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_MAKNA);
    // Buat header untuk semua data
    sheet.getRange('A1:G1').setValues([[
      'id', 'user_id', 'surah', 'ayat', 'arti', 'keterangan', 'timestamp'
    ]]);
  }
  
  return sheet;
}

function createResponse(data, isError = false) {
  const response = {
    success: !isError,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // PERBAIKAN: setMimeType (bukan setMimetype)
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// CRUD Operations
function getData(filters = {}) {
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
    
    // Filter berdasarkan parameter
    let match = true;
    
    if (filters.user_id && obj.user_id !== filters.user_id) {
      match = false;
    }
    
    if (filters.surah && obj.surah != filters.surah) {
      match = false;
    }
    
    if (filters.ayat && obj.ayat != filters.ayat) {
      match = false;
    }
    
    if (match) {
      result.push(obj);
    }
  }
  
  return { data: result };
}

function saveData(newData) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  // Cari data yang sudah ada
  let existingRow = -1;
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    if (row[1] === newData.user_id && 
        row[2] == newData.surah && 
        row[3] == newData.ayat) {
      existingRow = i + 1;
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
  
  const rowData = [
    newData.id,
    newData.user_id,
    newData.surah,
    newData.ayat,
    newData.arti || '',
    newData.keterangan || '',
    newData.timestamp
  ];
  
  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Tambah row baru
    sheet.appendRow(rowData);
  }
  
  return { 
    message: 'Data saved successfully',
    id: newData.id,
    data: newData
  };
}

function deleteData(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();
  
  for (let i = allData.length - 1; i >= 1; i--) {
    const row = allData[i];
    if (row[0] === data.id) {
      sheet.deleteRow(i + 1);
      return { message: 'Data deleted successfully' };
    }
  }
  
  throw new Error('Data not found');
}