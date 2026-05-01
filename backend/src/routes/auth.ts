import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import { signAccessToken } from "../lib/auth";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).optional(),
    })
    .parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: { email: body.email, name: body.name, passwordHash },
    select: { id: true, email: true, name: true },
  });

  const token = signAccessToken({
    jwtSecret: env.JWT_SECRET,
    user: { userId: user.id, email: user.email },
    expiresIn: "7d",
  });

  return res.json({ token, user });
});

authRouter.post("/login", async (req, res) => {
  const body = z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAccessToken({
    jwtSecret: env.JWT_SECRET,
    user: { userId: user.id, email: user.email },
    expiresIn: "7d",
  });

  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

