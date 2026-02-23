-- ============================================================
-- Supabase Schema for Code Snippets Manager
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 2. FOLDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    is_starred BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate folder names in the same parent for the same user
    UNIQUE(user_id, name, parent_id)
);

-- Index for fast lookups by user_id and parent_id
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_starred ON public.folders(user_id, is_starred) WHERE is_starred = TRUE;

-- ============================================================
-- 3. SNIPPETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.snippets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    language TEXT DEFAULT 'javascript',
    is_starred BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent duplicate snippet titles in the same folder for the same user
    UNIQUE(user_id, title, folder_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON public.snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_folder_id ON public.snippets(folder_id);
CREATE INDEX IF NOT EXISTS idx_snippets_starred ON public.snippets(user_id, is_starred) WHERE is_starred = TRUE;
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON public.snippets(user_id, created_at DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Folders: Users can CRUD their own folders
CREATE POLICY "Users can view own folders"
    ON public.folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
    ON public.folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
    ON public.folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
    ON public.folders FOR DELETE
    USING (auth.uid() = user_id);

-- Snippets: Users can CRUD their own snippets
CREATE POLICY "Users can view own snippets"
    ON public.snippets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own snippets"
    ON public.snippets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets"
    ON public.snippets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snippets"
    ON public.snippets FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_folders_updated
    BEFORE UPDATE ON public.folders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_snippets_updated
    BEFORE UPDATE ON public.snippets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
