import type { Request, Response, NextFunction } from "express";
import type { ProjectRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { roleRank } from "../lib/auth";

export function requireProjectRole(minRole: ProjectRole) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;
    const projectId = (req.params as any).projectId ?? (req.body as any).projectId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!projectId || typeof projectId !== "string")
      return res.status(400).json({ error: "Missing projectId" });

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { role: true },
    });
    if (!membership) return res.status(403).json({ error: "Not a project member" });

    if (roleRank[membership.role] < roleRank[minRole]) {
      return res.status(403).json({ error: "Insufficient role" });
    }

    return next();
  };
}

