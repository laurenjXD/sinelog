# SineLog Integration Script: Connecting the App to the Database

This presentation/video script details *how* SineLog technically implements the connection between the Vanilla JavaScript frontend and the Supabase PostgreSQL database.

---

## Slide 1: Introduction to Database Integration
**Visual:** 
*   Title: "SineLog Database Integration: Under the Hood"
*   Icons: JavaScript logo + Supabase logo.

**Speaker Notes:**
> "In the previous presentation, we looked at the database architecture. Now, we are going to look at the exact implementation details. How does a Vanilla JavaScript application securely and efficiently talk to a PostgreSQL database without a backend server? Let's dive into the code."

---

## Slide 2: The Supabase JS Client
**Visual:** 
*   Code snippet showing the initialization of the Supabase client:
    ```javascript
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._supabase = supabase;
    ```

**Speaker Notes:**
> "The foundation of our integration is the official Supabase JavaScript client. This library is loaded directly into the browser. We initialize it with our public URL and an 'Anon Key'. 
> 
> Because this key is public, it relies entirely on our Row Level Security policies to keep data safe. We attach this initialized client to the global `window` object so it can be accessed anywhere in the app via a helper function `sb()`."

---

## Slide 3: Authentication as the Foundation (`SL.Auth`)
**Visual:** 
*   Code snippet showing `SL.Auth.uid()` checking the session.
    ```javascript
    const uid = SL.Auth.uid();
    if (!uid) throw new Error('Sign in to log films');
    ```

**Speaker Notes:**
> "Before we write any data, we need to know who the user is. Our `SL.Auth` module manages the active user session. Whenever an API call is made that modifies data, we first check `SL.Auth.uid()`. 
> 
> If the user is logged in, the Supabase client automatically attaches their secure JWT token to the HTTP headers of every request. This token is what the PostgreSQL database uses to validate the Row Level Security."

---

## Slide 4: The Data Abstraction Layer (`SL.Store`)
**Visual:** 
*   A diagram showing: UI Components → `SL.Store` → Supabase Client → Database.
*   Snippet showing module namespaces: `logs`, `watchlist`, `feed`, etc.

**Speaker Notes:**
> "We don't want our UI components making raw database queries. That would create messy code. Instead, we built a centralized abstraction layer called `SL.Store` (located in `store.js`).
> 
> `SL.Store` is organized into namespaces like `logs`, `watchlist`, and `feed`. The UI simply calls a method like `SL.Store.logs.upsert()`, and the Store handles the actual Supabase query formatting, error handling, and data mapping. This keeps our UI logic completely separated from our database logic."

---

## Slide 5: Writing Data (The Upsert Pattern)
**Visual:** 
*   Code snippet from `store.js` showing an insert/update:
    ```javascript
    await sb().from('film_logs').upsert({
      user_id: uid,
      tmdb_id: tmdbId,
      rating: rating,
      review: review
    }, { onConflict: 'user_id,tmdb_id' });
    ```

**Speaker Notes:**
> "When a user logs a film, we use an `upsert` operation. This is incredibly powerful. The database checks if a log for this specific user and this specific movie already exists. 
> 
> If it doesn't exist, it `INSERTs` a new row. If it *does* exist, it `UPDATEs` the existing row. This means the client doesn't have to run a 'Check if exists' query first, halving the network traffic and preventing race conditions."

---

## Slide 6: Reading Data (Querying Views)
**Visual:** 
*   Code snippet showing the fetching of the activity feed:
    ```javascript
    const { data } = await sb().from('activity_feed')
      .select('*')
      .range(from, from + pageSize - 1);
    ```

**Speaker Notes:**
> "Fetching data is equally streamlined. Remember the SQL Views we discussed in the architecture overview? Here is where they shine.
> 
> Instead of writing a complex join in JavaScript, our `SL.Store.feed.global()` function simply selects everything from the `activity_feed` view. We also append a `.range()` modifier to implement pagination directly at the database level, ensuring we only download 20 records at a time."

---

## Slide 7: Connecting to the UI
**Visual:** 
*   Code snippet showing a UI event listener:
    ```javascript
    button.addEventListener('click', async () => {
        await SL.Store.logs.upsert(id, title, poster, data);
        renderSuccessToast();
    });
    ```

**Speaker Notes:**
> "Finally, how does the user trigger this? In our UI JavaScript files (like `ui/modal.js`), we attach standard event listeners to buttons. 
> 
> Because `SL.Store` methods return Promises, our UI code uses `async/await`. When a user clicks 'Save', the UI waits for `SL.Store` to finish the network request. Once it resolves successfully, the UI triggers a success toast notification and updates the DOM."

---

## Slide 8: Summary
**Visual:** 
*   Bullet points summarizing the implementation.

**Speaker Notes:**
> "To summarize our implementation:
> 1. We use the Supabase JS client for direct, serverless communication.
> 2. `SL.Auth` handles sessions and passes secure JWTs automatically.
> 3. `SL.Store` acts as a clean abstraction layer between the UI and the database.
> 4. We rely heavily on PostgreSQL features like `upsert` and `views` to minimize network requests and maximize performance."
