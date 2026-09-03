# DevMegle+ — Developer Flowmap

This flowmap outlines the runtime flows for DevMegle+ (matchmaking, session, signaling, AI, and cleanup).

1) User arrives on Landing Page
   - Clicks "Pair Me Instantly" -> POST /api/meeting/create
   - Server creates a per-browser `session` (unique session id + room_id) and returns session id
   - If an immediate partner exists, both sessions moved to `active`, share `room_id`.

2) Waiting / Session Join
   - Client loads `/session/:id` and polls/uses SessionMonitor to watch for `active` status
   - Chat messages: client sends POST /api/meeting/message -> stored in `messages`

3) Signaling (WebRTC)
   - Client A starts call -> creates local RTCPeerConnection and creates offer
   - Client A inserts a `signaling` row with `signal_type='sdp-offer'` and payload { sdp }
   - Supabase Realtime pushes the insert to Client B
   - Client B receives `sdp-offer` on `signaling` channel, creates RTCPeerConnection, sets remote desc, creates answer
   - Client B inserts `signaling` row with `signal_type='sdp-answer'` and payload { sdp }
   - Both clients exchange ICE candidates via `signaling` rows (`signal_type='ice'`)
   - On connection, media flows P2P

4) AI & Transcription
   - Chat messages containing AI mention (regex) cause server to call /api/ai/groq and insert AI reply into `messages`
   - Audio capture: client records short audio, posts base64 to POST /api/meeting/transcribe
   - Server forwards audio to ElevenLabs STT, inserts transcript into `messages`
   - If transcript contains AI mention, server triggers AI and inserts AI reply into `messages` and `ai_interactions`

5) Session End / Next
   - End session: DELETE /api/meeting/session?sessionId=... ends both sides
   - Next Dev: POST /api/meeting/next ends current session and creates a new waiting session for requester

6) Cleanup
   - Periodic DB job should call cleanup functions: cleanup_expired_sessions(), cleanup_old_signaling_and_messages()
   - These functions delete sessions older than `expires_at` and signaling/messages older than 6 hours

Notes for devs:
 - Use Supabase Realtime for signaling (subscribe to `signaling` table insert events filtered by `session_id`).
 - Keep `messages` for chat and audit logs; `signaling` is the single source of truth for SDP/ICE.
 - Add TURN servers for production.
