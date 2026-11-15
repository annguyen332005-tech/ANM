const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

class AlertService {
  async getAllAlerts(filters = {}) {
    const { search, severity, status } = filters;
    const where = {};

    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { asset: { name: { contains: q } } },
        { asset: { ipAddress: { contains: q } } },
      ];
    }

    return prisma.alert.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetId: true,
            name: true,
            ipAddress: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlertById(id) {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!alert) {
      const error = new Error('Không tìm thấy cảnh báo.');
      error.statusCode = 404;
      throw error;
    }

    return alert;
  }

  async updateStatus(id, status, userId, ipAddress) {
    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy cảnh báo để cập nhật.');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { status },
      include: { asset: true },
    });

    await auditLog({
      userId,
      action: 'UPDATE_ALERT_STATUS',
      resource: 'alert',
      ipAddress,
      status: 'success',
      details: `Cập nhật trạng thái cảnh báo "${updated.title}" -> ${status}`,
    });

    return updated;
  }

  async promoteToIncident(id, userId, ipAddress) {
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!alert) {
      const error = new Error('Không tìm thấy cảnh báo.');
      error.statusCode = 404;
      throw error;
    }

    // Determine type from title/desc
    let incidentType = 'Other';
    const text = `${alert.title} ${alert.description}`.toLowerCase();
    if (text.includes('brute') || text.includes('đăng nhập sai')) incidentType = 'Brute-force attack';
    else if (text.includes('sql') || text.includes('injection')) incidentType = 'SQL Injection';
    else if (text.includes('xss')) incidentType = 'XSS';
    else if (text.includes('scan') || text.includes('port')) incidentType = 'Network intrusion';
    else if (text.includes('log4j') || text.includes('exploit') || text.includes('vulnerability')) incidentType = 'Vulnerability exploitation';
    else if (text.includes('malware') || text.includes('virus')) incidentType = 'Malware detection';

    // Create incident
    const incident = await prisma.incident.create({
      data: {
        title: `[Sự cố từ Cảnh báo] ${alert.title}`,
        description: alert.description,
        type: incidentType,
        severity: alert.severity,
        assetId: alert.relatedAssetId,
        detectedBy: 'Automated Alert Rule',
        status: 'investigating',
        assignedTo: 'SOC Analyst',
      },
      include: { asset: true },
    });

    // Create first action
    await prisma.incidentAction.create({
      data: {
        incidentId: incident.id,
        actorId: userId || null,
        action: 'PROMOTED_FROM_ALERT',
        notes: `Chuyển hóa từ cảnh báo ID: ${alert.id} (${alert.title}). Bắt đầu giai đoạn điều tra (Investigating).`,
      },
    });

    // Update alert status to acknowledged
    await prisma.alert.update({
      where: { id: alert.id },
      data: { status: 'acknowledged' },
    });

    await auditLog({
      userId,
      action: 'PROMOTE_ALERT_TO_INCIDENT',
      resource: 'incident',
      ipAddress,
      status: 'success',
      details: `Chuyển cảnh báo "${alert.title}" thành Sự cố chính thức (Incident ID: ${incident.id})`,
    });

    return incident;
  }

  async getStats() {
    const alerts = await prisma.alert.findMany({
      select: { severity: true, status: true },
    });

    const statusCounts = { open: 0, acknowledged: 0, resolved: 0, dismissed: 0 };
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };

    alerts.forEach((a) => {
      if (statusCounts[a.status] !== undefined) statusCounts[a.status] += 1;
      if (severityCounts[a.severity] !== undefined) severityCounts[a.severity] += 1;
    });

    return {
      total: alerts.length,
      openCount: statusCounts.open,
      statusCounts,
      severityCounts,
    };
  }
}

module.exports = new AlertService();
