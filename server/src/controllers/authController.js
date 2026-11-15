const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../validators/authValidator');

class AuthController {
  async register(req, res, next) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData, req.ip);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData, req.ip);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
