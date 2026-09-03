"use client";

import SocialConnectors from "./SocialConnectors";
import StackOverflowHelper from "./StackOverflowHelper";

interface SessionEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  partner: {
    linkedin_handle?: string;
    slack_handle?: string;
    github_handle?: string;
    instagram_handle?: string;
  };
  codeSnippet: string;
}

export default function SessionEndModal({ isOpen, onClose, sessionId, partner, codeSnippet }: SessionEndModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 p-5 text-zinc-50 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">session closed</p>
            <h2 className="text-2xl font-bold">Keep the useful bits</h2>
          </div>
          <button onClick={onClose} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-zinc-400">
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SocialConnectors sessionId={sessionId} partner={partner} />
          <StackOverflowHelper codeSnippet={codeSnippet} />
        </div>
      </div>
    </div>
  );
}
