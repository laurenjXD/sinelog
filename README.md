# SineLog

SineLog is a premium film diary and social discovery application. Built with a **vanilla JavaScript SPA** architecture, it uses **Supabase** for auth and data and **TMDB** for film metadata.

> [!NOTE]
> The project includes **Docker** and **Kubernetes** deployment for production-style hosting. See [DEPLOYMENT.md](DEPLOYMENT.md) for cluster demos and [PRESENTATION.md](PRESENTATION.md) for system and live-demo flows.

---

## Key Features

### Film tracking and discovery
- **Rich metadata** from TMDB: trending, top-rated, now-playing, upcoming, genre browse
- **Global search** for films and users (debounced navbar search)
- **Log films** with half-star ratings, reviews, rewatch flag, spoiler flag, and watched date
- **Watchlist** and per-film **like** toggle
- **Trailer** button on the movie modal (YouTube, from TMDB videos)

### Social and feed
- **Activity feed** of community logs and reviews
- **Like / dislike** and **comments** on feed reviews
- **Spoiler protection** — flagged reviews blur until revealed
- **Profiles** with follow, stats, logs, likes, and watchlist tabs
- **AI taste match** (Puter) — optional comparison to your watch history

### Design and UX
- Glassmorphism UI, responsive layout, custom modal scrollbars
- Client-side router with **History API** deep links (`#home`, `#feed`, `#profile?…`)
- Loaders, empty states, toasts, disabled states during saves

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, vanilla JavaScript (`SL` namespace modules) |
| Auth & DB | Supabase (Postgres + Row Level Security) |
| Metadata | TMDB REST API |
| AI (optional) | Puter.js |
| Hosting | Nginx static server, Docker, Kubernetes |

---

## Project Structure

```
sinelog/
├── index.html          # SPA shell, script load order, bootstrap
├── app.js              # Config, router, utilities, toast
├── tmdb.js             # TMDB API wrapper
├── auth.js             # Supabase Auth + auth panel UI
├── store.js            # Supabase data access (logs, feed, social)
├── nav.js              # Navbar + global search
├── modal.js            # Movie detail modal, logging, taste match
├── styles.css          # Design system and responsive layout
├── ui/
│   ├── home.js         # Discover / trending home
│   ├── feed.js         # Activity feed + reactions
│   ├── profile.js      # User profiles + taste match
│   └── search-page.js  # Browse / genre discovery
├── supabase-schema.sql
├── supabase-migration-*.sql
├── k8s/                # Kubernetes manifests
├── Dockerfile
└── docs (*.md)
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [PRESENTATION.md](PRESENTATION.md) | **System flow** and **demonstration flow** for presentations |
| [system_design.md](system_design.md) | Architecture, data flows, infrastructure |
| [javascript_research.md](javascript_research.md) | JavaScript modules, patterns, and APIs |
| [research.md](research.md) | Database schema and Supabase usage |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Kubernetes build, deploy, and cluster demos |

---

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Run `supabase-schema.sql` in the SQL editor (fresh project).
3. Apply migrations as needed: spoilers, feed interactions, rewatch, half-star ratings (see [research.md](research.md)).
4. Create a [TMDB](https://www.themoviedb.org/settings/api) API key.
5. Configure keys in `app.js` for local dev, or via `env-config.js` when using Docker/K8s:

```js
SL.CONFIG = {
  TMDB_KEY: 'your_tmdb_v3_api_key',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON: 'your_supabase_anon_key',
};
```

6. Serve the folder (e.g. `npx serve .`) or open through your deployed URL.

---

## Demo Checklist

Before presenting, verify:

- [ ] App loads with no console syntax errors
- [ ] Home shows trending rows and hero film
- [ ] Search opens the movie modal
- [ ] Trailer opens YouTube in a new tab
- [ ] Sign up / sign in works
- [ ] Log film: rating, review, date, spoilers flag
- [ ] Update existing log preserves fields
- [ ] Watchlist toggle shows toast
- [ ] Feed loads; like/dislike and comments work when signed in
- [ ] Profile shows logs, reviews, likes, watchlist
- [ ] Browser back/forward navigates SPA routes
- [ ] Layout usable on desktop and mobile widths

Full presenter script: [PRESENTATION.md § Demonstration Flow](PRESENTATION.md#3-demonstration-flow--live-presentation-script).

---

## Known Limitations

- AI taste match depends on Puter availability and prior logged films.
- TMDB and Supabase keys must be configured; the app shows a setup screen if TMDB is missing.
- Feed reactions and comments require the corresponding Supabase migrations.

---

## Rubric Alignment

- **Functionality:** Browse, auth, logging, watchlist, feed, profile, social reactions, taste matching.
- **JavaScript:** Modular `SL.*` namespaces, router, async fetch, DOM rendering, event handling.
- **UI:** Responsive modal, profile tabs, poster grids, glass design system.
- **UX:** Loaders, empty states, toasts, auth prompts, spoiler blur, debounced search.
- **Code quality:** Files split by responsibility, SQL schema/migrations, documented flows.
