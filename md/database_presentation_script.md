# SineLog Database & Data Flow Presentation Script

This document outlines a presentation flow (or video script) designed to explain SineLog's database architecture, how the relational models are applied, and how data flows securely between the client and the database.

---

## Slide 1: Introduction to the Architecture
**Visual:** 
*   SineLog Logo + Supabase/PostgreSQL Logo.
*   Subtitle: "A Serverless Approach to Data Management"

**Speaker Notes:**
> "Welcome. Today we're diving into the data architecture of SineLog. SineLog is built with a modern, client-centric architecture. Instead of routing data through a custom backend server like Node.js or Java, our Vanilla JavaScript frontend communicates directly with our database—a PostgreSQL instance hosted on Supabase. Let's look at how this works and how we keep it secure."

---

## Slide 2: The Core Data Flow
**Visual:** 
*   Show the updated **Core Data Flow** diagram (Input and Output flowcharts side-by-side).

**Speaker Notes:**
> "Because we don't have a middleman server, our data flow is highly streamlined. 
> 
> **On the Input side:** When a user interacts with the app—say, submitting a film review—the Vanilla JS application captures it, validates it, and uses our `SL.Store` module to send it directly to PostgreSQL.
> 
> **On the Output side:** When loading a page, the app queries the database. The database returns raw JSON data, which the application immediately uses to build the DOM elements on your screen. It’s a direct, bidirectional conversation between the browser and the database."

---

## Slide 3: The Relational Schema
**Visual:** 
*   Show a simplified version of the **Entity-Relationship Diagram (ERD)**.
*   Highlight the central `PROFILES` and `FILM_LOGS` tables.

**Speaker Notes:**
> "Let's look at the data itself. Everything in SineLog revolves around the user profile and their film logs.
> 
> When a user signs up, the authentication system triggers the creation of a row in the `profiles` table. From there, that profile branches out: it *creates* `film_logs`, *adds* movies to a `watchlist`, and *follows* other profiles. 
> 
> The `film_logs` table is the heart of the app. It connects the user to a specific TMDB movie ID, storing their rating, review, and watch dates."

---

## Slide 4: Connecting the Social Graph
**Visual:** 
*   Zoom in on the `FOLLOWS`, `REVIEW_LIKES`, and `REVIEW_COMMENTS` tables connecting to `PROFILES` and `FILM_LOGS`.

**Speaker Notes:**
> "SineLog isn't just a diary; it's a social platform. This requires strict relationship mapping. 
> 
> If you like a review, we create a record in the `review_likes` table that links your `profile_id` to the specific `log_id`. Similarly, the `follows` table simply links a `follower_id` to a `following_id`. By strictly enforcing these foreign key relationships in PostgreSQL, we guarantee that there are no 'orphaned' likes or comments if a user deletes a review."

---

## Slide 5: The Gatekeeper - Row Level Security (RLS)
**Visual:** 
*   A padlock icon over a database table.
*   Text: "Row Level Security (RLS): The Database IS the API Server."

**Speaker Notes:**
> "You might be wondering: If the browser talks directly to the database, what stops a malicious user from editing someone else's review? 
> 
> The answer is **Row Level Security (RLS)**. In a traditional app, a backend server checks if you have permission to edit a post. In SineLog, the database does this itself. Every request from the client includes a secure JWT authentication token. Before executing any `UPDATE` or `DELETE`, PostgreSQL inspects the token. If the user ID in the token doesn't match the `user_id` on that specific row of the table, the database instantly rejects the request."

---

## Slide 6: Optimizing Reads with SQL Views
**Visual:** 
*   Animation or graphic showing multiple tables (`film_logs`, `profiles`, `review_likes`) funneling into a single `activity_feed` View.

**Speaker Notes:**
> "While writing data is secure, reading data needs to be fast. If we want to render the global activity feed, we need the review text, the movie poster, the user's avatar, and the total number of likes.
> 
> If the client had to query the logs table, then query the profiles table for the avatar, and then count the likes, it would be terribly slow—this is known as the N+1 query problem. 
> 
> Instead, we use PostgreSQL **Views**. We created a view called `activity_feed` that pre-joins all this data on the database server. The client makes one single request, and the database hands back perfectly formatted, flat JSON data ready to be rendered to the screen."

---

## Slide 7: Summary & Conclusion
**Visual:** 
*   Bullet points: Direct Client-to-DB, Strict Relational Integrity, RLS Security, Optimized Views.

**Speaker Notes:**
> "To summarize, SineLog proves that you can build complex, secure, and fast social applications without a traditional backend. By leveraging PostgreSQL's relational integrity, using RLS as our security layer, and utilizing SQL views for performance, we maintain a lean, highly capable system architecture."
