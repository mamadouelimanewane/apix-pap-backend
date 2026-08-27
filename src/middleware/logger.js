export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';

    console.log(`${statusColor} [${res.statusCode}] ${req.method} ${req.path} - ${duration}ms`);
  });

  next();
};
