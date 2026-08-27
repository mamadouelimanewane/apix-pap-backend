export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${status}] ${message}`, err);

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      status: 404,
      message: `Route ${req.originalUrl} not found`
    }
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
