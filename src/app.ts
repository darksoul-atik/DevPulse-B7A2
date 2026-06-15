import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config/index.js";
import { globalErrorHandler } from "./middlewire/globalErrorHandler.js";
import logger from "./middlewire/logger.js";
import { userRoute } from "./modules/users/user.route.js";
import { authRoute } from "./modules/auth___JWT/auth.route.js";
import { issueRoute } from "./modules/issues/issue.route.js";


const app: Application = express();

//!Middlewares
app.use(express.json());
app.use(logger);

//!CORS
app.use(
  cors({
    origin: config.client_url,
  }),
);

//!User registration route
app.use("/api/auth",userRoute);

//!User login route
app.use("/api/auth", authRoute);

//!Issue routes
app.use("/api/issues", issueRoute);

//!Server check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "DevPulse API is running",
  });
});

//!Not found route
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
    errors: `${req.method} ${req.originalUrl} does not exist`,
  });
});

//!Global error handler
app.use(globalErrorHandler);

export default app;