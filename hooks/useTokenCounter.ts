"use client";

import { useState, useEffect, useCallback } from 'react';
import { TOKEN_USAGE_STORAGE_KEY } from '@/lib/constants';

interface TokenStats {
  totalUsed: number;
  totalCached: number;
}

export function useTokenCounter() {
  const [stats, setStats] = useState<TokenStats>({ totalUsed: 0, totalCached: 0 });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKEN_USAGE_STORAGE_KEY);
      if (stored) {
        setStats(JSON.parse(stored) as TokenStats); // eslint-disable-line react-hooks/set-state-in-effect
      }
    } catch {
      // ignore
    }
  }, []);

  const addTokens = useCallback((used: number, cached: number) => {
    setStats((prev) => {
      const next = {
        totalUsed: prev.totalUsed + used,
        totalCached: prev.totalCached + cached,
      };
      try {
        localStorage.setItem(TOKEN_USAGE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetStats = useCallback(() => {
    const empty: TokenStats = { totalUsed: 0, totalCached: 0 };
    setStats(empty);
    try {
      localStorage.removeItem(TOKEN_USAGE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { stats, addTokens, resetStats };
}
