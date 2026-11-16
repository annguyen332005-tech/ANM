const bcrypt = require('argon2');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const auditLog = require('../middleware/audit');

const normalizeEmail = (val) => val.trim().toLowerCase();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'secureweb-dev-secret-key-change-me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

class AuthService {
  async register(data, ipAddress) {
    const normalizedEmail = normalizeEmail(data.email);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: data.username.trim() },
        ],
      },
    });

    if (existing) {
      const error = new Error('Email hoặc username đã tồn tại trong hệ thống.');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username.trim(),
        email: normalizedEmail,
        passwordHash,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'User' },
      update: {},
      create: { name: 'User', description: 'Người dùng cơ bản' },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userRole.id,
      },
    });

    await auditLog({
      userId: user.id,
      action: 'REGISTER_USER',
      resource: 'user',
      ipAddress: ipAddress || 'unknown',
      status: 'success',
      details: `Đăng ký tài khoản mới: ${user.username}`,
    });

    const token = signToken(user);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: ['User'],
      },
    };
  }

  async login({ email, password }, ipAddress) {
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (user && !user.isActive) {
      const error = new Error('Tài khoản đã bị khóa vĩnh viễn hoặc bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
      error.statusCode = 403;
      throw error;
    }

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const seconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      const error = new Error(`Tài khoản đang bị khóa 5 phút do nhập sai mật khẩu 5 lần. Vui lòng thử lại sau ${seconds} giây.`);
      error.statusCode = 403;
      throw error;
    }

    if (!user) {
      await auditLog({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        ipAddress: ipAddress || 'unknown',
        status: 'failed',
        details: 'Đăng nhập thất bại: tài khoản không tồn tại hoặc bị khóa',
      });
      const error = new Error('Email hoặc mật khẩu không chính xác.');
      error.statusCode = 401;
      throw error;
    }

    const validPassword = await bcrypt.verify(user.passwordHash, password);

    if (!validPassword) {
      const nextFailCount = user.failedLoginCount + 1;
      const willLock = nextFailCount >= 5;
      const permanent = willLock && user.lockoutCount >= 1;

      const changed = await prisma.user.updateMany({
        where: { id: user.id, failedLoginCount: user.failedLoginCount, lockoutCount: user.lockoutCount, lockedUntil: user.lockedUntil, isActive: true },
        data: {
          failedLoginCount: willLock ? 0 : nextFailCount,
          lockoutCount: willLock ? user.lockoutCount + 1 : user.lockoutCount,
          lockedUntil: willLock && !permanent ? new Date(Date.now() + 5 * 60 * 1000) : null,
          isActive: !permanent,
        },
      });
      if (!changed.count) return this.login({ email, password }, ipAddress);

      await auditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        ipAddress: ipAddress || 'unknown',
        status: 'failed',
        details: willLock
          ? (permanent ? 'Khóa vĩnh viễn: tiếp tục sai 5 lần sau lần khóa đầu tiên' : 'Khóa 5 phút: đăng nhập sai 5 lần liên tiếp lần đầu')
          : `Sai mật khẩu lần thứ ${nextFailCount}`,
      });

      if (willLock) {
        const error = new Error(permanent
          ? 'Tài khoản đã bị khóa vĩnh viễn do tiếp tục nhập sai mật khẩu 5 lần sau lần khóa đầu tiên. Vui lòng liên hệ quản trị viên.'
          : 'Tài khoản đã bị khóa 5 phút do nhập sai mật khẩu 5 lần. Sau khi hết khóa, nếu tiếp tục sai đủ 5 lần, tài khoản sẽ bị khóa vĩnh viễn.');
        error.statusCode = 403;
        throw error;
      }

      const error = new Error(`Email hoặc mật khẩu không chính xác. Đã sai ${nextFailCount}/5 lần. ${user.lockoutCount >= 1 ? 'Sai đủ 5 lần sẽ khóa vĩnh viễn.' : 'Sai đủ 5 lần sẽ khóa 5 phút.'}`);
      error.statusCode = 401;
      throw error;
    }

    // Reset failed count and update lastLogin
    const changed = await prisma.user.updateMany({
      where: { id: user.id, failedLoginCount: user.failedLoginCount, lockoutCount: user.lockoutCount, lockedUntil: user.lockedUntil, isActive: true },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
    if (!changed.count) return this.login({ email, password }, ipAddress);

    await auditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      ipAddress: ipAddress || 'unknown',
      status: 'success',
      details: 'Đăng nhập thành công',
    });

    const token = signToken(user);
    const roles = user.userRoles.map((ur) => ur.role.name);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: roles.length > 0 ? roles : ['User'],
      },
    };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      const error = new Error('Không tìm thấy thông tin người dùng.');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.userRoles.map((ur) => ur.role.name),
    };
  }
}

module.exports = new AuthService();
