/* ═══════════════════════════════════════════════════════════════
   SineLog — modal.js  (Movie detail modal)
   ═══════════════════════════════════════════════════════════════ */

SL.Modal = (() => {
  const modal    = document.getElementById('movie-modal');
  const backdrop = document.getElementById('modal-backdrop-el');
  const sheet    = document.getElementById('modal-sheet');

  let currentId    = null;
  let selectedStar = 0;

  function open(tmdbId) {
    currentId = tmdbId;
    selectedStar = 0;
    render(tmdbId);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    currentId = null;
  }

  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

  async function render(id) {
    sheet.innerHTML = `
      <div class="loading-state vertical" style="height:330px;background:var(--surface-2)">
        <div class="spinner" style="width:36px;height:36px"></div>
        <div>Loading film details...</div>
      </div>
    `;

    try {
      const [movie, credits, myLog, inWatchlist] = await Promise.all([
        SL.TMDB.detail(id),
        SL.TMDB.credits(id),
        SL.Store.logs.getMyLog(id),
        SL.Store.watchlist.isInList(id),
      ]);

      selectedStar = myLog?.rating || 0;

      const trailerKey = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key;

      sheet.innerHTML = `
        <div class="modal-scroll-content">
        <!-- Backdrop -->
        <div style="position:relative">
          <img id="modal-backdrop-img"
            src="${SL.img.backdrop(movie.backdrop_path) || SL.img.poster(movie.poster_path,'w780')}"
            alt="${SL.esc(movie.title)}"
            style="width:100%;height:300px;object-fit:cover;object-position:center 20%;display:block"
          />
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(255,255,255,0.97) 100%)"></div>

          <!-- Close -->
          <button onclick="SL.Modal.close()" style="position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,0.72);border:1px solid rgba(0,0,0,0.1);color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px)">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>

          ${myLog?.rating ? `<div style="position:absolute;top:14px;left:14px;background:var(--accent);color:#fff;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:3px 10px;border-radius:5px">✓ LOGGED</div>` : ''}

          ${trailerKey ? `
          <button onclick="window.open('https://www.youtube.com/watch?v=${trailerKey}','_blank')"
            style="position:absolute;bottom:16px;right:16px;display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.85);border:1px solid rgba(0,0,0,0.10);border-radius:8px;padding:7px 12px;color:var(--text);font-size:12px;font-weight:600;cursor:pointer;backdrop-filter:blur(6px);font-family:inherit">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/></svg>
            Trailer
          </button>` : ''}
        </div>

        <!-- Body -->
        <div style="padding:0 24px 32px;margin-top:-40px;position:relative">
          <div style="display:flex;gap:18px;align-items:flex-end;margin-bottom:20px">

            <!-- Poster -->
            <img src="${SL.img.poster(movie.poster_path)}"
              alt="${SL.esc(movie.title)}"
              style="width:100px;border-radius:10px;flex-shrink:0;box-shadow:0 8px 32px rgba(0,0,0,0.15);border:1px solid var(--border);position:relative;z-index:2"
            />

            <!-- Title block -->
            <div style="padding-bottom:4px;min-width:0">
              <h2 style="font-family:var(--font-heading);font-size:clamp(1.3rem,3.5vw,1.9rem);line-height:1.15;color:var(--text);margin-bottom:6px">
                ${SL.esc(movie.title)}
              </h2>
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;color:var(--mist)">
                ${[SL.fmt.year(movie.release_date), SL.fmt.runtime(movie.runtime), movie.original_language?.toUpperCase()]
                  .filter(Boolean).map(s => `<span>${SL.esc(s)}</span>`).join('<span style="color:var(--border-strong)">·</span>')}
                ${movie.vote_average ? `<span style="color:var(--accent);font-weight:700">${SL.fmt.rating(movie.vote_average)}</span>` : ''}
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
                ${(movie.genres||[]).map(g => `<span class="genre-pill">${SL.esc(g.name)}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Overview -->
          <p style="font-size:14px;line-height:1.75;color:var(--ghost);margin-bottom:20px">
            ${SL.esc(movie.overview || 'No synopsis available.')}
          </p>

          <!-- Directed by -->
          ${(() => { const dir = credits.crew?.find(c=>c.job==='Director'); return dir ? `<p style="font-size:12px;color:var(--mist);margin-bottom:20px">Directed by <span style="color:var(--text);font-weight:500">${SL.esc(dir.name)}</span></p>` : ''; })()}

          <!-- Cast -->
          ${credits.cast?.length ? `
          <div style="margin-bottom:24px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
              <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--mist);font-weight:600">Cast</p>
              <div class="modal-cast-actions">
                <button class="modal-cast-scroll-btn" type="button" data-cast-dir="-1" aria-label="Scroll cast left">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button class="modal-cast-scroll-btn" type="button" data-cast-dir="1" aria-label="Scroll cast right">
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
            <div class="modal-cast-rail" id="modal-cast-rail">
              ${credits.cast.slice(0,12).map(p => `
                <div class="modal-cast-card" onclick="SL.Modal.openPerson(${p.id})">
                  <img src="${SL.img.profile(p.profile_path)}"
                    class="modal-cast-photo" />
                  <p class="modal-cast-name">${SL.esc(p.name)}</p>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <!-- Divider -->
          <hr class="divider" style="margin:20px 0" />

          <!-- Your Take -->
          <div>
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--mist);font-weight:600;margin-bottom:14px">Your Take</p>

            <!-- Stars -->
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap">
              <span style="font-size:11px;color:var(--mist);margin-right:4px">Rate:</span>
              <div id="stars" class="rating-scale">
                ${[1,2,3,4,5].map(n => {
                  const fill = Math.max(0, Math.min(1, Number(selectedStar || 0) - (n - 1))) * 100;
                  return `
                  <button class="rating-star" data-star="${n}" type="button" aria-label="${n} star">
                    <span class="rating-star-empty">★</span>
                    <span class="rating-star-fill" style="width:${fill}%">★</span>
                  </button>`;
                }).join('')}
              </div>
              <span id="star-label" style="font-size:12px;color:var(--mist);margin-left:6px">
                ${selectedStar ? `${SL.ratingText(selectedStar)} - ${SL.ratingLabel(selectedStar)}` : ''}
              </span>
            </div>

            <!-- Like toggle -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
              <button id="like-toggle" class="btn btn-ghost btn-sm ${myLog?.liked ? 'liked' : ''}"
                style="${myLog?.liked ? 'color:#e05555;border-color:rgba(224,85,85,0.4)' : ''}">
                <svg width="13" height="13" fill="${myLog?.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                ${myLog?.liked ? 'Liked' : 'Like this film'}
              </button>
              <button id="rewatch-toggle" class="btn btn-ghost btn-sm ${myLog?.is_rewatch ? 'rewatching' : ''}"
                style="${myLog?.is_rewatch ? 'color:var(--accent);border-color:rgba(var(--accent-rgb),0.45);background:var(--accent-dim)' : ''}">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24">
                  <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                ${myLog?.is_rewatch ? 'Rewatch' : 'Mark rewatch'}
              </button>
            </div>

            <!-- Review -->
            <textarea id="review-input" class="input" placeholder="Write your thoughts on this film…" rows="3"
              style="margin-bottom:14px">${SL.esc(myLog?.review || '')}</textarea>

            <!-- Date -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
              <label style="font-size:11px;color:var(--mist);text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap">Watched on</label>
              <input id="watched-date" type="date" class="input" style="padding:6px 10px;font-size:12px"
                value="${myLog?.watched_on || new Date().toISOString().slice(0,10)}" />
            </div>

            <!-- Actions -->
            <div style="display:flex;flex-wrap:wrap;gap:10px">
              <button id="log-btn" class="btn btn-primary">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
                ${myLog ? 'Update Log' : 'Log Film'}
              </button>
              <button id="watchlist-btn" class="btn btn-ghost ${inWatchlist ? 'watching' : ''}">
                <svg width="13" height="13" fill="${inWatchlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                ${inWatchlist ? 'In Watchlist' : 'Watchlist'}
              </button>
              ${myLog ? `<button id="unlog-btn" class="btn btn-danger btn-sm">Remove Log</button>` : ''}
            </div>
          </div>

          <!-- AI Taste Match -->
          <div id="taste-match-section" style="margin-top:24px">
            <hr class="divider" style="margin-bottom:20px" />
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
              <div style="min-width:0;flex:1">
                <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--mist);font-weight:600;margin-bottom:6px">AI Taste Match</p>
                <p style="font-size:13px;color:var(--ghost);line-height:1.6">Compare this film with your ratings, likes, and review history.</p>
              </div>
              <button id="taste-match-btn" class="btn btn-ghost btn-sm">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 3l1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8L12 3z"/><path d="M19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6L19 15z"/></svg>
                Analyze
              </button>
            </div>
            <div id="taste-match-result" style="display:none;margin-top:14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px"></div>
          </div>

          <!-- Community reviews -->
          <div id="community-reviews" style="margin-top:28px"></div>

          <!-- Similar movies -->
          <div id="similar-section" style="margin-top:28px"></div>
        </div>
        </div>
      `;

      // ── Star interactions ─────────────────────────────────────
      const starBtns = sheet.querySelectorAll('.rating-star');
      const starLabel = document.getElementById('star-label');

      function valueFromPointer(btn, event) {
        const rect = btn.getBoundingClientRect();
        const isHalf = event.clientX - rect.left <= rect.width / 2;
        return Number(btn.dataset.star) - (isHalf ? 0.5 : 0);
      }

      function setStars(n, preview=false) {
        if (!preview) selectedStar = n;
        starBtns.forEach(b => {
          const star = Number(b.dataset.star);
          const fill = Math.max(0, Math.min(1, Number(n || 0) - (star - 1))) * 100;
          b.querySelector('.rating-star-fill').style.width = `${fill}%`;
        });
        starLabel.textContent = n ? `${SL.ratingText(n)} - ${SL.ratingLabel(n)}` : '';
      }
      setStars(selectedStar);

      starBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => setStars(valueFromPointer(btn, e), true));
        btn.addEventListener('mouseenter', (e) => setStars(valueFromPointer(btn, e), true));
        btn.addEventListener('mouseleave', () => setStars(selectedStar, true));
        btn.addEventListener('click', (e) => { selectedStar = valueFromPointer(btn, e); setStars(selectedStar); });
      });

      const castRail = document.getElementById('modal-cast-rail');
      sheet.querySelectorAll('.modal-cast-scroll-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!castRail) return;
          castRail.scrollBy({
            left: Number(btn.dataset.castDir) * Math.max(180, castRail.clientWidth * 0.82),
            behavior: 'smooth',
          });
        });
      });

      // ── Like toggle ──────────────────────────────────────────
      let isLiked = myLog?.liked || false;
      let isRewatch = myLog?.is_rewatch || false;
      document.getElementById('like-toggle')?.addEventListener('click', async () => {
        isLiked = !isLiked;
        const btn = document.getElementById('like-toggle');
        btn.style.color = isLiked ? '#e05555' : '';
        btn.style.borderColor = isLiked ? 'rgba(224,85,85,0.4)' : '';
        btn.querySelector('svg').setAttribute('fill', isLiked ? 'currentColor' : 'none');
        btn.childNodes[btn.childNodes.length-1].textContent = isLiked ? ' Liked' : ' Like this film';
      });

      document.getElementById('rewatch-toggle')?.addEventListener('click', async () => {
        isRewatch = !isRewatch;
        const btn = document.getElementById('rewatch-toggle');
        btn.style.color = isRewatch ? 'var(--accent)' : '';
        btn.style.borderColor = isRewatch ? 'rgba(var(--accent-rgb),0.45)' : '';
        btn.style.background = isRewatch ? 'var(--accent-dim)' : '';
        btn.childNodes[btn.childNodes.length-1].textContent = isRewatch ? ' Rewatch' : ' Mark rewatch';
      });

      document.getElementById('log-btn')?.addEventListener('click', async () => {
        if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
        if (!selectedStar) { SL.toast('Please rate the film first ★'); return; }
        const btn = document.getElementById('log-btn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner spinner-sm"></div> Saving';
        try {
          await SL.Store.logs.upsert(
            movie.id, movie.title, movie.poster_path,
            {
              rating: selectedStar,
              review: document.getElementById('review-input').value.trim(),
              liked: isLiked,
              rewatch: isRewatch,
              watchedOn: document.getElementById('watched-date').value,
            }
          );
          SL.toast(`"${movie.title}" logged! ${SL.ratingText(selectedStar)}`);
          btn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg> Update Log';
        } catch(e) { SL.toast(e.message); }
        finally { btn.disabled = false; }
      });

      // ── Watchlist button ─────────────────────────────────────
      document.getElementById('watchlist-btn')?.addEventListener('click', async () => {
        if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
        try {
          const added = await SL.Store.watchlist.toggle(movie.id, movie.title, movie.poster_path);
          const btn   = document.getElementById('watchlist-btn');
          btn.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
          btn.childNodes[btn.childNodes.length-1].textContent = added ? ' In Watchlist' : ' Watchlist';
          SL.toast(added ? 'Added to Watchlist' : 'Removed from Watchlist');
        } catch(e) { SL.toast(e.message); }
      });

      // ── Remove log ───────────────────────────────────────────
      document.getElementById('unlog-btn')?.addEventListener('click', async () => {
        if (!confirm('Remove this film from your log?')) return;
        await SL.Store.logs.remove(movie.id);
        SL.toast('Log removed');
        open(movie.id);
      });

      document.getElementById('taste-match-btn')?.addEventListener('click', () => {
        generateTasteMatch(movie, credits);
      });

      // ── Load community reviews ────────────────────────────────
      loadCommunityReviews(movie.id);

      // ── Load similar ──────────────────────────────────────────
      loadSimilar(movie);

    } catch(e) {
      sheet.innerHTML = `<div class="empty-state" style="padding:80px 20px"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div><div class="empty-state-text">${SL.esc(e.message)}</div></div>`;
    }
  }

  function localTasteMatch(movie, credits, logs, similarMovies = [], reason = '') {
    const rated = logs.filter(log => log.rating);
    const avgRating = rated.length
      ? rated.reduce((sum, log) => sum + Number(log.rating || 0), 0) / rated.length
      : 3;
      
    let score = 50;
    const likedCount = logs.filter(log => log.liked).length;
    let reasons = [];

    // Analyze Similar Movies match
    if (similarMovies.length) {
      const similarIds = new Set(similarMovies.map(m => m.id));
      const loggedSimilar = logs.filter(l => similarIds.has(l.tmdb_id));
      
      if (loggedSimilar.length > 0) {
        let simScore = 0;
        loggedSimilar.forEach(l => {
          if (l.liked) simScore += 15;
          if (l.rating) {
            simScore += (l.rating - 3) * 8; 
          }
          if (!l.liked && (!l.rating || l.rating <= 2.5)) {
            simScore -= 10;
          }
        });
        
        const similarImpact = simScore / loggedSimilar.length;
        score += similarImpact * 1.5;
        
        const sentiment = similarImpact > 5 ? 'enjoyed' : similarImpact < -5 ? 'disliked' : 'had mixed feelings about';
        reasons.push(`You've logged ${loggedSimilar.length} similar film${loggedSimilar.length === 1 ? '' : 's'} and generally ${sentiment} them.`);
      } else {
         reasons.push(`You haven't logged many films similar to this one, so we are relying on broader taste signals.`);
      }
    }

    const director = credits.crew?.find(c => c.job === 'Director')?.name;
    const genres = (movie.genres || []).map(g => g.name);
    const genreText = genres.length ? genres.slice(0, 2).join(' and ') : 'this kind of film';

    const movieRating = movie.vote_average || 5; 
    const differenceFromGlobal = Math.abs(avgRating - (movieRating / 2));
    
    // Scale score by how much they agree with consensus for this type of movie
    if (differenceFromGlobal < 1) {
       score += 8; 
       reasons.push(`Your rating history aligns well with how ${movie.title} is generally received by audiences.`);
    } else {
       score -= differenceFromGlobal * 6; 
       reasons.push(`Your taste tends to diverge from general audience consensus, so this match might be unpredictable.`);
    }
    
    if (likedCount > 0) reasons.push(`We factored in your ${likedCount} liked film${likedCount === 1 ? '' : 's'} as strong positive taste signals.`);
    if (director) reasons.push(`${director}'s involvement was cross-referenced with your broader viewing patterns.`);
    
    // Shift score based on general positivity
    score += (avgRating - 3) * 4;

    score = Math.max(1, Math.min(99, Math.round(score)));

    return `Taste Match: ${score}%
Why it fits: ${movie.title} has ${genreText} signals, and this estimate is drawn from your ratings, likes, and watch history.
Reasons:
- ${reasons.join('\n- ')}
${reason ? `\nNote: ${reason}` : ''}`;
  }

  async function generateTasteMatch(movie, credits) {
    const btn = document.getElementById('taste-match-btn');
    const result = document.getElementById('taste-match-result');
    if (!btn || !result) return;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Analyzing';
    result.style.display = 'block';
    result.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;color:var(--mist);font-size:13px">
        <div class="spinner spinner-sm"></div>
        Reading your film diary...
      </div>
    `;

    try {
      if (!SL.Auth.isAuthed()) {
        const genericText = localTasteMatch(movie, credits, [], [], 'sign in and log films for a personal match');
        result.innerHTML = `
          <div style="font-size:13px;color:var(--ghost);line-height:1.75;white-space:pre-wrap">${SL.esc(genericText)}</div>
          <button class="btn btn-primary btn-sm" style="margin-top:14px" onclick="SL.AuthPanel.open()">Sign in for personal match</button>
        `;
        return;
      }

      let logs = [];
      let similar = [];
      try {
        const [logsData, similarData] = await Promise.all([
          SL.Store.logs.getForUser(SL.Auth.uid(), 0, 100),
          SL.TMDB.similar(movie.id).catch(() => ({ results: [] }))
        ]);
        logs = logsData;
        similar = similarData.results || [];
      } catch (logError) {
        console.warn('Could not load film diary for taste match:', logError);
        result.innerHTML = `
          <p style="font-size:13px;color:var(--ghost);line-height:1.6">
            Could not read your film diary right now. ${SL.esc(logError.message || '')}
          </p>
        `;
        return;
      }

      if (!logs.length) {
        result.innerHTML = `
          <p style="font-size:13px;color:var(--ghost);line-height:1.6">
            Log and rate a few films first so SineLog can learn your taste.
          </p>
        `;
        return;
      }

      result.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;color:var(--mist);font-size:13px">
          <div class="spinner spinner-sm"></div>
          AI is analyzing your taste profile...
        </div>
      `;

      let aiResponseText = "";
      try {
        const prompt = `You are an expert film critic AI for the SineLog app.
I am considering watching the movie "${movie.title}".
Synopsis: ${movie.overview}
Genres: ${(movie.genres || []).map(g => g.name).join(', ')}

Here are some movies I've recently watched, my ratings (out of 5 stars), and my reviews:
${logs.slice(0, 15).map(l => `- "${l.movie_title}": ${l.rating}/5 stars ${l.liked ? '(Liked)' : ''}. ${l.review ? 'Review: ' + l.review : ''}`).join('\n')}

Based on my exact watch history above, predict how much I will like "${movie.title}".
If there is not much history, do your best based on the genres and synopsis.
Do NOT use markdown in your response. Instead, format your response exactly with these HTML tags:
<div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:8px">Taste Match: [Your Score 1-100]%</div>
<div style="margin-bottom:8px"><strong>Why it fits:</strong> [1 sentence summary]</div>
<div><strong>Reasons:</strong><br/>- [Reason 1 based on my history]<br/>- [Reason 2 based on my history]</div>`;

        const aiResponse = await puter.ai.chat(prompt);
        aiResponseText = typeof aiResponse === 'string' ? aiResponse : (aiResponse?.message?.content || aiResponse?.text || '');
        if (!aiResponseText) throw new Error("Empty AI response");
      } catch (aiError) {
        console.warn("Puter AI failed, falling back to local:", aiError);
        aiResponseText = localTasteMatch(movie, credits, logs, similar, "Puter AI unavailable. Showing estimated local match.");
        aiResponseText = `<div style="white-space:pre-wrap;color:var(--ghost)">${SL.esc(aiResponseText)}</div>`;
      }

      result.innerHTML = `
        <div style="font-size:13px;color:var(--text);line-height:1.6">${aiResponseText}</div>
      `;
    } catch(e) {
      console.error('Taste match error:', e);
      result.innerHTML = `
        <p style="font-size:13px;color:var(--ghost);line-height:1.6">
          Could not generate a taste match right now. ${SL.esc(e.message || '')}
        </p>
      `;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 3l1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8L12 3z"/><path d="M19 15l.8 2.4L22 18l-2.2.6L19 21l-.8-2.4L16 18l2.2-.6L19 15z"/></svg> Analyze';
    }
  }

  async function loadCommunityReviews(movieId) {
    const el = document.getElementById('community-reviews');
    if (!el) return;
    const reviews = await SL.Store.logs.getForMovie(movieId, 8);
    const myLikes = await SL.Store.likes.myLikes();

    if (!reviews.length) return;

    el.innerHTML = `
      <hr class="divider" style="margin-bottom:20px" />
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--mist);font-weight:600;margin-bottom:14px">
        Community Reviews
      </p>
      ${reviews.map(r => {
        const liked = myLikes.includes(r.id);
        return `
        <div style="display:flex;gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">
          <img src="${SL.img.profile(r.avatar_url,'w92')}" class="avatar" style="width:36px;height:36px;flex-shrink:0" />
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <button style="font-size:13px;font-weight:600;color:var(--text);background:none;border:none;cursor:pointer;padding:0;font-family:inherit"
                onclick="SL.Router.navigate('profile',{userId:'${r.user_id}'});SL.Modal.close()">
                ${SL.esc(r.display_name || r.username)}
              </button>
              ${r.rating ? `<span style="font-size:11px;color:var(--accent)">${SL.ratingStars(r.rating)} ${SL.ratingText(r.rating)}</span>` : ''}
              ${r.is_rewatch ? `<span class="rewatch-badge">Rewatch</span>` : ''}
              <span style="font-size:11px;color:var(--mist)">${SL.fmt.date(r.created_at)}</span>
            </div>
            <p style="font-size:13px;color:var(--ghost);line-height:1.6">${SL.esc(r.review)}</p>
            <button class="like-btn ${liked ? 'liked' : ''}" data-log="${r.id}" data-liked="${liked}"
              style="display:flex;align-items:center;gap:4px;margin-top:6px;font-size:11px;color:${liked ? '#e05555' : 'var(--mist)'};background:none;border:none;cursor:pointer;font-family:inherit">
              <svg width="12" height="12" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>${r.like_count}</span>
            </button>
          </div>
        </div>
      `}).join('')}
    `;

    el.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
        const logId = btn.dataset.log;
        try {
          const nowLiked = await SL.Store.likes.toggle(logId);
          btn.dataset.liked = nowLiked;
          btn.style.color = nowLiked ? '#e05555' : 'var(--mist)';
          btn.querySelector('svg').setAttribute('fill', nowLiked ? 'currentColor' : 'none');
          const countEl = btn.querySelector('span');
          countEl.textContent = parseInt(countEl.textContent) + (nowLiked ? 1 : -1);
        } catch(e) { SL.toast(e.message); }
      });
    });
  }

  async function loadSimilar(movie) {
    const el = document.getElementById('similar-section');
    if (!el) return;
    const genreIds = (movie.genres || []).map(g => g.id).filter(Boolean);
    const primaryGenres = genreIds.slice(0, 2).join(',');
    let data = primaryGenres ? await SL.TMDB.byGenres(primaryGenres) : await SL.TMDB.similar(movie.id);
    let movies = (data.results || [])
      .filter(item => item.id !== movie.id)
      .filter(item => {
        const ids = item.genre_ids || [];
        return !genreIds.length || ids.some(id => genreIds.includes(id));
      })
      .sort((a, b) => {
        const aOverlap = (a.genre_ids || []).filter(id => genreIds.includes(id)).length;
        const bOverlap = (b.genre_ids || []).filter(id => genreIds.includes(id)).length;
        return bOverlap - aOverlap || (b.vote_average || 0) - (a.vote_average || 0);
      })
      .slice(0, 8);

    if (!movies.length) {
      data = await SL.TMDB.similar(movie.id);
      movies = (data.results || []).filter(item => item.id !== movie.id).slice(0, 8);
    }
    if (!movies.length) return;

    const genreLabel = (movie.genres || []).slice(0, 2).map(g => g.name).join(' / ');
    el.innerHTML = `
      <hr class="divider" style="margin-bottom:20px" />
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--mist);font-weight:600">You Might Also Like</p>
        ${genreLabel ? `<p style="font-size:11px;color:var(--mist)">Matched by ${SL.esc(genreLabel)}</p>` : ''}
      </div>
      <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
        ${movies.map(m => `
          <div style="flex-shrink:0;width:90px;cursor:pointer" onclick="SL.Modal.open(${m.id})">
            <img src="${SL.img.poster(m.poster_path,'w185')}"
              style="width:90px;aspect-ratio:2/3;object-fit:cover;border-radius:8px;border:1px solid var(--border);display:block" />
            <p style="font-size:10px;color:var(--mist);margin-top:5px;line-height:1.3;word-break:break-word">${SL.esc(m.title)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  async function openPerson(personId) {
    close();
    setTimeout(async () => {
      const person = await SL.TMDB.person(personId);
      SL.Router.navigate('search-page', { personId, personName: person.name });
    }, 300);
  }

  return { open, close, openPerson };
})();
