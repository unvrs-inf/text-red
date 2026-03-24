"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pencil, Send } from 'lucide-react';

interface SelectionToolbarProps {
  rect: { top: number; left: number; width: number; height: number };
  selectedText: string;
  onAskAI: (text: string) => void;
  onEdit: (text: string, instruction: string) => void;
  onClose: () => void;
}

export default function SelectionToolbar({
  rect,
  selectedText,
  onAskAI,
  onEdit,
  onClose,
}: SelectionToolbarProps) {
  const [mode, setMode] = useState<'menu' | 'edit'>('menu');
  const [instruction, setInstruction] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Position: above the selection, centered
  const top = rect.top - 48 + window.scrollY;
  const left = rect.left + rect.width / 2;

  useEffect(() => {
    if (mode === 'edit') {
      inputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleAskAI = () => {
    onAskAI(selectedText);
    onClose();
  };

  const handleEditSubmit = () => {
    if (!instruction.trim()) return;
    onEdit(selectedText, instruction.trim());
    onClose();
  };

  return (
    <div
      className="fixed z-40 -translate-x-1/2 shadow-xl"
      style={{ top: `${top}px`, left: `${left}px` }}
    >
      {mode === 'menu' ? (
        <div className="flex items-center gap-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl px-2 py-1.5 shadow-lg">
          <button
            onClick={handleAskAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Спросить AI
          </button>
          <div className="w-px h-5 bg-gray-600 dark:bg-gray-300" />
          <button
            onClick={() => setMode('edit')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Редактировать
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl px-3 py-2 shadow-lg">
          <input
            ref={inputRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSubmit();
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Инструкция: перефразируй, исправь..."
            className="bg-transparent text-sm w-60 outline-none placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            onClick={handleEditSubmit}
            disabled={!instruction.trim()}
            className="p-1 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
