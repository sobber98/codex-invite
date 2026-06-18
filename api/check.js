// Codex Inviter - 账号健康检测 API
// 验证 Codex 认证文件是否有效

import {
  extractAccessToken,
  extractAccountId,
  extractEmail,
  extractPlanType,
} from './lib/auth-parser.js';
import {
  setSecurityHeaders,
  setCorsHeaders,
  handleOptions,
  errorRes,
  checkBodySize,
} from './lib/utils.js';

const MAX_BODY = 200 * 1024; // 200KB

export default async function handler(req, res) {
  setSecurityHeaders(res);
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res, 'POST, OPTIONS', 'Content-Type');
  }

  if (req.method !== 'POST') {
    return errorRes(res, 405, '仅支持 POST 请求');
  }

  if (!checkBodySize(req, MAX_BODY)) {
    return errorRes(res, 413, '请求体过大');
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return errorRes(res, 400, '请求体必须是 JSON 对象');
  }

  let authFile = body.auth_file;
  if (Array.isArray(authFile)) {
    authFile = authFile[0];
    if (!authFile || typeof authFile !== 'object') {
      return errorRes(res, 400, 'auth_file 数组格式无效');
    }
  }
  if (!authFile || typeof authFile !== 'object') {
    return errorRes(res, 400, 'auth_file 是必填项');
  }

  const accessToken = extractAccessToken(authFile);
  if (!accessToken) {
    return errorRes(res, 400, '无法从 auth 文件中提取 access_token');
  }

  const email = extractEmail(authFile);
  const accountId = extractAccountId(authFile);
  const planType = extractPlanType(authFile);

  try {
    const sessionResp = await fetch('https://chatgpt.com/api/auth/session', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      },
    });

    const sessionStatus = sessionResp.status;
    const isAlive = sessionStatus >= 200 && sessionStatus < 300;

    return res.status(200).json({
      ok: isAlive,
      status: isAlive ? 'alive' : 'dead',
      status_code: sessionStatus,
      email: email || '',
      account_id: accountId || '',
      plan_type: planType || '',
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('账号检测失败:', err.message);
    return errorRes(res, 502, '检测失败');
  }
}
