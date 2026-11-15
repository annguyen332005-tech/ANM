const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(3, 'Username phải từ 3 ký tự trở lên').max(30, 'Username tối đa 30 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên').max(128, 'Mật khẩu tối đa 128 ký tự'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự trở lên').max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
};
