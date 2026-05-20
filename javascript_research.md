# SineLog — JavaScript Architecture Research

SineLog is built as a **Single Page Application (SPA)** using a modular "Namespace Pattern" in vanilla JavaScript. This approach avoids global namespace pollution while ensuring all modules can communicate through a central `SL` object.

---

## 🏗️ Core Architecture: The `SL` Namespace

The entire application is contained within `window.SL`. This ensures that all components, utilities, and states are organized and easily accessible.

### 1. `app.js` (The Backbone)
The application shell and core utilities:
- **Router**: A custom client-side router (`SL.Router`) that integrates fully with the browser's native History API (`pushState` / `popstate`), ensuring deep linking and back-button functionality work seamlessly across the SPA.
- **Config**: Manages API keys (TMDB, Supabase) and base URLs.
- **Helpers**: 
  - `SL.img`: Generates TMDB image URLs with fallback posters.
  - `SL.fmt`: Formatting for dates, runtimes, and ratings.
  - `SL.esc`: Basic XSS protection via HTML escaping.
  - `SL.toast`: Global notification system.

---

## 📦 Module Breakdown

### 🔐 `SL.Auth` (`auth.js`)
Handles everything related to user identity:
- **State Management**: Tracks the current `user` and `session`.
- **UI Panels**: Renders the login and signup modals.
- **Supabase Integration**: Wraps Supabase Auth methods (`signIn`, `signUp`, `signOut`).

### 🎬 `SL.TMDB` (`tmdb.js`)
The bridge to The Movie Database API:
- **Trending/Discover**: Methods to fetch the hero movie and home page rows.
- **Search**: Multi-query search for movies.
- **Details**: Fetches deep metadata (cast, genres, runtime) for the movie modal.

### 💾 `SL.Store` (`store.js`)
The Database Access Layer (DAL):
- **CRUD**: Encapsulates all interactions with Supabase tables (`film_logs`, `watchlist`, etc.).
- **Feed Logic**: Specialized methods for fetching global vs. "following" activity feeds.

### 🧭 `SL.Nav` (`nav.js`)
The global navigation component:
- **Active States**: Automatically highlights the current page link.
- **Global Search**: Features a debounced search input that finds both movies and users in real-time.
- **Mobile Dropdown**: Manages the glassmorphism hamburger menu and profile avatars across responsive viewports.

---

## 🖼️ UI & View Pattern

### Page Views (`ui/*.js`)
Each page (Home, Feed, Profile, Browse) is a standalone module registered with the router:
- **`register(name, renderFn)`**: Pages are registered in `app.js`.
- **Rendering**: Views generate dynamic HTML strings and inject them into the `#app` container.

### The Movie Modal (`modal.js`)
The most complex UI component in the app:
- **Stateful**: Manages the "Log" vs "Detail" view states.
- **Dynamic & Responsive**: Utilizes sticky exit buttons and dynamic viewport height (`dvh`) units to ensure flawless rendering across mobile screens without bottom-bar cutoff.
- **Interactive**: Handles star-rating selections, spoiler toggles, rewatch flags, and review submissions.

---

## 🔌 External Dependencies

SineLog stays "lightweight" by using minimal external libraries, all loaded via CDN:

1.  **[Supabase JS SDK](https://supabase.com/docs/reference/javascript/introduction)**: Primary backend integration (Auth + Postgres).
2.  **[Tailwind CSS](https://tailwindcss.com/)**: Used sparingly for rapid utility-based layout adjustments (the primary design is in `styles.css`).
3.  **[Puter.js](https://puter.com/docs/ai)** (Optional): Integrated for AI-driven "Taste Match" analysis.
4.  **Google Fonts**: Loads `Urbanist`, `Bebas Neue`, and `DM Sans` for the premium typography system.

---

## 💡 Key Design Patterns Used

- **Module Pattern**: Used in every script (e.g., `SL.Auth = (() => { ... })();`) to create private scopes and public APIs.
- **Debouncing**: Used in `nav.js` and `search-page.js` to limit API calls during typing.
- **Event Delegation**: Efficiently handles clicks on movie posters and buttons within dynamically rendered rows.
- **Skeleton Loaders**: Provides perceived performance while TMDB images and Supabase data load.
