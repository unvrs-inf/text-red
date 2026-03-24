"use client";

import { useRef, useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { MAX_FILE_SIZE_MB } from '@/lib/constants';

interface FileUploadProps {
  onFile: (file: File) => void;
  onError: (message: string) => void;
}

export default function FileUpload({ onFile, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      const isPdf = file.type === 'application/pdf' || ext === 'pdf';
      const isDocx =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        ext === 'docx';

      if (!isPdf && !isDocx) {
        onError(`Неподдерживаемый формат файла "${file.name}". Загрузите PDF или DOCX.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        onError(`Файл "${file.name}" слишком большой. Максимальный размер: ${MAX_FILE_SIZE_MB} МБ.`);
        return;
      }

      onFile(file);
    },
    [onFile, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // Reset input value so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div
      className={`flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-xl m-4 transition-colors cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleInputChange}
      />
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
          {isDragging ? (
            <FileText className="w-10 h-10 text-blue-500" />
          ) : (
            <Upload className="w-10 h-10 text-blue-500" />
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {isDragging ? 'Отпустите файл' : 'Загрузите документ'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Перетащите PDF или DOCX сюда, или нажмите для выбора
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Максимальный размер: {MAX_FILE_SIZE_MB} МБ
          </p>
        </div>
      </div>
    </div>
  );
}
