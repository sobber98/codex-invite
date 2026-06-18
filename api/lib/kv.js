// Codex Inviter - Upstash Redis KV 单例
import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error('KV_REST_API_URL 和 KV_REST_API_TOKEN 必须配置');
}

export const redis = new Redis({ url, token });
export const KV_KEY = 'codex_accounts';
