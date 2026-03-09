const { getCounterCollection } = require('../lib/mongodb');
const { generateCountSVG } = require('../lib/svg');
const { sanitizeUsername } = require('../lib/validator');
const { getClientIP, checkIPAccess, recordIPAccess } = require('../lib/ipTracker');
const { verifyGitHubUser } = require('../lib/github');

/**
 * IP 访问时间窗口（小时）
 * 同一 IP 在此时间内访问同一用户不重复计数
 */
const IP_ACCESS_WINDOW_HOURS = parseInt(process.env.IP_ACCESS_WINDOW_HOURS || '0', 10);

/**
 * 获取当前计数（不增加）
 * @param {Collection} collection - MongoDB 集合
 * @param {string} username - GitHub 用户名
 * @returns {Promise<number>} 当前计数
 */
async function getCurrentCount(collection, username) {
  const doc = await collection.findOne({ username });
  return doc ? doc.count : 0;
}

/**
 * 增加计数并返回新值
 * @param {Collection} collection - MongoDB 集合
 * @param {string} username - GitHub 用户名
 * @returns {Promise<number>} 增加后的计数
 */
async function incrementCount(collection, username) {
  const result = await collection.findOneAndUpdate(
    { username },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        username,
        createdAt: new Date(),
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  if (result) {
    return result.count;
  }

  const doc = await collection.findOne({ username });
  return doc ? doc.count : 1;
}

/**
 * Vercel Serverless Function 处理访客计数
 */
module.exports = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: '缺少 username 参数',
        usage: '访问 /api/count?username=github_username 来获取访客统计',
      });
    }

    const sanitizedUsername = sanitizeUsername(username);

    if (!sanitizedUsername) {
      return res.status(400).json({
        error: '无效的用户名格式',
      });
    }

    const verifyResult = await verifyGitHubUser(sanitizedUsername);
    
    if (!verifyResult.exists) {
      return res.status(404).json({
        error: 'GitHub 用户不存在',
        username: sanitizedUsername,
        details: verifyResult.error || '该用户名在 GitHub 上未找到',
      });
    }

    const clientIP = getClientIP(req);
    const collection = await getCounterCollection();
    
    let count;
    let isFirstVisit = true;
    
    // 当 IP_ACCESS_WINDOW_HOURS 为 0 时，跳过 IP 判断，直接增加计数
    if (IP_ACCESS_WINDOW_HOURS === 0) {
      count = await incrementCount(collection, sanitizedUsername);
    } else {
      const { isFirstVisit: ipCheckResult } = await checkIPAccess(
        clientIP, 
        sanitizedUsername, 
        IP_ACCESS_WINDOW_HOURS
      );
      
      isFirstVisit = ipCheckResult;
      
      if (isFirstVisit) {
        count = await incrementCount(collection, sanitizedUsername);
        await recordIPAccess(clientIP, sanitizedUsername);
      } else {
        count = await getCurrentCount(collection, sanitizedUsername);
      }
    }

    const svg = generateCountSVG(count, {
      bgColor: '#0e1117',
      textColor: '#58a6ff',
      borderColor: '#30363d',
      labelColor: '#8b949e',
      label: 'profile views',
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Profile-Views-Count', count.toString());
    res.setHeader('X-Profile-Views-Is-New', isFirstVisit ? 'true' : 'false');
    res.setHeader('X-Profile-Views-IP', clientIP === 'unknown' ? 'hidden' : 'tracked');
    
    return res.status(200).send(svg);
  } catch (error) {
    console.error('访客计数错误:', error);
    
    const errorSvg = generateCountSVG(0, {
      bgColor: '#0e1117',
      textColor: '#f85149',
      borderColor: '#30363d',
      labelColor: '#8b949e',
      label: 'error',
    });
    
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(500).send(errorSvg);
  }
};
