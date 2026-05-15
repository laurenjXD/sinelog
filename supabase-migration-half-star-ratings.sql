-- SineLog half-star rating migration
-- Run this in Supabase SQL Editor for existing projects created before half-star ratings.

ALTER TABLE public.film_logs
  ALTER COLUMN rating TYPE NUMERIC(2,1) USING rating::numeric,
  DROP CONSTRAINT IF EXISTS film_logs_rating_check;

ALTER TABLE public.film_logs
  ADD CONSTRAINT film_logs_rating_check CHECK (rating >= 0.5 AND rating <= 5);
