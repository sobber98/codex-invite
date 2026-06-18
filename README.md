<div align="center">

# Codex Inviter

### 一键发送 Codex 邀请 / One-Click Codex Invites

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F1837620622%2Fcodex-inviter)
[![GitHub stars](https://img.shields.io/github/stars/1837620622/codex-inviter?style=social)](https://github.com/1837620622/codex-inviter)
[![License](https://img.shields.io/github/license/1837620622/codex-inviter)](LICENSE)

[Live Demo](https://codex-inviter.vercel.app)

</div>

---

## 简介

Codex Inviter 是一个轻量级的独立网页工具，帮助您快速批量发送 ChatGPT Codex 邀请。无需运行额外服务，无需搭建复杂环境——上传认证文件或直接粘贴 JSON，自动检测账号状态，验证通过后一键发送邀请。

> 本工具逆向自 [cpa-plugin-codex-invite](https://github.com/LTbinglingfeng/cpa-plugin-codex-invite)，感谢原作者的工作。

## 功能

| 功能 | 说明 |
|------|------|
| 文件上传 / 粘贴 | 支持拖拽上传 auth.json，也支持从剪贴板直接粘贴 JSON |
| 自动健康检测 | 上传后自动验证 access_token 有效性，实时反馈账号状态 |
| 计划类型识别 | 自动解析 Plus、Team、Pro、Free 等计划类型 |
| 批量邀请 | 最多 50 个邮箱，支持逗号/空格/换行分隔，自动去重 |
| 邀请链接返回 | 发送成功后返回 invite_url，可直接转发给被邀请人 |
| 导入导出 | 支持导入 TXT/CSV 邮箱，导出邀请结果 JSON |
| 高级设置 | 自定义 Referral Key、语言、Originator、User-Agent、Cookie |
| 暗色主题 | 支持亮色/暗色切换，自动跟随系统偏好 |
| 发送记录 | 本地保存发送历史，方便追溯 |
| 兼容多种格式 | 支持 CPA 格式、Codex 官方 auth.json、Session JSON 等多种格式 |
| 一键部署 | 点击上方 Deploy with Vercel 按钮即可部署到自有域名 |

## 快速开始

### 1. 创建 Upstash Redis

访问 [Upstash Console](https://console.upstash.com/) 创建一个 Redis 数据库，复制 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`。

### 2. Vercel 一键部署

点击上方 **Deploy with Vercel** 按钮，在环境变量页面填入以下变量：

| 变量名 | 说明 |
|--------|------|
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST Token |

### 本地开发

```bash
git clone https://github.com/1837620622/codex-inviter.git
cd codex-inviter
cp .env.example .env
# 编辑 .env 填入 KV_REST_API_URL 和 KV_REST_API_TOKEN
vercel dev
```

打开 http://localhost:3000

## 使用说明

1. **准备认证文件**：从本地 Codex CLI 目录 `~/.codex/auth.json` 或 CLIProxyAPI 目录获取认证 JSON
2. **上传或粘贴**：拖拽 JSON 文件到上传区域，或点击「从剪贴板粘贴 JSON」
3. **等待健康检测**：系统自动验证账号有效性，检测通过后显示计划类型
4. **填写被邀请邮箱**：每行一个邮箱，或用逗号/空格/分号分隔，最多 50 个
5. **发送邀请**：点击发送，OpenAI 自动向被邀请人发送邮件

## API 说明

### POST /api/check — 健康检测

```bash
curl -X POST https://your-domain.vercel.app/api/check \
  -H "Content-Type: application/json" \
  -d '{"auth_file":{"access_token":"eyJ...","email":"user@example.com","account_id":"uuid"}}'
```

支持数组 `[{...}]` 和单对象 `{...}` 格式。返回 `status_code`、`plan_type`、`alive/dead` 状态。

### POST /api/invite — 发送邀请

```bash
curl -X POST https://your-domain.vercel.app/api/invite \
  -H "Content-Type: application/json" \
  -d '{
    "auth_file": {"access_token":"eyJ...","account_id":"...","email":"sender@example.com"},
    "emails": "friend1@example.com, friend2@example.com"
  }'
```

#### 参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `auth_file` | object | * | Codex 认证 JSON，需包含 `access_token` |
| `emails` | string/array | * | 被邀请邮箱列表，支持逗号/空格/换行分隔 |
| `referral_key` | string | | 默认 `codex_referral_persistent_invite` |
| `base_url` | string | | 默认 `https://chatgpt.com`，仅允许 OpenAI 官方域名 |
| `language` | string | | 默认 `zh-CN` |
| `originator` | string | | 默认 `Codex Desktop` |
| `user_agent` | string | | 默认 Chrome 149 UA |
| `cookie` | string | | 可选 Cookie，仅允许白名单中的 Cookie 名 |

#### 响应示例

```json
{
  "ok": true,
  "status_code": 200,
  "request_id": "...",
  "account": {
    "email": "sender@example.com",
    "account_id": "...",
    "plan_type": "plus"
  },
  "emails": ["friend@example.com"],
  "referral_key": "codex_referral_persistent_invite",
  "invites": [
    { "email": "friend@example.com", "invite_url": "https://chatgpt.com/invite/..." }
  ]
}
```

## 认证文件格式

支持以下 JSON 格式，上传后自动识别：

```json
// 格式 1：根层字段（最常见）
{ "access_token": "eyJ...", "email": "...", "account_id": "..." }

// 格式 2：嵌套 token_data（CPA 格式）
{ "token_data": { "access_token": "eyJ...", "email": "..." } }

// 格式 3：Codex 官方格式
{ "auth_mode": "chatgpt", "tokens": { "access_token": "eyJ...", "account_id": "..." }, "last_refresh": "..." }

// 格式 4：Session API 格式
{ "user": { "email": "..." }, "accessToken": "eyJ..." }

// 格式 5：OPENAI_API_KEY 格式
{ "OPENAI_API_KEY": "eyJ...", "auth_mode": "chatgpt" }

// 格式 6：数组格式（自动取第一个元素）
[{ "access_token": "eyJ...", "email": "..." }]
```

计划类型从 JWT 令牌的 `chatgpt_plan_type` 字段自动解析（Plus/Team/Pro/Free/Enterprise）。

## 常见问题

**邀请成功后还需要手动操作吗？**  
不需要。调用 invite API 后，OpenAI 后端会自动向被邀请邮箱发送邀请邮件。返回的 `invite_url` 只是备用链接，可直接转发。

**认证文件从哪里获取？**  
从本地 Codex CLI 配置文件目录获取：
- macOS/Linux：`~/.codex/auth.json`
- Windows：`%USERPROFILE%\.codex\auth.json`

也可以从 CLIProxyAPI 的 `~/.cli-proxy-api/` 目录获取对应文件。

**认证文件会被保存吗？**  
不会。认证文件仅用于单次 API 请求，服务端不持久化存储。

**为什么需要服务端代理？**  
chatgpt.com 不允许浏览器直接跨域调用其内部 API，需通过 Vercel Function 转发。

**最多可以同时邀请多少人？**  
单次最多 50 个邮箱，支持重复发送。

## 安全提示

- `access_token` 是 OpenAI 账号凭证，等同于密码，请妥善保管
- 认证文件仅在当前浏览器会话中使用，不会被持久化存储
- 邀请接口已严格限制 `base_url` 为 OpenAI 官方域名，防止 SSRF
- 本工具仅供学习和个人使用，请遵守 OpenAI 服务条款

## Get Help

- **问题反馈**：在 GitHub 提交 [Issue](https://github.com/1837620622/codex-inviter/issues)
- **功能建议**：欢迎提交 Pull Request 或通过 Issue 讨论
- **交流联系**：
  - Telegram：[@CK_AINB6](https://t.me/CK_AINB6)
  - 邮箱：2040168455@qq.com
  - 咸鱼/B站：万能程序员

## License

[MIT](LICENSE)

---

<div align="center">

By [1837620622](https://github.com/1837620622) &middot; [Live Demo](https://codex-inviter.vercel.app)

</div>
