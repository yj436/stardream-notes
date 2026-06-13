# 星梦笔记

二次元轻博客社区 MVP，包含 Vue 3 前端、Express API、Prisma ORM 和本地 SQLite 数据库。当前重点功能包括文章发布、画廊、Live2D 小人、用户空间、后台管理和富文本编辑。

## 本地运行

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
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
npm run build        # 前端生产构建和类型检查
npm run db:reset     # 重置 SQLite 数据库并重新写入种子数据
```

## GitHub Pages 部署

项目已内置 GitHub Actions 工作流：`.github/workflows/deploy-pages.yml`。

推送到 GitHub 的 `main` 分支后，工作流会自动：

1. 安装依赖。
2. 使用 `BASE_PATH=/<仓库名>/` 构建 Vite 静态站点。
3. 生成 `dist/404.html` 作为 SPA 刷新兜底。
4. 发布到 GitHub Pages。

如果仓库是用户站点仓库，例如 `<username>.github.io`，可以把工作流里的 `BASE_PATH` 改成 `/`。

## 技术栈

- Frontend: Vue 3, TypeScript, Vite, Pinia, Vue Router
- UI: 自定义后台界面、lucide-vue-next、md-editor-v3
- Backend: Node.js, Express
- Database: SQLite for local MVP, Prisma ORM

后续切换 PostgreSQL 时，保留 Prisma model，调整 datasource provider 和连接串即可。

## 已实现功能

- 登录 / 注册 / 当前用户会话
- 文章发布、编辑、删除、标签、图文预览和富文本编辑
- 发现页、画廊页、动漫浏览和 Live2D 小人
- 个人工作台：草稿箱、我的文章、快速编辑和删除
- 文章详情：点赞、收藏、评论、回复、举报
- 个人主页：资料编辑、空间主题、追番记录
- 管理后台：统计、用户封禁和角色、文章置顶/隐藏/删除、评论审核、举报处理
