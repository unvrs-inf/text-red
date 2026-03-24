"use client";

import { Upload, Settings, FileText, X } from 'lucide-react';
import TokenCounter from './TokenCounter';
import { DocumentFile } from '@/lib/types';

interface ToolbarProps {
  document: DocumentFile | null;
  onOpenFile: () => void;
  onOpenSettings: () => void;
  onCloseDocument?: () => void;
}

export default function Toolbar({
  document,
  onOpenFile,
  onOpenSettings,
  onCloseDocument,
}: ToolbarProps) {
  return (
    <header className="flex items-center gap-3 h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 text-lg min-w-fit">
        <FileText className="w-5 h-5" />
        <span className="hidden sm:inline">DocChat</span>
      </div>

      {/* File name */}
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        {document ? (
          <>
            <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
              {document.name}
            </span>
            {document.isUploading && (
              <span className="text-xs text-blue-500 flex-shrink-0">Загрузка в AI...</span>
            )}
            {document.uploadError && (
              <span className="text-xs text-red-500 flex-shrink-0">Ошибка загрузки</span>
            )}
          </>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">Нет документа</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <TokenCounter />

        {document && onCloseDocument && (
          <button
            onClick={onCloseDocument}
            title="Закрыть документ"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenFile}
          title="Открыть файл (Ctrl+O)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Открыть</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Настройки"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
