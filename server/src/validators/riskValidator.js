const { z } = require('zod');

const riskSchema = z.object({
  assetId: z.string().min(1, 'Vui lòng chọn tài sản liên kết'),
  title: z.string().min(3, 'Tên rủi ro phải từ 3 ký tự trở lên'),
  likelihood: z.enum(['low', 'medium', 'high']).default('medium'),
  impact: z.enum(['low', 'medium', 'high']).default('medium'),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  mitigation: z.string().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'mitigated', 'accepted']).default('open'),
});

module.exports = {
  riskSchema,
};
