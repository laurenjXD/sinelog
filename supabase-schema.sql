-- =================================================================
-- CineCircle — Database Schema
-- Standard PostgreSQL / Supabase Compatible
-- =================================================================

-- 1. EXTENSIONS
-- Required for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
-- Extends auth.users with public-facing profile data
CREATE TABLE public.profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username      TEXT UNIQUE NOT NULL,
    display_name  TEXT,
    bio           TEXT,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. AUTH TRIGGER (Automated Profile Creation)
-- Automatically creates a profile record when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'display_name', SPLIT_PART(new.email, '@', 1))
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. FILM LOGS TABLE
-- Records of movies watched, rated, and reviewed
CREATE TABLE public.film_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tmdb_id      INTEGER NOT NULL,
    movie_title  TEXT NOT NULL,
    poster_path  TEXT,
    rating       SMALLINT CHECK (rating >= 1 AND rating <= 5),
    review       TEXT,
    liked        BOOLEAN DEFAULT FALSE,
    keyframes        JSONB DEFAULT '[]'::jsonb,
    watched_on   DATE DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tmdb_id)
);

ALTER TABLE public.film_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs are viewable by everyone" 
    ON public.film_logs FOR SELECT USING (true);

CREATE POLICY "Users can manage their own logs" 
    ON public.film_logs FOR ALL USING (auth.uid() = user_id);

-- 5. WATCHLIST TABLE
CREATE TABLE public.watchlist (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tmdb_id      INTEGER NOT NULL,
    movie_title  TEXT NOT NULL,
    poster_path  TEXT,
    added_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tmdb_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Watchlists are viewable by everyone" 
    ON public.watchlist FOR SELECT USING (true);

CREATE POLICY "Users can manage their own watchlist" 
    ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- 6. REVIEW LIKES TABLE
CREATE TABLE public.review_likes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_id      UUID NOT NULL REFERENCES public.film_logs(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, log_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review likes are viewable by everyone" 
    ON public.review_likes FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" 
    ON public.review_likes FOR ALL USING (auth.uid() = user_id);

-- 7. FOLLOWS TABLE
CREATE TABLE public.follows (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone" 
    ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" 
    ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- 8. ACTIVITY FEED VIEW
-- Joins logs with profile data for social feeds
CREATE OR REPLACE VIEW public.activity_feed
WITH (security_invoker = true) AS
SELECT
    fl.id,
    fl.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    fl.tmdb_id,
    fl.movie_title,
    fl.poster_path,
    fl.rating,
    fl.review,
    fl.liked,
    fl.keyframes,
    fl.watched_on,
    fl.created_at,
    (SELECT COUNT(*) FROM public.review_likes rl WHERE rl.log_id = fl.id) AS like_count
FROM public.film_logs fl
JOIN public.profiles p ON p.id = fl.user_id
ORDER BY fl.created_at DESC;

-- 9. PROFILE STATS VIEW
-- Aggregates counts for profile dashboards
CREATE OR REPLACE VIEW public.profile_stats
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.username,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.created_at,
    (SELECT COUNT(*) FROM public.film_logs fl WHERE fl.user_id = p.id) AS films_logged,
    (SELECT COUNT(*) FROM public.film_logs fl WHERE fl.user_id = p.id AND fl.liked = TRUE) AS films_liked,
    (SELECT COUNT(*) FROM public.watchlist w WHERE w.user_id = p.id) AS watchlist_count,
    (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id) AS followers_count,
    (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id) AS following_count
FROM public.profiles p;

-- Existing SineLog projects can run this migration before replacing activity_feed.
-- ALTER TABLE public.film_logs ADD COLUMN IF NOT EXISTS keyframes JSONB DEFAULT '[]'::jsonb;
