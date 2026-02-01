const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandler"); // ✅ REQUIRED

const authMiddleware = (req, res, next) => {
  // Check for token in cookies first, then in Authorization header
  let authToken = req.cookies?.auth_token;
  
  if (!authToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!authToken) {
    return response(
      res,
      401,
      false,
      "No authentication token, access denied. Please provide a valid token"
    );
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    return response(res, 401, false, "Invalid authentication token");
  }
};
//
module.exports = authMiddleware;
