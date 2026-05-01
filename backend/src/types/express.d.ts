import type { JwtUser } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export {};

