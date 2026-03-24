"use client";

import { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import { DocumentFile } from '@/lib/types';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from '@/lib/constants';

export function useDocument() {
  const [document, setDocument] = useState<DocumentFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback((file: File): string | null => {
    // Валидация размера
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Файл слишком большой. Максимальный размер: 40 МБ.`;
    }

    // Валидация типа
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isPdf =
      file.type === 'application/pdf' || ext === 'pdf';
    const isDocx =
      file.type === ACCEPTED_MIME_TYPES[1] ||
      ext === 'docx';

    if (!isPdf && !isDocx) {
      return `Неподдерживаемый формат файла. Загрузите PDF или DOCX.`;
    }

    const docFile: DocumentFile = {
      file,
      name: file.name,
      type: isPdf ? 'pdf' : 'docx',
      isUploading: false,
    };

    setDocument(docFile);
    setError(null);
    setIsLoading(false);
    return null; // null = нет ошибки
  }, []);

  const setGigaChatFileId = useCallback((id: string) => {
    setDocument((prev) =>
      prev ? { ...prev, gigachatFileId: id, isUploading: false } : prev
    );
  }, []);

  const setUploadError = useCallback((err: string) => {
    setDocument((prev) =>
      prev ? { ...prev, uploadError: err, isUploading: false } : prev
    );
  }, []);

  const setUploading = useCallback((uploading: boolean) => {
    setDocument((prev) =>
      prev ? { ...prev, isUploading: uploading } : prev
    );
  }, []);

  const clearDocument = useCallback(() => {
    setDocument(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const applyViewerReplacement = useCallback((original: string, edited: string) => {
    setDocument((prev) =>
      prev ? { ...prev, viewerReplacement: { original, edited } } : prev
    );
  }, []);

  const buildModifiedTxtFile = useCallback(
    async (original: string, edited: string): Promise<File> => {
      if (!document) throw new Error('Документ не загружен');
      const buf = await document.file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      const modifiedText = result.value.replace(original, edited);
      const baseName = document.name.replace(/\.[^.]+$/, '');
      return new File([modifiedText], `${baseName}.txt`, { type: 'text/plain' });
    },
    [document]
  );

  return {
    document,
    isLoading,
    error,
    loadDocument,
    setGigaChatFileId,
    setUploadError,
    setUploading,
    clearDocument,
    applyViewerReplacement,
    buildModifiedTxtFile,
  };
}
