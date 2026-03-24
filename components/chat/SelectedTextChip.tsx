"use client";

import { X } from 'lucide-react';

interface SelectedTextChipProps {
  text: string;
  onClear: () => void;
}

export default function SelectedTextChip({ text, onClear }: SelectedTextChipProps) {
  const preview = text.length > 100 ? text.slice(0, 100) + '...' : text;

  return (
    <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 mb-2">
      <div className="flex-1 text-xs text-yellow-800 dark:text-yellow-200 overflow-hidden">
        <span className="font-medium">Выделено: </span>
        <span className="italic">&ldquo;{preview}&rdquo;</span>
      </div>
      <button
        onClick={onClear}
        className="flex-shrink-0 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
