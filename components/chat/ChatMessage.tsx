"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, CheckCheck } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
  onApply?: () => void;
}

export default function ChatMessage({ message, onApply }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Для user-сообщений показываем оригинальный текст без выделения
  const displayContent = isUser && message.selectedText
    ? message.content.replace(
        `Пользователь выделил следующий фрагмент документа:\n---\n${message.selectedText}\n---\n\n`,
        ''
      )
    : message.content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Selected text quote (for user messages) */}
        {isUser && message.selectedText && (
          <div className="text-xs text-gray-500 dark:text-gray-400 border-l-2 border-yellow-400 pl-2 max-w-full truncate">
            &ldquo;{message.selectedText.slice(0, 80)}{message.selectedText.length > 80 ? '...' : ''}&rdquo;
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Time + copy button + apply button */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Копировать"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
          {!isUser && message.isEditResponse && onApply && (
            <button
              onClick={onApply}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Применить к документу"
            >
              <CheckCheck className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
