"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AIChat from "@/components/AIChat";
import CodeEditor from "@/components/Editor";
import MeetStage from "@/components/MeetStage";
import SessionEndModal from "@/components/SessionEndModal";
import SessionMonitor from "@/components/SessionMonitor";

type SessionStatus = "waiting" | "active" | "ended";

type SessionData = {
  id: string;
  status: SessionStatus;
  created_by: string;
  partner_id?: string | null;
  partner?: {
    id: string;
    created_by: string;
    synthetic?: boolean;
    preferences?: {
      handle?: string;
      languages?: string[];
      goal?: string;
    };
  } | null;
  preferences?: {
    handle?: string;
    languages?: string[];
    goal?: string;
  };
  code?: {
    content: string;
    language: string;
    updated_at: string;
  } | null;
  created_at: string;
  matched_at?: string;
  ended_at?: string;
};

type RepoExport = {
  repoUrl: string;
  localPath: string;
  vscodeUri: string;
  commands: string[];
  commitHash: string;
};

export default function SessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params.id;
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoExport, setRepoExport] = useState<RepoExport | null>(null);
  const [notice, setNotice] = useState("");

  const handle = useMemo(() => {
    return sessionData?.preferences?.handle || sessionData?.created_by || "anonymous-dev";
  }, [sessionData?.created_by, sessionData?.preferences?.handle]);

  const fetchSessionData = useCallback(async () => {
    const response = await fetch(`/api/meeting/session?sessionId=${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error("Session not found");

    const data = (await response.json()) as { success?: boolean; session?: SessionData };
    if (!data.success || !data.session) throw new Error("Session not found");

    setSessionData(data.session);
    setIsWaiting(data.session.status === "waiting");

    if (data.session.code) {
      setCode((current) => current || data.session?.code?.content || "");
      setLanguage(data.session.code.language || "typescript");
    }
  }, [sessionId]);

  useEffect(() => {
    const waiting = new URLSearchParams(window.location.search).get("waiting") === "true";
    setIsWaiting(waiting);
    fetchSessionData()
      .catch(() => setNotice("This room no longer exists."))
      .finally(() => setHasLoaded(true));
  }, [fetchSessionData]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setNotice("Invite link copied.");
  };

  const exportRepo = async () => {
    setNotice("Preparing repo pack...");
    const response = await fetch("/api/git/repo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        code,
        commitMessage: `DevMegle checkpoint ${new Date().toLocaleString()}`,
      }),
    });

    const data = (await response.json()) as { success?: boolean; repo?: RepoExport; error?: string };
    if (!data.success || !data.repo) {
      setNotice(data.error || "Repo export failed.");
      return;
    }

    setRepoExport(data.repo);
    setNotice("Repo pack is ready.");
  };

  const handleEndSession = async () => {
    await fetch(`/api/meeting/session?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" });
    setIsModalOpen(true);
    setSessionData((current) => (current ? { ...current, status: "ended", ended_at: new Date().toISOString() } : current));
  };

  const handleNextDev = async () => {
    const response = await fetch("/api/meeting/next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId: handle }),
    });

    const data = (await response.json()) as { success?: boolean; matched?: boolean; session?: { id: string } };
    if (data.success && data.session) {
      router.push(`/session/${data.session.id}?waiting=${!data.matched}`);
      return;
    }

    router.push("/");
  };

  const handleReport = async () => {
    await fetch(`/api/meeting/session?sessionId=${encodeURIComponent(sessionId)}&reason=reported`, { method: "DELETE" });
    setNotice("Room reported and closed.");
    setIsModalOpen(true);
  };

  const handlePartnerMatched = () => {
    setIsWaiting(false);
    fetchSessionData().catch(() => undefined);
  };

  const handleSessionEnded = () => {
    setNotice("This room has ended.");
    setIsModalOpen(true);
  };

  const handleSessionWaiting = () => {
    setIsWaiting(true);
    fetchSessionData().catch(() => undefined);
  };

  const partnerName = sessionData?.partner?.preferences?.handle || sessionData?.partner?.created_by || "waiting";
  const partner = {
    id: sessionData?.partner?.id ?? sessionData?.partner_id ?? null,
    name: partnerName,
    synthetic: sessionData?.partner?.synthetic,
  };
  const startedAt = sessionData?.created_at ? new Date(sessionData.created_at).toLocaleTimeString() : "--";

  if (!hasLoaded && !sessionData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-50">
        <div className="max-w-md border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">DevMegle</p>
          <h1 className="mt-2 text-2xl font-bold">Opening room</h1>
          <p className="mt-2 text-zinc-400">Loading the room contract and shared code buffer.</p>
        </div>
      </main>
    );
  }

  if (notice === "This room no longer exists.") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-50">
        <div className="max-w-md border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-2xl font-bold">Room missing</h1>
          <p className="mt-2 text-zinc-400">The session was not found on this dev server.</p>
          <button onClick={() => router.push("/")} className="mt-5 rounded-md bg-emerald-400 px-4 py-2 font-bold text-zinc-950">
            Back to DevMegle
          </button>
        </div>
      </main>
    );
  }

  if (isWaiting) {
    return (
      <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
        <header className="border-b border-zinc-800 px-4 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">DevMegle</p>
              <h1 className="text-xl font-bold">Waiting for a developer</h1>
            </div>
            <button onClick={() => router.push("/")} className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
          </div>
        </header>

        <section className="mx-auto flex flex-1 max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 h-24 w-24 animate-pulse rounded-md bg-emerald-400 shadow-[8px_8px_0_#22d3ee]" />
          <h2 className="text-4xl font-black">Queue is live</h2>
          <p className="mt-3 max-w-xl text-zinc-400">
            Keep this tab open. The first compatible stranger lands in this room automatically.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={copyInvite} className="rounded-md bg-zinc-100 px-4 py-2 font-bold text-zinc-950">
              Copy invite
            </button>
            <button onClick={handleNextDev} className="rounded-md border border-zinc-700 px-4 py-2 font-bold text-zinc-100">
              Requeue
            </button>
          </div>
        </section>

        <SessionMonitor
          sessionId={sessionId}
          onPartnerMatched={handlePartnerMatched}
          onSessionEnded={handleSessionEnded}
          onWaiting={handleSessionWaiting}
        />
      </main>
    );
  }

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">DevMegle room</p>
            <h1 className="truncate text-xl font-bold">
              {handle} with {partnerName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={copyInvite} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">
              Invite
            </button>
            <button onClick={exportRepo} className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-zinc-950 hover:bg-cyan-200">
              Repo pack
            </button>
            <button onClick={handleNextDev} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-amber-400">
              Next dev
            </button>
            <button onClick={handleEndSession} className="rounded-md bg-red-500 px-3 py-2 text-sm font-bold text-white hover:bg-red-400">
              End
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200">
          {notice}
        </div>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <CodeEditor
          sessionId={sessionId}
          value={code}
          language={language}
          handle={handle}
          onChange={setCode}
          onLanguageChange={setLanguage}
        />

        <aside className="flex min-h-0 flex-col border-l border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-zinc-900 p-3">
                <p className="text-zinc-500">Status</p>
                <p className="font-semibold text-emerald-300">{sessionData?.status ?? "loading"}</p>
              </div>
              <div className="rounded-md bg-zinc-900 p-3">
                <p className="text-zinc-500">Started</p>
                <p className="font-semibold">{startedAt}</p>
              </div>
            </div>
            <button onClick={handleReport} className="mt-3 w-full rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-red-400">
              Report room
            </button>
          </div>

          <MeetStage sessionId={sessionId} selfName={handle} partner={partner} onNotice={setNotice} />

          {repoExport && (
            <div className="border-b border-zinc-800 bg-zinc-900 p-4 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-zinc-100">Repo pack</p>
                <a href={repoExport.vscodeUri} className="text-cyan-300 hover:text-cyan-200">
                  VS Code
                </a>
              </div>
              <p className="break-all text-zinc-400">{repoExport.localPath}</p>
              <a href={repoExport.repoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-emerald-300 hover:text-emerald-200">
                Open GitHub initializer
              </a>
            </div>
          )}

          <AIChat sessionId={sessionId} handle={handle} code={code} />
        </aside>
      </div>

      <SessionEndModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionId={sessionId}
        partner={{
          linkedin_handle: partnerName,
          github_handle: partnerName,
          slack_handle: partnerName,
          instagram_handle: partnerName,
        }}
        codeSnippet={code.split("\n").slice(-24).join("\n")}
      />

      <SessionMonitor
        sessionId={sessionId}
        onPartnerMatched={handlePartnerMatched}
        onSessionEnded={handleSessionEnded}
        onWaiting={handleSessionWaiting}
      />
    </main>
  );
}
