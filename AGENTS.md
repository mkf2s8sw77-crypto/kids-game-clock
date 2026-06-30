# 游戏计时 / kids-game-clock

家庭场景的小孩游戏时长记录工具，按周限额、共享池、口令管理后台。

## 1. 项目位置

- 项目目录：`kids-game-clock/`
- 数据：`kids-game-clock/data/app.db`（SQLite，gitignore）
- 验收截图：`kids-game-clock/.verify/*.png`（gitignore）

## 2. 业务规则

- **周限额**：每周一 00:00（Asia/Shanghai）重置
- **基础配额**：每周 3.5 小时（210 分钟）
- **共享池**：所有孩子共用一个 3.5h 池，不按孩子拆分
- **奖励**：管理端可手动加分（正数），当周有效
- **活动会话唯一**：全应用任何时刻最多 1 个 active session
- **截断保护**：本周累计超过配额时，新 session 自动截断到 0（不"欠"时间），并标记 `auto-truncated`
- **跨周禁止**：手动补录不允许 start/end 跨周

## 3. 技术栈

- Next.js 15（App Router，TypeScript）
- Drizzle ORM + better-sqlite3（本地 SQLite，WAL 模式）
- Tailwind CSS
- lucide-react（图标，已随构建打入本地）
- 镜像源：pnpm `registry.npmmirror.com`

## 4. 部署形态

- **basePath**：`/kids-game-clock`（在 `next.config.ts`）
- **公网入口**：`https://sys.huli.sh.cn/kids-game-clock/`
- **本地端口**：`14711`（10000–20000 之间，固定）
- **Logo**：`https://media.huli.sh.cn/huli-tech-logo.png`（远程 URL，不下载）
- **图标**：lucide-react 全部本地，无 CDN
- **不接任何外部系统**，完全自包含

## 5. 启动 / 重置 / 部署命令

```bash
cd kids-game-clock

# 安装依赖
pnpm install

# 初始化/重置 schema（清空后建表）
pnpm reset          # 删 data/app.db
pnpm db:push        # 用 drizzle-kit push schema 到 db

# 写入演示数据
pnpm seed

# 开发模式
pnpm dev            # 启动 next dev，端口 14711

# 生产模式
pnpm build          # 构建
pnpm start          # next start，端口 14711
```

## 6. 目录结构

```
kids-game-clock/
├── app/
│   ├── layout.tsx              # 根 layout
│   ├── page.tsx                # 用户端首页（移动优先）
│   ├── globals.css
│   ├── admin/
│   │   ├── layout.tsx          # 管理端 shell（含登录态判断）
│   │   ├── page.tsx            # 概览
│   │   ├── login/page.tsx      # 口令登录
│   │   ├── records/page.tsx    # 记录管理（增/改/删/补录）
│   │   ├── children/page.tsx   # 孩子管理
│   │   └── bonus/page.tsx      # 奖励管理
│   └── api/
│       ├── auth/route.ts               # 登录/登出/状态
│       ├── stats/route.ts              # 本周统计
│       ├── sessions/route.ts           # 列表/补录
│       ├── sessions/start/route.ts
│       ├── sessions/end/route.ts
│       ├── sessions/[id]/route.ts      # PATCH/DELETE
│       ├── bonuses/route.ts
│       └── children/route.ts
├── components/
│   ├── ui/                     # 公共：Button/Card/Input
│   ├── user/                   # 移动端组件
│   └── admin/                  # PC 端组件
├── lib/
│   ├── config.ts               # BASE_PATH、QUOTA、LOGO_URL
│   ├── auth.ts                 # HMAC 签名 cookie
│   ├── admin-guard.ts          # 服务端 cookie 校验
│   ├── time.ts                 # Asia/Shanghai 周聚合
│   ├── icons.ts                # icon 名 → lucide 组件
│   ├── types.ts                # 共享 TS 类型
│   ├── client.ts               # 浏览器 fetch 包装
│   ├── useNow.ts               # 1s tick hook
│   ├── cn.ts                   # className 工具
│   └── db/
│       ├── index.ts            # drizzle client
│       ├── schema.ts           # 4 张表
│       └── queries.ts          # 聚合查询
├── scripts/
│   ├── seed.ts                 # 演示数据
│   └── reset.ts                # 清空 DB
├── public/                     # 空（图标都来自 lucide-react）
├── .bin/kgc-bin                # next 启动器副本（不含 "next" 字样，避开 pkill）
├── data/app.db                 # SQLite（gitignore）
├── drizzle/                    # 迁移（暂未生成，使用 db:push）
├── .verify/                    # 验收脚本 + 截图（gitignore）
│   └── verify.py               # Playwright 自验收
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── package.json
├── .env.example                # ADMIN_PASSWORD、SESSION_SECRET 模板
├── .env.local                  # 本地默认口令：kids-admin
└── .gitignore
```

## 7. 关键 API

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/stats?week=current\|<YYYY-MM-DD>` | GET | 本周统计 + 活动 session |
| `/api/sessions/start` | POST `{childId}` | 开始（自动校验无 active） |
| `/api/sessions/end` | POST | 结束 active（自动截断） |
| `/api/sessions` | GET 列表 / POST 补录 `{childId,startedAt,endedAt,note}` | 列表可按 child/week/source 过滤 |
| `/api/sessions/:id` | PATCH / DELETE | 改/删 |
| `/api/bonuses` | GET / POST / DELETE | 周奖励 |
| `/api/children` | GET / POST / PATCH / DELETE | 孩子 |
| `/api/auth` | POST `{password}` / POST `{action:"logout"}` / GET | 鉴权 |

## 8. 演示数据

3 个孩子：小明（蓝/cat）、小红（粉/heart）、小亮（橙/star）
- 上上周 3 条 + 上周 5 条 + 本周 3 条（90 分钟）
- 上周奖励 +30min（考试进步）
- 默认状态：空闲、无活动 session、剩余 120 分钟

## 9. 自验收

```bash
# 启动 + 验证
cd kids-game-clock
pnpm reset && pnpm seed
.bin/kgc-bin start -p 14711 &     # 启动（用副本避开 pkill）
python3 .verify/verify.py         # Playwright 跑 9 张截图
```

`.verify/verify.py` 覆盖：移动端首页/计时中/计时后、PC 端登录错/概览/记录/孩子新增/奖励新增/概览刷新/退出登录。

## 10. 部署 / 反向代理

`https://sys.huli.sh.cn/kids-game-clock/` → 端口 14711，next start 已在 `package.json` 写死。

## 11. 重要约定 / 不要改的事

- **basePath 必须保留 `/kids-game-clock`**：所有内/外链靠它工作。Link 不要手工加 BASE_PATH 前缀（Next.js 会自动加），但 `apiPost` 等 fetch 路径必须用 `BASE_PATH` 前缀。
- **Next 启动器用 `.bin/kgc-bin`**：本机多个 next 项目并发，`pkill -f next` 会误伤；`.bin/kgc-bin` 是 `next/dist/bin/next` 的副本，cmdline 不含 "next" 字样。
- **演示数据覆盖式 seed**：`pnpm seed` 会先清空再写入，跑前会自动删 `data/app.db` 的外键关联。
- **admin 鉴权**：口令在 `.env.local` 的 `ADMIN_PASSWORD`，默认 `kids-admin`；session cookie 用 HMAC-`SESSION_SECRET` 签名，7 天有效。
- **时间口径**：DB 存 UTC ISO 字符串；展示/聚合按 `Asia/Shanghai`；周一开始。
- **active session 唯一性**：跨孩子也唯一，避免双重计时。
- **跨周手动补录会被拒**：必须 start/end 都在同一周。
- **TypeScript 类型**：Drizzle 0.36 的 `select()` 返回的 `source` 字段是 `string` 而非字面量；用 `lib/types.ts` 中的 `string` 兼容，生产代码都按这个。

## 12. 依赖小贴士

- next 15.0.3 有安全公告（CVE-2025-66478），生产前应升级到 15.x 补丁版
- 锁定 `registry.npmmirror.com`：`pnpm config set registry https://registry.npmmirror.com`
- 不需要任何 CDN 资源；Tailwind 通过 PostCSS 在 build 时生成
