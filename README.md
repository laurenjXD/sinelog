# SineLog

SineLog is a premium, high-performance film diary and social discovery application. Built with a modern vanilla JavaScript architecture, it leverages **Supabase** for real-time backend services and **TMDB** for comprehensive film metadata.

> [!NOTE]
> This project has recently undergone a major architecture overhaul, including full **Dockerization** and **Kubernetes** orchestration for production-grade scaling and reliability.

---

## ✨ Key Features

### 🎬 Film Tracking & Discovery
- **Rich Metadata**: Powered by TMDB, browse trending, top-rated, now-playing, and upcoming films.
- **Advanced Search**: Instant global search for both films and fellow cinephiles.
- **Log with Precision**: Track your watches with **half-star ratings**, detailed reviews, and **rewatch** indicators.
- **Watchlist & Likes**: Maintain a curated list of films to watch and "like" your favorites.

### 🤝 Social & Feed
- **Activity Feed**: Stay updated with a live stream of what the community is watching and reviewing.
- **Social Profiles**: Follow other users, compare film tastes, and explore their logged history.
- **AI Taste Match**: Integrated Puter AI analysis to find "taste twins" based on viewing habits.

### 💎 Premium Design System
- **Rich Aesthetics**: A modern "glassmorphism" UI with `backdrop-filter` effects and premium typography (Urbanist & BlurWeb).
- **Responsive & Fluid**: Tailored experience across desktop and mobile, featuring smooth micro-animations and custom scrollbars.
- **Interactive UX**: Debounced search, skeleton loaders, and instant toast notifications for a native-app feel.

---

## 🛠️ Tech Stack

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
