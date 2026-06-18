export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy':
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self'; " +
      "img-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self';",
  };
}

export function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return {};

  const allowedOrigins = (env?.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  let allowed = false;
  if (allowedOrigins.length === 0) {
    allowed = origin === new URL(request.url).origin;
  } else {
    allowed = allowedOrigins.includes(origin);
  }

  if (allowed) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  return {};
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function error(status, message, headers = {}) {
  return json({ ok: false, error: message }, status, headers);
}
