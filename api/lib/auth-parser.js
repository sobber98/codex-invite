// Codex Inviter - 认证对象解析工具
// 从 auth JSON 中提取 access_token、account_id、email、plan_type 等字段

export function nestedString(data, path) {
  let current = data;
  for (const key of path) {
    if (!current || typeof current !== 'object') return '';
    current = current[key];
  }
  if (typeof current === 'string') return current.trim();
  return '';
}

export function extractAccessToken(auth) {
  const paths = [
    ['access_token'], ['token_data', 'access_token'],
    ['tokens', 'access_token'],
    ['OPENAI_API_KEY'],
    ['accessToken'],
  ];
  for (const path of paths) {
    const value = nestedString(auth, path);
    if (value) return value;
  }
  return '';
}

export function extractAccountId(auth) {
  const paths = [
    ['account_id'], ['chatgpt_account_id'],
    ['token_data', 'account_id'], ['token_data', 'chatgpt_account_id'],
    ['tokens', 'account_id'],
    ['user', 'id'],
  ];
  for (const path of paths) {
    const value = nestedString(auth, path);
    if (value) return value;
  }
  return '';
}

export function extractEmail(auth) {
  const paths = [
    ['email'], ['token_data', 'email'],
    ['user', 'email'],
  ];
  for (const path of paths) {
    const value = nestedString(auth, path);
    if (value) return value;
  }
  return '';
}

export function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function extractPlanType(auth) {
  const idToken = nestedString(auth, ['id_token']);
  if (idToken) {
    const payload = decodeJwtPayload(idToken);
    if (payload) {
      const plan = nestedString(payload, ['https://api.openai.com/auth', 'chatgpt_plan_type']);
      if (plan) return plan;
    }
  }
  const accessToken = nestedString(auth, ['access_token']);
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      const plan = nestedString(payload, ['https://api.openai.com/auth', 'chatgpt_plan_type']);
      if (plan) return plan;
    }
  }
  const direct = nestedString(auth, ['plan_type']) || nestedString(auth, ['chatgpt_plan_type']);
  if (direct) return direct;
  return '';
}
