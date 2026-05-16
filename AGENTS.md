# AGENTS.md

## 必读文档

开始任何修改前，必须先阅读：

- docs/design.md

docs/design.md 是本项目 MVP 范围、数据结构、API、Workflow、Roadmap 的唯一依据。

## 开发总结
每个阶段结束后，总结该阶段做了什么，以便后续复盘。记入以下文件：

- docs/.local-progress.md

## Branch 命名规范

统一格式：

- `<type>/<short-description>`

`type` 只使用以下取值：

- `feature/`：新功能
- `fix/`：bug 修复
- `chore/`：配置、依赖、项目结构、文档等杂项
- `refactor/`：不改变功能的代码整理
- `docs/`：只改文档

命名规则：

- 全小写
- 用 `-` 连接单词
- 不要用空格
- 不要用中文
- 描述尽量短

## 开发原则

- 不要一次性实现完整项目。
- 每次只实现用户指定的一个小阶段。
- 不要擅自增加 MVP 之外的功能。
- 不要重写整个项目，除非用户明确要求。
- 修改前先查看现有目录结构和相关代码。
- 优先保证项目可以本地启动。
- main 分支应保持可运行状态。
- 如需大范围修改，先说明计划，再执行。

## MVP 范围

MVP 只包含：

- 用户注册 / 登录
- 小说项目 CRUD
- 人物卡 CRUD
- 章节 CRUD
- Markdown 导出
- OpenAI 章节生成

MVP 不包含：

- RAG / 向量数据库
- MCP
- 多 Agent 工作流
- Google Drive 集成
- 独立伏笔管理表 / 页面
- 多语言支持
- 商业级 UI

## 后端规则

- 后端使用 Go + Echo。
- 使用 docs/design.md 中定义的轻量 Clean Architecture。
- 分层包括：
  - handler
  - usecase
  - repository
  - domain
  - service
  - middleware
  - config
- 所有用户数据必须校验 user_id。
- 用户不能访问其他用户的小说、人物卡、章节。
- 密码必须 hash 保存，禁止明文保存。
- OpenAI 章节生成结果必须解析为结构化 JSON。
- JSON 至少包含：
  - outline
  - body
  - summary
- 如果 OpenAI 返回解析失败，不保存章节。

## 前端规则

- 前端使用 React + TypeScript + MUI。
- MVP UI 保持简单，不追求复杂设计。
- API 调用放在 frontend/src/api。
- 页面组件放在 frontend/src/pages。
- 通用组件放在 frontend/src/components。
- 不要擅自引入 MUI 之外的 UI 框架。

## 回复格式

每次完成任务后，请按以下格式回复：

### 完成内容
- 简要说明完成了什么。

### 修改文件
- 列出主要修改或新增的文件。

### 运行/验证
- 已运行的命令：
  - `命令`
- 未运行的命令：
  - `命令或原因`

### 注意事项
- 说明当前限制、未完成事项、后续建议。
