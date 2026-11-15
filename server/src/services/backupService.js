const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

// SQLite DB path từ DATABASE_URL env
function getDbPath() {
  const dbUrl = process.env.DATABASE_URL || 'file:./database/secureweb.db';
  // DATABASE_URL = "file:../database/secureweb.db" (relative to prisma/)
  const relativePath = dbUrl.replace(/^file:/, '');
  return path.resolve(__dirname, '../../database', 'secureweb.db');
}

function getBackupDir() {
  const dir = path.resolve(__dirname, '../../backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function computeChecksum(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

class BackupService {
  // ─── Backup CRUD ─────────────────────────────────────────────────────────

  async getAllBackups() {
    return prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBackupById(id) {
    const backup = await prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      const error = new Error('Không tìm thấy bản backup.');
      error.statusCode = 404;
      throw error;
    }
    return backup;
  }

  async getStats() {
    const [total, success, failed, backups] = await Promise.all([
      prisma.backup.count(),
      prisma.backup.count({ where: { status: 'success' } }),
      prisma.backup.count({ where: { status: 'failed' } }),
      prisma.backup.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    const totalSize = backups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);
    const latest = backups[0] || null;

    return { total, success, failed, totalSizeBytes: totalSize, totalSizeFormatted: formatBytes(totalSize), latest };
  }

  // ─── Thực hiện backup (SQLite VACUUM INTO) ───────────────────────────────

  async createBackup(data, userId, ipAddress) {
    const backupDir = getBackupDir();
    const dbPath = getDbPath();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const backupName = data.name
      ? `${data.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}`
      : `secureweb_backup_${timestamp}`;
    const backupFile = path.join(backupDir, `${backupName}.db`);

    let status = 'success';
    let sizeBytes = null;
    let checksum = null;
    let errorMessage = null;

    try {
      // Dùng VACUUM INTO để backup SQLite an toàn trong khi đang chạy
      await prisma.$executeRawUnsafe(`VACUUM INTO '${backupFile.replace(/\\/g, '/')}'`);

      if (fs.existsSync(backupFile)) {
        const stat = fs.statSync(backupFile);
        sizeBytes = stat.size;
        checksum = computeChecksum(backupFile);
      } else {
        status = 'failed';
        errorMessage = 'File backup không được tạo.';
      }
    } catch (err) {
      status = 'failed';
      errorMessage = err.message;
    }

    const backup = await prisma.backup.create({
      data: {
        name: backupName,
        filePath: backupFile,
        sizeBytes,
        status,
        checksum,
        createdBy: userId || null,
      },
    });

    await auditLog({
      userId,
      action: status === 'success' ? 'CREATE_BACKUP' : 'CREATE_BACKUP_FAILED',
      resource: 'backup',
      ipAddress,
      status,
      details: status === 'success'
        ? `Backup thành công: ${backupName} (${formatBytes(sizeBytes)})`
        : `Backup thất bại: ${errorMessage}`,
    });

    if (status === 'failed') {
      const error = new Error(errorMessage || 'Backup thất bại.');
      error.statusCode = 500;
      throw error;
    }

    return { ...backup, sizeFormatted: formatBytes(sizeBytes) };
  }

  // ─── Khôi phục từ backup ─────────────────────────────────────────────────

  async restoreBackup(backupId, data, userId, ipAddress) {
    const backup = await this.getBackupById(backupId);

    if (backup.status !== 'success') {
      const error = new Error('Chỉ có thể khôi phục từ backup thành công.');
      error.statusCode = 400;
      throw error;
    }

    if (!fs.existsSync(backup.filePath)) {
      const error = new Error(`File backup không tồn tại tại: ${backup.filePath}`);
      error.statusCode = 404;
      throw error;
    }

    // Xác minh checksum
    let checksumValid = true;
    if (backup.checksum) {
      const currentChecksum = computeChecksum(backup.filePath);
      checksumValid = currentChecksum === backup.checksum;
    }

    if (!checksumValid) {
      const error = new Error('File backup bị thay đổi (checksum không khớp). Khôi phục bị từ chối vì lý do bảo mật.');
      error.statusCode = 422;
      throw error;
    }

    // Lưu lịch sử khôi phục
    const recovery = await prisma.recoveryHistory.create({
      data: {
        backupId,
        restoredBy: userId || null,
        status: 'simulated',
        notes: data.notes || `Khôi phục từ backup "${backup.name}". Trong môi trường demo, đây là mô phỏng quy trình restore.`,
      },
    });

    await auditLog({
      userId,
      action: 'RESTORE_BACKUP',
      resource: 'backup',
      ipAddress,
      status: 'success',
      details: `Mô phỏng khôi phục từ backup: ${backup.name}. Recovery ID: ${recovery.id}`,
    });

    return {
      recovery,
      backup,
      checksumValid,
      message: `Quy trình khôi phục từ backup "${backup.name}" đã được ghi nhận (simulated trong môi trường demo). Checksum: ${checksumValid ? '✓ Hợp lệ' : '✗ Không khớp'}.`,
    };
  }

  async deleteBackup(id, userId, ipAddress) {
    const backup = await this.getBackupById(id);

    // Xóa file vật lý nếu tồn tại
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    await prisma.backup.delete({ where: { id } });

    await auditLog({
      userId,
      action: 'DELETE_BACKUP',
      resource: 'backup',
      ipAddress,
      status: 'success',
      details: `Đã xóa backup: ${backup.name}`,
    });

    return { message: 'Đã xóa backup.' };
  }

  // ─── Recovery History ─────────────────────────────────────────────────────

  async getRecoveryHistory() {
    return prisma.recoveryHistory.findMany({
      orderBy: { restoredAt: 'desc' },
    });
  }

  // ─── System Settings ──────────────────────────────────────────────────────

  async getAllSettings() {
    return prisma.systemSetting.findMany({ orderBy: { category: 'asc' } });
  }

  async upsertSetting(key, value, category, userId, ipAddress) {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });

    await auditLog({
      userId,
      action: 'UPDATE_SYSTEM_SETTING',
      resource: 'system_setting',
      ipAddress,
      status: 'success',
      details: `Cập nhật cài đặt hệ thống: ${key}`,
    });

    return setting;
  }

  // ─── Verify backup integrity ──────────────────────────────────────────────

  async verifyBackup(id) {
    const backup = await this.getBackupById(id);

    if (!fs.existsSync(backup.filePath)) {
      return { valid: false, reason: 'File không tồn tại trên disk.' };
    }

    if (!backup.checksum) {
      return { valid: null, reason: 'Không có checksum để xác minh.' };
    }

    const currentChecksum = computeChecksum(backup.filePath);
    const valid = currentChecksum === backup.checksum;

    return {
      valid,
      storedChecksum: backup.checksum,
      currentChecksum,
      reason: valid ? 'File backup nguyên vẹn.' : 'Checksum không khớp – file có thể bị thay đổi!',
    };
  }
}

module.exports = new BackupService();
