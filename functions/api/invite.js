import {
  extractAccessToken,
  extractAccountId,
  extractEmail,
  extractPlanType,
} from '../../api/lib/auth-parser.js';
import { securityHeaders, corsHeaders, json, error } from './_utils.js';

const DEFAULT_REFERRAL_KEY = 'codex_referral_persistent_invite';
const DEFAULT_BASE_URL = 'https://chatgpt.com';
const DEFAULT_LANGUAGE = 'zh-CN';
const DEFAULT_ORIGINATOR = 'Codex Desktop';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
const UPPER_MAX_EMAILS = 50;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_HOSTS = new Set(['chatgpt.com', 'chat.openai.com', 'openai.com']);
const HEADER_MAX_LEN = 512;
const HEADER_VALUE_REGEX = /^[\x20-\x7e]*$/;

function parseEmails(raw) {
  const text = typeof raw === 'string' ? raw : '';
  const list = text.split(/[,;\n\r\t ]+/).map(s => s.trim()).filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const email of list) {
    const key = email.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(email);
    }
  }
  return unique;
}

function validateEmails(emails, maxEmails = UPPER_MAX_EMAILS) {
  if (emails.length === 0) throw new Error('至少需要提供一个有效的邮箱地址');
  if (emails.length > maxEmails) throw new Error(`最多允许 ${maxEmails} 个邮箱，当前 ${emails.length} 个`);
  for (const email of emails) {
    if (!EMAIL_REGEX.test(email)) throw new Error(`无效的邮箱格式: ${email}`);
  }
}

function normalizeBaseUrl(url) {
  const input = (url || DEFAULT_BASE_URL).trim();
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error('无效的 Base URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('仅支持 HTTPS 协议');
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error('不允许的 base_url，仅支持 OpenAI 官方域名');
  }
  return `${parsed.protocol}//${parsed.hostname}`;
}

const ALLOWED_COOKIE_NAMES = new Set(['__cf_bm', '__cflb', 'cf_clearance', '_cfuvid']);
function sanitizeCookie(cookieStr) {
  const parts = String(cookieStr).split(';').map(s => s.trim()).filter(Boolean);
  const result = [];
  for (const part of parts) {
    const eq = part.indexOf('=');
    const name = (eq >= 0 ? part.slice(0, eq) : part).trim();
    if (ALLOWED_COOKIE_NAMES.has(name)) {
      result.push(part);
    }
  }
  return result.join('; ');
}

function sanitizeHeaderValue(value, defaultValue, maxLen = HEADER_MAX_LEN) {
  const s = String(value || '').trim();
  if (!s) return defaultValue;
  if (s.length > maxLen) throw new Error('请求头值过长');
  if (!HEADER_VALUE_REGEX.test(s)) throw new Error('请求头包含非法字符');
  return s;
}

function sanitizeReferralKey(value) {
  const s = String(value || '').trim();
  if (!s) return DEFAULT_REFERRAL_KEY;
  if (s.length > 128) throw new Error('referral_key 过长');
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) throw new Error('referral_key 格式无效');
  return s;
}

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

  const {
    auth_file,
    emails: emailsRaw,
    referral_key = DEFAULT_REFERRAL_KEY,
    base_url,
    language = DEFAULT_LANGUAGE,
    originator = DEFAULT_ORIGINATOR,
    user_agent = DEFAULT_USER_AGENT,
    cookie = '',
  } = body;

  let auth = auth_file;
  if (Array.isArray(auth)) {
    auth = auth[0];
    if (!auth || typeof auth !== 'object') {
      return error(400, 'auth_file 数组格式无效', extraHeaders);
    }
  }
  if (!auth || typeof auth !== 'object') {
    return error(400, 'auth_file 是必填项，请上传 Codex 认证 JSON 文件内容', extraHeaders);
  }

  const accessToken = extractAccessToken(auth);
  if (!accessToken) {
    return error(400, '无法从 auth 文件中提取 access_token，请确认文件格式是否正确', extraHeaders);
  }

  const accountId = extractAccountId(auth);
  const accountEmail = extractEmail(auth);
  const planType = extractPlanType(auth);

  let emails;
  try {
    emails = parseEmails(Array.isArray(emailsRaw) ? emailsRaw.join('\n') : String(emailsRaw || ''));
    validateEmails(emails);
  } catch (err) {
    return error(400, err.message, extraHeaders);
  }

  let baseUrl;
  let safeLanguage, safeOriginator, safeUserAgent, safeReferralKey;
  try {
    baseUrl = normalizeBaseUrl(base_url);
    safeLanguage = sanitizeHeaderValue(language, DEFAULT_LANGUAGE);
    safeOriginator = sanitizeHeaderValue(originator, DEFAULT_ORIGINATOR);
    safeUserAgent = sanitizeHeaderValue(user_agent, DEFAULT_USER_AGENT);
    safeReferralKey = sanitizeReferralKey(referral_key);
  } catch (err) {
    return error(400, err.message, extraHeaders);
  }

  const endpoint = `${baseUrl}/backend-api/wham/referrals/invite`;
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Oai-Language': safeLanguage,
    'Originator': safeOriginator,
    'User-Agent': safeUserAgent,
  };

  if (accountId) headers['Chatgpt-Account-Id'] = accountId;
  const sanitizedCookie = sanitizeCookie(cookie);
  if (sanitizedCookie) headers['Cookie'] = sanitizedCookie;

  const upstreamBody = {
    referral_key: safeReferralKey,
    emails,
  };

  try {
    const upstreamResp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(upstreamBody),
    });

    const upstreamText = await upstreamResp.text();
    let upstreamJson = null;
    if (upstreamText) {
      try { upstreamJson = JSON.parse(upstreamText); } catch {}
    }

    const success = upstreamResp.ok;

    const safeInvites = [];
    if (upstreamJson && Array.isArray(upstreamJson.invites)) {
      for (const inv of upstreamJson.invites) {
        if (inv && typeof inv === 'object') {
          safeInvites.push({
            email: inv.email || '',
            invite_url: inv.invite_url || inv.url || '',
            status: inv.status || '',
          });
        }
      }
    }

    return json({
      ok: success,
      status_code: upstreamResp.status,
      request_id: upstreamResp.headers.get('x-oai-request-id') || '',
      account: {
        email: accountEmail,
        account_id: accountId,
        plan_type: planType || '',
      },
      emails,
      referral_key: safeReferralKey,
      invites: safeInvites,
    }, 200, extraHeaders);
  } catch (err) {
    console.error('请求 ChatGPT API 失败:', err.message);
    return error(502, '请求 ChatGPT API 失败', extraHeaders);
  }
}
