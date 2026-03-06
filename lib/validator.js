/**
 * 验证 GitHub 用户名是否有效
 * GitHub 用户名规则：
 * - 1-39 个字符
 * - 只能包含字母数字和连字符
 * - 不能以连字符开头或结尾
 * - 不能包含连续的连字符
 * @param {string} username - GitHub 用户名
 * @returns {boolean} 是否有效
 */
function isValidGitHubUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }

  if (username.length < 1 || username.length > 39) {
    return false;
  }

  const validPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  
  if (!validPattern.test(username)) {
    return false;
  }

  if (username.includes('--')) {
    return false;
  }

  return true;
}

/**
 * 清理和规范化用户名
 * @param {string} username - 原始用户名
 * @returns {string} 规范化后的用户名
 */
function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') {
    return '';
  }
  
  return username.trim().toLowerCase();
}

module.exports = {
  isValidGitHubUsername,
  sanitizeUsername,
};
