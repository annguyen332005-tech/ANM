const prisma = require('../config/prisma');

async function auditLog({ userId, action, resource, ipAddress, status, details }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource,
        ipAddress: ipAddress || 'unknown',
        status: status || 'success',
        details: details || '',
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}

module.exports = auditLog;
