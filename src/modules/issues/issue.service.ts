import { StatusCodes } from "http-status-codes";
import { pool } from "../../db/index.js";
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
    const error: any = new Error("Issue id must be a positive number");
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
    if (!payLoad.title.trim()) {
      const error: any = new Error("Title is required");
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    if (payLoad.title.trim().length > 150) {
      const error: any = new Error(
        "Title cannot be more than 150 characters",
      );
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  } else if (!isUpdate) {
    const error: any = new Error("Title is required");
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking description
  if (payLoad.description !== undefined) {
    if (payLoad.description.trim().length < 20) {
      const error: any = new Error(
        "Description must be at least 20 characters",
      );
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  } else if (!isUpdate) {
    const error: any = new Error("Description is required");
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking issue type
  if (payLoad.type !== undefined) {
    if (
      payLoad.type !== ISSUE_TYPE.bug &&
      payLoad.type !== ISSUE_TYPE.feature_request
    ) {
      const error: any = new Error(
        "Type must be bug or feature_request",
      );
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }
  } else if (!isUpdate) {
    const error: any = new Error("Type is required");
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
      const error: any = new Error(
        "Status must be open, in_progress or resolved",
      );
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
    const error: any = new Error("Issue could not be created");
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

  //!Checking sort
  if (sort !== "newest" && sort !== "oldest") {
    const error: any = new Error("Sort must be newest or oldest");
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking type
  if (
    type !== undefined &&
    type !== ISSUE_TYPE.bug &&
    type !== ISSUE_TYPE.feature_request
  ) {
    const error: any = new Error(
      "Type must be bug or feature_request",
    );
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  //!Checking status
  if (
    status !== undefined &&
    status !== ISSUE_STATUS.open &&
    status !== ISSUE_STATUS.in_progress &&
    status !== ISSUE_STATUS.resolved
  ) {
    const error: any = new Error(
      "Status must be open, in_progress or resolved",
    );
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const conditions: string[] = [];
  const values: string[] = [];

  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

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
  const reporterIds: number[] = [];

  for (const issue of issues) {
    if (!reporterIds.includes(issue.reporter_id)) {
      reporterIds.push(issue.reporter_id);
    }
  }

  //!Getting reporters without JOIN
  const reporters =
    await userService.getUsersByIdsFromDB(reporterIds);

  const allIssues: TIssueWithReporter[] = [];

  for (const issue of issues) {
    const reporter = reporters.find(
      (user) => user.id === issue.reporter_id,
    );

    if (!reporter) {
      const error: any = new Error(
        "Reporter information could not be found",
      );
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
    const error: any = new Error("Issue not found");
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  //!Getting reporter without JOIN
  const reporter = await userService.getUserByIdFromDB(
    issue.reporter_id,
  );

  if (!reporter) {
    const error: any = new Error(
      "Reporter information could not be found",
    );
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
  const receivedFields = Object.keys(payLoad);

  if (receivedFields.length === 0) {
    const error: any = new Error(
      "At least one field is required for update",
    );
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
    const error: any = new Error(
      "Only title, description, type and status can be updated",
    );
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
    const error: any = new Error("Issue not found");
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  //!Checking contributor permissions
  if (loggedInUser.role === USER_ROLE.contributor) {
    if (oldIssue.reporter_id !== loggedInUser.id) {
      const error: any = new Error(
        "Contributors can update only their own issues",
      );
      error.statusCode = StatusCodes.FORBIDDEN;
      throw error;
    }

    if (oldIssue.status !== ISSUE_STATUS.open) {
      const error: any = new Error(
        "Contributors can update an issue only while its status is open",
      );
      error.statusCode = StatusCodes.CONFLICT;
      throw error;
    }

    if (payLoad.status !== undefined) {
      const error: any = new Error(
        "Contributors cannot change issue status",
      );
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
    const error: any = new Error("Issue not found");
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
    const error: any = new Error("Issue not found");
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  return result;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB,
};