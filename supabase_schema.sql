-- ====================================================================
-- LUNITO PLATFORM - PRODUCTION-READY SUPABASE DATABASE SCHEMA
-- ====================================================================
-- This SQL script sets up the active tables, indexes, and security (RLS)
-- required for LUNITO's user profiles, notebooks, and dynamic learning data.
-- Paste this script directly into the Supabase 'SQL Editor' to execute it.

-- --------------------------------------------------------------------
-- 1. Create Profile Table ('users')
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,                       -- Matches auth.uid() value (User ID injected by Supabase)
    uid TEXT,                                  -- Mirrored text string of uid for client application symmetry
    email VARCHAR(255),                        -- User profile registration email
    "displayName" VARCHAR(255),                -- Display name (Camels are preserved using double quotes)
    plan VARCHAR(50) DEFAULT 'free',           -- Current premium subscription plan tier (e.g. 'free', 'pro')
    streak INTEGER DEFAULT 0,                  -- Number of consecutive daily active days
    "totalSessions" INTEGER DEFAULT 0,         -- Total completed study/revision sessions
    "chatsToday" INTEGER DEFAULT 0,            -- Number of AI Socratic mentor interactions today
    "studyTimeToday" VARCHAR(50) DEFAULT '0h', -- Dynamic study time tracker payload (e.g., '1.5h')
    "accuracyRate" INTEGER DEFAULT 0,          -- Performance index score from assessments
    "lastResetTime" TEXT,                      -- ISO datetime representation of past daily counters reset
    "lastActive" TEXT,                         -- ISO datetime representation of last login event
    "testHistory" JSONB DEFAULT '[]'::jsonb,   -- Array of diagnostic testing histories and scores
    "flashcardsHistory" JSONB DEFAULT '[]'::jsonb,  -- Array of flashcard batches created/studied
    flashcards JSONB DEFAULT '[]'::jsonb,      -- Deep nesting JSON storage of the custom flashcards
    subjects JSONB DEFAULT '[]'::jsonb,       -- Selected academic disciplines list
    "subjectsProgress" JSONB DEFAULT '{}'::jsonb -- Detailed topic progression counters and states
);

-- --------------------------------------------------------------------
-- 2. Create Learning Notebook Pages Table ('notebooks')
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notebooks (
    id TEXT PRIMARY KEY,                       -- Explicitly assigned ID generated string (e.g., 'doc_...')
    "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE, -- Secure relational link to users(id)
    title TEXT NOT NULL,                       -- Custom title written for notes
    lines JSONB DEFAULT '[]'::jsonb,           -- Ordered string lines of study materials
    category TEXT DEFAULT 'General',           -- Learning subject classification
    "createdAt" TEXT,                          -- ISO datetime created string
    "updatedAt" TEXT                           -- ISO datetime modified string
);

-- --------------------------------------------------------------------
-- 3. Configure Row-Level Security (RLS) Policies
-- --------------------------------------------------------------------
-- Ensure table-level lockouts are active in production
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

-- Security Policies for 'users': No user can see or modify another user's progress profile
CREATE POLICY "Allow users to read their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid()::text = id);

CREATE POLICY "Allow users to insert their own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Allow users to update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- Security Policies for 'notebooks': No user can access another user's personal learning journal
CREATE POLICY "Users can read their own notebooks"
    ON public.notebooks
    FOR SELECT
    USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own notebooks"
    ON public.notebooks
    FOR INSERT
    WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own notebooks"
    ON public.notebooks
    FOR UPDATE
    USING (auth.uid()::text = "userId")
    WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own notebooks"
    ON public.notebooks
    FOR DELETE
    USING (auth.uid()::text = "userId");

-- --------------------------------------------------------------------
-- 4. Enable Performance Indexing
-- --------------------------------------------------------------------
-- Relational foreign keys or active queries require indexing to guarantee fast response times
CREATE INDEX IF NOT EXISTS idx_notebooks_user_id ON public.notebooks("userId");

-- --------------------------------------------------------------------
-- 5. Set up Auto-Creation of user profile upon Signup (Standard Trigger Pattern)
-- --------------------------------------------------------------------
-- This trigger automatically handles generating a blank profile entry in 'public.users' 
-- whenever a user authenticates with Supabase Auth. It acts as a fallback layer in case
-- the client-side profile creation faces an interrupt.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    uid, 
    email, 
    "displayName", 
    plan, 
    streak, 
    "totalSessions", 
    "chatsToday", 
    "studyTimeToday", 
    "accuracyRate", 
    "lastResetTime", 
    "lastActive", 
    "testHistory", 
    "flashcardsHistory", 
    flashcards, 
    subjects, 
    "subjectsProgress"
  ) VALUES (
    NEW.id::text,
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'displayName', split_part(NEW.email, '@', 1)),
    'free',
    0,
    0,
    0,
    '0h',
    0,
    to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger linked to the auth.users table
DROP TRIGGER IF EXISTS trigger_handle_new_auth_user ON auth.users;
CREATE TRIGGER trigger_handle_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- --------------------------------------------------------------------
-- 6. Create Chats & Messages Tables (Socratic AI Conversation History)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "lastMessageAt" TEXT NOT NULL,
    subject TEXT,
    topic TEXT
);

CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    "chatId" TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Row-Level Security for chats & messages
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if exist
DROP POLICY IF EXISTS "Users can access their own chats" ON public.chats;
CREATE POLICY "Users can access their own chats"
    ON public.chats FOR ALL USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can access their own chat messages" ON public.messages;
CREATE POLICY "Users can access their own chat messages"
    ON public.messages FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.chats 
        WHERE public.chats.id = public.messages."chatId" 
          AND public.chats."userId" = auth.uid()::text
    ));

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats("userId");
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages("chatId");
