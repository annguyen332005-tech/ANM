const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Không xác thực được người dùng.' });
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });

      const roleNames = userRoles.map((item) => item.role.name);
      const hasAccess = roles.some((role) => roleNames.includes(role));

      if (!hasAccess) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này.' });
      }

      next();
    } catch (err) {
      return res.status(500).json({ message: 'Lỗi kiểm tra quyền.' });
    }
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
