import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export type SessionStatus = "waiting" | "active" | "ended";
export type MatchMode = "human" | "forge";

export type SessionPreferences = {
  handle?: string;
  accountId?: string;
  languages?: string[];
  goal?: string;
  experience?: string;
  matchMode?: MatchMode;
};

export type DevmegleSession = {
  id: string;
  created_by: string;
  room_id: string;
  status: SessionStatus;
  partner_id: string | null;
  preferences: SessionPreferences;
  created_at: string;
  updated_at: string;
  expires_at: string;
  matched_at?: string;
  ended_at?: string;
  report_reason?: string;
};

export type HydratedSession = DevmegleSession & {
  partner: {
    id: string;
    created_by: string;
    preferences: SessionPreferences;
    synthetic?: boolean;
  } | null;
  code: DevmegleCode | null;
};

export type DevmegleCode = {
  session_id: string;
  content: string;
  language: string;
  updated_at: string;
  updated_by?: string;
};

export type DevmegleMessage = {
  id: string;
  session_id: string;
  sender: string;
  type: "user" | "ai" | "system";
  content: string;
  created_at: string;
};

export type DevmegleSignal = {
  id: string;
  room_id: string;
  sender_session_id: string;
  type: "offer" | "answer" | "ice" | "presence";
  payload: unknown;
  created_at: string;
};

export type RepoExport = {
  repoId: string;
  sessionId: string;
  repoUrl: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  localPath: string;
  vscodeUri: string;
  files: Record<string, string>;
  commands: string[];
  createdAt: string;
  expiresAt: string;
};

type ConnectionLog = {
  id: string;
  session_id: string;
  from_user: string;
  to_user: string;
  connector: string;
  created_at: string;
};

type DevmegleStore = {
  sessions: Map<string, DevmegleSession>;
  codes: Map<string, DevmegleCode>;
  messages: Map<string, DevmegleMessage[]>;
  signals: Map<string, DevmegleSignal[]>;
  repos: Map<string, RepoExport>;
  connectionLogs: ConnectionLog[];
};

declare global {
  var __devmegleStore: DevmegleStore | undefined;
}

const MAX_CODE_LENGTH = 120_000;
const MAX_MESSAGE_LENGTH = 4_000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]{8,96}$/;

const DEFAULT_CODE = `// DevMegle forge room
// Build something weirdly useful with the stranger on the other side.

type Idea = {
  name: string;
  shipByMinutes: number;
  riskyBit: string;
};

const idea: Idea = {
  name: "Tiny PR reviewer",
  shipByMinutes: 45,
  riskyBit: "making feedback useful without being noisy",
};

export function pitch({ name, shipByMinutes, riskyBit }: Idea) {
  return \`\${name}: demo in \${shipByMinutes} minutes, watch out for \${riskyBit}.\`;
}

console.log(pitch(idea));
`;

function getStore(): DevmegleStore {
  if (!globalThis.__devmegleStore) {
    globalThis.__devmegleStore = {
      sessions: new Map(),
      codes: new Map(),
      messages: new Map(),
      signals: new Map(),
      repos: new Map(),
      connectionLogs: [],
    };
  }

  return globalThis.__devmegleStore;
}

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

function normalizeText(value: unknown, fallback: string, maxLength = 80) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.slice(0, maxLength) || fallback;
}

function normalizePreferences(value: unknown): SessionPreferences {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const languages = Array.isArray(raw.languages)
    ? raw.languages
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 6)
    : ["typescript"];

  const matchMode = raw.matchMode === "forge" ? "forge" : "human";

  return {
    handle: normalizeText(raw.handle, "anonymous-dev", 40),
    accountId: typeof raw.accountId === "string" ? raw.accountId.slice(0, 120) : undefined,
    languages: languages.length ? Array.from(new Set(languages)) : ["typescript"],
    goal: normalizeText(raw.goal, "Ship a useful prototype", 140),
    experience: normalizeText(raw.experience, "builder", 40),
    matchMode,
  };
}

export function assertValidSessionId(sessionId: unknown): asserts sessionId is string {
  if (typeof sessionId !== "string" || !SESSION_ID_PATTERN.test(sessionId)) {
    throw new Error("Invalid session id");
  }
}

function cleanupExpiredSessions() {
  const store = getStore();
  const cutoff = Date.now();

  for (const session of store.sessions.values()) {
    if (session.status !== "ended" && new Date(session.expires_at).getTime() < cutoff) {
      session.status = "ended";
      session.ended_at = now();
      session.updated_at = session.ended_at;
      addSystemMessage(session.id, "This room expired after 24 hours.");
    }
  }
}

function addSystemMessage(sessionId: string, content: string) {
  const store = getStore();
  const roomKey = getRoomKey(sessionId) ?? sessionId;
  const messages = store.messages.get(roomKey) ?? [];
  messages.push({
    id: createId("msg"),
    session_id: roomKey,
    sender: "DevMegle",
    type: "system",
    content: content.slice(0, MAX_MESSAGE_LENGTH),
    created_at: now(),
  });
  store.messages.set(roomKey, messages.slice(-200));
}

function scorePartner(candidate: DevmegleSession, preferences: SessionPreferences) {
  const requested = new Set(preferences.languages ?? []);
  const candidateLanguages = candidate.preferences.languages ?? [];
  const sharedLanguages = candidateLanguages.filter((language) => requested.has(language)).length;
  return sharedLanguages * 10 + new Date(candidate.created_at).getTime() / 1_000_000_000_000;
}

function findWaitingPartner(session: DevmegleSession) {
  const store = getStore();
  const candidates = Array.from(store.sessions.values()).filter((candidate) => {
    if (candidate.id === session.id) return false;
    if (candidate.status !== "waiting") return false;
    if (candidate.preferences.matchMode === "forge") return false;
    if (candidate.created_by !== "anonymous" && candidate.created_by === session.created_by) return false;
    return true;
  });

  return candidates.sort((a, b) => scorePartner(b, session.preferences) - scorePartner(a, session.preferences))[0] ?? null;
}

function hydrateSession(session: DevmegleSession): HydratedSession {
  const store = getStore();
  const partnerSession = session.partner_id ? store.sessions.get(session.partner_id) : null;
  const syntheticPartner = session.partner_id?.startsWith("forge_")
    ? {
        id: session.partner_id,
        created_by: "Ada, AI pair engineer",
        preferences: {
          handle: "ada-forge",
          languages: ["typescript", "python", "sql"],
          goal: "Keep momentum, ask sharper questions, and turn snippets into shippable pieces",
          experience: "senior",
          matchMode: "forge" as const,
        },
        synthetic: true,
      }
    : null;

  return {
    ...session,
    partner: partnerSession
      ? {
          id: partnerSession.id,
          created_by: partnerSession.created_by,
          preferences: partnerSession.preferences,
        }
      : syntheticPartner,
    code: store.codes.get(session.room_id) ?? store.codes.get(session.id) ?? null,
  };
}

function getRoomKey(sessionId: string) {
  return getStore().sessions.get(sessionId)?.room_id ?? null;
}

export function createSession(input: { userId?: unknown; preferences?: unknown }) {
  cleanupExpiredSessions();

  const store = getStore();
  const preferences = normalizePreferences(input.preferences);
  const createdBy = normalizeText(input.userId, preferences.handle ?? "anonymous", 64);
  const sessionId = createId("session");
  const roomId = createId("room");
  const timestamp = now();

  const session: DevmegleSession = {
    id: sessionId,
    created_by: createdBy,
    room_id: roomId,
    status: "waiting",
    partner_id: null,
    preferences,
    created_at: timestamp,
    updated_at: timestamp,
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };

  store.sessions.set(sessionId, session);
  store.codes.set(roomId, {
    session_id: roomId,
    content: DEFAULT_CODE,
    language: preferences.languages?.[0] === "python" ? "python" : "typescript",
    updated_at: timestamp,
    updated_by: createdBy,
  });

  addSystemMessage(
    sessionId,
    preferences.matchMode === "forge"
      ? "Forge room created. Your AI pair is ready while you prototype."
      : "You joined the human matchmaking queue."
  );

  const partner = preferences.matchMode === "human" ? findWaitingPartner(session) : null;
  if (partner) {
    const matchedAt = now();
    session.status = "active";
    session.partner_id = partner.id;
    session.room_id = partner.room_id;
    session.matched_at = matchedAt;
    session.updated_at = matchedAt;

    partner.status = "active";
    partner.partner_id = session.id;
    partner.matched_at = matchedAt;
    partner.updated_at = matchedAt;

    addSystemMessage(session.id, `${session.preferences.handle ?? session.created_by} matched with ${partner.preferences.handle ?? partner.created_by}.`);

    return {
      success: true,
      matched: true,
      session: hydrateSession(session),
      partner: hydrateSession(partner),
    };
  }

  if (preferences.matchMode === "forge") {
    const matchedAt = now();
    session.status = "active";
    session.partner_id = createId("forge");
    session.matched_at = matchedAt;
    session.updated_at = matchedAt;
    addSystemMessage(session.id, "Ada joined as your AI pair engineer.");
    return {
      success: true,
      matched: true,
      session: hydrateSession(session),
      partner: hydrateSession(session).partner,
    };
  }

  return {
    success: true,
    matched: false,
    session: hydrateSession(session),
  };
}

export function getSession(sessionId: string) {
  assertValidSessionId(sessionId);
  cleanupExpiredSessions();

  const session = getStore().sessions.get(sessionId);
  return session ? hydrateSession(session) : null;
}

export function updateSession(sessionId: string, updates: Partial<Pick<DevmegleSession, "status" | "report_reason">>) {
  assertValidSessionId(sessionId);
  const session = getStore().sessions.get(sessionId);
  if (!session) return null;

  const timestamp = now();
  if (updates.status) session.status = updates.status;
  if (updates.report_reason) session.report_reason = updates.report_reason.slice(0, 500);
  session.updated_at = timestamp;

  return hydrateSession(session);
}

export function endSession(sessionId: string, reason?: string) {
  assertValidSessionId(sessionId);
  const store = getStore();
  const session = store.sessions.get(sessionId);
  if (!session) return null;

  const timestamp = now();
  session.status = "ended";
  session.ended_at = timestamp;
  session.updated_at = timestamp;
  if (reason) session.report_reason = reason.slice(0, 500);
  addSystemMessage(session.id, reason ? "This room was reported and closed." : "The room was closed.");

  if (session.partner_id && !session.partner_id.startsWith("forge_")) {
    const partner = store.sessions.get(session.partner_id);
    if (partner && partner.status !== "ended") {
      const partnerRoomId = createId("room");
      partner.status = "waiting";
      partner.partner_id = null;
      partner.room_id = partnerRoomId;
      partner.updated_at = timestamp;
      store.codes.set(partnerRoomId, {
        session_id: partnerRoomId,
        content: DEFAULT_CODE,
        language: partner.preferences.languages?.[0] === "python" ? "python" : "typescript",
        updated_at: timestamp,
        updated_by: partner.created_by,
      });
      addSystemMessage(partner.id, "Your partner left. You are back in the queue.");
    }
  }

  return hydrateSession(session);
}

export function createNextSession(sessionId: string, userId?: unknown) {
  const current = getSession(sessionId);
  if (!current) return null;
  endSession(sessionId);

  return createSession({
    userId: userId ?? current.created_by,
    preferences: {
      ...current.preferences,
      matchMode: "human",
    },
  });
}

export function getCode(sessionId: string) {
  assertValidSessionId(sessionId);
  const roomKey = getRoomKey(sessionId);
  return roomKey ? getStore().codes.get(roomKey) ?? getStore().codes.get(sessionId) ?? null : null;
}

export function updateCode(input: { sessionId: unknown; content: unknown; language?: unknown; updatedBy?: unknown }) {
  assertValidSessionId(input.sessionId);
  const session = getStore().sessions.get(input.sessionId);
  if (!session || session.status === "ended") return null;

  const content = typeof input.content === "string" ? input.content.slice(0, MAX_CODE_LENGTH) : "";
  const roomKey = session.room_id;
  const language = normalizeText(input.language, getStore().codes.get(roomKey)?.language ?? "typescript", 30);
  const updatedBy = normalizeText(input.updatedBy, "anonymous-dev", 64);
  const code = {
    session_id: roomKey,
    content,
    language,
    updated_at: now(),
    updated_by: updatedBy,
  };

  getStore().codes.set(roomKey, code);
  session.updated_at = code.updated_at;

  return code;
}

export function listMessages(sessionId: string) {
  assertValidSessionId(sessionId);
  const roomKey = getRoomKey(sessionId);
  return roomKey ? getStore().messages.get(roomKey) ?? [] : [];
}

export function addMessage(input: { sessionId: unknown; sender: unknown; content: unknown; type?: unknown }) {
  assertValidSessionId(input.sessionId);
  const session = getStore().sessions.get(input.sessionId);
  if (!session || session.status === "ended") return null;

  const sender = normalizeText(input.sender, "anonymous-dev", 64);
  const content = typeof input.content === "string" ? input.content.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!content) return null;

  const type = input.type === "ai" || input.type === "system" ? input.type : "user";
  const roomKey = session.room_id;
  const message: DevmegleMessage = {
    id: createId("msg"),
    session_id: roomKey,
    sender,
    type,
    content,
    created_at: now(),
  };

  const messages = getStore().messages.get(roomKey) ?? [];
  messages.push(message);
  getStore().messages.set(roomKey, messages.slice(-200));
  session.updated_at = message.created_at;

  return message;
}

export function addSignal(input: { sessionId: unknown; senderSessionId: unknown; type: unknown; payload: unknown }) {
  assertValidSessionId(input.sessionId);
  assertValidSessionId(input.senderSessionId);

  const session = getStore().sessions.get(input.sessionId);
  if (!session || session.status === "ended") return null;

  if (input.type !== "offer" && input.type !== "answer" && input.type !== "ice" && input.type !== "presence") {
    throw new Error("Invalid signal type");
  }

  const signal: DevmegleSignal = {
    id: createId("signal"),
    room_id: session.room_id,
    sender_session_id: input.senderSessionId,
    type: input.type,
    payload: input.payload,
    created_at: now(),
  };

  const signals = getStore().signals.get(session.room_id) ?? [];
  signals.push(signal);
  getStore().signals.set(session.room_id, signals.slice(-300));

  return signal;
}

export function listSignals(input: { sessionId: unknown; after?: unknown; excludeSender?: unknown }) {
  assertValidSessionId(input.sessionId);
  const session = getStore().sessions.get(input.sessionId);
  if (!session) return [];

  const after = typeof input.after === "string" ? input.after : "";
  const excludeSender = typeof input.excludeSender === "string" ? input.excludeSender : "";

  return (getStore().signals.get(session.room_id) ?? []).filter((signal) => {
    if (excludeSender && signal.sender_session_id === excludeSender) return false;
    if (after && signal.created_at <= after) return false;
    return true;
  });
}

export function getStats() {
  cleanupExpiredSessions();
  const sessions = Array.from(getStore().sessions.values());
  const activeRooms = new Set(sessions.filter((session) => session.status === "active").map((session) => session.room_id));
  const waitingRooms = new Set(sessions.filter((session) => session.status === "waiting").map((session) => session.room_id));

  return {
    waiting: waitingRooms.size,
    active: activeRooms.size,
    ended: sessions.filter((session) => session.status === "ended").length,
    rooms: new Set(sessions.map((session) => session.room_id)).size,
  };
}

export async function createRepoExport(input: { sessionId: unknown; code: unknown; commitMessage?: unknown }) {
  assertValidSessionId(input.sessionId);
  const session = getSession(input.sessionId);
  if (!session) return null;

  const code = typeof input.code === "string" && input.code.trim() ? input.code.slice(0, MAX_CODE_LENGTH) : session.code?.content ?? DEFAULT_CODE;
  const commitMessage = normalizeText(input.commitMessage, "DevMegle collaboration checkpoint", 120);
  const repoId = `devmegle_${input.sessionId}`;
  const commitHash = createId("commit");
  const createdAt = now();
  const files: Record<string, string> = {
    "README.md": `# DevMegle Session ${input.sessionId}

This repo was initialized from a DevMegle pair-programming room.

## Partner

${session.partner ? `Paired with ${session.partner.created_by}` : "No partner metadata was available."}

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

## First Commit

${commitMessage}
`,
    "package.json": JSON.stringify(
      {
        scripts: {
          dev: "tsx src/main.ts",
          start: "tsx src/main.ts",
        },
        dependencies: {},
        devDependencies: {
          tsx: "latest",
          typescript: "latest",
        },
      },
      null,
      2
    ),
    "src/main.ts": code,
    ".gitignore": "node_modules\n.env\n.DS_Store\n",
  };

  const baseDir = path.resolve(process.env.DEVMEGLE_EXPORT_DIR || path.join(tmpdir(), "devmegle-exports"));
  const repoDir = path.resolve(baseDir, input.sessionId);
  if (!repoDir.startsWith(baseDir)) {
    throw new Error("Unsafe export path");
  }

  await mkdir(path.join(repoDir, "src"), { recursive: true });
  await Promise.all(Object.entries(files).map(([file, contents]) => writeFile(path.join(repoDir, file), contents, "utf8")));

  const normalizedPath = repoDir.replace(/\\/g, "/");
  const repo: RepoExport = {
    repoId,
    sessionId: input.sessionId,
    repoUrl: `https://github.com/new?name=${encodeURIComponent(repoId)}`,
    branch: "main",
    commitHash,
    commitMessage,
    localPath: repoDir,
    vscodeUri: `vscode://file/${normalizedPath}`,
    files,
    commands: [
      `cd "${repoDir}"`,
      "git init",
      "git add .",
      `git commit -m "${commitMessage.replace(/"/g, "'")}"`,
      `gh repo create ${repoId} --private --source=. --remote=origin --push`,
    ],
    createdAt,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };

  getStore().repos.set(input.sessionId, repo);
  addSystemMessage(input.sessionId, `Repo pack exported to ${repoDir}.`);

  return repo;
}

export function logConnection(input: { sessionId: unknown; fromUser: unknown; toUser: unknown; connector: unknown }) {
  assertValidSessionId(input.sessionId);
  const log: ConnectionLog = {
    id: createId("connection"),
    session_id: input.sessionId,
    from_user: normalizeText(input.fromUser, "anonymous-dev", 64),
    to_user: normalizeText(input.toUser, "partner", 64),
    connector: normalizeText(input.connector, "unknown", 40),
    created_at: now(),
  };
  getStore().connectionLogs.push(log);
  return log;
}
