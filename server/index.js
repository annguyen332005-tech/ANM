const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 4000;

require('./src/services/nmapScanService').recoverInterrupted().then(() => {
  app.listen(PORT, () => {
    logger.info(`SecureWeb server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  logger.error(`Không thể khởi tạo lịch sử quét: ${err.message}. Chạy npx prisma db push trong thư mục server.`);
  process.exitCode = 1;
});
