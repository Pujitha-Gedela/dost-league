# Dost League — Interactive Daily Episode Life Simulator

> **"Your Life. Daily Episode. Real Chaos."**  
> A mobile-first, chat-native interactive narrative game built around relatable Indian life crossroads—where every decision shifts your **Bank Balance**, **Happiness**, and **Family Approval** in real time.

---

## 1. Product Concept & Core Hook
Most text-based life simulators feel static and repetitive. **Dost League** turns high-stakes Indian life dilemmas into fast, 3-minute WhatsApp-style group chat episodes complete with typing indicators, group-rename gags, read receipts, and an ensemble cast (**Amma**, **Rahul** the hype-man friend, **Priya**, and **Mr. Sharma** the pragmatic mentor) reacting dynamically to your choices.

### Four Playable Scenarios
1. **Startup Founder:** Quit an ₹18 LPA Infosys job with ₹50K in savings—navigate co-founder hunting, 14-hour grind burnouts, ₹22 LPA temptation offers, and runway crunch.
2. **UPSC Aspirant:** 6 lakh rivals, 1 seat—balance Old Rajinder Nagar prep pressure, family expectations, and mental stamina.
3. **Move to Bangalore:** Surviving Koramangala rent, tech-bro culture, and career pivots.
4. **Love vs Arranged:** Navigating the ultimate Indian family drama season finale.

---

## 2. Architecture & "Zero-Latency Illusion of Intelligence"
* **Multi-Scene Narrative State Engine (`engine.js`, `data.js`):** Tracks episode progression (`Day 1` -> `Month 1` -> `Month 6`), resource meters (`Bank ₹`, `Happiness %`, `Approval %`), and branching consequences across multi-stage episodes.
* **Dynamic Tone & Memory Dialogue System (`dialogue.js`):**
  * Selects character reactions from **4–5 emotional tone pools × 5–7 line variations** based on live metric thresholds (e.g., low Family Approval triggers Amma's *"cousin Rohit promotion"* comparisons).
  * Uses choice memory and session-level deduplication (`pickFresh()`) so replays feel reactive without requiring a backend.
  * Injects realistic group-chat micro-events (*"Rahul rejoined the chat"*, *"Amma changed group name to 'Beta Please'"*).
* **Optional Bring-Your-Own-Key Gemini Mode (`gemini.js`, `ai-settings.js`):** Players can optionally add a Gemini API key via the in-app settings modal (stored locally in `localStorage`, never hardcoded) for AI-generated dynamic dialogue responses.
* **Built-In Viral Growth Loop (`app.js`):** Ends every episode with an archetype badge (e.g., *"The Unstoppable One"*), final scorecard, **Copy & Share** social snippet, and **Replay This Path** counterfactual branching.

---

## 3. Product Metrics & Growth Design (PM / Product Analyst Framing)

| Metric Category | Metric Definition | Product Mechanism |
| :--- | :--- | :--- |
| **North Star** | **Episode Completion Rate** (% of started episodes reaching the final outcome card) | 3-act pacing (`Day 1` -> `Month 1` -> `Month 6`) keeps sessions under 3 minutes |
| **Engagement / Depth** | **Replay-per-User Rate** (clicks on `Replay This Path` or `New Episode` per session) | Visible metric deltas (`+₹15.0L`, `Mood +18%`, `Approval +16%`) invite counterfactual testing |
| **Organic Acquisition** | **K-Factor / Share Tap Rate** (% of finishers clicking `Share Episode` -> `Copy & Share`) | Archetype titles + funny Amma quotes formatted for WhatsApp/Instagram Stories |
| **D1 / D7 Retention** | Daily Episode return rate | Episodic "Today's Episode" framing + 4 distinct cultural scenarios |

---

## 4. How to Run Locally
No build tools, servers, or API keys are required:
1. Clone the repository:
   ```bash
   git clone [https://github.com/Pujitha-Gedela/dost-league.git](https://github.com/Pujitha-Gedela/dost-league.git)
   Open index.html directly in any modern browser (Chrome, Edge, Safari) or serve via VS Code Live Server.