"use client";

import { create } from "zustand";

/**
 * Global data cache for instant page navigation.
 * Data is cached in memory after first fetch.
 * On subsequent visits, cached data is shown immediately
 * while a background refresh happens silently.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface DataCacheState {
  cache: Record<string, CacheEntry>;
  set: (key: string, data: any) => void;
  get: (key: string, maxAgeMs?: number) => any | null;
  invalidate: (key: string) => void;
  invalidatePrefix: (prefix: string) => void;
}

const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export const useDataCache = create<DataCacheState>((set, get) => ({
  cache: {},

  set: (key: string, data: any) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, timestamp: Date.now() },
      },
    }));
  },

  get: (key: string, maxAgeMs = DEFAULT_MAX_AGE) => {
    const entry = get().cache[key];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > maxAgeMs) return null;
    return entry.data;
  },

  invalidate: (key: string) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[key];
      return { cache: newCache };
    });
  },

  invalidatePrefix: (prefix: string) => {
    set((state) => {
      const newCache: Record<string, CacheEntry> = {};
      Object.entries(state.cache).forEach(([k, v]) => {
        if (!k.startsWith(prefix)) newCache[k] = v;
      });
      return { cache: newCache };
    });
  },
}));
