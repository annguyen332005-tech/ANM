const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

class IncidentService {
  async getAllIncidents(filters = {}) {
    const { search, type, severity, status, assetId } = filters;
    const where = {};

    if (type && type !== 'all') {
      where.type = type;
    }

    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (assetId && assetId !== 'all') {
      where.assetId = assetId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { assignedTo: { contains: q } },
        { detectedBy: { contains: q } },
        { asset: { name: { contains: q } } },
        { asset: { ipAddress: { contains: q } } },
      ];
    }

    return prisma.incident.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetId: true,
            name: true,
            type: true,
            ipAddress: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidentById(id) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        asset: true,
        actions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!incident) {
      const error = new Error('Không tìm thấy sự cố.');
      error.statusCode = 404;
      throw error;
    }

    return incident;
  }

  async createIncident(data, userId, ipAddress) {
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'Other',
        severity: data.severity || 'medium',
        assetId: data.assetId || null,
        detectedBy: data.detectedBy || 'Security Team',
        status: data.status || 'new',
        assignedTo: data.assignedTo || null,
        resolution: data.resolution || null,
      },
      include: {
        asset: true,
      },
    });

    // Auto create first action log
    await prisma.incidentAction.create({
      data: {
        incidentId: incident.id,
        actorId: userId || null,
        action: 'INITIAL_DISCOVERY',
        notes: `Sự cố được tạo và phân loại ban đầu: Mức độ ${incident.severity}, Loại: ${incident.type}`,
      },
    });

    await auditLog({
      userId,
      action: 'CREATE_INCIDENT',
      resource: 'incident',
      ipAddress,
      status: 'success',
      details: `Khởi tạo hồ sơ sự cố: "${incident.title}" (Mức: ${incident.severity})`,
    });

    // Create security event if critical or high
    if (incident.severity === 'critical' || incident.severity === 'high') {
      await prisma.securityEvent.create({
        data: {
          eventType: 'INCIDENT_RECORDED',
          severity: incident.severity,
          source: 'Incident Response System',
          sourceIp: incident.asset?.ipAddress || 'unknown',
          description: `Ghi nhận sự cố an ninh nghiêm trọng: [${incident.type}] ${incident.title}`,
          status: 'open',
        },
      });
    }

    return incident;
  }

  async updateIncident(id, data, userId, ipAddress) {
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy sự cố để cập nhật.');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description: data.description ?? existing.description,
        type: data.type ?? existing.type,
        severity: data.severity ?? existing.severity,
        assetId: data.assetId !== undefined ? data.assetId : existing.assetId,
        detectedBy: data.detectedBy ?? existing.detectedBy,
        status: data.status ?? existing.status,
        assignedTo: data.assignedTo !== undefined ? data.assignedTo : existing.assignedTo,
        resolution: data.resolution !== undefined ? data.resolution : existing.resolution,
        closedAt: (data.status === 'resolved' || data.status === 'closed') ? (existing.closedAt || new Date()) : null,
      },
      include: {
        asset: true,
        actions: { orderBy: { createdAt: 'desc' } },
      },
    });

    await auditLog({
      userId,
      action: 'UPDATE_INCIDENT',
      resource: 'incident',
      ipAddress,
      status: 'success',
      details: `Cập nhật sự cố: "${updated.title}" -> Trạng thái: ${updated.status}`,
    });

    return updated;
  }

  async deleteIncident(id, userId, ipAddress) {
    const existing = await prisma.incident.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy sự cố để xóa.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.incident.delete({ where: { id } });

    await auditLog({
      userId,
      action: 'DELETE_INCIDENT',
      resource: 'incident',
      ipAddress,
      status: 'success',
      details: `Xóa sự cố: "${existing.title}"`,
    });

    return { message: 'Xóa sự cố thành công.' };
  }

  async addAction(id, { action, notes }, userId, ipAddress) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      const error = new Error('Không tìm thấy sự cố.');
      error.statusCode = 404;
      throw error;
    }

    const incidentAction = await prisma.incidentAction.create({
      data: {
        incidentId: id,
        actorId: userId || null,
        action,
        notes: notes || '',
      },
    });

    await auditLog({
      userId,
      action: 'RECORD_INCIDENT_ACTION',
      resource: 'incident',
      ipAddress,
      status: 'success',
      details: `Ghi nhận hành động phản ứng cho sự cố "${incident.title}": ${action}`,
    });

    return incidentAction;
  }

  async executeResponseAction(id, { actionType, notes }, userId, ipAddress) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!incident) {
      const error = new Error('Không tìm thấy sự cố.');
      error.statusCode = 404;
      throw error;
    }

    let responseSummary = '';
    let newStatus = incident.status;

    switch (actionType) {
      case 'QUARANTINE_ASSET':
        if (incident.assetId) {
          await prisma.asset.update({
            where: { id: incident.assetId },
            data: { status: 'offline' },
          });
          responseSummary = `Đã cô lập tài sản mạng ${incident.asset?.name} (${incident.asset?.ipAddress}) chuyển sang trạng thái Offline.`;
        } else {
          responseSummary = 'Cách ly tài sản: Không có tài sản liên kết.';
        }
        newStatus = 'contained';
        break;

      case 'BLOCK_IP':
        responseSummary = `Tạo lệnh chặn IP nguồn đáng ngờ trên Firewall: ${notes || incident.asset?.ipAddress || 'External IP'}.`;
        newStatus = 'contained';
        break;

      case 'RESOLVE_INCIDENT':
        newStatus = 'resolved';
        responseSummary = `Đã giải quyết sự cố: ${notes || 'Đã áp dụng biện pháp phòng ngừa và vá lỗ hổng'}.`;
        break;

      default:
        responseSummary = `Thực hiện hành động: ${actionType}. Ghi chú: ${notes || ''}`;
        break;
    }

    // Add action log
    await prisma.incidentAction.create({
      data: {
        incidentId: id,
        actorId: userId || null,
        action: actionType,
        notes: `${responseSummary} ${notes ? `(${notes})` : ''}`,
      },
    });

    // Update incident status if changed
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: newStatus,
        resolution: (newStatus === 'resolved' || newStatus === 'closed') ? (notes || responseSummary) : incident.resolution,
        closedAt: (newStatus === 'resolved' || newStatus === 'closed') ? new Date() : incident.closedAt,
      },
      include: {
        asset: true,
        actions: { orderBy: { createdAt: 'desc' } },
      },
    });

    await auditLog({
      userId,
      action: 'EXECUTE_INCIDENT_RESPONSE',
      resource: 'incident',
      ipAddress,
      status: 'success',
      details: `Phản ứng sự cố "${incident.title}": ${actionType} -> ${responseSummary}`,
    });

    return updated;
  }

  async getStats() {
    const incidents = await prisma.incident.findMany({
      select: { status: true, severity: true, type: true },
    });

    const statusCounts = { new: 0, investigating: 0, contained: 0, resolved: 0, closed: 0 };
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const typeCounts = {};

    incidents.forEach((inc) => {
      if (statusCounts[inc.status] !== undefined) statusCounts[inc.status] += 1;
      if (severityCounts[inc.severity] !== undefined) severityCounts[inc.severity] += 1;
      typeCounts[inc.type] = (typeCounts[inc.type] || 0) + 1;
    });

    return {
      total: incidents.length,
      statusCounts,
      severityCounts,
      typeCounts,
    };
  }
}

module.exports = new IncidentService();
