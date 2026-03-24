"use client";

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { useSettings } from '@/hooks/useSettings';
import { useTokenCounter } from '@/hooks/useTokenCounter';
import { AppSettings } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, saveSettings, clearSettings, getDefaultSettings } = useSettings();
  const { stats, resetStats } = useTokenCounter();
  const [form, setForm] = useState<AppSettings>(settings || getDefaultSettings());
  const [showSecret, setShowSecret] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(settings || getDefaultSettings());
      setTestStatus('idle');
      setConfirmReset(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings]);

  const handleChange = (key: keyof AppSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(form);
    onClose();
  };

  const handleTest = async () => {
    setTestStatus('loading');
    setTestMessage('');
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

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    clearSettings();
    resetStats();
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Настройки GigaChat">
      <div className="flex flex-col gap-4">
        {/* Client ID */}
        <div>
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
        <div>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scope (тип аккаунта)
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

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Модель
          </label>
          <select
            value={form.gigachatModel}
            onChange={(e) => handleChange('gigachatModel', e.target.value)}
            className={inputClass}
          >
            <option value="GigaChat-2">GigaChat-2 (базовая)</option>
            <option value="GigaChat-2-Pro">GigaChat-2-Pro (улучшенная)</option>
            <option value="GigaChat-2-Max">GigaChat-2-Max (максимальная)</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Тема оформления
          </label>
          <select
            value={form.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            className={inputClass}
          >
            <option value="system">Системная</option>
            <option value="light">Светлая</option>
            <option value="dark">Тёмная</option>
          </select>
        </div>

        {/* Token stats */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
          <p>Использовано токенов за всё время: <strong>{stats.totalUsed.toLocaleString('ru-RU')}</strong></p>
          <p className="text-xs mt-0.5">Сэкономлено (кэш): {stats.totalCached.toLocaleString('ru-RU')}</p>
        </div>

        {/* Test connection */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testStatus === 'loading' || !form.gigachatClientId || !form.gigachatClientSecret}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            {testStatus === 'loading' && <Spinner size="sm" />}
            Проверить подключение
          </button>
          {testMessage && (
            <span
              className={`text-sm ${testStatus === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {testMessage}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className={`text-sm px-3 py-2 rounded-lg ${
              confirmReset
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            } transition-colors`}
          >
            {confirmReset ? 'Подтвердить сброс' : 'Сбросить настройки'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ключ хранится только на вашем устройстве и передаётся только серверам GigaChat (Сбер).
        </p>
      </div>
    </Modal>
  );
}
