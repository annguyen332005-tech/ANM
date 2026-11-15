const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`SecureWeb server running on http://localhost:${PORT}`);
});
