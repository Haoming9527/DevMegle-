# DevMegle+ Meeting Function System

## Overview

DevMegle+ is an AI-powered random developer pairing platform that enables instant collaboration with live Git repos and AI copilots. This document describes the comprehensive meeting function system that powers the core pairing and collaboration features.

## Core Features Implemented

### 🚀 Instant Random Matching
- **API Endpoint**: `/api/meeting/create`
- **Functionality**: Creates new sessions and attempts instant pairing
- **Real-time Updates**: Uses Supabase Realtime for live session monitoring
- **Fallback**: Polling mechanism ensures reliable partner detection

### 🤖 AI-Powered Collaboration
- **Groq Integration**: Fast LLM for code suggestions and chat
- **Interactive Chat**: Real-time AI conversation with code context
- **Smart Suggestions**: Automated code improvement recommendations
- **Code Explanation**: AI-powered code analysis and explanation

### 🌐 Temporary Git Repositories
- **Ephemeral Repos**: Auto-created temporary repositories for each session
- **Auto-cleanup**: 24-hour expiration with automatic deletion
- **Commit Integration**: One-click code commits to temporary repos
- **Branch Management**: Automatic branch creation and management

### 📊 Session Management
- **Real-time State**: Live session status updates
- **Partner Monitoring**: Automatic partner detection and notification
- **Session Controls**: Next dev, report, and end session functionality
- **Data Persistence**: Secure session data storage with automatic cleanup

## API Endpoints

### Meeting Creation
```typescript
POST /api/meeting/create
{
  "userId": "string",
  "preferences": {
    "languages": ["javascript", "typescript"],
    "experience": "intermediate"
  }
}
```

### Session Management
```typescript
GET /api/meeting/session?sessionId=string
PUT /api/meeting/session
DELETE /api/meeting/session?sessionId=string
```

### AI Integration
```typescript
POST /api/ai/groq
{
  "sessionId": "string",
  "code": "string",
  "message": "string",
  "type": "chat" | "suggest" | "explain"
}
```

### Git Repository Management
```typescript
POST /api/git/repo
GET /api/git/repo?sessionId=string
DELETE /api/git/repo?sessionId=string
```

## Database Schema

The system uses Supabase with the following key tables:

- **sessions**: Core session data and pairing information
- **codes**: Shared code content for each session
- **connection_logs**: Social media connection tracking
- **ai_interactions**: AI usage analytics
- **git_repos**: Temporary repository management

## Components Architecture

### Core Components

1. **SessionPage** (`src/app/session/[id]/page.tsx`)
   - Main session interface
   - Handles waiting and active states
   - Integrates all sub-components

2. **SessionMonitor** (`src/components/SessionMonitor.tsx`)
   - Real-time session state monitoring
   - Automatic partner detection
   - Session end notifications

3. **AIChat** (`src/components/AIChat.tsx`)
   - Interactive AI conversation interface
   - Code suggestion and explanation features
   - Real-time message handling

4. **CodeEditor** (`src/components/Editor.tsx`)
   - Monaco Editor integration
   - Real-time code synchronization
   - Supabase realtime updates

## User Flow

### 1. Session Creation
1. User clicks "Pair Me Instantly" on landing page
2. System creates new session via `/api/meeting/create`
3. Attempts instant pairing with waiting users
4. Redirects to session page with appropriate state

### 2. Waiting State
1. Shows animated waiting screen
2. SessionMonitor polls for partner matches
3. Real-time updates via Supabase subscriptions
4. Automatic transition when partner found

### 3. Active Collaboration
1. Shared Monaco editor opens
2. AI chat interface becomes available
3. Git commit functionality enabled
4. Session controls accessible

### 4. Session End
1. User clicks "End Session" or partner leaves
2. Session marked as ended in database
3. SessionEndModal shows connection options
4. Temporary data cleanup initiated

## AI Integration Details

### Groq Copilot Features
- **Code Suggestions**: Automated improvement recommendations
- **Code Explanation**: Detailed code analysis and documentation
- **Interactive Chat**: Context-aware conversation about code
- **Error Handling**: Graceful fallbacks when AI is unavailable

### AI Context Management
- Current code content sent with each request
- Session history maintained for context
- User preferences considered in responses
- Rate limiting and error handling implemented

## Security & Safety

### Data Protection
- 24-hour automatic data expiration
- Ephemeral repository cleanup
- No persistent user data storage
- Secure API key management

### Content Moderation
- AI-powered toxicity filtering
- Report functionality for inappropriate content
- Session termination capabilities
- Anonymous user handling

## Performance Optimizations

### Real-time Updates
- Supabase Realtime subscriptions
- Efficient polling fallbacks
- Optimized database queries
- Minimal data transfer

### AI Response Handling
- Async request processing
- Loading states and feedback
- Error recovery mechanisms
- Response caching where appropriate

## Deployment Considerations

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key

# Optional
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GITHUB_TOKEN=your_github_token
```

### Database Setup
1. Copy `env.example` to `.env.local` and fill in your values
2. Run `database-schema.sql` in Supabase SQL editor
3. Enable Row Level Security policies
4. Set up realtime subscriptions
5. Configure automatic cleanup functions

### API Key Management
- Store API keys in `.env.local` for development
- Use environment variables directly in code (no config.ts needed)
- Implement proper key rotation
- Monitor API usage and limits

## Future Enhancements

### Planned Features
- **Voice Integration**: ElevenLabs for voice chat
- **Visual AI**: Gemini for code visualization
- **Squad Mode**: Multi-developer sessions
- **Hackathon Mode**: Skill-based matching
- **Persistent Sessions**: Extended collaboration options

### Scalability Improvements
- Redis for session caching
- CDN for static assets
- Load balancing for API endpoints
- Database sharding for large scale

## Troubleshooting

### Common Issues
1. **Partner Not Found**: Check Supabase connection and session status
2. **AI Not Responding**: Verify Groq API key and rate limits
3. **Code Not Syncing**: Check Supabase realtime subscriptions
4. **Session Stuck**: Use session cleanup functions

### Debug Tools
- Browser console for client-side errors
- Supabase dashboard for database issues
- API endpoint testing with curl/Postman
- Real-time subscription monitoring

## Contributing

When extending the meeting function system:

1. Follow existing patterns for API endpoints
2. Maintain real-time update consistency
3. Implement proper error handling
4. Add appropriate database indexes
5. Update documentation and tests

## License

This project is part of the DevMegle+ platform developed for the Cursor Hackathon.
