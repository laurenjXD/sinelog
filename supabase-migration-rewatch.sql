-- SineLog rewatch migration
-- Run this in Supabase SQL Editor for existing projects.

DROP VIEW IF EXISTS public.activity_feed;

ALTER TABLE public.film_logs
  ADD COLUMN IF NOT EXISTS is_rewatch BOOLEAN DEFAULT FALSE;

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
    (SELECT COUNT(*) FROM public.review_likes rl WHERE rl.log_id = fl.id) AS like_count
FROM public.film_logs fl
JOIN public.profiles p ON p.id = fl.user_id
ORDER BY fl.created_at DESC;
