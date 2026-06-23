# 星梦笔记

ACGN 内容博客 MVP，包含 Vue 3 前端、Express API、Prisma ORM 和线上 MySQL 数据库。当前重点功能包括番剧板块、COS 图廊、游戏资料、番剧时间表、版权来源标注、Live2D 小人、用户空间、后台管理、首页轮播和富文本编辑。

## 本地运行

```bash
npm install
npm run db:setup
npm run dev:full
```

前端地址：

```text
http://127.0.0.1:5174
```

后端健康检查：

```text
http://127.0.0.1:3001/api/health
```

默认管理员账号：

```text
账号：admin@stardream.local
密码：admin123
```

## 常用命令

```bash
npm run dev          # 只启动前端
npm run dev:server   # 只启动后端
npm run dev:full     # 同时启动前端和后端
npm run start:api    # 生产模式启动后端 API
npm run build        # 前端生产构建和类型检查
npm run db:setup     # 执行 Prisma 生成、迁移、种子数据和健康检查
npm run content:timeline # 导出 GitHub Pages 静态番剧时间表 JSON
npm run smoke:api    # 检查已部署 API 的健康状态和核心公开接口
npm run db:reset:dev # 开发环境强制重置当前数据库，请勿用于线上库
```

## GitHub Pages 部署

项目已内置 GitHub Actions 工作流：`.github/workflows/deploy-pages.yml`。

推送到 GitHub 的 `main` 分支后，工作流会自动：

1. 安装依赖。
2. 构建期导出 `public/data/anime-timeline.json`，让静态 Pages 也能展示最近番剧时间表。
3. 使用 `BASE_PATH=/<仓库名>/` 构建 Vite 静态站点。
4. 使用 hash 路由发布，并生成 `dist/404.html` 将旧 history 路由跳转到 hash 路由。
5. 发布到 GitHub Pages。

如果仓库是用户站点仓库，例如 `<username>.github.io`，可以把工作流里的 `BASE_PATH` 改成 `/`。

## 线上数据库

生产数据库已切换为 MySQL，Prisma 主 schema 位于 `prisma/schema.prisma`。GitHub Pages 只负责托管前端静态文件；真实线上数据需要部署 Express API，并连接托管 MySQL。

详细步骤见 [Database Deployment](docs/database.md)。项目已提供后端 Dockerfile，可部署到支持 Node.js 或容器的云平台。

## 技术栈

- Frontend: Vue 3, TypeScript, Vite, Pinia, Vue Router
- UI: 自定义后台界面、lucide-vue-next、md-editor-v3
- Backend: Node.js, Express
- Database: MySQL 8.x for production, SQLite fallback schema, Prisma ORM

线上版本请使用托管 MySQL，并通过 `VITE_API_BASE_URL` 让 GitHub Pages 前端连接已部署的 Express API。

## 已实现功能

- 登录 / 注册 / 当前用户会话
- 文章发布、编辑、删除、标签、图文预览和富文本编辑
- 发现页、ACGN 图廊、番剧 / COS / 游戏资料馆和 Live2D 小人
- 番剧时间表：聚合 MyAnimeList、Bangumi、Bilibili 排期，并把 Anikore 作为日本口碑站参考入口；GitHub Pages 构建期会导出静态 JSON 供线上展示
- 个人工作台：草稿箱、我的文章、快速编辑和删除
- 文章详情：点赞、收藏、评论、回复、举报
- 个人主页：资料编辑、空间主题、ACGN 记录
- 管理后台：统计、用户封禁和角色、文章置顶/隐藏/删除、评论审核、举报处理
