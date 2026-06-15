export type ROLES = "contributor" | "maintainer";

export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type ISSUE_TYPES = "bug" | "feature_request";

export const ISSUE_TYPE = {
  bug: "bug",
  feature_request: "feature_request",
} as const;

export type ISSUE_STATUSES = "open" | "in_progress" | "resolved";

export const ISSUE_STATUS = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved",
} as const;

export interface IJwtUser {
  id: number;
  name: string;
  role: ROLES;
}