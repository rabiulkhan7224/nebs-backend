// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import User from "../modules/auth/user.model";

// Extend Express Request to include user
// declare global {
//   namespace Express {
//     interface Request {
//       user: {
//         _id: string;
//         email: string;
//         role: "admin" | "hr" | "employee";
//         [key: string]: any;
//       };
//     }
//   }
// }

// Protect routes - verify JWT token
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // Check for token in headers
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token, deny access
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt_access_token_secret) as { id: string };

    // Find user and attach to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      });
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token.",
    });
  }
};

// Restrict to admin & HR only
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. User not found.",
    });
  }

  if (!["admin", "hr"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin/HR role required.",
    });
  }

  next();
};

// Optional: Employee can access their own resources
export const restrictToSelf = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (req.user.role === "admin" || req.user.role === "hr") {
    return next(); // Admin/HR can access anything
  }

  if (req.params.id !== req.user._id && req.body.employee !== req.user._id) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own data.",
    });
  }

  next();
};