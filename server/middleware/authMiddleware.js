const jwt = require('jsonwebtoken');


const authMiddleware = (req, res, next) => {
    const authToken = req.cookies?.auth_token;

    if (!authToken) {
        return response(res, 401, false, "No authentication token, access denied,please provide a valid token");
    }

    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(req.user);
        next();
    } catch (error) {
        console.error("Error in authMiddleware:", error);
        return response(res, 401, false, "Invalid authentication token");
    }
};
module.exports = authMiddleware;