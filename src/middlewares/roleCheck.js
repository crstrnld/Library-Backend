const roleCheckMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req. user) {
      return res. status(401).json({
        success: false,
        message:  'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user. role)) {
      return res. status(403).json({
        success: false,
        message:  'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = roleCheckMiddleware;