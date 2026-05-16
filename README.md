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

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Glassmorphism / Design System)
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (Postgres, Auth, RLS)
- **API**: [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api)
- **AI**: Puter.js for intelligent taste analysis
- **DevOps**: Docker, Nginx, Kubernetes (Docker Desktop / K8s)

---

## 🏗️ Project Architecture

```
sinelog/
├── assets/                  # Fonts and static branding
├── k8s/                     # Kubernetes Manifests (Deployment, Service, etc.)
├── ui/                      # Modular view components (home, profile, feed)
├── app.js                   # Application shell & Router configuration
├── auth.js                  # Supabase Authentication logic
├── store.js                 # Supabase Database & Store wrapper
├── tmdb.js                  # TMDB API Integration
├── modal.js                 # Global Movie Details & Logging Modal
├── nav.js                   # Premium Navigation & Search logic
├── styles.css               # Core Design System & UI Tokens
├── Dockerfile               # High-performance Nginx multi-stage build
└── DEPLOYMENT.md            # Comprehensive Kubernetes Guide
```

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
- Create a new project on [Supabase](https://supabase.com/).
- Execute `supabase-schema.sql` in the SQL Editor to initialize the core tables.
- **Important**: Apply the recent migrations in order:
  1. `supabase-migration-rewatch.sql` (Rewatch tracking)
  2. `supabase-migration-half-star-ratings.sql` (Half-star support)
  3. `supabase-migration-security-invoker-views.sql` (RLS Security)

### 2. Configuration
Add your API keys to `SL.CONFIG` in `app.js`:
```js
SL.CONFIG = {
  TMDB_KEY: 'your_tmdb_v3_api_key',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON: 'your_supabase_anon_key',
};
```

### 3. Local Development
Simply serve the root directory using any static web server (e.g., Live Server, `npx serve`).

---

## 🐳 Production Deployment

### Docker
The application is optimized for containerization using a multi-stage Nginx build:
```bash
docker build -t sinelog:latest .
docker run -p 8080:8080 sinelog:latest
```

### Kubernetes
For orchestration, self-healing, and scaling, refer to the [**Kubernetes Deployment Guide (DEPLOYMENT.md)**](file:///d:/downloads%20gyatt/sinelog-complete/sinelog/DEPLOYMENT.md).

**Quick Deploy:**
```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

---

## 📜 Rubric & Implementation Details

- **JavaScript Logic**: Modular namespace pattern (`SL.*`) ensuring no global namespace pollution.
- **Security**: Row Level Security (RLS) and `security_invoker` views for safe data access.
- **UX Excellence**: Empty states, error boundaries, and accessibility-aware components.
- **Orchestration**: Production-ready K8s setup with NetworkPolicies, PDBs, and HPAs.
