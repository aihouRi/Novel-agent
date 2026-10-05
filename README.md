**English** | [中文](#novel-agent-中文)

# Novel Agent

Novel Agent is an MVP web app for writing long-form Chinese novels.  
The current version completes the minimal loop of "settings management -> AI generation -> edit and save -> export".

## Current Features (MVP)

- User authentication: sign up, log in, get the current user
- Novel management: create, view, edit, delete
- Character management: create, view, edit, delete (with deletion protection for important characters)
- Volume management: create, rename, assign chapters to volumes
- Chapter management: create, view, edit, delete, dedicated writing page
- AI chapter generation: returns `outline/body/summary` and fills them back into the editor
- Markdown export: selectable range and content (body/summary/outline)

## Tech Stack

- Backend: Go + Echo
- Frontend: React + TypeScript + Vite + MUI
- Database: MySQL
- Auth: JWT
- AI: OpenAI API / Gemini API

## Project Structure

- `backend/`: Go backend
- `frontend/`: React frontend
- `docs/`: documentation (design docs and phase records)
- `docker-compose.yml`: local MySQL

## Local Setup

### 1) Start MySQL

```bash
docker compose up -d mysql
```

Default connection:
- host: `127.0.0.1`
- port: `3306`
- database: `novel_agent`
- user: `novel`
- password: `novel`

### 2) Start the Backend

```bash
cd backend
go mod tidy
go run ./cmd/api
```

Default address:
- `http://localhost:8080`

Health checks:
- `GET /health`
- `GET /health/db`

### 3) Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Default address:
- `http://localhost:5173`

## Backend Environment Variables

- `PORT` (default `8080`)
- `MYSQL_DSN` (defaults to the local docker MySQL)
- `JWT_SECRET`
- `OPENAI_API_KEY` (required to enable AI generation)
- `OPENAI_BASE_URL` (default `https://api.openai.com/v1`)
- `OPENAI_MODEL` (default `gpt-4o-mini`)
- `GEMINI_API_KEY` (set this when generating with Gemini)
- `GEMINI_BASE_URL` (default `https://generativelanguage.googleapis.com/v1beta`)
- `GEMINI_MODEL` (default `gemini-2.5-flash`)

Notes:
- You can also save per-user settings (Provider/Key/Base URL/Model) in the frontend under "User menu -> AI Settings".
- Per-user settings take precedence over environment variables for chapter generation.

## Environments (dev / test / prod)

The repository provides the following template files:
- `.env.example`: general template
- `.env.dev.example`: local development template
- `.env.test.example`: test template (for integration tests)

Recommended conventions:
- `dev`: connects to the `novel_agent` development database, `INTEGRATION_TEST=0`
- `test`: connects to the `novel_agent_test` test database, `INTEGRATION_TEST=1`
- `prod`: documentation placeholder only; real configuration will be provided at the deployment stage

Local loading example (zsh/bash):

```bash
cd backend
set -a
source ../.env.dev
set +a
go run ./cmd/api
```

Integration test loading example (zsh/bash):

```bash
cd backend
set -a
source ../.env.test
set +a
go test ./... -run Integration -v
```

## Database Migrations

Migration files are in `backend/migrations/` and are applied in file order.  
The project currently applies SQL migrations manually (via `docker compose exec mysql ...`).

## Database Backup and Restore (Recommended)

Back up the database before high-risk operations (bulk testing, schema changes, import/export).

### Backup

```bash
./scripts/db-backup.sh
```

Optional arguments:
- 1st argument: database name (default `novel_agent`)
- 2nd argument: output directory (default `./backups`)

Example:

```bash
./scripts/db-backup.sh novel_agent ./backups
```

### Restore

```bash
./scripts/db-restore.sh <backup.sql>
```

The optional 2nd argument is the database name (default `novel_agent`).

Notes:
- Restore runs `DROP DATABASE` and then recreates it, so it overwrites existing data.
- The script requires you to type `YES` manually as a second confirmation.

## Testing and Safety Rules

### Default Safe Tests (No Database Access)

```bash
cd backend
go test ./...
```

The default tests in this repository are safe tests and do not wipe the database.

### Integration Tests (Must Be Explicitly Enabled)

Database integration tests run only when all of the following hold:
- Explicitly enabled: `INTEGRATION_TEST=1`
- `MYSQL_DSN` points to a test database whose name contains `_test`

Example (for illustration only; adjust to the actual test files):

```bash
cd backend
INTEGRATION_TEST=1 MYSQL_DSN='novel:novel@tcp(127.0.0.1:3306)/novel_agent_test?parseTime=true&charset=utf8mb4,utf8' go test ./internal/repository -run Integration -v
```

Do not run integration tests against the main development database or the production database.

## Core API (Summary)

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Novels:
  - `GET/POST /novels`
  - `GET/PUT/DELETE /novels/:id`
- Characters:
  - `GET/POST /novels/:novelId/characters`
  - `GET/PUT/DELETE /novels/:novelId/characters/:id`
- Volumes:
  - `GET/POST /novels/:novelId/volumes`
  - `PUT /novels/:novelId/volumes/:id`
- Chapters:
  - `GET/POST /novels/:novelId/chapters`
  - `GET/PUT/DELETE /novels/:novelId/chapters/:id`
  - `POST /novels/:novelId/chapters/generate`
- Lore Entries:
  - `GET/POST /novels/:novelId/lore-entries`
  - `GET/PUT/DELETE /novels/:novelId/lore-entries/:id`
- Export:
  - `POST /novels/:novelId/export`
  - `GET /novels/:novelId/export/markdown` (legacy-compatible)
- User AI Settings:
  - `GET /users/me/ai-settings`
  - `PUT /users/me/ai-settings`

## Documentation

- MVP design doc (matches the current implementation): [docs/design.md](docs/design.md)
- V1 design doc: [docs/design-v1.md](docs/design-v1.md)
- V1 roadmap: [docs/roadmap-v1.md](docs/roadmap-v1.md)
- AI chapter generation tuning guide: [docs/ai-generation-guide.md](docs/ai-generation-guide.md)

---

<a id="novel-agent-中文"></a>

# Novel Agent

Novel Agent 是一个面向长篇中文小说创作的 MVP Web App。  
当前版本已完成从“设定管理 -> AI 生成 -> 编辑保存 -> 导出”的最小闭环。

## 当前功能（MVP）

- 用户认证：注册、登录、获取当前用户
- 小说管理：创建、查看、编辑、删除
- 人物管理：创建、查看、编辑、删除（含重要角色删除保护）
- 分卷管理：创建、改名、章节归卷
- 章节管理：创建、查看、编辑、删除、独立写作页
- AI 章节生成：返回 `outline/body/summary` 并回填编辑区
- Markdown 导出：支持范围与内容可选（正文/总结/大纲）

## 技术栈

- Backend: Go + Echo
- Frontend: React + TypeScript + Vite + MUI
- Database: MySQL
- Auth: JWT
- AI: OpenAI API / Gemini API

## 项目结构

- `backend/`: Go 后端
- `frontend/`: React 前端
- `docs/`: 文档（含设计书与阶段记录）
- `docker-compose.yml`: 本地 MySQL

## 本地启动

### 1) 启动 MySQL

```bash
docker compose up -d mysql
```

默认连接：
- host: `127.0.0.1`
- port: `3306`
- database: `novel_agent`
- user: `novel`
- password: `novel`

### 2) 启动 Backend

```bash
cd backend
go mod tidy
go run ./cmd/api
```

默认地址：
- `http://localhost:8080`

健康检查：
- `GET /health`
- `GET /health/db`

### 3) 启动 Frontend

```bash
cd frontend
npm install
npm run dev
```

默认地址：
- `http://localhost:5173`

## 后端环境变量

- `PORT`（默认 `8080`）
- `MYSQL_DSN`（默认本地 docker mysql）
- `JWT_SECRET`
- `OPENAI_API_KEY`（启用 AI 生成必填）
- `OPENAI_BASE_URL`（默认 `https://api.openai.com/v1`）
- `OPENAI_MODEL`（默认 `gpt-4o-mini`）
- `GEMINI_API_KEY`（使用 Gemini 生成时可填）
- `GEMINI_BASE_URL`（默认 `https://generativelanguage.googleapis.com/v1beta`）
- `GEMINI_MODEL`（默认 `gemini-2.5-flash`）

说明：
- 也可在前端“用户菜单 -> AI 设置”中保存用户级配置（Provider/Key/Base URL/Model）。
- 用户级配置会优先于环境变量用于章节生成。

## 环境分层（dev / test / prod）

当前仓库提供以下模板文件：
- `.env.example`：通用模板
- `.env.dev.example`：本地开发模板
- `.env.test.example`：测试模板（集成测试用）

推荐约定：
- `dev`：连接 `novel_agent` 开发库，`INTEGRATION_TEST=0`
- `test`：连接 `novel_agent_test` 测试库，`INTEGRATION_TEST=1`
- `prod`：仅文档占位，等部署阶段再提供真实配置

本地加载示例（zsh/bash）：

```bash
cd backend
set -a
source ../.env.dev
set +a
go run ./cmd/api
```

集成测试加载示例（zsh/bash）：

```bash
cd backend
set -a
source ../.env.test
set +a
go test ./... -run Integration -v
```

## 数据迁移

当前迁移文件在 `backend/migrations/`，按文件顺序执行。  
本项目目前使用手动执行 SQL 迁移（通过 `docker compose exec mysql ...`）。

## 数据备份与恢复（推荐）

建议在做高风险操作（批量测试、结构调整、导入导出）前先备份数据库。

### 备份

```bash
./scripts/db-backup.sh
```

可选参数：
- 第 1 个参数：数据库名（默认 `novel_agent`）
- 第 2 个参数：输出目录（默认 `./backups`）

示例：

```bash
./scripts/db-backup.sh novel_agent ./backups
```

### 恢复

```bash
./scripts/db-restore.sh <backup.sql>
```

可选第 2 参数为数据库名（默认 `novel_agent`）。

注意：
- 恢复会先 `DROP DATABASE` 再重建，属于覆盖操作。
- 脚本要求你手动输入 `YES` 二次确认。

## 测试与安全规范

### 默认安全测试（不触库）

```bash
cd backend
go test ./...
```

当前仓库内默认测试为安全测试，不会做整库清理。

### 集成测试（必须显式开启）

数据库集成测试必须满足以下条件才允许执行：
- 显式开启：`INTEGRATION_TEST=1`
- `MYSQL_DSN` 必须指向测试库，且库名包含 `_test`

示例（仅示例，按后续具体测试文件调整）：

```bash
cd backend
INTEGRATION_TEST=1 MYSQL_DSN='novel:novel@tcp(127.0.0.1:3306)/novel_agent_test?parseTime=true&charset=utf8mb4,utf8' go test ./internal/repository -run Integration -v
```

不要在开发主库或生产库上运行集成测试。

## 核心接口（摘要）

- Auth:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Novels:
  - `GET/POST /novels`
  - `GET/PUT/DELETE /novels/:id`
- Characters:
  - `GET/POST /novels/:novelId/characters`
  - `GET/PUT/DELETE /novels/:novelId/characters/:id`
- Volumes:
  - `GET/POST /novels/:novelId/volumes`
  - `PUT /novels/:novelId/volumes/:id`
- Chapters:
  - `GET/POST /novels/:novelId/chapters`
  - `GET/PUT/DELETE /novels/:novelId/chapters/:id`
  - `POST /novels/:novelId/chapters/generate`
- Lore Entries:
  - `GET/POST /novels/:novelId/lore-entries`
  - `GET/PUT/DELETE /novels/:novelId/lore-entries/:id`
- Export:
  - `POST /novels/:novelId/export`
  - `GET /novels/:novelId/export/markdown`（兼容）
- User AI Settings:
  - `GET /users/me/ai-settings`
  - `PUT /users/me/ai-settings`

## 文档

- MVP 设计书（现状一致版）：[docs/design.md](docs/design.md)
- V1 设计书：[docs/design-v1.md](docs/design-v1.md)
- V1 Roadmap：[docs/roadmap-v1.md](docs/roadmap-v1.md)
- AI 章节生成调参指南：[docs/ai-generation-guide.md](docs/ai-generation-guide.md)
