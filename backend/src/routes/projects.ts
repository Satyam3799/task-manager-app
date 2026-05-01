import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireProjectRole } from "../middleware/requireProjectRole";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", async (req, res) => {
  const userId = req.user!.userId;
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      members: { select: { role: true, user: { select: { id: true, email: true, name: true } } } },
      _count: { select: { tasks: true } },
    },
  });
  return res.json({ projects });
});

projectsRouter.post("/", async (req, res) => {
  const userId = req.user!.userId;
  const body = z
    .object({ name: z.string().min(1), description: z.string().optional() })
    .parse(req.body);

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { id: true, name: true, description: true, createdAt: true },
  });

  return res.status(201).json({ project });
});

projectsRouter.get("/:projectId", requireProjectRole("MEMBER"), async (req, res) => {
  const projectId = req.params.projectId as string;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          role: true,
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      tasks: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          updatedAt: true,
          createdBy: { select: { id: true, email: true, name: true } },
          assignedTo: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });
  if (!project) return res.status(404).json({ error: "Project not found" });
  return res.json({ project });
});

projectsRouter.post(
  "/:projectId/members",
  requireProjectRole("ADMIN"),
  async (req, res) => {
    const projectId = req.params.projectId as string;
    const body = z
      .object({
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const member = await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: user.id, projectId } },
      create: { userId: user.id, projectId, role: body.role },
      update: { role: body.role },
      select: { id: true, role: true, user: { select: { id: true, email: true, name: true } } },
    });

    return res.status(201).json({ member });
  }
);

projectsRouter.delete(
  "/:projectId/members/:userId",
  requireProjectRole("ADMIN"),
  async (req, res) => {
    const projectId = req.params.projectId as string;
    const userIdToRemove = req.params.userId as string;
    const requesterId = req.user!.userId;

    const requester = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: requesterId, projectId } },
      select: { role: true },
    });
    if (!requester) return res.status(403).json({ error: "Not a project member" });

    // Prevent removing the sole OWNER
    const target = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userIdToRemove, projectId } },
      select: { role: true },
    });
    if (!target) return res.status(404).json({ error: "Membership not found" });

    if (target.role === "OWNER") {
      const owners = await prisma.projectMember.count({ where: { projectId, role: "OWNER" } });
      if (owners <= 1) return res.status(400).json({ error: "Cannot remove sole OWNER" });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: userIdToRemove, projectId } },
    });
    return res.json({ ok: true });
  }
);

