/* ═══════════════════════════════════════════════════════════════
   SineLog — ui/search-page.js  (Browse & Search)
   ═══════════════════════════════════════════════════════════════ */

SL.Router.register('search-page', async (container, params) => {
  let query       = params.query   || '';
  let activeGenre = params.genreId || null;
  let activeGenreName = params.genreName || '';
  let activeCat   = params.category || 'trending';
  let page        = 1;
  let loading     = false;
  let hasMore     = true;
  let personId    = params.personId || null;
  let personName  = params.personName || '';
  let seenMovieIds = new Set();

  const MAX_BROWSE_PAGES = 5;

  const categories = [
    { id: 'trending',    label: '🔥 Trending' },
    { id: 'top_rated',   label: '⭐ Top Rated' },
    { id: 'now_playing', label: '🎬 In Cinemas' },
    { id: 'upcoming',    label: '📅 Coming Soon' },
    { id: 'popular',     label: '👁 Popular' },
  ];

  categories[0].label = 'Trending';
  categories[1].label = 'Top Rated';
  categories[2].label = 'In Cinemas';
  categories[3].label = 'Coming Soon';
  categories[4].label = 'Popular';

  const genres = [
    { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' },     { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },  { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },{ id: 27, name: 'Horror' },   { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },{ id: 10749, name: 'Romance' },{ id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },{ id: 10752, name: 'War' },  { id: 37, name: 'Western' },
  ];

  async function fetchPage(pg) {
    if (personId) {
      if (pg > 1) return { results: [], total_pages: 1 };
      const data = await SL.TMDB.personMovies(personId);
      const sorted = (data.cast || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      return { results: sorted, total_pages: 1 };
    }
    if (query) return SL.TMDB.search(query, pg);
    if (activeGenre) return SL.TMDB.byGenre(activeGenre, pg);
    switch (activeCat) {
      case 'top_rated':   return SL.TMDB.topRated(pg);
      case 'now_playing': return SL.TMDB.nowPlaying(pg);
      case 'upcoming':    return SL.TMDB.upcomingFuture(pg);
      case 'popular':     return SL.TMDB.popular(pg);
      default:            return SL.TMDB.trending('week', pg);
    }
  }

  function movieCard(m) {
    return `
      <div class="movie-card" onclick="SL.Modal.open(${m.id})">
        <div class="movie-poster-frame">
          <img src="${SL.img.poster(m.poster_path,'w342')}" loading="lazy"
            alt="${SL.esc(m.title || m.name || '')} poster"
            class="movie-card-poster" />
          ${m.vote_average ? `<div class="movie-card-rating">★ ${Number(m.vote_average).toFixed(1)}</div>` : `<div class="movie-card-rating muted">No rating</div>`}
        </div>
        <p class="movie-card-title">${SL.esc(m.title || m.name || '')}</p>
        <p class="movie-card-year">${SL.fmt.year(m.release_date || m.first_air_date || '')}</p>
      </div>
    `;
  }

  function skeletonCards(n = 12) {
    return `
      <div class="loading-state" style="grid-column:1/-1;min-height:80px;padding:10px 0 4px">
        <div class="spinner spinner-sm"></div>
        <div>Loading films...</div>
      </div>
    ` + Array(n).fill(0).map(() => `
      <div>
        <div style="border-radius:10px;background:var(--surface-2);aspect-ratio:2/3;width:100%"></div>
        <div style="height:12px;background:var(--surface-2);border-radius:4px;margin-top:8px;width:80%"></div>
        <div style="height:10px;background:var(--surface-2);border-radius:4px;margin-top:5px;width:40%"></div>
      </div>
    `).join('');
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    const loader = document.getElementById('search-loader');
    const grid   = document.getElementById('search-grid');
    if (loader) loader.style.display = 'flex';

    try {
      if (page > MAX_BROWSE_PAGES) {
        hasMore = false;
        return;
      }

      const data = await fetchPage(page);
      const movies = (data.results || []).filter(movie => {
        if (!movie?.id || seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        return true;
      });

      if (!movies.length || page > Math.min(data.total_pages || 1, MAX_BROWSE_PAGES)) {
        hasMore = false;
        if (page === 1) {
          grid.innerHTML = `
            <div style="grid-column:1/-1" class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <div class="empty-state-title">No results found</div>
              <div class="empty-state-text">Try a different search or category.</div>
            </div>
          `;
        }
        if (loader) loader.style.display = 'none';
        loading = false;
        return;
      }

      if (page === 1) grid.innerHTML = '';
      grid.insertAdjacentHTML('beforeend', movies.map(movieCard).join(''));
      page++;
    } catch(e) {
      console.error('Search page error:', e);
      SL.toast('Failed to load films');
    } finally {
      loading = false;
      if (loader) loader.style.display = 'none';
    }
  }

  function reset(newPage = 1) {
    page = newPage;
    hasMore = true;
    seenMovieIds = new Set();
    const grid = document.getElementById('search-grid');
    if (grid) {
      grid.innerHTML = skeletonCards();
    }
    loadMore();
  }

  function getTitle() {
    if (personName) return `Films by ${personName}`;
    if (query) return `Results for "${query}"`;
    if (activeGenreName) return activeGenreName;
    return categories.find(c => c.id === activeCat)?.label || 'Browse';
  }

  function catStyle(catId) {
    const isActive = !activeGenre && activeCat === catId;
    return `padding:8px 14px;border-radius:999px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'var(--accent)' : 'var(--surface)'};color:${isActive ? '#fff' : 'var(--ghost)'};font-size:12px;font-weight:${isActive ? '700' : '600'};font-family:inherit;cursor:pointer;white-space:nowrap;transition:all 0.15s`;
  }

  function genreStyle(genreId) {
    const isActive = Number(activeGenre) === Number(genreId);
    return `padding:6px 12px;border-radius:999px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'var(--accent-dim)' : 'var(--surface)'};color:${isActive ? 'var(--accent)' : 'var(--mist)'};font-size:11px;font-weight:${isActive ? '700' : '500'};font-family:inherit;cursor:pointer;transition:all 0.15s;white-space:nowrap`;
  }

  container.innerHTML = `
    <div class="browse-page" style="max-width:1200px;margin:0 auto;padding:88px 20px 80px;overflow:visible">

      <!-- Header -->
      <div class="page-heading" style="margin-bottom:28px">
        <p class="page-kicker">Browse</p>
        <h1 class="page-title" id="browse-title">
          ${getTitle()}
        </h1>
        <p style="font-size:13px;color:var(--mist)">Discover your next favourite film</p>
      </div>

      <!-- Search bar -->
      <div style="position:relative;margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border-strong);border-radius:12px;padding:10px 16px">
          <svg width="16" height="16" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input id="browse-search" type="text" placeholder="Search for a film…"
            value="${SL.esc(query)}"
            style="background:none;border:none;outline:none;font-size:14px;color:var(--text);width:100%;font-family:inherit" />
          ${query ? `<button id="clear-search" style="background:none;border:none;cursor:pointer;color:var(--mist);padding:0;display:flex">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>` : ''}
        </div>
      </div>

      ${!query && !personId ? `
      <section class="browse-filter-panel" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 22px;margin-bottom:42px;overflow:visible">
        <!-- Category filters -->
        <p class="filter-label">Category</p>
        <div class="browse-category-row" style="display:flex;gap:10px;overflow-x:auto;padding-bottom:18px;margin-bottom:14px;scrollbar-width:none">
          ${categories.map(c => `
            <button data-cat="${c.id}" onclick="setBrowseCat('${c.id}')" style="${catStyle(c.id)}">
              ${c.label}
            </button>
          `).join('')}
        </div>

        <!-- Genre filters -->
        <p class="filter-label">Genre</p>
        <div class="browse-genre-row" style="display:flex;gap:10px;row-gap:10px;flex-wrap:wrap">
          ${genres.map(g => `
            <button data-genre="${g.id}" onclick="setBrowseGenre(${g.id},'${g.name}')" style="${genreStyle(g.id)}">
              ${g.name}
            </button>
          `).join('')}
        </div>
      </section>
      ` : `
      <div style="margin-bottom:20px">
        <button onclick="clearBrowseFilters()" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--accent);background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:8px;padding:5px 12px;cursor:pointer;font-family:inherit">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          Clear filter
        </button>
      </div>
      `}

      <!-- Grid -->
      <div id="search-grid" class="browse-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(185px,100%),1fr));gap:24px 18px;align-items:start;overflow:visible">
        ${skeletonCards()}
      </div>

      <!-- Infinite loader -->
      <div id="search-loader" style="display:none;justify-content:center;align-items:center;padding:32px;color:var(--mist);font-size:13px">
        <div class="spinner" style="width:28px;height:28px"></div>
        <span style="margin-left:10px">Loading more films...</span>
      </div>
      <div id="search-sentinel" style="height:1px"></div>
      <button id="browse-scroll-top" class="scroll-top-btn" type="button" aria-label="Scroll to top">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>
      </button>
    </div>
  `;

  // Initial load
  loadMore();

  // Search input
  const searchInput = document.getElementById('browse-search');
  const doSearch = SL.debounce((q) => {
    query = q;
    personId = null;
    personName = '';
    activeGenre = null;
    activeGenreName = '';
    document.getElementById('browse-title').textContent = q ? `Results for "${q}"` : getTitle();
    reset();
  }, 400);

  searchInput?.addEventListener('input', () => doSearch(searchInput.value.trim()));
  document.getElementById('clear-search')?.addEventListener('click', () => {
    searchInput.value = '';
    query = '';
    document.getElementById('browse-title').textContent = getTitle();
    reset();
  });

  // Category / genre handlers
  window.setBrowseCat = (catId) => {
    activeCat = catId;
    activeGenre = null;
    activeGenreName = '';
    query = '';
    personId = null;
    personName = '';
    document.getElementById('browse-title').textContent = getTitle();
    document.querySelectorAll('[data-cat]').forEach(b => {
      const isActive = b.dataset.cat === catId;
      b.style.background = isActive ? 'var(--accent)' : 'var(--surface)';
      b.style.color = isActive ? '#fff' : 'var(--ghost)';
      b.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
      b.style.fontWeight = isActive ? '700' : '600';
    });
    document.querySelectorAll('[data-genre]').forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color = 'var(--mist)';
      b.style.borderColor = 'var(--border)';
      b.style.fontWeight = '500';
    });
    reset();
  };

  window.setBrowseGenre = (genreId, genreName) => {
    activeGenre = genreId;
    activeGenreName = genreName;
    activeCat = '';
    query = '';
    personId = null;
    personName = '';
    document.getElementById('browse-title').textContent = genreName;
    document.querySelectorAll('[data-cat]').forEach(b => {
      b.style.background = 'var(--surface)';
      b.style.color = 'var(--ghost)';
      b.style.borderColor = 'var(--border)';
      b.style.fontWeight = '600';
    });
    document.querySelectorAll('[data-genre]').forEach(b => {
      const isActive = Number(b.dataset.genre) === Number(genreId);
      b.style.background = isActive ? 'var(--accent-dim)' : 'var(--surface)';
      b.style.color = isActive ? 'var(--accent)' : 'var(--mist)';
      b.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
      b.style.fontWeight = isActive ? '700' : '500';
    });
    reset();
  };

  window.clearBrowseFilters = () => {
    query = '';
    activeGenre = null;
    activeGenreName = '';
    personId = null;
    personName = '';
    activeCat = 'trending';
    SL.Router.navigate('search-page');
  };

  // Infinite scroll sentinel
  const sentinel = document.getElementById('search-sentinel');
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadMore();
  }, { threshold: 0.1 });
  if (sentinel) observer.observe(sentinel);

  const scrollTopBtn = document.getElementById('browse-scroll-top');
  const toggleScrollTop = () => {
    if (SL.Router.current() !== 'search-page') return;
    scrollTopBtn?.classList.toggle('visible', window.scrollY > 420);
  };
  scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', toggleScrollTop, { passive: true });
  toggleScrollTop();
});
