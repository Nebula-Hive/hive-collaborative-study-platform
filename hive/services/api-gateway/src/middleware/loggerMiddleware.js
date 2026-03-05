const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  // Capture response finish to log status + duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    const now = new Date();

    // Format: [YYYY-MM-DD HH:MM:SS]
    const timestamp = now.toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');

    const statusColor =
      res.statusCode >= 500 ? '\x1b[31m' :  // red
      res.statusCode >= 400 ? '\x1b[33m' :  // yellow
      res.statusCode >= 300 ? '\x1b[36m' :  // cyan
                              '\x1b[32m';   // green
    const reset = '\x1b[0m';

    console.log(
      `${statusColor}[${timestamp}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms${reset}`
    );
  });

  next();
};

module.exports = loggerMiddleware;
