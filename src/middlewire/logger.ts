import type { NextFunction, Request, Response } from "express";
import fs from "fs";

const logger = (req: Request, res: Response, next: NextFunction) => {
  const time = new Date().toLocaleString();
  const log = `Method: ${req.method} | URL: ${req.originalUrl} | Time: ${time}\n`;

  console.log(log);

  fs.appendFile("logger.txt", log, (error) => {
    if (error) {
      console.log("Failed to write log:", error);
    }
  });

  next();
};

export default logger;
