"use client";

import { useState } from 'react';
import { Eye, EyeOff, FileText } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { useSettings } from '@/hooks/useSettings';
import { AppSettings } from '@/lib/types';

export default function OnboardingScreen() {
  const { settings, isLoaded, saveSettings, getDefaultSettings } = useSettings();
  const [form, setForm] = useState<AppSettings>(getDefaultSettings());
  const [showSecret, setShowSecret] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Don't show if settings already exist or not yet loaded
  if (!isLoaded || settings !== null) return null;

  const handleChange = (key: keyof AppSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTest = async () => {
    setTestStatus('loading');
    try {
      const credentials = btoa(`${form.gigachatClientId}:${form.gigachatClientSecret}`);
      const res = await fetch('/api/gigachat/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials, scope: form.gigachatScope }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('ok');
        setTestMessage('Подключение успешно!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Ошибка подключения');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Не удалось выполнить запрос');
    }
  };

  const handleSave = () => {
    if (!form.gigachatClientId || !form.gigachatClientSecret) return;
    saveSettings(form);
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-2xl">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">DocChat</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Document Assistant</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Добро пожаловать!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Для работы нужен API-ключ GigaChat (бесплатно — 1 млн токенов/год)
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-5 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-2">Как получить API-ключ:</p>
            <ol className="list-decimal ml-4 space-y-1 text-blue-700 dark:text-blue-300">
              <li>Перейти на developers.sber.ru</li>
              <li>Авторизоваться через Сбер ID</li>
              <li>Создать проект «GigaChat API»</li>
              <li>Скопировать Client ID и Client Secret</li>
            </ol>
          </div>

          {/* Client ID */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={form.gigachatClientId}
              onChange={(e) => handleChange('gigachatClientId', e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className={inputClass}
            />
          </div>

          {/* Client Secret */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.gigachatClientSecret}
                onChange={(e) => handleChange('gigachatClientSecret', e.target.value)}
                placeholder="Client Secret"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Scope */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тип аккаунта
            </label>
            <select
              value={form.gigachatScope}
              onChange={(e) => handleChange('gigachatScope', e.target.value)}
              className={inputClass}
            >
              <option value="GIGACHAT_API_PERS">GIGACHAT_API_PERS (физическое лицо)</option>
              <option value="GIGACHAT_API_B2B">GIGACHAT_API_B2B (юр. лицо)</option>
              <option value="GIGACHAT_API_CORP">GIGACHAT_API_CORP (корпоративный)</option>
            </select>
          </div>

          {/* Test + message */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleTest}
              disabled={testStatus === 'loading' || !form.gigachatClientId || !form.gigachatClientSecret}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {testStatus === 'loading' && <Spinner size="sm" />}
              Проверить
            </button>
            {testMessage && (
              <span className={`text-sm ${testStatus === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {testMessage}
              </span>
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!form.gigachatClientId || !form.gigachatClientSecret}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Сохранить и начать
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
            Ключ хранится только на вашем устройстве
          </p>
        </div>
      </div>
    </div>
  );
}
