import { Router } from "express";
import { z } from "zod";
import { ProjectRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireProjectRole } from "../middleware/requireProjectRole";
import { roleRank } from "../lib/auth";

export const tasksRouter = Router({ mergeParams: true });

tasksRouter.use(requireAuth);
tasksRouter.use(requireProjectRole("MEMBER"));

tasksRouter.post("/", async (req, res) => {
  const userId = req.user!.userId;
  const projectId = (req.params as any).projectId as string;
  const body = z
    .object({
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
      dueDate: z.string().datetime().optional(),
      assignedToId: z.string().optional(),
    })
    .parse(req.body);

  if (body.assignedToId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: body.assignedToId, projectId } },
      select: { id: true },
    });
    if (!isMember) return res.status(400).json({ error: "Assignee must be a project member" });
  }

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status ?? "TODO",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      projectId,
      createdById: userId,
      assignedToId: body.assignedToId ?? null,
    },
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
  });

  return res.status(201).json({ task });
});

tasksRouter.patch("/:taskId", async (req, res) => {
  const projectId = (req.params as any).projectId as string;
  const taskId = (req.params as any).taskId as string;
  const userId = req.user!.userId;
  const body = z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
      dueDate: z.string().datetime().nullable().optional(),
      assignedToId: z.string().nullable().optional(),
    })
    .parse(req.body);

  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, createdById: true, assignedToId: true },
  });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });
  if (!membership) return res.status(403).json({ error: "Not a project member" });

  const isAdminPlus = roleRank[membership.role] >= roleRank[ProjectRole.ADMIN];
  const canEdit = isAdminPlus || existing.createdById === userId || existing.assignedToId === userId;
  if (!canEdit) return res.status(403).json({ error: "Not allowed to edit this task" });

  if (body.assignedToId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: body.assignedToId, projectId } },
      select: { id: true },
    });
    if (!isMember) return res.status(400).json({ error: "Assignee must be a project member" });
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      dueDate:
        body.dueDate === undefined ? undefined : body.dueDate === null ? null : new Date(body.dueDate),
      assignedToId: body.assignedToId === undefined ? undefined : body.assignedToId,
    },
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
  });

  return res.json({ task });
});

tasksRouter.delete("/:taskId", async (req, res) => {
  const projectId = (req.params as any).projectId as string;
  const taskId = (req.params as any).taskId as string;
  const userId = req.user!.userId;
  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, createdById: true },
  });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });
  if (!membership) return res.status(403).json({ error: "Not a project member" });

  const isAdminPlus = roleRank[membership.role] >= roleRank[ProjectRole.ADMIN];
  const canDelete = isAdminPlus || existing.createdById === userId;
  if (!canDelete) return res.status(403).json({ error: "Not allowed to delete this task" });

  await prisma.task.delete({ where: { id: existing.id } });
  return res.json({ ok: true });
});

