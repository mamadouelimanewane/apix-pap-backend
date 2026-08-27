import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied for role: ${req.user.role}`));
    }

    next();
  };
};
