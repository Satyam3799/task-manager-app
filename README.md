# Task Manager (Full‑stack)

## Stack
- **Backend**: Node.js, Express, JWT auth, Prisma ORM, PostgreSQL
- **Frontend**: React (Vite) + Tailwind CSS

## Folder structure
```
task-manager-app/
  backend/
    prisma/
      schema.prisma
    src/
      lib/
      middleware/
      routes/
      server.ts
  frontend/
    src/
      components/
      lib/
      pages/
  docker-compose.yml
```

## Environment variables

### Backend (`backend/.env`)
- **PORT**: API port (default `4000`)
- **DATABASE_URL**: Postgres connection string
- **JWT_SECRET**: long random string (min 20 chars)
- **CORS_ORIGIN**: frontend origin (default `http://localhost:5173`)

Example: see `backend/.env.example`

### Frontend (`frontend/.env`)
- **VITE_API_URL**: backend base URL (default `http://localhost:4000`)

Example: see `frontend/.env.example`

## API routes

### Auth
- `POST /api/auth/signup` body `{ email, password, name? }`
- `POST /api/auth/login` body `{ email, password }`

### Dashboard
- `GET /api/dashboard` (auth) returns `{ stats: { tasksByStatus, overdueCount }, overdue[] }`

### Projects
- `GET /api/projects` (auth)
- `POST /api/projects` (auth) body `{ name, description? }`
- `GET /api/projects/:projectId` (auth + project member)
- `POST /api/projects/:projectId/members` (auth + ADMIN/OWNER) body `{ email, role }`
- `DELETE /api/projects/:projectId/members/:userId` (auth + ADMIN/OWNER)

### Tasks
- `POST /api/projects/:projectId/tasks` (auth + project member)
- `PATCH /api/projects/:projectId/tasks/:taskId` (auth + project member)
- `DELETE /api/projects/:projectId/tasks/:taskId` (auth + project member)

## Run locally

### 1) Start PostgreSQL
If you have Docker Desktop:

```bash
docker compose up -d
```

Or use any local Postgres and set `DATABASE_URL` in `backend/.env`.

### 2) Backend
```bash
cd backend
cp .env.example .env
npm i
npx prisma migrate dev --name init
npm run dev
```

### 3) Frontend
```bash
cd frontend
cp .env.example .env
npm i
npm run dev
```

## Deployment

### Backend (Railway)
- Create a **Railway** project from `backend/`
- Add **Railway PostgreSQL** plugin
- Set variables:
  - `DATABASE_URL` (from Railway Postgres)
  - `JWT_SECRET` (long random string)
  - `CORS_ORIGIN` (your frontend URL, e.g. `https://yourapp.vercel.app`)
  - `PORT` is provided by Railway automatically
- Deploy. `railway.json` runs `prisma migrate deploy` on start.

### Frontend (Vercel)
- Import `frontend/` into Vercel
- Set env var:
  - `VITE_API_URL` = your Railway backend URL
- Deploy

## Final testing checklist
- Auth: signup/login, invalid creds, token required routes
- Projects: create, list, open details
- Members: ADMIN/OWNER add/remove members; MEMBER cannot
- Tasks: CRUD; assignment; MEMBER cannot delete others’ tasks unless ADMIN/OWNER
- Dashboard: tasks-by-status loads; overdue list appears when dueDate is past and status != DONE

