# AI小说Agent MVP设计书

1\. 项目概要

1.1 项目目的  
做一个用于长篇中文小说创作的 AI Agent Web App。MVP 阶段目标不是自动完成百万字小说，而是验证“结构化设定 \+ 章节指令 \+ AI 生成 \+ 章节总结 \+ 基础记忆读取”的核心流程是否可行。

1.2 核心价值  
\- 辅助作者生成章节正文  
\- 维护世界观、人物设定、章节总结等长期信息  
\- 降低长篇小说续写时的上下文断裂问题  
\- 作为个人 AI Agent 项目，展示 LLM API、工作流、状态管理、后端与前端开发能力

2\. MVP 方针

2.1 技术选择  
\- Backend：Go \+ Echo  
\- Frontend：React \+ TypeScript \+ MUI  
\- Database：MySQL  
\- AI API：OpenAI API  
\- Auth：JWT 认证  
\- Export：Markdown 导出

2.2 选择理由  
MVP 阶段使用 MySQL。开发者日常使用 MySQL，学习成本低，能更快进入实现阶段。RAG / 向量检索暂不纳入 MVP，因此第一版不为了 pgvector 切换到 PostgreSQL。后续如需要向量检索，再评估 PostgreSQL \+ pgvector 或独立向量数据库。

第一版使用 OpenAI API。OpenAI API 文档成熟，结构化输出和工具调用相关资料较多，适合快速实现 MVP。后续可通过抽象 LLM Client 支持 Claude / Gemini。

MVP 阶段只支持中文小说。先集中优化简体中文输出、中文标点、中文称呼、玄幻 / 修仙类表达和章节节奏。多语言支持放到后续版本。

MVP 阶段需要登录功能。系统需要区分不同作者及其小说项目，所有小说、人物卡、章节等数据均需要绑定 user\_id。

章节正文允许用户编辑后再保存。AI 生成内容不一定能直接使用，用户需要在保存前进行修改。同时允许用户后续编辑。

MVP 阶段支持 Markdown 导出。Markdown 实现成本低，便于备份、复制、投稿前整理，也适合作为后续 Google Drive 保存功能的基础。

人物卡字段暂不继续细分。先使用当前字段完成基本人物记忆能力，后续根据实际问题再扩展人物状态、秘密、阵营、关系变化记录等字段。

最近章节读取数量 MVP 阶段默认读取最近 3 章总结。后续可在小说设定中增加“读取最近章节数量”配置。

2.3 MVP 不做的内容  
\- 不做 Google Drive 自动保存  
\- 不做 RAG / 向量数据库  
\- 不做 MCP  
\- 不做多 Agent  
\- 不做自动投稿  
\- 不做完整商业化 UI  
\- 不追求完全自动规划百万字长篇剧情  
\- 不做独立伏笔管理页面和伏笔表

3\. MVP 功能范围

3.1 用户认证  
\- 用户注册  
\- 用户登录  
\- 获取当前登录用户信息  
\- 退出登录

3.2 小说项目管理  
\- 创建小说项目  
\- 编辑小说名称、类型、语言、整体风格  
\- 保存主线简介、世界观、修炼体系、写作规则  
\- 小说项目归属于当前登录用户

3.3 人物管理  
\- 创建人物卡  
\- 编辑人物姓名、身份、性格、境界、目标、关系、说话风格  
\- 章节生成时读取相关人物设定

3.4 章节管理  
\- 创建章节  
\- 查看章节列表  
\- 查看章节正文  
\- 保存章节标题、章节编号、正文、章节总结  
\- 章节正文允许用户编辑后再保存  
\- 保存后允许用户再次编辑章节正文  
\- 章节字数由系统根据正文自动计算（空白字符不计入），不手工录入  
\- 支持 Markdown 导出

3.5 章节生成  
用户输入结构化章节指令，系统读取小说设定、人物卡、最近章节总结，然后调用 AI 生成：  
\- 本章大纲  
\- 本章正文  
\- 本章总结

3.6 基础记忆读取  
MVP 阶段不做向量检索，只读取固定范围的信息：  
\- 小说核心设定  
\- 主要人物卡  
\- 最近 3 章总结  
\- 用户本次输入的章节指令

4\. 页面设计

4.1 登录 / 注册页  
用途：用户登录或注册账号。  
主要元素：  
\- 邮箱输入框  
\- 密码输入框  
\- 用户名输入框（注册时）  
\- 登录按钮  
\- 注册按钮

4.2 小说项目列表页  
用途：管理当前用户的小说项目。  
主要元素：  
\- 小说项目列表  
\- 新建小说按钮  
\- 编辑 / 删除按钮

4.3 小说设定页  
用途：编辑长期固定设定。  
主要字段：  
\- 小说标题  
\- 类型，例如玄幻、修仙、都市、轻小说  
\- 输出语言，MVP 阶段固定为简体中文  
\- 整体风格  
\- 世界观  
\- 修炼体系  
\- 主线目标  
\- 写作规则  
\- 禁止事项  
\- 最近章节读取数量，MVP 默认 3

4.4 人物管理页  
用途：维护人物卡。  
主要字段：  
\- 姓名  
\- 别名 / 称呼  
\- 身份  
\- 性格  
\- 境界 / 能力  
\- 当前目标  
\- 与其他角色关系  
\- 说话风格  
\- 首次登场章节  
\- 最近登场章节  
\- 人物状态（如：存活，死亡，未知）

4.5 章节列表页  
用途：查看和管理已生成章节。  
主要元素：  
\- 章节编号  
\- 章节标题  
\- 字数  
\- 创建时间  
\- 是否已有总结  
\- Markdown 导出按钮

4.6 章节生成页  
用途：输入章节指令并生成新章节。  
主要输入项：  
\- 章节编号  
\- 章节标题，可选  
\- 本章目标  
\- 本章必须出现的人物  
\- 本章必须发生的事件  
\- 本章禁止事项  
\- 情绪基调  
\- 节奏要求  
\- 本章伏笔 / 未解决问题，可选文本  
\- 结尾钩子  
\- 目标字数

主要输出：  
\- AI 生成的大纲  
\- AI 生成的正文  
\- AI 生成的章节总结  
\- 正文编辑区域  
\- 保存按钮

5\. 数据结构草案

5.1 users  
\- id  
\- name  
\- email  
\- password\_hash  
\- created\_at  
\- updated\_at

说明：  
\- 用户表用于区分不同作者  
\- email 需要唯一约束

\- deleted\_at，可选，MVP 阶段可不做软删除- 密码不保存明文，只保存 hash

5.2 novels  
\- id  
\- user\_id  
\- title  
\- genre  
\- language  
\- style\_profile  
\- worldview  
\- power\_system  
\- main\_plot  
\- writing\_rules  
\- forbidden\_rules  
\-  
\- deleted\_at，可选，MVP 阶段可不做软删除 recent\_chapter\_count  
\- created\_at  
\- updated\_at

说明：  
\- user\_id 关联 users.id  
\- 小说项目必须归属于某个用户  
\- 查询、更新、删除小说时，需要校验当前登录用户是否拥有该小说  
\- recent\_chapter\_count 用于后续支持用户自定义读取最近章节数量；MVP 阶段默认值为 3

5.3 characters  
\- id  
\- novel\_id  
\- name  
\- aliases  
\- role  
\- personality  
\- realm\_or\_ability  
\- goal  
\- relationships  
\- speech\_style  
\- first\_appearance\_chapter

\- deleted\_at，可选，MVP 阶段可不做软删除- last\_appearance\_chapter  
\- memo  
\- created\_at  
\- updated\_at

说明：  
\- characters 通过 novel\_id 关联 novels.id  
\- 访问人物数据时，需要通过 novel\_id 间接校验 user\_id，避免用户访问其他作者的小说数据

5.4 chapters  
\- id  
\- novel\_id  
\- chapter\_number  
\- title  
\- b  
\- deleted\_at，可选，MVP 阶段可不做软删除ody  
\- word\_count  
\- generation\_instruction  
\- outline  
\- summary  
\- created\_at  
\- updated\_at

说明：  
\- chapters 通过 novel\_id 关联 novels.id  
\- 同一小说内 chapter\_number 应保持唯一  
\- body 保存用户编辑确认后的最终正文  
\- 保存后的章节正文允许用户再次编辑，更新时覆盖当前 body，并更新 updated\_  
说明：  
\- MVP 阶段不单独创建该表也可以，优先使用 chapters.summary  
\- 如果需要结构化保存总结字段，再拆分为独立表  
at  
\- generation\_instruction 保存本次生成时的章节指令，便于后续复盘

5.5 chapter\_summaries  
MVP 阶段可以直接放在 chapters.summary 中。若后续需要扩展，可以拆表。  
\- id  
\- novel\_id  
\- chapter\_id  
\- summary  
\- important\_events  
\- \- updated\_at  
appeared\_characters  
\- unresolved\_hooks  
\- character\_state\_updates  
\- created\_at

6\. Workflow

6.1 用户注册 / 登录  
1\. 用户注册账号或登录  
2\. 后端验证用户信息  
3\. 登录成功后返回认证信息  
4\. 前端后续请求携带认证信息

6.2 新建小说  
1\. 用户创建小说项目  
2\. 系统保存小说基础设定  
3\. 小说项目绑定当前登录用户

6.3 创建人物卡  
1\. 用户选择小说项目  
2\. 用户录入主要人物信息  
3\. 系统保存人物卡

6.4 生成章节  
1\. 用户输入章节指令  
2\. 后端校验当前

6.7 删除数据  
MVP 阶段删除小说、人物、章节时，可以先采用物理删除。若后续需要误删恢复或版本管理，再改为软删除。删除小说时，需要同时考虑其人物卡和章节数据的处理方式。  
用户是否拥有该小说  
3\. 后端读取小说设定  
4\. 后端读取主要人物卡  
5\. 后端读取最近 3 章总结  
6\. 后端组装 Prompt  
7\. 后端调用 OpenAI API  
8\. 返回章节大纲、正文、总结  
9\. 用户编辑正文  
10\. 用户确认后保存

6.5 保存章节  
保存内容：  
\- 章节标  
11\. 保存后用户可再次打开章节并编辑正文题  
\- 正文  
\- 大纲  
\- 总结  
\- 本次生成指令

6.6 Markdown 导出  
1\. 用户选择章节  
2\. 后端校验当前用户是否拥有该章节

7.3 OpenAI 输出格式  
MVP 阶段建议让 OpenAI 返回结构化 JSON，至少包含：outline、body、summary。后端负责解析结果并保存。若解析失败，应返回错误并提示用户重新生成。

7.4 生成失败处理  
调用 OpenAI API 失败、超时或返回内容格式不正确时，不保存章节。前端显示错误信息，用户可以重新生成。

3\. 后端将章节标题、正文、总结整理为 Markdown  
4\. 前端下载 Markdown 文件

7\. Prompt 设计草案

7.1 章节生成 Prompt  
输入：  
\- 小说设定  
\- 人物设定  
\- 最近 3 章总结  
\- 本章指令

输出要求：  
\- 先生成章节大纲  
\- 再生成正文  
\- 最后生成章节总结  
\- 不得违背人物性格  
\- 不得违背世界观和修炼体系  
\- 不得提前暴露禁止信息  
\- 使用简体中文网文风格

7.2 章节总结 Prompt  
总结字段：  
\- 本章发生了什么  
\- 出场人物  
\- 人物状态变化  
\- 重要事件  
\- 新增伏笔  
\- 未解决问题  
\- 下一章可衔接点

8\. API 草案

8.1 Auth  
\- POST /auth/register  
\- POST /auth/login  
\- POST /auth/logout  
\- GET /auth/me

说明：  
\- register：用户注册  
\- login：用户登录并获取认证信息  
\- logout：退出登录  
\- me：获取当前登录用户信息  
\- MVP 阶段可优先使用 JWT

8.2 Novels  
\- GET /novels  
\- POST /novels  
\- GET /novels/:id  
\- PUT /novels/:id  
\- DELETE /novels/:id

说明：  
\- 所有 novels API 都需要登录后访问  
\- 后端需要根据 JWT 中的 user\_id 限制数据访问范围  
\- 用户只能访问自己的小说项目

8.3 Characters  
\- GET /novels/:novelId/characters  
\- POST /novels/:novelId/characters  
\- PUT /characters/:id  
\- DELETE /characters/

8.5 通用错误处理  
\- 未登录：401 Unauthorized  
\- 无权访问其他用户数据：403 Forbidden  
\- 数据不存在：404 Not Found  
\- 参数错误：400 Bad Request  
\- AI 生成失败：502 Bad Gateway 或 500 Internal Server Error  
:id

前端提示规则（MVP 统一约定）：  
\- 成功提示和错误提示统一使用页面级 toast（例如左下角弹出并自动消失），不使用常驻页面提示作为主反馈方式。  
\- 不直接向用户暴露数据库或后端原始错误文本（例如 Duplicate entry、SQL 约束名），应转换为可读业务文案。  
\- 同一页面内同类型操作（create/update/delete）使用同一提示风格，避免交互不一致。  

说明：  
\- Characters 通过 novel\_id 间接关联 user\_id  
\- 后端需要校验当前用户是否拥有对应 novel\_id

8.4 Chapters  
\- GET /novels/:novelId/chapters  
\- GET /chapters/:id  
\- POST /novels/:novelId/chapters/generate  
\- POST /novels/:novelId/chapters  
\- PUT /chapters/:id  
\- DELETE /chapters/:id  
\- GET /chapters/:id/export/markdown  
\- PUT /chapters/:id 用于更新已保存章节内容，包括后续再次编辑正文

说明：  
\- generate API 用于 AI 生成章节  
\- POST /chapters 用于保存最终确认后的章节内容  
\- export/markdown 用于导出 Markdown 文件  
\- 所有章节相关 API 都需要校验 user\_id

9\. 项目命名与代码结构

9.1 项目名称  
MVP 阶段暂定项目名：Novel Agent

候选名称：  
\- Novel Agent  
\- NovelForge  
\- StoryPilot  
\- LongNovel AI  
\- StoryMemory

第一版建议使用简单直观的 Novel Agent。理由是名称含义明确，适合作为个人作品集项目。后续如果产品化或公开发布，可以再考虑更有品牌感的名称。

9.2 Repository 名称  
建议 GitHub repository 使用小写短横线命名：  
\- novel-agent

9.3 App 显示名称  
前端页面中显示名称暂定为：  
\- Novel Agent

副标题可使用：  
\- 长篇小说创作辅助 Agent

9.4 项目结构方针  
项目结构需要在开发前确定一个基础版本，但不需要一开始设计得过度复杂。MVP 阶段建议采用前后端分离的 monorepo 结构，便于统一管理。

目录结构草案：

novel-agent/  
\- backend/  
  \- cmd/  
    \- api/  
      \- main.go  
  \- internal/  
    \- domain/  
    \- usecase/  
    \- repository/  
    \- handler/  
    \- middleware/  
    \- service/  
    \- config/  
  \- migrations/  
  \- go.mod  
  \- go.sum  
\- frontend/  
  \- src/  
    \- api/  
    \- components/  
    \- pages/  
    \- routes/  
    \- hooks/  
    \- types/  
    \- utils/  
  \- package.json  
  \- vite.config.ts  
\- docs/  
  \- design.md  
  \- api.md  
\- docker-compose.yml  
\- README.md

9.5 Backend 结构说明  
backend 使用 Go \+ Echo。MVP 阶段可采用接近 Clean Architecture 的分层，但不要过度抽象。

主要目录：  
\- cmd/api：应用入口  
\- internal/domain：领域模型，例如 User、Novel、Character、Chapter  
\- internal/usecase：业务逻辑，例如注册、登录、小说管理、章节生成  
\- internal/repository：数据库访问  
\- internal/handler：HTTP handler  
\- internal/middleware：认证中间件、CORS 等  
\- internal/service：外部服务封装，例如 OpenAI Client、Markdown Exporter  
\- internal/config：环境变量和配置读取  
\- migrations：数据库迁移文件

9.6 Frontend 结构说明  
frontend 使用 React \+ TypeScript \+ MUI。MVP 阶段按页面和功能拆分即可。

主要目录：  
\- api：axios client 与 API 调用函数  
\- components：通用 UI 组件  
\- pages：页面组件，例如 LoginPage、NovelListPage、ChapterGeneratePage  
\- routes：路由定义  
\- hooks：自定义 hooks  
\- types：TypeScript 类型定义  
\- utils：工具函数
\- feedback：统一提示与错误文案映射（建议）

9.7 命名约定  
\- repository 名称：novel-agent  
\- Go package：使用小写单词，不使用下划线  
\- API path：使用复数资源名，例如 /novels、/chapters  
\- DB table：使用复数 snake\_case，例如 users、novels、chapter\_summaries  
\- Frontend component：使用 PascalCase，例如 NovelListPage  
\- TypeScript type/interface：使用 PascalCase，例如 Novel, Chapter

9.8 暂不做的结构复杂化  
MVP 阶段暂不引入以下结构：  
\- 多后端服务拆分  
\- 微服务  
\- monorepo workspace 管理工具  
\- 复杂的 plugin system  
\- 独立 agent runtime  
\- 独立 prompt 管理后台

10\. 伏笔管理（MVP 之后）

伏笔管理对于长篇小说很重要，但不纳入 MVP 的详细实现范围。MVP 阶段只在章节总结中保留“新增伏笔 / 未解决问题 / 下一章可衔接点”等文本信息，不单独设计伏笔表和伏笔管理页面。

不纳入 MVP 的原因：  
\- 会增加独立表、页面、API 和状态流转，开发范围明显扩大  
\- 伏笔是否成立、是否回收，短期内很难完全依赖 AI 自动判断  
\- MVP 当前目标是先验证“设定读取 → 章节生成 → 章节总结 → 保存”的核心流程

后续版本可以再追加独立的伏笔管理功能。届时可考虑新增 foreshadowings 表，用于记录伏笔标题、内容、埋设章节、关联人物、重要度、状态、回收章节和回收说明。

11\. Future Roadmap

11.1 V2: RAG 记忆检索  
\- 章节正文和总结向量化  
\- 根据本章指令检索相关旧章节  
\- 支持人物、事件、伏笔的相似度检索

11.2 V3: Consistency Checker  
\- 生成后检查人物性格是否崩坏  
\- 检查修炼体系是否矛盾  
\- 检查时间线是否冲突  
\- 输出修改建议

11.3 V4: 多 Agent 工作流  
\- Planner Agent  
\- Writer Agent  
\- Critic Agent  
\- Memory Updater Agent  
\- Style Editor Agent

11.4 V5: Google Drive 集成  
\- 按模板保存章节到 Google Drive  
\- 自动创建章节文档  
\- 自动更新总目录

11.5 V6: MCP / Tool Use  
\- 将保存、检索、人物更新等能力封装为工具  
\- 让 Agent 根据任务自动选择工具
