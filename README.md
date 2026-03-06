# GitHub 个人主页访问量统计

一个可以部署在 Vercel 上的 GitHub 个人主页访问量统计服务，使用 MongoDB 存储数据。

## 功能特性

- 基于 IP 的访问量统计（同一 IP 24 小时内不重复计数）
- 真实 GitHub 用户验证（调用 GitHub API）
- 美观的 SVG 徽章样式
- Vercel Serverless 部署
- MongoDB 数据持久化
- 7 天缓存机制减少 API 调用

## 使用方法

在你的 GitHub 个人主页 README 中添加：

```markdown
![访问量统计](https://your-domain.vercel.app/{your-github-username}/count.svg)
```

例如：

```markdown
![访问量统计](https://github-profile-views-counter.vercel.app/luoy-oss/count.svg)
```

## 部署步骤

### 1. 准备 MongoDB 数据库

1. 创建 [MongoDB Atlas](https://www.mongodb.com/atlas) 免费账户
2. 创建一个新的集群
3. 创建数据库用户
4. 获取连接字符串

### 2. 部署到 Vercel

1. Fork 本项目到你的 GitHub
2. 访问 [Vercel](https://vercel.com)
3. 导入你的 GitHub 仓库
4. 配置环境变量：
   - `MONGODB_URI`: MongoDB 连接字符串
   - `MONGODB_DB_NAME`: 数据库名称（可选，默认为 profile_views_counter）
   - `IP_ACCESS_WINDOW_HOURS`: IP 访问时间窗口（可选，默认 24 小时）
5. 点击部署

### 3. 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，填入你的 MongoDB 连接信息

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000/{username}/count.svg` 测试

## API 说明

### GET /{username}/count.svg

返回访问量统计 SVG 图片

**参数：**
- `username`: GitHub 用户名（路径参数）

**响应：**
- Content-Type: `image/svg+xml`
- 返回 SVG 格式的访问量统计徽章
- 响应头包含：
  - `X-Profile-Views-Count`: 当前访问量
  - `X-Profile-Views-Is-New`: 本次访问是否为新访问
  - `X-Profile-Views-IP`: IP 追踪状态

### GET /api/count?username={username}

API 接口版本

**参数：**
- `username`: GitHub 用户名（查询参数）

## 访问量统计逻辑

### IP 检测机制
- 同一 IP 地址在 24 小时内访问同一用户只计数一次
- 支持 Vercel、Cloudflare 等代理环境获取真实 IP
- IP 访问记录自动清理

### GitHub 用户验证
- 调用 GitHub API 验证用户名是否存在
- 7 天缓存机制减少 API 调用频率
- 避免无效用户名的访问量统计

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Vercel Serverless Functions
- **数据库**: MongoDB
- **样式**: SVG
- **API**: GitHub REST API

## 许可证

MIT
