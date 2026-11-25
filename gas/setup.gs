/**
 * ============================================================================
 * SMARTBUILD ENTERPRISE - DATABASE INITIALIZER & SCHEMA SETUP (setup.gs)
 * Construction Contract, BIM & Smart Contract Management System
 * ============================================================================
 * Jalankan fungsi `setupSmartBuildDatabase()` ini satu kali di editor
 * Google Apps Script untuk membuat seluruh 18 sheet/tabel relasional beserta
 * format header Navy Blue (#071D49) dan data awal.
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
    var sheet = ss.getSheetByName(tableName);

    if (!sheet) {
      sheet = ss.insertSheet(tableName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(columns);
    } else {
      sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
    }

    // Format Header Row dengan Warna Navy Blue SmartBuild (#071D49)
    var headerRange = sheet.getRange(1, 1, 1, columns.length);
    headerRange.setBackground('#071D49');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Hapus Sheet1 default jika masih kosong dan bukan bagian dari 18 tabel
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('Inisialisasi 18 tabel database SmartBuild selesai!');
  return 'Berhasil menyiapkan 18 tabel database SmartBuild di Google Sheets.';
}
