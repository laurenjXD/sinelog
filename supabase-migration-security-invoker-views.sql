-- SineLog security-invoker view migration
-- Run this in Supabase SQL Editor for existing projects flagged by the Security Advisor.

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
