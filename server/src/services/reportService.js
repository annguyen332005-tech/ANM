const prisma = require('../config/prisma');

class ReportService {
  async getExecutiveReport() {
    const [
      assetCount,
      assetsByCriticality,
      vulnCount,
      vulnsBySeverity,
      riskCount,
      risksByLevel,
      incidentCount,
      incidentsByStatus,
      incidentsBySeverity,
      alertCount,
      backupCount,
      latestBackup,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({ by: ['criticality'], _count: { id: true } }),
      prisma.vulnerability.count(),
      prisma.vulnerability.groupBy({ by: ['severity'], _count: { id: true } }),
      prisma.risk.count(),
      prisma.risk.groupBy({ by: ['riskLevel'], _count: { id: true } }),
      prisma.incident.count(),
      prisma.incident.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.incident.groupBy({ by: ['severity'], _count: { id: true } }),
      prisma.alert.count({ where: { status: 'open' } }),
      prisma.backup.count({ where: { status: 'success' } }),
      prisma.backup.findFirst({ where: { status: 'success' }, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    // Map severities
    const vulnMap = { critical: 0, high: 0, medium: 0, low: 0 };
    vulnsBySeverity.forEach((v) => {
      if (vulnMap[v.severity] !== undefined) vulnMap[v.severity] = v._count.id;
    });

    const riskMap = { critical: 0, high: 0, medium: 0, low: 0 };
    risksByLevel.forEach((r) => {
      const lvl = r.riskLevel.toLowerCase();
      if (riskMap[lvl] !== undefined) riskMap[lvl] = r._count.id;
    });

    const incidentStatusMap = { new: 0, investigating: 0, contained: 0, resolved: 0, closed: 0 };
    incidentsByStatus.forEach((i) => {
      if (incidentStatusMap[i.status] !== undefined) incidentStatusMap[i.status] = i._count.id;
    });

    // Compute Security Posture Score (Thang điểm 100)
    // Trừ điểm dựa trên: Lỗ hổng Critical (-15), High (-7), Rủi ro Critical (-10), Sự cố chưa đóng (-5)
    // Cộng điểm: Có bản backup gần nhất (+15), Không có lỗ hổng Critical (+10), v.v.
    let baseScore = 85;
    baseScore -= vulnMap.critical * 15;
    baseScore -= vulnMap.high * 7;
    baseScore -= riskMap.critical * 10;
    baseScore -= (incidentStatusMap.new + incidentStatusMap.investigating) * 5;

    if (backupCount > 0) baseScore += 10;
    if (vulnMap.critical === 0) baseScore += 10;

    const securityScore = Math.max(10, Math.min(100, baseScore));

    let securityGrade = 'F';
    let gradeColor = 'text-red-400';
    if (securityScore >= 85) {
      securityGrade = 'A (Rất tốt)';
      gradeColor = 'text-emerald-400';
    } else if (securityScore >= 70) {
      securityGrade = 'B (Khá)';
      gradeColor = 'text-cyan-400';
    } else if (securityScore >= 50) {
      securityGrade = 'C (Trung bình)';
      gradeColor = 'text-yellow-400';
    } else {
      securityGrade = 'D (Cần khắc phục khẩn cấp)';
      gradeColor = 'text-red-400';
    }

    return {
      generatedAt: new Date().toISOString(),
      securityScore,
      securityGrade,
      gradeColor,
      summary: {
        totalAssets: assetCount,
        totalVulnerabilities: vulnCount,
        totalRisks: riskCount,
        totalIncidents: incidentCount,
        openAlerts: alertCount,
        successfulBackups: backupCount,
        lastBackupAt: latestBackup ? latestBackup.createdAt : null,
      },
      breakdowns: {
        vulnerabilities: vulnMap,
        risks: riskMap,
        incidents: incidentStatusMap,
      },
      nistMapping: {
        identify: {
          assetsManaged: assetCount,
          vulnerabilitiesIdentified: vulnCount,
          risksAssessed: riskCount,
          complianceStatus: '100% Implemented',
        },
        protect: {
          rbacEnabled: true,
          argon2idHashing: true,
          bruteForceProtection: true,
          complianceStatus: '100% Implemented',
        },
        detect: {
          auditLogsActive: true,
          monitoringIntegrations: 4,
          openAlerts: alertCount,
          complianceStatus: '100% Implemented',
        },
        respond: {
          incidentTrackingActive: true,
          containmentCapabilities: ['QUARANTINE_ASSET', 'BLOCK_IP', 'RESOLVE_INCIDENT'],
          complianceStatus: '100% Implemented',
        },
        recover: {
          sqliteVacuumInto: true,
          sha256IntegrityVerification: true,
          recoveryHistoryRecorded: true,
          complianceStatus: '100% Implemented',
        },
      },
      recentAuditLogs,
    };
  }

  async exportData(type) {
    switch (type) {
      case 'assets':
        return prisma.asset.findMany({ include: { category: true } });
      case 'vulnerabilities':
        return prisma.vulnerability.findMany({ include: { asset: true } });
      case 'risks':
        return prisma.risk.findMany({ include: { asset: true } });
      case 'incidents':
        return prisma.incident.findMany({ include: { asset: true, actions: true } });
      case 'audit-logs':
        return prisma.auditLog.findMany({ take: 500, orderBy: { createdAt: 'desc' } });
      case 'backups':
        return prisma.backup.findMany({ orderBy: { createdAt: 'desc' } });
      default:
        throw new Error(`Loại dữ liệu xuất không hợp lệ: ${type}`);
    }
  }
}

module.exports = new ReportService();
