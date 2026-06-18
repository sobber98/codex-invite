import {
  extractAccessToken,
  extractAccountId,
  extractEmail,
  extractPlanType,
} from '../../api/lib/auth-parser.js';
import { securityHeaders, corsHeaders, json, error } from './_utils.js';

export async function onRequest(context) {
  const { request, env } = context;
  const extraHeaders = { ...securityHeaders(), ...corsHeaders(request, env) };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...extraHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return error(405, '仅支持 POST 请求', extraHeaders);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return error(400, '请求体必须是 JSON 对象', extraHeaders);
  }

  let authFile = body.auth_file;
  if (Array.isArray(authFile)) {
    authFile = authFile[0];
    if (!authFile || typeof authFile !== 'object') {
      return error(400, 'auth_file 数组格式无效', extraHeaders);
    }
  }
  if (!authFile || typeof authFile !== 'object') {
    return error(400, 'auth_file 是必填项', extraHeaders);
  }

  const accessToken = extractAccessToken(authFile);
  if (!accessToken) {
    return error(400, '无法从 auth 文件中提取 access_token', extraHeaders);
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
    const isAlive = sessionResp.ok;

    return json({
      ok: isAlive,
      status: isAlive ? 'alive' : 'dead',
      status_code: sessionStatus,
      email: email || '',
      account_id: accountId || '',
      plan_type: planType || '',
      checked_at: new Date().toISOString(),
    }, 200, extraHeaders);
  } catch (err) {
    console.error('账号检测失败:', err.message);
    return error(502, '检测失败', extraHeaders);
  }
}
