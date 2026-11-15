const { z } = require('zod');

const incidentSchema = z.object({
  title: z.string().min(3, 'Tên sự cố phải từ 3 ký tự trở lên'),
  description: z.string().min(5, 'Mô tả sự cố phải từ 5 ký tự trở lên'),
  type: z.enum([
    'Brute-force attack',
    'Unauthorized access',
    'Malware detection',
    'SQL Injection',
    'XSS',
    'Network intrusion',
    'Vulnerability exploitation',
    'Suspicious login',
    'Other',
  ]).default('Other'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  assetId: z.string().optional().nullable(),
  detectedBy: z.string().optional().nullable(),
  status: z.enum(['new', 'investigating', 'contained', 'resolved', 'closed']).default('new'),
  assignedTo: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
});

const incidentActionSchema = z.object({
  action: z.string().min(2, 'Tên hành động không được để trống'),
  notes: z.string().optional().nullable(),
});

module.exports = {
  incidentSchema,
  incidentActionSchema,
};
