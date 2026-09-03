"use client";

import { useState } from "react";

interface StackOverflowHelperProps {
  codeSnippet: string;
}

export default function StackOverflowHelper({ codeSnippet }: StackOverflowHelperProps) {
  const [question, setQuestion] = useState("");

  const search = () => {
    const query = encodeURIComponent(`${question || "debug this code"} ${codeSnippet.slice(0, 600)}`);
    window.open(`https://stackoverflow.com/search?q=${query}`, "_blank", "noopener,noreferrer");
  };

  const copySnippet = async () => {
    await navigator.clipboard.writeText(codeSnippet);
  };

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="font-bold text-zinc-50">Debug trail</h3>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        className="mt-3 min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-50 outline-none focus:border-emerald-400"
        placeholder="Question about the last snippet"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={copySnippet} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100">
          Copy code
        </button>
        <button onClick={search} className="rounded-md bg-amber-300 px-3 py-2 text-sm font-bold text-zinc-950">
          Search
        </button>
      </div>
    </section>
  );
}
