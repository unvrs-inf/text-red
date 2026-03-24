"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import SelectedTextChip from './SelectedTextChip';

interface ChatInputProps {
  onSend: (text: string, selectedText?: string) => void;
  isLoading: boolean;
  selectedText?: string | null;
  onClearSelection?: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  isLoading,
  selectedText,
  onClearSelection,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 5 * 24; // 5 lines * 24px
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  const handleSubmit = () => {
    if (!text.trim() || isLoading || disabled) return;
    onSend(text.trim(), selectedText || undefined);
    setText('');
    onClearSelection?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Selected text chip */}
      {selectedText && onClearSelection && (
        <SelectedTextChip text={selectedText} onClear={onClearSelection} />
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Задайте вопрос по документу..."
          disabled={isLoading || disabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 min-h-[38px] max-h-[120px] overflow-y-auto"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading || disabled}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          {isLoading ? <Spinner size="sm" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}
