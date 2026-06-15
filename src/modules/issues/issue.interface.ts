import type { ISSUE_STATUSES, ISSUE_TYPES } from "../../types/index.js";
import type { IReporter } from "../users/user.interface.js";

export interface IIssue {
  id: number;
  title: string;
  description: string;
  type: ISSUE_TYPES;
  status: ISSUE_STATUSES;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface ICreateIssuePayload {
  title: string;
  description: string;
  type: ISSUE_TYPES;
}

export interface IUpdateIssuePayload {
  title?: string;
  description?: string;
  type?: ISSUE_TYPES;
  status?: ISSUE_STATUSES;
}

export interface IIssueQuery {
  sort?: "newest" | "oldest";
  type?: ISSUE_TYPES;
  status?: ISSUE_STATUSES;
}

export interface TIssueWithReporter {
  id: number;
  title: string;
  description: string;
  type: ISSUE_TYPES;
  status: ISSUE_STATUSES;
  reporter: IReporter;
  created_at: Date;
  updated_at: Date;
}