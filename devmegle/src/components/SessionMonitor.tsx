"use client";

import { useEffect, useRef } from "react";

interface SessionMonitorProps {
  sessionId: string;
  onPartnerMatched: (partnerData: { partnerId: string; matchedAt?: string }) => void;
  onSessionEnded: () => void;
  onWaiting?: () => void;
}

export default function SessionMonitor({ sessionId, onPartnerMatched, onSessionEnded, onWaiting }: SessionMonitorProps) {
  const lastStatusRef = useRef<string>("");

  useEffect(() => {
    if (!sessionId) return;

    let active = true;

    async function poll() {
      try {
        const response = await fetch(`/api/meeting/session?sessionId=${encodeURIComponent(sessionId)}`);
        if (!response.ok) return;

        const data = (await response.json()) as {
          success?: boolean;
          session?: { status: string; partner_id?: string | null; matched_at?: string };
        };

        if (!active || !data.success || !data.session) return;
        const statusKey = `${data.session.status}:${data.session.partner_id ?? ""}`;
        if (statusKey === lastStatusRef.current) return;
        lastStatusRef.current = statusKey;

        if (data.session.status === "active" && data.session.partner_id) {
          onPartnerMatched({
            partnerId: data.session.partner_id,
            matchedAt: data.session.matched_at,
          });
        }

        if (data.session.status === "waiting") {
          onWaiting?.();
        }

        if (data.session.status === "ended") {
          onSessionEnded();
        }
      } catch {
        return;
      }
    }

    poll();
    const interval = window.setInterval(poll, 2500);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [onPartnerMatched, onSessionEnded, onWaiting, sessionId]);

  return null;
}
