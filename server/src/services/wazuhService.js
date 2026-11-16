const { z } = require('zod');
const crypto = require('node:crypto');
const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

const INTEGRATION_ID = 'wazuh-webhook';
const error = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const schema = z.object({
  id: z.string().min(1).max(200),
  timestamp: z.string().max(100).refine((s) => Number.isFinite(Date.parse(s)), 'timestamp không hợp lệ'),
  manager: z.object({ name: z.string().min(1).max(200) }).passthrough(),
  agent: z.object({ id: z.string().max(100), name: z.string().min(1).max(200), ip: z.string().max(100).optional() }).passthrough(),
  rule: z.object({ id: z.string().min(1).max(100), level: z.number().int().min(0).max(15), description: z.string().min(1).max(4000) }).passthrough(),
}).passthrough();

// Application mapping, not an official equivalence between Wazuh and CVSS.
const mapSeverity = (level) => level >= 12 ? 'critical' : level >= 8 ? 'high' : level >= 5 ? 'medium' : 'low';

function authorize(req, res, next) {
  const secret = process.env.WAZUH_WEBHOOK_KEY || '';
  if (secret.length < 32) return res.status(503).json({ message: 'Chưa cấu hình WAZUH_WEBHOOK_KEY tối thiểu 32 ký tự trên backend.' });
  const supplied = req.get('X-Wazuh-Key') || '';
  const expectedHash = crypto.createHash('sha256').update(secret).digest();
  const actualHash = crypto.createHash('sha256').update(supplied).digest();
  if (!crypto.timingSafeEqual(expectedHash, actualHash)) return res.status(401).json({ message: 'Khóa webhook Wazuh không hợp lệ.' });
  return next();
}

class WazuhService {
  constructor(db = prisma, audit = auditLog) { this.db = db; this.audit = audit; }

  async setup(userId, ipAddress) {
    const integration = await this.db.integration.upsert({ where: { id: INTEGRATION_ID }, update: {}, create: {
      id: INTEGRATION_ID, name: 'Wazuh (Webhook)', type: 'SIEM', status: 'configured',
      endpoint: '/api/webhooks/wazuh', configJson: JSON.stringify({ provider: 'Wazuh', mode: 'webhook' }),
    } });
    await this.audit({ userId, ipAddress, action: 'CONFIGURE_WAZUH', resource: 'integration', details: 'Khai báo bộ nhận Wazuh thật; chờ cảnh báo từ Manager.' });
    return integration;
  }

  async status() {
    const [integration, count, recent] = await Promise.all([
      this.db.integration.findUnique({ where: { id: INTEGRATION_ID } }),
      this.db.wazuhReceipt.count(),
      this.db.wazuhReceipt.findMany({ take: 10, orderBy: { receivedAt: 'desc' }, select: {
        id: true, manager: true, externalId: true, agentName: true, ruleId: true, level: true,
        severity: true, occurredAt: true, receivedAt: true, alertId: true,
      } }),
    ]);
    return { enabled: !!integration && integration.status !== 'inactive', keyConfigured: (process.env.WAZUH_WEBHOOK_KEY || '').length >= 32,
      path: '/api/webhooks/wazuh', count, recent };
  }

  async ingest(body, ipAddress) {
    const data = schema.parse(body);
    const integration = await this.db.integration.findUnique({ where: { id: INTEGRATION_ID } });
    if (!integration || integration.status === 'inactive') throw error('Vào Tích hợp bảo mật → Bật bộ nhận Wazuh trước.', 503);
    const where = { manager_externalId: { manager: data.manager.name, externalId: data.id } };
    const old = await this.db.wazuhReceipt.findUnique({ where });
    if (old) return { duplicate: true, alertId: old.alertId };
    const severity = mapSeverity(data.rule.level);
    const sourceIp = typeof data.data?.srcip === 'string' ? data.data.srcip.slice(0, 100) : data.agent.ip || null;
    const description = [`${data.rule.description}`, `Manager: ${data.manager.name} | Agent: ${data.agent.name} (${data.agent.id})`,
      `Rule: ${data.rule.id} | Wazuh level: ${data.rule.level} | Alert ID: ${data.id}`, `Thời điểm nguồn: ${data.timestamp}`,
      typeof data.full_log === 'string' ? data.full_log.slice(0, 4000) : ''].filter(Boolean).join('\n');
    try {
      const result = await this.db.$transaction(async (tx) => {
        const asset = data.agent.ip ? await tx.asset.findFirst({ where: { ipAddress: data.agent.ip } }) : null;
        const alert = await tx.alert.create({ data: { title: `[Wazuh] ${data.rule.description.slice(0, 200)}`, description, severity, relatedAssetId: asset?.id || null } });
        const event = await tx.securityEvent.create({ data: { eventType: `WAZUH_RULE_${data.rule.id}`, source: 'Wazuh', severity, sourceIp, description } });
        await tx.wazuhReceipt.create({ data: { manager: data.manager.name, externalId: data.id, agentName: data.agent.name,
          ruleId: data.rule.id, level: data.rule.level, severity, occurredAt: new Date(data.timestamp), alertId: alert.id, eventId: event.id, payloadJson: JSON.stringify(data) } });
        await tx.integration.update({ where: { id: INTEGRATION_ID }, data: { status: 'active' } });
        return { duplicate: false, alertId: alert.id, severity };
      });
      await this.audit({ ipAddress, action: 'INGEST_WAZUH_ALERT', resource: 'integration', details: `Manager ${data.manager.name}, Agent ${data.agent.name}, Rule ${data.rule.id}, Alert ${data.id} → ${result.alertId}` });
      return result;
    } catch (err) {
      // Concurrent retries must not create additional alerts: transaction rolls back.
      if (err.code === 'P2002') {
        const receipt = await this.db.wazuhReceipt.findUnique({ where });
        if (receipt) return { duplicate: true, alertId: receipt.alertId };
      }
      throw err;
    }
  }
}

module.exports = new WazuhService();
module.exports.WazuhService = WazuhService;
module.exports.authorize = authorize;
module.exports.mapSeverity = mapSeverity;
module.exports.INTEGRATION_ID = INTEGRATION_ID;
