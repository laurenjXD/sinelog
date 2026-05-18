-- Migration: Add Spoilers support to film logs

-- 1. Add has_spoilers column to film_logs
ALTER TABLE public.film_logs 
ADD COLUMN has_spoilers BOOLEAN DEFAULT FALSE;

-- 2. Update the activity_feed view to include has_spoilers
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
    fl.has_spoilers,
    fl.watched_on,
    fl.created_at,
    (SELECT COUNT(*) FROM public.review_likes rl WHERE rl.log_id = fl.id AND rl.reaction_type = 'like') AS like_count,
    (SELECT COUNT(*) FROM public.review_likes rl WHERE rl.log_id = fl.id AND rl.reaction_type = 'dislike') AS dislike_count,
    (SELECT COUNT(*) FROM public.review_comments rc WHERE rc.log_id = fl.id) AS comment_count
FROM public.film_logs fl
JOIN public.profiles p ON p.id = fl.user_id
ORDER BY fl.created_at DESC;
