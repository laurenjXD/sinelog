/* SineLog - nav.js (Navigation bar) */

SL.Nav = (() => {
  const navbar = document.getElementById('navbar');

  function update() {
    const user = SL.Auth.user();
    const authed = SL.Auth.isAuthed();
    const currentRoute = SL.Router.current();

    // 1. Desktop Top Navbar
    navbar.innerHTML = `
    <div class="nav-shell">
       <button class="brand-button" onclick="SL.Router.navigate('home')" aria-label="Go to SineLog home">
         <div class="brand-mark">
           <img src="assets/logo.png" alt="SineLog Logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />
         </div>
         <span class="brand-name">SINELOG</span>
       </button>
 
       <div class="nav-links hide-mobile">
         <button class="nav-link ${currentRoute === 'home' ? 'active' : ''}" onclick="SL.Router.navigate('home')">Discover</button>
         <button class="nav-link ${currentRoute === 'feed' ? 'active' : ''}" onclick="SL.Router.navigate('feed')">Feed</button>
         <button class="nav-link ${currentRoute === 'search-page' ? 'active' : ''}" onclick="SL.Router.navigate('search-page')">Browse</button>
       </div>

      <div style="flex:1"></div>

      <div class="nav-search-box">
        <div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border-strong);border-radius:10px;padding:8px 12px;transition:border-color 0.2s,box-shadow 0.2s" id="search-wrap">
          <svg width="14" height="14" fill="none" stroke="var(--accent)" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input id="nav-search" type="text" placeholder="Search films or users..."
            style="background:none;border:none;outline:none;font-size:13px;color:var(--text);width:100%;font-family:inherit"
            autocomplete="off" />
          <div class="spinner spinner-sm" id="search-spinner" style="display:none"></div>
        </div>
        <div id="search-results" class="glass-card" style="display:none;position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:900;border-radius:12px;overflow:hidden;max-height:420px;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,0.12)"></div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
        ${authed ? `
          <button class="btn btn-icon hide-mobile" title="My Profile"
            onclick="SL.Router.navigate('profile',{userId:'${user.id}'})">
            ${user.user_metadata?.avatar_url
          ? `<img src="${user.user_metadata.avatar_url}" class="avatar" style="width:28px;height:28px" />`
          : `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`
        }
          </button>
          <button class="btn btn-ghost btn-sm hide-mobile" id="nav-signout">Sign out</button>
        ` : `
          <button class="btn btn-ghost btn-sm" onclick="SL.AuthPanel.open('login')">Sign in</button>
          <button class="btn btn-primary btn-sm hide-mobile" onclick="SL.AuthPanel.open('signup')">Join free</button>
        `}
      </div>
    </div>
    `;

    // 2. Mobile Bottom Navbar
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
      mobileNav.innerHTML = `
        <button class="mobile-nav-item ${currentRoute === 'home' ? 'active' : ''}" onclick="SL.Router.navigate('home')">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span>Discover</span>
        </button>
        <button class="mobile-nav-item ${currentRoute === 'feed' ? 'active' : ''}" onclick="SL.Router.navigate('feed')">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"/><path d="M14 2v4h4"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/></svg>
          <span>Feed</span>
        </button>
        <button class="mobile-nav-item ${currentRoute === 'search-page' ? 'active' : ''}" onclick="SL.Router.navigate('search-page')">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span>Browse</span>
        </button>
        <button class="mobile-nav-item ${currentRoute === 'profile' ? 'active' : ''}" 
          onclick="${authed ? `SL.Router.navigate('profile',{userId:'${user.id}'})` : `SL.AuthPanel.open('login')`}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span>${authed ? 'Profile' : 'Sign In'}</span>
        </button>
      `;
    }

    document.getElementById('nav-signout')?.addEventListener('click', async () => {
      await SL.Auth.signOut();
      SL.Router.navigate('home');
      SL.toast('Signed out. See you next time');
    });

    initSearch();
  }

  function initSearch() {
    const input = document.getElementById('nav-search');
    const results = document.getElementById('search-results');
    const spinner = document.getElementById('search-spinner');
    if (!input) return;

    const doSearch = SL.debounce(async (q) => {
      if (!q) {
        results.style.display = 'none';
        return;
      }

      spinner.style.display = 'block';
      results.innerHTML = `<div class="loading-state" style="min-height:auto;padding:14px 16px;justify-content:flex-start"><div class="spinner spinner-sm"></div><div>Searching films and users...</div></div>`;
      results.style.display = 'block';

      try {
        const [movieData, users] = await Promise.all([
          SL.TMDB.search(q),
          SL.Store.profiles.search(q).catch(() => []),
        ]);
        renderResults((movieData.results || []).slice(0, 5), users.slice(0, 5));
      } finally {
        spinner.style.display = 'none';
      }
    }, 320);

    input.addEventListener('input', () => doSearch(input.value.trim()));
    input.addEventListener('focus', () => {
      if (input.value.trim()) results.style.display = 'block';
    });
    document.addEventListener('click', (e) => {
      if (!input.closest('div').contains(e.target)) results.style.display = 'none';
    });

    function userAvatar(user) {
      if (user.avatar_url) return user.avatar_url;
      const initial = encodeURIComponent((user.display_name || user.username || '?')[0].toUpperCase());
      return `https://placehold.co/92x92/e4e4ee/8080a0?text=${initial}`;
    }

    function renderResults(movies, users = []) {
      if (!movies.length && !users.length) {
        results.innerHTML = `<p style="padding:14px 16px;font-size:13px;color:var(--mist)">No results found.</p>`;
        results.style.display = 'block';
        return;
      }

      results.innerHTML = `
        ${users.length ? `
          <div style="padding:9px 14px 6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--mist);background:var(--surface-2)">Users</div>
          ${users.map(u => `
            <div class="search-item" data-type="user" data-id="${u.id}">
              <img src="${userAvatar(u)}" alt=""
                style="width:36px;height:36px;object-fit:cover;border-radius:50%;flex-shrink:0;border:1px solid var(--border)" />
              <div style="min-width:0">
                <p style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${SL.esc(u.display_name || u.username)}
                </p>
                <p style="font-size:11px;color:var(--mist)">@${SL.esc(u.username)} &middot; View profile to follow</p>
              </div>
            </div>
          `).join('')}
        ` : ''}
        ${movies.length ? `
          <div style="padding:9px 14px 6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--mist);background:var(--surface-2)">Films</div>
          ${movies.map(m => `
            <div class="search-item" data-type="movie" data-id="${m.id}">
              <img src="${SL.img.poster(m.poster_path, 'w92')}" alt=""
                style="width:36px;aspect-ratio:2/3;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--border)" />
              <div style="min-width:0">
                <p style="font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${SL.esc(m.title)}
                </p>
                <p style="font-size:11px;color:var(--mist)">${SL.fmt.year(m.release_date)} &middot; ${SL.fmt.rating(m.vote_average)}</p>
              </div>
            </div>
          `).join('')}
        ` : ''}
      `;

      results.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => {
          if (el.dataset.type === 'user') {
            SL.Router.navigate('profile', { userId: el.dataset.id });
          } else {
            SL.Modal.open(+el.dataset.id);
          }
          results.style.display = 'none';
          input.value = '';
        });
      });
      results.style.display = 'block';
    }
  }

  return { update };
})();
