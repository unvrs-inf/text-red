"use client";

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/lib/types';
import { useGigaChat } from './useGigaChat';
import { useTokenCounter } from './useTokenCounter';

export function useChat(fileId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef<string>(uuidv4());
  const { sendMessage: gigaSend } = useGigaChat();
  const { addTokens } = useTokenCounter();

  const sendMessage = useCallback(
    async (text: string, selectedText?: string, isEdit?: boolean) => {
      if (!text.trim()) return;

      // Формируем content с выделенным текстом если есть
      const content = selectedText
        ? `Пользователь выделил следующий фрагмент документа:\n---\n${selectedText}\n---\n\n${text}`
        : text;

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
        selectedText,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Передаем всю историю (включая новое сообщение)
        const allMessages = [...messages, userMsg].filter(
          (m) => m.role === 'user' || m.role === 'assistant'
        );

        const response = await gigaSend({
          messages: allMessages,
          fileId: fileId || '',
          sessionId: sessionIdRef.current,
        });

        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
          tokenUsage: response.tokenUsage,
          isEditResponse: isEdit,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        addTokens(response.tokenUsage.totalTokens, response.tokenUsage.precachedTokens);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, fileId, gigaSend, addTokens]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = uuidv4();
  }, []);

  const resetSession = useCallback(() => {
    sessionIdRef.current = uuidv4();
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sessionId: sessionIdRef.current,
    sendMessage,
    clearChat,
    resetSession,
  };
}
