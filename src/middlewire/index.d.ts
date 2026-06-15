import type { IJwtUser } from "../types/index.js";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: IJwtUser;
    }
  }
}
