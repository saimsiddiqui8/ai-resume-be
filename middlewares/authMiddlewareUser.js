import jwt from "jsonwebtoken";
import User from "../models/user-model/user.model.js";
import Admin from "../models/admin-model/admin.model.js";

const authMiddlewareUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.query.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token not provided",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Check if user exists in the system
    let user = await User.findById(decoded.id);
    // If not found, try Admin model
    if (!user) {
      user = await Admin.findById(decoded.id);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account does not exist!",
      });
    }

    // Check if the user account has been soft-deleted
    if (user.is_deleted) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deleted. Please contact support for assistance.",
      });
    }

    // Check if the token was issued before tokenInvalidatedAt
    if (user.tokenInvalidatedAt && new Date(decoded.iat * 1000) < user.tokenInvalidatedAt) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // Check if the user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended due to violation of Community Guidelines.",
      });
    }

    req.user = user; // Attach user data to the request
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    } else {
      console.error("Error in authentication middleware:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};

export { authMiddlewareUser };