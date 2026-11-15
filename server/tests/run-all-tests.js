const { testBruteForceLockout } = require('./brute-force.test');
const { testBackupRecovery } = require('./backup-recovery.test');
const { testRBACMatrix } = require('./rbac.test');

async function runAllTests() {
  console.log('\n=================================================================');
  console.log('🛡️  SECUREWEB AUTOMATED SECURITY TEST SUITE (GIAI ĐOẠN 5)');
  console.log('    NIST CSF 1.1 Verification & Compliance Validation');
  console.log('=================================================================\n');

  const results = [];
  const startTime = Date.now();

  // Test 1
  try {
    await testBruteForceLockout();
    results.push({ name: 'Brute-force Protection (5 fails -> lockout)', status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'Brute-force Protection', status: 'FAILED', error: err.message });
  }
  console.log('');

  // Test 2
  try {
    await testBackupRecovery();
    results.push({ name: 'SQLite VACUUM INTO, SHA-256 Checksum & Restore', status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'Backup & Recovery Integrity', status: 'FAILED', error: err.message });
  }
  console.log('');

  // Test 3
  try {
    await testRBACMatrix();
    results.push({ name: 'Role-Based Access Control (RBAC) Enforcement', status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'RBAC Enforcement', status: 'FAILED', error: err.message });
  }
  console.log('\n=================================================================');
  console.log('📊 TEST SUMMARY RESULTS:');
  console.log('=================================================================');

  let allPassed = true;
  for (const r of results) {
    const symbol = r.status === 'PASSED' ? '✓' : '✗';
    console.log(`${symbol} [${r.status}] - ${r.name}`);
    if (r.error) {
      console.log(`    Reason: ${r.error}`);
      allPassed = false;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('=================================================================');
  console.log(`Total: ${results.length} | Passed: ${results.filter((r) => r.status === 'PASSED').length} | Failed: ${results.filter((r) => r.status === 'FAILED').length} | Time: ${duration}s`);
  console.log('=================================================================\n');

  if (!allPassed) process.exit(1);
}

runAllTests();
