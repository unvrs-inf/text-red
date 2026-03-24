# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # dev server with Turbopack (http://localhost:3000)
npm run build    # production build
npm run lint     # ESLint check
```

No test framework is configured.

## Architecture

**DocChat** — Next.js 16 (App Router) web app for viewing PDF/DOCX documents and chatting with GigaChat AI about their contents.

### Data flow

1. User uploads a file → `FileUpload` → `useGigaChat.uploadFile()` → `POST /api/gigachat/upload` → GigaChat File API → returns `gigachatFileId`
2. User sends a message → `useChat.sendMessage()` → `useGigaChat.sendMessage()` → `POST /api/gigachat/chat` → GigaChat chat completions with the file attached to the first user message
3. GigaChat caches document context via `X-Session-ID` header (passed per conversation session) — subsequent requests in the same session don't re-tokenize the document

### Key architectural decisions

- **`lib/gigachat-client.ts` is server-only** — imported exclusively by `app/api/` routes. Never import it in client components. It holds in-memory OAuth token cache (`tokenCache` Map).
- **API credentials flow**: client encodes `clientId:clientSecret` as base64 → sends to API routes → routes call `getAccessToken(credentials, scope)`. Credentials are stored in `localStorage` via `useSettings`, never in env vars.
- **File attachment**: GigaChat API requires `attachments: [fileId]` only on the **first user message** in a conversation — `sendMessage()` in `gigachat-client.ts` handles this automatically.
- **Session management**: `useChat` generates a UUID `sessionId` per conversation (via `useRef`). `clearChat`/`resetSession` generate a new UUID to start a fresh GigaChat cache context.
- **`canvas` alias**: `next.config.ts` aliases `canvas` → `empty-module.js` for Turbopack to avoid a `react-pdf`/`pdfjs-dist` SSR error.

### Settings persistence

`AppSettings` is stored in `localStorage` under key `docchat_settings`. The app shows `OnboardingScreen` when settings are null (first run). Settings include: GigaChat Client ID/Secret, scope (`GIGACHAT_API_PERS` / `B2B` / `CORP`), model, and theme.

### API routes (server-side proxy)

All three routes authenticate via credentials passed in the request body — there are no server-side env vars:

- `POST /api/gigachat/token` — OAuth token validation (used by "Test connection" button)
- `POST /api/gigachat/upload` — file upload to GigaChat File API
- `POST /api/gigachat/chat` — chat completions, returns `{ content, tokenUsage }`

### Token counting

`useTokenCounter` accumulates `totalTokens` and `precachedTokens` across all messages in `localStorage` (`docchat_token_usage`). `TokenCounter` component in the toolbar displays them.
