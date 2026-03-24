# DocChat — AI Document Assistant

Веб-приложение для просмотра PDF/DOCX документов с AI-чатом на базе GigaChat (Сбер).
Загрузите документ и задавайте вопросы по его содержимому.

## Возможности

- Просмотр PDF (постраничный, с зумом) и DOCX документов
- AI-чат по содержимому документа (GigaChat API)
- Выделение текста → вопрос AI или редактирование
- Кэширование контекста (X-Session-ID) для экономии токенов (~88%)
- Тёмная тема (светлая / тёмная / системная)
- Подсчёт использованных токенов
- Адаптивный дизайн (десктоп + мобильный)

## Требования

- Node.js 18+
- API-ключ GigaChat (бесплатный, 1 млн токенов/год для физических лиц)

## Установка и запуск

```bash
npm install
npm run dev
```

Открыть: http://localhost:3000

## Получение API-ключа GigaChat

1. Перейти на [developers.sber.ru](https://developers.sber.ru/docs/ru/gigachat/individuals-quickstart)
2. Авторизоваться через Сбер ID
3. Создать проект «GigaChat API»
4. Скопировать Client ID и Client Secret
5. Ввести в настройках приложения при первом запуске

## Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `Ctrl+O` | Открыть файл |
| `Escape` | Закрыть модалку / убрать выделение |

## Технологии

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **react-pdf** — просмотр PDF
- **mammoth.js** — конвертация DOCX → HTML
- **GigaChat API** — File API + X-Session-ID кэширование

## Архитектура

```
app/
├── api/gigachat/      # Серверные proxy-routes (OAuth, upload, chat)
├── layout.tsx
└── page.tsx
components/
├── chat/              # ChatPanel, ChatMessage, ChatInput
├── document/          # PdfViewer, DocxViewer, SelectionToolbar
├── layout/            # AppLayout, Toolbar
├── settings/          # SettingsModal, OnboardingScreen
└── ui/                # Toast, Spinner, Modal
hooks/
├── useChat.ts         # Управление чатом
├── useDocument.ts     # Управление документом
├── useGigaChat.ts     # Клиент GigaChat API
├── useSettings.ts     # Настройки (localStorage)
├── useTextSelection.ts # Выделение текста
└── useTheme.ts        # Тёмная/светлая тема
lib/
├── gigachat-client.ts # Серверный модуль GigaChat
├── types.ts           # TypeScript типы
└── constants.ts       # Константы
```

## Экономия токенов

GigaChat кэширует контекст по X-Session-ID. При последующих запросах в рамках одного диалога
документ не пересчитывается — кэшированные токены не тарифицируются.

Пример: документ 10 стр (~8000 токенов) × 20 вопросов:
- Без кэша: 160 000 токенов
- С кэшем: ~18 450 токенов (**экономия ~88%**)
