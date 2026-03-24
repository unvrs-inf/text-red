"use client";

import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import Spinner from '@/components/ui/Spinner';

interface DocxViewerProps {
  file: File;
}

export default function DocxViewer({ file }: DocxViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);  

    file
      .arrayBuffer()
      .then((buf) => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then((result) => {
        if (!cancelled) {
          setHtml(result.value);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(`Ошибка конвертации DOCX: ${err.message}`);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 p-6">
      <div
        className="docx-content mx-auto max-w-3xl text-gray-900 dark:text-gray-100"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .docx-content h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .docx-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .docx-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .docx-content h4, .docx-content h5, .docx-content h6 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; }
        .docx-content p { margin-bottom: 0.75rem; line-height: 1.7; }
        .docx-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .docx-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .docx-content li { margin-bottom: 0.25rem; line-height: 1.6; }
        .docx-content table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .docx-content td, .docx-content th { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; }
        .docx-content th { background-color: #f9fafb; font-weight: 600; }
        .docx-content strong, .docx-content b { font-weight: 700; }
        .docx-content em, .docx-content i { font-style: italic; }
        @media (prefers-color-scheme: dark) {
          .docx-content td, .docx-content th { border-color: #374151; }
          .docx-content th { background-color: #1f2937; }
        }
      `}</style>
    </div>
  );
}
