-- =================================================================
-- SineLog One-For-All Supabase Cleanup
-- Run this in the Supabase SQL Editor for existing projects.
--
-- What this does:
-- 1. Removes old/unused cinematography keyframe leftovers.
-- 2. Converts film ratings to half-star compatible NUMERIC(2,1).
-- 3. Adds the rewatch flag used by the movie modal.
-- 4. Recreates active security-invoker views.
-- 5. Keeps active app tables: profiles, film_logs, watchlist, review_likes, follows.
-- =================================================================

BEGIN;

-- Views depend on film_logs columns, so drop them before table cleanup.
DROP VIEW IF EXISTS public.activity_feed;
DROP VIEW IF EXISTS public.profile_stats;

-- Remove known/possible old cinematic feature tables if they were created locally.
-- These are not used by the current app.
DROP TABLE IF EXISTS public.film_keyframes CASCADE;
DROP TABLE IF EXISTS public.keyframes CASCADE;
DROP TABLE IF EXISTS public.cinematic_keyframes CASCADE;

-- Remove old keyframe column from film logs if the previous cinematography feature was installed.
ALTER TABLE public.film_logs
  DROP COLUMN IF EXISTS keyframes;

-- Add rewatch support for the movie modal.
ALTER TABLE public.film_logs
  ADD COLUMN IF NOT EXISTS is_rewatch BOOLEAN DEFAULT FALSE;

-- Clean invalid values before tightening the rating constraint.
UPDATE public.film_logs
SET rating = NULL
WHERE rating IS NOT NULL
  AND (rating::numeric < 0.5 OR rating::numeric > 5);

-- Replace the old integer-only rating constraint with half-star support.
ALTER TABLE public.film_logs
  DROP CONSTRAINT IF EXISTS film_logs_rating_check;

ALTER TABLE public.film_logs
  ALTER COLUMN rating TYPE NUMERIC(2,1) USING rating::numeric;

ALTER TABLE public.film_logs
  ADD CONSTRAINT film_logs_rating_check
  CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5 AND rating * 2 = floor(rating * 2)));

-- Activity feed view used by feed, modal community reviews, and profile-adjacent UI.
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

-- Profile stats view used by profile pages.
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

COMMIT;
