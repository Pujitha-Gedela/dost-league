/**
 * gemini.js — Dost League AI Dialogue Service
 *
 * Uses Groq API (free, works in India, no billing required)
 * Model: llama-3.1-8b-instant — fast and great for short character lines
 *
 * Public API (unchanged):
 *   GeminiService.setApiKey(key)
 *   GeminiService.hasApiKey()
 *   GeminiService.getReactions(ctx)  → { parent, friend, mentor }
 *   GeminiService.validateKey(key)
 *   GeminiService.resetSession()
 */

const GeminiService = (() => {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────────
  const MODEL = 'llama-3.1-8b-instant';
  const BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const STORAGE_KEY = 'dostleague_gemini_key';

  // ── DEFAULT KEY (hardcoded fallback) ─────────────────────────
  // The app uses this key automatically so it works on first open.
  // If the user saves their own key via the UI, that takes priority.
  const DEFAULT_API_KEY = '<API_KEY>';

  // ── STATE ─────────────────────────────────────────────────────
  let _apiKey = localStorage.getItem(STORAGE_KEY) || DEFAULT_API_KEY;
  let _lastContext = null;
  let _lastResult = null;
  let _callInFlight = false;

  const _history = [];
  const MAX_HISTORY = 5;

  // ── API KEY MANAGEMENT ────────────────────────────────────────
  function setApiKey(key) {
    _apiKey = (key || '').trim();
    if (_apiKey) {
      localStorage.setItem(STORAGE_KEY, _apiKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function getApiKey() { return _apiKey; }
  function hasApiKey() { return !!_apiKey; }

  // ── HISTORY TRACKING ─────────────────────────────────────────
  function recordDecision(choiceText, metricChanges) {
    const summary = [];
    if (metricChanges?.bank?.delta) summary.push(`bank ${metricChanges.bank.delta > 0 ? '+' : ''}${metricChanges.bank.delta}`);
    if (metricChanges?.happiness?.delta) summary.push(`happiness ${metricChanges.happiness.delta > 0 ? '+' : ''}${metricChanges.happiness.delta}%`);
    if (metricChanges?.approval?.delta) summary.push(`approval ${metricChanges.approval.delta > 0 ? '+' : ''}${metricChanges.approval.delta}%`);

    _history.push({
      choice: choiceText,
      impact: summary.join(', ') || 'no change'
    });
    if (_history.length > MAX_HISTORY) _history.shift();
  }

  // ── PROMPT ENGINEERING ────────────────────────────────────────
  function buildPrompt(ctx) {
    const { scenario, choiceText, episodeLabel, metrics, history } = ctx;

    const historyText = history.length
      ? history.map((h, i) => `  ${i + 1}. "${h.choice}" → ${h.impact}`).join('\n')
      : '  (First decision)';

    const metricText =
      `Bank: ₹${metrics.bank.toLocaleString('en-IN')} | ` +
      `Happiness: ${metrics.happiness}% | ` +
      `Parental Approval: ${metrics.approval}%`;

    return `You write dialogue for "Dost League" — an Indian life-sim chat game.

CONTEXT:
- Scenario: ${scenario}
- Episode: ${episodeLabel}
- User decided: "${choiceText}"
- Metrics: ${metricText}
- Past decisions:\n${historyText}

Write ONE short reaction line for each character. Rules:
- Max 1-2 sentences, under 20 words each
- React SPECIFICALLY to the decision above
- Stay in character — distinct voice for each
- Include 1 emoji naturally
- NO generic responses

CHARACTERS:
1. AMMA (Indian mother): Emotional, guilt-tripping when approval is low (${metrics.approval}%), proud when high. Mixes Hindi naturally. Dramatic but caring.
2. RAHUL (best friend): Funny, savage, gen-Z + Hindi mix. Roasts when things go bad, hypes when good. References Ankit sometimes.
3. MR. SHARMA (mentor): Blunt, logical, data-driven. Asks for numbers. Rare praise only when metrics are strong (bank: ₹${metrics.bank.toLocaleString('en-IN')}).

Respond ONLY in this exact JSON format, nothing else:
{"parent":"Amma line","friend":"Rahul line","mentor":"Sharma line"}`;
  }

  // ── API CALL (Groq — OpenAI compatible) ───────────────────────
  async function callAPI(prompt) {
    const body = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a dialogue writer for an Indian life simulation mobile game. Always respond with valid JSON only. No markdown, no explanation, just the JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.85,
      max_tokens: 200,
      top_p: 0.92
    };

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || '';
  }

  // ── PARSE RESPONSE ────────────────────────────────────────────
  function parseResponse(raw) {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.parent && parsed.friend && parsed.mentor) return parsed;
    } catch (_) { }

    const extract = (key) => {
      const match = cleaned.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
      return match?.[1] || null;
    };
    const parent = extract('parent');
    const friend = extract('friend');
    const mentor = extract('mentor');
    if (parent && friend && mentor) return { parent, friend, mentor };
    return null;
  }

  // ── PUBLIC: getReactions ──────────────────────────────────────
  async function getReactions(ctx) {
    if (!hasApiKey()) return null;
    if (_callInFlight) return _lastResult;

    recordDecision(ctx.choiceText, ctx.metricChanges);

    const fullCtx = { ...ctx, history: [..._history] };
    const ctxKey = JSON.stringify({ choice: ctx.choiceText, metrics: ctx.metrics });
    if (_lastContext === ctxKey && _lastResult) return _lastResult;

    _callInFlight = true;
    try {
      const prompt = buildPrompt(fullCtx);
      const rawText = await callAPI(prompt);
      const parsed = parseResponse(rawText);

      if (parsed) {
        _lastContext = ctxKey;
        _lastResult = parsed;
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn('[AIService] API call failed:', err.message);
      return null;
    } finally {
      _callInFlight = false;
    }
  }

  // ── PUBLIC: validateKey ───────────────────────────────────────
  async function validateKey(key) {
    const originalKey = _apiKey;
    _apiKey = key.trim();
    try {
      const body = {
        model: MODEL,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      };
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_apiKey}`
        },
        body: JSON.stringify(body)
      });
      _apiKey = originalKey;
      if (res.ok) return { ok: true };
      const errData = await res.json().catch(() => ({}));
      return { ok: false, error: errData?.error?.message || `HTTP ${res.status}` };
    } catch (err) {
      _apiKey = originalKey;
      return { ok: false, error: err.message };
    }
  }

  // ── PUBLIC: reset ─────────────────────────────────────────────
  function resetSession() {
    _history.length = 0;
    _lastContext = null;
    _lastResult = null;
    _callInFlight = false;
  }

  // ── SCENE MESSAGE GENERATOR ───────────────────────────────────
  // Scene context descriptions — tells AI what's happening at each point
  const SCENE_CONTEXTS = [
    [ // Episode 1 — Day 1
      'Day 1. The user just announced this plan. Characters hear about it for the first time. Amma is surprised/concerned. Rahul is immediately hyped. Mr. Sharma wants the actual plan.',
      'Day 1 continued. Initial shock settled. Characters react with support or chaos.',
      'Day 1 — Reality Check. Characters give their honest take on what this will actually require.',
    ],
    [ // Episode 2 — 3 months in
      'Three months in. Characters check in on progress. Things have gotten real — wins and struggles have happened.',
      'Mid-journey. A real obstacle has appeared. Characters react to the difficulty.',
      'Three months in. Characters give mid-point perspective — is this worth continuing?',
    ],
    [ // Episode 3 — The verdict
      'Six months later. Journey is wrapping up. Characters reflect on the whole arc.',
      'Final reflections. What was the real lesson? Characters share genuine wisdom.',
      'The final verdict moment. Outcome is about to be decided.',
    ],
  ];

  /**
   * Generates dynamic scene dialogue for custom scenarios using Groq AI.
   * @param {object} ctx
   * @param {string} ctx.customTitle   - The user's custom scenario text
   * @param {number} ctx.episodeIdx    - 0, 1, or 2
   * @param {number} ctx.sceneIdx      - 0, 1, or 2
   * @param {object} ctx.metrics       - { bank, happiness, approval }
   * @param {string} ctx.lastChoice    - Text of the user's last choice (if any)
   * @returns {Promise<Array<{char,text}>|null>}
   */
  async function generateSceneMessages({ customTitle, episodeIdx, sceneIdx, metrics, lastChoice }) {
    if (!_apiKey) return null;

    const sceneCtx = SCENE_CONTEXTS[episodeIdx]?.[sceneIdx]
      || `Episode ${episodeIdx + 1}, Scene ${sceneIdx + 1} of the journey.`;

    const metricStr = metrics
      ? `Current state: Bank ₹${(metrics.bank || 0).toLocaleString('en-IN')}, Happiness ${metrics.happiness || 50}%, Parental Approval ${metrics.approval || 50}%.`
      : '';

    const choiceCtx = lastChoice
      ? `User's last decision: "${lastChoice}".` : '';

    const prompt = `You are writing GROUP CHAT messages for a mobile life-sim game called Dost League.

User's scenario: "${customTitle}"
Scene context: ${sceneCtx}
${metricStr}
${choiceCtx}

Write exactly 3 short WhatsApp-style chat messages — one from each character — reacting SPECIFICALLY to "${customTitle}". Do NOT write generic life advice.

Characters:
- PARENT (Amma): Emotional Indian mom. Uses "beta". Hindi-English mix. Worried but loving. Dramatic when stressed, sweet when proud.
- FRIEND (Rahul): Chaotic best friend. Hype energy. Uses emojis. Funny and brutally honest. Supportive but dramatic.
- MENTOR (Mr. Sharma): Blunt, experienced, data-driven. Asks sharp questions. No fluff, no emojis.

Rules:
- Each message under 110 characters
- Must directly reference the scenario topic, not generic situations
- Sound like real Indian WhatsApp messages

Return ONLY valid JSON, no markdown:
{"messages":[{"char":"parent","text":"..."},{"char":"friend","text":"..."},{"char":"mentor","text":"..."}]}`;

    try {
      const raw = await callAPI(prompt);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end   = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) return null;

      const parsed = JSON.parse(cleaned.substring(start, end + 1));
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        return parsed.messages.filter(m => m.char && m.text);
      }
      return null;
    } catch (e) {
      console.warn('[GroqService] generateSceneMessages failed:', e.message);
      return null;
    }
  }

  // ── EXPOSE ────────────────────────────────────────────────────
  const publicAPI = { setApiKey, getApiKey, hasApiKey, getReactions, generateSceneMessages, validateKey, resetSession };
  if (typeof window !== 'undefined') window.GeminiService = publicAPI;
  return publicAPI;

})();
