const fs = require('fs');
const prisma = require('../src/config/prisma');
const backupService = require('../src/services/backupService');

async function testBackupRecovery() {
  console.log('--- TEST 2: SQLite VACUUM INTO, SHA-256 Integrity & Restore ---');

  const admin = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (!admin) throw new Error('Admin user not found in DB!');

  let testBackup = null;

  try {
    // 1. Create atomic backup
    testBackup = await backupService.createBackup(
      { name: `automated_test_${Date.now()}` },
      admin.id,
      '127.0.0.1'
    );

    if (!testBackup || testBackup.status !== 'success') {
      throw new Error('Backup creation failed or status is not success!');
    }

    if (!fs.existsSync(testBackup.filePath)) {
      throw new Error(`Backup file does not exist on disk: ${testBackup.filePath}`);
    }

    if (!testBackup.checksum || testBackup.checksum.length !== 64) {
      throw new Error('SHA-256 checksum is missing or invalid length!');
    }

    console.log(`✓ Backup created: ${testBackup.name} (${testBackup.sizeFormatted}), Checksum verified.`);

    // 2. Verify integrity
    const verifyRes = await backupService.verifyBackup(testBackup.id);
    if (!verifyRes.valid) {
      throw new Error('Initial integrity check failed!');
    }
    console.log('✓ Initial integrity check PASSED (Valid: true).');

    // 3. Test tamper detection
    // Append dummy byte to backup file
    fs.appendFileSync(testBackup.filePath, 'TAMPERED_DATA');
    const tamperedVerify = await backupService.verifyBackup(testBackup.id);
    if (tamperedVerify.valid) {
      throw new Error('Integrity check should have caught tampered file!');
    }
    console.log('✓ Tamper detection PASSED: File alteration detected via SHA-256 mismatch.');

    // 4. Test Restore rejection on tampered file
    try {
      await backupService.restoreBackup(testBackup.id, { notes: 'Tampered test' }, admin.id, '127.0.0.1');
      throw new Error('Restore should have rejected tampered file!');
    } catch (err) {
      if (err.statusCode !== 422 && !err.message.includes('checksum')) {
        throw new Error(`Expected 422 error on tampered restore, got: ${err.message}`);
      }
    }
    console.log('✓ Security Protection PASSED: Restore refused on corrupted/tampered file.');

    return true;
  } finally {
    if (testBackup?.id) {
      await backupService.deleteBackup(testBackup.id, admin.id, '127.0.0.1').catch(() => {});
    }
  }
}

module.exports = { testBackupRecovery };

if (require.main === module) {
  testBackupRecovery()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('✗ FAIL:', err.message);
      process.exit(1);
    });
}
