# SineLog — System Overview

## 1. System Planning
SineLog is designed as a modern, client-side Single Page Application (SPA) that interfaces directly with a Backend-as-a-Service (BaaS) and external APIs. The architecture eliminates the need for a custom Node.js or Java backend server, reducing infrastructure complexity and allowing the browser to act as the primary orchestrator.

The system relies on a **client-service model**:
- **Frontend**: A Vanilla JavaScript SPA served by Nginx.
- **Backend & Data**: Supabase provides a PostgreSQL database, authentication, and Row Level Security (RLS) to ensure data integrity without an intermediary API layer.
- **Deployment**: The application is containerized using Docker and orchestrated via Kubernetes for scalable local and cloud deployments.

## 2. Key Features and Functionalities
- **Movie Discovery**: Search for movies, view detailed metadata, cast information, and trailers powered by the TMDB API.
- **Film Logging & Diary**: Log films with half-star ratings, review text, "liked" status, rewatch indicators, spoiler tags, and watch dates.
- **Activity Feed**: View a global and following-only social feed displaying recent film logs from users across the platform.
- **Social Interactions**: Follow other users, like/dislike reviews, and leave threaded comments on logs.
- **Watchlist**: Save movies to a personal watchlist for future viewing.
- **User Profiles**: View personal stats (films logged, watchlist size, followers) and historical diary activity.
- **AI Taste Match**: An experimental feature using Puter AI to compare a user's movie taste (based on their recent logs) against the current movie they are viewing.

## 3. Tools and Technologies Used
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (Glassmorphism design, custom CSS variables, no heavy frameworks).
- **Backend/Database**: Supabase (PostgreSQL database, Supabase Auth).
- **External APIs**: 
  - TMDB API (Movie metadata, search, cast, trailers, posters).
  - Puter.js AI API (Taste match analysis and chat completion).
- **Infrastructure & Deployment**: 
  - Docker (Multi-stage builds using `nginx:alpine`).
  - Kubernetes (Deployments, Services, ConfigMaps, Secrets, Horizontal Pod Autoscalers).
  - Nginx (Web server and reverse proxy for serving static assets).

## 4. Database
SineLog utilizes PostgreSQL (via Supabase) with strong Row Level Security (RLS). This ensures users can only modify their own data while allowing public reads for social features, effectively trusting the database to handle authorization.

### Core Schema
- `profiles`: Extended user data (username, avatar, bio). Automatically synced via a trigger when a new user signs up.
- `film_logs`: The core diary table storing TMDB ID, ratings, reviews, dates, and spoiler flags. Enforces unique entries per user per film.
- `watchlist`: Stores films that users intend to watch.
- `follows`: Manages the social graph (follower/following relationships).
- `review_likes`: Tracks user reactions (likes/dislikes) on film logs.
- `review_comments`: Threaded comments on user reviews.

### Entity-Relationship Diagram (ERD)
```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has profile"
    PROFILES ||--o{ FILM_LOGS : "creates"
    PROFILES ||--o{ WATCHLIST : "adds to"
    PROFILES ||--o{ FOLLOWS : "follows (as follower_id)"
    PROFILES ||--o{ FOLLOWS : "is followed by (as following_id)"
    PROFILES ||--o{ REVIEW_LIKES : "reacts"
    PROFILES ||--o{ REVIEW_COMMENTS : "writes"
    
    FILM_LOGS ||--o{ REVIEW_LIKES : "receives"
    FILM_LOGS ||--o{ REVIEW_COMMENTS : "has"

    AUTH_USERS {
        uuid id PK
        string email
    }
    
    PROFILES {
        uuid id PK "FK to auth.users"
        string username
        string display_name
        string avatar_url
        string bio
    }
    
    FILM_LOGS {
        uuid id PK
        uuid user_id FK
        int tmdb_id
        string movie_title
        string poster_path
        decimal rating
        text review
        boolean liked
        boolean is_rewatch
        boolean has_spoilers
        date watched_on
        timestamp created_at
    }
    
    WATCHLIST {
        uuid id PK
        uuid user_id FK
        int tmdb_id
        string movie_title
        string poster_path
        timestamp created_at
    }
    
    FOLLOWS {
        uuid follower_id PK, FK
        uuid following_id PK, FK
        timestamp created_at
    }
    
    REVIEW_LIKES {
        uuid id PK
        uuid user_id FK
        uuid log_id FK
        string reaction_type "like / dislike"
        timestamp created_at
    }
    
    REVIEW_COMMENTS {
        uuid id PK
        uuid log_id FK
        uuid user_id FK
        text comment_text
        timestamp created_at
    }
```

### Views (Security Invoker)
- `activity_feed`: Pre-joins logs, profiles, and interaction counts to optimize client-side data fetching and prevent N+1 queries.
- `profile_stats`: Aggregates user metrics (e.g., total films logged, follower counts).

## 5. Detailed System Flow

### Overall System Architecture Flow
```mermaid
graph TD
    User((User)) -->|HTTPS| Nginx[Nginx Web Server]
    Nginx -->|Serves Static Files| Browser[Vanilla JS SPA]
    
    Browser -->|REST: Search & Details| TMDB[TMDB API]
    Browser -->|REST: Auth & DB Queries| Supabase[Supabase PostgreSQL]
    Browser -->|REST: AI Inference| Puter[Puter AI API]
```

### Film Logging Flow
When a user decides to log a film from the movie modal:
```mermaid
flowchart TD
    Start([User clicks "Log Film"]) --> Fill[Fill form: Rating, Review, Dates]
    Fill --> Val{Is input valid?}
    Val -- No --> Error[Show validation error]
    Val -- Yes --> CallStore[SL.Store.logs.upsert]
    CallStore --> API[Send REST request with JWT]
    API --> DB[(Supabase PostgreSQL)]
    DB --> RLS{RLS Check pass?}
    RLS -- No --> AuthErr[Reject insert]
    RLS -- Yes --> Write[UPSERT into public.film_logs]
    Write --> Ret[Return inserted row]
    Ret --> Toast[Display success toast]
    Toast --> UpdateUI[Update modal UI state]
    UpdateUI --> End([End Flow])
```

### Activity Feed Loading Flow
When a user navigates to the Home/Feed page:
```mermaid
flowchart TD
    Start([User opens Feed Page]) --> Fetch[SL.Store.feed.global]
    Fetch --> Query[Query Supabase: SELECT * FROM activity_feed]
    Query --> DB[(PostgreSQL Database)]
    DB --> Ret[Return pre-joined feed rows]
    Ret --> Process[Map data to JS objects]
    Process --> Loop[Iterate over feed items]
    Loop --> HasSpoiler{has_spoilers == true?}
    HasSpoiler -- Yes --> Blur[Apply spoiler blur CSS class]
    HasSpoiler -- No --> Render[Render standard card]
    Blur --> Dom[Append to DOM container]
    Render --> Dom
    Dom --> End([Feed Rendered])
```

### Movie Search and View Flow
When a user searches for a movie using the navigation bar:
```mermaid
flowchart TD
    Start([User types in search bar]) --> Debounce[Debounce input 300ms]
    Debounce --> CallTMDB[GET /search/movie]
    CallTMDB --> TMDB_API{{TMDB API}}
    TMDB_API --> Results[Return movie list]
    Results --> Dropdown[Render search dropdown results]
    Dropdown --> Click[User clicks a specific movie]
    Click --> Modal[Open Movie Modal with TMDB ID]
    Modal --> FetchDetails[GET /movie/ID with append_to_response=videos]
    FetchDetails --> TMDB_API
    TMDB_API --> Details[Return details & trailer keys]
    Details --> Render[Render hero image, poster, and cast details]
    Render --> End([Movie View Active])
```

### Authentication Flow (Sign Up / Sign In)
```mermaid
flowchart TD
    Start([User Submits Sign Up Form]) --> Val{Valid Email & Pass?}
    Val -- No --> ShowErr[Show Client Error]
    Val -- Yes --> CallAuth[Call signUp API method]
    CallAuth --> AuthNode{{Supabase Auth Service}}
    AuthNode --> CreateUser[Create User in auth.users]
    CreateUser --> Trigger{Postgres Trigger}
    Trigger --> InsertProfile[INSERT INTO public.profiles]
    InsertProfile --> RetSession[Return Auth Session]
    RetSession --> UpdateState[Update JS Global Session State]
    UpdateState --> Rerender[Rerender Navbar & UI for logged in]
    Rerender --> End([User is Authenticated])
```

### Social Interaction Flow (Follow & React)
```mermaid
flowchart TD
    Start1([User Clicks Follow Button]) --> ToggleFollow[Call SL.Store.follows.toggle]
    ToggleFollow --> AuthCheck1{User Logged In?}
    AuthCheck1 -- No --> PromptLogin[Show Login Modal]
    AuthCheck1 -- Yes --> DBFollow[(Supabase Database)]
    DBFollow --> CheckExisting{Row Exists?}
    CheckExisting -- Yes --> DeleteFollow[DELETE from public.follows]
    CheckExisting -- No --> InsertFollow[INSERT into public.follows]
    DeleteFollow --> UpdateBtn[Update Button: Follow]
    InsertFollow --> UpdateBtn2[Update Button: Following]
    
    Start2([User Clicks Like Button]) --> ToggleReact[Call SL.Store.reactions.toggle]
    ToggleReact --> AuthCheck2{User Logged In?}
    AuthCheck2 -- No --> PromptLogin
    AuthCheck2 -- Yes --> DBReact[(Supabase Database)]
    DBReact --> UPSERT[UPSERT / DELETE public.review_likes]
    UPSERT --> UpdateCount[Increment/Decrement UI Counter]
```

### AI Taste Match Flow
```mermaid
flowchart TD
    Start([User Clicks 'Taste Match']) --> ShowLoad[Show Loading Indicator]
    ShowLoad --> FetchDB[Fetch user's top rated logs]
    FetchDB --> DB[(Supabase public.film_logs)]
    DB --> RetDB[Return list of favorite films]
    RetDB --> FetchTMDB[Fetch current movie keywords]
    FetchTMDB --> TMDB{{TMDB API}}
    TMDB --> BuildPrompt[Construct AI Prompt text]
    BuildPrompt --> CallAI[Call puter.ai.chat]
    CallAI --> AI{{Puter AI Inference}}
    AI --> Stream{Streaming Response?}
    Stream -- Chunk Received --> UpdateUI[Append text to modal]
    UpdateUI --> Stream
    Stream -- Done --> Format[Format Markdown to HTML]
    Format --> End([Analysis Complete])
```
