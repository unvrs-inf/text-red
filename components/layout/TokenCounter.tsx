"use client";

import { useTokenCounter } from '@/hooks/useTokenCounter';

export default function TokenCounter() {
  const { stats } = useTokenCounter();

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
      <span>{stats.totalUsed.toLocaleString('ru-RU')} токенов</span>
    </div>
  );
}
