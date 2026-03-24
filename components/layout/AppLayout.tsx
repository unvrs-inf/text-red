"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import Toolbar from './Toolbar';
import FileUpload from '@/components/upload/FileUpload';
import Toast, { useToast } from '@/components/ui/Toast';
import { useDocument } from '@/hooks/useDocument';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useGigaChat } from '@/hooks/useGigaChat';

// Lazy-loaded heavy components
import dynamic from 'next/dynamic';

const DocumentViewer = dynamic(() => import('@/components/document/DocumentViewer'), {
  ssr: false,
});
const ChatPanel = dynamic(() => import('@/components/chat/ChatPanel'), {
  ssr: false,
});
const SettingsModal = dynamic(() => import('@/components/settings/SettingsModal'), {
  ssr: false,
});
const OnboardingScreen = dynamic(() => import('@/components/settings/OnboardingScreen'), {
  ssr: false,
});

export default function AppLayout() {
  const { document, loadDocument, clearDocument, setGigaChatFileId, setUploadError, setUploading, applyViewerReplacement, buildModifiedTxtFile } =
    useDocument();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<'document' | 'chat'>('document');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme
  const { settings } = useSettings();
  useTheme(settings?.theme);

  // Text selection state lifted to AppLayout to bridge DocumentViewer ↔ ChatPanel
  const [chatSelectedText, setChatSelectedText] = useState<string | null>(null);
  const { handleMouseUp, clearSelection } = useTextSelection();

  // Edit state: original text that was sent for editing
  const [pendingEditOriginalText, setPendingEditOriginalText] = useState<string | null>(null);
  const [chatResetTrigger, setChatResetTrigger] = useState(0);
  const { uploadFile, deleteFile } = useGigaChat();

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = loadDocument(file);
      if (err) {
        addToast(err, 'error');
      } else {
        setActiveTab('document');
        setChatSelectedText(null);
      }
    },
    [loadDocument, addToast]
  );

  const handleFileError = useCallback(
    (message: string) => {
      addToast(message, 'error');
    },
    [addToast]
  );

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleAskAI = useCallback(
    (text: string) => {
      setChatSelectedText(text);
      clearSelection();
      // On mobile, switch to chat tab
      setActiveTab('chat');
    },
    [clearSelection]
  );

  const handleEditWithAI = useCallback(
    (text: string, instruction: string) => {
      const prompt = `Отредактируй следующий фрагмент текста согласно инструкции.\nВерни ТОЛЬКО отредактированный текст без пояснений и комментариев.\n\nФрагмент:\n---\n${text}\n---\n\nИнструкция: ${instruction}`;
      setPendingEditOriginalText(text);
      setChatSelectedText(undefined as unknown as string);
      // Pass the edit prompt as a direct message
      // We use a special prefix that ChatPanel can detect
      setChatSelectedText(`__EDIT__${prompt}`);
      clearSelection();
      setActiveTab('chat');
    },
    [clearSelection]
  );

  const handleApplyEdit = useCallback(
    async (original: string, edited: string) => {
      if (!document) return;

      if (document.type === 'pdf') {
        try {
          await navigator.clipboard.writeText(edited);
        } catch {
          // clipboard may be unavailable
        }
        addToast('PDF-редактирование недоступно. Текст скопирован в буфер.', 'info');
        return;
      }

      try {
        // 1. Update viewer display
        applyViewerReplacement(original, edited);

        // 2. Build modified TXT file and re-upload to GigaChat
        const txtFile = await buildModifiedTxtFile(original, edited);
        const oldFileId = document.gigachatFileId;

        const newFileId = await uploadFile(txtFile);

        if (oldFileId) {
          try {
            await deleteFile(oldFileId);
          } catch {
            // Non-critical: old file deletion failure doesn't break anything
          }
        }

        setGigaChatFileId(newFileId);
        // Trigger chat session reset
        setChatResetTrigger((n) => n + 1);
        setPendingEditOriginalText(null);
        addToast('Документ обновлён', 'success');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Ошибка применения изменений', 'error');
      }
    },
    [document, applyViewerReplacement, buildModifiedTxtFile, uploadFile, deleteFile, setGigaChatFileId, addToast]
  );

  const renderDocumentPanel = (withMouseUp = false) =>
    document ? (
      <div
        className="flex flex-col h-full overflow-hidden"
        onMouseUp={withMouseUp ? handleMouseUp : undefined}
      >
        <DocumentViewer
          document={document}
          onGigaChatFileId={setGigaChatFileId}
          onUploadError={setUploadError}
          onUploadStart={() => setUploading(true)}
          onError={addToast}
          onAskAI={handleAskAI}
          onEditWithAI={handleEditWithAI}
        />
      </div>
    ) : (
      <FileUpload onFile={handleFile} onError={handleFileError} />
    );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Hidden file input for Toolbar button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleInputChange}
      />

      <Toolbar
        document={document}
        onOpenFile={handleOpenFile}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseDocument={document ? clearDocument : undefined}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: two panels */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Left panel: Document */}
          <div className="w-[60%] flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
            {renderDocumentPanel(true)}
          </div>

          {/* Right panel: Chat */}
          <div className="w-[40%] flex flex-col overflow-hidden">
            <ChatPanel
              document={document}
              onError={addToast}
              selectedText={chatSelectedText}
              onClearSelection={() => setChatSelectedText(null)}
              editOriginalText={pendingEditOriginalText}
              onApplyEdit={handleApplyEdit}
              resetTrigger={chatResetTrigger}
            />
          </div>
        </div>

        {/* Mobile: tabs */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {activeTab === 'document'
              ? renderDocumentPanel(true)
              : (
                <ChatPanel
                  document={document}
                  onError={addToast}
                  selectedText={chatSelectedText}
                  onClearSelection={() => setChatSelectedText(null)}
                  editOriginalText={pendingEditOriginalText}
                  onApplyEdit={handleApplyEdit}
                  resetTrigger={chatResetTrigger}
                />
              )}
          </div>

          {/* Mobile tab bar */}
          <div className="flex border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <button
              onClick={() => setActiveTab('document')}
              className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs ${
                activeTab === 'document'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <FileText className="w-5 h-5" />
              Документ
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex flex-col items-center py-2 gap-1 text-xs ${
                activeTab === 'chat'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Чат
            </button>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}

      {/* Onboarding */}
      <OnboardingScreen />
    </div>
  );
}
