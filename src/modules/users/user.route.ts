import { Router } from "express";
import { userController } from "./user.controller.js";

const router = Router();

//!Create a user and save to database
router.post("/signup", userController.createUser);

export const userRoute = router;
