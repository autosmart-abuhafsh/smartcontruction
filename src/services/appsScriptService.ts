import { SmartBuildDatabase } from '../types/smartbuild';

export interface AppsScriptConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
  connectionStatus: 'disconnected' | 'connected' | 'syncing' | 'error';
  lastMessage: string;
}

export const DEFAULT_APPS_SCRIPT_CONFIG: AppsScriptConfig = {
  webAppUrl: '',
  autoSync: false,
  lastSyncedAt: null,
  connectionStatus: 'disconnected',
  lastMessage: 'Mode Penyimpanan Lokal Aktif (Siap dihubungkan ke Google Apps Script Web App URL).',
};

export function isValidAppsScriptUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://script.google.com/macros/s/') &&
    (trimmed.endsWith('/exec') || trimmed.endsWith('/dev'))
  );
}

export async function testAppsScriptConnection(webAppUrl: string): Promise<{
  ok: boolean;
  message: string;
}> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return {
      ok: false,
      message:
        'Format URL tidak valid. Gunakan URL Web App Google Apps Script (https://script.google.com/macros/s/.../exec).',
    };
  }
  try {
    const response = await fetch(`${webAppUrl.trim()}?action=PING`, {
      method: 'GET',
      mode: 'cors',
    });
    if (!response.ok) {
      return {
        ok: false,
        message: `Server merespons dengan status HTTP ${response.status}. Pastikan akses Web App disetel ke "Anyone".`,
      };
    }
    const json = await response.json();
    return {
      ok: Boolean(json.ok),
      message: json.ok
        ? `Terhubung ke ${json.service || 'Google Apps Script SmartBuild DB'} (${json.timestamp || 'OK'})`
        : json.error || 'Respons server tidak valid.',
    };
  } catch (err) {
    return {
      ok: false,
      message: `Gagal menghubungi Apps Script: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function syncDatabaseToAppsScript(
  webAppUrl: string,
  database: SmartBuildDatabase
): Promise<{ ok: boolean; message: string; timestamp?: string }> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return {
      ok: false,
      message:
        'Masukkan URL Web App Google Apps Script yang valid terlebih dahulu (https://script.google.com/macros/s/.../exec).',
    };
  }
  try {
    const response = await fetch(webAppUrl.trim(), {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'SYNC_DATABASE',
        database,
      }),
    });
    const json = await response.json();
    if (json && json.ok) {
      return {
        ok: true,
        message: json.message || 'Seluruh 18 tabel berhasil disinkronkan ke Google Sheets.',
        timestamp: json.timestamp || new Date().toISOString(),
      };
    }
    return {
      ok: false,
      message: json?.error || 'Gagal menyinkronkan data ke Google Sheets.',
    };
  } catch (err) {
    return {
      ok: false,
      message: `Koneksi ke Google Apps Script gagal: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

export async function pullDatabaseFromAppsScript(
  webAppUrl: string
): Promise<{ ok: boolean; message: string; data?: Partial<SmartBuildDatabase> }> {
  if (!isValidAppsScriptUrl(webAppUrl)) {
    return {
      ok: false,
      message: 'Format URL Google Apps Script tidak valid.',
    };
  }
  try {
    const response = await fetch(`${webAppUrl.trim()}?action=GET_ALL_DATA`, {
      method: 'GET',
      mode: 'cors',
    });
    const json = await response.json();
    if (json && json.ok && json.data) {
      return {
        ok: true,
        message: 'Data berhasil ditarik dari Google Sheets Apps Script.',
        data: json.data,
      };
    }
    return {
      ok: false,
      message: json?.error || 'Data kosong atau format tidak sesuai.',
    };
  } catch (err) {
    return {
      ok: false,
      message: `Gagal menarik data dari Google Apps Script: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

export const CODE_GS_SOURCE = `/**
 * ============================================================================
 * SMARTBUILD ENTERPRISE - GOOGLE APPS SCRIPT BACKEND API (code.gs)
 * Construction Contract, BIM & Smart Contract Management System
 * ============================================================================
 * Petunjuk Deployment:
 * 1. Buka Google Spreadsheet baru -> Extensions -> Apps Script.
 * 2. Buat 2 file script: \`code.gs\` (file ini) dan \`setup.gs\`.
 * 3. Jalankan fungsi \`setupSmartBuildDatabase()\` pada \`setup.gs\` satu kali.
 * 4. Klik Deploy -> New Deployment -> Select type: Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin Web App URL (\`https://script.google.com/macros/s/.../exec\`)
 *    ke menu Pengaturan -> Integrasi Database Apps Script di aplikasi SmartBuild.
 */

var TABLES = [
  'users', 'organizations', 'projects', 'project_members',
  'contracts', 'contract_parties', 'contract_milestones',
  'progress_reports', 'progress_attachments', 'verifications',
  'bim_models', 'smart_contracts', 'payment_schedules',
  'payments', 'transactions', 'notifications',
  'activity_logs', 'system_settings'
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
    return createJsonResponse({ ok: false, error: String(err) });
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

    return createJsonResponse({ ok: false, error: 'Action tidak dikenali: ' + action });
  } catch (err) {
    return createJsonResponse({ ok: false, error: String(err) });
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
      var jsonColIndex = headers.indexOf('_raw_json');
      if (jsonColIndex !== -1 && values[r][jsonColIndex]) {
        try {
          rows.push(JSON.parse(values[r][jsonColIndex]));
          continue;
        } catch (parseErr) {}
      }
      var rowObj = {};
      for (var c = 0; c < headers.length; c++) {
        rowObj[headers[c]] = values[r][c];
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
  var sheet = ss.getSheetByName(tableName) || ss.insertSheet(tableName);
  sheet.clearContents();
  if (!records || records.length === 0) {
    sheet.appendRow(['id', '_raw_json']);
    return;
  }
  var keys = Object.keys(records[0]);
  if (keys.indexOf('_raw_json') === -1) keys.push('_raw_json');
  sheet.appendRow(keys);

  var rowsToInsert = records.map(function(item) {
    return keys.map(function(colName) {
      if (colName === '_raw_json') return JSON.stringify(item);
      var val = item[colName];
      return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : (val !== undefined ? val : '');
    });
  });

  if (rowsToInsert.length > 0) {
    sheet.getRange(2, 1, rowsToInsert.length, keys.length).setValues(rowsToInsert);
  }
}

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const SETUP_GS_SOURCE = `/**
 * ============================================================================
 * SMARTBUILD ENTERPRISE - DATABASE INITIALIZER & SCHEMA SETUP (setup.gs)
 * Construction Contract, BIM & Smart Contract Management System
 * ============================================================================
 * Jalankan fungsi \`setupSmartBuildDatabase()\` ini satu kali di editor
 * Google Apps Script untuk membuat seluruh 18 sheet/tabel relasional beserta
 * format header Navy Blue (#071D49).
 */

var SMARTBUILD_SCHEMA = {
  users: ['id', 'name', 'email', 'role', 'organizationId', 'organizationName', 'position', 'phone', 'status', 'createdAt', '_raw_json'],
  organizations: ['id', 'name', 'type', 'npwp', 'address', 'phone', 'verified', '_raw_json'],
  projects: ['id', 'code', 'name', 'category', 'description', 'location', 'clientId', 'clientName', 'contractorId', 'contractorName', 'verifikatorId', 'verifikatorName', 'contractValue', 'startDate', 'targetEndDate', 'status', 'overallProgress', 'isDemo', '_raw_json'],
  project_members: ['id', 'projectId', 'userId', 'roleInProject', 'assignedAt', '_raw_json'],
  contracts: ['id', 'contractNumber', 'projectId', 'projectName', 'workDescription', 'totalValue', 'durationDays', 'contractDate', 'status', 'clientApproved', 'contractorApproved', 'isDemo', '_raw_json'],
  contract_parties: ['id', 'contractId', 'userId', 'role', 'name', 'organization', 'approved', 'approvedAt', 'digitalSignatureHash', '_raw_json'],
  contract_milestones: ['id', 'contractId', 'projectId', 'order', 'name', 'description', 'weightPercentage', 'targetProgress', 'realizedProgress', 'nominalValue', 'dueDate', 'status', '_raw_json'],
  progress_reports: ['id', 'projectId', 'projectName', 'milestoneId', 'milestoneName', 'targetPercentage', 'submittedPercentage', 'reportDate', 'workDescription', 'submittedBy', 'verificationStatus', 'isDemo', '_raw_json'],
  progress_attachments: ['id', 'reportId', 'fileName', 'fileType', 'fileSize', 'uploadedAt', '_raw_json'],
  verifications: ['id', 'reportId', 'projectId', 'projectName', 'milestoneId', 'milestoneName', 'submittedPercentage', 'approvedPercentage', 'verifierId', 'verifierName', 'verificationDate', 'status', 'bimChecked', '_raw_json'],
  bim_models: ['id', 'projectId', 'projectName', 'modelName', 'format', 'version', 'fileSize', 'modelUrl', 'integrationStatus', 'lastUpdated', '_raw_json'],
  smart_contracts: ['id', 'projectId', 'projectName', 'contractId', 'contractAddress', 'networkName', 'deploymentStatus', 'autoReleaseOnVerification', 'lastTxHash', '_raw_json'],
  payment_schedules: ['id', 'contractId', 'projectId', 'projectName', 'milestoneId', 'termNumber', 'milestoneName', 'percentage', 'nominal', 'status', 'paidAt', 'txHash', 'proofRef', '_raw_json'],
  payments: ['id', 'scheduleId', 'projectId', 'projectName', 'termName', 'amount', 'status', 'processedAt', 'proofNumber', '_raw_json'],
  transactions: ['id', 'date', 'projectId', 'projectName', 'milestoneName', 'sender', 'receiver', 'nominal', 'paymentMethod', 'status', 'txHash', 'isDemo', '_raw_json'],
  notifications: ['id', 'title', 'message', 'category', 'createdAt', 'read', '_raw_json'],
  activity_logs: ['id', 'timestamp', 'actorName', 'actorRole', 'action', 'module', 'details', 'ipSimulation', '_raw_json'],
  system_settings: ['id', 'platformName', 'simulationModeBanner', 'bimAdapterEndpoint', 'blockchainRpcAdapter', 'escrowAutoTrigger', 'strictRbacEnforcement', '_raw_json']
};

function setupSmartBuildDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tableNames = Object.keys(SMARTBUILD_SCHEMA);

  for (var i = 0; i < tableNames.length; i++) {
    var tableName = tableNames[i];
    var columns = SMARTBUILD_SCHEMA[tableName];
    var sheet = ss.getSheetByName(tableName) || ss.insertSheet(tableName);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(columns);
    } else {
      sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    }

    var headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setBackground('#071D49');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('Inisialisasi 18 tabel database SmartBuild selesai!');
  return 'Berhasil menyiapkan 18 tabel database SmartBuild di Google Sheets.';
}`;
