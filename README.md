# Novel Agent

This repository is initialized as a minimal monorepo skeleton for the Novel Agent MVP.

## Structure

- `backend/`: Go + Echo backend
- `frontend/`: React + TypeScript + Vite + MUI frontend
- `docs/`: project documentation
- `docker-compose.yml`: local MySQL service

## Prerequisites

- Go 1.22+
- Node.js 20+
- npm 10+
- Docker Desktop (or Docker Engine with Compose)

## Start MySQL

```bash
docker compose up -d mysql
```

MySQL connection defaults:

- host: `127.0.0.1`
- port: `3306`
- database: `novel_agent`
- user: `novel`
- password: `novel`

## Start Backend

```bash
cd backend
go mod tidy
go run ./cmd/api
```

Optional environment variables:

- `PORT` (default: `8080`)
- `MYSQL_DSN` (default points to local docker-compose MySQL)
- `JWT_SECRET` (placeholder for future auth wiring)

Backend endpoints:

- health check: `GET http://localhost:8080/health`
- db check: `GET http://localhost:8080/health/db`

## Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Notes

- Current progress includes Phase 1 (project initialization) and Phase 2 (backend infrastructure baseline: config + DB connection + health endpoints).
- Auth, CRUD, OpenAI generation, RAG, MCP, Google Drive, and multi-agent workflow are intentionally not implemented.
