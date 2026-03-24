"use client";

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: File;
  onPageCount?: (count: number) => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5];

export default function PdfViewer({ file, onPageCount }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [fitToWidth, setFitToWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState(600);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 600;
        setContainerWidth(width - 32); // 32px padding
      });
      resizeObserver.observe(node);
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onPageCount?.(numPages);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    setError(`Ошибка загрузки PDF: ${err.message}`);
  };

  const zoomIn = () => {
    const current = ZOOM_LEVELS.indexOf(scale);
    if (current < ZOOM_LEVELS.length - 1) {
      setScale(ZOOM_LEVELS[current + 1]);
      setFitToWidth(false);
    }
  };

  const zoomOut = () => {
    const current = ZOOM_LEVELS.indexOf(scale);
    if (current > 0) {
      setScale(ZOOM_LEVELS[current - 1]);
      setFitToWidth(false);
    }
  };

  const fitWidth = () => {
    setFitToWidth(true);
    setScale(1.0);
  };

  const pageWidth = fitToWidth ? containerWidth : containerWidth * scale;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <button
          onClick={zoomOut}
          disabled={!fitToWidth && ZOOM_LEVELS.indexOf(scale) === 0}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-600 dark:text-gray-400"
          title="Уменьшить"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitWidth}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 ${fitToWidth ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
          title="По ширине"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={zoomIn}
          disabled={!fitToWidth && ZOOM_LEVELS.indexOf(scale) === ZOOM_LEVELS.length - 1}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-600 dark:text-gray-400"
          title="Увеличить"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          {fitToWidth ? 'По ширине' : `${Math.round(scale * 100)}%`}
        </span>
        {numPages > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {numPages} стр.
          </span>
        )}
      </div>

      {/* Document */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-800 p-4 flex flex-col items-center gap-4"
      >
        {error ? (
          <div className="mt-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center py-16">
                <Spinner size="lg" />
              </div>
            }
            error={
              <div className="text-center text-red-500 py-8">
                Не удалось загрузить PDF
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div key={i} className="shadow-md">
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  loading={
                    <div
                      style={{ width: pageWidth, height: 400 }}
                      className="bg-white dark:bg-gray-900 flex items-center justify-center"
                    >
                      <Spinner />
                    </div>
                  }
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}
