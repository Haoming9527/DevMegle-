-- Enable RLS for the sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a new session
CREATE POLICY "Allow anonymous insert" ON sessions FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to view any session
CREATE POLICY "Allow anonymous select" ON sessions FOR SELECT TO anon USING (true);

-- Enable RLS for the codes table
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a new code entry
CREATE POLICY "Allow anonymous insert" ON codes FOR INSERT TO anon WITH CHECK (true);

-- Allow anyone to view any code entry
CREATE POLICY "Allow anonymous select" ON codes FOR SELECT TO anon USING (true);

-- Allow anyone to update any code entry
CREATE POLICY "Allow anonymous update" ON codes FOR UPDATE TO anon USING (true);
