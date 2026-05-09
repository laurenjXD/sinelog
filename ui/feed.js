/* ═══════════════════════════════════════════════════════════════
   SineLog — ui/feed.js  (Social Feed)
   ═══════════════════════════════════════════════════════════════ */

SL.Router.register('feed', async (container, params) => {
  let activeTab = params.tab || 'global';
  let page = 0;
  let loading = false;
  let hasMore = true;

  function skeleton() {
    return `
      <div class="loading-state" style="min-height:80px;padding:18px 0">
        <div class="spinner spinner-sm"></div>
        <div>Loading feed...</div>
      </div>
    ` + Array(6).fill(0).map(() => `
      <div style="display:flex;gap:14px;padding:20px 0;border-bottom:1px solid var(--border)">
        <div style="width:42px;height:42px;border-radius:50%;background:var(--surface-2);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="height:14px;width:160px;background:var(--surface-2);border-radius:4px;margin-bottom:10px"></div>
          <div style="height:100px;background:var(--surface-2);border-radius:8px"></div>
        </div>
      </div>
    `).join('');
  }

  function feedCard(entry, myLikes = []) {
    const liked = myLikes.includes(entry.id);
    const stars = entry.rating ? '★'.repeat(entry.rating) + '☆'.repeat(5 - entry.rating) : '';
    const keyframes = Array.isArray(entry.keyframes) ? entry.keyframes.filter(Boolean).slice(0, 4) : [];
    return `
      <div class="feed-card" style="display:flex;gap:14px;padding:16px;border-bottom:1px solid var(--border);margin-bottom:14px">
        <!-- Avatar -->
        <div style="flex-shrink:0">
          <button onclick="SL.Router.navigate('profile',{userId:'${entry.user_id}'})"
            style="background:none;border:none;cursor:pointer;padding:0">
            <img src="${SL.img.profile(entry.avatar_url, 'w92')}"
              style="width:42px;height:42px;border-radius:50%;object-fit:cover;object-position:top;border:1px solid var(--border)" />
          </button>
        </div>

        <!-- Content -->
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:10px">
            <div>
              <button onclick="SL.Router.navigate('profile',{userId:'${entry.user_id}'})"
                style="font-size:14px;font-weight:600;color:var(--text);background:none;border:none;cursor:pointer;padding:0;font-family:inherit">
                ${SL.esc(entry.display_name || entry.username)}
              </button>
              <span style="font-size:13px;color:var(--mist)"> logged a film</span>
            </div>
            <span style="font-size:11px;color:var(--mist)">${SL.fmt.date(entry.created_at)}</span>
          </div>

          <!-- Film card -->
          <div class="feed-movie-panel"
            onclick="SL.Modal.open(${entry.tmdb_id})">
            <img src="${SL.img.poster(entry.poster_path, 'w185')}"
              class="feed-poster" />
            <div style="min-width:0;flex:1">
              <p class="feed-movie-title">
                ${SL.esc(entry.movie_title)}
              </p>
              ${stars ? `
                <div class="feed-rating-row">
                  <span class="feed-stars">${stars.slice(0, entry.rating)}</span>
                  <span class="feed-stars feed-star-empty">${stars.slice(entry.rating)}</span>
                  <span style="font-size:11px;color:var(--mist)">${SL.STAR_LABELS[entry.rating] || ''}</span>
                </div>
              ` : ''}
              ${entry.liked ? `<span style="font-size:11px;color:#e05555">❤️ Liked</span>` : ''}
              ${entry.review ? `
                <p class="feed-review">
                  "${SL.esc(entry.review)}"
                </p>
              ` : ''}
              ${keyframes.length ? `
                <div class="film-table-mini" style="margin-top:10px">
                  ${keyframes.map(path => `<img src="${SL.img.backdrop(path, 'w300')}" alt="" />`).join('')}
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Like button -->
          <div style="margin-top:10px;display:flex;align-items:center;gap:6px">
            <button class="feed-like-btn" data-log="${entry.id}" data-liked="${liked}"
              style="display:flex;align-items:center;gap:5px;font-size:12px;color:${liked ? '#e05555' : 'var(--mist)'};background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 0;transition:color 0.15s">
              <svg width="13" height="13" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>${entry.like_count || 0}</span>
            </button>
            ${entry.watched_on ? `<span style="font-size:11px;color:var(--mist)">Watched ${SL.fmt.date(entry.watched_on)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async function loadPage() {
    if (loading || !hasMore) return;
    loading = true;
    const loader = document.getElementById('feed-loader');
    if (loader) loader.style.display = 'flex';

    try {
      let entries;
      if (activeTab === 'following') {
        if (!SL.Auth.isAuthed()) {
          document.getElementById('feed-list').innerHTML = `
            <div class="empty-state" style="padding:60px 20px">
              <div class="empty-state-icon">👥</div>
              <div class="empty-state-title">Sign in to see your feed</div>
              <div class="empty-state-text">Follow users to see their activity here.</div>
              <button class="btn btn-primary" style="margin-top:16px" onclick="SL.AuthPanel.open()">Sign in</button>
            </div>
          `;
          return;
        }
        entries = await SL.Store.feed.following(page);
      } else {
        entries = await SL.Store.feed.global(page);
      }

      const myLikes = SL.Auth.isAuthed() ? await SL.Store.likes.myLikes() : [];
      const list = document.getElementById('feed-list');

      if (!entries.length) {
        hasMore = false;
        if (page === 0) {
          list.innerHTML = `
            <div class="empty-state" style="padding:60px 20px">
              <div class="empty-state-icon">🎬</div>
              <div class="empty-state-title">${activeTab === 'following' ? 'No activity yet' : 'No reviews yet'}</div>
              <div class="empty-state-text">${activeTab === 'following' ? 'Follow some users to see their logs here.' : 'Be the first to log a film!'}</div>
            </div>
          `;
        }
        return;
      }

      const cards = entries.map(e => feedCard(e, myLikes)).join('');
      if (page === 0) {
        list.innerHTML = cards;
      } else {
        list.insertAdjacentHTML('beforeend', cards);
      }
      page++;

      // Bind like buttons
      list.querySelectorAll('.feed-like-btn:not([data-bound])').forEach(btn => {
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
          if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
          try {
            const nowLiked = await SL.Store.likes.toggle(btn.dataset.log);
            btn.dataset.liked = nowLiked;
            btn.style.color = nowLiked ? '#e05555' : 'var(--mist)';
            btn.querySelector('svg').setAttribute('fill', nowLiked ? 'currentColor' : 'none');
            const countEl = btn.querySelector('span');
            countEl.textContent = Math.max(0, parseInt(countEl.textContent) + (nowLiked ? 1 : -1));
          } catch(e) { SL.toast(e.message); }
        });
      });
    } catch(e) {
      console.error('Feed load error:', e);
      SL.toast('Failed to load feed');
    } finally {
      loading = false;
      if (loader) loader.style.display = 'none';
    }
  }

  function render() {
    container.innerHTML = `
      <div style="max-width:640px;margin:0 auto;padding:104px 20px 80px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">
          <h1 style="font-family:'DM Serif Display',serif;font-size:1.6rem;font-style:italic;color:var(--text)">Activity Feed</h1>
        </div>

        <!-- Tabs -->
        <div style="display:flex;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:4px;margin-bottom:28px">
          ${['global', 'following'].map(tab => `
            <button id="tab-${tab}" onclick="switchTab('${tab}')"
              style="flex:1;padding:8px;border-radius:7px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all 0.2s;
                ${activeTab === tab ? 'background:var(--accent);color:#fff' : 'background:none;color:var(--ghost)'}">
              ${tab === 'global' ? '🌍 Global' : '👥 Following'}
            </button>
          `).join('')}
        </div>

        <!-- Feed list -->
        <div id="feed-list"></div>

        <!-- Loader -->
        <div id="feed-loader" style="display:none;justify-content:center;padding:20px">
          <div class="spinner" style="width:24px;height:24px"></div>
          <span style="margin-left:10px;color:var(--mist);font-size:13px">Loading more activity...</span>
        </div>
      </div>
    `;

    window.switchTab = (tab) => {
      activeTab = tab;
      page = 0;
      hasMore = true;
      document.querySelectorAll('[id^="tab-"]').forEach(t => {
        const isActive = t.id === `tab-${tab}`;
        t.style.background = isActive ? 'var(--accent)' : 'none';
        t.style.color = isActive ? '#fff' : 'var(--ghost)';
      });
      document.getElementById('feed-list').innerHTML = skeleton();
      loadPage();
    };

    document.getElementById('feed-list').innerHTML = skeleton();
    loadPage();

    // Infinite scroll
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadPage();
    }, { threshold: 0.1 });
    observer.observe(document.getElementById('feed-loader'));
  }

  render();
});
