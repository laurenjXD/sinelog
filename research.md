# SineLog — Database System Research

This document provides a comprehensive breakdown of the SineLog database architecture, features, and utilization patterns. SineLog uses **Supabase** (Postgres) as its primary Backend-as-a-Service (BaaS), leveraging advanced SQL features like Row Level Security (RLS), Triggers, and Security-Invoker Views.

---

## 🏗️ Core Schema Architecture

### 1. `public.profiles`
Extends the internal Supabase Auth system to store public-facing user data.
- **ID**: `UUID` (Matches `auth.users.id`)
- **Key Columns**: `username`, `display_name`, `bio`, `avatar_url`.
- **Relationship**: Created automatically via a database trigger upon signup.

### 2. `public.film_logs`
The heart of the application. Stores every movie watch event.
- **Columns**:
  - `tmdb_id`: Integer reference to TMDB metadata.
  - `rating`: `NUMERIC(2,1)` — Supports half-stars (e.g., 4.5).
  - `is_rewatch`: `BOOLEAN` — Tracks if the movie has been seen before.
  - `liked`: `BOOLEAN` — Personal "like" for the film.
  - `review`: `TEXT` — The user's written thoughts.
  - `watched_on`: `DATE` — When the user watched it.
- **Constraint**: `UNIQUE(user_id, tmdb_id)` ensures only one log per movie per user (Upsert pattern).

### 3. `public.watchlist`
Simple storage for movies users intend to watch.
- **Columns**: `tmdb_id`, `movie_title`, `poster_path`.
- **Logic**: Linked to profiles via `user_id`.

### 4. `public.follows`
Enables the social graph.
- **Columns**: `follower_id`, `following_id`.
- **Constraint**: Self-following is blocked by a database-level `CHECK`.

### 5. `public.review_likes`
Allows users to like reviews written by others in the `activity_feed`.
- **Columns**: `user_id`, `log_id`.

---

## 🧠 Advanced Database Features

### 🛡️ Row Level Security (RLS)
Security is baked into the database layer, not just the frontend:
- **Global Read**: All tables (except internal auth) have a `SELECT` policy allowing `true`. This enables public profiles and feeds.
- **Owner-Only Write**: `INSERT`, `UPDATE`, and `DELETE` operations are restricted using `auth.uid() = user_id`.

### ⚡ Automated Triggers
- **`handle_new_user()`**: A PL/pgSQL function triggered `AFTER INSERT` on `auth.users`. It extracts metadata (username/avatar) and populates the `public.profiles` table instantly.

### 📊 Security-Invoker Views
Views are used to simplify complex joins and aggregations while respecting RLS:
- **`activity_feed`**: Joins `film_logs` with `profiles` and calculates `like_count`.
- **`profile_stats`**: A high-performance view that calculates `films_logged`, `watchlist_count`, `followers_count`, and `following_count` in a single query.

---

## 🛠️ How to Utilize (Frontend API)

All database interactions are encapsulated in the `SL.Store` namespace within `store.js`.

### 1. Logging a Film
```javascript
await SL.Store.logs.upsert(tmdbId, "Inception", "/path.jpg", {
  rating: 4.5,
  review: "Mind-bending!",
  liked: true,
  rewatch: false
});
```

### 2. Fetching the Activity Feed
```javascript
// Get global feed
const feed = await SL.Store.feed.global(0, 20);

// Get feed only from people you follow
const followingFeed = await SL.Store.feed.following();
```

### 3. Social Interactions
```javascript
// Toggle a follow
await SL.Store.follows.toggle(targetUserId);

// Check if following
const isFollowing = await SL.Store.follows.isFollowing(targetUserId);
```

---

## 📋 Database Maintenance & Migrations

When making changes to the database, use the following migration files located in the root:
1. `supabase-schema.sql`: The foundation. Run this first on new projects.
2. `supabase-migration-rewatch.sql`: Adds rewatch columns to existing data.
3. `supabase-migration-half-star-ratings.sql`: Converts integer ratings to decimals.
4. `supabase-one-for-all-cleanup.sql`: A consolidated script to synchronize all tables and views to the latest version.

> [!TIP]
> Always run the **One-For-All Cleanup** script if you notice the `activity_feed` or `profile_stats` views are missing columns after an update.
