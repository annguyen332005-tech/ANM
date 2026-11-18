const prisma = require('../config/prisma');

class DashboardService {
  async getStats() {
    const [
      assetCount,
      userCount,
      vulnerabilityCount,
      alertCount,
      incidentCount,
      assets,
      recentEvents,
    ] = await Promise.all([
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.user.count(),
      prisma.vulnerability.count(),
      prisma.alert.count({ where: { status: 'open' } }),
      prisma.incident.count(),
      prisma.asset.findMany({ where: { deletedAt: null }, select: { type: true, criticality: true, status: true } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { username: true, email: true } } },
      }),
    ]);

    // Aggregate by type
    const typeMap = {};
    const criticalityMap = { critical: 0, high: 0, medium: 0, low: 0 };
    const statusMap = { active: 0, maintenance: 0, retired: 0, offline: 0 };

    assets.forEach((a) => {
      // Type
      typeMap[a.type] = (typeMap[a.type] || 0) + 1;
      // Criticality
      if (criticalityMap[a.criticality] !== undefined) {
        criticalityMap[a.criticality] += 1;
      } else {
        criticalityMap[a.criticality] = 1;
      }
      // Status
      if (statusMap[a.status] !== undefined) {
        statusMap[a.status] += 1;
      } else {
        statusMap[a.status] = 1;
      }
    });

    const assetsByType = Object.keys(typeMap).map((key) => ({
      name: key,
      value: typeMap[key],
    }));

    const assetsByCriticality = [
      { name: 'Critical', count: criticalityMap.critical, fill: '#ef4444' },
      { name: 'High', count: criticalityMap.high, fill: '#f97316' },
      { name: 'Medium', count: criticalityMap.medium, fill: '#eab308' },
      { name: 'Low', count: criticalityMap.low, fill: '#22c55e' },
    ];

    return {
      stats: {
        assetCount,
        userCount,
        vulnerabilityCount,
        alertCount,
        incidentCount,
      },
      charts: {
        assetsByType,
        assetsByCriticality,
        statusMap,
      },
      recentEvents,
    };
  }
}

module.exports = new DashboardService();
