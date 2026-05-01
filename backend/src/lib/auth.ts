import jwt from "jsonwebtoken";
import type { ProjectRole } from "@prisma/client";

export type JwtUser = { userId: string; email: string };

export function signAccessToken(params: {
  jwtSecret: string;
  user: JwtUser;
  expiresIn: string;
}) {
  return jwt.sign(params.user, params.jwtSecret, { expiresIn: params.expiresIn });
}

export function verifyAccessToken(params: { jwtSecret: string; token: string }): JwtUser {
  const payload = jwt.verify(params.token, params.jwtSecret);
  if (typeof payload !== "object" || payload === null) throw new Error("Invalid token");
  const userId = (payload as any).userId;
  const email = (payload as any).email;
  if (typeof userId !== "string" || typeof email !== "string") throw new Error("Invalid token");
  return { userId, email };
}

export const roleRank: Record<ProjectRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

