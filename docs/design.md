# Novel Agent MVP 设计书（现状一致版）

更新时间：2026-05-19

## 1. 文档目的
本设计书用于同步 `Novel Agent` 当前 MVP 的**实际实现状态**，既作为后续开发依据，也作为阶段总结。

本版本基于：
- 现有代码实现（backend/frontend）
- `docs/.local-progress.md` 各阶段记录
- 原始 `docs/design.md` MVP 目标

---

## 2. MVP 定位与边界

### 2.1 MVP 目标
验证长篇中文小说创作的核心闭环：
1. 作者维护小说长期设定与人物卡
2. 输入章节生成指令
3. AI 生成 `outline/body/summary`
4. 作者编辑并保存章节
5. 支持可配置 Markdown 导出

### 2.2 MVP 已实现能力
- 用户认证：注册、登录、获取当前用户
- 小说管理：CRUD
- 人物管理：CRUD（含重要度与删除保护）
- 分卷管理：创建、改名、章节归卷
- 章节管理：CRUD、独立写作页、字数自动计算
- 导出：Markdown 导出（格式/范围/内容可选）
- AI 生成：章节生成（结构化 JSON 输出）

### 2.3 MVP 不包含
- RAG / 向量数据库
- MCP / 多 Agent 编排
- Google Drive 集成
- 自动投稿
- 商业化复杂 UI

---

## 3. 技术栈

- Backend: Go + Echo
- Frontend: React + TypeScript + Vite + MUI
- Database: MySQL
- Auth: JWT
- AI: OpenAI Chat Completions API
- Export: Markdown

---

## 4. 当前架构与目录

```
novel-agent/
- backend/
  - cmd/api/main.go
  - internal/
    - config/
    - domain/
    - handler/
    - middleware/
    - repository/
    - service/
    - usecase/
  - migrations/
- frontend/
  - src/
    - api/
    - components/
    - pages/
- docs/
  - design.md
  - .local-progress.md (本地阶段复盘)
- docker-compose.yml
- README.md
```

后端采用轻量 Clean Architecture 分层：
- `handler`：HTTP 入口与状态码
- `usecase`：业务规则
- `repository`：数据库访问
- `service`：外部服务（OpenAI、Markdown exporter）

---

## 5. 数据模型（当前实现）

### 5.1 users
- id
- name
- email (unique)
- password_hash
- created_at
- updated_at

### 5.2 novels
- id
- user_id
- title
- genre
- language
- style_profile
- worldview
- power_system
- main_plot
- writing_rules
- forbidden_rules
- recent_chapter_count (default 3)
- created_at
- updated_at

### 5.3 characters
- id
- novel_id
- name
- aliases
- role
- personality
- realm_or_ability
- goal
- relationships
- speech_style
- first_appearance_chapter
- last_appearance_chapter
- memo
- importance_level (0-9)
- created_at
- updated_at

说明：
- `importance_level >= 7` 禁止删除（防误删保护）

### 5.4 volumes
- id
- novel_id
- volume_number
- title（必填）
- created_at
- updated_at

说明：
- 章节创建前必须有分卷
- 前端支持分卷改名，不提供分卷删除入口

### 5.5 chapters
- id
- novel_id
- volume_id
- chapter_number
- title
- body
- word_count（按正文自动计算，空白不计）
- generation_instruction
- outline
- summary
- created_at
- updated_at

说明：
- 同一小说内 `chapter_number` 唯一
- 章节支持在列表中直接切换分卷

### 5.6 lore_entries（V1 增量）
- id
- novel_id
- category（artifact/elixir/formation/technique/location/organization/other）
- name
- description
- rules_or_limits
- tags
- created_at
- updated_at

### 5.7 lore_entry_characters（V1 增量）
- lore_entry_id
- character_id
- created_at

说明：
- 设定卡与人物为多对多关系。
- 允许不绑定人物（空），也允许绑定单人或多人。

---

## 6. 认证与权限

- 使用 JWT 认证
- 所有业务数据按 `user_id` 权限隔离
- 用户不能访问他人的小说/人物/章节/分卷

---

## 7. API（当前实现）

### 7.1 Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### 7.2 Novels
- `POST /novels`
- `GET /novels`
- `GET /novels/:id`
- `PUT /novels/:id`
- `DELETE /novels/:id`

### 7.3 Characters
- `POST /novels/:novelId/characters`
- `GET /novels/:novelId/characters`
- `GET /novels/:novelId/characters/:id`
- `PUT /novels/:novelId/characters/:id`
- `DELETE /novels/:novelId/characters/:id`

### 7.4 Volumes
- `POST /novels/:novelId/volumes`
- `GET /novels/:novelId/volumes`
- `PUT /novels/:novelId/volumes/:id`
- `DELETE /novels/:novelId/volumes/:id`（后端有，前端不提供入口）

### 7.5 Chapters
- `POST /novels/:novelId/chapters`
- `GET /novels/:novelId/chapters`
- `GET /novels/:novelId/chapters/:id`
- `PUT /novels/:novelId/chapters/:id`
- `DELETE /novels/:novelId/chapters/:id`

### 7.6 AI 章节生成
- `POST /novels/:novelId/chapters/generate`

请求字段：
- `volume_id`
- `chapter_number`
- `title`
- `generation_instruction`
- `character_ids`（可选）

响应字段：
- `outline`
- `body`
- `summary`

规则：
- OpenAI 必须返回可解析 JSON
- JSON 至少包含 `outline/body/summary`
- 解析失败时返回错误，不保存章节
- 未选择 `character_ids` 时回退到主要人物（importance >= 5）

### 7.7 导出
- 兼容接口：`GET /novels/:novelId/export/markdown`
- 主接口：`POST /novels/:novelId/export`

请求字段：
- `format`：当前 `markdown`
- `scope`：`all` | `volume` | `chapter_range`
- `volume_id`（scope=volume 时）
- `from_chapter` / `to_chapter`（scope=chapter_range 时）
- `include_body` / `include_summary` / `include_outline`

导出文件名：
- `小说名-YYYYMMDD.md`
- 响应头使用 `filename*` UTF-8 以避免中文乱码

### 7.8 Lore Entries（V1 增量）
- `POST /novels/:novelId/lore-entries`
- `GET /novels/:novelId/lore-entries`
- `GET /novels/:novelId/lore-entries/:id`
- `PUT /novels/:novelId/lore-entries/:id`
- `DELETE /novels/:novelId/lore-entries/:id`

请求字段：
- `category`
- `name`
- `description`
- `rules_or_limits`
- `tags`
- `character_ids`（可选，支持 0..n）

规则：
- `category/name/description` 必填
- `character_ids` 若提供，必须全部属于当前用户的当前小说人物

---

## 8. 前端页面与交互（当前）

### 8.1 Auth 页面
- 登录/注册分离切换
- 登录后展示当前用户卡片

### 8.2 Novels 页面（导航化）
左侧导航：
- 我的小说
  - 小说详情
  - 小说角色
  - 小说章节
- 新建小说

### 8.3 小说详情
- 小说列表 + 详情编辑
- 列表显示总字数（默认中文不显示 `zh-CN`）

### 8.4 小说角色
- 角色列表 + 创建/编辑
- 删除含保护策略提示

### 8.5 小说章节
- 分卷管理（新建、改名）
- 章节列表按分卷展示
- 每卷显示章节数与总字数
- 章节可快速转卷
- 导出弹窗（格式/范围/内容）

### 8.6 小说设定（V1 增量）
- 设定卡列表 + 创建/编辑/删除
- 支持分类：法器/丹药/阵法/功法/地点/势力/其他
- 支持绑定人物（可不绑定，或绑定多人）

### 8.7 章节写作页
- 独立编辑页（正文主编辑区 + 右侧功能面板）
- 正文首行/换行自动缩进
- 字数自动统计
- AI 生成按钮：回填大纲/正文/总结
- 登场人物支持搜索、多选、分组（最近使用/主要人物/全部人物）

---

## 9. 生成与保存工作流

1. 在章节写作页填写：分卷、章节号、标题（可选）、生成指令
2. （可选）选择本章登场人物
3. 点击 AI 生成，返回 `outline/body/summary`
4. 作者手动编辑
5. 点击保存/创建章节入库

关键原则：
- **生成与保存分离**（先生成草稿，再人工确认保存）

---

## 10. 错误处理与提示约定

- 前端统一采用 toast/snackbar 反馈
- 不直接暴露底层 SQL 错误给最终用户
- 典型错误映射：
  - 重复章节号 -> 业务可读提示
  - AI 解析失败 -> 提示重试

---

## 11. 环境变量

后端：
- `PORT`
- `MYSQL_DSN`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`（默认 `https://api.openai.com/v1`）
- `OPENAI_MODEL`（默认 `gpt-4o-mini`）

---

## 12. MVP 完成结论

截至 2026-05-18，`Novel Agent` MVP 目标已完成：
- 认证
- 小说/人物/分卷/章节管理
- 可配置 Markdown 导出
- OpenAI 章节生成闭环

后续建议进入 v1 阶段：
- 稳定性与自动化测试补强
- 生成质量与 Prompt 管理优化
- 更细颗粒的写作辅助能力（推荐人物、生成策略模板等）
