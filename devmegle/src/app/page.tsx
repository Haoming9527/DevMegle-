"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBrowserId } from "@/lib/browser-identity";
import { useAuth } from "@/lib/auth";

type MatchMode = "human" | "forge";

type Stats = {
  waiting: number;
  active: number;
  ended: number;
  rooms: number;
};

const LANGUAGES = ["typescript", "python", "go", "rust", "sql", "react"];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [handle, setHandle] = useState("");
  const [goal, setGoal] = useState("Ship a prototype in 30 minutes");
  const [languages, setLanguages] = useState<string[]>(["typescript", "react"]);
  const [mode, setMode] = useState<MatchMode>("human");
  const [isPairing, setIsPairing] = useState(false);
  const [stats, setStats] = useState<Stats>({ waiting: 0, active: 0, ended: 0, rooms: 0 });

  useEffect(() => {
    const savedHandle = window.localStorage.getItem("devmegle:handle");
    if (savedHandle) setHandle(savedHandle);

    async function loadStats() {
      const response = await fetch("/api/meeting/stats");
      if (!response.ok) return;
      const data = (await response.json()) as { stats?: Stats };
      if (data.stats) setStats(data.stats);
    }

    loadStats().catch(() => undefined);
    const interval = window.setInterval(() => loadStats().catch(() => undefined), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedHandle = useMemo(() => {
    return (handle.trim() || user?.email?.split("@")[0] || "anonymous-dev").slice(0, 40);
  }, [handle, user?.email]);

  const toggleLanguage = (language: string) => {
    setLanguages((current) => {
      if (current.includes(language)) return current.filter((item) => item !== language);
      return [...current, language].slice(0, 5);
    });
  };

  const startPairing = async (matchMode: MatchMode) => {
    setIsPairing(true);
    const handleInput = document.getElementById("devmegle-handle") as HTMLInputElement | null;
    const liveHandle = (handleInput?.value.trim() || selectedHandle).slice(0, 40);
    window.localStorage.setItem("devmegle:handle", liveHandle);

    try {
      const response = await fetch("/api/meeting/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getBrowserId(),
          preferences: {
            handle: liveHandle,
            accountId: user?.id,
            languages: languages.length ? languages : ["typescript"],
            experience: "builder",
            goal,
            matchMode,
          },
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        matched?: boolean;
        session?: { id: string };
        error?: string;
      };

      if (!data.success || !data.session) {
        throw new Error(data.error || "Pairing failed");
      }

      router.push(`/session/${data.session.id}?waiting=${!data.matched}`);
    } catch (error) {
      console.error("Pairing error:", error);
      setIsPairing(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      <header className="border-b border-zinc-300 bg-stone-100/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 font-mono text-sm font-bold text-emerald-300">
              dm
            </div>
            <div>
              <p className="text-xl font-bold">DevMegle</p>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">stranger pair rooms</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-white">
              Dashboard
            </Link>
            {user ? (
              <span className="hidden rounded-md bg-white px-3 py-2 text-zinc-600 sm:inline">{user.email}</span>
            ) : (
              <Link href="/auth/signin" className="rounded-md bg-zinc-950 px-3 py-2 font-semibold text-white">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">developer roulette</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
            DevMegle
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
            Drop into a live coding room, share one buffer, ask Ada for backup, and export the result as a GitHub-ready repo pack.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="border-l-4 border-emerald-500 bg-white p-4">
              <p className="text-3xl font-black">{stats.waiting}</p>
              <p className="text-sm text-zinc-500">waiting</p>
            </div>
            <div className="border-l-4 border-cyan-500 bg-white p-4">
              <p className="text-3xl font-black">{stats.active}</p>
              <p className="text-sm text-zinc-500">active</p>
            </div>
            <div className="border-l-4 border-amber-500 bg-white p-4">
              <p className="text-3xl font-black">{stats.rooms}</p>
              <p className="text-sm text-zinc-500">rooms</p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <form
            className="w-full border border-zinc-300 bg-white p-5 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              startPairing(mode).catch(() => setIsPairing(false));
            }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">launch room</p>
                <h2 className="text-2xl font-bold">Match console</h2>
              </div>
              <div className="rounded-md bg-zinc-950 px-3 py-2 font-mono text-xs text-emerald-300">live</div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-zinc-700">Handle</span>
              <input
                id="devmegle-handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="anonymous-dev"
                className="mt-2 w-full rounded-md border border-zinc-300 bg-stone-50 px-3 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-zinc-700">Mission</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="mt-2 w-full rounded-md border border-zinc-300 bg-stone-50 px-3 py-3 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <div className="mt-5">
              <p className="text-sm font-semibold text-zinc-700">Stack</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGES.map((language) => {
                  const selected = languages.includes(language);
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-zinc-950 bg-zinc-950 text-white"
                          : "border-zinc-300 bg-stone-50 text-zinc-700 hover:border-emerald-500"
                      }`}
                    >
                      {language}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setMode("human")}
                className={`rounded px-3 py-2 text-sm font-semibold ${mode === "human" ? "bg-white shadow-sm" : "text-zinc-600"}`}
              >
                Human
              </button>
              <button
                type="button"
                onClick={() => setMode("forge")}
                className={`rounded px-3 py-2 text-sm font-semibold ${mode === "forge" ? "bg-white shadow-sm" : "text-zinc-600"}`}
              >
                Forge
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isPairing}
                className="rounded-md bg-emerald-400 px-5 py-3 font-bold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPairing ? "Pairing..." : mode === "human" ? "Find a dev" : "Start forge"}
              </button>
              <button
                type="button"
                onClick={() => startPairing("forge").catch(() => setIsPairing(false))}
                disabled={isPairing}
                className="rounded-md border border-zinc-300 px-5 py-3 font-bold text-zinc-800 transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ada room
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
