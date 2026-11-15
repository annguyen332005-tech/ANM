const { z } = require('zod');

const assetSchema = z.object({
  assetId: z.string().min(2, 'Mã tài sản phải có ít nhất 2 ký tự'),
  name: z.string().min(2, 'Tên tài sản phải có ít nhất 2 ký tự'),
  type: z.string().min(2, 'Loại tài sản không được để trống'),
  categoryId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  macAddress: z.string().optional().nullable(),
  os: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.enum(['active', 'maintenance', 'retired', 'offline']).default('active'),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

module.exports = {
  assetSchema,
};
