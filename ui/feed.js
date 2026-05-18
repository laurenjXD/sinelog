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

  function renderCommentsList(container, comments, logId) {
    if (!comments.length) {
      container.innerHTML = '<span style="color:var(--mist)">No replies yet.</span>';
      return;
    }
    const myUid = SL.Auth.uid();
    container.innerHTML = comments.map(c => `
      <div class="comment-item" style="display:flex;gap:8px" data-id="${c.id}" data-log="${logId}">
        <img src="${SL.img.profile(c.avatar_url, 'w92')}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1px solid var(--border);flex-shrink:0" />
        <div style="background:var(--surface-2);border-radius:8px;padding:8px 12px;flex:1;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <span style="font-weight:600;color:var(--text);font-size:12px">${SL.esc(c.display_name || c.username)}</span>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="color:var(--mist);font-size:11px">${SL.fmt.date(c.created_at)}</span>
              ${c.user_id === myUid ? `
                <button class="comment-edit-btn" style="background:none;border:none;color:var(--ghost);cursor:pointer;padding:0;font-size:12px" title="Edit">✎</button>
                <button class="comment-del-btn" style="background:none;border:none;color:var(--ghost);cursor:pointer;padding:0;font-size:14px;line-height:1" title="Delete">×</button>
              ` : ''}
            </div>
          </div>
          <div class="comment-text" style="color:var(--text);font-size:13px;word-break:break-word">${SL.esc(c.content)}</div>
          <form class="comment-edit-form" style="display:none;margin-top:6px;display:none;gap:6px">
            <input type="text" class="input" style="flex:1;padding:4px 8px;font-size:12px;min-height:0;border-radius:4px" value="${SL.esc(c.content)}" required />
            <button type="submit" class="btn btn-primary btn-sm" style="padding:4px 8px;font-size:11px;border-radius:4px">Save</button>
            <button type="button" class="comment-cancel-btn btn btn-sm" style="padding:4px 8px;font-size:11px;border-radius:4px;background:var(--surface-3);border:none;color:var(--text)">Cancel</button>
          </form>
        </div>
      </div>
    `).join('');

    // Bind edit/delete events
    container.querySelectorAll('.comment-item').forEach(item => {
      const editBtn = item.querySelector('.comment-edit-btn');
      const delBtn = item.querySelector('.comment-del-btn');
      const form = item.querySelector('.comment-edit-form');
      const textEl = item.querySelector('.comment-text');
      const cancelBtn = item.querySelector('.comment-cancel-btn');

      if (editBtn) {
        editBtn.addEventListener('click', () => {
          textEl.style.display = 'none';
          form.style.display = 'flex';
          form.querySelector('input').focus();
        });
        cancelBtn.addEventListener('click', () => {
          form.style.display = 'none';
          textEl.style.display = 'block';
        });
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const newVal = form.querySelector('input').value.trim();
          if (!newVal) return;
          try {
            form.querySelector('button[type="submit"]').disabled = true;
            await SL.Store.comments.update(item.dataset.id, newVal);
            textEl.textContent = newVal;
            form.style.display = 'none';
            textEl.style.display = 'block';
          } catch (err) {
            SL.toast(err.message);
          } finally {
            form.querySelector('button[type="submit"]').disabled = false;
          }
        });
      }

      if (delBtn) {
        delBtn.addEventListener('click', async () => {
          if (!confirm('Delete this reply?')) return;
          try {
            await SL.Store.comments.remove(item.dataset.id);
            item.remove();

            // update counter
            const counter = document.querySelector(`.feed-comment-btn[data-log="${logId}"] .count`);
            if (counter) counter.textContent = Math.max(0, parseInt(counter.textContent) - 1);
          } catch (err) {
            SL.toast(err.message);
          }
        });
      }
    });
  }

  function feedCard(entry, myReactions = []) {
    const myReaction = myReactions.find(r => r.log_id === entry.id)?.reaction_type;
    const isLike = myReaction === 'like';
    const isDislike = myReaction === 'dislike';
    const stars = SL.ratingStars(entry.rating);
    return `
      <div class="feed-card" style="display:flex;gap:14px;padding:16px;border-bottom:1px solid var(--border);margin-bottom:14px">
        <!-- Avatar -->
        <div style="flex-shrink:0">
          <button onclick="SL.Router.navigate('profile',{userId:'${entry.user_id}'})"
            style="background:none;border:none;cursor:pointer;padding:0">
            <img src="${SL.img.profile(entry.avatar_url, 'w92')}"
              onerror="this.onerror=null; this.src='https://placehold.co/96x96/e4e4ee/8080a0?text=${encodeURIComponent((entry.display_name||entry.username||'?')[0].toUpperCase())}';"
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
                  <span class="feed-stars">${stars}</span>
                  <span style="font-size:11px;color:var(--mist)">${SL.ratingText(entry.rating)} - ${SL.ratingLabel(entry.rating)}</span>
                </div>
              ` : ''}
              ${entry.liked ? `<span style="font-size:11px;color:#e05555">❤️ Liked</span>` : ''}
              ${entry.is_rewatch ? `<span class="rewatch-badge" style="margin-left:${entry.liked ? '8px' : '0'}">Rewatch</span>` : ''}
              ${entry.review ? `
                <div style="margin-top:8px">
                  ${entry.has_spoilers ? `<span class="spoiler-warning" onclick="event.stopPropagation(); this.nextElementSibling.classList.toggle('revealed')">might contain spoilers - be warned! tap to unveil! </span>` : ''}
                  <p class="feed-review ${entry.has_spoilers ? 'review-spoilers' : ''}" ${entry.has_spoilers ? `onclick="event.stopPropagation(); this.classList.toggle('revealed')"` : ''}>
                    "${SL.esc(entry.review)}"
                  </p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="margin-top:10px;display:flex;align-items:center;gap:16px">
            <!-- Like (Thumbs Up) -->
            <button class="feed-react-btn" data-log="${entry.id}" data-type="like" data-active="${isLike}"
              style="display:flex;align-items:center;gap:5px;font-size:12px;color:${isLike ? '#4f46e5' : 'var(--mist)'};background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 0;transition:color 0.15s">
              <svg width="14" height="14" fill="${isLike ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span class="count">${entry.like_count || 0}</span>
            </button>
            <!-- Dislike (Thumbs Down) -->
            <button class="feed-react-btn" data-log="${entry.id}" data-type="dislike" data-active="${isDislike}"
              style="display:flex;align-items:center;gap:5px;font-size:12px;color:${isDislike ? 'var(--ghost)' : 'var(--mist)'};background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 0;transition:color 0.15s">
              <svg width="14" height="14" fill="${isDislike ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
              <span class="count">${entry.dislike_count || 0}</span>
            </button>
            <!-- Comment -->
            <button class="feed-comment-btn" data-log="${entry.id}"
              style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--mist);background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 0;transition:color 0.15s">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <span class="count">${entry.comment_count || 0}</span>
            </button>
            <div style="flex:1"></div>
            ${entry.watched_on ? `<span style="font-size:11px;color:var(--mist)">Watched ${SL.fmt.date(entry.watched_on)}</span>` : ''}
          </div>

          <!-- Comments Thread -->
          <div id="comments-${entry.id}" style="display:none;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
            <div class="comments-list" style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px;max-height:240px;overflow-y:auto;font-size:13px"></div>
            <form class="comment-form" data-log="${entry.id}" style="display:flex;gap:8px">
              <input type="text" class="input" placeholder="Write a reply..." required style="padding:8px 12px;font-size:13px;border-radius:8px;min-height:0" />
              <button type="submit" class="btn btn-primary btn-sm" style="padding:8px 14px;border-radius:8px">Post</button>
            </form>
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

      const myReactions = SL.Auth.isAuthed() ? await SL.Store.likes.myReactions() : [];
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

      const cards = entries.map(e => feedCard(e, myReactions)).join('');
      if (page === 0) {
        list.innerHTML = cards;
      } else {
        list.insertAdjacentHTML('beforeend', cards);
      }
      page++;

      // Bind reaction buttons
      list.querySelectorAll('.feed-react-btn:not([data-bound])').forEach(btn => {
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
          if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
          try {
            const type = btn.dataset.type;
            const newReaction = await SL.Store.likes.react(btn.dataset.log, type);

            const container = btn.closest('.feed-card');
            const likeBtn = container.querySelector('.feed-react-btn[data-type="like"]');
            const dislikeBtn = container.querySelector('.feed-react-btn[data-type="dislike"]');

            const isLikeActive = likeBtn.dataset.active === 'true';
            const isDislikeActive = dislikeBtn.dataset.active === 'true';

            let likeCount = parseInt(likeBtn.querySelector('.count').textContent);
            let dislikeCount = parseInt(dislikeBtn.querySelector('.count').textContent);

            if (isLikeActive) likeCount--;
            if (isDislikeActive) dislikeCount--;

            if (newReaction === 'like') likeCount++;
            if (newReaction === 'dislike') dislikeCount++;

            likeBtn.dataset.active = (newReaction === 'like').toString();
            likeBtn.style.color = newReaction === 'like' ? '#e05555' : 'var(--mist)';
            likeBtn.querySelector('svg').setAttribute('fill', newReaction === 'like' ? 'currentColor' : 'none');
            likeBtn.querySelector('.count').textContent = likeCount;

            dislikeBtn.dataset.active = (newReaction === 'dislike').toString();
            dislikeBtn.style.color = newReaction === 'dislike' ? 'var(--ghost)' : 'var(--mist)';
            dislikeBtn.querySelector('svg').setAttribute('fill', newReaction === 'dislike' ? 'currentColor' : 'none');
            dislikeBtn.querySelector('.count').textContent = dislikeCount;
          } catch (e) { SL.toast(e.message); }
        });
      });

      // Bind comment toggles
      list.querySelectorAll('.feed-comment-btn:not([data-bound])').forEach(btn => {
        btn.dataset.bound = '1';
        btn.addEventListener('click', async () => {
          const logId = btn.dataset.log;
          const section = document.getElementById(`comments-${logId}`);
          const listEl = section.querySelector('.comments-list');

          if (section.style.display === 'block') {
            section.style.display = 'none';
            return;
          }

          section.style.display = 'block';
          listEl.innerHTML = '<div class="spinner spinner-sm" style="margin:10px auto"></div>';

          try {
            const comments = await SL.Store.comments.getForLog(logId);
            renderCommentsList(listEl, comments, logId);
          } catch (e) {
            listEl.innerHTML = `<span style="color:#dc2626">Failed to load comments</span>`;
          }
        });
      });

      // Bind comment submits
      list.querySelectorAll('.comment-form:not([data-bound])').forEach(form => {
        form.dataset.bound = '1';
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          if (!SL.Auth.isAuthed()) { SL.AuthPanel.open(); return; }
          const logId = form.dataset.log;
          const input = form.querySelector('input');
          const submitBtn = form.querySelector('button');
          const text = input.value.trim();
          if (!text) return;

          submitBtn.disabled = true;
          try {
            await SL.Store.comments.add(logId, text);
            input.value = '';

            const listEl = document.getElementById(`comments-${logId}`).querySelector('.comments-list');
            listEl.innerHTML = '<div class="spinner spinner-sm" style="margin:10px auto"></div>';
            const comments = await SL.Store.comments.getForLog(logId);
            renderCommentsList(listEl, comments, logId);

            // Increment counter visually
            const counter = form.closest('.feed-card').querySelector('.feed-comment-btn .count');
            counter.textContent = parseInt(counter.textContent) + 1;
          } catch (err) {
            SL.toast(err.message);
          } finally {
            submitBtn.disabled = false;
          }
        });
      });
    } catch (e) {
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
          <h1 style="font-family:var(--font-heading);font-size:1.6rem;color:var(--text)">Activity Feed</h1>
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
