/* ═══════════════════════════════════════════════════════════════
   SineLog — review-prompts.js  (contextual diary prompts)
   ═══════════════════════════════════════════════════════════════ */

SL.ReviewPrompts = (() => {
  const UNIVERSAL = [
    { id: 'standout', label: 'Standout moment', hint: 'A scene, line, or image you will remember.' },
    { id: 'feeling', label: 'How it felt', hint: 'Mood right after the credits rolled.' },
    { id: 'rewatch-intent', label: 'Watch again?', hint: 'Would you revisit this one day?' },
    { id: 'recommend', label: 'Who is it for?', hint: 'What kind of viewer would love this?' },
  ];

  const BY_GENRE = {
    27: [{ id: 'atmosphere', label: 'Fear & atmosphere', hint: 'What unsettled or impressed you?' }],
    35: [{ id: 'laughs', label: 'What landed', hint: 'Jokes, timing, or performances that worked.' }],
    10749: [{ id: 'chemistry', label: 'Romance & chemistry', hint: 'Connection between leads or story beats.' }],
    878: [{ id: 'world', label: 'World & ideas', hint: 'Concepts, visuals, or rules of the world.' }],
    18: [{ id: 'performances', label: 'Performances', hint: 'Acting choices that carried the drama.' }],
    99: [{ id: 'takeaway', label: 'What stayed with you', hint: 'Facts, feelings, or questions after watching.' }],
    28: [{ id: 'setpieces', label: 'Set pieces', hint: 'Action, stunts, or choreography that stood out.' }],
    16: [{ id: 'style', label: 'Animation & style', hint: 'Art direction, motion, or voice work.' }],
    53: [{ id: 'tension', label: 'Tension & stakes', hint: 'When the film had you gripped.' }],
    9648: [{ id: 'mystery', label: 'Mystery & clues', hint: 'Fair-play hints or reveals (no major spoilers).' }],
    10402: [{ id: 'sound', label: 'Music & sound', hint: 'Score, songs, or sound design moments.' }],
    14: [{ id: 'wonder', label: 'Sense of wonder', hint: 'Magic, scale, or imagination on screen.' }],
  };

  const CONTEXT = [
    {
      id: 'pacing',
      label: 'Pacing',
      hint: 'Did the long runtime earn your attention?',
      test: (m) => Number(m.runtime) >= 150,
    },
    {
      id: 'efficiency',
      label: 'Tight & efficient',
      hint: 'Did the shorter runtime feel complete?',
      test: (m) => Number(m.runtime) > 0 && Number(m.runtime) <= 90,
    },
    {
      id: 'expectations',
      label: 'Expectations vs. reality',
      hint: 'Did the film match or surprise what you expected?',
      test: (m) => Number(m.vote_average) >= 7.5,
    },
    {
      id: 'director',
      label: 'Director\'s touch',
      hint: 'Style, themes, or choices you associate with them.',
      test: (_m, credits) => Boolean(credits?.crew?.find((c) => c.job === 'Director')),
    },
  ];

  const REWATCH = {
    id: 'vs-first',
    label: 'Vs. first viewing',
    hint: 'What changed — your read, details you noticed, or the ending.',
  };

  function getForMovie(movie, { isRewatch = false, credits = null } = {}) {
    const selected = [];
    const seen = new Set();

    const add = (p) => {
      if (!p || seen.has(p.id) || selected.length >= 5) return;
      seen.add(p.id);
      selected.push(p);
    };

    if (isRewatch) add(REWATCH);

    for (const g of movie.genres || []) {
      for (const p of BY_GENRE[g.id] || []) add(p);
    }

    for (const entry of CONTEXT) {
      if (entry.test(movie, credits)) add(entry);
    }

    for (const p of UNIVERSAL) add(p);

    return selected.slice(0, 5);
  }

  function prefixFor(prompt) {
    return `${prompt.label}: `;
  }

  function applyPrompt(textarea, prompt) {
    if (!textarea || !prompt) return;
    const prefix = prefixFor(prompt);
    const value = textarea.value;

    if (value.includes(prefix)) {
      const idx = value.indexOf(prefix);
      textarea.focus();
      textarea.setSelectionRange(idx + prefix.length, value.length);
      return;
    }

    const sep = value.trim() ? '\n\n' : '';
    textarea.value = value + sep + prefix;
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }

  function mount(container, movie, { isRewatch = false, credits = null } = {}) {
    const wrap = container.querySelector('#review-prompts-wrap');
    const chipsEl = container.querySelector('#review-prompt-chips');
    const textarea = container.querySelector('#review-input');
    const activeHint = container.querySelector('#review-prompt-active-hint');
    const toggleBtn = container.querySelector('#review-prompts-toggle');
    if (!wrap || !chipsEl || !textarea) return null;

    let activeId = null;
    let collapsed = false;

    function setActive(prompt) {
      activeId = prompt?.id || null;
      chipsEl.querySelectorAll('.review-prompt-chip').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.promptId === activeId);
      });
      if (activeHint) {
        if (prompt) {
          activeHint.hidden = false;
          activeHint.textContent = prompt.hint;
        } else {
          activeHint.hidden = true;
          activeHint.textContent = '';
        }
      }
    }

    function renderChips(rewatch) {
      const prompts = getForMovie(movie, { isRewatch: rewatch, credits });
      chipsEl.innerHTML = prompts.map((p) => `
        <button type="button" class="review-prompt-chip" data-prompt-id="${SL.esc(p.id)}" title="${SL.esc(p.hint)}">
          ${SL.esc(p.label)}
        </button>
      `).join('');

      chipsEl.querySelectorAll('.review-prompt-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          const prompt = prompts.find((x) => x.id === btn.dataset.promptId);
          if (!prompt) return;
          applyPrompt(textarea, prompt);
          setActive(prompt);
        });
      });

      if (activeId && !prompts.some((p) => p.id === activeId)) setActive(null);
    }

    renderChips(isRewatch);

    toggleBtn?.addEventListener('click', () => {
      collapsed = !collapsed;
      wrap.classList.toggle('is-collapsed', collapsed);
      toggleBtn.textContent = collapsed ? 'Show prompts' : 'Just write';
    });

    return {
      refresh(rewatch) {
        renderChips(rewatch);
      },
    };
  }

  return { getForMovie, applyPrompt, mount };
})();
