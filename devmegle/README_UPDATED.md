# DevMegle+

DevMegle+ is a lightweight, ephemeral developer pairing platform. It matches developers (browser tab = session) for short, focused collaboration sessions with live shared code, optional video/audio P2P, and an AI copilot that can participate when asked.

## Target audience (public first)
- Developers who want to quickly pair with another developer with zero setup.
- Students or interview practice participants looking for quick paired exercises.
- Hackers who want spontaneous collaboration and a lightweight ephemeral dev session.

## Developer notes
- Matchmaking: sessions are per-browser-tab. If two waiting sessions exist they are matched into a shared room and locked to two participants.
- Chat: persisted in the `messages` table. AI replies and transcripts appear here.
- Signaling: dedicated `signaling` table for SDP/ICE (realtime via Supabase). Chat and signaling are separated.
- AI: powered by Groq (server-side) and optionally triggered by chat or audio transcript containing an AI mention.

## Quick start (developer)
1. Create a `.env` file with the following entries (example):

   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   GROQ_API_KEY=your_groq_key
   ELEVENLABS_API_KEY=your_elevenlabs_key

2. Install dependencies and run dev server:

```powershell
npm install
npm run dev
```

3. Open http://localhost:3000. To test pairing open two browsers or two tabs.

## Developer flowmap & docs
- See `DEV_FLOWMAP.md` for an overview of runtime flows (matchmaking, session lifecycle, signaling, AI, cleanup).

## Contributing & next steps
- This is an MVP: add TURN servers for reliable P2P, implement auth and RLS policies for production, and add rate limiting for AI calls.

License: MIT
