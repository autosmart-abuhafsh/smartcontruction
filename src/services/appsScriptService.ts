import { SmartBuildDatabase } from '../types/smartbuild';

export interface AppsScriptConfig {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
  connectionStatus: 'disconnected' | 'connected' | 'syncing' | 'error';
  lastMessage: string;
  isFromEnv?: boolean;
  envVarName?: string;
}

export function isValidAppsScriptUrl(url: string): boolean {
  const trimmed = (url || '').trim();
  if (!trimmed) return false;
  if (trimmed.includes('YOUR_DEPLOYMENT_ID')) return false;
  return (
    trimmed.startsWith('https://script.google.com/macros/s/') &&
    (trimmed.endsWith('/exec') || trimmed.endsWith('/dev'))
  );
}

export function getEnvAppsScriptUrl(): { url: string; varName: string } {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
    const candidates: Array<[string, string | undefined]> = [
      ['VITE_APPS_SCRIPT_URL', metaEnv.VITE_APPS_SCRIPT_URL],
      ['APPS_SCRIPT_URL', metaEnv.APPS_SCRIPT_URL],
      ['VITE_GAS_URL', metaEnv.VITE_GAS_URL],
      ['GAS_URL', metaEnv.GAS_URL],
      ['VITE_GOOGLE_APPS_SCRIPT_URL', metaEnv.VITE_GOOGLE_APPS_SCRIPT_URL],
      ['GOOGLE_APPS_SCRIPT_URL', metaEnv.GOOGLE_APPS_SCRIPT_URL],
      ['VITE_RESOLVED_APPS_SCRIPT_URL', metaEnv.VITE_RESOLVED_APPS_SCRIPT_URL],
    ];

    for (const [name, val] of candidates) {
      if (val && isValidAppsScriptUrl(val)) {
        return {
          url: val.trim(),
          varName: name === 'VITE_RESOLVED_APPS_SCRIPT_URL' ? 'VITE_APPS_SCRIPT_URL / APPS_SCRIPT_URL' : name,
        };
      }
    }
  } catch {
    // ignore env lookup errors in non-Vite test environments
  }
  return { url: '', varName: '' };
}

export function getEnvAppsScriptAutoSync(): boolean {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
    const raw =
      metaEnv.VITE_APPS_SCRIPT_AUTO_SYNC ||
      metaEnv.APPS_SCRIPT_AUTO_SYNC ||
      metaEnv.VITE_RESOLVED_APPS_SCRIPT_AUTO_SYNC ||
      'true';
    return String(raw).toLowerCase() !== 'false';
  } catch {
    return true;
  }
}

const detectedEnv = getEnvAppsScriptUrl();
const detectedAutoSync = getEnvAppsScriptAutoSync();

export const DEFAULT_APPS_SCRIPT_CONFIG: AppsScriptConfig = {
  webAppUrl: detectedEnv.url,
  autoSync: detectedEnv.url ? detectedAutoSync : false,
  lastSyncedAt: null,
  connectionStatus: detectedEnv.url ? 'connected' : 'disconnected',
  lastMessage: detectedEnv.url
    ? `Terhubung otomatis dari Environment Variable Vercel (${detectedEnv.varName}).`
    : 'Mode Penyimpanan Lokal Aktif (Siap dihubungkan ke Google Apps Script via Vercel Environment Variable VITE_APPS_SCRIPT_URL).',
  isFromEnv: Boolean(detectedEnv.url),
  envVarName: detectedEnv.varName || 'VITE_APPS_SCRIPT_URL',
};

export function resolveInitialAppsScriptConfig(savedRaw: string | null): AppsScriptConfig {
  const envInfo = getEnvAppsScriptUrl();
  const envAutoSync = getEnvAppsScriptAutoSync();

  if (savedRaw) {
    try {
      const parsed = JSON.parse(savedRaw) as Partial<AppsScriptConfig>;
      const savedUrl = (parsed.webAppUrl || '').trim();

      // Priority 1: If Vercel Environment Variable is configured, always ensure webAppUrl is populated
      if (envInfo.url && !isValidAppsScriptUrl(savedUrl)) {
        return {
          ...DEFAULT_APPS_SCRIPT_CONFIG,
          ...parsed,
          webAppUrl: envInfo.url,
          autoSync: parsed.autoSync ?? envAutoSync,
          connectionStatus: 'connected',
          isFromEnv: true,
          envVarName: envInfo.varName,
          lastMessage: `Terhubung otomatis dari Environment Variable Vercel (${envInfo.varName}).`,
        };
      }

      return {
        ...DEFAULT_APPS_SCRIPT_CONFIG,
        ...parsed,
        webAppUrl: isValidAppsScriptUrl(savedUrl) ? savedUrl : envInfo.url,
        isFromEnv: Boolean(envInfo.url && (!isValidAppsScriptUrl(savedUrl) || savedUrl === envInfo.url)),
        envVarName: envInfo.varName || 'VITE_APPS_SCRIPT_URL',
      };
    } catch {
      // fallback to default
    }
  }

  return DEFAULT_APPS_SCRIPT_CONFIG;
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
        message: json.message || 'Database berhasil disinkronkan ke Google Sheets Apps Script.',
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
        message: 'Data berhasil dimuat dari Google Sheets Apps Script.',
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
 * Petunjuk Deployment & Integrasi Vercel Environment Variable:
 * 1. Buka Google Spreadsheet baru -> Extensions -> Apps Script.
 * 2. Buat 2 file script: \`code.gs\` (file ini) dan \`setup.gs\`.
 * 3. Jalankan fungsi \`setupSmartBuildDatabase()\` pada \`setup.gs\` satu kali.
 * 4. Klik Deploy -> New Deployment -> Select type: Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin Web App URL (\`https://script.google.com/macros/s/.../exec\`).
 * 6. Masukkan di Vercel -> Project Settings -> Environment Variables:
 *    - Name : VITE_APPS_SCRIPT_URL   (atau APPS_SCRIPT_URL)
 *    - Value: https://script.google.com/macros/s/.../exec
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
    var seenIds = {};
    for (var r = 1; r < values.length; r++) {
      var jsonColIndex = headers.indexOf('_raw_json');
      if (jsonColIndex !== -1 && values[r][jsonColIndex]) {
        try {
          var parsedItem = JSON.parse(values[r][jsonColIndex]);
          if (parsedItem && parsedItem.id) {
            if (!seenIds[parsedItem.id]) {
              seenIds[parsedItem.id] = true;
              rows.push(parsedItem);
            }
          } else if (parsedItem) {
            rows.push(parsedItem);
          }
          continue;
        } catch (parseErr) {}
      }
      var rowObj = {};
      var hasValue = false;
      for (var c = 0; c < headers.length; c++) {
        var cellVal = values[r][c];
        if (cellVal !== '' && cellVal !== null && cellVal !== undefined) {
          hasValue = true;
        }
        rowObj[headers[c]] = cellVal;
      }
      if (!hasValue) continue;
      if (!rowObj.id) {
        rowObj.id = tableName + '-row-' + r;
      }
      if (!seenIds[rowObj.id]) {
        seenIds[rowObj.id] = true;
        rows.push(rowObj);
      }
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
  users: ['id', 'name', 'loginId', 'password', 'email', 'role', 'organizationId', 'organizationName', 'position', 'phone', 'bankName', 'bankAccountNumber', 'bankAccountHolder', 'status', 'createdAt', '_raw_json'],
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
