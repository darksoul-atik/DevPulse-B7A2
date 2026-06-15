import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import config from "../config/index.js";
import { pool } from "../db/index.js";
import type { ROLES } from "../types/index.js";
import { USER_ROLE } from "../types/index.js";

interface IUserForAuth {
  id: number;
  name: string;
  role: ROLES;
}

const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      //!Checking token exists or not
      if (!token) {
        const error: any = new Error("JWT token is required");
        error.statusCode = StatusCodes.UNAUTHORIZED;
        throw error;
      }

      //!Verifying token
      const decoded = jwt.verify(token, config.jwt_secret);

      //!Checking decoded token data
      if (
        typeof decoded === "string" ||
        typeof decoded.id !== "number" ||
        typeof decoded.name !== "string" ||
        (decoded.role !== USER_ROLE.contributor &&
          decoded.role !== USER_ROLE.maintainer)
      ) {
        const error: any = new Error("Invalid JWT token");
        error.statusCode = StatusCodes.UNAUTHORIZED;
        throw error;
      }

      //!Finding user from database
      const userData = await pool.query<IUserForAuth>(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [decoded.id],
      );

      const user = userData.rows[0];

      //!Checking user exists or not
      if (!user) {
        const error: any = new Error("User not found");
        error.statusCode = StatusCodes.UNAUTHORIZED;
        throw error;
      }

      //!Checking user role
      if (roles.length > 0 && !roles.includes(user.role)) {
        const error: any = new Error(
          "You do not have permission to perform this action",
        );
        error.statusCode = StatusCodes.FORBIDDEN;
        throw error;
      }

      //!Adding user data into request
      req.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;