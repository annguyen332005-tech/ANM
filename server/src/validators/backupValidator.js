const { z } = require('zod');

const backupSchema = z.object({
  name: z.string().min(1, 'Tên backup là bắt buộc').max(100),
  notes: z.string().optional(),
});

const restoreSchema = z.object({
  backupId: z.string().min(1, 'BackupId là bắt buộc'),
  notes: z.string().optional(),
});

const systemSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  category: z.string().optional(),
});

module.exports = { backupSchema, restoreSchema, systemSettingSchema };
