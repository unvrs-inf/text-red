"use client";

import { useState, useCallback } from 'react';
import { useSettings } from './useSettings';
import { ChatMessage, TokenUsage } from '@/lib/types';

interface SendMessageParams {
  messages: ChatMessage[];
  fileId: string;
  sessionId: string;
}

export function useGigaChat() {
  const { settings, getCredentialsBase64 } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      if (!settings) throw new Error('Настройте API-ключ GigaChat в настройках.');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('credentials', getCredentialsBase64());
      formData.append('scope', settings.gigachatScope);
      formData.append('clientId', settings.gigachatClientId);

      const res = await fetch('/api/gigachat/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки файла');
      return data.fileId as string;
    },
    [settings, getCredentialsBase64]
  );

  const sendMessage = useCallback(
    async (params: SendMessageParams): Promise<{ content: string; tokenUsage: TokenUsage }> => {
      if (!settings) throw new Error('Настройте API-ключ GigaChat в настройках.');

      setIsLoading(true);
      setError(null);

      const reqBody = JSON.stringify({
        credentials: getCredentialsBase64(),
        scope: settings.gigachatScope,
        clientId: settings.gigachatClientId,
        model: settings.gigachatModel,
        sessionId: params.sessionId,
        messages: params.messages,
        fileId: params.fileId,
      });

      // Retry up to 2 times for network/503 errors
      let lastErr: Error = new Error('Неизвестная ошибка');
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch('/api/gigachat/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: reqBody,
            });

            const data = await res.json();
            if (!res.ok) {
              const msg = data.error || 'Ошибка запроса к GigaChat';
              // Only retry on 503/network errors
              if (res.status === 503 && attempt < 2) {
                await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
                continue;
              }
              throw new Error(msg);
            }
            return data as { content: string; tokenUsage: TokenUsage };
          } catch (err) {
            lastErr = err instanceof Error ? err : new Error(String(err));
            const isNetworkError = lastErr.message.includes('подключиться') || lastErr.message.includes('fetch');
            if (isNetworkError && attempt < 2) {
              await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
              continue;
            }
            throw lastErr;
          }
        }
        throw lastErr;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [settings, getCredentialsBase64]
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      if (!settings) throw new Error('Настройте API-ключ GigaChat в настройках.');

      const res = await fetch('/api/gigachat/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: getCredentialsBase64(),
          scope: settings.gigachatScope,
          clientId: settings.gigachatClientId,
          fileId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка удаления файла');
    },
    [settings, getCredentialsBase64]
  );

  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!settings) return false;
    try {
      const res = await fetch('/api/gigachat/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: getCredentialsBase64(),
          scope: settings.gigachatScope,
        }),
      });
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }, [settings, getCredentialsBase64]);

  return { uploadFile, sendMessage, deleteFile, testConnection, isLoading, error };
}
