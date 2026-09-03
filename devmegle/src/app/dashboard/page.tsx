"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { getBrowserId } from "@/lib/browser-identity";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = async (matchMode: "human" | "forge") => {
    setIsLoading(true);
    try {
      const handle = user?.email?.split("@")[0] || window.localStorage.getItem("devmegle:handle") || "anonymous-dev";
      const response = await fetch("/api/meeting/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getBrowserId(),
          preferences: {
            handle,
            accountId: user?.id,
            languages: ["typescript", "react"],
            experience: "builder",
            goal: "Ship a useful prototype",
            matchMode,
          },
        }),
      });

      const data = (await response.json()) as { success?: boolean; matched?: boolean; session?: { id: string } };
      if (data.success && data.session) {
        router.push(`/session/${data.session.id}?waiting=${!data.matched}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">operator desk</p>
            <h1 className="mt-3 text-4xl font-black">Welcome, {user?.email?.split("@")[0] || "developer"}</h1>
            <p className="mt-4 text-zinc-600">Your next room starts from the same zero-config engine as the public match console.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                disabled={isLoading}
                onClick={() => createRoom("human")}
                className="rounded-md bg-emerald-400 px-4 py-3 font-bold text-zinc-950 disabled:opacity-60"
              >
                Human match
              </button>
              <button
                disabled={isLoading}
                onClick={() => createRoom("forge")}
                className="rounded-md border border-zinc-300 px-4 py-3 font-bold text-zinc-900 disabled:opacity-60"
              >
                Forge room
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Match", "Queue with stack and mission filters."],
              ["Build", "Share code, room chat, and AI review."],
              ["Export", "Open a VS Code and GitHub-ready repo pack."],
            ].map(([title, body]) => (
              <article key={title} className="border-l-4 border-zinc-950 bg-white p-5">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
