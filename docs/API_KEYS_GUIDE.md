# Launchly — External Services & API Keys Configuration Guide

This guide details all third-party integrations, credentials, and environment variables required to run Launchly in development and production environments.

---

## 1. Telegram Bot Platform

Launchly interfaces directly with the Telegram Bot API for bot runtime management, Webhook/Polling event loops, and OAuth login.

| Variable | Description | Where to Obtain |
| :--- | :--- | :--- |
| `TELEGRAM_SYSTEM_BOT_TOKEN` | System bot token used for platform notifications and user auth | [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_SYSTEM_BOT_USERNAME` | Username of the system notification bot (e.g., `@launchly_bot`) | [@BotFather](https://t.me/BotFather) |
| `telegram.mode` | Runtime mode: `polling` (local development) or `webhook` (production) | Local config / Docker |
| `telegram.webhook-url` | Public HTTPS endpoint for Telegram webhooks (production only) | Domain / Reverse Proxy |

---

## 2. Artificial Intelligence Providers

Launchly utilizes a resilient **Multi-Provider AI Router** with automatic failover, latency budgeting, and schema validation. At least one API key is recommended for AI bot construction and smart CRM suggestions.

### Supported AI Providers:
- **Groq**: Ultra-low-latency Llama 3.3 70B inference.
- **Google Gemini**: Gemini 2.5 Flash for complex JSON schema generation.
- **OpenRouter**: Unified API routing across open-source models (Qwen 3 32B, Mistral, DeepSeek).
- **Cerebras**: High-throughput wafer-scale inference for instant chat responses.

| Variable | Description | Portal / Signup |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Groq Cloud API Key | [console.groq.com](https://console.groq.com/) |
| `GEMINI_API_KEY` | Google AI Studio API Key | [aistudio.google.com](https://aistudio.google.com/) |
| `OPENROUTER_API_KEY` | OpenRouter API Key | [openrouter.ai](https://openrouter.ai/) |
| `CEREBRAS_API_KEY` | Cerebras Inference API Key | [cloud.cerebras.ai](https://cloud.cerebras.ai/) |
| `AI_PROVIDERS` | Active provider priority list (default: `groq,gemini,openrouter,cerebras`) | Config |

---

## 3. Stripe Subscription & Billing

Launchly uses Stripe for subscription tiers (Starter, Pro, Unlimited) and webhook fulfillment.

| Variable | Description | Portal |
| :--- | :--- | :--- |
| `STRIPE_API_KEY` | Stripe Secret Key (`sk_test_...` or `sk_live_...`) | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) | [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) |

---

## 4. Cloudinary Media Storage

Used for storing and optimizing user avatars, bot media, broadcast banners, and chat attachments.

| Variable | Description | Portal |
| :--- | :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | [cloudinary.com/console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | [cloudinary.com/console](https://cloudinary.com/console) |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | [cloudinary.com/console](https://cloudinary.com/console) |

---

## 5. Google OAuth 2.0 (Single Sign-On)

Enables one-click Google login on frontend and backend integration with Google Sheets.

| Variable | Description | Portal |
| :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth 2.0 Client ID | [console.cloud.google.com](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth 2.0 Client Secret | [console.cloud.google.com](https://console.cloud.google.com/) |

### Redirect URIs:
- **Local Development**: `http://localhost:8080/login/oauth2/code/google`
- **Frontend Callback**: `http://localhost:5173/oauth2/callback`

---

## 6. Email (SMTP / Mailpit)

| Variable | Description | Notes |
| :--- | :--- | :--- |
| `SPRING_MAIL_HOST` | SMTP server host | `localhost` for Mailpit / `smtp.gmail.com` |
| `SPRING_MAIL_PORT` | SMTP port | `1025` for Mailpit / `587` for TLS |
| `SPRING_MAIL_USERNAME` | SMTP account username | Optional in local dev |
| `SPRING_MAIL_PASSWORD` | SMTP account password / App Password | Optional in local dev |

---

## 7. Security & Encryption Keys

| Variable | Description | Requirements |
| :--- | :--- | :--- |
| `JWT_SECRET` | 256-bit Base64-encoded secret key for signing HMAC-SHA256 tokens | Minimum 32 characters |
| `APP_ENCRYPTION_KEY` | AES-256 encryption key for sensitive user bot tokens stored in database | Minimum 32 characters |
| `SUPER_ADMIN_EMAIL` | Email automatically assigned `ROLE_SUPER_ADMIN` on startup | Valid email format |
