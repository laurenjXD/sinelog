/* ═══════════════════════════════════════════════════════════════
   SineLog — ui/profile.js  (User Profile)
   ═══════════════════════════════════════════════════════════════ */

SL.Router.register('profile', async (container, params) => {
  const targetId = params.userId || SL.Auth.uid();
  if (!targetId) {
    container.innerHTML = `
      <div class="empty-state" style="padding:120px 20px">
        <div class="empty-state-icon">🔐</div>
        <div class="empty-state-title">Sign in to view your profile</div>
        <div class="empty-state-text">Your films, watchlist, likes, and reviews appear here after you sign in.</div>
        <button class="btn btn-primary" style="margin-top:16px" onclick="SL.AuthPanel.open()">Sign in</button>
      </div>
    `;
    return;
  }

  const isOwnProfile = targetId === SL.Auth.uid();
  let activeTab = 'films';
  let profile, isFollowing;
  let tabState = { page: 0, hasMore: true, loading: false };

  function filmVisual(log, posterSize = 'w342') {
    return `<img src="${SL.img.poster(log.poster_path, posterSize)}" loading="lazy" alt="${SL.esc(log.movie_title || 'Film poster')}"
      class="movie-card-poster" />`;
  }

  container.innerHTML = `
    <div style="max-width:860px;margin:0 auto;padding:104px 20px 80px">
      <div class="loading-state vertical" style="padding:80px 0">
        <div class="spinner" style="width:36px;height:36px"></div>
        <div>Loading profile...</div>
      </div>
    </div>
  `;

  try {
    [profile, isFollowing] = await Promise.all([
      SL.Store.profiles.get(targetId),
      isOwnProfile ? Promise.resolve(false) : SL.Store.follows.isFollowing(targetId),
    ]);
  } catch(e) {
    container.innerHTML = `<div class="empty-state" style="padding:80px 20px"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Profile not found</div><div class="empty-state-text">This profile is unavailable or could not be loaded.</div></div>`;
    return;
  }

  async function renderTab(append = false) {
    const tabContent = document.getElementById('profile-tab-content');
    const loadMoreBtn = document.getElementById('profile-load-more-btn');
    if (!tabContent) return;
    
    if (!append) {
      tabContent.innerHTML = `<div class="loading-state"><div class="spinner" style="width:28px;height:28px"></div><div>Loading this section...</div></div>`;
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      tabState.page = 0;
      tabState.hasMore = true;
    }
    
    if (tabState.loading || !tabState.hasMore) return;
    tabState.loading = true;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    try {
      const pageSize = 40;
      let newHtml = '';
      let items = [];

      if (activeTab === 'films') {
        items = await SL.Store.logs.getForUser(targetId, tabState.page, pageSize);
        if (items.length < pageSize) tabState.hasMore = false;
        if (!items.length && tabState.page === 0) {
          newHtml = `<div class="empty-state" style="padding:40px 0"><div class="empty-state-icon">🎬</div><div class="empty-state-title">No films logged yet</div><div class="empty-state-text">Logged films will appear here.</div></div>`;
        } else {
          newHtml = items.map(l => `
            <div class="movie-card" onclick="SL.Modal.open(${l.tmdb_id})">
              <div class="movie-poster-frame">
                ${filmVisual(l)}
                ${l.rating ? `<div class="profile-rating-strip">${SL.ratingText(l.rating)}</div>` : ''}
                ${l.is_rewatch ? `<div class="rewatch-poster-badge">Rewatch</div>` : ''}
              </div>
              <p class="profile-poster-title">${SL.esc(l.movie_title)}</p>
            </div>
          `).join('');
          if (!append) newHtml = `<div class="poster-grid">${newHtml}</div>`;
        }
      } else if (activeTab === 'watchlist') {
        items = await SL.Store.watchlist.getForUser(targetId, tabState.page, pageSize);
        if (items.length < pageSize) tabState.hasMore = false;
        if (!items.length && tabState.page === 0) {
          newHtml = `<div class="empty-state" style="padding:40px 0"><div class="empty-state-icon">📋</div><div class="empty-state-title">Watchlist is empty</div><div class="empty-state-text">Films saved for later will appear here.</div></div>`;
        } else {
          newHtml = items.map(l => `
            <div class="movie-card" onclick="SL.Modal.open(${l.tmdb_id})">
              <div class="movie-poster-frame">${filmVisual(l)}</div>
              <p class="profile-poster-title">${SL.esc(l.movie_title)}</p>
            </div>
          `).join('');
          if (!append) newHtml = `<div class="poster-grid">${newHtml}</div>`;
        }
      } else if (activeTab === 'liked') {
        items = await SL.Store.logs.getLikedForUser(targetId, tabState.page, pageSize);
        if (items.length < pageSize) tabState.hasMore = false;
        if (!items.length && tabState.page === 0) {
          newHtml = `<div class="empty-state" style="padding:40px 0"><div class="empty-state-icon">❤️</div><div class="empty-state-title">No liked films yet</div><div class="empty-state-text">Liked films will appear here.</div></div>`;
        } else {
          newHtml = items.map(l => `
            <div class="movie-card" onclick="SL.Modal.open(${l.tmdb_id})">
              <div class="movie-poster-frame">
                <img src="${SL.img.poster(l.poster_path,'w342')}" loading="lazy" class="movie-card-poster" />
                <div class="movie-card-rating">♥</div>
              </div>
              <p class="profile-poster-title">${SL.esc(l.movie_title)}</p>
            </div>
          `).join('');
          if (!append) newHtml = `<div class="poster-grid">${newHtml}</div>`;
        }
      } else if (activeTab === 'reviews') {
        items = await SL.Store.logs.getReviewsForUser(targetId, tabState.page, pageSize);
        if (items.length < pageSize) tabState.hasMore = false;
        if (!items.length && tabState.page === 0) {
          newHtml = `<div class="empty-state" style="padding:40px 0"><div class="empty-state-icon">✍️</div><div class="empty-state-title">No reviews written yet</div><div class="empty-state-text">Reviews will appear here after films are logged with notes.</div></div>`;
        } else {
          newHtml = items.map(r => `
            <div style="display:flex;gap:14px;padding:16px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="SL.Modal.open(${r.tmdb_id})">
              <img src="${SL.img.poster(r.poster_path,'w185')}" alt="${SL.esc(r.movie_title)} poster"
                style="width:50px;aspect-ratio:2/3;object-fit:cover;border-radius:7px;border:1px solid var(--border);flex-shrink:0" />
              <div style="min-width:0">
                <p style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px">${SL.esc(r.movie_title)}</p>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                  ${r.rating ? `<span style="font-size:13px;color:var(--accent)">${SL.ratingStars(r.rating)} ${SL.ratingText(r.rating)}</span>` : ''}
                  ${r.is_rewatch ? `<span class="rewatch-badge">Rewatch</span>` : ''}
                </div>
                <div style="margin-top:6px">
                  ${r.has_spoilers ? `<span class="spoiler-warning" onclick="event.stopPropagation(); this.nextElementSibling.classList.toggle('revealed')">⚠️ Contains Spoilers — Click to reveal</span>` : ''}
                  <p style="font-size:13px;color:var(--ghost);line-height:1.65" class="${r.has_spoilers ? 'review-spoilers' : ''}" ${r.has_spoilers ? `onclick="event.stopPropagation(); this.classList.toggle('revealed')"` : ''}>${SL.esc(r.review)}</p>
                </div>
                <p style="font-size:11px;color:var(--mist);margin-top:6px">${SL.fmt.date(r.created_at)}</p>
              </div>
            </div>
          `).join('');
          if (!append) newHtml = `<div class="reviews-list">${newHtml}</div>`;
        }
      }

      if (!append) {
        tabContent.innerHTML = newHtml;
      } else if (items.length) {
        const container = tabContent.firstElementChild;
        if (container) container.insertAdjacentHTML('beforeend', newHtml);
      }
      tabState.page++;

    } catch(e) {
      if (!append) {
        tabContent.innerHTML = `<div class="empty-state" style="padding:40px 0"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load</div><div class="empty-state-text">This section could not be loaded right now.</div></div>`;
      }
    } finally {
      tabState.loading = false;
      if (loadMoreBtn && tabState.hasMore) {
        loadMoreBtn.style.display = 'inline-flex';
      }
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('[data-profile-tab]').forEach(btn => {
      const isActive = btn.dataset.profileTab === tab;
      btn.style.borderBottomColor = isActive ? 'var(--accent)' : 'transparent';
      btn.style.color = isActive ? 'var(--accent)' : 'var(--mist)';
      btn.style.fontWeight = isActive ? '600' : '400';
    });
    renderTab();
  }

  function statBlock(value, label, clickFn = null) {
    return `
      <div style="text-align:center;${clickFn ? 'cursor:pointer' : ''}" ${clickFn ? `onclick="${clickFn}"` : ''}>
        <div style="font-size:1.4rem;font-weight:700;color:var(--text)">${value}</div>
        <div style="font-size:11px;color:var(--mist);text-transform:uppercase;letter-spacing:0.06em">${label}</div>
      </div>
    `;
  }

  function compatibilitySection() {
    if (isOwnProfile) return '';
    return `
      <div id="compatibility-card" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;margin:-12px 0 30px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
          <div style="min-width:0;flex:1">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--mist);font-weight:600;margin-bottom:6px">Friend Compatibility</p>
            <p style="font-size:13px;color:var(--ghost);line-height:1.6">Compare your logged films, ratings, likes, and watchlists.</p>
          </div>
          <button id="compatibility-btn" class="btn btn-ghost btn-sm" onclick="calculateCompatibility()">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/><path d="M8 12c1.7 0 3-1.3 3-3S9.7 6 8 6 5 7.3 5 9s1.3 3 3 3z"/><path d="M2 20c.5-3 2.6-5 6-5 1.6 0 2.9.4 4 1.2"/><path d="M14 19l2 2 5-5"/></svg>
            Compare
          </button>
        </div>
        <div id="compatibility-result" style="display:none;margin-top:14px"></div>
      </div>
    `;
  }

  function scoreLabel(score) {
    if (score >= 90) return 'Soulmates';
    if (score >= 80) return 'Excellent match';
    if (score >= 65) return 'Strong match';
    if (score >= 50) return 'Good overlap';
    if (score >= 30) return 'Some overlap';
    if (score >= 15) return 'Different taste lanes';
    return 'Polar opposites';
  }

  function sharedLogScore(a, b) {
    let score = 50;
    if (a.rating && b.rating) {
      const diff = Math.abs(a.rating - b.rating);
      score = 100 - (diff * diff * 5 + diff * 12);
    } else if (a.rating || b.rating) {
      score = 60;
    }
    
    if (a.liked && b.liked) score += 15;
    else if (!a.liked && !b.liked) score += 4;
    else if (a.liked !== b.liked && (a.liked || b.liked)) score -= 15;

    if (a.is_rewatch && b.is_rewatch) score += 8;
    else if (a.is_rewatch !== b.is_rewatch && (a.is_rewatch || b.is_rewatch)) score -= 4;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function renderCompatibilityResult(myLogs, theirLogs, myWatchlist, theirWatchlist) {
    const theirByMovie = new Map(theirLogs.map(log => [log.tmdb_id, log]));
    const sharedLogs = myLogs
      .filter(log => theirByMovie.has(log.tmdb_id))
      .map(myLog => {
        const theirLog = theirByMovie.get(myLog.tmdb_id);
        return { myLog, theirLog, score: sharedLogScore(myLog, theirLog) };
      })
      .sort((a, b) => b.score - a.score);

    const theirWatchIds = new Set(theirWatchlist.map(item => item.tmdb_id));
    const sharedWatchlist = myWatchlist.filter(item => theirWatchIds.has(item.tmdb_id));

    const ratingScore = sharedLogs.length
      ? sharedLogs.reduce((sum, item) => sum + item.score, 0) / sharedLogs.length
      : 0;
    const watchScore = sharedWatchlist.length ? Math.min(100, 45 + sharedWatchlist.length * 12) : 0;
    const finalScore = Math.round(sharedLogs.length ? (ratingScore * 0.82 + watchScore * 0.18) : watchScore);
    const label = scoreLabel(finalScore);

    const sharedHtml = sharedLogs.slice(0, 5).map(({ myLog, theirLog, score }) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="SL.Modal.open(${myLog.tmdb_id})">
        <img src="${SL.img.poster(myLog.poster_path || theirLog.poster_path,'w92')}" style="width:34px;aspect-ratio:2/3;object-fit:cover;border-radius:5px;border:1px solid var(--border);flex-shrink:0" />
        <div style="min-width:0;flex:1">
          <p style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${SL.esc(myLog.movie_title)}</p>
          <p style="font-size:11px;color:var(--mist)">You ${myLog.rating || '-'} / ${theirLog.rating || '-'} them</p>
        </div>
        <span style="font-size:12px;font-weight:700;color:${score >= 70 ? 'var(--accent)' : 'var(--mist)'}">${Math.round(score)}%</span>
      </div>
    `).join('');

    const watchHtml = sharedWatchlist.slice(0, 4).map(item => `
      <button onclick="SL.Modal.open(${item.tmdb_id})" style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border);background:var(--surface-2);border-radius:999px;padding:5px 10px;font-size:11px;color:var(--ghost);font-family:inherit;cursor:pointer;margin:0 6px 6px 0">
        ${SL.esc(item.movie_title)}
      </button>
    `).join('');

    return `
      <div style="display:grid;grid-template-columns:minmax(110px,150px) 1fr;gap:18px;align-items:start">
        <div style="text-align:center;background:var(--accent-dim);border:1px solid rgba(var(--accent-rgb),0.24);border-radius:12px;padding:18px 12px">
          <div style="font-size:2.2rem;font-weight:800;color:var(--accent);line-height:1">${finalScore}%</div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--ghost);margin-top:6px">${label}</div>
        </div>
        <div style="min-width:0">
          <p style="font-size:13px;color:var(--ghost);line-height:1.65;margin-bottom:10px">
            ${sharedLogs.length
              ? `You both logged ${sharedLogs.length} film${sharedLogs.length === 1 ? '' : 's'}. The score is based mostly on how closely your ratings and likes line up.`
              : sharedWatchlist.length
                ? `No shared logged films yet, but your watchlists overlap on ${sharedWatchlist.length} title${sharedWatchlist.length === 1 ? '' : 's'}.`
                : 'No shared logged films or watchlist overlap yet.'}
          </p>
          ${sharedHtml || `<p style="font-size:13px;color:var(--mist);padding:10px 0">Log some of the same films to unlock a stronger comparison.</p>`}
          ${watchHtml ? `<div style="margin-top:12px"><p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--mist);font-weight:600;margin-bottom:8px">Shared Watchlist</p>${watchHtml}</div>` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="max-width:860px;margin:0 auto;padding:104px 20px 80px">

      <!-- Profile header -->
      <div style="display:flex;flex-wrap:wrap;align-items:flex-start;gap:24px;margin-bottom:36px">

        <!-- Avatar -->
        <div style="position:relative">
          <img src="${profile.avatar_url ? SL.img.profile(profile.avatar_url,'w185') : 'https://placehold.co/96x96/e4e4ee/8080a0?text=' + encodeURIComponent((profile.display_name||profile.username||'?')[0].toUpperCase())}"
            onerror="this.onerror=null; this.src='https://placehold.co/96x96/e4e4ee/8080a0?text=${encodeURIComponent((profile.display_name||profile.username||'?')[0].toUpperCase())}';"
            style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid var(--border)" />
        </div>

        <!-- Info -->
        <div style="flex:1;min-width:200px">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:6px">
            <h1 style="font-family:var(--font-heading);font-size:1.5rem;color:var(--text)">
              ${SL.esc(profile.display_name || profile.username)}
            </h1>
            <span style="font-size:13px;color:var(--mist)">@${SL.esc(profile.username)}</span>
          </div>

          ${profile.bio ? `<p style="font-size:14px;color:var(--ghost);line-height:1.6;margin-bottom:12px;max-width:480px">${SL.esc(profile.bio)}</p>` : ''}

          <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px">
            ${statBlock(profile.films_logged || 0, 'Films')}
            ${statBlock(profile.films_liked || 0, 'Liked')}
            ${statBlock(profile.watchlist_count || 0, 'Watchlist')}
            ${statBlock(profile.followers_count || 0, 'Followers', `showFollowModal('followers','${targetId}')`)}
            ${statBlock(profile.following_count || 0, 'Following', `showFollowModal('following','${targetId}')`)}
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${isOwnProfile ? `
              <button class="btn btn-ghost btn-sm" onclick="openEditProfile()">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
            ` : `
              <button id="follow-btn" class="btn ${isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm"
                onclick="toggleFollow()">
                ${isFollowing ? 'Following' : '+ Follow'}
              </button>
            `}
          </div>
        </div>
      </div>

      ${compatibilitySection()}

      <!-- Tabs -->
      <div class="profile-tabs">
        ${[['films','Films'],['watchlist','Watchlist'],['liked','Liked'],['reviews','Reviews']].map(([tab, label]) => `
          <button data-profile-tab="${tab}" onclick="switchProfileTab('${tab}')"
            style="padding:10px 16px;border:none;border-bottom:2px solid ${tab === activeTab ? 'var(--accent)' : 'transparent'};margin-bottom:-2px;background:none;cursor:pointer;font-family:inherit;font-size:13px;color:${tab === activeTab ? 'var(--accent)' : 'var(--mist)'};font-weight:${tab === activeTab ? '600' : '400'};transition:all 0.15s;white-space:nowrap">
            ${label}
          </button>
        `).join('')}
      </div>

      <!-- Tab content -->
      <div id="profile-tab-content"></div>
      
      <!-- Load More Button -->
      <div style="text-align:center; padding:20px 0;">
        <button id="profile-load-more-btn" class="btn btn-ghost" style="display:none;margin:0 auto;border-radius:20px;padding:8px 24px" onclick="if(window.loadProfileTab) window.loadProfileTab()">Load More</button>
      </div>

    </div>

    <!-- Follow modal -->
    <div id="follow-modal" style="display:none;position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px)" onclick="closeFollowModal()"></div>
      <div class="glass-modal" style="position:relative;width:100%;max-width:400px;max-height:70vh;overflow-y:auto;border-radius:16px;padding:24px">
        <button onclick="closeFollowModal()" style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;color:var(--mist)">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div id="follow-modal-content"></div>
      </div>
    </div>

    <!-- Edit profile modal -->
    <div id="edit-modal" style="display:none;position:fixed;inset:0;z-index:1000;align-items:center;justify-content:center;padding:20px">
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px)" onclick="closeEditProfile()"></div>
      <div class="glass-modal" style="position:relative;width:100%;max-width:460px;max-height:calc(100vh - 40px);overflow-y:auto;border-radius:16px;padding:28px">
        <button onclick="closeEditProfile()" style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;color:var(--mist)">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <h2 style="font-family:var(--font-heading);font-size:1.3rem;color:var(--text);margin-bottom:20px">Edit Profile</h2>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label class="input-label">Display Name</label>
            <input class="input" id="edit-displayname" type="text" value="${SL.esc(profile.display_name || '')}" />
          </div>
          <div class="form-group">
            <label class="input-label">Bio</label>
            <textarea class="input" id="edit-bio" rows="3" style="resize:vertical">${SL.esc(profile.bio || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="input-label">Avatar URL</label>
            <input class="input" id="edit-avatar" type="url" value="${SL.esc(profile.avatar_url || '')}" placeholder="https://..." />
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%;justify-content:center;margin-top:4px" id="edit-save-btn" onclick="saveProfile()">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  `;

  renderTab();

  // Global handlers
  window.switchProfileTab = switchTab;
  window.loadProfileTab = () => renderTab(true);

  window.calculateCompatibility = async () => {
    if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
    if (isOwnProfile) return;

    const btn = document.getElementById('compatibility-btn');
    const result = document.getElementById('compatibility-result');
    if (!btn || !result) return;

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Comparing';
    result.style.display = 'block';
    result.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;color:var(--mist);font-size:13px">
        <div class="spinner spinner-sm"></div>
        Comparing film diaries...
      </div>
    `;

    try {
      const [myLogs, theirLogs, myWatchlist, theirWatchlist] = await Promise.all([
        SL.Store.logs.getForUser(SL.Auth.uid(), 0, 100),
        SL.Store.logs.getForUser(targetId, 0, 100),
        SL.Store.watchlist.getForUser(SL.Auth.uid()),
        SL.Store.watchlist.getForUser(targetId),
      ]);
      
      let aiResponseText = "";
      try {
        const myName = SL.Auth.user()?.user_metadata?.display_name || SL.Auth.user()?.user_metadata?.username || "me";
        const theirName = profile.display_name || profile.username || "this user";

        const prompt = `You are an expert film critic AI for the SineLog app.
I am ${myName}, visiting ${theirName}'s profile.

My recently watched/liked movies:
${myLogs.slice(0, 15).map(l => `- "${l.movie_title}": ${l.rating || 0}/5 stars ${l.liked ? '(Liked)' : ''}`).join('\n')}

${theirName}'s recently watched/liked movies:
${theirLogs.slice(0, 15).map(l => `- "${l.movie_title}": ${l.rating || 0}/5 stars ${l.liked ? '(Liked)' : ''}`).join('\n')}

Calculate our Cinematic Compatibility Score (0-100%) based on genres, themes, and ratings. 
Do NOT use markdown. Format your response exactly like this using HTML tags:
<div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:8px">Compatibility: [Score]%</div>
<div style="margin-bottom:8px"><strong>Verdict:</strong> [1 sentence summary about our taste overlap using our actual names (${myName} and ${theirName})]</div>
<div><strong>Details:</strong><br/>- [Reason 1 based on our shared or differing tastes]<br/>- [Reason 2 based on our shared or differing tastes]</div>`;

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), 15000));
        const aiResponse = await Promise.race([puter.ai.chat(prompt), timeout]);
        
        // Robust extraction
        if (typeof aiResponse === 'string') {
          aiResponseText = aiResponse;
        } else if (aiResponse?.message?.content) {
          const content = aiResponse.message.content;
          if (typeof content === 'string') aiResponseText = content;
          else if (Array.isArray(content)) aiResponseText = content.map(block => block.text || JSON.stringify(block)).join('\\n');
          else aiResponseText = JSON.stringify(content);
        } else if (aiResponse?.text) {
          aiResponseText = aiResponse.text;
        } else if (aiResponse?.toString && typeof aiResponse.toString === 'function' && aiResponse.toString() !== '[object Object]') {
          aiResponseText = aiResponse.toString();
        } else {
          aiResponseText = JSON.stringify(aiResponse);
        }

        if (!aiResponseText || aiResponseText === '[object Object]') throw new Error("Empty or invalid AI response");
        result.innerHTML = `<div style="font-size:13px;color:var(--text);line-height:1.6">${aiResponseText}</div>`;
      } catch (aiErr) {
        console.warn("Puter AI failed, falling back to local compatibility:", aiErr);
        result.innerHTML = renderCompatibilityResult(myLogs, theirLogs, myWatchlist, theirWatchlist);
      }
    } catch(e) {
      console.error('Compatibility error:', e);
      result.innerHTML = `
        <p style="font-size:13px;color:var(--ghost);line-height:1.6">
          Could not compare profiles right now. ${SL.esc(e.message || '')}
        </p>
      `;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/><path d="M8 12c1.7 0 3-1.3 3-3S9.7 6 8 6 5 7.3 5 9s1.3 3 3 3z"/><path d="M2 20c.5-3 2.6-5 6-5 1.6 0 2.9.4 4 1.2"/><path d="M14 19l2 2 5-5"/></svg> Compare';
    }
  };

  window.toggleFollow = async () => {
    if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
    try {
      isFollowing = await SL.Store.follows.toggle(targetId);
      const btn = document.getElementById('follow-btn');
      if (btn) {
        btn.textContent = isFollowing ? 'Following' : '+ Follow';
        btn.className = `btn ${isFollowing ? 'btn-ghost' : 'btn-primary'} btn-sm`;
      }
      SL.toast(isFollowing ? `Following ${profile.display_name || profile.username}` : 'Unfollowed');
    } catch(e) { SL.toast(e.message); }
  };

  window.showFollowModal = async (type, userId) => {
    const modal = document.getElementById('follow-modal');
    const content = document.getElementById('follow-modal-content');
    modal.style.display = 'flex';
    content.innerHTML = `<div class="loading-state" style="padding:30px"><div class="spinner" style="width:24px;height:24px"></div><div>Loading users...</div></div>`;
    try {
      const users = type === 'followers'
        ? await SL.Store.follows.getFollowers(userId)
        : await SL.Store.follows.getFollowing(userId);
      content.innerHTML = `
        <h3 style="font-size:1rem;font-weight:600;color:var(--text);margin-bottom:16px">${type === 'followers' ? 'Followers' : 'Following'} (${users.length})</h3>
        ${users.length ? users.map(u => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer"
            onclick="closeFollowModal();SL.Router.navigate('profile',{userId:'${u.id}'})">
            <img src="${SL.img.profile(u.avatar_url,'w92')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid var(--border)" />
            <div>
              <p style="font-size:14px;font-weight:600;color:var(--text)">${SL.esc(u.display_name || u.username)}</p>
              <p style="font-size:12px;color:var(--mist)">@${SL.esc(u.username)}</p>
            </div>
          </div>
        `).join('') : `<div class="empty-state" style="padding:20px 0"><div class="empty-state-title">No ${type} yet</div><div class="empty-state-text">Users will appear here once connections are added.</div></div>`}
      `;
    } catch(e) {
      content.innerHTML = `<div class="empty-state" style="padding:20px"><div class="empty-state-title">Failed to load</div><div class="empty-state-text">Could not load these users right now.</div></div>`;
    }
  };

  window.closeFollowModal = () => {
    document.getElementById('follow-modal').style.display = 'none';
  };

  window.openEditProfile = () => {
    document.getElementById('edit-modal').style.display = 'flex';
  };

  window.closeEditProfile = () => {
    document.getElementById('edit-modal').style.display = 'none';
  };

  window.saveProfile = async () => {
    const btn = document.getElementById('edit-save-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner spinner-sm"></div> Saving';
    try {
      const updates = {
        display_name: document.getElementById('edit-displayname').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
        avatar_url: document.getElementById('edit-avatar').value.trim() || null,
      };
      await SL.Store.profiles.update(updates);
      SL.toast('Profile updated!');
      closeEditProfile();
      // Refresh
      SL.Router.navigate('profile', { userId: targetId });
    } catch(e) {
      SL.toast(e.message);
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  };
});
