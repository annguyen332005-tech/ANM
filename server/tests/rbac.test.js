const prisma = require('../src/config/prisma');
const { requireRole } = require('../src/middleware/auth');

function mockReqRes(userId) {
  const req = {
    user: { id: userId },
  };
  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, getResult: () => ({ statusCode, responseData, nextCalled }) };
}

async function testRBACMatrix() {
  console.log('--- TEST 3: Role-Based Access Control (RBAC) Matrix ---');

  // Find admin user in DB
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    include: { userRoles: { include: { role: true } } },
  });
  if (!admin) throw new Error('Admin user not found!');

  // Create temporary Analyst and Regular User for the test
  const analystRole = await prisma.role.findUnique({ where: { name: 'Security Analyst' } });
  const userRole = await prisma.role.findUnique({ where: { name: 'User' } });

  const analyst = await prisma.user.create({
    data: {
      username: `analyst_test_${Date.now()}`,
      email: `analyst_${Date.now()}@test.local`,
      passwordHash: 'dummy',
      userRoles: { create: { roleId: analystRole.id } },
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      username: `user_test_${Date.now()}`,
      email: `user_${Date.now()}@test.local`,
      passwordHash: 'dummy',
      userRoles: { create: { roleId: userRole.id } },
    },
  });

  try {
    const testCases = [
      { name: 'Admin accessing Admin-only endpoint (e.g. Delete Asset)', required: ['Admin'], userId: admin.id, expectPass: true },
      { name: 'Normal User accessing Admin-only endpoint', required: ['Admin'], userId: normalUser.id, expectPass: false },
      { name: 'Security Analyst accessing Audit Logs (Admin, Analyst)', required: ['Admin', 'Security Analyst'], userId: analyst.id, expectPass: true },
      { name: 'Normal User accessing Audit Logs', required: ['Admin', 'Security Analyst'], userId: normalUser.id, expectPass: false },
      { name: 'Normal User accessing Incident Response Actions (Admin, Analyst)', required: ['Admin', 'Security Analyst'], userId: normalUser.id, expectPass: false },
    ];

    for (const tc of testCases) {
      const middleware = requireRole(...tc.required);
      const { req, res, next, getResult } = mockReqRes(tc.userId);

      await middleware(req, res, next);
      const result = getResult();

      if (tc.expectPass) {
        if (!result.nextCalled || result.statusCode !== 200) {
          throw new Error(`RBAC Failure: ${tc.name} should have been ALLOWED, got HTTP ${result.statusCode}`);
        }
        console.log(`✓ ALLOWED: ${tc.name}`);
      } else {
        if (result.nextCalled || result.statusCode !== 403) {
          throw new Error(`RBAC Failure: ${tc.name} should have been FORBIDDEN (403), got HTTP ${result.statusCode}, next=${result.nextCalled}`);
        }
        console.log(`✓ DENIED (403): ${tc.name}`);
      }
    }

    return true;
  } finally {
    await prisma.userRole.deleteMany({ where: { userId: { in: [analyst.id, normalUser.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [analyst.id, normalUser.id] } } });
  }
}

module.exports = { testRBACMatrix };

if (require.main === module) {
  testRBACMatrix()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('✗ FAIL:', err.message);
      process.exit(1);
    });
}
