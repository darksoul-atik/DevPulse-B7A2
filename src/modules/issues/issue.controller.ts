import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ICustomError } from "../../middlewire/globalErrorHandler.js";
import sendResponse from "../../utility/sendResponse.js";
import type { IIssueQuery } from "./issue.interface.js";
import { issueService } from "./issue.service.js";

//!Creating issue
const createIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("Unauthorized") as ICustomError;

      error.statusCode = StatusCodes.UNAUTHORIZED;
      throw error;
    }

    const result = await issueService.createIssueIntoDB(
      req.body,
      req.user.id,
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//!Getting all issues
const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const queryData: IIssueQuery = {};

    if (typeof req.query.sort === "string") {
      queryData.sort = req.query.sort as "newest" | "oldest";
    }

    if (typeof req.query.type === "string") {
      queryData.type = req.query.type as
        | "bug"
        | "feature_request";
    }

    if (typeof req.query.status === "string") {
      queryData.status = req.query.status as
        | "open"
        | "in_progress"
        | "resolved";
    }

    const result =
      await issueService.getAllIssuesFromDB(queryData);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//!Getting single issue
const getSingleIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    const result =
      await issueService.getSingleIssueFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//!Updating issue
const updateIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("Unauthorized") as ICustomError;

      error.statusCode = StatusCodes.UNAUTHORIZED;
      throw error;
    }

    const id = req.params.id as string;

    const result = await issueService.updateIssueIntoDB(
      req.body,
      id,
      req.user,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

//!Deleting issue
const deleteIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;

    await issueService.deleteIssueFromDB(id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};