const bcrypt = require('argon2');
const prisma = require('../src/config/prisma');
const authService = require('../src/services/authService');

async function testBruteForceLockout() {
  console.log('--- TEST 1: Brute-force Protection & Account Lockout ---');
  const testEmail = `brute_test_${Date.now()}@secureweb.local`;
  const password = 'StrongPassword@123';
  const wrongPassword = 'WrongPassword@999';

  // 1. Create temporary test user
  const passwordHash = await bcrypt.hash(password);
  const user = await prisma.user.create({
    data: {
      username: `brute_user_${Date.now()}`,
      email: testEmail,
      passwordHash,
      isActive: true,
      failedLoginCount: 0,
    },
  });

  try {
    // 2. Perform 4 wrong logins -> should fail with 401, count incrementing
    for (let i = 1; i <= 4; i++) {
      try {
        await authService.login({ email: testEmail, password: wrongPassword }, '127.0.0.1');
        throw new Error(`Login ${i} should have failed!`);
      } catch (err) {
        if (err.statusCode !== 401) throw err;
      }
    }

    const midUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (midUser.failedLoginCount !== 4 || !midUser.isActive) {
      throw new Error(`Expected failedLoginCount=4, isActive=true, got count=${midUser.failedLoginCount}, active=${midUser.isActive}`);
    }

    // 3. 5th wrong login -> should lock account (isActive=false, 403 error)
    try {
      await authService.login({ email: testEmail, password: wrongPassword }, '127.0.0.1');
      throw new Error('5th login should have failed with lockout!');
    } catch (err) {
      if (err.statusCode !== 403 && !err.message.includes('khóa')) {
        throw new Error(`Expected 403 lockout error on 5th failure, got: ${err.message} (${err.statusCode})`);
      }
    }

    const lockedUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (lockedUser.isActive) {
      throw new Error('User should be locked (isActive=false) after 5 failed attempts!');
    }

    // 4. Verify audit log was recorded
    const log = await prisma.auditLog.findFirst({
      where: { userId: user.id, action: 'LOGIN_FAILED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!log || !log.details.includes('5 lần')) {
      throw new Error('Audit log for 5-fail lockout was not properly recorded!');
    }

    console.log('✓ PASS: Account locked after 5 consecutive failures, audit log recorded.');
    return true;
  } finally {
    // Cleanup
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

module.exports = { testBruteForceLockout };

if (require.main === module) {
  testBruteForceLockout()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('✗ FAIL:', err.message);
      process.exit(1);
    });
}
