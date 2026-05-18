-- Migration: Add Dislikes and Comments for Feed Reviews
-- Run this script in the Supabase SQL Editor.

-- 1. Modify review_likes to support dislikes
-- We add a reaction_type column defaulting to 'like' to preserve existing data.
ALTER TABLE public.review_likes ADD COLUMN reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'dislike'));

-- 2. Review Comments Table
CREATE TABLE public.review_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_id      UUID NOT NULL REFERENCES public.film_logs(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review comments are viewable by everyone" 
    ON public.review_comments FOR SELECT USING (true);

CREATE POLICY "Users can manage their own comments" 
    ON public.review_comments FOR ALL USING (auth.uid() = user_id);

-- 3. Update the activity_feed view to include reaction counts and comment counts
DROP VIEW IF EXISTS public.activity_feed;

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
    fl.is_rewatch,
    fl.watched_on,
    fl.created_at,
    (SELECT COUNT(*) FROM public.review_likes rl WHERE rl.log_id = fl.id AND rl.reaction_type = 'like') AS like_count,
    (SELECT COUNT(*) FROM public.review_likes rl WHERE rl.log_id = fl.id AND rl.reaction_type = 'dislike') AS dislike_count,
    (SELECT COUNT(*) FROM public.review_comments rc WHERE rc.log_id = fl.id) AS comment_count
FROM public.film_logs fl
JOIN public.profiles p ON p.id = fl.user_id
ORDER BY fl.created_at DESC;
