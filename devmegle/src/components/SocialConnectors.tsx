"use client";

interface SocialConnectorsProps {
  sessionId: string;
  partner: {
    linkedin_handle?: string;
    slack_handle?: string;
    github_handle?: string;
    instagram_handle?: string;
  };
}

function safeHandle(value?: string) {
  return (value || "anonymous-dev").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "anonymous-dev";
}

export default function SocialConnectors({ sessionId, partner }: SocialConnectorsProps) {
  const logConnection = async (connector: string) => {
    await fetch("/api/logConnection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        fromUser: "current-room-user",
        toUser: safeHandle(partner.github_handle || partner.linkedin_handle),
        connector,
      }),
    });
  };

  const openProfile = (connector: "linkedin" | "github" | "instagram") => {
    const handle = safeHandle(
      connector === "linkedin"
        ? partner.linkedin_handle
        : connector === "github"
          ? partner.github_handle
          : partner.instagram_handle
    );
    const url =
      connector === "linkedin"
        ? `https://www.linkedin.com/in/${handle}`
        : connector === "github"
          ? `https://github.com/${handle}`
          : `https://www.instagram.com/${handle}`;

    window.open(url, "_blank", "noopener,noreferrer");
    logConnection(connector).catch(() => undefined);
  };

  const copySlack = async () => {
    await navigator.clipboard.writeText(safeHandle(partner.slack_handle));
    await logConnection("slack");
  };

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="font-bold text-zinc-50">Reconnect</h3>
      <div className="mt-3 grid gap-2">
        <button onClick={() => openProfile("github")} className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-950">
          GitHub
        </button>
        <button onClick={() => openProfile("linkedin")} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100">
          LinkedIn
        </button>
        <button onClick={copySlack} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100">
          Copy Slack
        </button>
        <button onClick={() => openProfile("instagram")} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100">
          Instagram
        </button>
      </div>
    </section>
  );
}
