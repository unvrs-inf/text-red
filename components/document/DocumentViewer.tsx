"use client";

import { useEffect, useCallback } from 'react';

// Глобальный гвард: хранит File-объекты, загрузка которых уже инициирована.
// Module scope виден всем экземплярам компонента одновременно (десктоп + мобильный layout).
const inFlightUploads = new WeakSet<File>();
import { DocumentFile } from '@/lib/types';
import Spinner from '@/components/ui/Spinner';
import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';
import SelectionToolbar from './SelectionToolbar';
import { useSettings } from '@/hooks/useSettings';
import { useTextSelection } from '@/hooks/useTextSelection';

interface DocumentViewerProps {
  document: DocumentFile;
  onGigaChatFileId: (id: string) => void;
  onUploadError: (error: string) => void;
  onUploadStart: () => void;
  onError: (message: string, type?: 'success' | 'error' | 'info') => void;
  onAskAI?: (text: string) => void;
  onEditWithAI?: (text: string, instruction: string) => void;
}

export default function DocumentViewer({
  document,
  onGigaChatFileId,
  onUploadError,
  onUploadStart,
  onError: _onError, // kept for future use, currently unused
  onAskAI,
  onEditWithAI,
}: DocumentViewerProps) {
  const { settings, getCredentialsBase64 } = useSettings();
  const { selectedText, selectionRect, handleMouseUp, clearSelection } = useTextSelection();

  // Upload to GigaChat when document is loaded and we have credentials
  useEffect(() => {
    if (document.gigachatFileId || document.isUploading || document.uploadError) return;
    if (!settings) return;
    if (inFlightUploads.has(document.file)) return;

    inFlightUploads.add(document.file);

    const uploadToGigaChat = async () => {
      onUploadStart();
      try {
        const formData = new FormData();
        formData.append('file', document.file);
        formData.append('credentials', getCredentialsBase64());
        formData.append('scope', settings.gigachatScope);
        formData.append('clientId', settings.gigachatClientId);

        const res = await fetch('/api/gigachat/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          inFlightUploads.delete(document.file);
          onUploadError(data.error || 'Ошибка загрузки файла в GigaChat');
        } else {
          onGigaChatFileId(data.fileId);
        }
      } catch {
        inFlightUploads.delete(document.file);
        onUploadError('Не удалось подключиться к серверу GigaChat');
      }
    };

    uploadToGigaChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.file, settings]);

  // Hide toolbar on outside click
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't clear if clicking on SelectionToolbar
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-toolbar]')) return;
    },
    []
  );

  return (
    <div
      className="relative flex flex-col h-full overflow-hidden"
      onMouseUp={handleMouseUp}
      onClick={handleContainerClick}
    >
      {/* Uploading overlay */}
      {document.isUploading && (
        <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <Spinner size="sm" />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Загрузка документа в AI...
            </span>
          </div>
        </div>
      )}

      {/* Upload error banner */}
      {document.uploadError && (
        <div className="bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 px-4 py-2 flex-shrink-0">
          <p className="text-sm text-red-600 dark:text-red-400">
            Ошибка загрузки в GigaChat: {document.uploadError}
          </p>
        </div>
      )}

      {/* Viewer */}
      {document.type === 'pdf' ? (
        <PdfViewer file={document.file} />
      ) : (
        <DocxViewer file={document.file} />
      )}

      {/* Selection Toolbar */}
      {selectedText && selectionRect && (
        <div data-selection-toolbar>
          <SelectionToolbar
            rect={selectionRect}
            selectedText={selectedText}
            onAskAI={(text) => {
              onAskAI?.(text);
              clearSelection();
            }}
            onEdit={(text, instruction) => {
              onEditWithAI?.(text, instruction);
              clearSelection();
            }}
            onClose={clearSelection}
          />
        </div>
      )}
    </div>
  );
}
