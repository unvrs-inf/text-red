"use client";

import { useState, useCallback } from 'react';

interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useTextSelection() {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 1) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setSelectionRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    } else {
      setSelectedText(null);
      setSelectionRect(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedText(null);
    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const setSelectionForChat = useCallback((): string | null => {
    const text = selectedText;
    clearSelection();
    return text;
  }, [selectedText, clearSelection]);

  return { selectedText, selectionRect, handleMouseUp, clearSelection, setSelectionForChat };
}
