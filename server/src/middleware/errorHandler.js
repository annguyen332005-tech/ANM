const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error: ${err.message}`);

  if (err.name === 'ZodError' || err.issues) {
    const errorDetails = err.issues?.map((i) => i.message).join(', ');
    return res.status(400).json({
      message: errorDetails || 'Dữ liệu đầu vào không hợp lệ.',
    });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
  });
}

module.exports = errorHandler;
