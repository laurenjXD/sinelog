/* ═══════════════════════════════════════════════════════════════
   SineLog — auth.js  (Supabase Authentication)
   ═══════════════════════════════════════════════════════════════ */

SL.Auth = (() => {
  let _session = null;
  let _listeners = [];

  const session  = () => _session;
  const user     = () => _session?.user || null;
  const uid      = () => _session?.user?.id || null;
  const isAuthed = () => !!_session;

  function notify(event, s) {
    _session = s;
    _listeners.forEach(fn => fn(event, s));
  }

  function onAuthChange(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  }

  async function init() {
    const { data } = await window._supabase.auth.getSession();
    _session = data.session;

    window._supabase.auth.onAuthStateChange((event, session) => {
      notify(event, session);
      SL.Nav?.update();
      if (event === 'PASSWORD_RECOVERY') {
        SL.AuthPanel?.open('update_password');
      }
    });
    return _session;
  }

  async function signUp(email, password, username, displayName) {
    const { data: existing } = await window._supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) throw new Error('Username already taken. Try another.');

    const { data, error } = await window._supabase.auth.signUp({
      email, password,
      options: {
        data: { username, display_name: displayName || username },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`
      }
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await window._supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await window._supabase.auth.signOut();
    if (error) throw error;
  }

  async function resetPassword(email) {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await window._supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return data;
  }

  async function updatePassword(password) {
    const { data, error } = await window._supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  }

  async function updateProfile(updates) {
    const id = uid();
    if (!id) throw new Error('Not authenticated');
    const { error } = await window._supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  return { init, signUp, signIn, signOut, resetPassword, updatePassword, updateProfile, session, user, uid, isAuthed, onAuthChange };
})();

// ══════════════════════════════════════════════════════════════════
//  Auth Panel UI
// ══════════════════════════════════════════════════════════════════
SL.AuthPanel = (() => {
  const panel    = document.getElementById('auth-panel');
  const backdrop = document.getElementById('auth-panel-backdrop');
  const box      = document.getElementById('auth-box');
  let mode       = 'login';

  function open(m='login') {
    mode = m;
    render();
    panel.classList.add('open');
  }

  function close() {
    panel.classList.remove('open');
  }

  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  function render() {
    const isLogin = mode === 'login';
    const isReset = mode === 'reset';
    const isUpdate = mode === 'update_password';

    if (isReset || isUpdate) {
      box.innerHTML = `
        <button id="auth-close" class="btn btn-icon" style="position:absolute;top:16px;right:16px;z-index:2"
          onclick="SL.AuthPanel.close()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div style="text-align:center;margin-bottom:28px">
          <div style="font-family:var(--font-heading);font-size:1.8rem;letter-spacing:0.1em;color:var(--accent);margin-bottom:6px">SINELOG</div>
          <h2 style="font-family:var(--font-heading);font-size:1.4rem;color:var(--text)">${isUpdate ? 'Create new password' : 'Reset password'}</h2>
          <p style="font-size:13px;color:var(--mist);margin-top:4px">${isUpdate ? 'Choose a new password for your account' : 'Send yourself a password reset link'}</p>
        </div>

        <div id="auth-error" style="display:none;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:10px 14px;font-size:13px;color:#dc2626;margin-bottom:16px"></div>

        <form id="auth-form" style="display:flex;flex-direction:column;gap:14px">
          ${isReset ? `<div class="form-group">
            <label class="input-label">Email</label>
            <input class="input" id="auth-email" type="email" placeholder="you@email.com" autocomplete="email" required />
          </div>` : `
          <div class="form-group">
            <label class="input-label">New Password</label>
            <input class="input" id="auth-new-password" type="password" placeholder="••••••••" autocomplete="new-password" minlength="6" required />
          </div>`}
          <button type="submit" class="btn btn-primary btn-lg" id="auth-submit" style="margin-top:4px;width:100%;justify-content:center">
            ${isUpdate ? 'Update Password' : 'Send Reset Link'}
          </button>
        </form>

        ${isReset ? `
        <p style="text-align:center;font-size:13px;color:var(--mist);margin-top:20px">
          Remembered your password?
          <button onclick="SL.AuthPanel.toggle()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-family:inherit;font-size:inherit;font-weight:600;margin-left:4px">
            Sign in
          </button>
        </p>` : ''}
      `;

      document.getElementById('auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('auth-error');
        const submitBtn = document.getElementById('auth-submit');
        const email = document.getElementById('auth-email')?.value.trim();
        const newPassword = document.getElementById('auth-new-password')?.value;
        errEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner spinner-sm"></div>';
        try {
          if (isUpdate) {
            await SL.Auth.updatePassword(newPassword);
          } else {
            await SL.Auth.resetPassword(email);
          }
          close();
          SL.toast(isUpdate ? 'Password updated.' : 'Password reset link sent. Check your email.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = isUpdate ? 'Update Password' : 'Send Reset Link';
        }
      });
      return;
    }

    box.innerHTML = `
      <button id="auth-close" class="btn btn-icon" style="position:absolute;top:16px;right:16px;z-index:2"
        onclick="SL.AuthPanel.close()">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>

      <div style="text-align:center;margin-bottom:28px">
        <div style="font-family:var(--font-heading);font-size:1.8rem;letter-spacing:0.1em;color:var(--accent);margin-bottom:6px">SINELOG</div>
        <h2 style="font-family:var(--font-heading);font-size:1.4rem;color:var(--text)">
          ${isLogin ? 'Welcome back' : 'Join the log'}
        </h2>
        <p style="font-size:13px;color:var(--mist);margin-top:4px">
          ${isLogin ? 'Sign in to track your films' : 'Create an account to start logging'}
        </p>
      </div>

      <div id="auth-error" style="display:none;background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.25);border-radius:8px;padding:10px 14px;font-size:13px;color:#dc2626;margin-bottom:16px"></div>

      <form id="auth-form" style="display:flex;flex-direction:column;gap:14px">
        ${!isLogin ? `
        <div class="form-group">
          <label class="input-label">Username</label>
          <input class="input" id="auth-username" type="text" placeholder="film_buff_42" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label class="input-label">Display Name</label>
          <input class="input" id="auth-displayname" type="text" placeholder="Your Name" autocomplete="name" />
        </div>` : ''}

        <div class="form-group">
          <label class="input-label">Email</label>
          <input class="input" id="auth-email" type="email" placeholder="you@email.com" autocomplete="email" required />
        </div>

        <div class="form-group">
          <label class="input-label">Password</label>
          <input class="input" id="auth-password" type="password" placeholder="••••••••" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required />
        </div>

        ${!isLogin ? `
        <div class="form-group">
          <label class="input-label">Confirm Password</label>
          <input class="input" id="auth-confirm-password" type="password" placeholder="••••••••" autocomplete="new-password" required />
        </div>` : ''}

        <button type="submit" class="btn btn-primary btn-lg" id="auth-submit" style="margin-top:4px;width:100%;justify-content:center">
          ${isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      ${isLogin ? `
      <p style="text-align:center;font-size:13px;margin-top:12px">
        <button onclick="SL.AuthPanel.reset()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-family:inherit;font-size:inherit;font-weight:600">
          Forgot password?
        </button>
      </p>` : ''}

      <p style="text-align:center;font-size:13px;color:var(--mist);margin-top:20px">
        ${isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button onclick="SL.AuthPanel.toggle()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-family:inherit;font-size:inherit;font-weight:600;margin-left:4px">
          ${isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    `;

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl    = document.getElementById('auth-error');
      const submitBtn = document.getElementById('auth-submit');
      errEl.style.display = 'none';

      const email    = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;

      if (!isLogin) {
        const confirmPassword = document.getElementById('auth-confirm-password').value;
        if (password !== confirmPassword) {
          errEl.textContent = 'Passwords do not match.';
          errEl.style.display = 'block';
          return;
        }
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner spinner-sm"></div>';

      try {
        if (isLogin) {
          await SL.Auth.signIn(email, password);
          close();
          SL.toast('Welcome back! 🎬');
        } else {
          const username    = document.getElementById('auth-username').value.trim();
          const displayName = document.getElementById('auth-displayname')?.value.trim();
          if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            throw new Error('Username: 3–20 chars, lowercase letters, numbers, underscores only.');
          }
          await SL.Auth.signUp(email, password, username, displayName);
          close();
          SL.toast('Account created! Check your email to verify. 🎉');
        }
      } catch(err) {
        errEl.textContent   = err.message;
        errEl.style.display = 'block';
        submitBtn.disabled  = false;
        submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
      }
    });
  }

  function toggle() {
    mode = mode === 'login' ? 'signup' : 'login';
    render();
  }

  function reset() {
    mode = 'reset';
    render();
  }

  return { open, close, toggle, reset };
})();
