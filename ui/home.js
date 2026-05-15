/* ═══════════════════════════════════════════════════════════════
   SineLog — ui/home.js  (Homepage)
   ═══════════════════════════════════════════════════════════════ */

SL.Router.register('home', async (container) => {
  container.innerHTML = `
    <div id="home-root">
      <!-- Hero skeleton -->
      <div class="hero-skeleton loading-state vertical" style="height:520px;background:var(--surface-2)">
        <div class="spinner" style="width:36px;height:36px"></div>
        <div>Loading featured films...</div>
      </div>
      <!-- Rows skeleton -->
      <div class="home-section-shell">
        ${[1,2,3].map(() => `
          <div style="margin-bottom:40px">
            <div style="height:20px;width:180px;background:var(--surface-2);border-radius:6px;margin-bottom:16px"></div>
            <div style="display:flex;gap:12px" aria-label="Loading film row">
              ${[1,2,3,4,5,6].map(() => `<div style="flex-shrink:0;width:140px;aspect-ratio:2/3;background:var(--surface-2);border-radius:10px"></div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const [trending, topRated, nowPlaying, upcoming] = await Promise.all([
    SL.TMDB.trending('week'),
    SL.TMDB.topRated(),
    SL.TMDB.nowPlaying(),
    SL.TMDB.upcoming(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const futureUpcoming = (upcoming.results || [])
    .filter(movie => !movie.release_date || movie.release_date >= today)
    .sort((a, b) => String(a.release_date || '9999').localeCompare(String(b.release_date || '9999')));
  const heroMovies = trending.results.slice(0, 6);
  if (!heroMovies.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding:120px 20px">
        <div class="empty-state-icon">🎬</div>
        <div class="empty-state-title">No films available</div>
        <div class="empty-state-text">The film catalog did not return anything right now.</div>
      </div>
    `;
    return;
  }
  let heroIndex = 0;
  let heroInterval = null;

  const genres = [
    { id: 28, name: 'Action', emoji: '💥' },
    { id: 35, name: 'Comedy', emoji: '😂' },
    { id: 27, name: 'Horror', emoji: '👻' },
    { id: 18, name: 'Drama', emoji: '🎭' },
    { id: 878, name: 'Sci-Fi', emoji: '🚀' },
    { id: 10749, name: 'Romance', emoji: '❤️' },
    { id: 16, name: 'Animation', emoji: '🎨' },
    { id: 80, name: 'Crime', emoji: '🔍' },
    { id: 14, name: 'Fantasy', emoji: '🧙' },
    { id: 12, name: 'Adventure', emoji: '🗺️' },
    { id: 99, name: 'Documentary', emoji: '🎥' },
    { id: 9648, name: 'Mystery', emoji: '🕵️' },
  ];

  function renderHero(movie) {
    return `
      <div class="hero-slide">
        <img
          src="${SL.img.backdrop(movie.backdrop_path, 'original')}"
          alt="${SL.esc(movie.title)}"
          class="hero-slide-img"
        />
        <div style="position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.18) 55%,transparent 100%)"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(245,245,248,1) 0%,transparent 40%)"></div>

        <!-- Content -->
        <div class="hero-copy">
          <div style="max-width:480px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;color:rgba(255,255,255,0.7)">
                ${movie.vote_average ? `★ ${Number(movie.vote_average).toFixed(1)}` : 'No rating yet'}
              </span>
              ${(movie.genre_ids||[]).slice(0,2).map(id => `
                <span style="font-size:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:4px;padding:2px 8px;color:rgba(255,255,255,0.85)">
                  ${SL.GENRE_NAMES[id] || ''}
                </span>
              `).join('')}
            </div>
            <h1 style="font-family:var(--font-heading);font-size:clamp(1.8rem,4vw,2.8rem);line-height:1.1;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,0.4);margin-bottom:12px">
              ${SL.esc(movie.title)}
            </h1>
            <p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,0.75);text-shadow:0 1px 4px rgba(0,0,0,0.4);margin-bottom:20px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">
              ${SL.esc(movie.overview)}
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-primary" onclick="SL.Modal.open(${movie.id})">
                View Film
              </button>
              <button class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.08)"
                onclick="SL.Store.watchlist.toggle(${movie.id},'${SL.esc(movie.title).replace(/'/g,"\\'")}','${movie.poster_path||''}').then(added=>SL.toast(added?'Added to Watchlist':'Removed from Watchlist')).catch(e=>{if(!SL.Auth.isAuthed())SL.AuthPanel.open();else SL.toast(e.message)})">
                + Watchlist
              </button>
            </div>
          </div>
        </div>

        <!-- Dots -->
        <div class="hero-dots" id="hero-dots">
          ${heroMovies.map((_, i) => `
            <button data-dot="${i}" style="width:${i===heroIndex?'24px':'8px'};height:8px;border-radius:4px;background:${i===heroIndex?'var(--accent)':'rgba(255,255,255,0.4)'};border:none;cursor:pointer;padding:0;transition:all 0.3s"></button>
          `).join('')}
        </div>

        <!-- Nav arrows -->
        <button onclick="heroNav(-1)" style="position:absolute;top:50%;left:16px;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px)">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button onclick="heroNav(1)" style="position:absolute;top:50%;right:16px;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px)">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    `;
  }

  function movieCard(m, size = 'md') {
    const w = size === 'lg' ? 180 : size === 'sm' ? 110 : 140;
    return `
      <div class="movie-card" onclick="SL.Modal.open(${m.id})">
        <div class="movie-poster-frame">
          <img
            src="${SL.img.poster(m.poster_path, 'w342')}"
            alt="${SL.esc(m.title)} poster"
            loading="lazy"
            class="movie-card-poster"
          />
          ${m.vote_average ? `<div class="movie-card-rating">★ ${Number(m.vote_average).toFixed(1)}</div>` : `<div class="movie-card-rating muted">No rating</div>`}
        </div>
        <p class="movie-card-title">${SL.esc(m.title)}</p>
        <p class="movie-card-year">${SL.fmt.year(m.release_date)}</p>
      </div>
    `;
  }

  function rowSection(title, movies, emoji = '', rowId = '') {
    return `
      <div class="home-movie-section">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <h2 class="section-heading">${emoji ? emoji + ' ' : ''}${title}</h2>
          ${movies.length ? `
            <div class="row-scroll-actions" data-scroll-actions="${rowId}">
              <button class="row-scroll-btn" type="button" data-scroll-row="${rowId}" data-scroll-dir="-1" aria-label="Scroll ${SL.esc(title)} left">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button class="row-scroll-btn" type="button" data-scroll-row="${rowId}" data-scroll-dir="1" aria-label="Scroll ${SL.esc(title)} right">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          ` : ''}
        </div>
        <div class="movie-row" data-row-id="${rowId}">
          ${movies.length ? movies.map(m => movieCard(m)).join('') : `
            <div class="empty-state" style="padding:24px 0;text-align:left">
              <div class="empty-state-title">Nothing to show here yet</div>
              <div class="empty-state-text">This row is empty right now.</div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div id="home-root">
      <div id="hero-container">${renderHero(heroMovies[0])}</div>

      <div class="home-section-shell">

        ${rowSection('Trending This Week', trending.results.slice(0, 12), '🔥', 'trending')}
        ${rowSection('Top Rated', topRated.results.slice(0, 12), '⭐', 'top-rated')}
        ${rowSection('Now Playing', nowPlaying.results.slice(0, 12), '🎬', 'now-playing')}
        ${rowSection('Coming Soon', futureUpcoming.slice(0, 12), '📅', 'coming-soon')}

        <!-- Genre Grid -->
        <div style="margin-top:16px">
          <h2 class="section-heading" style="margin-bottom:16px">🎭 Browse by Genre</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
            ${genres.map(g => `
              <button onclick="SL.Router.navigate('search-page',{genreId:${g.id},genreName:'${g.name}'})"
                style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;cursor:pointer;font-family:inherit;transition:border-color 0.2s,box-shadow 0.2s"
                onmouseover="this.style.borderColor='var(--accent)';this.style.boxShadow='0 4px 16px rgba(79,70,229,0.12)'"
                onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
                <span style="font-size:1.6rem">${g.emoji}</span>
                <span style="font-size:13px;font-weight:500;color:var(--text)">${g.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Hero auto-advance
  function setHero(idx) {
    heroIndex = (idx + heroMovies.length) % heroMovies.length;
    document.getElementById('hero-container').innerHTML = renderHero(heroMovies[heroIndex]);
    document.querySelectorAll('[data-dot]').forEach(d => {
      const i = +d.dataset.dot;
      d.style.width = i === heroIndex ? '24px' : '8px';
      d.style.background = i === heroIndex ? 'var(--accent)' : 'rgba(255,255,255,0.4)';
    });
    // Bind dot clicks
    document.querySelectorAll('[data-dot]').forEach(d => {
      d.addEventListener('click', () => { clearInterval(heroInterval); setHero(+d.dataset.dot); startInterval(); });
    });
  }

  window.heroNav = (dir) => { clearInterval(heroInterval); setHero(heroIndex + dir); startInterval(); };

  function startInterval() {
    heroInterval = setInterval(() => setHero(heroIndex + 1), 6000);
  }

  // Bind initial dots
  document.querySelectorAll('[data-dot]').forEach(d => {
    d.addEventListener('click', () => { clearInterval(heroInterval); setHero(+d.dataset.dot); startInterval(); });
  });

  document.querySelectorAll('[data-scroll-row]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = document.querySelector(`[data-row-id="${btn.dataset.scrollRow}"]`);
      if (!row) return;
      row.scrollBy({
        left: Number(btn.dataset.scrollDir) * Math.max(260, row.clientWidth * 0.82),
        behavior: 'smooth',
      });
    });
  });

  function updateRowScrollControls() {
    document.querySelectorAll('.movie-row[data-row-id]').forEach(row => {
      const actions = document.querySelector(`[data-scroll-actions="${row.dataset.rowId}"]`);
      if (!actions) return;
      const canScroll = row.scrollWidth > row.clientWidth + 8;
      actions.classList.toggle('visible', canScroll);
    });
  }

  updateRowScrollControls();
  window.addEventListener('resize', SL.debounce(updateRowScrollControls, 150));

  startInterval();
});
