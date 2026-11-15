const { z } = require('zod');

const integrationSchema = z.object({
  name: z.string().min(2, 'Tên công cụ tích hợp không được để trống'),
  type: z.enum(['SIEM', 'EDR', 'IDS_IPS', 'WAF', 'Monitoring', 'Firewall']),
  endpoint: z.string().optional().nullable(),
  status: z.enum(['configured', 'active', 'inactive', 'error']).default('configured'),
  configJson: z.string().optional().nullable(),
});

module.exports = {
  integrationSchema,
};
