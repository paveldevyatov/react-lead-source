"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const DEFAULT_STORAGE_KEY = "lead-source";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const AD_CLICK_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
  "msclkid",
  "ttclid",
  "li_fat_id",
  "twclid",
] as const;

export interface LeadSourceData {
  // UTM
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  // Ad click IDs
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  li_fat_id?: string;
  twclid?: string;
  // Referrer & page
  referrer?: string;
  page?: string;
  // Device & context
  language?: string;
  timezone?: string;
  screen_width?: number;
  screen_height?: number;
  user_agent?: string;
  // Timestamp
  landed_at?: string;
}

export interface LeadSourceProps {
  storageKey?: string;
  overwrite?: boolean;
  utm?: boolean;
  adClickIds?: boolean;
  referrer?: boolean;
  device?: boolean;
  page?: boolean;
  timestamp?: boolean;
}

type CaptureOptions = Required<
  Omit<LeadSourceProps, "storageKey" | "overwrite">
>;

const DEFAULTS: CaptureOptions = {
  utm: true,
  adClickIds: true,
  referrer: true,
  device: true,
  page: true,
  timestamp: true,
};

function sanitize(value: string, maxLen = 500): string {
  return value.replace(/<[^>]*>/g, "").slice(0, maxLen);
}

function capture(options: CaptureOptions): LeadSourceData {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const data: LeadSourceData = {};

  if (options.utm) {
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) data[key] = sanitize(value);
    }
  }

  if (options.adClickIds) {
    for (const key of AD_CLICK_KEYS) {
      const value = params.get(key);
      if (value) data[key] = sanitize(value);
    }
  }

  if (options.referrer && document.referrer) {
    data.referrer = document.referrer;
  }

  if (options.page) {
    data.page = window.location.pathname;
  }

  if (options.device) {
    data.language = navigator.language;
    data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    data.screen_width = window.screen.width;
    data.screen_height = window.screen.height;
    data.user_agent = navigator.userAgent;
  }

  if (options.timestamp) {
    data.landed_at = new Date().toISOString();
  }

  return data;
}

function safeParse(raw: string, storageKey: string): LeadSourceData | null {
  try {
    return JSON.parse(raw) as LeadSourceData;
  } catch {
    localStorage.removeItem(storageKey);
    snapshotCache.delete(storageKey);
    return null;
  }
}

// --- Reactive store for useSyncExternalStore ---
let listeners: Array<() => void> = [];
const snapshotCache = new Map<string, string | null>();

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notify() {
  snapshotCache.clear();
  listeners.forEach((l) => l());
}

function getSnapshot(storageKey: string): string | null {
  if (!snapshotCache.has(storageKey)) {
    snapshotCache.set(storageKey, localStorage.getItem(storageKey));
  }
  return snapshotCache.get(storageKey) ?? null;
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Drop into your layout — captures lead source data on mount.
 * Renders nothing. Only saves on the first visit (unless overwrite is true).
 */
export function LeadSource(props: LeadSourceProps = {}) {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    overwrite = false,
    ...rest
  } = props;
  const options = { ...DEFAULTS, ...rest };

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;
  const overwriteRef = useRef(overwrite);
  overwriteRef.current = overwrite;

  useEffect(() => {
    const key = storageKeyRef.current;
    if (!overwriteRef.current && localStorage.getItem(key)) return;
    try {
      localStorage.setItem(key, JSON.stringify(capture(optionsRef.current)));
      notify();
    } catch {
      // localStorage quota exceeded — silently skip
    }
  }, []);

  return null;
}

/**
 * React hook — returns the saved lead source reactively.
 */
export function useLeadSource(
  storageKey = DEFAULT_STORAGE_KEY,
): LeadSourceData | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => getSnapshot(storageKey),
    getServerSnapshot,
  );
  return raw ? safeParse(raw, storageKey) : null;
}

/**
 * Returns the saved lead source. Works outside React components.
 */
export function getLeadSource(
  storageKey = DEFAULT_STORAGE_KEY,
): LeadSourceData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  return safeParse(raw, storageKey);
}

/**
 * Removes saved lead source data from localStorage.
 */
export function clearLeadSource(
  storageKey = DEFAULT_STORAGE_KEY,
): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
  notify();
}
