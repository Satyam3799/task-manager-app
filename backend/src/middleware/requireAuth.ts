import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/auth";
import { env } from "../lib/env";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  try {
    req.user = verifyAccessToken({ jwtSecret: env.JWT_SECRET, token });
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

