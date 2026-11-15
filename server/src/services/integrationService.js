const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

class IntegrationService {
  async getAllIntegrations() {
    return prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIntegration(data, userId, ipAddress) {
    const integration = await prisma.integration.create({
      data: {
        name: data.name,
        type: data.type,
        endpoint: data.endpoint || null,
        status: data.status || 'configured',
        configJson: data.configJson || null,
      },
    });

    await auditLog({
      userId,
      action: 'CREATE_INTEGRATION',
      resource: 'integration',
      ipAddress,
      status: 'success',
      details: `Khai báo công cụ tích hợp bảo mật: ${integration.name} (${integration.type})`,
    });

    return integration;
  }

  async updateIntegration(id, data, userId, ipAddress) {
    const existing = await prisma.integration.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy công cụ tích hợp.');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        endpoint: data.endpoint !== undefined ? data.endpoint : existing.endpoint,
        status: data.status ?? existing.status,
        configJson: data.configJson !== undefined ? data.configJson : existing.configJson,
      },
    });

    await auditLog({
      userId,
      action: 'UPDATE_INTEGRATION',
      resource: 'integration',
      ipAddress,
      status: 'success',
      details: `Cập nhật cấu hình công cụ ${updated.name}`,
    });

    return updated;
  }

  async simulateEvent(integrationId, eventData, userId, ipAddress) {
    const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
    if (!integration) {
      const error = new Error('Không tìm thấy công cụ tích hợp.');
      error.statusCode = 404;
      throw error;
    }

    const { eventType, severity, sourceIp, description } = eventData;

    // Create security event
    const secEvent = await prisma.securityEvent.create({
      data: {
        eventType: eventType || 'EXTERNAL_ALERT_TRIGGERED',
        severity: severity || 'high',
        source: integration.name,
        sourceIp: sourceIp || '10.0.0.1',
        description: description || `Cảnh báo an ninh được tiếp nhận từ ${integration.name} (${integration.type}).`,
        status: 'open',
      },
    });

    // Create system alert
    const alert = await prisma.alert.create({
      data: {
        title: `[${integration.name}] ${secEvent.eventType}`,
        description: secEvent.description,
        severity: secEvent.severity,
        status: 'open',
      },
    });

    await auditLog({
      userId,
      action: 'INGEST_SECURITY_EVENT',
      resource: 'integration',
      ipAddress,
      status: 'success',
      details: `Mô phỏng tiếp nhận sự kiện từ ${integration.name}: ${secEvent.eventType} (Mức: ${secEvent.severity})`,
    });

    return {
      securityEvent: secEvent,
      alert,
      message: `Đã tiếp nhận và tạo cảnh báo thành công từ ${integration.name}!`,
    };
  }

  async deleteIntegration(id, userId, ipAddress) {
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) {
      const error = new Error('Không tìm thấy tích hợp.');
      error.statusCode = 404;
      throw error;
    }
    await prisma.integration.delete({ where: { id } });
    await auditLog({
      userId,
      action: 'DELETE_INTEGRATION',
      resource: 'integration',
      ipAddress,
      status: 'success',
      details: `Đã xóa tích hợp: ${integration.name} (${integration.type})`,
    });
    return { message: 'Đã xóa tích hợp.' };
  }
}

module.exports = new IntegrationService();
