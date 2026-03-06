const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * 加载 .env 文件中的环境变量
 */
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('✅ 已加载 .env 文件');
  }
}

loadEnvFile();

const handler = require('./api/count');

const PORT = process.env.PORT || 3000;

/**
 * 解析 URL 查询参数
 * @param {string} search - URL 查询字符串
 * @returns {Object} 查询参数对象
 */
function parseQuery(search) {
  const params = {};
  if (!search) return params;
  
  const searchParams = new URLSearchParams(search);
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

/**
 * 本地开发服务器
 */
const server = http.createServer(async (req, res) => {
  const baseUrl = `http://localhost:${PORT}`;
  const parsedUrl = new URL(req.url, baseUrl);
  const pathname = parsedUrl.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  if (pathname === '/') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  const countMatch = pathname.match(/^\/([^/]+)\/count\.svg$/);
  if (countMatch) {
    req.query = parseQuery(parsedUrl.search);
    req.query.username = countMatch[1];
    
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    req.body = Buffer.concat(chunks).toString();
    
    await handler(req, res);
    return;
  }

  if (pathname.startsWith('/api/')) {
    req.query = parseQuery(parsedUrl.search);
    
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    req.body = Buffer.concat(chunks).toString();
    
    await handler(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`\n🚀 本地开发服务器已启动！`);
  console.log(`📍 访问地址: http://localhost:${PORT}`);
  console.log(`📊 测试地址: http://localhost:${PORT}/testuser/count.svg\n`);
  console.log(`💡 提示: 请确保已设置 MONGODB_URI 环境变量\n`);
});
