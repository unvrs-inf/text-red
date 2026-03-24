/**
 * Серверный модуль для работы с GigaChat API.
 * Используется ТОЛЬКО в API routes (app/api/).
 * НЕ импортировать в клиентские компоненты.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GIGACHAT_OAUTH_URL,
  GIGACHAT_API_URL,
  TOKEN_CACHE_MARGIN_MS,
} from './constants';
import {
  GigaChatTokenResponse,
  GigaChatFileUploadResponse,
  GigaChatChatResponse,
} from './types';

// Кэш OAuth-токенов (по credentials)
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getAccessToken(credentials: string, scope: string): Promise<string> {
  const cacheKey = `${credentials}:${scope}`;
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt - TOKEN_CACHE_MARGIN_MS > Date.now()) {
    return cached.token;
  }

  const body = new URLSearchParams({ scope });

  let response: Response;
  try {
    response = await fetch(GIGACHAT_OAUTH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        RqUID: uuidv4(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  } catch {
    throw new Error('Не удалось подключиться к серверу GigaChat. Проверьте интернет-соединение.');
  }

  if (response.status === 401) {
    throw new Error('Невалидные Client ID или Client Secret');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Ошибка авторизации GigaChat: ${text}`);
  }

  const data = (await response.json()) as GigaChatTokenResponse;
  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: data.expires_at });
  return data.access_token;
}

export async function uploadFile(
  accessToken: string,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<GigaChatFileUploadResponse> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer.buffer as ArrayBuffer], { type: mimeType });
  formData.append('file', blob, filename);
  formData.append('purpose', 'general');

  const response = await fetch(`${GIGACHAT_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (response.status === 413) throw new Error('Файл слишком большой');
  if (response.status === 422) throw new Error('Формат файла не поддерживается');
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Ошибка загрузки файла: ${text}`);
  }

  return response.json() as Promise<GigaChatFileUploadResponse>;
}

export interface MessageParam {
  role: string;
  content: string;
  attachments?: string[];
}

export async function sendMessage(
  accessToken: string,
  messages: MessageParam[],
  fileId: string | null,
  model: string,
  sessionId: string,
  clientId: string
): Promise<GigaChatChatResponse> {
  const systemPrompt: MessageParam = {
    role: 'system',
    content:
      'Ты — умный помощник для анализа документов. Отвечай на вопросы пользователя, опираясь на содержимое прикреплённого документа. Если ответ не содержится в документе, честно скажи об этом. Отвечай на том языке, на котором задан вопрос.',
  };

  // Добавляем attachments только к первому user-сообщению
  const formattedMessages: MessageParam[] = [systemPrompt];
  let firstUserDone = false;
  for (const msg of messages) {
    if (msg.role === 'user' && !firstUserDone && fileId) {
      formattedMessages.push({ ...msg, attachments: [fileId] });
      firstUserDone = true;
    } else {
      formattedMessages.push(msg);
    }
  }

  const body = {
    model,
    messages: formattedMessages,
    stream: false,
    temperature: 0.3,
    max_tokens: 2048,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${GIGACHAT_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        'X-Client-ID': clientId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('GigaChat не ответил вовремя. Попробуйте ещё раз.');
    }
    throw new Error('Не удалось подключиться к серверу GigaChat. Проверьте интернет-соединение.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) throw new Error('Невалидный API-ключ. Проверьте настройки.');
  if (response.status === 422) {
    throw new Error('Документ слишком большой для контекста модели. Попробуйте документ меньшего размера.');
  }
  if (response.status === 429) throw new Error('Превышен лимит запросов. Подождите несколько секунд.');
  if (response.status === 503) throw new Error('Сервис GigaChat временно недоступен. Попробуйте позже.');

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Ошибка GigaChat: ${text}`);
  }

  return response.json() as Promise<GigaChatChatResponse>;
}
