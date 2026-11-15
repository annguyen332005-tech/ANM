const { z } = require('zod');

const alertSchema = z.object({
  title: z.string().min(3, 'Tiêu đề cảnh báo phải từ 3 ký tự trở lên'),
  description: z.string().min(5, 'Mô tả cảnh báo phải từ 5 ký tự trở lên'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  relatedAssetId: z.string().optional().nullable(),
  status: z.enum(['open', 'acknowledged', 'resolved', 'dismissed']).default('open'),
});

const alertStatusUpdateSchema = z.object({
  status: z.enum(['open', 'acknowledged', 'resolved', 'dismissed']),
});

module.exports = {
  alertSchema,
  alertStatusUpdateSchema,
};
