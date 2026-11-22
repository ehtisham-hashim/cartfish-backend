import ApiError from "../utils/ApiError.js";

// Variadic Higher-Order RBAC Middleware: authorizeRoles("admin") or authorizeRoles("seller", "admin")
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized - Authentication required");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Forbidden - Not allowed`);
    }
    next();
  };
};
