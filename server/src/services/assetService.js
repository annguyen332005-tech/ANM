const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

class AssetService {
  async getAllAssets(filters = {}) {
    const { search, status, criticality, categoryId } = filters;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (criticality && criticality !== 'all') {
      where.criticality = criticality;
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { assetId: { contains: q } },
        { ipAddress: { contains: q } },
        { type: { contains: q } },
        { owner: { contains: q } },
      ];
    }

    return prisma.asset.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssetById(id) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        vulnerabilities: true,
        risks: true,
        alerts: true,
      },
    });

    if (!asset) {
      const error = new Error('Không tìm thấy tài sản.');
      error.statusCode = 404;
      throw error;
    }

    return asset;
  }

  async createAsset(data, userId, ipAddress) {
    // Check if assetId is unique
    const existing = await prisma.asset.findUnique({
      where: { assetId: data.assetId },
    });

    if (existing) {
      const error = new Error(`Mã tài sản "${data.assetId}" đã tồn tại.`);
      error.statusCode = 409;
      throw error;
    }

    const asset = await prisma.asset.create({
      data: {
        assetId: data.assetId,
        name: data.name,
        type: data.type,
        categoryId: data.categoryId || null,
        ipAddress: data.ipAddress || null,
        macAddress: data.macAddress || null,
        os: data.os || null,
        owner: data.owner || null,
        location: data.location || null,
        status: data.status || 'active',
        criticality: data.criticality || 'medium',
      },
      include: { category: true },
    });

    await auditLog({
      userId,
      action: 'CREATE_ASSET',
      resource: 'asset',
      ipAddress,
      status: 'success',
      details: `Tạo tài sản: ${asset.name} (${asset.assetId})`,
    });

    return asset;
  }

  async updateAsset(id, data, userId, ipAddress) {
    const current = await prisma.asset.findUnique({ where: { id } });
    if (!current) {
      const error = new Error('Không tìm thấy tài sản để cập nhật.');
      error.statusCode = 404;
      throw error;
    }

    // If assetId changed, check uniqueness
    if (data.assetId && data.assetId !== current.assetId) {
      const existing = await prisma.asset.findUnique({
        where: { assetId: data.assetId },
      });
      if (existing) {
        const error = new Error(`Mã tài sản "${data.assetId}" đã tồn tại ở một tài sản khác.`);
        error.statusCode = 409;
        throw error;
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        assetId: data.assetId ?? current.assetId,
        name: data.name ?? current.name,
        type: data.type ?? current.type,
        categoryId: data.categoryId !== undefined ? data.categoryId : current.categoryId,
        ipAddress: data.ipAddress !== undefined ? data.ipAddress : current.ipAddress,
        macAddress: data.macAddress !== undefined ? data.macAddress : current.macAddress,
        os: data.os !== undefined ? data.os : current.os,
        owner: data.owner !== undefined ? data.owner : current.owner,
        location: data.location !== undefined ? data.location : current.location,
        status: data.status ?? current.status,
        criticality: data.criticality ?? current.criticality,
      },
      include: { category: true },
    });

    await auditLog({
      userId,
      action: 'UPDATE_ASSET',
      resource: 'asset',
      ipAddress,
      status: 'success',
      details: `Cập nhật tài sản: ${asset.name} (${asset.assetId})`,
    });

    return asset;
  }

  async deleteAsset(id, userId, ipAddress) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      const error = new Error('Không tìm thấy tài sản để xóa.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.asset.delete({ where: { id } });

    await auditLog({
      userId,
      action: 'DELETE_ASSET',
      resource: 'asset',
      ipAddress,
      status: 'success',
      details: `Xóa tài sản: ${asset.name} (${asset.assetId})`,
    });

    return { message: 'Xóa tài sản thành công.' };
  }

  async getCategories() {
    return prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new AssetService();
