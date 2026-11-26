// Engine, DialogueMixer, GeminiService are all globals (loaded via <script> tags)


/**
 * app.js — Dost League UI Controller
 * Scene-based flow, real-time reactions, tension-building, episode hooks
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ── DOM ───────────────────────────────────────────────────────
  const splashScreen = $('splash-screen');
  const simScreen = $('sim-screen');
  const summaryScreen = $('summary-screen');
  const chatFeed = $('chat-feed');
  const choicesPanel = $('choices-panel');
  const choicesList = $('choices-list');
  const choicesLabel = $('choices-label');
  const typingInd = $('typing-indicator');
  const typingName = $('typing-name');
  const typingAvatar = $('typing-avatar');
  const episodeBadge = $('episode-badge');
  const sceneCounter = $('scene-counter');
  const sceneName = $('scene-name');
  const sceneFill = $('scene-fill');
  const backBtn = $('back-btn');
  const toast = $('toast');

  // Metrics
  const bankValue = $('bank-value');
  const happyValue = $('happy-value');
  const approvalValue = $('approval-value');
  const bankBar = $('bank-bar');
  const happyBar = $('happy-bar');
  const approvalBar = $('approval-bar');
  const metricBank = $('metric-bank');
  const metricHappy = $('metric-happy');
  const metricApproval = $('metric-approval');

  // Summary
  const summaryTitle = $('summary-title');
  const summaryDesc = $('summary-desc');
  const desiLine = $('desi-line');
  const labelCard = $('summary-label-card');
  const labelEmoji = $('summary-label-emoji');
  const labelTitle = $('summary-label-title');
  const labelSub = document.querySelector('.summary-label-sub');
  const sstatBankVal = $('sstat-bank-val');
  const sstatHappyVal = $('sstat-happy-val');
  const sstatApprVal = $('sstat-approval-val');
  const sstatBankBar = $('sstat-bank-bar');
  const sstatHappyBar = $('sstat-happy-bar');
  const sstatApprBar = $('sstat-approval-bar');
  const shareBtn = $('share-btn');
  const replayBtn = $('replay-btn');
  const restartBtn = $('restart-btn');
  const historyBtn = $('history-btn');
  const nextEpHook = $('next-ep-hook');
  const nextEpText = $('next-ep-text');
  const nextEpBtn = $('next-ep-btn');

  // History
  const historyPanel = $('history-panel');
  const historyList = $('history-list');
  const historyClose = $('history-close');
  const historyOverlay = $('history-overlay');
  const splashHistBtn = $('splash-history-btn');

  // Share
  const shareModal = $('share-modal');
  const shareCardPrev = $('share-card-preview');
  const copyShareBtn = $('copy-share-btn');
  const shareCloseBtn = $('share-close-btn');

  // ── STATE ─────────────────────────────────────────────────────
  let isAnimating = false;
  let currentScenarioKey = null;
  let currentCustomTitle = '';
  let episodeCount = 0;

  // ── SCREENS ───────────────────────────────────────────────────
  const allScreens = [splashScreen, simScreen, summaryScreen];
  function showScreen(el) {
    allScreens.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
    el.style.display = 'flex';
    requestAnimationFrame(() => el.classList.add('active'));
  }

  // ── TOAST ─────────────────────────────────────────────────────
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden'); toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
  }

  // ── METRICS ───────────────────────────────────────────────────
  function renderMetrics(changes) {
    const m = Engine.getMetrics();
    bankValue.textContent = Engine.formatBank(m.bank);
    happyValue.textContent = `${m.happiness}%`;
    approvalValue.textContent = `${m.approval}%`;
    bankBar.style.width = Engine.getMetricPercent('bank') + '%';
    happyBar.style.width = m.happiness + '%';
    approvalBar.style.width = m.approval + '%';

    if (changes) {
      bump(metricBank, changes.bank, 'bank');
      bump(metricHappy, changes.happiness, 'happiness');
      bump(metricApproval, changes.approval, 'approval');
      flashHUD(changes);
      showMetricToast(changes);
    }
  }

  function bump(el, change, key) {
    if (!change) return;
    const dir = change.direction;
    el.classList.remove('bump-up', 'bump-down');
    void el.offsetWidth;
    el.classList.add(dir === 'up' ? 'bump-up' : 'bump-down');
    spawnDelta(el, change.delta, key, dir);
    setTimeout(() => el.classList.remove('bump-up', 'bump-down'), 900);
  }

  function spawnDelta(el, delta, key, dir) {
    if (!delta || Math.abs(delta) < 1) return;
    const rect = el.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = `metric-delta ${dir}`;
    const label = key === 'bank'
      ? (dir === 'up' ? '+' : '') + Engine.formatBank(delta)
      : (dir === 'up' ? '+' : '') + delta + '%';
    f.textContent = label;
    f.style.cssText = `left:${rect.left + rect.width / 2}px;top:${rect.top - 4}px;`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }

  function flashHUD(changes) {
    let score = 0;
    if (changes.bank) score += changes.bank.direction === 'up' ? 1 : -1;
    if (changes.happiness) score += changes.happiness.direction === 'up' ? 1 : -1;
    if (changes.approval) score += changes.approval.direction === 'up' ? 1 : -1;
    const hud = document.querySelector('.hud');
    if (!hud) return;
    hud.classList.remove('flash-good', 'flash-bad');
    void hud.offsetWidth;
    if (score >= 1) hud.classList.add('flash-good');
    else if (score <= -1) hud.classList.add('flash-bad');
    setTimeout(() => hud.classList.remove('flash-good', 'flash-bad'), 950);
  }

  function showMetricToast(ch) {
    const parts = [];
    if (ch.bank && Math.abs(ch.bank.delta) >= 5000) parts.push(`${ch.bank.direction === 'up' ? '📈' : '📉'} ${ch.bank.direction === 'up' ? '+' : ''}${Engine.formatBank(ch.bank.delta)}`);
    if (ch.happiness && Math.abs(ch.happiness.delta) >= 8) parts.push(`${ch.happiness.direction === 'up' ? '😊' : '😰'} Mood ${ch.happiness.direction === 'up' ? '+' : ''}${ch.happiness.delta}%`);
    if (ch.approval && Math.abs(ch.approval.delta) >= 8) parts.push(`${ch.approval.direction === 'up' ? '🙏' : '😤'} Approval ${ch.approval.direction === 'up' ? '+' : ''}${ch.approval.delta}%`);
    if (parts.length) setTimeout(() => showToast(parts.join('  ·  ')), 550);
  }

  // ── SCENE PROGRESS ────────────────────────────────────────────
  function updateSceneProgress() {
    const total = Engine.getSceneCount();
    const current = Engine.getSceneDisplayIndex();
    const scene = Engine.currentScene();

    sceneCounter.textContent = `Scene ${current} of ${total}`;
    sceneName.textContent = scene?.label || '';
    const pct = total > 0 ? (current / total) * 100 : 0;
    sceneFill.style.width = pct + '%';
  }

  // ── CHAT ──────────────────────────────────────────────────────
  function createMsg(charId, text) {
    const char = CHARACTERS[charId] || CHARACTERS.narrator;
    if (charId === 'system') {
      // Render as centered badge, not a plain italic line
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-system-msg';
      const badge = document.createElement('span');
      badge.className = 'chat-event-badge';
      badge.textContent = text;
      wrapper.appendChild(badge);
      return wrapper;
    }
    const isUser = charId === 'you';
    const row = document.createElement('div');
    row.className = `chat-msg sender-${charId}${isUser ? ' user-msg' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar'; avatar.textContent = char.emoji;

    const body = document.createElement('div');
    body.className = 'msg-body';

    if (!isUser && charId !== 'narrator') {
      const sender = document.createElement('div');
      sender.className = 'msg-sender'; sender.textContent = char.name;
      body.appendChild(sender);
    }
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble'; bubble.textContent = text;
    body.appendChild(bubble);

    if (!isUser) row.appendChild(avatar);
    row.appendChild(body);
    if (isUser) row.appendChild(avatar);
    return row;
  }

  function appendMsg(charId, text) {
    const el = createMsg(charId, text);
    chatFeed.appendChild(el);
    scrollBottom();
    return el;
  }

  function scrollBottom() {
    chatFeed.scrollTo({ top: chatFeed.scrollHeight, behavior: 'smooth' });
  }

  function addDivider(label) {
    const d = document.createElement('div');
    d.className = 'chat-divider';
    d.innerHTML = `<span>${label}</span>`;
    chatFeed.appendChild(d); scrollBottom();
  }

  function addSceneCard(label, current, total) {
    const d = document.createElement('div');
    d.className = 'scene-card';
    d.innerHTML = `<span class="scene-card-num">Scene ${current} of ${total}</span><span class="scene-card-label">${label}</span>`;
    chatFeed.appendChild(d); scrollBottom();
  }

  function addEpisodeTeaserCard(nextLabel) {
    const d = document.createElement('div');
    d.className = 'episode-teaser-card';
    d.innerHTML = `<div class="et-next">Coming Up</div><div class="et-label">${nextLabel}</div>`;
    chatFeed.appendChild(d); scrollBottom();
  }

  // ── TYPING ────────────────────────────────────────────────────
  function showTyping(charId) {
    if (charId === 'narrator' || charId === 'system') { hideTyping(); return; }
    const char = CHARACTERS[charId] || CHARACTERS.narrator;
    typingName.textContent = char.name;
    typingAvatar.textContent = char.emoji;
    typingInd.className = `typing-indicator typing-${charId}`;
    typingInd.classList.remove('hidden');
    scrollBottom();
  }
  function hideTyping() { typingInd.classList.add('hidden'); }

  // ── MESSAGE QUEUE ─────────────────────────────────────────────
  function runQueue(messages, onDone) {
    if (!messages || !messages.length) { onDone?.(); return; }
    isAnimating = true;
    let i = 0;

    function next() {
      if (i >= messages.length) {
        hideTyping(); isAnimating = false; onDone?.(); return;
      }
      const { char, text } = messages[i++];
      const isSystem = char === 'system';
      const isNarr = char === 'narrator';

      const typeDelay = isSystem ? 0 : isNarr ? 400 : 600 + Math.min(text.length * 14, 1500);
      const pauseAfter = isSystem ? 200 : 450 + Math.random() * 350;

      if (!isSystem) showTyping(char);
      setTimeout(() => {
        hideTyping();
        appendMsg(char, text);

        // ~18% chance: inject a random chat event after a non-system, non-narrator message
        const isHuman = !isSystem && !isNarr;
        const event = isHuman ? DialogueMixer.maybeGetChatEvent(0.18) : null;
        if (event) {
          setTimeout(() => {
            if (event.type === 'system') {
              appendMsg('system', event.text);
            } else if (event.type === 'message') {
              // Brief extra typing delay before bonus chat event message
              showTyping(event.char);
              setTimeout(() => {
                hideTyping();
                appendMsg(event.char, event.text);
                setTimeout(next, pauseAfter);
              }, 800 + Math.random() * 600);
              return;
            }
            setTimeout(next, pauseAfter);
          }, 300);
        } else {
          setTimeout(next, pauseAfter);
        }
      }, typeDelay);
    }
    next();
  }

  // ── CHOICES ───────────────────────────────────────────────────
  function showChoices(ep) {
    choicesLabel.textContent = ep.question || 'Choose your move';
    choicesList.innerHTML = '';
    ep.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.id = `choice-${choice.id}`;

      const label = document.createElement('span');
      label.className = 'choice-letter'; label.textContent = choice.label;

      const icon = document.createElement('span');
      icon.className = 'choice-icon'; icon.textContent = choice.icon || '';

      const txt = document.createElement('span');
      txt.className = 'choice-text'; txt.textContent = choice.text;

      btn.appendChild(label); btn.appendChild(icon); btn.appendChild(txt);
      btn.style.animationDelay = `${idx * 0.1}s`;
      btn.addEventListener('click', () => onChoiceClick(choice.id));
      choicesList.appendChild(btn);
    });
    choicesPanel.classList.remove('hidden');
    scrollBottom();
  }
  function hideChoices() { choicesPanel.classList.add('hidden'); }

  // ── CHOICE HANDLER ────────────────────────────────────────────
  async function onChoiceClick(choiceId) {
    if (isAnimating) return;
    const result = Engine.resolveChoice(choiceId);
    if (!result) return;

    isAnimating = true; // lock while we await Gemini
    hideChoices();
    appendMsg('you', result.choice.text);
    renderMetrics(result.metricChanges);

    // Tell DialogueMixer what just happened (memory + risk detection)
    DialogueMixer.remember(choiceId, result.choice.text, result.metricChanges);

    const hardcodedReactions = result.choice.reactions || [];

    // ── GEMINI REACTIONS ──
    // Build context object for Gemini prompt
    const ep = Engine.currentEpisode();
    const geminiCtx = {
      scenario:     (typeof SCENARIOS !== 'undefined' && SCENARIOS[currentScenarioKey]?.name)
                    || currentCustomTitle || 'Life Simulation',
      episodeLabel: ep?.fullLabel || ep?.label || 'Current Episode',
      choiceText:   result.choice.text,
      metrics:      Engine.getMetrics(),
      metricChanges: result.metricChanges
    };

    // Show a subtle "AI is thinking" typing indicator while Gemini responds
    let geminiReactions = null;
    if (typeof GeminiService !== 'undefined' && GeminiService.hasApiKey()) {
      showTyping('parent'); // show one character typing to signal AI is working
      geminiReactions = await GeminiService.getReactions(geminiCtx);
      hideTyping();
    }

    isAnimating = false; // unlock so runQueue can animate

    // Build reaction queue: if Gemini returned valid lines, use them
    // Otherwise fall back to hardcoded reactions + DialogueMixer bonus
    if (geminiReactions) {
      const CHAR_ORDER = ['parent', 'friend', 'mentor'];
      const alreadyInHardcoded = new Set(hardcodedReactions.map(r => r.char));

      // Hardcoded reactions first (scene-specific), then AI-generated for remaining chars
      const queue = [...hardcodedReactions];
      CHAR_ORDER.forEach(charId => {
        if (!alreadyInHardcoded.has(charId) && geminiReactions[charId]) {
          queue.push({ char: charId, text: geminiReactions[charId] });
        }
      });

      runQueue(queue, () => {
        // Show ✨ AI badge once after Gemini reactions
        showAIBadge();
        advanceOrSummary(result);
      });
    } else {
      // Fallback: hardcoded + DialogueMixer bonus (original behavior)
      const alreadyReacted = hardcodedReactions.map(r => r.char);
      runQueue(hardcodedReactions, () => {
        const metrics = Engine.getMetrics();
        const bonus = DialogueMixer.getBonusReaction(alreadyReacted, metrics);
        if (bonus) {
          runQueue([bonus], () => advanceOrSummary(result));
        } else {
          advanceOrSummary(result);
        }
      });
    }
  }

  function advanceOrSummary(result) {
    if (result.isEndpoint) {
      setTimeout(() => showSummary(), 900);
    } else {
      if (Engine.advanceEpisode()) {
        episodeCount++;
        const prevEp = SCENARIOS[currentScenarioKey]?.episodes[episodeCount - 1];
        if (prevEp?.nextTeaser) {
          setTimeout(() => addEpisodeTeaserCard(prevEp.nextTeaser), 400);
        }
        setTimeout(() => startEpisode(), prevEp?.nextTeaser ? 2200 : 700);
      }
    }
  }

  // Show a subtle AI-powered badge in the chat feed
  function showAIBadge() {
    const badge = document.createElement('div');
    badge.className = 'ai-powered-badge';
    badge.innerHTML = '⚡ <span>Powered by Groq AI</span>';
    chatFeed.appendChild(badge);
    scrollBottom();
    setTimeout(() => badge.classList.add('fade-out'), 3000);
    setTimeout(() => badge.remove(), 3800);
  }

  // ─── SCENE RUNNER (AI-powered for custom, static for presets) ──
  /**
   * For custom scenarios: calls Groq to generate fresh dialogue.
   * For preset scenarios: uses the hardcoded static messages.
   * Falls back to static if AI call fails.
   */
  async function loadAndRunScene(sc, episodeIdx, sceneIdx, onDone) {
    const isCustom = currentScenarioKey === 'custom';
    const hasAI = typeof GeminiService !== 'undefined' && GeminiService.hasApiKey();

    if (isCustom && hasAI) {
      // Show one character typing to signal AI is working
      showTyping('friend');
      const lastChoice = (typeof mem !== 'undefined' && mem.lastChoiceText) ? mem.lastChoiceText : '';
      const aiMessages = await GeminiService.generateSceneMessages({
        customTitle: currentCustomTitle,
        episodeIdx,
        sceneIdx,
        metrics:    Engine.getMetrics(),
        lastChoice
      });
      hideTyping();

      if (aiMessages && aiMessages.length > 0) {
        runQueue(aiMessages, onDone);
        return;
      }
      // AI failed — fall through to static fallback
    }
    runQueue(sc.messages, onDone);
  }

  // ── SCENE FLOW ────────────────────────────────────────────────
  function onSceneDone() {
    if (Engine.hasNextScene()) {
      Engine.advanceScene();
      updateSceneProgress();
      const sc = Engine.currentScene();
      const sceneIdx = Engine.getSceneDisplayIndex() - 1;
      setTimeout(() => {
        addSceneCard(sc.label, Engine.getSceneDisplayIndex(), Engine.getSceneCount());
        loadAndRunScene(sc, episodeCount, sceneIdx, onSceneDone);
      }, 900);
    } else {
      // All scenes done — show choices
      const ep = Engine.currentEpisode();
      showChoices(ep);
    }
  }

  function startEpisode() {
    const ep = Engine.currentEpisode();
    if (!ep) return;

    Engine.resetScene();
    updateSceneProgress();
    episodeBadge.textContent = ep.fullLabel || ep.label;

    if (episodeCount > 0) addDivider(ep.fullLabel || ep.label);

    const sc = Engine.currentScene();
    if (!sc) return;

    setTimeout(() => {
      addSceneCard(sc.label, 1, Engine.getSceneCount());
      loadAndRunScene(sc, episodeCount, 0, onSceneDone);
    }, episodeCount > 0 ? 600 : 300);
  }

  // ── SUMMARY ───────────────────────────────────────────────────
  function showSummary() {
    const out = Engine.getOutcome();
    const m = out.metrics;

    summaryTitle.textContent = out.episodeTitle || "Today's Episode";
    summaryDesc.textContent = out.summary;
    desiLine.textContent = out.closingLine || '';

    // 🔥 Fun ending (WOW moment)
    const funnyEndings = [
      "Rahul is still not convinced 😂",
      "Amma has already told relatives 😭",
      "This will be discussed at every family function 💀"
    ];

    const randomEnding = funnyEndings[Math.floor(Math.random() * funnyEndings.length)];

    desiLine.textContent += " " + randomEnding;

    labelEmoji.textContent = out.label.emoji;
    labelTitle.textContent = out.label.title;
    if (labelSub) labelSub.textContent = out.label.sub;

    labelCard.className = `summary-label-card label-${out.ending}`;

    sstatBankVal.textContent = Engine.formatBank(m.bank);
    sstatHappyVal.textContent = `${m.happiness}%`;
    sstatApprVal.textContent = `${m.approval}%`;

    sstatBankBar.style.width = '0%';
    sstatHappyBar.style.width = '0%';
    sstatApprBar.style.width = '0%';

    setTimeout(() => {
      sstatBankBar.style.width = Engine.getMetricPercent('bank') + '%';
      sstatHappyBar.style.width = m.happiness + '%';
      sstatApprBar.style.width = m.approval + '%';
    }, 500);

    // Next episode hook
    const ep = Engine.currentEpisode();
    if (ep?.nextTeaser) {
      nextEpText.textContent = ep.nextTeaser;
      nextEpHook.classList.remove('hidden');
    } else {
      nextEpHook.classList.add('hidden');
    }

    showScreen(summaryScreen);
  }

  // ── SIMULATION START ──────────────────────────────────────────
  function startSimulation(scenarioKey, customTitle) {
    currentScenarioKey = scenarioKey;
    currentCustomTitle = customTitle || '';
    episodeCount = 0;

    chatFeed.innerHTML = '';
    hideChoices(); hideTyping();
    isAnimating = false;

    Engine.init(scenarioKey, customTitle);
    DialogueMixer.resetSession();  // fresh variation state each run
    if (typeof GeminiService !== 'undefined') GeminiService.resetSession(); // fresh AI memory each run
    renderMetrics(null);

    showScreen(simScreen);
    setTimeout(() => startEpisode(), 400);
  }

  // ── HISTORY ───────────────────────────────────────────────────
  function openHistory() {
    const hist = Engine.loadHistory();
    historyList.innerHTML = '';
    if (!hist.length) {
      historyList.innerHTML = '<div class="history-empty">📺 No episodes yet!<br>Start your first story.</div>';
    } else {
      hist.forEach(e => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div class="history-item-header">
            <span class="history-emoji">${e.emoji}</span>
            <div class="history-item-meta">
              <div class="history-name">${e.scenarioName}</div>
              <div class="history-ep-title">${e.episodeTitle}</div>
              <div class="history-date">${e.date}</div>
            </div>
          </div>
          <div class="history-label"><span>${e.labelEmoji}</span><span class="history-label-title">${e.labelTitle}</span></div>
          <div class="history-outcome-text">${e.outcomeSummary}</div>
          ${e.closingLine ? `<div class="history-closing">${e.closingLine}</div>` : ''}
        `;
        historyList.appendChild(item);
      });
    }
    historyPanel.classList.remove('hidden'); historyPanel.classList.add('open');
    historyOverlay.classList.remove('hidden');
  }
  function closeHistory() {
    historyPanel.classList.remove('open'); historyOverlay.classList.add('hidden');
    setTimeout(() => historyPanel.classList.add('hidden'), 400);
  }

  // ── SHARE ─────────────────────────────────────────────────────
  function openShare() {
    const out = Engine.getOutcome();
    const m = out.metrics;
    const txt = [
      `🎭 Dost League`, ``,
      `📺 ${out.episodeTitle}`,
      `${out.emoji} ${out.name}`, ``,
      out.summary, ``,
      `${out.label.emoji} "${out.label.title}"`,
      out.closingLine, ``,
      `💰 ${Engine.formatBank(m.bank)} · 😊 ${m.happiness}% · 🙏 ${m.approval}%`, ``,
      `🇮🇳 Play at: Dost League`
    ].join('\n');
    shareCardPrev.textContent = txt;
    shareModal.classList.remove('hidden');
  }
  function closeShare() { shareModal.classList.add('hidden'); }

  // ── EVENTS ────────────────────────────────────────────────────
  document.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.add('tapped');
      setTimeout(() => { card.classList.remove('tapped'); startSimulation(card.dataset.scenario, ''); }, 220);
    });
  });

  const customInput = $('custom-scenario-input');
  const customBtn = $('custom-scenario-btn');
  function submitCustom() {
    const val = customInput.value.trim();
    if (!val) { showToast('Type your scenario first!'); return; }
    startSimulation('custom', val);
    customInput.value = '';
  }
  customBtn.addEventListener('click', submitCustom);
  customInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitCustom(); });

  backBtn.addEventListener('click', () => {
    showScreen(splashScreen);
    chatFeed.innerHTML = ''; isAnimating = false; hideChoices(); hideTyping();
  });

  replayBtn.addEventListener('click', () => {
    startSimulation(currentScenarioKey, currentCustomTitle);
  });
  restartBtn.addEventListener('click', () => showScreen(splashScreen));

  nextEpBtn.addEventListener('click', () => {
    startSimulation(currentScenarioKey, currentCustomTitle);
  });

  historyBtn.addEventListener('click', openHistory);
  if (splashHistBtn) splashHistBtn.addEventListener('click', openHistory);
  historyClose.addEventListener('click', closeHistory);
  historyOverlay.addEventListener('click', closeHistory);

  shareBtn.addEventListener('click', openShare);
  shareCloseBtn.addEventListener('click', closeShare);
  document.querySelector('.modal-backdrop')?.addEventListener('click', closeShare);

  copyShareBtn.addEventListener('click', () => {
    const txt = shareCardPrev.textContent;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => showToast('Copied! Share your episode 📋'));
    else {
      const ta = document.createElement('textarea'); ta.value = txt;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); showToast('Copied! 📋');
    }
    closeShare();
  });

  // ── INIT ──────────────────────────────────────────────────────
  showScreen(splashScreen);
})();
