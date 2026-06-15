import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utility/sendResponse.js";
import { authService } from "./auth.service.js";


//!Login user
const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  loginUser,
};