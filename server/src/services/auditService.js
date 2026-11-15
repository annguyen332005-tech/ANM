const prisma = require('../config/prisma');

class AuditService {
  async getAllLogs(filters = {}) {
    const { search, action, resource, status, limit = 50, page = 1 } = filters;
    const where = {};

    if (action && action !== 'all') {
      where.action = action;
    }

    if (resource && resource !== 'all') {
      where.resource = resource;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { details: { contains: q } },
        { ipAddress: { contains: q } },
        { user: { username: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const take = parseInt(limit, 10) || 50;
    const skip = ((parseInt(page, 10) || 1) - 1) * take;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page: parseInt(page, 10) || 1,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  async getActions() {
    const logs = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });
    return logs.map((l) => l.action);
  }
}

module.exports = new AuditService();
