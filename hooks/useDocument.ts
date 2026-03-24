"use client";

import { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { DocumentFile } from '@/lib/types';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from '@/lib/constants';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function replaceTextInDocxXml(xmlStr: string, original: string, edited: string): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
  const paragraphs = xmlDoc.getElementsByTagNameNS('*', 'p');

  for (const para of Array.from(paragraphs)) {
    const tElements = Array.from(para.getElementsByTagNameNS('*', 't'));
    if (!tElements.length) continue;

    // Строим карту: позиция символа → {элемент, смещение внутри элемента}
    const charMap: Array<{ el: Element; pos: number }> = [];
    for (const t of tElements) {
      const text = t.textContent ?? '';
      for (let i = 0; i < text.length; i++) {
        charMap.push({ el: t, pos: i });
      }
    }

    const combined = charMap.map(c => (c.el.textContent ?? '')[c.pos]).join('');
    const matchIdx = combined.indexOf(original);
    if (matchIdx === -1) continue;

    const matchEnd = matchIdx + original.length;
    const affectedEls = new Set(charMap.slice(matchIdx, matchEnd).map(c => c.el));
    const firstEl = charMap[matchIdx].el;

    for (const el of affectedEls) {
      const elStart = charMap.findIndex(c => c.el === el);
      const elEnd = charMap.findLastIndex(c => c.el === el);
      const prefix = elStart < matchIdx ? (el.textContent ?? '').slice(0, matchIdx - elStart) : '';
      const suffix = elEnd >= matchEnd ? (el.textContent ?? '').slice(matchEnd - elStart) : '';

      el.textContent = el === firstEl ? prefix + edited + suffix : prefix + suffix;

      if ((el.textContent ?? '').match(/^\s|\s$/)) {
        el.setAttribute('xml:space', 'preserve');
      }
    }

    break; // заменяем только первое вхождение
  }

  return new XMLSerializer().serializeToString(xmlDoc);
}

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

  const buildModifiedDocxFile = useCallback(
    async (original: string, edited: string): Promise<File> => {
      if (!document) throw new Error('Документ не загружен');
      const buf = await document.file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const xmlStr = await zip.file('word/document.xml')!.async('string');
      const modifiedXml = replaceTextInDocxXml(xmlStr, original, edited);
      zip.file('word/document.xml', modifiedXml);
      const blob = await zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME });
      const baseName = document.name.replace(/\.[^.]+$/, '');
      return new File([blob], `${baseName}_edited.docx`, { type: DOCX_MIME });
    },
    [document]
  );

  const downloadDocument = useCallback(async () => {
    if (!document) return;

    let blob: Blob;
    let filename: string;

    if (document.type === 'docx' && document.viewerReplacement) {
      const { original, edited } = document.viewerReplacement;
      const docxFile = await buildModifiedDocxFile(original, edited);
      blob = docxFile;
      filename = docxFile.name;
    } else {
      blob = document.file;
      filename = document.name;
    }

    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [document, buildModifiedDocxFile]);

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
    buildModifiedDocxFile,
    downloadDocument,
  };
}
