/* ═══════════════════════════════════════════════════════════════
   SineLog — app.js  (core config + router + utilities)
   ═══════════════════════════════════════════════════════════════ */

// ── Config  ──────────────────────────────────────────────────────
window.SL = window.SL || {};

// Keys are injected at runtime via /env-config.js (generated from K8s Secret).
// See docker-entrypoint.sh and k8s/secret.yaml.
const __env = window.__SL_ENV__ || {};

SL.CONFIG = {
  TMDB_KEY:    __env.TMDB_KEY    || '',
  SUPABASE_URL:  __env.SUPABASE_URL  || '',
  SUPABASE_ANON: __env.SUPABASE_ANON || '',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  IMG_BASE:  'https://image.tmdb.org/t/p/',
};

SL.GENRE_NAMES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

// ── Image helpers ─────────────────────────────────────────────────
SL.img = {
  poster:   (p, s = 'w342') => p ? `${SL.CONFIG.IMG_BASE}${s}${p}` : 'https://placehold.co/342x513/f0f0f8/8080a0?text=No+Poster',
  backdrop: (p, s = 'w1280') => p ? `${SL.CONFIG.IMG_BASE}${s}${p}` : '',
  profile:  (p, s = 'w185') => p ? `${SL.CONFIG.IMG_BASE}${s}${p}` : 'https://placehold.co/185x185/e4e4ee/8080a0?text=%3F',
};

// ── HTML escape ───────────────────────────────────────────────────
SL.esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Format helpers ────────────────────────────────────────────────
SL.fmt = {
  runtime: (min) => min ? `${Math.floor(min / 60)}h ${min % 60}m` : '',
  year:    (d) => d?.slice(0, 4) || '—',
  date:    (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
  rating:  (n) => n ? `★ ${Number(n).toFixed(1)}` : '',
};

SL.ratingLabel = (n) => {
  const rating = Number(n || 0);
  if (!rating) return '';
  if (rating <= 1) return 'Hated it';
  if (rating <= 2) return "Didn't like it";
  if (rating <= 3) return 'It was OK';
  if (rating <= 4) return 'Liked it';
  return 'Loved it';
};

SL.ratingText = (n) => {
  const rating = Number(n || 0);
  return rating ? `${rating.toFixed(1)} / 5` : '';
};

SL.ratingStars = (n) => {
  const rating = Number(n || 0);
  if (!rating) return '';
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return `${'★'.repeat(full)}${half ? '½' : ''}${'☆'.repeat(5 - full - (half ? 1 : 0))}`;
};

// ── Toast ─────────────────────────────────────────────────────────
SL.toast = (() => {
  const el = document.getElementById('toast');
  let timer;
  return (msg, duration = 2800) => {
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), duration);
  };
})();

// ── Simple SPA Router ─────────────────────────────────────────────
SL.Router = (() => {
  const pages = {};
  let current = null;
  let container = null;

  function register(name, renderFn) { pages[name] = renderFn; }

  async function navigate(name, params = {}) {
    if (!container) container = document.getElementById('app');

    current = name;
    container.innerHTML = '<div class="loading-state full-page vertical"><div class="spinner" style="width:32px;height:32px"></div><div>Loading page...</div></div>';

    try {
      if (pages[name]) {
        await pages[name](container, params);
        // Update navbar state (e.g., highlighting active link)
        if (window.SL?.Nav?.update) SL.Nav.update();
      } else {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><div class="empty-state-title">Page not found</div><div class="empty-state-text">This page does not exist yet.</div></div>';
      }
    } catch (e) {
      console.error('Router error:', e);
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Something went wrong</div><div class="empty-state-text">${SL.esc(e.message)}</div></div>`;
    }
  }

  return { register, navigate, current: () => current };
})();

// ── Debounce ──────────────────────────────────────────────────────
SL.debounce = (fn, delay) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

// ── Rating labels ─────────────────────────────────────────────────
SL.STAR_LABELS = ['', 'Hated it', "Didn't like it", 'It was OK', 'Liked it', 'Loved it ♥'];
