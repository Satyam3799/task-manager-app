import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req, res) => {
  const userId = req.user!.userId;

  const memberProjectIds = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = memberProjectIds.map((m) => m.projectId);

  const [byStatus, overdue] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>;
  for (const row of byStatus) counts[row.status] = row._count._all;

  return res.json({
    stats: {
      tasksByStatus: counts,
      overdueCount: overdue.length,
    },
    overdue,
  });
});

