const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

class AssetService {
  async getAllAssets(filters = {}) {
    const { search, status, criticality, categoryId } = filters;
    const where = { deletedAt: null };

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

    if (!asset || asset.deletedAt) {
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
    if (!current || current.deletedAt) {
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
    if (!asset || asset.deletedAt) {
      const error = new Error('Không tìm thấy tài sản để xóa.');
      error.statusCode = 404;
      throw error;
    }

    await this.ensureNoScan(id);
    const changed = await prisma.asset.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), deletedBy: userId } });
    if (!changed.count) throw Object.assign(new Error('Tài sản đã được chuyển vào thùng rác.'), { statusCode: 409 });

    await auditLog({
      userId,
      action: 'TRASH_ASSET',
      resource: 'asset',
      ipAddress,
      status: 'success',
      details: `Chuyển tài sản vào thùng rác: ${asset.name} (${asset.assetId})`,
    });

    return { message: 'Đã chuyển tài sản vào Sao lưu & Phục hồi → Thùng rác tài sản.' };
  }

  async ensureNoScan(id) {
    if (await prisma.scanJob.count({ where: { assetId: id, status: { in: ['queued', 'running'] } } })) {
      throw Object.assign(new Error('Tài sản đang được quét Nmap. Vui lòng đợi tác vụ kết thúc.'), { statusCode: 409 });
    }
  }

  async getTrash() {
    return prisma.asset.findMany({ where: { deletedAt: { not: null } }, include: { category: true,
      _count: { select: { vulnerabilities: true, risks: true, alerts: true, incidents: true } } }, orderBy: { deletedAt: 'desc' } });
  }

  async restoreAsset(id, userId, ipAddress) {
    const changed = await prisma.asset.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null, deletedBy: null } });
    if (!changed.count) throw Object.assign(new Error('Không tìm thấy tài sản trong thùng rác.'), { statusCode: 404 });
    await auditLog({ userId, ipAddress, action: 'RESTORE_ASSET', resource: 'asset', details: `Khôi phục tài sản từ thùng rác: ${id}` });
    return { message: 'Đã khôi phục tài sản về Quản lý tài sản.' };
  }

  async permanentlyDeleteAsset(id, confirmation, userId, ipAddress) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset || !asset.deletedAt) throw Object.assign(new Error('Chỉ được xóa vĩnh viễn tài sản đang ở thùng rác.'), { statusCode: 404 });
    if (confirmation !== asset.assetId) throw Object.assign(new Error('Nhập đúng mã tài sản để xác nhận xóa vĩnh viễn.'), { statusCode: 400 });
    await this.ensureNoScan(id);
    const deleted = await prisma.asset.deleteMany({ where: { id, deletedAt: { not: null } } });
    if (!deleted.count) throw Object.assign(new Error('Tài sản không còn trong thùng rác. Vui lòng tải lại.'), { statusCode: 409 });
    await auditLog({ userId, ipAddress, action: 'PERMANENTLY_DELETE_ASSET', resource: 'asset', details: `Xóa vĩnh viễn tài sản: ${asset.name} (${asset.assetId}). Xóa kèm lỗ hổng/rủi ro; giữ cảnh báo/sự cố và bỏ liên kết tài sản.` });
    return { message: 'Đã xóa vĩnh viễn tài sản khỏi dữ liệu hiện tại.' };
  }

  async getCategories() {
    return prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new AssetService();
