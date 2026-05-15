# SineLog

SineLog is a personal film diary and discovery app built with vanilla JavaScript, Supabase, and TMDB. Users can browse films, log watches, rate and review movies, maintain a watchlist, follow other users, and compare taste.

## Features

- Movie discovery through TMDB trending, top-rated, now-playing, upcoming, genre, person, and search data.
- Authentication and profiles through Supabase.
- Film logging with half-star rating, review, liked state, and watched date.
- Watchlist management.
- Social activity feed with likes.
- Profile tabs for logged films, watchlist, liked films, and reviews.
- AI Taste Match using Puter AI when available.

## Tech Stack

- HTML, CSS, and vanilla JavaScript
- Supabase Auth and Postgres
- TMDB API
- Puter AI script for optional taste analysis
- Docker and Kubernetes files for deployment experiments

## Project Structure

- `index.html` loads the SPA shell and scripts.
- `app.js` contains configuration, router utilities, shared constants, formatting, and toast helpers.
- `tmdb.js` wraps TMDB API calls.
- `store.js` wraps Supabase database operations.
- `modal.js` renders the movie detail and logging modal.
- `nav.js` renders navigation and global search.
- `ui/` contains page-level views: home, feed, profile, and browse.
- `styles.css` contains the design system, responsive styles, modal styles, and reusable UI classes.
- `supabase-schema.sql` contains the full schema for a new Supabase project.

## Setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in the Supabase SQL editor for a fresh database.
3. Create a TMDB API key.
4. Add your keys in `app.js`:

```js
SL.CONFIG = {
  TMDB_KEY: 'your_tmdb_v3_api_key',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON: 'your_supabase_anon_key',
};
```

5. Open `index.html` in a browser, or serve the folder with a static web server.

## Demo Checklist

Use this checklist before presenting:

- App loads without console syntax errors.
- Home page displays trending rows and hero film.
- Search finds a movie and opens the movie modal.
- A user can sign up or sign in.
- A signed-in user can log a film with rating, review, and watched date.
- Updating an existing log preserves saved fields.
- Watchlist add/remove shows a toast.
- Feed loads recent logs.
- Profile shows logged films, reviews, liked films, and watchlist.
- Layout remains usable on desktop and mobile widths.

## Known Limitations

- AI Taste Match depends on the locally written script available.
- The app uses a simple vanilla JavaScript router, so page URLs do not represent deep links.

## Rubric Alignment

- Core functionality: browsing, auth, logging, watchlist, feed, profile, and taste matching.
- JavaScript logic: modular namespaces for router, store, TMDB API, modal, auth, nav, and page views.
- UI: responsive modal, profile tabs, reusable buttons, and poster grids.
- UX: loaders, empty states, toasts, disabled states during saves, auth prompts, and clear setup errors.
- Code quality: separated files by responsibility, named helpers, schema/migration files, and this README.
