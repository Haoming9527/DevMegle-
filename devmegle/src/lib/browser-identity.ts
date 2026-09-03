"use client";

const BROWSER_ID_KEY = "devmegle:client-id";

export function getBrowserId() {
  const existing = window.sessionStorage.getItem(BROWSER_ID_KEY);
  if (existing) return existing;

  const id =
    typeof window.crypto?.randomUUID === "function"
      ? `browser_${window.crypto.randomUUID()}`
      : `browser_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(BROWSER_ID_KEY, id);
  return id;
}
