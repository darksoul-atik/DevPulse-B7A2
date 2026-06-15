import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../utility/sendResponse.js";
import { userService } from "./user.service.js";

//!Creating a new user
const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await userService.createUserIntoDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const userController = {
  createUser,
};