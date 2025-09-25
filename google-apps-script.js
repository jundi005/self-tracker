// Google Apps Script Web App Backend for Self Tracker
// SETUP INSTRUCTIONS:
// 1. Buat spreadsheet baru di Google Sheets atau gunakan yang sudah ada
// 2. Buka spreadsheet tersebut, copy ID dari URL
//    Contoh URL: https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit#gid=0
//    ID nya adalah: 1A2B3C4D5E6F7G8H9I0J (bagian setelah /d/ dan sebelum /edit)
// 3. Paste ID tersebut ke SPREADSHEET_ID di CONFIG di bawah ini
// 4. Deploy as Web App dengan setting:
//    - Execute as: Me 
//    - Who has access: Anyone (PENTING untuk CORS!)
// 5. Copy deployment URL dan masukkan ke setting aplikasi
// 6. Script akan otomatis membuat sheet dan header yang diperlukan dalam spreadsheet Anda

// Configuration - WAJIB ISI SPREADSHEET_ID!
const CONFIG = {
  // WAJIB: Ganti dengan ID spreadsheet Anda! 
  // ID bisa didapat dari URL spreadsheet: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  SPREADSHEET_ID: 'GANTI_DENGAN_ID_SPREADSHEET_ANDA', // WAJIB diisi dengan ID spreadsheet yang sudah ada!
  SPREADSHEET_NAME: 'Self Tracker Data', // Hanya untuk reference, tidak digunakan untuk membuat spreadsheet baru
  SHEETS: {
    DAILY: 'Daily',
    WEEKLY: 'Weekly', 
    MONTHLY: 'Monthly',
    FINANCE: 'Finance',
    BUSINESS: 'Business',
    SETTINGS: 'Settings'
  }
};

// Main entry point for all requests
function doPost(e) {
  return doGet(e);
}

function doGet(e) {
  try {
    // Google Apps Script handles CORS automatically when deployed with 'Anyone' access

    // Authentication handled by Google Apps Script deployment settings
    // Deploy with 'Execute as: Me' and 'Who has access: Anyone'

    // Get action from query parameter
    const action = e.parameter.action || 'health';
    
    // Parse request body for POST data
    let requestData = {};
    if (e.postData && e.postData.contents) {
      try {
        // Handle both JSON and text/plain content types
        if (e.postData.type === 'text/plain' || e.postData.type === 'application/json') {
          requestData = JSON.parse(e.postData.contents);
        } else {
          requestData = JSON.parse(e.postData.contents);
        }
      } catch (err) {
        console.error('Failed to parse request data:', err);
        // If JSON parsing fails, try to parse as form data
        if (e.parameter && e.parameter.payload) {
          try {
            requestData = JSON.parse(e.parameter.payload);
          } catch (err2) {
            console.error('Failed to parse payload parameter:', err2);
          }
        }
      }
    }

    // Route to appropriate handler
    let result;
    switch (action) {
      case 'health':
        result = handleHealth();
        break;
      case 'init':
        result = handleInit();
        break;
      case 'pull':
        result = handlePull();
        break;
      case 'push':
        result = handlePush(requestData);
        break;
      case 'create':
        result = handleCreate(requestData);
        break;
      case 'update':
        result = handleUpdate(requestData);
        break;
      case 'delete':
        result = handleDelete(requestData);
        break;
      default:
        result = { error: 'Invalid action: ' + action };
    }

    return createResponse(result, 200);

  } catch (error) {
    console.error('Error in main handler:', error);
    return createResponse({ 
      error: 'Internal server error: ' + error.message 
    }, 500);
  }
}

// Get spreadsheet by configured ID (TIDAK akan membuat spreadsheet baru)
function getOrCreateSpreadsheet() {
  try {
    // Validasi konfigurasi
    if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'GANTI_DENGAN_ID_SPREADSHEET_ANDA') {
      throw new Error('SPREADSHEET_ID belum dikonfigurasi! Silakan edit CONFIG.SPREADSHEET_ID dengan ID spreadsheet Anda.');
    }
    
    try {
      // Buka spreadsheet berdasarkan ID yang dikonfigurasi
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      console.log('Successfully opened spreadsheet:', spreadsheet.getName(), 'ID:', CONFIG.SPREADSHEET_ID);
      return spreadsheet;
    } catch (openError) {
      console.error('Error accessing configured spreadsheet:', openError);
      
      // Berikan pesan error yang jelas
      const errorMsg = openError.toString().toLowerCase();
      if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        throw new Error(`Spreadsheet dengan ID '${CONFIG.SPREADSHEET_ID}' tidak ditemukan. Pastikan ID benar dan Anda memiliki akses ke spreadsheet tersebut.`);
      } else if (errorMsg.includes('access denied') || errorMsg.includes('permission denied')) {
        throw new Error(`Akses ditolak ke spreadsheet '${CONFIG.SPREADSHEET_ID}'. Pastikan Anda memiliki permission untuk mengakses spreadsheet tersebut.`);
      } else {
        // Retry sekali untuk error transient
        console.log('Retrying spreadsheet access...');
        Utilities.sleep(1000);
        try {
          return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
        } catch (retryError) {
          throw new Error(`Gagal mengakses spreadsheet: ${openError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in getOrCreateSpreadsheet:', error);
    throw error;
  }
}

// Create HTTP response
function createResponse(data, statusCode = 200, headers = {}) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Health check endpoint
function handleHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
}

// Initialize sheets dalam spreadsheet yang sudah ada (TIDAK membuat spreadsheet baru)
function handleInit() {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    
    // Buat sheets jika belum ada (hanya sheets, bukan spreadsheet baru)
    const createdSheets = [];
    const existingSheets = [];
    
    Object.values(CONFIG.SHEETS).forEach(sheetName => {
      let sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        setupSheetHeaders(sheet, sheetName);
        createdSheets.push(sheetName);
        console.log('Created new sheet:', sheetName);
      } else {
        existingSheets.push(sheetName);
        console.log('Sheet already exists:', sheetName);
      }
    });

    return {
      success: true,
      message: `Sheets initialized successfully dalam spreadsheet: ${spreadsheet.getName()}`,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      spreadsheetName: spreadsheet.getName(),
      allSheets: Object.values(CONFIG.SHEETS),
      createdSheets: createdSheets,
      existingSheets: existingSheets
    };
  } catch (error) {
    console.error('Init error:', error);
    return { error: 'Failed to initialize sheets: ' + error.message };
  }
}

// Setup headers for different sheet types
function setupSheetHeaders(sheet, sheetName) {
  let headers = [];
  
  switch (sheetName) {
    case CONFIG.SHEETS.DAILY:
    case CONFIG.SHEETS.WEEKLY:
    case CONFIG.SHEETS.MONTHLY:
      headers = ['id', 'name', 'data', 'created_at', 'updated_at'];
      break;
    case CONFIG.SHEETS.FINANCE:
      headers = ['id', 'date', 'category', 'description', 'income', 'outcome', 'created_at', 'updated_at'];
      break;
    case CONFIG.SHEETS.BUSINESS:
      headers = ['id', 'date', 'type', 'income', 'outcome', 'note', 'created_at', 'updated_at'];
      break;
    case CONFIG.SHEETS.SETTINGS:
      headers = ['key', 'value', 'updated_at'];
      break;
    default:
      headers = ['id', 'data', 'created_at', 'updated_at'];
  }
  
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

// Pull all data from spreadsheet
function handlePull() {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    const data = {};

    // Pull checklist data (daily, weekly, monthly)
    ['daily', 'weekly', 'monthly'].forEach(type => {
      const sheetName = CONFIG.SHEETS[type.toUpperCase()];
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (sheet) {
        data[type] = getChecklistData(sheet);
      } else {
        data[type] = [];
      }
    });

    // Pull transaction data (finance, business)
    ['finance', 'business'].forEach(type => {
      const sheetName = CONFIG.SHEETS[type.toUpperCase()];
      const sheet = spreadsheet.getSheetByName(sheetName);
      
      if (sheet) {
        data[type] = getTransactionData(sheet, type);
      } else {
        data[type] = [];
      }
    });

    // Pull settings
    const settingsSheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SETTINGS);
    if (settingsSheet) {
      data.settings = getSettingsData(settingsSheet);
    } else {
      data.settings = {};
    }

    return { data };
  } catch (error) {
    console.error('Pull error:', error);
    return { error: 'Failed to pull data: ' + error.message };
  }
}

// Push data to spreadsheet
function handlePush(requestData) {
  try {
    const spreadsheet = getOrCreateSpreadsheet();
    
    // Push each data type
    Object.keys(requestData).forEach(type => {
      if (type === 'settings') {
        pushSettingsData(spreadsheet, requestData[type]);
      } else {
        pushDataToSheet(spreadsheet, type, requestData[type]);
      }
    });

    return { success: true, message: 'Data pushed successfully' };
  } catch (error) {
    console.error('Push error:', error);
    return { error: 'Failed to push data: ' + error.message };
  }
}

// Create new item
function handleCreate(requestData) {
  try {
    const { type, item } = requestData;
    const spreadsheet = getOrCreateSpreadsheet();
    
    const result = addItemToSheet(spreadsheet, type, item);
    return { success: true, data: result };
  } catch (error) {
    console.error('Create error:', error);
    return { error: 'Failed to create item: ' + error.message };
  }
}

// Update existing item
function handleUpdate(requestData) {
  try {
    const { type, id, updates } = requestData;
    const spreadsheet = getOrCreateSpreadsheet();
    
    const result = updateItemInSheet(spreadsheet, type, id, updates);
    return { success: true, data: result };
  } catch (error) {
    console.error('Update error:', error);
    return { error: 'Failed to update item: ' + error.message };
  }
}

// Delete item
function handleDelete(requestData) {
  try {
    const { type, id } = requestData;
    const spreadsheet = getOrCreateSpreadsheet();
    
    const result = deleteItemFromSheet(spreadsheet, type, id);
    return { success: true, data: result };
  } catch (error) {
    console.error('Delete error:', error);
    return { error: 'Failed to delete item: ' + error.message };
  }
}

// Helper functions for data operations

function getChecklistData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const item = {
      id: parseInt(row[0]) || 0,
      name: row[1] || '',
      created_at: row[3] || new Date().toISOString(),
      updated_at: row[4] || new Date().toISOString()
    };
    
    // Parse data field (JSON string containing days/weeks/months)
    try {
      const parsedData = JSON.parse(row[2] || '{}');
      if (parsedData.days) item.days = parsedData.days;
      if (parsedData.weeks) item.weeks = parsedData.weeks;
      if (parsedData.months) item.months = parsedData.months;
    } catch (e) {
      // Initialize empty data structures
      item.days = {};
      item.weeks = {};
      item.months = {};
    }
    
    return item;
  }).filter(item => item.id > 0);
}

function getTransactionData(sheet, type) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const item = {
      id: parseInt(row[0]) || 0,
      date: row[1] || '',
      created_at: row[row.length - 2] || new Date().toISOString(),
      updated_at: row[row.length - 1] || new Date().toISOString()
    };
    
    if (type === 'finance') {
      item.category = row[2] || '';
      item.description = row[3] || '';
      item.income = parseFloat(row[4]) || 0;
      item.outcome = parseFloat(row[5]) || 0;
    } else if (type === 'business') {
      item.type = row[2] || '';
      item.income = parseFloat(row[3]) || 0;
      item.outcome = parseFloat(row[4]) || 0;
      item.note = row[5] || '';
    }
    
    return item;
  }).filter(item => item.id > 0);
}

function getSettingsData(sheet) {
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  data.slice(1).forEach(row => {
    const key = row[0];
    let value = row[1];
    
    // Try to parse JSON values
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    
    settings[key] = value;
  });
  
  return settings;
}

function pushDataToSheet(spreadsheet, type, data) {
  const sheetName = CONFIG.SHEETS[type.toUpperCase()];
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    setupSheetHeaders(sheet, sheetName);
  }
  
  // Clear existing data (except headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Add new data
  if (data && data.length > 0) {
    const rows = data.map(item => {
      if (['daily', 'weekly', 'monthly'].includes(type)) {
        const dataObj = {};
        if (item.days) dataObj.days = item.days;
        if (item.weeks) dataObj.weeks = item.weeks;
        if (item.months) dataObj.months = item.months;
        
        return [
          item.id,
          item.name,
          JSON.stringify(dataObj),
          item.created_at,
          item.updated_at
        ];
      } else if (type === 'finance') {
        return [
          item.id,
          item.date,
          item.category,
          item.description,
          item.income,
          item.outcome,
          item.created_at,
          item.updated_at
        ];
      } else if (type === 'business') {
        return [
          item.id,
          item.date,
          item.type,
          item.income,
          item.outcome,
          item.note || '',
          item.created_at,
          item.updated_at
        ];
      }
    });
    
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function pushSettingsData(spreadsheet, settings) {
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.SETTINGS);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEETS.SETTINGS);
    setupSheetHeaders(sheet, CONFIG.SHEETS.SETTINGS);
  }
  
  // Clear existing data (except headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Add settings data
  const rows = Object.keys(settings).map(key => {
    let value = settings[key];
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    return [key, value, new Date().toISOString()];
  });
  
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}

function addItemToSheet(spreadsheet, type, item) {
  const sheetName = CONFIG.SHEETS[type.toUpperCase()];
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    setupSheetHeaders(sheet, sheetName);
  }
  
  // Add item to sheet
  const lastRow = sheet.getLastRow() + 1;
  let values = [];
  
  if (['daily', 'weekly', 'monthly'].includes(type)) {
    const dataObj = {};
    if (item.days) dataObj.days = item.days;
    if (item.weeks) dataObj.weeks = item.weeks;
    if (item.months) dataObj.months = item.months;
    
    values = [item.id, item.name, JSON.stringify(dataObj), item.created_at, item.updated_at];
  } else if (type === 'finance') {
    values = [item.id, item.date, item.category, item.description, item.income, item.outcome, item.created_at, item.updated_at];
  } else if (type === 'business') {
    values = [item.id, item.date, item.type, item.income, item.outcome, item.note || '', item.created_at, item.updated_at];
  }
  
  sheet.getRange(lastRow, 1, 1, values.length).setValues([values]);
  return item;
}

function updateItemInSheet(spreadsheet, type, id, updates) {
  const sheetName = CONFIG.SHEETS[type.toUpperCase()];
  const sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  
  // Find the row with the matching ID
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, index) => index > 0 && parseInt(row[0]) === id);
  
  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }
  
  // Update the row
  const actualRowIndex = rowIndex + 1; // +1 because findIndex is 0-based but sheet rows are 1-based
  
  if (updates.name) {
    sheet.getRange(actualRowIndex, 2).setValue(updates.name);
  }
  
  if (updates.days || updates.weeks || updates.months) {
    const currentData = JSON.parse(data[rowIndex][2] || '{}');
    if (updates.days) currentData.days = updates.days;
    if (updates.weeks) currentData.weeks = updates.weeks;
    if (updates.months) currentData.months = updates.months;
    sheet.getRange(actualRowIndex, 3).setValue(JSON.stringify(currentData));
  }
  
  // Update other fields based on type
  if (type === 'finance') {
    if (updates.date) sheet.getRange(actualRowIndex, 2).setValue(updates.date);
    if (updates.category) sheet.getRange(actualRowIndex, 3).setValue(updates.category);
    if (updates.description) sheet.getRange(actualRowIndex, 4).setValue(updates.description);
    if (updates.income !== undefined) sheet.getRange(actualRowIndex, 5).setValue(updates.income);
    if (updates.outcome !== undefined) sheet.getRange(actualRowIndex, 6).setValue(updates.outcome);
  } else if (type === 'business') {
    if (updates.date) sheet.getRange(actualRowIndex, 2).setValue(updates.date);
    if (updates.type) sheet.getRange(actualRowIndex, 3).setValue(updates.type);
    if (updates.income !== undefined) sheet.getRange(actualRowIndex, 4).setValue(updates.income);
    if (updates.outcome !== undefined) sheet.getRange(actualRowIndex, 5).setValue(updates.outcome);
    if (updates.note) sheet.getRange(actualRowIndex, 6).setValue(updates.note);
  }
  
  // Update timestamp
  sheet.getRange(actualRowIndex, sheet.getLastColumn()).setValue(new Date().toISOString());
  
  return { id, updates };
}

function deleteItemFromSheet(spreadsheet, type, id) {
  const sheetName = CONFIG.SHEETS[type.toUpperCase()];
  const sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  
  // Find the row with the matching ID
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex((row, index) => index > 0 && parseInt(row[0]) === id);
  
  if (rowIndex === -1) {
    throw new Error(`Item with ID ${id} not found`);
  }
  
  // Delete the row
  const actualRowIndex = rowIndex + 1; // +1 because findIndex is 0-based but sheet rows are 1-based
  sheet.deleteRow(actualRowIndex);
  
  return { id, deleted: true };
}