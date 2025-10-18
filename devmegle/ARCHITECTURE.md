# DevMegle+ Meeting Function Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DevMegle+ Meeting System                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Landing Page  │    │  Session Page   │    │  AI Chat Panel  │
│                 │    │                 │    │                 │
│ • Pair Me Btn   │───▶│ • Waiting State │    │ • Groq AI       │
│ • User Prefs    │    │ • Active State  │    │ • Code Analysis │
│ • Instant Match │    │ • Session Ctrl  │    │ • Suggestions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer                                   │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│ Meeting API     │ Session API     │ AI API          │ Git API   │
│                 │                 │                 │           │
│ • Create        │ • Get/Update    │ • Groq Chat     │ • Create  │
│ • Pair Users    │ • Delete        │ • Suggestions   │ • Commit  │
│ • Match Logic   │ • Real-time     │ • Explain       │ • Cleanup │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Supabase Database                             │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│ Sessions    │ Codes       │ AI Logs     │ Git Repos   │ Social  │
│             │             │             │             │         │
│ • Pairing   │ • Content   │ • Usage     │ • Temp      │ • Links │
│ • Status    │ • Language  │ • Analytics │ • Auto-del  │ • Track │
│ • Partners  │ • Sync      │ • Context   │ • Expiry    │ • Logs  │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────┘

┌─────────────────────────────────────────────────────────────────┐
│                Real-time Components                             │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│ SessionMonitor  │ CodeEditor      │ Supabase        │ AI Chat   │
│                 │                 │ Realtime        │           │
│ • Partner       │ • Monaco        │ • Subscriptions │ • Groq    │
│ • Status        │ • Live Sync     │ • Updates       │ • Context │
│ • Notifications │ • Collaboration │ • Polling       │ • History │
└─────────────────┴─────────────────┴─────────────────┴───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│ Groq AI         │ Smithery MCP    │ Supabase        │ GitHub    │
│                 │                 │                 │           │
│ • Fast LLM      │ • Git Ops       │ • Database      │ • Repos   │
│ • Code Help     │ • Repo Mgmt     │ • Realtime      │ • API     │
│ • Suggestions   │ • Auto-cleanup  │ • Auth          │ • Webhooks│
└─────────────────┴─────────────────┴─────────────────┴───────────┘

User Flow:
1. Click "Pair Me" → Create Session → Find Partner
2. Waiting Screen → Partner Found → Active Collaboration
3. Code Editor + AI Chat + Git Integration
4. Session End → Social Connections → Cleanup

Key Features:
✅ Instant Random Pairing
✅ Real-time Code Collaboration  
✅ AI-Powered Code Assistance
✅ Temporary Git Repositories
✅ Session Management & Controls
✅ Automatic Data Cleanup
✅ Social Connection Tracking
✅ Comprehensive Error Handling
```
