const { getDatabase } = require('./mongodb');

/**
 * 获取客户端真实 IP 地址
 * 支持 Vercel、Cloudflare 等代理环境
 * @param {IncomingMessage} req - HTTP 请求对象
 * @returns {string} 客户端 IP 地址
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) {
    return cfIP;
  }

  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         'unknown';
}

/**
 * 检查 IP 是否在指定时间窗口内已访问过该用户
 * @param {string} ip - 访问者 IP 地址
 * @param {string} username - GitHub 用户名
 * @param {number} windowHours - 时间窗口（小时），默认 24 小时
 * @returns {Promise<{isFirstVisit: boolean, lastVisit: Date|null}>}
 */
async function checkIPAccess(ip, username, windowHours = 24) {
  const db = await getDatabase();
  const collection = db.collection('ip_access');

  const windowMs = windowHours * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - windowMs);

  const existingRecord = await collection.findOne({
    ip,
    username,
    lastAccess: { $gt: cutoffTime }
  });

  return {
    isFirstVisit: !existingRecord,
    lastVisit: existingRecord ? existingRecord.lastAccess : null
  };
}

/**
 * 记录 IP 访问
 * @param {string} ip - 访问者 IP 地址
 * @param {string} username - GitHub 用户名
 * @returns {Promise<void>}
 */
async function recordIPAccess(ip, username) {
  const db = await getDatabase();
  const collection = db.collection('ip_access');

  await collection.updateOne(
    { ip, username },
    {
      $set: { lastAccess: new Date() },
      $setOnInsert: { 
        ip, 
        username, 
        firstAccess: new Date() 
      }
    },
    { upsert: true }
  );
}

/**
 * 清理过期的 IP 访问记录
 * @param {number} windowHours - 时间窗口（小时）
 * @returns {Promise<number>} 删除的记录数
 */
async function cleanupOldIPRecords(windowHours = 24) {
  const db = await getDatabase();
  const collection = db.collection('ip_access');

  const windowMs = windowHours * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - windowMs);

  const result = await collection.deleteMany({
    lastAccess: { $lt: cutoffTime }
  });

  return result.deletedCount;
}

/**
 * 为 IP 访问集合创建索引
 * @returns {Promise<void>}
 */
async function ensureIPAccessIndexes() {
  const db = await getDatabase();
  const collection = db.collection('ip_access');

  await collection.createIndex(
    { ip: 1, username: 1 }, 
    { unique: true }
  );
  await collection.createIndex({ lastAccess: 1 });
}

module.exports = {
  getClientIP,
  checkIPAccess,
  recordIPAccess,
  cleanupOldIPRecords,
  ensureIPAccessIndexes
};
