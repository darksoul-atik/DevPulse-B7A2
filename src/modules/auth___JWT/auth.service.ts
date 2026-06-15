import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../../config/index.js";
import type { TSafeUser } from "../users/user.interface.js";
import { userService } from "../users/user.service.js";

interface ILoginPayload {
  email: string;
  password: string;
}

//!Login user into database
const loginUserIntoDB = async (payLoad: ILoginPayload) => {
  const email = payLoad.email?.trim().toLowerCase();
  const password = payLoad.password;

  //!Checking email and password
  if (!email || !password) {
    const error: any = new Error("Email and password are required");

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Finding user by email
  const user = await userService.getUserByEmailFromDB(email);

  if (!user) {
    const error: any = new Error("Invalid email or password");

    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  //!Comparing password
  const matchPassword = await bcrypt.compare(
    password,
    user.password,
  );

  if (!matchPassword) {
    const error: any = new Error("Invalid email or password");

    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  //!Creating JWT payload
  const jwtPayLoad = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  //!Generating JWT token
  const token = jwt.sign(
    jwtPayLoad,
    config.jwt_secret,
    {
      expiresIn: config.jwt_expires_in,
    },
  );

  //!Removing password from user response
  const safeUser: TSafeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return {
    token,
    user: safeUser,
  };
};

export const authService = {
  loginUserIntoDB,
};