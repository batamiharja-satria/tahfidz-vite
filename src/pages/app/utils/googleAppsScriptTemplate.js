// Template Google Apps Script untuk di-deploy
// Salin kode ini ke Google Apps Script dan deploy sebagai web app

/**
 * Google Apps Script untuk Quran Ma'na App
 * Deploy sebagai web app dengan execute as: me, who has access: anyone
 */

// Konfigurasi
const CONFIG = {
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID', // Ganti dengan ID Google Sheet Anda
  SHEET_MAKNA: 'MaknaData',
  SHEET_CATATAN: 'CatatanData'
};

// Inisialisasi spreadsheet
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    const data = JSON.parse(e.parameter.data);
    
    let result;
    
    switch(action) {
      case 'test':
        result = { success: true, data: 'Google Sheets API is working' };
        break;
        
      case 'getMaknaBySurah':
        result = getMaknaBySurah(data.userId, data.surah);
        break;
        
      case 'getMaknaByKata':
        result = getMaknaByKata(data.userId, data.surah, data.ayat, data.kata_index);
        break;
        
      case 'saveMakna':
        result = saveMakna(data);
        break;
        
      case 'deleteMakna':
        result = deleteMakna(data.userId, data.surah, data.ayat, data.kata_index);
        break;
        
      case 'getCatatanBySurah':
        result = getCatatanBySurah(data.userId, data.surah);
        break;
        
      case 'getCatatanByAyat':
        result = getCatatanByAyat(data.userId, data.surah, data.ayat);
        break;
        
      case 'saveCatatan':
        result = saveCatatan(data);
        break;
        
      case 'deleteCatatan':
        result = deleteCatatan(data.userId, data.surah, data.ayat);
        break;
        
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight
function doOptions() {
  return ContentService
    .createTextOutput()
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

// ===== FUNGSI UNTUK DATA MAKNA =====

function getMaknaSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_MAKNA);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_MAKNA);
    // Buat header
    sheet.getRange('A1:G1').setValues([[
      'id', 'user_id', 'surah', 'ayat', 'kata_index', 'kata_text', 'makna', 'timestamp'
    ]]);
  }
  
  return sheet;
}

function getMaknaBySurah(userId, surah) {
  const sheet = getMaknaSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    
    if (rowData.user_id === userId && parseInt(rowData.surah) === parseInt(surah)) {
      results.push(rowData);
    }
  }
  
  return { success: true, data: results };
}

function getMaknaByKata(userId, surah, ayat, kataIndex) {
  const sheet = getMaknaSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    
    if (rowData.user_id === userId && 
        parseInt(rowData.surah) === parseInt(surah) &&
        parseInt(rowData.ayat) === parseInt(ayat) &&
        parseInt(rowData.kata_index) === parseInt(kataIndex)) {
      return { success: true, data: rowData };
    }
  }
  
  return { success: true, data: null };
}

function saveMakna(maknaData) {
  const sheet = getMaknaSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Cari row yang sudah ada
  let existingRow = -1;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === maknaData.user_id && 
        parseInt(row[2]) === parseInt(maknaData.surah) &&
        parseInt(row[3]) === parseInt(maknaData.ayat) &&
        parseInt(row[4]) === parseInt(maknaData.kata_index)) {
      existingRow = i + 1;
      break;
    }
  }
  
  const rowData = [
    maknaData.id || Utilities.getUuid(),
    maknaData.user_id,
    parseInt(maknaData.surah),
    parseInt(maknaData.ayat),
    parseInt(maknaData.kata_index),
    maknaData.kata_text,
    maknaData.makna,
    new Date().toISOString()
  ];
  
  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Tambah row baru
    sheet.appendRow(rowData);
  }
  
  return { success: true, data: { ...maknaData, id: rowData[0] } };
}

function deleteMakna(userId, surah, ayat, kataIndex) {
  const sheet = getMaknaSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (row[1] === userId && 
        parseInt(row[2]) === parseInt(surah) &&
        parseInt(row[3]) === parseInt(ayat) &&
        parseInt(row[4]) === parseInt(kataIndex)) {
      sheet.deleteRow(i + 1);
    }
  }
  
  return { success: true, data: 'Deleted successfully' };
}

// ===== FUNGSI UNTUK DATA CATATAN =====

function getCatatanSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_CATATAN);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_CATATAN);
    // Buat header
    sheet.getRange('A1:E1').setValues([[
      'id', 'user_id', 'surah', 'ayat', 'catatan', 'timestamp'
    ]]);
  }
  
  return sheet;
}

function getCatatanBySurah(userId, surah) {
  const sheet = getCatatanSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    
    if (rowData.user_id === userId && parseInt(rowData.surah) === parseInt(surah)) {
      results.push(rowData);
    }
  }
  
  return { success: true, data: results };
}

function getCatatanByAyat(userId, surah, ayat) {
  const sheet = getCatatanSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowData = {};
    
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    
    if (rowData.user_id === userId && 
        parseInt(rowData.surah) === parseInt(surah) &&
        parseInt(rowData.ayat) === parseInt(ayat)) {
      return { success: true, data: rowData };
    }
  }
  
  return { success: true, data: null };
}

function saveCatatan(catatanData) {
  const sheet = getCatatanSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Cari row yang sudah ada
  let existingRow = -1;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === catatanData.user_id && 
        parseInt(row[2]) === parseInt(catatanData.surah) &&
        parseInt(row[3]) === parseInt(catatanData.ayat)) {
      existingRow = i + 1;
      break;
    }
  }
  
  const rowData = [
    catatanData.id || Utilities.getUuid(),
    catatanData.user_id,
    parseInt(catatanData.surah),
    parseInt(catatanData.ayat),
    catatanData.catatan,
    new Date().toISOString()
  ];
  
  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Tambah row baru
    sheet.appendRow(rowData);
  }
  
  return { success: true, data: { ...catatanData, id: rowData[0] } };
}

function deleteCatatan(userId, surah, ayat) {
  const sheet = getCatatanSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (row[1] === userId && 
        parseInt(row[2]) === parseInt(surah) &&
        parseInt(row[3]) === parseInt(ayat)) {
      sheet.deleteRow(i + 1);
    }
  }
  
  return { success: true, data: 'Deleted successfully' };
}