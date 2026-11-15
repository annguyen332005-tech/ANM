const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

function computeRiskLevel(likelihood, impact) {
  const l = likelihood.toLowerCase();
  const i = impact.toLowerCase();

  if (l === 'high' && i === 'high') return 'critical';
  if ((l === 'high' && i === 'medium') || (l === 'medium' && i === 'high')) return 'high';
  if ((l === 'medium' && i === 'medium') || (l === 'high' && i === 'low') || (l === 'low' && i === 'high')) return 'medium';
  return 'low';
}

class RiskService {
  async getAllRisks(filters = {}) {
    const { search, riskLevel, status, assetId } = filters;
    const where = {};

    if (riskLevel && riskLevel !== 'all') {
      where.riskLevel = riskLevel;
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
        { mitigation: { contains: q } },
        { asset: { name: { contains: q } } },
        { asset: { ipAddress: { contains: q } } },
      ];
    }

    return prisma.risk.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetId: true,
            name: true,
            type: true,
            ipAddress: true,
            criticality: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRiskById(id) {
    const risk = await prisma.risk.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!risk) {
      const error = new Error('Không tìm thấy rủi ro.');
      error.statusCode = 404;
      throw error;
    }

    return risk;
  }

  async createRisk(data, userId, ipAddress) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      const error = new Error('Tài sản liên kết không tồn tại.');
      error.statusCode = 404;
      throw error;
    }

    const riskLevel = data.riskLevel || computeRiskLevel(data.likelihood, data.impact);

    const risk = await prisma.risk.create({
      data: {
        assetId: data.assetId,
        title: data.title,
        likelihood: data.likelihood,
        impact: data.impact,
        riskLevel,
        mitigation: data.mitigation || null,
        status: data.status || 'open',
      },
      include: { asset: true },
    });

    await auditLog({
      userId,
      action: 'CREATE_RISK',
      resource: 'risk',
      ipAddress,
      status: 'success',
      details: `Ghi nhận rủi ro: "${risk.title}" (Mức: ${risk.riskLevel}) cho tài sản ${asset.name}`,
    });

    return risk;
  }

  async updateRisk(id, data, userId, ipAddress) {
    const existing = await prisma.risk.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy rủi ro để cập nhật.');
      error.statusCode = 404;
      throw error;
    }

    const likelihood = data.likelihood ?? existing.likelihood;
    const impact = data.impact ?? existing.impact;
    const riskLevel = data.riskLevel || computeRiskLevel(likelihood, impact);

    const risk = await prisma.risk.update({
      where: { id },
      data: {
        assetId: data.assetId ?? existing.assetId,
        title: data.title ?? existing.title,
        likelihood,
        impact,
        riskLevel,
        mitigation: data.mitigation !== undefined ? data.mitigation : existing.mitigation,
        status: data.status ?? existing.status,
      },
      include: { asset: true },
    });

    await auditLog({
      userId,
      action: 'UPDATE_RISK',
      resource: 'risk',
      ipAddress,
      status: 'success',
      details: `Cập nhật rủi ro: "${risk.title}" (Trạng thái: ${risk.status})`,
    });

    return risk;
  }

  async deleteRisk(id, userId, ipAddress) {
    const existing = await prisma.risk.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy rủi ro để xóa.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.risk.delete({ where: { id } });

    await auditLog({
      userId,
      action: 'DELETE_RISK',
      resource: 'risk',
      ipAddress,
      status: 'success',
      details: `Xóa rủi ro: "${existing.title}"`,
    });

    return { message: 'Xóa rủi ro thành công.' };
  }

  async getMatrixStats() {
    const risks = await prisma.risk.findMany({
      select: { likelihood: true, impact: true, riskLevel: true, status: true },
    });

    // 3x3 matrix: likelihood (row) x impact (col)
    // rows: high, medium, low
    // cols: low, medium, high
    const matrix = {
      high_high: 0,
      high_medium: 0,
      high_low: 0,
      medium_high: 0,
      medium_medium: 0,
      medium_low: 0,
      low_high: 0,
      low_medium: 0,
      low_low: 0,
    };

    const levelCount = { critical: 0, high: 0, medium: 0, low: 0 };

    risks.forEach((r) => {
      const key = `${r.likelihood.toLowerCase()}_${r.impact.toLowerCase()}`;
      if (matrix[key] !== undefined) matrix[key] += 1;
      if (levelCount[r.riskLevel.toLowerCase()] !== undefined) {
        levelCount[r.riskLevel.toLowerCase()] += 1;
      }
    });

    return {
      total: risks.length,
      matrix,
      levelCount,
    };
  }
}

module.exports = new RiskService();
