/* ═══════════════════════════════════════════════════════════════
   SineLog — store.js  (Supabase database operations)
   ═══════════════════════════════════════════════════════════════ */

SL.Store = (() => {
  const sb = () => window._supabase;

  // ── Film Logs ────────────────────────────────────────────────
  const logs = {
    async upsert(tmdbId, movieTitle, posterPath, {
      rating,
      review,
      liked,
      rewatch,
      watchedOn,
    } = {}) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Sign in to log films');
      const { data, error } = await sb().from('film_logs').upsert({
        user_id: uid,
        tmdb_id: tmdbId,
        movie_title: movieTitle,
        poster_path: posterPath,
        rating: rating || null,
        review: review || null,
        liked: liked || false,
        is_rewatch: rewatch || false,
        watched_on: watchedOn || new Date().toISOString().slice(0,10),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,tmdb_id' }).select().single();
      if (error) throw error;
      return data;
    },

    async remove(tmdbId) {
      const uid = SL.Auth.uid();
      if (!uid) return;
      const { error } = await sb().from('film_logs')
        .delete().eq('user_id', uid).eq('tmdb_id', tmdbId);
      if (error) throw error;
    },

    async getForUser(userId, page=0, pageSize=20) {
      const from = page * pageSize;
      const { data, error } = await sb().from('film_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return data || [];
    },

    async getMyLog(tmdbId) {
      const uid = SL.Auth.uid();
      if (!uid) return null;
      const { data } = await sb().from('film_logs')
        .select('*').eq('user_id', uid).eq('tmdb_id', tmdbId).maybeSingle();
      return data;
    },

    async getForMovie(tmdbId, limit=20) {
      const { data, error } = await sb().from('activity_feed')
        .select('*').eq('tmdb_id', tmdbId).not('review', 'is', null).limit(limit);
      if (error) throw error;
      return data || [];
    },

  };

  // ── Watchlist ────────────────────────────────────────────────
  const watchlist = {
    async toggle(tmdbId, movieTitle, posterPath) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Sign in to use watchlist');

      const { data: existing } = await sb().from('watchlist')
        .select('id').eq('user_id', uid).eq('tmdb_id', tmdbId).maybeSingle();

      if (existing) {
        await sb().from('watchlist').delete().eq('id', existing.id);
        return false;
      } else {
        await sb().from('watchlist').insert({
          user_id: uid, tmdb_id: tmdbId, movie_title: movieTitle, poster_path: posterPath
        });
        return true;
      }
    },

    async isInList(tmdbId) {
      const uid = SL.Auth.uid();
      if (!uid) return false;
      const { data } = await sb().from('watchlist')
        .select('id').eq('user_id', uid).eq('tmdb_id', tmdbId).maybeSingle();
      return !!data;
    },

    async getForUser(userId) {
      const { data, error } = await sb().from('watchlist')
        .select('*').eq('user_id', userId).order('added_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  };

  // ── Review Reactions ─────────────────────────────────────────
  const likes = {
    async react(logId, type) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Sign in to react to reviews');

      const { data: existing } = await sb().from('review_likes')
        .select('id, reaction_type').eq('user_id', uid).eq('log_id', logId).maybeSingle();

      if (existing) {
        if (existing.reaction_type === type) {
          // Toggle off
          await sb().from('review_likes').delete().eq('id', existing.id);
          return null;
        } else {
          // Switch reaction
          await sb().from('review_likes').update({ reaction_type: type }).eq('id', existing.id);
          return type;
        }
      } else {
        // New reaction
        await sb().from('review_likes').insert({ user_id: uid, log_id: logId, reaction_type: type });
        return type;
      }
    },

    async myReactions() {
      const uid = SL.Auth.uid();
      if (!uid) return [];
      const { data } = await sb().from('review_likes').select('log_id, reaction_type').eq('user_id', uid);
      return data || [];
    },
  };

  // ── Comments ─────────────────────────────────────────────────
  const comments = {
    async getForLog(logId) {
      const { data, error } = await sb().from('review_comments')
        .select('id, content, created_at, user_id, profiles!review_comments_user_id_fkey(username, display_name, avatar_url)')
        .eq('log_id', logId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        content: r.content,
        created_at: r.created_at,
        user_id: r.user_id,
        username: r.profiles.username,
        display_name: r.profiles.display_name,
        avatar_url: r.profiles.avatar_url
      }));
    },
    async add(logId, content) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Sign in to comment');
      const { error } = await sb().from('review_comments').insert({
        user_id: uid,
        log_id: logId,
        content: content
      });
      if (error) throw error;
    },
    async remove(commentId) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Sign in to manage comments');
      const { error } = await sb().from('review_comments').delete().eq('id', commentId).eq('user_id', uid);
      if (error) throw error;
    }
  };

  // ── Follows ──────────────────────────────────────────────────
  const follows = {
    async toggle(targetUserId) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Sign in to follow users');

      const { data: existing } = await sb().from('follows')
        .select('id').eq('follower_id', uid).eq('following_id', targetUserId).maybeSingle();

      if (existing) {
        await sb().from('follows').delete().eq('id', existing.id);
        return false;
      } else {
        await sb().from('follows').insert({ follower_id: uid, following_id: targetUserId });
        return true;
      }
    },

    async isFollowing(targetUserId) {
      const uid = SL.Auth.uid();
      if (!uid) return false;
      const { data } = await sb().from('follows')
        .select('id').eq('follower_id', uid).eq('following_id', targetUserId).maybeSingle();
      return !!data;
    },

    async getFollowing(userId) {
      const { data } = await sb().from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id,username,display_name,avatar_url)')
        .eq('follower_id', userId);
      return (data || []).map(r => r.profiles);
    },

    async getFollowers(userId) {
      const { data } = await sb().from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id,username,display_name,avatar_url)')
        .eq('following_id', userId);
      return (data || []).map(r => r.profiles);
    },
  };

  // ── Profiles ─────────────────────────────────────────────────
  const profiles = {
    async get(userId) {
      const { data, error } = await sb().from('profile_stats')
        .select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    },

    async getByUsername(username) {
      const { data, error } = await sb().from('profile_stats')
        .select('*').eq('username', username).single();
      if (error) throw error;
      return data;
    },

    async myProfile() {
      const uid = SL.Auth.uid();
      if (!uid) return null;
      return profiles.get(uid);
    },

    async update(updates) {
      const uid = SL.Auth.uid();
      if (!uid) throw new Error('Not authenticated');
      const { error } = await sb().from('profiles')
        .update(updates).eq('id', uid);
      if (error) throw error;
    },

    async search(query) {
      const term = String(query || '').replace(/[,%()]/g, ' ').trim();
      if (!term) return [];
      const { data } = await sb().from('profiles')
        .select('id,username,display_name,avatar_url')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(8);
      return data || [];
    },
  };

  // ── Activity feed ─────────────────────────────────────────────
  const feed = {
    async global(page=0, pageSize=20) {
      const from = page * pageSize;
      const { data, error } = await sb().from('activity_feed')
        .select('*').range(from, from + pageSize - 1);
      if (error) throw error;
      return data || [];
    },

    async following(page=0, pageSize=20) {
      const uid = SL.Auth.uid();
      if (!uid) return [];
      const { data: followData } = await sb().from('follows')
        .select('following_id').eq('follower_id', uid);
      const ids = (followData || []).map(r => r.following_id);
      if (!ids.length) return [];

      const from = page * pageSize;
      const { data, error } = await sb().from('activity_feed')
        .select('*').in('user_id', ids).range(from, from + pageSize - 1);
      if (error) throw error;
      return data || [];
    },
  };

  return { logs, watchlist, likes, comments, follows, profiles, feed };
})();
