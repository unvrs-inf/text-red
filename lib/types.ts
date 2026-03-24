// === Документ ===
export interface DocumentFile {
  file: File;                     // Оригинальный File-объект
  name: string;                   // Имя файла
  type: 'pdf' | 'docx';          // Тип документа
  pageCount?: number;             // Количество страниц (для PDF)
  gigachatFileId?: string;        // ID файла в хранилище GigaChat (после upload)
  isUploading: boolean;           // Идёт загрузка в GigaChat
  uploadError?: string;           // Ошибка загрузки
  viewerReplacement?: { original: string; edited: string }; // Замена текста в просмотрщике
}

// === Чат ===
export interface ChatMessage {
  id: string;                     // UUID
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;              // Date.now()
  selectedText?: string;          // Выделенный текст, если сообщение связано с выделением
  tokenUsage?: TokenUsage;        // Расход токенов на этот обмен (приходит в ответе)
  isEditResponse?: boolean;       // Ответ на запрос редактирования текста
}

export interface TokenUsage {
  promptTokens: number;           // Токены запроса (после вычета кэша)
  completionTokens: number;       // Токены ответа
  totalTokens: number;            // Итого тарифицируемых
  precachedTokens: number;        // Кэшированных (не тарифицируемых)
}

// === Настройки ===
export interface AppSettings {
  gigachatClientId: string;       // Client ID из проекта GigaChat API
  gigachatClientSecret: string;   // Client Secret
  gigachatScope: 'GIGACHAT_API_PERS' | 'GIGACHAT_API_B2B' | 'GIGACHAT_API_CORP';
  gigachatModel: 'GigaChat-2' | 'GigaChat-2-Pro' | 'GigaChat-2-Max';
  theme: 'light' | 'dark' | 'system';
}

// === API ===
export interface GigaChatTokenResponse {
  access_token: string;
  expires_at: number;             // Unix timestamp в миллисекундах
}

export interface GigaChatFileUploadResponse {
  id: string;                     // Идентификатор файла в хранилище
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

export interface GigaChatChatRequest {
  model: string;
  messages: { role: string; content: string; attachments?: string[] }[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface GigaChatChatResponse {
  choices: { message: { role: string; content: string }; finish_reason: string }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    precached_prompt_tokens: number;
  };
}

// === Toast ===
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
