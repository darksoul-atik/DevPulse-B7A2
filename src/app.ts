import cors from "cors";
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import config from "./config/index.js";
import { globalErrorHandler, createError } from "./middlewire/globalErrorHandler.js";
import logger from "./middlewire/logger.js";
import { authRoute } from "./modules/auth____JWT/auth.route.js";
import { issueRoute } from "./modules/issues/issue.route.js";
import { userRoute } from "./modules/users/user.route.js";

const app: Application = express();

//!Middlewires
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

//Logger MiddleWire
app.use(logger);

//CORS
app.use(
  cors({
    origin: config.client_url === "*" ? true : config.client_url,
    credentials: true,
  }),
);

//User registration route
app.use("/api/auth", userRoute);

//Authentication and JWT process
app.use("/api/auth", authRoute);

//Issues route
app.use("/api/issues", issueRoute);

//!SERVER CHECK
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API is running",
  });
});

//!Not found route
app.use((req: Request, res: Response, next: NextFunction) => {
  next(
    createError(
      404,
      "Route not found",
      `${req.method} ${req.originalUrl} does not exist`,
    ),
  );
});

//!Global error handler
app.use(globalErrorHandler);

export default app;
