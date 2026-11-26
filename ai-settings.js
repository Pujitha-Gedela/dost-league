/**
 * ai-settings.js — Gemini API Key Settings Panel Controller
 *
 * Handles: open/close panel, save/clear/validate key, status indicator update.
 * Loaded as a plain script (not module) so it can reference GeminiService global.
 */
(function () {
  'use strict';

  const panel        = document.getElementById('ai-settings-panel');
  const backdrop     = document.getElementById('ai-panel-backdrop');
  const closeBtn     = document.getElementById('ai-panel-close');
  const openBtn      = document.getElementById('splash-ai-settings-btn');
  const keyInput     = document.getElementById('ai-key-input');
  const toggleBtn    = document.getElementById('ai-key-toggle');
  const saveBtn      = document.getElementById('ai-key-save');
  const validateBtn  = document.getElementById('ai-key-validate');
  const clearBtn     = document.getElementById('ai-key-clear');
  const statusDot    = document.getElementById('ai-status-dot');
  const statusText   = document.getElementById('ai-status-text');
  const splashAiDot  = document.getElementById('ai-dot');

  if (!panel) return; // safety guard

  // ── UTILS ─────────────────────────────────────────────────────
  function setStatus(state, msg) {
    // state: 'none' | 'saved' | 'ok' | 'error' | 'loading'
    statusDot.className = 'ai-status-dot ' + state;
    statusText.textContent = msg;
    // Update badge dot on splash
    if (splashAiDot) {
      splashAiDot.className = 'ai-dot ' + (state === 'ok' || state === 'saved' ? 'active' : '');
    }
  }

  function syncStatusFromService() {
    if (!window.GeminiService) { setStatus('none', 'GeminiService not loaded'); return; }
    if (GeminiService.hasApiKey()) {
      const key = GeminiService.getApiKey();
      const masked = key.substring(0, 6) + '••••••••' + key.slice(-4);
      setStatus('saved', `Key saved: ${masked}`);
      keyInput.value = '';
      keyInput.placeholder = masked;
    } else {
      setStatus('none', 'No API key saved');
      keyInput.placeholder = 'gsk_...';
    }
  }

  // ── PANEL OPEN / CLOSE ────────────────────────────────────────
  function openPanel() {
    syncStatusFromService();
    panel.classList.remove('hidden');
    requestAnimationFrame(() => panel.classList.add('open'));
    keyInput.focus();
  }

  function closePanel() {
    panel.classList.remove('open');
    setTimeout(() => panel.classList.add('hidden'), 350);
  }

  openBtn?.addEventListener('click', openPanel);
  closeBtn?.addEventListener('click', closePanel);
  backdrop?.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) closePanel();
  });

  // ── SHOW/HIDE KEY ─────────────────────────────────────────────
  toggleBtn?.addEventListener('click', () => {
    const isPassword = keyInput.type === 'password';
    keyInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? '🙈' : '👁';
  });

  // ── SAVE ──────────────────────────────────────────────────────
  saveBtn?.addEventListener('click', () => {
    const val = keyInput.value.trim();
    if (!val) { setStatus('error', 'Please enter a key first.'); return; }
    if (!window.GeminiService) { setStatus('error', 'GeminiService not available.'); return; }

    GeminiService.setApiKey(val);
    syncStatusFromService();
    showPanelToast('✅ API key saved!');
  });

  // ── VALIDATE ──────────────────────────────────────────────────
  validateBtn?.addEventListener('click', async () => {
    if (!window.GeminiService) { setStatus('error', 'GeminiService not available.'); return; }

    const val = keyInput.value.trim() || GeminiService.getApiKey();
    if (!val) { setStatus('error', 'Enter or save a key first.'); return; }

    setStatus('loading', 'Testing connection…');
    validateBtn.disabled = true;
    validateBtn.textContent = 'Testing…';

    const result = await GeminiService.validateKey(val);
    validateBtn.disabled = false;
    validateBtn.textContent = 'Test Connection';

    if (result.ok) {
      GeminiService.setApiKey(val);
      syncStatusFromService();
      setStatus('ok', '✓ Connected! Groq AI is active.');
      showPanelToast('🎉 Groq AI connected!');
    } else {
      setStatus('error', `✗ Failed: ${result.error}`);
    }
  });

  // ── CLEAR ─────────────────────────────────────────────────────
  clearBtn?.addEventListener('click', () => {
    if (!window.GeminiService) return;
    GeminiService.setApiKey('');
    keyInput.value = '';
    setStatus('none', 'Key cleared. Using offline dialogue pools.');
    showPanelToast('🗑 API key removed.');
  });

  // ── MINI TOAST inside panel ───────────────────────────────────
  function showPanelToast(msg) {
    // Reuse the global toast if available
    const toastEl = document.getElementById('toast');
    if (toastEl) {
      toastEl.textContent = msg;
      toastEl.classList.remove('hidden'); toastEl.classList.add('show');
      setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.classList.add('hidden'), 300);
      }, 2200);
    }
  }

  // ── ENTER KEY on input ────────────────────────────────────────
  keyInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveBtn.click();
  });

  // ── INIT ──────────────────────────────────────────────────────
  // Run after DOM is ready (this script is deferred to end of body)
  syncStatusFromService();

})();
