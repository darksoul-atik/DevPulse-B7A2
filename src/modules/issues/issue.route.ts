import { Router } from "express";
import auth from "../../middlewire/auth.js";
import { USER_ROLE } from "../../types/index.js";
import { issueController } from "./issue.controller.js";

const router = Router();

//!Create issue by authenticated user
router.post(
  "/",
  auth(),
  issueController.createIssue,
);

//!Get all issues
router.get(
  "/",
  issueController.getAllIssues,
);

//!Get single issue
router.get(
  "/:id",
  issueController.getSingleIssue,
);

//!Update issue by authenticated user
router.patch(
  "/:id",
  auth(),
  issueController.updateIssue,
);

//!Delete issue only by maintainer
router.delete(
  "/:id",
  auth(USER_ROLE.maintainer),
  issueController.deleteIssue,
);

export const issueRoute = router;