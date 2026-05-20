/* ═══════════════════════════════════════════════════════════════
   SineLog — tmdb.js  (TMDB API wrapper)
   ═══════════════════════════════════════════════════════════════ */

SL.TMDB = (() => {
  async function request(endpoint, params = {}) {
    const url = new URL(`${SL.CONFIG.TMDB_BASE}${endpoint}`);
    url.searchParams.set('api_key', SL.CONFIG.TMDB_KEY);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
    return res.json();
  }

  return {
    // ── Discovery ──────────────────────────────────────────────
    trending:   (window='week', page=1) => request(`/trending/movie/${window}`, { page }),
    topRated:   (page=1)            => request('/movie/top_rated',    { page }),
    nowPlaying: (page=1) => {
      const today = new Date().toISOString().slice(0, 10);
      const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return request('/discover/movie', {
        page,
        sort_by: 'popularity.desc',
        'primary_release_date.gte': past,
        'primary_release_date.lte': today,
        'vote_count.gte': 5,
      });
    },
    upcoming:   (page=1)            => request('/movie/upcoming',     { page }),
    upcomingFuture: (page=1)        => request('/discover/movie', {
      page,
      sort_by: 'primary_release_date.asc',
      'primary_release_date.gte': new Date().toISOString().slice(0, 10),
      'vote_count.gte': 0,
    }),
    popular:    (page=1)            => request('/movie/popular',      { page }),
    byGenre:    (id, page=1)        => request('/discover/movie', { with_genres: id, sort_by:'popularity.desc', page }),
    byGenres:   (ids, page=1)       => request('/discover/movie', { with_genres: ids, sort_by:'vote_average.desc', 'vote_count.gte': 250, page }),

    // ── Detail ─────────────────────────────────────────────────
    detail:  (id) => request(`/movie/${id}`, { append_to_response: 'release_dates,videos' }),
    credits: (id) => request(`/movie/${id}/credits`),
    similar: (id) => request(`/movie/${id}/similar`),
    images:  (id) => request(`/movie/${id}/images`, { include_image_language: 'null,en' }),

    // ── Person ─────────────────────────────────────────────────
    person:       (id) => request(`/person/${id}`),
    personMovies: (id) => request(`/person/${id}/movie_credits`),

    // ── Search ─────────────────────────────────────────────────
    search:       (query, page=1) => request('/search/movie',  { query, include_adult: false, page }),
    searchPerson: (query)         => request('/search/person', { query }),

    // ── Genres ─────────────────────────────────────────────────
    genres: () => request('/genre/movie/list'),
  };
})();
