const { getDatabase } = require('./mongodb');

/**
 * GitHub 用户缓存过期时间（毫秒）
 * 默认 7 天，因为用户名变更很少发生
 */
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * 通过 GitHub API 验证用户是否存在
 * @param {string} username - GitHub 用户名
 * @returns {Promise<{exists: boolean, avatarUrl?: string, error?: string}>}
 */
async function verifyGitHubUserFromAPI(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Profile-Views-Counter'
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      return {
        exists: true,
        avatarUrl: data.avatar_url,
        bio: data.bio
      };
    }

    if (response.status === 404) {
      return { exists: false, error: '用户不存在' };
    }

    if (response.status === 403) {
      return { exists: false, error: 'API 请求限制，请稍后重试' };
    }

    return { 
      exists: false, 
      error: `GitHub API 错误: ${response.status}` 
    };
  } catch (error) {
    console.error('GitHub API 请求失败:', error);
    return { 
      exists: false, 
      error: '网络请求失败' 
    };
  }
}

/**
 * 从缓存获取用户验证结果
 * @param {string} username - GitHub 用户名
 * @returns {Promise<{exists: boolean, avatarUrl?: string}|null>}
 */
async function getCachedUserVerification(username) {
  const db = await getDatabase();
  const collection = db.collection('github_users_cache');

  const cached = await collection.findOne({ 
    username,
    verifiedAt: { $gt: new Date(Date.now() - CACHE_TTL) }
  });

  if (cached) {
    return {
      exists: cached.exists,
      avatarUrl: cached.avatarUrl
    };
  }

  return null;
}

/**
 * 缓存用户验证结果
 * @param {string} username - GitHub 用户名
 * @param {Object} data - 验证结果
 * @returns {Promise<void>}
 */
async function cacheUserVerification(username, data) {
  const db = await getDatabase();
  const collection = db.collection('github_users_cache');

  await collection.updateOne(
    { username },
    {
      $set: {
        exists: data.exists,
        avatarUrl: data.avatarUrl,
        verifiedAt: new Date()
      },
      $setOnInsert: {
        username,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

/**
 * 验证 GitHub 用户是否存在（带缓存）
 * @param {string} username - GitHub 用户名
 * @returns {Promise<{exists: boolean, avatarUrl?: string, error?: string, fromCache: boolean}>}
 */
async function verifyGitHubUser(username) {
  const cached = await getCachedUserVerification(username);
  
  if (cached !== null) {
    return { ...cached, fromCache: true };
  }

  const result = await verifyGitHubUserFromAPI(username);
  
  if (result.exists) {
    await cacheUserVerification(username, result);
  }

  return { ...result, fromCache: false };
}

/**
 * 清理过期的缓存记录
 * @returns {Promise<number>} 删除的记录数
 */
async function cleanupExpiredCache() {
  const db = await getDatabase();
  const collection = db.collection('github_users_cache');

  const result = await collection.deleteMany({
    verifiedAt: { $lt: new Date(Date.now() - CACHE_TTL) }
  });

  return result.deletedCount;
}

/**
 * 为缓存集合创建索引
 * @returns {Promise<void>}
 */
async function ensureGitHubCacheIndexes() {
  const db = await getDatabase();
  const collection = db.collection('github_users_cache');

  await collection.createIndex(
    { username: 1 }, 
    { unique: true }
  );
  await collection.createIndex({ verifiedAt: 1 });
}

module.exports = {
  verifyGitHubUser,
  verifyGitHubUserFromAPI,
  cleanupExpiredCache,
  ensureGitHubCacheIndexes
};
