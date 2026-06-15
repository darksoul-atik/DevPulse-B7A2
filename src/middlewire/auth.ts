import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import config from "../config/index.js";
import { pool } from "../db/index.js";
import type { IJwtUser, ROLES } from "../types/index.js";

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      //!Checking token exists or not
      if (!token) {
        const error: any = new Error("JWT token is required");
        error.statusCode = 401;
        throw error;
      }

      //!Verifying token
      const decoded = jwt.verify(
        token,
        config.jwt_secret,
      ) as IJwtUser;

      //!Checking decoded user information
      if (!decoded.id || !decoded.name || !decoded.role) {
        const error: any = new Error("Invalid JWT token");
        error.statusCode = 401;
        throw error;
      }

      //!Finding user from database
      const userData = await pool.query<IJwtUser>(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [decoded.id],
      );

      const user = userData.rows[0];

      //!Checking user exists or not
      if (!user) {
        const error: any = new Error("User not found");
        error.statusCode = 401;
        throw error;
      }

      //!Checking user role
      if (roles.length > 0 && !roles.includes(user.role)) {
        const error: any = new Error(
          "You do not have permission to perform this action",
        );

        error.statusCode = 403;
        throw error;
      }

      //!Adding logged in user information into request
      req.user = user;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;