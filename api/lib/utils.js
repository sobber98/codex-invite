// Codex Inviter - 共享工具函数（与管理员凭据无关，可公开提交）

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// 统一错误响应
export function errorRes(res, status, message) {
  return res.status(status).json({ ok: false, error: message });
}

// 设置安全响应头
export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self'; " +
    "img-src 'self' data:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self';"
  );
}

// CORS：默认只允许同域；可通过 ALLOWED_ORIGINS 配置白名单
export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;

  let allowed = false;
  if (ALLOWED_ORIGINS.length === 0) {
    const host = req.headers.host || '';
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const sameOrigin = `${protocol}://${host}`;
    allowed = origin === sameOrigin;
  } else {
    allowed = ALLOWED_ORIGINS.includes(origin);
  }

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export function handleOptions(req, res, allowedMethods = 'POST, OPTIONS', allowedHeaders = 'Content-Type, X-Auth-Token') {
  setCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
  return res.status(204).end();
}

// 请求体大小校验
export function checkBodySize(req, maxBytes) {
  const cl = parseInt(req.headers['content-length'] || '0', 10);
  return cl <= maxBytes;
}
