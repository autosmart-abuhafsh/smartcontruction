/**
 * ============================================================================
 * SMARTBUILD ENTERPRISE - GOOGLE APPS SCRIPT BACKEND API (code.gs)
 * Construction Contract, BIM & Smart Contract Management System
 * ============================================================================
 * Petunjuk Deployment:
 * 1. Buka Google Spreadsheet baru -> Extensions -> Apps Script.
 * 2. Buat 2 file script: `code.gs` (file ini) dan `setup.gs`.
 * 3. Jalankan fungsi `setupSmartBuildDatabase()` pada `setup.gs` satu kali.
 * 4. Klik Deploy -> New Deployment -> Select type: Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin Web App URL (`https://script.google.com/macros/s/.../exec`)
 *    ke menu Pengaturan -> Integrasi Database Apps Script di aplikasi SmartBuild.
 */

var TABLES = [
  'users',
  'organizations',
  'projects',
  'project_members',
  'contracts',
  'contract_parties',
  'contract_milestones',
  'progress_reports',
  'progress_attachments',
  'verifications',
  'bim_models',
  'smart_contracts',
  'payment_schedules',
  'payments',
  'transactions',
  'notifications',
  'activity_logs',
  'system_settings'
];

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'GET_ALL_DATA';
    if (action === 'PING') {
      return createJsonResponse({
        ok: true,
        service: 'SmartBuild Apps Script Database Engine v1.0',
        timestamp: new Date().toISOString(),
        tables: TABLES
      });
    }
    var db = readFullDatabaseFromSheets();
    return createJsonResponse({
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      data: db
    });
  } catch (err) {
    return createJsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function doPost(e) {
  try {
    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var action = payload.action || 'SYNC_DATABASE';

    if (action === 'PING') {
      return createJsonResponse({
        ok: true,
        service: 'SmartBuild Apps Script Database Engine v1.0',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'SYNC_DATABASE' && payload.database) {
      writeFullDatabaseToSheets(payload.database);
      return createJsonResponse({
        ok: true,
        action: 'SYNC_DATABASE',
        message: 'Seluruh 18 tabel database SmartBuild berhasil disinkronkan ke Google Sheets.',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'UPSERT_TABLE' && payload.table && payload.records) {
      writeTableToSheet(payload.table, payload.records);
      return createJsonResponse({
        ok: true,
        action: 'UPSERT_TABLE',
        table: payload.table,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'GET_ALL_DATA') {
      var db = readFullDatabaseFromSheets();
      return createJsonResponse({
        ok: true,
        action: 'GET_ALL_DATA',
        timestamp: new Date().toISOString(),
        data: db
      });
    }

    return createJsonResponse({
      ok: false,
      error: 'Action tidak dikenali: ' + action
    });
  } catch (err) {
    return createJsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function readFullDatabaseFromSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};

  for (var i = 0; i < TABLES.length; i++) {
    var tableName = TABLES[i];
    var sheet = ss.getSheetByName(tableName);
    if (!sheet || sheet.getLastRow() < 2) {
      result[tableName] = (tableName === 'system_settings') ? null : [];
      continue;
    }
    var values = sheet.getDataRange().getValues();
    var headers = values[0];
    var rows = [];
    for (var r = 1; r < values.length; r++) {
      var rowObj = {};
      var jsonColIndex = headers.indexOf('_raw_json');
      if (jsonColIndex !== -1 && values[r][jsonColIndex]) {
        try {
          rowObj = JSON.parse(values[r][jsonColIndex]);
          rows.push(rowObj);
          continue;
        } catch (parseErr) {}
      }
      for (var c = 0; c < headers.length; c++) {
        var key = headers[c];
        var cellVal = values[r][c];
        if (typeof cellVal === 'string' && (cellVal.indexOf('[') === 0 || cellVal.indexOf('{') === 0)) {
          try {
            rowObj[key] = JSON.parse(cellVal);
          } catch (e) {
            rowObj[key] = cellVal;
          }
        } else {
          rowObj[key] = cellVal;
        }
      }
      rows.push(rowObj);
    }
    result[tableName] = (tableName === 'system_settings') ? (rows[0] || null) : rows;
  }
  return result;
}

function writeFullDatabaseToSheets(database) {
  for (var i = 0; i < TABLES.length; i++) {
    var tableName = TABLES[i];
    var records = database[tableName];
    if (!records) continue;
    if (tableName === 'system_settings' && !Array.isArray(records)) {
      writeTableToSheet(tableName, [records]);
    } else if (Array.isArray(records)) {
      writeTableToSheet(tableName, records);
    }
  }
}

function writeTableToSheet(tableName, records) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    sheet = ss.insertSheet(tableName);
  }
  sheet.clearContents();
  if (!records || records.length === 0) {
    sheet.appendRow(['id', '_raw_json', 'updatedAt']);
    return;
  }
  var sample = records[0];
  var keys = Object.keys(sample);
  if (keys.indexOf('_raw_json') === -1) {
    keys.push('_raw_json');
  }
  sheet.appendRow(keys);

  var rowsToInsert = [];
  for (var r = 0; r < records.length; r++) {
    var item = records[r];
    var row = [];
    for (var k = 0; k < keys.length; k++) {
      var colName = keys[k];
      if (colName === '_raw_json') {
        row.push(JSON.stringify(item));
      } else {
        var val = item[colName];
        if (typeof val === 'object' && val !== null) {
          row.push(JSON.stringify(val));
        } else {
          row.push(val !== undefined ? val : '');
        }
      }
    }
    rowsToInsert.push(row);
  }

  if (rowsToInsert.length > 0) {
    sheet.getRange(2, 1, rowsToInsert.length, keys.length).setValues(rowsToInsert);
  }
}

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
