import { StatusCodes } from "http-status-codes";
import { pool } from "../../db/index.js";
import type { ICustomError } from "../../middlewire/globalErrorHandler.js";
import {
  ISSUE_STATUS,
  ISSUE_TYPE,
  USER_ROLE,
  type IJwtUser,
} from "../../types/index.js";
import { userService } from "../users/user.service.js";
import type {
  ICreateIssuePayload,
  IIssue,
  IIssueQuery,
  IUpdateIssuePayload,
  TIssueWithReporter,
} from "./issue.interface.js";

//!Checking issue id
const getValidIssueId = (id: string) => {
  const issueId = Number(id);

  if (!Number.isInteger(issueId) || issueId <= 0) {
    const error = new Error(
      "Issue id must be a positive number",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  return issueId;
};

//!Checking issue data
const checkIssueData = (
  payLoad: ICreateIssuePayload | IUpdateIssuePayload,
  isUpdate: boolean,
) => {
  //!Checking title
  if (payLoad.title !== undefined) {
    if (typeof payLoad.title !== "string") {
      const error = new Error(
        "Title must be a string",
      ) as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    const title = payLoad.title.trim();

    if (!title) {
      const error = new Error("Title is required") as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    if (title.length > 150) {
      const error = new Error(
        "Title cannot be more than 150 characters",
      ) as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  } else if (!isUpdate) {
    const error = new Error("Title is required") as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking description
  if (payLoad.description !== undefined) {
    if (typeof payLoad.description !== "string") {
      const error = new Error(
        "Description must be a string",
      ) as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    const description = payLoad.description.trim();

    if (description.length < 20) {
      const error = new Error(
        "Description must be at least 20 characters",
      ) as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  } else if (!isUpdate) {
    const error = new Error("Description is required") as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking issue type
  if (payLoad.type !== undefined) {
    if (
      payLoad.type !== ISSUE_TYPE.bug &&
      payLoad.type !== ISSUE_TYPE.feature_request
    ) {
      const error = new Error(
        "Type must be bug or feature_request",
      ) as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  } else if (!isUpdate) {
    const error = new Error("Type is required") as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking issue status
  if ("status" in payLoad && payLoad.status !== undefined) {
    if (
      payLoad.status !== ISSUE_STATUS.open &&
      payLoad.status !== ISSUE_STATUS.in_progress &&
      payLoad.status !== ISSUE_STATUS.resolved
    ) {
      const error = new Error(
        "Status must be open, in_progress or resolved",
      ) as ICustomError;

      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  }
};

//!Creating issue into database
const createIssueIntoDB = async (
  payLoad: ICreateIssuePayload,
  reporterId: number,
) => {
  checkIssueData(payLoad, false);

  const result = await pool.query<IIssue>(
    `
      INSERT INTO issues(title, description, type, reporter_id)
      VALUES($1, $2, $3, $4)
      RETURNING *
    `,
    [
      payLoad.title.trim(),
      payLoad.description.trim(),
      payLoad.type,
      reporterId,
    ],
  );

  const newIssue = result.rows[0];

  if (!newIssue) {
    const error = new Error(
      "Issue could not be created",
    ) as ICustomError;

    error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }

  return newIssue;
};

//!Getting all issues from database
const getAllIssuesFromDB = async (queryData: IIssueQuery) => {
  const sort = queryData.sort || "newest";
  const type = queryData.type;
  const status = queryData.status;

  //!Checking sort value
  if (sort !== "newest" && sort !== "oldest") {
    const error = new Error(
      "Sort must be newest or oldest",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking type value
  if (
    type !== undefined &&
    type !== ISSUE_TYPE.bug &&
    type !== ISSUE_TYPE.feature_request
  ) {
    const error = new Error(
      "Type must be bug or feature_request",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking status value
  if (
    status !== undefined &&
    status !== ISSUE_STATUS.open &&
    status !== ISSUE_STATUS.in_progress &&
    status !== ISSUE_STATUS.resolved
  ) {
    const error = new Error(
      "Status must be open, in_progress or resolved",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const conditions: string[] = [];
  const values: string[] = [];

  //!Adding type filter
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  //!Adding status filter
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  let sqlQuery = `SELECT * FROM issues`;

  if (conditions.length > 0) {
    sqlQuery += ` WHERE ${conditions.join(" AND ")}`;
  }

  if (sort === "oldest") {
    sqlQuery += ` ORDER BY created_at ASC`;
  } else {
    sqlQuery += ` ORDER BY created_at DESC`;
  }

  const result = await pool.query<IIssue>(sqlQuery, values);
  const issues = result.rows;

  if (issues.length === 0) {
    return [];
  }

  //!Collecting reporter ids
  const reporterIds = issues.map((issue) => issue.reporter_id);

  //!Getting reporter data without SQL JOIN
  const reporters =
    await userService.getUsersByIdsFromDB(reporterIds);

  const allIssues: TIssueWithReporter[] = [];

  for (const issue of issues) {
    const reporter = reporters.find(
      (user) => user.id === issue.reporter_id,
    );

    if (!reporter) {
      const error = new Error(
        "Reporter information could not be found",
      ) as ICustomError;

      error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      throw error;
    }

    allIssues.push({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    });
  }

  return allIssues;
};

//!Getting single issue from database
const getSingleIssueFromDB = async (id: string) => {
  const issueId = getValidIssueId(id);

  const result = await pool.query<IIssue>(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId],
  );

  const issue = result.rows[0];

  if (!issue) {
    const error = new Error("Issue not found") as ICustomError;

    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  //!Getting reporter data without SQL JOIN
  const reporter = await userService.getUserByIdFromDB(
    issue.reporter_id,
  );

  if (!reporter) {
    const error = new Error(
      "Reporter information could not be found",
    ) as ICustomError;

    error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    throw error;
  }

  const singleIssue: TIssueWithReporter = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return singleIssue;
};

//!Updating issue into database
const updateIssueIntoDB = async (
  payLoad: IUpdateIssuePayload,
  id: string,
  loggedInUser: IJwtUser,
) => {
  const issueId = getValidIssueId(id);

  if (!payLoad || typeof payLoad !== "object" || Array.isArray(payLoad)) {
    const error = new Error(
      "A valid request body is required",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const receivedFields = Object.keys(payLoad);

  if (receivedFields.length === 0) {
    const error = new Error(
      "At least one field is required for update",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const allowedFields = [
    "title",
    "description",
    "type",
    "status",
  ];

  const hasInvalidField = receivedFields.some(
    (field) => !allowedFields.includes(field),
  );

  if (hasInvalidField) {
    const error = new Error(
      "Only title, description, type and status can be updated",
    ) as ICustomError;

    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  checkIssueData(payLoad, true);

  //!Finding existing issue
  const oldIssueResult = await pool.query<IIssue>(
    `SELECT * FROM issues WHERE id = $1`,
    [issueId],
  );

  const oldIssue = oldIssueResult.rows[0];

  if (!oldIssue) {
    const error = new Error("Issue not found") as ICustomError;

    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  //!Checking contributor permission
  if (loggedInUser.role === USER_ROLE.contributor) {
    if (oldIssue.reporter_id !== loggedInUser.id) {
      const error = new Error(
        "Contributors can update only their own issues",
      ) as ICustomError;

      error.statusCode = StatusCodes.FORBIDDEN;
      throw error;
    }

    if (oldIssue.status !== ISSUE_STATUS.open) {
      const error = new Error(
        "Contributors can update an issue only while its status is open",
      ) as ICustomError;

      error.statusCode = StatusCodes.CONFLICT;
      throw error;
    }

    if (payLoad.status !== undefined) {
      const error = new Error(
        "Contributors cannot change issue status",
      ) as ICustomError;

      error.statusCode = StatusCodes.FORBIDDEN;
      throw error;
    }
  }

  const title =
    payLoad.title !== undefined
      ? payLoad.title.trim()
      : null;

  const description =
    payLoad.description !== undefined
      ? payLoad.description.trim()
      : null;

  const type =
    payLoad.type !== undefined
      ? payLoad.type
      : null;

  const status =
    payLoad.status !== undefined
      ? payLoad.status
      : null;

  //!Updating issue
  const result = await pool.query<IIssue>(
    `
      UPDATE issues
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `,
    [title, description, type, status, issueId],
  );

  const updatedIssue = result.rows[0];

  if (!updatedIssue) {
    const error = new Error("Issue not found") as ICustomError;

    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  return updatedIssue;
};

//!Deleting issue from database
const deleteIssueFromDB = async (id: string) => {
  const issueId = getValidIssueId(id);

  const result = await pool.query(
    `
      DELETE FROM issues
      WHERE id = $1
      RETURNING id
    `,
    [issueId],
  );

  if (result.rows.length === 0) {
    const error = new Error("Issue not found") as ICustomError;

    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};