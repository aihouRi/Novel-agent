# Novel Agent (MVP Phase 1)

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

Backend endpoint:

- health check: `GET http://localhost:8080/health`

## Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Notes

- This phase only includes project initialization and health check endpoint.
- Auth, CRUD, OpenAI generation, RAG, MCP, Google Drive, and multi-agent workflow are intentionally not implemented.
