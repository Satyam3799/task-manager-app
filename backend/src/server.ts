import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { corsOrigins, env } from "./lib/env";
import { authRouter } from "./routes/auth";
import { projectsRouter } from "./routes/projects";
import { tasksRouter } from "./routes/tasks";
import { dashboardRouter } from "./routes/dashboard";

const app = express();

app.use(morgan("dev"));
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser requests (curl/postman) with no Origin
      if (!origin) return cb(null, true);
      if (corsOrigins.includes("*")) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/tasks", tasksRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  const message = typeof err?.message === "string" ? err.message : "Server error";
  const status = typeof err?.status === "number" ? err.status : 400;
  return res.status(status).json({ error: message });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

