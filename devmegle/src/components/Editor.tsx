"use client";

import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface CodeEditorProps {
  sessionId: string;
  value: string;
  language: string;
  handle: string;
  onChange: (value: string) => void;
  onLanguageChange: (language: string) => void;
}

const LANGUAGE_OPTIONS = ["typescript", "javascript", "python", "go", "rust", "sql"];

export default function CodeEditor({
  sessionId,
  value,
  language,
  handle,
  onChange,
  onLanguageChange,
}: CodeEditorProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastRemoteUpdateRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  const loadRemoteCode = useCallback(async () => {
    const response = await fetch(`/api/meeting/code?sessionId=${encodeURIComponent(sessionId)}`);
    if (!response.ok) return;

    const data = (await response.json()) as {
      success?: boolean;
      code?: { content: string; language: string; updated_at: string };
    };

    if (!data.success || !data.code) return;
    if (data.code.updated_at === lastRemoteUpdateRef.current) return;

    lastRemoteUpdateRef.current = data.code.updated_at;
    if (data.code.content !== value) onChange(data.code.content);
    if (data.code.language !== language) onLanguageChange(data.code.language);
  }, [language, onChange, onLanguageChange, sessionId, value]);

  useEffect(() => {
    loadRemoteCode().catch(() => undefined);
    const interval = window.setInterval(() => {
      loadRemoteCode().catch(() => undefined);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [loadRemoteCode]);

  useEffect(() => {
    if (!sessionId) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    setSaveState("saving");
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/meeting/code", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            content: value,
            language,
            updatedBy: handle,
          }),
        });

        setSaveState(response.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 450);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [handle, language, sessionId, value]);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Shared Buffer</p>
          <h2 className="text-lg font-semibold text-zinc-50">Pair canvas</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-emerald-400"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              saveState === "error"
                ? "bg-red-950 text-red-200"
                : saveState === "saving"
                  ? "bg-amber-950 text-amber-200"
                  : "bg-emerald-950 text-emerald-200"
            }`}
          >
            {saveState === "saving" ? "Saving" : saveState === "error" ? "Offline" : "Synced"}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(nextValue) => onChange(nextValue ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "var(--font-code)",
            padding: { top: 18, bottom: 18 },
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>
    </section>
  );
}
