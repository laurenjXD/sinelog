# SineLog Business Rules

These business rules are directly derived from the Entity-Relationship Diagram (ERD) and define the structural constraints and relationships of the SineLog system data.

## 1. Users and Profiles
*   **1.1. 1:1 Profile Mapping:** Every authenticated user (`AUTH_USERS`) **must** have exactly one public profile (`PROFILES`).
*   **1.2. Profile Ownership:** A profile **must** belong to exactly one authenticated user. A profile cannot exist without a backing authentication record.

## 2. Film Logging (Diary)
*   **2.1. Log Ownership:** A profile **can** create zero or many film logs (`FILM_LOGS`). 
*   **2.2. Single Author:** Every film log **must** be created by exactly one profile. It cannot be anonymously authored.
*   **2.3. Movie Association:** A film log **must** be tied to a specific external entity (a movie, identified by `tmdb_id`).
*   **2.4. (Implicit Rule) Unique Logs:** A user should typically only have one active log entry per movie per specific watch date (enforced at the database level to prevent duplicates).

## 3. Watchlist
*   **3.1. Watchlist Ownership:** A profile **can** add zero or many movies to their watchlist (`WATCHLIST`).
*   **3.2. Private/Single Owner:** Every watchlist entry **must** belong to exactly one profile. 
*   **3.3. Movie Association:** A watchlist entry **must** be tied to a specific movie (identified by `tmdb_id`).

## 4. Social Graph (Following)
*   **4.1. Following Others:** A profile **can** follow zero or many other profiles.
*   **4.2. Being Followed:** A profile **can** be followed by zero or many other profiles.
*   **4.3. Follow Definition:** A follow relationship (`FOLLOWS`) **must** involve exactly one `follower_id` (the person following) and one `following_id` (the person being followed).

## 5. Review Reactions (Likes/Dislikes)
*   **5.1. Giving Reactions:** A profile **can** react to zero or many film logs (`REVIEW_LIKES`).
*   **5.2. Receiving Reactions:** A film log **can** receive zero or many reactions.
*   **5.3. Reaction Ownership:** Every reaction **must** be made by exactly one profile and **must** be attached to exactly one film log.
*   **5.4. Reaction Type:** A reaction **must** specify its type (e.g., "like" or "dislike").

## 6. Review Comments
*   **6.1. Writing Comments:** A profile **can** write zero or many comments (`REVIEW_COMMENTS`) on various film logs.
*   **6.2. Receiving Comments:** A film log **can** have zero or many comments attached to it.
*   **6.3. Comment Ownership:** Every comment **must** be authored by exactly one profile and **must** belong to exactly one film log.
