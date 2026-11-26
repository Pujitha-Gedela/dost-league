/**
 * dialogue.js — Dost League Dynamic Dialogue System
 *
 * Illusion of intelligence without any external API.
 * How it works:
 *  1. Each character has 4-5 emotional tones × 5-7 line variations each
 *  2. Tone is selected based on current metrics (low approval → Amma gets dramatic, etc.)
 *  3. Memory of last choice influences which pool sub-branch is picked
 *  4. pickFresh() avoids repeating the same line twice per session
 *  5. getBonusReaction() is called after each choice to inject 1 dynamic extra line
 *  6. maybeGetChatEvent() occasionally returns a WhatsApp-style system event
 */

const mem = {
  lastChoiceText: "",
  lastChoiceId: null,
};

// Expose mem globally so engine.js can access it
window.mem = mem;

const DialogueMixer = (() => {
  'use strict';

  // ─── SESSION MEMORY ──────────────────────────────────────────
  let sessionMem = {
    lastChoiceId: null,
    lastChoiceText: null,
    lastChoiceRisk: 0,          // -1 safe, 0 neutral, +1 risky
    choiceHistory: [],         // all choice ids this run
    riskScore: 0,          // cumulative risky decisions
    metricTrend: { bank: 0, happiness: 0, approval: 0 },
    seenLines: new Set()   // prevents same line twice per session
  };

  // ─── UTILS ───────────────────────────────────────────────────
  const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
  const chance = p => Math.random() < p;

  function detectTopic() {
    const input = mem.lastChoiceText.toLowerCase();

    if (input.includes("travel") || input.includes("trip")) {
      return "travel";
    } else if (input.includes("career") || input.includes("startup")) {
      return "career";
    } else if (input.includes("relationship") || input.includes("love")) {
      return "relationship";
    } else {
      return "unknown";
    }
  }

  // Pick from array, preferring lines not yet seen this session
  function pickFresh(arr, poolKey) {
    const key = poolKey + '|';
    const fresh = arr.filter(x => !sessionMem.seenLines.has(key + x));
    const pool = fresh.length ? fresh : arr; // fallback to full pool if exhausted
    const line = rnd(pool);
    sessionMem.seenLines.add(key + line);
    return line;
  }

  // ─── CHARACTER POOLS ─────────────────────────────────────────

  const POOLS = {

    // ════════════════════════════════════════════════════════════
    // AMMA — Emotional, family-focused, guilt, unconditional love
    // ════════════════════════════════════════════════════════════
    parent: {

      // When approval is LOW — guilt and fear dominate
      worried: [
        "Beta I haven't slept properly in three days. Three. Days. 😔",
        "Log kya kahenge, beta. I know you don't care. But I have to live in this colony.",
        "I'm not angry. I'm just… scared for you. A mother can be scared, na.",
        "Your father is very quiet since you told us. That kind of quiet worries me more than shouting.",
        "Your maasi called. She heard what happened. HOW does she always hear first. 😢",
        "I made your favourite khichdi and kept it in the fridge. Just come home when you can.",
      ],

      // When approval is VERY LOW or bank is critical — real panic
      shocked: [
        "Excuse me — WHAT. I need one moment. Everyone give me one moment. 😵",
        "Beta are you joking right now. Tell me you're testing me. Please say yes.",
        "I told your father. He is staring at the wall. We are both just staring at a wall. 😶",
        "Three years I lit a diya every morning for you. Three years. FOR THIS? 😤",
        "I'm going to sit down. Slowly. And think. Don't talk to me for five minutes.",
        "Okay. I'm not saying anything. My silence is my complete response. 😑",
      ],

      // When approval is HIGH — proud Amma is the best Amma
      proud: [
        "Beta I ALWAYS said. Didn't I always say? No one believed me but I KNEW. 🥹",
        "I told Sunita aunty everything. She said 'wah'. That is the highest she gives anyone.",
        "Your grandfather would be so emotional tonight. I'm calling him. He needs to hear this.",
        "I'm crying a little bit. Just a little. Don't tell your father. He'll make it into a thing.",
        "Okay fine. I was worried. Just a tiny bit. But mostly I was always confident in you. Mostly.",
        "I'm going to the temple tomorrow. I already decided. This deserves a full puja.",
      ],

      // Neutral / general pressure — classic Amma energy
      emotional: [
        "Beta, life is not only dreams. There are people who need you here too. Remember that.",
        "I'm your mother. Worrying is my full-time job. I cannot retire from this.",
        "At least keep ₹2 lakh in savings. For me. Just ₹2 lakh. That's all I ask. 🙏",
        "Your cousin Rohit just got promoted again. I mention this as context. Not comparison.",
        "Whatever you decide — call me. Not WhatsApp. Not message. CALL. I need to hear your voice.",
        "I don't understand everything you're doing. But I know you. And you are a good person.",
      ],

      // After a risky choice — delayed processing
      afterRisky: [
        "I've been thinking about what you decided. All night. Still not done thinking. 😶",
        "Whatever you chose… I hope you know what you're doing. Your father is very quiet still.",
        "After last time, I'm going to just sit here quietly. And pray. That's my plan. 🙏",
      ],

      // After a smart/stable choice — relief
      afterSafe: [
        "See? I always knew logic would win. This is why I raised you properly.",
        "Breathed properly for the first time in days. Thank you for this beta. 🙏",
        "Good decision. Your father smiled a little. Don't tell him I told you.",
      ],
    },

    // ════════════════════════════════════════════════════════════
    // RAHUL — Funny, hype, slightly chaotic, genuinely supportive
    // ════════════════════════════════════════════════════════════
    friend: {

      // When happiness HIGH — maximum Rahul energy
      hype: [
        "BRO YOU ARE BUILT DIFFERENT. I said what I said. No notes. 🔥",
        "Peak cinema. This is exactly why I'm in your contact list. THIS MOMENT. 🍿",
        "I'm manifesting this works out. Eyes closed. Manifesting. Done. You're welcome.",
        "I have watched your entire arc from Episode 1 to now. Character development? INSANE. 🎭",
        "Main teri team mein hoon. Always was. But especially now when it's actually going well. 😂",
        "Sending this to Ankit. He needs to see what real commitment looks like.",
      ],

      // When bank is LOW or things went badly — roast mode engaged
      roasting: [
        "So… how's the situation? Just checking in. As a concerned friend. 😂",
        "Bro when I said 'go for it' I did NOT mean go THIS far for it. 💀",
        "I'm not saying I told you so. I'm saying… we all knew the risk profile here.",
        "This is genuinely peak content. I feel bad saying that. I'm saying it anyway. 🍿",
        "Your ex is going to screenshot your LinkedIn after this. Just prepare.",
        "Honestly? Respect. Also, fear. Both. Simultaneously.",
      ],

      // When things are hard — real friend mode
      supportive: [
        "Hey. Real talk — you okay? Not the LinkedIn answer. The actual answer.",
        "I've seen you handle worse. Not much worse. But definitely worse. You've got this.",
        "You're figuring it out in real time. That's actually impressive. Most people don't try.",
        "I'm here. What do you need? Food? Plan? Someone to blame? Available for all three.",
        "Bhai, you've committed now. Just see it through. I'll be here for every episode.",
        "Everyone who 'played it safe' is watching from the sidelines. You're on the field.",
      ],

      // General funny / curious
      funny: [
        "This situation is evolving faster than I can process. Please give me a second. 🫡",
        "I showed this to Ankit. He said 'respect'. He never says that. So. Big deal.",
        "Your life is a documentary and I have absolute front-row seats. 🎬",
        "Bro who actually lives like this. The risk tolerance. The AUDACITY. I need to understand.",
        "This is either the best decision or the worst decision. The line is extremely thin. Very.",
        "I need to stop telling people about your situation because they keep asking for updates.",
      ],

      // Referencing last bold/risky move
      afterBrave: [
        "Still thinking about what you did last time bro. That was genuinely unexpected. Respect.",
        "Okay after that last move — I have to ask. What's the actual plan from here? Walk me through.",
        "Not gonna lie, I didn't think you'd do that. Gained some genuine respect.",
      ],

      // Referencing last safe/conservative move
      afterSafe: [
        "Playing safe huh. Valid. Completely valid. …is it though? I'm asking nicely.",
        "Sensible choice selected. Are you feeling okay? That was very sensible of you.",
        "I respect the calculated move. A little boring. But calculated.",
      ],
    },

    // ════════════════════════════════════════════════════════════
    // MR. SHARMA — Logical, blunt, data-driven, tough love
    // ════════════════════════════════════════════════════════════
    mentor: {

      // When bank is LOW — serious mode
      blunt: [
        "Numbers don't lie. What do your numbers say right now? Be specific.",
        "I've watched sixty people make emotional decisions. Most regretted it. Think. Then speak.",
        "Stop. Before you say anything — runway. How many months? I'll wait.",
        "Passion is fuel. Discipline is the engine. Without the engine, fuel is just fire hazard.",
        "Set aside everything you're feeling. What does the data say? That's the only question.",
        "Three months of runway isn't a deadline. It's a countdown. Every morning you should feel it.",
      ],

      // When metrics are STRONG — rare Sharma approval
      impressed: [
        "That was the correct call. Don't celebrate. But — that was the correct call.",
        "Good. Now apply that same logic everywhere else. Don't let it be a one-time thing.",
        "I'll be honest — I wasn't sure you'd make that choice. I'm adjusting my assessment upward.",
        "This separates people who make it from people who almost make it. Remember this moment.",
        "Well played. Most founders at this stage choose comfort. You didn't. That matters.",
        "I've seen this pattern before. The ones who do what you just did — they tend to figure it out.",
      ],

      // General caution / wisdom
      warning: [
        "The next decision is more important than this one. Not this one. The next one.",
        "Don't let small wins create large overconfidence. That's exactly where founders fall.",
        "Build systems, not just momentum. Momentum runs out. Systems compound over time.",
        "One thing I've learned across forty years — the moment you think you've figured it out… you haven't.",
        "Execution is just ideas that showed up repeatedly. Nothing more romantic than that.",
        "What's your backup plan? Not the one you tell investors. The real one.",
      ],

      // Memory: they made a smart call
      afterSmart: [
        "Your last decision showed real judgment. Use that same framework. Consistently.",
        "What you did showed clarity. I want you to tell me why — walk me through the actual logic.",
      ],

      // Memory: they made a risky call
      afterRisky: [
        "About your last move — I have concerns. Let's talk numbers when you have a moment.",
        "Bold. But bold without runway is just expensive. What's the contingency?",
      ],
    },

    // ════════════════════════════════════════════════════════════
    // PRIYA — Thoughtful, emotional, quietly strong
    // ════════════════════════════════════════════════════════════
    love: {

      // Tender / present
      tender: [
        "I know it's a lot right now. I just want you to know I see how hard you're trying. 💙",
        "Can we just sit for a bit? Not talk about any of this. Just sit for a while.",
        "You don't have to have every answer right now. Nobody does at this stage.",
        "I made chai. It's probably getting cold. No pressure. Just come home when you can.",
        "You're doing better than you think. I know you don't believe that right now. But you are.",
        "I'm not going anywhere. Just making sure you know that.",
      ],

      // When happiness is LOW — concerned and gentle
      concerned: [
        "I'm not asking for daily updates. I'm asking that you don't just disappear from us.",
        "When's the last time you slept a full night? That's not a rhetorical question.",
        "I'm worried. Not about the plan. About you. You look different lately. Quieter.",
        "You don't have to handle every single thing alone. That's not strength. That's just hard.",
        "I'm still here. Just reminding you. I know sometimes you forget to check.",
      ],

      // When things are going well — quietly proud
      proud: [
        "I won't make a big deal of this but… I'm really proud of you. Like genuinely. 💙",
        "You did that. Remember this feeling for when it gets hard again — because it will.",
        "Worth it. All of it. Every difficult week — it was worth it. I just wanted to say that.",
        "I knew. I always did. You were always going to figure it out.",
      ],
    },
  };

  // ─── RANDOM CHAT EVENTS ──────────────────────────────────────
  // These are injected occasionally between messages for realism.
  // Type 'system' = center badge. Type 'message' = a one-liner from a char.

  const CHAT_EVENTS = [
    { type: 'system', text: 'Rahul left the chat' },
    { type: 'system', text: 'Rahul rejoined the chat 👀' },
    { type: 'system', text: 'Amma changed group name to "Beta Please 😭"' },
    { type: 'system', text: 'Priya is typing… (then stopped)' },
    { type: 'system', text: 'Mr. Sharma has seen your message' },
    { type: 'system', text: 'Amma added "Maasi 🙏" to the group' },
    { type: 'system', text: 'Rahul sent a voice note · 0:04' },
    { type: 'message', char: 'friend', text: '…okay I had to put my phone down for a second' },
    { type: 'message', char: 'friend', text: 'I\'m showing this to everyone in my office' },
    { type: 'message', char: 'parent', text: '🙏🙏🙏' },
    { type: 'message', char: 'parent', text: 'Beta please eat something today at least' },
  ];

  // ─── TONE SELECTION ──────────────────────────────────────────
  // Each character's emotional state is driven by current metrics.

  function getParentTone(metrics) {
    if (!metrics) return 'emotional';
    const { approval, bank } = metrics;
    if (approval < 35 || bank < 5000) return 'shocked';
    if (approval < 52) return 'worried';
    if (approval > 72) return 'proud';
    return 'emotional';
  }

  function getFriendTone(metrics) {
    if (!metrics) return 'funny';
    const { happiness, bank } = metrics;
    if (happiness > 72) return 'hype';
    if (bank < 8000) return 'roasting';
    if (happiness < 45) return 'supportive';
    return 'funny';
  }

  function getMentorTone(metrics) {
    if (!metrics) return 'warning';
    const { bank, happiness, approval } = metrics;
    if (bank < 10000) return 'blunt';
    if (happiness > 70 && approval > 70) return 'impressed';
    return 'warning';
  }

  function getLoveTone(metrics) {
    if (!metrics) return 'tender';
    const { happiness, approval } = metrics;
    if (happiness < 45) return 'concerned';
    if (happiness > 75 && approval > 65) return 'proud';
    return 'tender';
  }

  // ─── PUBLIC API ──────────────────────────────────────────────

  /**
   * Call this whenever the user makes a choice.
   * Stores context for the next getLine() / getBonusReaction() calls.
   */
  function remember(choiceId, choiceText, metricChanges) {
    sessionMem.lastChoiceId = choiceId;
    sessionMem.lastChoiceText = choiceText;
    sessionMem.choiceHistory.push(choiceId);

    // Determine risk level of this choice
    // Risky = high happiness gain but bank/approval drop, or bank < -6000
    let riskVal = 0;
    if (metricChanges) {
      const bd = metricChanges.bank?.delta || 0;
      const hd = metricChanges.happiness?.delta || 0;
      const ad = metricChanges.approval?.delta || 0;
      if (bd < -6000 || ad < -10) riskVal = 1;
      if (hd > 15 && ad < -8) riskVal = 1;
      if (bd >= 0 && ad >= 0) riskVal = -1;

      ['bank', 'happiness', 'approval'].forEach(k => {
        if (metricChanges[k]) {
          sessionMem.metricTrend[k] = (sessionMem.metricTrend[k] || 0) + (metricChanges[k].delta || 0);
        }
      });
    }
    sessionMem.lastChoiceRisk = riskVal;
    sessionMem.riskScore += riskVal;
  }

  /**
   * Get one dynamic line for a character, context-driven.
   * @param {string} charId   - parent | friend | mentor | love
   * @param {object} metrics  - { bank, happiness, approval }
   * @returns {string|null}
   */
  function getLine(charId, metrics) {
    const pool = POOLS[charId];
    if (!pool) return null;

    const topic = detectTopic(mem.lastChoiceText || "");

    if (topic === "travel") {
      if (charId === "parent") {
        return "Where are you going? Share location and details.";
      }
      if (charId === "friend") {
        return "Bro Goa plan hai ya chaos plan 😂🔥";
      }

    }

    if (topic === "career") {
      if (charId === "mentor") {
        return "What's your runway? Show me numbers.";
      }
    }
    if (topic === "relationship") {
      if (charId === "friend") {
        return "Okay this is getting messy 👀 tell me everything.";
      }
      if (charId === "parent") {
        return "We just want your happiness beta… but think carefully.";
      }
    }

    const isRisky = sessionMem.lastChoiceRisk > 0;
    const isSafe = sessionMem.lastChoiceRisk < 0;
    const hasMemory = sessionMem.choiceHistory.length > 1; // second episode onwards

    let toneKey;

    // With 40% chance, use a memory-aware branch if available
    if (hasMemory && chance(0.40)) {
      if (charId === 'parent') {
        toneKey = isRisky ? 'afterRisky' : (isSafe ? 'afterSafe' : null);
      } else if (charId === 'friend') {
        toneKey = isRisky ? 'afterBrave' : (isSafe ? 'afterSafe' : null);
      } else if (charId === 'mentor') {
        toneKey = isRisky ? 'afterRisky' : (isSafe ? 'afterSmart' : null);
      }
    }

    // Fallback to metric-based tone
    if (!toneKey || !pool[toneKey]) {
      if (charId === 'parent') toneKey = getParentTone(metrics);
      if (charId === 'friend') toneKey = getFriendTone(metrics);
      if (charId === 'mentor') toneKey = getMentorTone(metrics);
      if (charId === 'love') toneKey = getLoveTone(metrics);
    }

    // Final fallback to first available key
    if (!pool[toneKey]) toneKey = Object.keys(pool)[0];

    return pickFresh(pool[toneKey], `${charId}:${toneKey}`);
  }

  /**
   * After a choice resolves, optionally inject 1 bonus dynamic reaction.
   * Non-deterministic: only fires ~55% of the time to avoid feeling scripted.
   * Pick a character that DIDN'T already react in the hardcoded reactions.
   *
   * @param {string[]} alreadyReacted - charIds that already had lines
   * @param {object}   metrics        - current metrics
   * @returns {{ char, text }|null}
   */
  function getBonusReaction(alreadyReacted, metrics) {
    if (!chance(0.55)) return null;

    // Try characters in a random order, pick first one not already used
    const candidates = ['friend', 'parent', 'mentor', 'love'].filter(
      c => !alreadyReacted.includes(c) && POOLS[c]
    );
    if (!candidates.length) return null;

    const charId = rnd(candidates);
    const text = getLine(charId, metrics);
    if (!text) return null;

    return { char: charId, text };
  }

  /**
   * Occasionally returns a random chat event.
   * Call this between scene messages for organic group-chat feel.
   * @param {number} probability - 0 to 1, default 0.18
   * @returns {{ type:string, char?:string, text:string }|null}
   */
  function maybeGetChatEvent(probability = 0.18) {
    if (!chance(probability)) return null;
    return rnd(CHAT_EVENTS);
  }

  /**
   * Reset everything for a new simulation run.
   */
  function resetSession() {
    sessionMem = {
      lastChoiceId: null,
      lastChoiceText: null,
      lastChoiceRisk: 0,
      choiceHistory: [],
      riskScore: 0,
      metricTrend: { bank: 0, happiness: 0, approval: 0 },
      seenLines: new Set()
    };
  }

  /** Read-only snapshot of current memory (for debugging). */
  function getMemory() {
    return {
      lastChoiceId: sessionMem.lastChoiceId,
      lastChoiceText: sessionMem.lastChoiceText,
      riskScore: sessionMem.riskScore,
      choiceCount: sessionMem.choiceHistory.length,
      metricTrend: { ...sessionMem.metricTrend }
    };
  }

  return {
    remember,
    getLine,
    getBonusReaction,
    maybeGetChatEvent,
    resetSession,
    getMemory,
  };

})();

// Expose DialogueMixer globally so app.js (separate module) can access it
if (typeof window !== 'undefined') {
  window.DialogueMixer = DialogueMixer;
}


