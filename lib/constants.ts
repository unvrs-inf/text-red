export const GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
export const GIGACHAT_API_URL = 'https://gigachat.devices.sberbank.ru/api/v1';
export const MAX_FILE_SIZE_MB = 40;          // Лимит GigaChat на текстовый файл
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ['.pdf', '.docx'];
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const DEFAULT_MODEL = 'GigaChat-2';
export const DEFAULT_SCOPE = 'GIGACHAT_API_PERS';
export const TOKEN_CACHE_MARGIN_MS = 60000;  // Обновлять OAuth-токен за 1 минуту до истечения
export const SETTINGS_STORAGE_KEY = 'docchat_settings';
export const TOKEN_USAGE_STORAGE_KEY = 'docchat_token_usage';
