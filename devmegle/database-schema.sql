-- DevMegle+ Database Schema
-- Updated: added expires_at to sessions and improved cleanup logic

-- Sessions table - stores active collaboration sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  partner_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matched_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- NEW: expires_at for automatic cleanup and session expiry
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Codes table - stores the shared code content for each session
CREATE TABLE IF NOT EXISTS codes (
  session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'javascript',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connection logs table - tracks social media connections made during sessions
CREATE TABLE IF NOT EXISTS connection_logs (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  connector TEXT NOT NULL CHECK (connector IN ('linkedin', 'slack', 'github', 'instagram')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI interactions table - logs AI usage for analytics
CREATE TABLE IF NOT EXISTS ai_interactions (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat', 'suggest', 'explain')),
  message TEXT,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Git repositories table - tracks temporary repos created during sessions
CREATE TABLE IF NOT EXISTS git_repos (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  repo_id TEXT NOT NULL,
  repo_url TEXT,
  branch TEXT DEFAULT 'main',
  last_commit_hash TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_codes_session_id ON codes(session_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_session_id ON connection_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_git_repos_session_id ON git_repos(session_id);
CREATE INDEX IF NOT EXISTS idx_git_repos_expires_at ON git_repos(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE git_repos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for MVP - in production, implement proper auth)
CREATE POLICY "Allow public access to sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow public access to codes" ON codes FOR ALL USING (true);
CREATE POLICY "Allow public access to connection_logs" ON connection_logs FOR ALL USING (true);
CREATE POLICY "Allow public access to ai_interactions" ON ai_interactions FOR ALL USING (true);
CREATE POLICY "Allow public access to git_repos" ON git_repos FOR ALL USING (true);

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_codes_updated_at
BEFORE UPDATE ON codes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions and repos (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Delete sessions that have expired
    DELETE FROM sessions WHERE expires_at < NOW();

    -- Delete git repos that have expired
    DELETE FROM git_repos WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing
INSERT INTO sessions (id, created_by, status)
VALUES 
('sample_session_1', 'user1', 'waiting'),
('sample_session_2', 'user2', 'waiting')
ON CONFLICT (id) DO NOTHING;

INSERT INTO codes (session_id, content, language)
VALUES 
('sample_session_1', '// Welcome to DevMegle+!\nconsole.log("Hello, World!");', 'javascript'),
('sample_session_2', '// Another session\nfunction greet() {\n  return "Hello from DevMegle+!";\n}', 'javascript')
ON CONFLICT (session_id) DO NOTHING;
