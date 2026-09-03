"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Partner = {
  id?: string | null;
  name: string;
  synthetic?: boolean;
};

type Signal = {
  id: string;
  sender_session_id: string;
  type: "offer" | "answer" | "ice" | "presence";
  payload: unknown;
  created_at: string;
};

type PipBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MeetStageProps = {
  sessionId: string;
  selfName: string;
  partner: Partner;
  onNotice: (message: string) => void;
};

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
const MIN_PIP_WIDTH = 160;
const MAX_PIP_WIDTH = 420;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function streamToBase64(stream: MediaStream) {
  const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => chunks.push(event.data);
  recorder.start();
  await new Promise((resolve) => window.setTimeout(resolve, 2500));
  recorder.stop();
  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  const buffer = await new Blob(chunks, { type: "audio/webm" }).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

export default function MeetStage({ sessionId, selfName, partner, onNotice }: MeetStageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | "idle" | "waiting">("idle");
  const [pipBox, setPipBox] = useState<PipBox>({ x: 24, y: 88, width: 240, height: 144 });
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const offerSentRef = useRef(false);
  const seenSignalsRef = useRef<Set<string>>(new Set());
  const dragRef = useRef<{ mode: "move" | "resize"; startX: number; startY: number; box: PipBox } | null>(null);

  const partnerSessionId = partner.synthetic ? null : partner.id ?? null;
  const canCallPeer = Boolean(partnerSessionId);
  const shouldCreateOffer = useMemo(() => {
    if (!partnerSessionId) return false;
    return sessionId.localeCompare(partnerSessionId) > 0;
  }, [partnerSessionId, sessionId]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
  }, [isExpanded, isCameraOn]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [isExpanded, remoteStream]);

  const postSignal = useCallback(
    async (type: Signal["type"], payload: unknown) => {
      await fetch("/api/meeting/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          senderSessionId: sessionId,
          type,
          payload,
        }),
      });
    },
    [sessionId]
  );

  const ensurePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = peerConnection;
    setConnectionState("waiting");

    peerConnection.onconnectionstatechange = () => {
      setConnectionState(peerConnection.connectionState);
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      postSignal("ice", event.candidate.toJSON()).catch(() => undefined);
    };

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0] ?? null);
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current as MediaStream);
    });

    return peerConnection;
  }, [postSignal]);

  const createOfferIfNeeded = useCallback(async () => {
    if (!canCallPeer || !shouldCreateOffer || offerSentRef.current || !localStreamRef.current) return;
    const peerConnection = ensurePeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    offerSentRef.current = true;
    await postSignal("offer", offer);
  }, [canCallPeer, ensurePeerConnection, postSignal, shouldCreateOffer]);

  const stopCamera = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    offerSentRef.current = false;
    setRemoteStream(null);
    setIsCameraOn(false);
    setConnectionState("idle");
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsCameraOn(true);

      if (canCallPeer) {
        const peerConnection = ensurePeerConnection();
        const existingTracks = new Set(peerConnection.getSenders().map((sender) => sender.track).filter(Boolean));
        stream.getTracks().forEach((track) => {
          if (!existingTracks.has(track)) peerConnection.addTrack(track, stream);
        });
        await postSignal("presence", { camera: true, mic: isMicOn });
        await createOfferIfNeeded();
      }
    } catch {
      onNotice("Camera or microphone permission was blocked.");
    }
  }, [canCallPeer, createOfferIfNeeded, ensurePeerConnection, isMicOn, onNotice, postSignal]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      stopCamera();
      return;
    }
    await startCamera();
  };

  const toggleMic = () => {
    setIsMicOn((current) => {
      const next = !current;
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
      postSignal("presence", { camera: isCameraOn, mic: next }).catch(() => undefined);
      return next;
    });
  };

  const sendVoiceNote = async () => {
    if (!localStreamRef.current) {
      onNotice("Start camera and mic before sending a voice note.");
      return;
    }

    try {
      const audioBase64 = await streamToBase64(localStreamRef.current);
      const response = await fetch("/api/meeting/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, sender: selfName, audioBase64 }),
      });
      const data = (await response.json()) as { transcript?: string };
      onNotice(data.transcript || (response.ok ? "Voice note sent." : "Voice note failed."));
    } catch {
      onNotice("Voice note failed.");
    }
  };

  const processSignal = useCallback(
    async (signal: Signal) => {
      if (seenSignalsRef.current.has(signal.id)) return;
      seenSignalsRef.current.add(signal.id);
      if (signal.sender_session_id === sessionId) return;

      const peerConnection = ensurePeerConnection();

      if (signal.type === "offer") {
        if (!isRecord(signal.payload)) return;
        await peerConnection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await postSignal("answer", answer);
      }

      if (signal.type === "answer") {
        if (!isRecord(signal.payload)) return;
        if (peerConnection.signalingState !== "stable") {
          await peerConnection.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        }
      }

      if (signal.type === "ice") {
        if (!isRecord(signal.payload)) return;
        try {
          await peerConnection.addIceCandidate(signal.payload as RTCIceCandidateInit);
        } catch {
          return;
        }
      }
    },
    [ensurePeerConnection, postSignal, sessionId]
  );

  useEffect(() => {
    if (!canCallPeer) return;

    let active = true;

    async function pollSignals() {
      try {
        const response = await fetch(
          `/api/meeting/signal?sessionId=${encodeURIComponent(sessionId)}&excludeSender=${encodeURIComponent(sessionId)}`
        );
        if (!response.ok) return;
        const data = (await response.json()) as { success?: boolean; signals?: Signal[] };
        if (!active || !data.success || !data.signals) return;
        for (const signal of data.signals) {
          await processSignal(signal);
        }
      } catch {
        return;
      }
    }

    pollSignals();
    const interval = window.setInterval(pollSignals, 1200);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [canCallPeer, processSignal, sessionId]);

  useEffect(() => {
    createOfferIfNeeded().catch(() => undefined);
  }, [createOfferIfNeeded, isCameraOn]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (drag.mode === "resize") {
        const width = Math.min(MAX_PIP_WIDTH, Math.max(MIN_PIP_WIDTH, drag.box.width + deltaX));
        setPipBox({
          ...drag.box,
          width,
          height: Math.round(width * 0.6),
        });
        return;
      }

      setPipBox({
        ...drag.box,
        x: Math.max(12, Math.min(window.innerWidth - drag.box.width - 12, drag.box.x + deltaX)),
        y: Math.max(76, Math.min(window.innerHeight - drag.box.height - 24, drag.box.y + deltaY)),
      });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const connectionLabel = canCallPeer
    ? connectionState === "connected"
      ? "connected"
      : connectionState === "failed" || connectionState === "disconnected"
        ? "reconnecting"
        : "waiting"
    : "solo";

  const remoteTile = (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900">
      <video ref={remoteVideoRef} className="h-full w-full object-cover" autoPlay playsInline />
      {!remoteStream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-300 text-3xl font-black text-zinc-950">
            {partner.name.slice(0, 1).toUpperCase()}
          </div>
          <p className="mt-4 text-xl font-bold text-zinc-50">{partner.name}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {partner.synthetic ? "Ada is in chat mode" : isCameraOn ? "Waiting for their camera" : "Start your camera to connect"}
          </p>
        </div>
      )}
      <div className="absolute left-4 top-4 rounded-md bg-black/60 px-3 py-1 text-sm font-semibold text-zinc-50">
        {partner.name}
      </div>
    </div>
  );

  const localTile = (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-zinc-700 bg-black shadow-2xl">
      <video ref={localVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
      {!isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-300 text-xl font-black text-zinc-950">
            {selfName.slice(0, 1).toUpperCase()}
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-200">Camera off</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">You</div>
      {isExpanded && (
        <button
          type="button"
          aria-label="Resize self view"
          onPointerDown={(event) => {
            dragRef.current = { mode: "resize", startX: event.clientX, startY: event.clientY, box: pipBox };
          }}
          className="absolute bottom-1 right-1 h-6 w-6 rounded border border-white/30 bg-white/20"
        />
      )}
    </div>
  );

  if (isExpanded) {
    return (
      <section className="fixed inset-0 z-40 flex flex-col bg-zinc-950 text-zinc-50">
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">DevMegle Meet</p>
            <h2 className="text-lg font-bold">{selfName} with {partner.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">{connectionLabel}</span>
            <button onClick={() => setIsExpanded(false)} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold">
              Collapse
            </button>
          </div>
        </header>
        <div className="relative min-h-0 flex-1 p-4">
          {remoteTile}
          <div
            className="absolute touch-none"
            style={{ left: pipBox.x, top: pipBox.y, width: pipBox.width, height: pipBox.height }}
            onPointerDown={(event) => {
              const target = event.target as HTMLElement;
              if (target.getAttribute("aria-label") === "Resize self view") return;
              dragRef.current = { mode: "move", startX: event.clientX, startY: event.clientY, box: pipBox };
            }}
          >
            {localTile}
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-center gap-3 border-t border-zinc-800 px-4 py-4">
          <button onClick={toggleMic} className="rounded-full bg-zinc-800 px-5 py-3 text-sm font-bold">
            {isMicOn ? "Mute" : "Unmute"}
          </button>
          <button onClick={toggleCamera} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-bold text-zinc-950">
            {isCameraOn ? "Stop camera" : "Start camera"}
          </button>
          <button onClick={sendVoiceNote} className="rounded-full bg-zinc-800 px-5 py-3 text-sm font-bold">
            Voice note
          </button>
        </footer>
      </section>
    );
  }

  return (
    <section className="border-b border-zinc-800 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Meet</p>
          <h2 className="text-lg font-semibold text-zinc-50">{partner.name}</h2>
        </div>
        <span className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-300">{connectionLabel}</span>
      </div>

      <div className="grid gap-3">
        <div className="aspect-video overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">{remoteTile}</div>
        <div className="grid grid-cols-[112px_1fr] gap-3">
          <div className="aspect-video">{localTile}</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={toggleCamera} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-emerald-400">
              {isCameraOn ? "Stop cam" : "Start cam"}
            </button>
            <button onClick={toggleMic} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-cyan-400">
              {isMicOn ? "Mute" : "Unmute"}
            </button>
            <button onClick={() => setIsExpanded(true)} className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-950">
              Expand
            </button>
            <button onClick={sendVoiceNote} className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold hover:border-amber-400">
              Voice note
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
