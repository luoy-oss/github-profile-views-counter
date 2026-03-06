/**
 * 生成访客计数 SVG 图片
 * @param {number} count - 访客数量
 * @param {object} options - 配置选项
 * @returns {string} SVG 字符串
 */
function generateCountSVG(count, options = {}) {
  const {
    bgColor = '#0e1117',
    textColor = '#58a6ff',
    borderColor = '#30363d',
    labelColor = '#8b949e',
    label = 'profile views',
    width = 120,
    height = 30,
  } = options;

  const countStr = count.toLocaleString();
  const labelWidth = getTextWidth(label, 12) + 20;
  const countWidth = getTextWidth(countStr, 14) + 20;
  const totalWidth = Math.max(width, labelWidth + countWidth);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <rect width="${totalWidth}" height="${height}" fill="${bgColor}" rx="4" ry="4"/>
  <rect width="${totalWidth}" height="${height}" fill="none" stroke="${borderColor}" stroke-width="1" rx="4" ry="4"/>
  
  <g>
    <rect x="0.5" y="0.5" width="${labelWidth - 0.5}" height="${height - 1}" fill="${borderColor}" rx="3.5" ry="3.5"/>
    <text x="${labelWidth / 2}" y="${height / 2}" fill="${labelColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" dominant-baseline="central">
      ${escapeXml(label)}
    </text>
  </g>
  
  <g>
    <text x="${labelWidth + countWidth / 2}" y="${height / 2}" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" dominant-baseline="central">
      ${escapeXml(countStr)}
    </text>
  </g>
</svg>`;
}

/**
 * 估算文本宽度
 * @param {string} text - 文本内容
 * @param {number} fontSize - 字体大小
 * @returns {number} 估算的文本宽度
 */
function getTextWidth(text, fontSize) {
  let width = 0;
  for (const char of text) {
    if (char.charCodeAt(0) > 127) {
      width += fontSize * 1.0;
    } else {
      width += fontSize * 0.6;
    }
  }
  return Math.ceil(width);
}

/**
 * 转义 XML 特殊字符
 * @param {string} str - 原始字符串
 * @returns {string} 转义后的字符串
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  generateCountSVG,
};
