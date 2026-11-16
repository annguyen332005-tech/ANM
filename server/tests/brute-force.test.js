const bcrypt = require('argon2');
const prisma = require('../src/config/prisma');
const authService = require('../src/services/authService');

async function testBruteForceLockout() {
  console.log('--- TEST 1: Brute-force Protection & Account Lockout ---');
  const testEmail = `brute_test_${Date.now()}@secureweb.local`;
  const password = 'StrongPassword@123';
  const wrongPassword = 'x';
  const { loginSchema } = require('../src/validators/authValidator');
  loginSchema.parse({ email: testEmail, password: wrongPassword });

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

    // First five failures lock for five minutes.
    try {
      await authService.login({ email: testEmail, password: wrongPassword }, '127.0.0.1');
      throw new Error('5th login should have failed with lockout!');
    } catch (err) {
      if (err.statusCode !== 403 && !err.message.includes('khóa')) {
        throw new Error(`Expected 403 lockout error on 5th failure, got: ${err.message} (${err.statusCode})`);
      }
    }

    const lockedUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!lockedUser.isActive || lockedUser.lockoutCount !== 1 || lockedUser.failedLoginCount !== 0 || !lockedUser.lockedUntil) throw new Error('Expected temporary five-minute lock');
    const remaining = lockedUser.lockedUntil.getTime() - Date.now();
    if (remaining < 290000 || remaining > 300000) throw new Error('Incorrect lock duration');
    async function expectLocked(attemptPassword, pattern) {
      try {
        await authService.login({ email: testEmail, password: attemptPassword }, '127.0.0.1');
        throw new Error('Locked login unexpectedly succeeded');
      } catch (err) {
        if (err.statusCode !== 403 || !pattern.test(err.message)) throw err;
      }
    }
    await expectLocked(password, /5 phút/);
    await expectLocked(wrongPassword, /5 phút/);
    const duringLock = await prisma.user.findUnique({ where: { id: user.id } });
    if (duringLock.failedLoginCount !== 0 || duringLock.lockoutCount !== 1) throw new Error('Attempts during lock should not count');

    // Move only this test user's deadline into the past instead of sleeping.
    await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() - 1000) } });
    await authService.login({ email: testEmail, password }, '127.0.0.1');
    const recovered = await prisma.user.findUnique({ where: { id: user.id } });
    if (recovered.failedLoginCount !== 0 || recovered.lockedUntil !== null || recovered.lockoutCount !== 1) throw new Error('Successful login must clear failures but preserve first lock history');
    for (let i = 1; i <= 4; i++) {
      try {
        await authService.login({ email: testEmail, password: wrongPassword }, '127.0.0.1');
        throw new Error('Wrong login unexpectedly succeeded');
      } catch (err) { if (err.statusCode !== 401) throw err; }
    }
    await expectLocked(wrongPassword, /vĩnh viễn/);
    await expectLocked(password, /vĩnh viễn/);
    const permanent = await prisma.user.findUnique({ where: { id: user.id } });
    if (permanent.isActive || permanent.lockoutCount !== 2) throw new Error('Expected permanent lock on second batch');

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
