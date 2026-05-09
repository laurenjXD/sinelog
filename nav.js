/* SineLog - nav.js (Navigation bar) */

SL.Nav = (() => {
  const navbar = document.getElementById('navbar');

  function update() {
    const user = SL.Auth.user();
    const authed = SL.Auth.isAuthed();

    navbar.innerHTML = `
    <div class="nav-shell">

      <!-- Logo -->
      <button class="brand-button" onclick="SL.Router.navigate('home')" aria-label="Go to SineLog home">
        <div class="brand-mark">
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.8" fill="var(--accent)"/>
            <path d="M7 1v1.8M7 11.2V13M1 7h1.8M11.2 7H13M2.8 2.8l1.27 1.27M9.93 9.93l1.27 1.27M2.8 11.2l1.27-1.27M9.93 4.07l1.27-1.27"
              stroke="var(--accent)" stroke-width="1.1" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="brand-name">SINELOG</span>
      </button>

      <!-- Nav links (desktop) -->
      <div class="nav-links hide-mobile">
        <button class="nav-link" onclick="SL.Router.navigate('home')">Discover</button>
        <button class="nav-link" onclick="SL.Router.navigate('feed')">Feed</button>
        <button class="nav-link" onclick="SL.Router.navigate('search-page')">Browse</button>
      </div>

      <!-- Spacer -->
      <div style="flex:1"></div>

      <!-- Search -->
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

      <!-- Auth actions -->
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
          <button class="btn btn-icon hide-desktop" onclick="SL.Router.navigate('profile',{userId:'${user.id}'})">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </button>
        ` : `
          <button class="btn btn-ghost btn-sm" onclick="SL.AuthPanel.open('login')">Sign in</button>
          <button class="btn btn-primary btn-sm hide-mobile" onclick="SL.AuthPanel.open('signup')">Join free</button>
        `}
      </div>
    </div>
    `;

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
              <img src="${SL.img.poster(m.poster_path,'w92')}" alt=""
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
