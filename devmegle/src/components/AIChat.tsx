"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

interface AIChatProps {
  sessionId: string;
  handle: string;
  code: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  sender: string;
  content: string;
  created_at: string;
}

export default function AIChat({ sessionId, handle, code }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const response = await fetch(`/api/meeting/message?sessionId=${encodeURIComponent(sessionId)}`);
    if (!response.ok) return;

    const data = (await response.json()) as { success?: boolean; messages?: ChatMessage[] };
    if (data.success && data.messages) setMessages(data.messages);
  }, [sessionId]);

  useEffect(() => {
    loadMessages().catch(() => undefined);
    const interval = window.setInterval(() => {
      loadMessages().catch(() => undefined);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (message: string, type: "user" | "suggest" | "explain" = "user") => {
    if (!message.trim() && type === "user") return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/meeting/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sender: handle,
          content: message || (type === "suggest" ? "Suggest improvements" : "Explain this code"),
          type,
          code,
        }),
      });

      const data = (await response.json()) as { messages?: ChatMessage[] };
      if (data.messages) {
        setMessages(data.messages);
      } else {
        await loadMessages();
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `local_error_${Date.now()}`,
          type: "system",
          sender: "DevMegle",
          content: "Message failed to send. Your room is still open.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextMessage = inputMessage.trim();
    if (!nextMessage) return;

    setInputMessage("");
    sendMessage(nextMessage).catch(() => undefined);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Room Chat</p>
        <h2 className="text-lg font-semibold text-zinc-50">Human plus Ada</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-400">
            Ask your partner a question, or type <span className="text-zinc-200">@ada</span> to bring in the AI pair engineer.
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={`rounded-md border p-3 ${
              message.type === "user"
                ? "border-emerald-800 bg-emerald-950/50"
                : message.type === "ai"
                  ? "border-cyan-800 bg-cyan-950/40"
                  : "border-zinc-800 bg-zinc-900"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-100">{message.sender}</span>
              <time className="text-xs text-zinc-500">{new Date(message.created_at).toLocaleTimeString()}</time>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.content}</p>
          </article>
        ))}

        {isLoading && (
          <div className="rounded-md border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-100">
            Ada is thinking through the next move...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-zinc-800 p-4">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => sendMessage("", "suggest").catch(() => undefined)}
            disabled={isLoading}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:border-emerald-400 disabled:opacity-50"
          >
            Suggest next
          </button>
          <button
            type="button"
            onClick={() => sendMessage("", "explain").catch(() => undefined)}
            disabled={isLoading}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:border-cyan-400 disabled:opacity-50"
          >
            Explain code
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            placeholder="Message or @ada..."
            className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 outline-none transition focus:border-emerald-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
