"use client";

import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { DocumentFile } from '@/lib/types';
import { useChat } from '@/hooks/useChat';
import { useSettings } from '@/hooks/useSettings';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  document: DocumentFile | null;
  onError: (message: string, type?: 'success' | 'error' | 'info') => void;
  selectedText?: string | null;
  onClearSelection?: () => void;
}

export default function ChatPanel({ document, onError, selectedText, onClearSelection }: ChatPanelProps) {
  const { settings, isLoaded } = useSettings();
  const fileId = document?.gigachatFileId || null;
  const { messages, isLoading, sendMessage, clearChat, resetSession } = useChat(fileId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset session when document changes
  useEffect(() => {
    resetSession();
  }, [document?.file, resetSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string, sel?: string) => {
    try {
      await sendMessage(text, sel);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка отправки сообщения', 'error');
    }
  };

  // Auto-send edit prompt when AppLayout passes __EDIT__ prefix
  useEffect(() => {
    if (selectedText?.startsWith('__EDIT__')) {
      const prompt = selectedText.slice('__EDIT__'.length);
      handleSend(prompt);
      onClearSelection?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedText]);

  // States
  if (!isLoaded) return null;

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Настройте API-ключ GigaChat в настройках (⚙️) для начала работы
        </p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Загрузите документ, чтобы начать диалог с AI
        </p>
      </div>
    );
  }

  const isUploadPending = document.isUploading || (!document.gigachatFileId && !document.uploadError);
  const uploadFailed = !!document.uploadError;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">AI-чат</span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            title="Очистить чат"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload pending state */}
      {isUploadPending && !uploadFailed && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ⏳ Загрузка документа в AI... Подождите немного.
          </p>
        </div>
      )}

      {uploadFailed && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            ❌ Ошибка загрузки документа в GigaChat. Можно задавать вопросы без контекста.
          </p>
        </div>
      )}

      {/* Welcome message */}
      {messages.length === 0 && !isUploadPending && (
        <div className="px-4 py-6 flex-shrink-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ✅ Документ <strong>{document.name}</strong> загружен. Задайте вопрос по его содержимому.
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* AI typing indicator */}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        selectedText={selectedText}
        onClearSelection={onClearSelection}
        disabled={isUploadPending}
      />
    </div>
  );
}
