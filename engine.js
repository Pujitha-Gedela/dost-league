/**
 * engine.js — Dost League Scene Engine
 */
const Engine = (() => {

  let state = {
    scenario: null,
    episodeIndex: 0,
    sceneIndex: 0,
    metrics: { bank: 50000, happiness: 65, approval: 65 },
    choicesMade: [],
    lastOutcome: null,
    finalEnding: null,
    customTitle: ''
  };

  // ── HISTORY ───────────────────────────────────────────────────
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem('dostleague_v2') || '[]'); } catch { return []; }
  }
  function saveHistory() {
    if (!state.scenario) return;
    const label = getEpisodeLabel(state.finalEnding || 'neutral', state.metrics.happiness, state.metrics.approval);
    const entry = {
      id: Date.now(),
      scenarioId: state.scenario.id,
      scenarioName: state.customTitle || state.scenario.name,
      emoji: state.scenario.emoji,
      metrics: { ...state.metrics },
      ending: state.finalEnding,
      outcomeSummary: state.lastOutcome?.summary || '',
      episodeTitle: state.lastOutcome?.episodeTitle || "Today's Episode",
      labelTitle: label.title,
      labelEmoji: label.emoji,
      closingLine: getClosingLine(state.metrics, state.finalEnding || 'neutral'),
      date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    };
    const hist = loadHistory();
    hist.unshift(entry);
    if (hist.length > 20) hist.pop();
    try { localStorage.setItem('dostleague_v2', JSON.stringify(hist)); } catch {}
  }

  // ── METRICS ───────────────────────────────────────────────────
  function clamp(val, key) {
    return key === 'bank' ? Math.max(0, val) : Math.min(100, Math.max(0, val));
  }
  function applyDelta(delta) {
    const changes = {};
    Object.entries(delta).forEach(([k, amt]) => {
      const before = state.metrics[k];
      state.metrics[k] = clamp(before + amt, k);
      changes[k] = { delta: amt, direction: amt >= 0 ? 'up' : 'down' };
    });
    return changes;
  }
  function formatBank(v) {
    if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
    if (v >= 1000)   return `₹${(v/1000).toFixed(0)}K`;
    return `₹${v}`;
  }
  function getMetricPercent(key) {
    if (key === 'bank') return Math.min(100, Math.round((state.metrics.bank / 600000) * 100));
    return state.metrics[key];
  }

  // ── CUSTOM SCENARIO PERSONALIZER ─────────────────────────────
  function detectTopic(title) {
    const t = title.toLowerCase();
    if (/trip|travel|tour|vacation|holiday|goa|manali|trek|backpack|road.?trip/.test(t)) return 'travel';
    if (/business|startup|venture|company|product|launch|saas|app|brand/.test(t)) return 'business';
    if (/music|band|song|album|sing|guitar|rap|podcast|youtube|content|art|paint|write|novel|film|comic/.test(t)) return 'creative';
    if (/gym|fit|marathon|workout|diet|weight|run|cycle|sport|cricket|football|chess/.test(t)) return 'fitness';
    if (/study|exam|learn|course|degree|college|skill|upskill|certification|mba|phd/.test(t)) return 'education';
    if (/relation|love|marry|wedding|partner|date|breakup|family|friend/.test(t)) return 'relationship';
    if (/job|career|office|work|promotion|freelance|intern|switch|quit/.test(t)) return 'career';
    return 'generic';
  }

  const CUSTOM_TEMPLATES = {
    travel: {
      ep1Question: "Day 1. How do you kick off the planning?",
      ep1Choices: [
        { id:'c1a', text:"Book everything now — flights, hotels, itinerary locked.", label:'A', icon:'✈️',
          metrics:{ bank:-15000, happiness:+18, approval:-5 },
          reactions:[
            { char:'friend', text:"BOOKINGS DONE ON DAY 1 💀✈️ No going back. I am legally your co-pilot now." },
            { char:'parent', text:"So much money already! At least you booked refundable tickets na? Beta, refundable. Please." },
          ]},
        { id:'c1b', text:"Research first — compare options, get everyone's input.", label:'B', icon:'🗺️',
          metrics:{ bank:-500, happiness:+8, approval:+5 },
          reactions:[
            { char:'mentor', text:"Good instinct. A well-researched trip is 80% less chaos. What destinations are shortlisted?" },
            { char:'friend', text:"'Research phase' is just the WhatsApp poll phase where nobody agrees. But yes, let's poll." },
          ]},
        { id:'c1c', text:"Set a budget first — figure out what's actually possible.", label:'C', icon:'💸',
          metrics:{ bank:0, happiness:+5, approval:+12 },
          reactions:[
            { char:'parent', text:"FINALLY someone is thinking practically. Budget first. Don't spend what you don't have. Sensible child! 😊" },
            { char:'friend', text:"The responsible option 😂 Fine. Budget. But we ARE doing this. Promise me." },
          ]},
      ],
      ep2Question: "The group has 4 different opinions. How do you handle it?",
      ep2Choices: [
        { id:'c2a', text:"Just decide unilaterally — you'll thank me later.", label:'A', icon:'🔥',
          metrics:{ bank:-8000, happiness:+10, approval:-8 },
          reactions:[
            { char:'friend', text:"Okay dictator mode 😭 I didn't agree to Kasol BUT I will pack and come. Obviously." },
            { char:'mentor', text:"Bold. Group dynamics can break trips. Have a genuine conversation before finalizing." },
          ]},
        { id:'c2b', text:"Democratic vote — majority rules, no grudges.", label:'B', icon:'🗳️',
          metrics:{ bank:-5000, happiness:+15, approval:+8 },
          reactions:[
            { char:'friend', text:"Goa won 3-1. Aman voted Shimla but he's coming to Goa anyway 😂 Democracy works!" },
            { char:'parent', text:"Everyone agreed? No fights? Maybe this trip will actually happen this time. 😊" },
          ]},
        { id:'c2c', text:"Split trip — 2 days one place, 2 days another.", label:'C', icon:'🎯',
          metrics:{ bank:-12000, happiness:+20, approval:0 },
          reactions:[
            { char:'mentor', text:"Creative compromise. Logistically complex, but it keeps everyone invested. Good leadership." },
            { char:'friend', text:"Wait this is actually genius? Mountains AND beach? We're doing it." },
          ]},
      ],
      ep3Question: "Trip's almost over. What kind of traveller did you turn out to be?",
      ep3Choices: [
        { id:'c3a', text:"Planned every moment — zero wasted time, maximum experiences.", label:'A', icon:'🏆',
          metrics:{ bank:-5000, happiness:+22, approval:+10 },
          outcome:{ summary:"Waterfalls. Local food. That one chai shop at 6AM. A perfect group photo. Zero missed moments.", episodeTitle:"The Trip That Delivered Everything", ending:'success' },
          reactions:[
            { char:'friend', text:"I am STILL in the group photo phase of processing this trip. Day 3 was cinema. CINEMA." },
          ]},
        { id:'c3b', text:"Went fully off-script — stumbled into the best moments.", label:'B', icon:'💡',
          metrics:{ bank:-8000, happiness:+28, approval:-5 },
          outcome:{ summary:"No plan survived contact with reality. But the random detours were the actual story.", episodeTitle:"The One Where Nothing Went to Plan", ending:'neutral' },
          reactions:[
            { char:'mentor', text:"The best travel stories are always the unplanned ones. You'll be telling this for years." },
          ]},
        { id:'c3c', text:"The trip had drama, but we handled it — we're still friends.", label:'C', icon:'🎯',
          metrics:{ bank:-10000, happiness:+10, approval:0 },
          outcome:{ summary:"One minor fight, one missed bus, one legendary night. Friendship survived. That's the real win.", episodeTitle:"The Trip That Tested Everything", ending:'neutral' },
          reactions:[
            { char:'friend', text:"We argued about nothing for 15 minutes and then had the best dinner of the trip. That's us summarized." },
          ]},
      ],
      ep1Scenes: [
        { label: 'The Group Chat Explodes',
          messages: [
            { char: 'narrator', text: 'You\'ve decided to plan a trip. The WhatsApp group has been notified. Everyone reacted immediately. Nobody has actually checked their leave balance yet.' },
            { char: 'parent',   text: 'Beta you\'re going WHERE? With whom exactly? Have I met all these people? Send me the full itinerary and location sharing for the whole trip. All of you. 😤' },
          ]},
        { label: 'The Group Reacts',
          messages: [
            { char: 'friend', text: 'I DON\'T CARE WHAT IT COSTS — WE ARE GOING. I have been waiting for this trip since literally Class 12. What destination? Tell me immediately. I\'m already checking flights. 🔥' },
            { char: 'system', text: 'Rahul has already screenshotted 7 flight deals' },
          ]},
        { label: 'The Planning Reality',
          messages: [
            { char: 'mentor', text: 'Good — everyone needs a reset. But I\'ve seen too many trips collapse over poor planning. Lock the dates first. That\'s the only thing that\'s hard to reverse.' },
          ]},
      ],
      ep2Scenes: [
        { label: 'The Coordination War',
          messages: [
            { char: 'narrator', text: 'Planning is in full chaos. Fifteen opinions, three different apps, one person who hasn\'t replied in four days. The group chat has 200 unread messages.' },
            { char: 'friend',   text: 'I need a final answer from everyone. YES or NO. No \'maybe\'. No \'let me check leave\'. YES or NO. Done with maybe-people. 😤' },
          ]},
        { label: 'The Budget Reality',
          messages: [
            { char: 'mentor', text: 'Split costs clearly upfront — ambiguity about money ruins friendships faster than anything else. Who is managing the common fund?' },
            { char: 'parent', text: 'How much is this trip costing total? I\'m not stopping you. I just want the actual number. Please. The real number.' },
          ]},
        { label: 'The Group Conflict',
          messages: [
            { char: 'narrator', text: 'Someone wants a different destination. Someone else has a budget problem they\'re not saying out loud. This needs resolving before any bookings happen.' },
          ]},
      ],
      ep3Scenes: [
        { label: "You're Actually Here",
          messages: [
            { char: 'narrator', text: 'You made it. The coordination chaos, the WhatsApp arguments, the budget fights — all of it led to this moment. Your people, a real place, a trip that actually happened.' },
            { char: 'friend',   text: 'BRO WE\'RE ACTUALLY HERE. I genuinely thought this would fall apart after Episode 2. But we\'re STANDING HERE. Someone take a photo. Multiple photos. RIGHT NOW.' },
          ]},
        { label: 'The Real Moments',
          messages: [
            { char: 'mentor', text: 'The best trips teach you something about yourself — not about the places you visit, but about who you are when you\'re away from your routine. What did you discover?' },
            { char: 'narrator', text: 'The answer you give right now is the most honest one of the whole journey.' },
          ]},
        { label: 'Trip Verdict',
          messages: [
            { char: 'system', text: 'Three episodes. One trip. The verdict is yours to give.' },
          ]},
      ],
    },
    business: {
      ep1Question: "Day 1. What's your very first move?",
      ep1Choices: [
        { id:'c1a', text:"Go all in immediately — full commitment, no safety net.", label:'A', icon:'🔥',
          metrics:{ bank:-10000, happiness:+16, approval:-10 },
          reactions:[
            { char:'friend', text:"FULLY COMMITTED Day 1 🔥 No half measures. This is the energy. This is the STORY." },
            { char:'parent', text:"No safety net?? Keep emergency money aside. Just a little. For me. Please. 😭" },
          ]},
        { id:'c1b', text:"Start small and test — validate before going all in.", label:'B', icon:'💡',
          metrics:{ bank:-3000, happiness:+5, approval:+10 },
          reactions:[
            { char:'mentor', text:"Small experiments with real feedback loops. This is how sustainable successes actually begin." },
            { char:'friend', text:"'Test and validate' energy. Very sensible honestly." },
          ]},
        { id:'c1c', text:"Build knowledge first — learn before you leap.", label:'C', icon:'🎯',
          metrics:{ bank:-2000, happiness:+10, approval:+15 },
          reactions:[
            { char:'parent', text:"YES. Learn everything properly. Knowledge is the best foundation. I'm less worried now. Slightly. 🙂" },
            { char:'friend', text:"Pre-learning phase. Valid. But at some point you have to DO the thing, not just prepare." },
          ]},
      ],
      ep2Question: "You hit a real obstacle. What do you do?",
      ep2Choices: [
        { id:'c2a', text:"Push through — persistence is the real differentiator.", label:'A', icon:'🔥',
          metrics:{ bank:-5000, happiness:-5, approval:+5 },
          reactions:[
            { char:'friend', text:"Day 90 and still going 💪 Tell me the specific tough part — I want the actual thing, not 'it's hard'." },
            { char:'mentor', text:"Make sure you're pushing through a real obstacle, not stubbornly repeating what isn't working." },
          ]},
        { id:'c2b', text:"Pivot — adapt based on what you've actually learned.", label:'B', icon:'💡',
          metrics:{ bank:-2000, happiness:+10, approval:0 },
          reactions:[
            { char:'mentor', text:"Pivoting based on evidence is intelligence, not weakness. What specifically led to this?" },
            { char:'friend', text:"New direction unlocked. I'm with it. Tell me the updated plan. Full detail." },
          ]},
        { id:'c2c', text:"Ask for help — you can't figure everything out alone.", label:'C', icon:'🎯',
          metrics:{ bank:-3000, happiness:+16, approval:+10 },
          reactions:[
            { char:'mentor', text:"Asking for help early is self-awareness, not weakness. Who specifically can help you here?" },
            { char:'parent', text:"You asked for help! Grown-up thinking! What do you need from us? We're here. 🙏" },
          ]},
      ],
      ep3Question: "How do you define success for this journey?",
      ep3Choices: [
        { id:'c3a', text:"I achieved what I set out to do. It worked.", label:'A', icon:'🏆',
          metrics:{ bank:+20000, happiness:+20, approval:+16 },
          outcome:{ summary:"You did it. Exactly what you said you would. Not perfectly, not without cost — but you achieved the actual goal.", episodeTitle:"The One Where It Actually Worked", ending:'success' },
          reactions:[
            { char:'parent', text:"We always knew. Even when worried sick — deep down we believed. Proud doesn't cover it. 😭🎉" },
            { char:'friend', text:"CALLED IT. Mandatory celebration this weekend. I'm picking the place." },
          ]},
        { id:'c3b', text:"It's different from what I imagined — but worthwhile.", label:'B', icon:'💡',
          metrics:{ bank:+5000, happiness:+16, approval:+10 },
          outcome:{ summary:"Not what you pictured. But what you found was real and yours. The detour turned out to be the point.", episodeTitle:"The Unexpected Win", ending:'neutral' },
          reactions:[
            { char:'mentor', text:"The journey not matching the plan doesn't make it failure. Most meaningful paths look completely different from the inside." },
          ]},
        { id:'c3c', text:"It didn't work — but I grew through trying.", label:'C', icon:'',
          metrics:{ bank:-10000, happiness:+5, approval:-5 },
          outcome:{ summary:"The outcome wasn't what you hoped for. But you tried. Actually tried. And you're different now.", episodeTitle:"The Beautiful Attempt", ending:'fail' },
          reactions:[
            { char:'friend', text:"You genuinely, fully tried. Most people never do. Round 2 when ready — I'll be your first call." },
            { char:'parent', text:"Proud of you for trying, beta. Never forget that. Trying is everything. 🙏" },
          ]},
      ],
      ep1Scenes: [
        { label: 'The Announcement',
          messages: [
            { char: 'narrator', text: 'You\'ve made your decision. Big or small, this is a real commitment now. Your support system has been informed. Good luck.' },
            { char: 'parent',   text: 'Beta I\'m not sure I fully understand, but you seem serious about this. Just be careful with savings. And eat properly. That\'s all I\'m saying. 🙏' },
          ]},
        { label: 'Support System Activates',
          messages: [
            { char: 'friend', text: 'Okay I\'m actually curious — walk me through the actual vision. Not the elevator pitch. The real thing. What are you building/creating/doing?' },
            { char: 'system', text: 'Rahul has already told his whole office about your plan' },
          ]},
        { label: 'Reality Check',
          messages: [
            { char: 'mentor', text: 'Tell me the goal. Not the dream version. The real, measurable one. What does success actually look like six months from now?' },
          ]},
      ],
    },
    creative: {
      ep1Question: "Day 1. How do you actually start creating?",
      ep1Choices: [
        { id:'c1a', text:"Just start making something — perfection kills creativity.", label:'A', icon:'🎨',
          metrics:{ bank:-2000, happiness:+20, approval:-5 },
          reactions:[
            { char:'friend', text:"No planning, just vibes. Honestly the most creative way to start. Send me what you make!" },
            { char:'mentor', text:"Good. Done is better than perfect at the start. What are you making for your first session?" },
          ]},
        { id:'c1b', text:"Study the greats first — understand what works before creating.", label:'B', icon:'📚',
          metrics:{ bank:-1000, happiness:+8, approval:+12 },
          reactions:[
            { char:'parent', text:"Yes! Learn from the best. This is the right approach. So responsible. My child 😊" },
            { char:'friend', text:"Reference gathering phase. Totally justifiable. But don't stay in this phase forever 👀" },
          ]},
        { id:'c1c', text:"Find your audience first — create what people actually want.", label:'C', icon:'🎯',
          metrics:{ bank:0, happiness:+5, approval:+8 },
          reactions:[
            { char:'mentor', text:"Audience-first is smart. Most creators make things nobody asked for. You're already thinking differentially." },
            { char:'friend', text:"Market research before creating. You have startup brain. This is either genius or procrastination." },
          ]},
      ],
      ep2Question: "The creative block hits. What do you do?",
      ep2Choices: [
        { id:'c2a', text:"Force through it — creativity is 90% showing up.", label:'A', icon:'🔥',
          metrics:{ bank:0, happiness:-8, approval:+5 },
          reactions:[
            { char:'mentor', text:"There's wisdom in showing up even on bad days. Some of your best work may come from these sessions." },
            { char:'friend', text:"Respect the discipline. Not everyone can force themselves through the block." },
          ]},
        { id:'c2b', text:"Take a real break — refill the creative tank.", label:'B', icon:'🌿',
          metrics:{ bank:0, happiness:+18, approval:-5 },
          reactions:[
            { char:'friend', text:"REST IS PRODUCTIVE. I've been saying this. How'd the walk/movie/sleep help?" },
            { char:'parent', text:"Rest is important beta. You can't pour from an empty vessel. Also eat properly. 🙏" },
          ]},
        { id:'c2c', text:"Collaborate — someone else's energy can restart yours.", label:'C', icon:'🤝',
          metrics:{ bank:-2000, happiness:+15, approval:+5 },
          reactions:[
            { char:'mentor', text:"Collaboration is underrated in creative work. The right person at the right moment can unlock everything." },
            { char:'friend', text:"Wait are you saying you want ME to collab? Because I have thoughts. Many thoughts. Always." },
          ]},
      ],
      ep3Question: "It's time to share your work with the world. How?",
      ep3Choices: [
        { id:'c3a', text:"Release it publicly — ship it and see what happens.", label:'A', icon:'🚀',
          metrics:{ bank:+5000, happiness:+22, approval:+5 },
          outcome:{ summary:"You put it out there. The response was real — some loved it, some didn't care, some found it exactly when they needed it.", episodeTitle:"The One Where You Shipped It", ending:'success' },
          reactions:[
            { char:'friend', text:"IT'S OUT THERE. You can't unpost it. How's the reception? Tell me everything immediately." },
          ]},
        { id:'c3b', text:"Share with a small trusted circle first — get real feedback.", label:'B', icon:'💡',
          metrics:{ bank:0, happiness:+15, approval:+10 },
          outcome:{ summary:"Close feedback before the world. You refined it. It's sharper now. The next version will be ready.", episodeTitle:"The Careful Creator", ending:'neutral' },
          reactions:[
            { char:'mentor', text:"Iterating on feedback before release is professional maturity. Your work is better for it." },
          ]},
        { id:'c3c', text:"Keep refining — it's not ready yet.", label:'C', icon:'🔧',
          metrics:{ bank:0, happiness:-5, approval:+5 },
          outcome:{ summary:"Still in the workshop. That's okay. But at some point, the work has to meet the world.", episodeTitle:"The Perfectionist's Pause", ending:'fail' },
          reactions:[
            { char:'friend', text:"'Not ready' at month 6 might mean something else. Are you protecting yourself from feedback?" },
          ]},
      ],
      ep1Scenes: [
        { label: 'The Creative Decision',
          messages: [
            { char: 'narrator', text: 'You\'ve decided to create something. Whatever it is — music, writing, art, video — the blank page is waiting. The group chat has been informed. The accountability starts now.' },
            { char: 'parent',   text: 'This is your passion na? I always said you were creative beta. Just make sure there\'s also a plan. Passion is beautiful but also — bills exist. 🙂' },
          ]},
        { label: 'The First Reaction',
          messages: [
            { char: 'friend', text: 'Okay FINALLY you\'re actually doing it instead of just talking about it. I\'ve been waiting for this. Send me the first thing you make immediately, no excuses.' },
            { char: 'system', text: 'Rahul has already started a \'Name TBD\'fan account' },
          ]},
        { label: 'Creative Reality Check',
          messages: [
            { char: 'mentor', text: 'What\'s the output you\'re aiming for? Not in 6 months — what will you have made by the end of this week? Commitment starts with a small, concrete first deliverable.' },
          ]},
      ],
      ep2Scenes: [
        { label: 'Three Months In',
          messages: [
            { char: 'narrator', text: 'Three months of creating. Some sessions felt electric. Others felt like pulling teeth. The creative process is exactly as messy as you were warned.' },
            { char: 'friend',   text: 'Honest answer — are you still enjoying this or has it become a chore? Because the vibe of what you\'re making has changed. I can feel it.' },
          ]},
        { label: 'The Creative Struggle',
          messages: [
            { char: 'mentor', text: 'Every creative person hits this wall. The question is what it\'s made of — real creative burnout, or just resistance to doing the hard work?' },
            { char: 'parent', text: 'You look tired beta. Are you sleeping enough? Creation is important but so is the creator. Take care of yourself. 🙏' },
          ]},
        { label: 'The Block',
          messages: [
            { char: 'narrator', text: 'The block has arrived. Nothing feels original. Nothing feels good enough. This is the moment that separates people who finish things from people who talk about finishing things.' },
          ]},
      ],
      ep3Scenes: [
        { label: 'Six Months of Creating',
          messages: [
            { char: 'narrator', text: 'Six months. Whatever you made — whether polished or unfinished — you made something. That separates you from the 90% who just thought about it.' },
            { char: 'friend',   text: 'Real question — how do you feel about what you\'ve made? Not how others feel. How do YOU feel about it when you\'re alone with it at 2 AM?' },
          ]},
        { label: 'The Creative Reflection',
          messages: [
            { char: 'mentor', text: 'The best creative work teaches you something about yourself. What did making this reveal that you didn\'t know before you started?' },
            { char: 'narrator', text: 'This is the question that matters more than any view count or feedback.' },
          ]},
        { label: 'The Creator\'s Verdict',
          messages: [
            { char: 'system', text: 'Six months. Countless sessions. The verdict is yours to give.' },
          ]},
      ],
    },
    fitness: {
      ep1Question: "Day 1. How do you actually start?",
      ep1Choices: [
        { id:'c1a', text:"Go hard immediately — full intensity from Day 1.", label:'A', icon:'💪',
          metrics:{ bank:-3000, happiness:+15, approval:-5 },
          reactions:[
            { char:'friend', text:"MAX EFFORT DAY 1 💀 Don't murder yourself. Okay murder yourself a little. But warmup first." },
            { char:'mentor', text:"High intensity early is a common trap. The goal is to still want to do this in week 4." },
          ]},
        { id:'c1b', text:"Start with consistency — small sessions every single day.", label:'B', icon:'📅',
          metrics:{ bank:-1000, happiness:+10, approval:+10 },
          reactions:[
            { char:'parent', text:"Daily habit! Discipline! This is exactly right. Your grandfather walked 5km daily until 75. FIVE KM." },
            { char:'mentor', text:"Consistency over intensity, always. Small daily steps compound into major change." },
          ]},
        { id:'c1c', text:"Track everything first — data-driven approach.", label:'C', icon:'📊',
          metrics:{ bank:-2000, happiness:+5, approval:+5 },
          reactions:[
            { char:'friend', text:"Already on MyFitnessPal, tracking macros, reading about VO2 max. Science person era unlocked 😂" },
            { char:'mentor', text:"Measuring your baseline before starting is smart. You'll know exactly what's working." },
          ]},
      ],
      ep2Question: "The motivation dip hits (it always does). What do you do?",
      ep2Choices: [
        { id:'c2a', text:"Power through — discipline beats motivation.", label:'A', icon:'🔥',
          metrics:{ bank:0, happiness:-5, approval:+10 },
          reactions:[
            { char:'mentor', text:"This is the right mindset. Motivation is a feeling. Discipline is a system. You're building the system." },
            { char:'friend', text:"Went to gym feeling like death, came back feeling like a god? Every time, genuinely every time." },
          ]},
        { id:'c2b', text:"Change what's not working — pivot the approach.", label:'B', icon:'💡',
          metrics:{ bank:-1000, happiness:+15, approval:0 },
          reactions:[
            { char:'friend', text:"Switched from running to swimming and suddenly it's fun?? Change works apparently!" },
            { char:'mentor', text:"The best routine is the one you actually stick to. Good self-awareness to recognize the switch." },
          ]},
        { id:'c2c', text:"Get a partner or trainer — accountability changes everything.", label:'C', icon:'🤝',
          metrics:{ bank:-5000, happiness:+18, approval:+5 },
          reactions:[
            { char:'parent', text:"Trainer! So professional! Investment in health is investment in life. I'm proud. Also are you eating properly? 😊" },
            { char:'friend', text:"Accountability partner? Pick me. I'll be terrible at it but I'll be ENTHUSIASTIC." },
          ]},
      ],
      ep3Question: "Six months of effort. What's the outcome?",
      ep3Choices: [
        { id:'c3a', text:"I hit my goal — tangible, measurable results.", label:'A', icon:'🏆',
          metrics:{ bank:0, happiness:+28, approval:+18 },
          outcome:{ summary:"Six months. The numbers moved. The mirror changed. But more than that — your daily default changed.", episodeTitle:"The Transformation That Was Real", ending:'success' },
          reactions:[
            { char:'parent', text:"You look so healthy! HEALTHY! Come home, I'll make your favourite food. You deserve it. 😭🎉" },
            { char:'friend', text:"WHO IS THIS PERSON. I want a before-after photo. For science. And also inspiration." },
          ]},
        { id:'c3b', text:"Progress happened — not what I imagined, but real.", label:'B', icon:'💡',
          metrics:{ bank:0, happiness:+18, approval:+10 },
          outcome:{ summary:"Not the dramatic transformation you imagined. But you're different. Stronger, more consistent, more honest about your body.", episodeTitle:"The Quiet Progress", ending:'neutral' },
          reactions:[
            { char:'mentor', text:"Consistent progress over 6 months is what most people completely fail at. You didn't. That's the win." },
          ]},
        { id:'c3c', text:"I struggled to stay consistent — it's a work in progress.", label:'C', icon:'',
          metrics:{ bank:0, happiness:+5, approval:-5 },
          outcome:{ summary:"More starts than you'd like to admit. But you didn't quit entirely — and that matters more than perfect.", episodeTitle:"The Honest Struggle", ending:'fail' },
          reactions:[
            { char:'friend', text:"Coming back after skipping is the actual hardest part. You kept coming back. That's not failure." },
          ]},
      ],
      ep1Scenes: [
        { label: 'The Fitness Decision',
          messages: [
            { char: 'narrator', text: 'You\'ve decided to get fit. Goal set. Maybe gym bag is already packed. Maybe it\'s still in the shopping bag. Either way — Day 1 starts now.' },
            { char: 'parent',   text: 'Finally! Your father and I have been saying this for years. I\'m so happy. Also — please eat properly. Working out without eating properly is how people faint. Be careful. 😊' },
          ]},
        { label: 'The Friends Respond',
          messages: [
            { char: 'friend', text: 'WAIT you\'re actually doing it?? I\'ve heard this twice before. But okay — I\'m manifesting this time is different. What\'s the goal? Weight? Strength? Running? I need details.' },
            { char: 'system', text: 'Rahul has joined your \'accountability group\' on WhatsApp' },
          ]},
        { label: 'The Mentor\'s Take',
          messages: [
            { char: 'mentor', text: 'Fitness goals fail because people set outcome goals without process goals. What are you doing THIS WEEK — specific days, specific times, specific activity. Lock that in first.' },
          ]},
      ],
      ep2Scenes: [
        { label: 'The Motivation Dip',
          messages: [
            { char: 'narrator', text: 'Three months in. The initial excitement has worn off. Some weeks were great. Some were skipped entirely. The real test of commitment starts now.' },
            { char: 'friend',   text: 'Okay honest check-in — are you actually going consistently or are we in the \'went twice this week so it counts\' era? No judgment. Genuine question.' },
          ]},
        { label: 'The Progress Check',
          messages: [
            { char: 'mentor', text: 'Three months is enough time to see real results — if the work was consistent. What\'s changed? Strength, endurance, composition, energy levels? Give me something measurable.' },
            { char: 'parent', text: 'You do look different beta. Are you eating enough protein? I read that protein is very important for exercise. I\'ll make dal more often. 😊' },
          ]},
        { label: 'The Plateau',
          messages: [
            { char: 'narrator', text: 'The plateau has arrived. Progress has slowed. The scale isn\'t moving. The weights feel the same. This is the point where most people quietly quit. Will you?' },
          ]},
      ],
      ep3Scenes: [
        { label: 'Six Months of Showing Up',
          messages: [
            { char: 'narrator', text: 'Six months. However many sessions you actually made it to. However far you came. The person who started this and the person standing here now are different. The question is how.' },
            { char: 'friend',   text: 'Okay from the outside — I notice a difference. Not just physical. Your energy is different. Are you noticing it too or do I sound like an aunty?' },
          ]},
        { label: 'The Six-Month Review',
          messages: [
            { char: 'mentor', text: 'Six months is long enough to build a real habit — or to prove one won\'t stick without a system change. What did you learn about how your body and mind actually work together?' },
            { char: 'narrator', text: 'The most important fitness transformation isn\'t the physical one.' },
          ]},
        { label: 'The Fitness Verdict',
          messages: [
            { char: 'system', text: 'Six months. Countless sessions. The verdict is yours to give.' },
          ]},
      ],
    },
    education: {
      ep1Question: "Day 1. How do you structure your learning?",
      ep1Choices: [
        { id:'c1a', text:"Enrol in a structured course — guided learning first.", label:'A', icon:'🎓',
          metrics:{ bank:-8000, happiness:+10, approval:+15 },
          reactions:[
            { char:'parent', text:"Paid course! Certified learning! This is how you do it properly. So proud. Study hard beta 😊" },
            { char:'mentor', text:"Structured courses work when you actually complete them — only 10% of people do. Be in that 10%." },
          ]},
        { id:'c1b', text:"Self-study with books and free resources first.", label:'B', icon:'📚',
          metrics:{ bank:-500, happiness:+8, approval:+5 },
          reactions:[
            { char:'friend', text:"Free resources + discipline = dangerous combination. Tell me what you're actually building through this." },
            { char:'mentor', text:"Self-directed learning is hard, but powerful. Build in a way to get feedback — otherwise you won't know what you don't know." },
          ]},
        { id:'c1c', text:"Find a mentor or join a community — learn from practitioners.", label:'C', icon:'🤝',
          metrics:{ bank:-2000, happiness:+15, approval:+5 },
          reactions:[
            { char:'mentor', text:"Smart. Mentors compress your learning curve dramatically. Who specifically are you looking to connect with?" },
            { char:'friend', text:"Community approach. Networking WHILE learning. You're solving two problems at once. Efficiency." },
          ]},
      ],
      ep2Question: "The material gets hard. How do you deal with it?",
      ep2Choices: [
        { id:'c2a', text:"Deep-dive until I understand — no moving forward without understanding.", label:'A', icon:'🔬',
          metrics:{ bank:0, happiness:-5, approval:+10 },
          reactions:[
            { char:'mentor', text:"Depth first is right for foundational concepts. What specifically are you stuck on? Let's debug it." },
            { char:'friend', text:"Spent 4 hours on one concept 😭 But emerged understanding it. That counts." },
          ]},
        { id:'c2b', text:"Skip for now, come back later — keep momentum.", label:'B', icon:'⏭️',
          metrics:{ bank:0, happiness:+8, approval:-5 },
          reactions:[
            { char:'mentor', text:"Strategic skipping is valid if you mark it to revisit. Gaps in foundation tend to compound later though." },
            { char:'friend', text:"'Parks for later' is sometimes how it works. Sometimes. Just actually come back to it." },
          ]},
        { id:'c2c', text:"Teach what I know — explaining forces real understanding.", label:'C', icon:'🎤',
          metrics:{ bank:0, happiness:+18, approval:+5 },
          reactions:[
            { char:'mentor', text:"The Feynman technique. You truly understand something only when you can explain it simply. Excellent instinct." },
            { char:'friend', text:"You explained recursion to me for 20 minutes. I don't understand recursion. But I appreciated it." },
          ]},
      ],
      ep3Question: "Six months in. How do you measure your learning?",
      ep3Choices: [
        { id:'c3a', text:"Build something real — apply everything and ship it.", label:'A', icon:'🏆',
          metrics:{ bank:+10000, happiness:+22, approval:+15 },
          outcome:{ summary:"You built something. Not theoretical knowledge — actual, working, real thing. That's the hardest gap to close.", episodeTitle:"The One Where You Actually Built It", ending:'success' },
          reactions:[
            { char:'parent', text:"You made something! A real thing! Show daddy and me properly tonight. We want to see everything 😭🎉" },
            { char:'friend', text:"FROM ZERO TO WORKING THING IN 6 MONTHS. This is genuinely impressive. I'm putting you on my CV as mentor." },
          ]},
        { id:'c3b', text:"Get certified — validate the learning officially.", label:'B', icon:'📜',
          metrics:{ bank:-5000, happiness:+15, approval:+18 },
          outcome:{ summary:"Certified. The paper matters in some contexts, and you also actually know the thing. Best combination.", episodeTitle:"The Validated Learner", ending:'neutral' },
          reactions:[
            { char:'mentor', text:"Certification with actual knowledge is powerful. Don't let the credential become the goal though — it's the by-product." },
          ]},
        { id:'c3c', text:"I'm still learning — it's ongoing and that's okay.", label:'C', icon:'📖',
          metrics:{ bank:0, happiness:+8, approval:+5 },
          outcome:{ summary:"Still in progress. The destination is real. The timeline just extended. That's not failure — that's honesty.", episodeTitle:"The Lifelong Learner", ending:'neutral' },
          reactions:[
            { char:'friend', text:"6 months and the definition of 'done' just keeps moving. That's either the nature of learning or procrastination. Only you know." },
          ]},
      ],
      ep1Scenes: [
        { label: 'The Learning Decision',
          messages: [
            { char: 'narrator', text: 'You\'ve decided to learn something new. The course is bookmarked, the book is ordered, or the mentor DM is sent. The group chat knows. The journey begins.' },
            { char: 'parent',   text: 'Learning is always good beta! Knowledge nobody can take away. Just also make sure it leads somewhere practical. What\'s the end goal with this? 😊' },
          ]},
        { label: 'The Study Crew Reacts',
          messages: [
            { char: 'friend', text: 'Okay studious mode activated 😂 I fully support this. What are you learning? Maybe I can join too. Or at least pretend I will. But maybe actually.' },
            { char: 'system', text: 'Rahul has bookmarked the same course but hasn\'t started' },
          ]},
        { label: 'The Mentor\'s Framework',
          messages: [
            { char: 'mentor', text: 'What\'s the skill gap you\'re closing? Learning without a clear application target is entertainment, not development. What will you be ABLE TO DO that you can\'t do today?' },
          ]},
      ],
      ep2Scenes: [
        { label: 'The Grind Phase',
          messages: [
            { char: 'narrator', text: 'Three months in. The beginner\'s excitement has settled into the real work. The material is getting harder. The consistency is getting tested.' },
            { char: 'friend',   text: 'Are you still going with this or has it quietly disappeared like your gym subscription? Honest answer only. I\'ll roast you either way.' },
          ]},
        { label: 'The Progress Check',
          messages: [
            { char: 'mentor', text: 'Three months in — you should be able to demonstrate something real. Not just state that you\'re learning. Apply it. Show me output.' },
            { char: 'parent', text: 'So much time on this. Eating properly na? Rest is also important. Don\'t just study — take breaks. Your brain needs rest too beta. 🙏' },
          ]},
        { label: 'The Hard Part',
          messages: [
            { char: 'narrator', text: 'The hard section has arrived. The one that separates people who understand from people who merely remember. This is where real learning happens.' },
          ]},
      ],
      ep3Scenes: [
        { label: 'Six Months of Learning',
          messages: [
            { char: 'narrator', text: 'Six months in. The knowledge has accumulated. Whether you fully know what you set out to know — the attempt has made you different from who you were.' },
            { char: 'friend',   text: 'Okay quiz time — teach me one thing from what you\'ve been learning. The most interesting thing. Go.' },
          ]},
        { label: 'The Real Learning',
          messages: [
            { char: 'mentor', text: 'The most important things you learn are rarely the curriculum. What\'s the ONE insight that changed how you think — not what you know, but HOW you think?' },
            { char: 'narrator', text: 'This is the question that reveals whether learning stuck or just passed through.' },
          ]},
        { label: 'Learner\'s Verdict',
          messages: [
            { char: 'system', text: 'Six months. Countless sessions. The verdict is yours to give.' },
          ]},
      ],
    },
    generic: {
      ep1Question: "Day 1. What's your first real move?",
      ep1Choices: [
        { id:'c1a', text:"Go all in immediately — full commitment, no safety net.", label:'A', icon:'🔥',
          metrics:{ bank:-10000, happiness:+16, approval:-10 },
          reactions:[
            { char:'friend', text:"FULLY COMMITTED Day 1 🔥 No half measures. This is the energy. This is the STORY." },
            { char:'parent', text:"No safety net?? Keep emergency money aside. Just a little. For me. Please. 😭" },
          ]},
        { id:'c1b', text:"Start small and test — validate before going all in.", label:'B', icon:'💡',
          metrics:{ bank:-3000, happiness:+5, approval:+10 },
          reactions:[
            { char:'mentor', text:"Small experiments with real feedback loops. This is how sustainable successes actually begin." },
            { char:'friend', text:"'Test and validate' energy. Very sensible honestly." },
          ]},
        { id:'c1c', text:"Build knowledge first — learn before you leap.", label:'C', icon:'🎯',
          metrics:{ bank:-2000, happiness:+10, approval:+15 },
          reactions:[
            { char:'parent', text:"YES. Learn everything properly. Knowledge is the best foundation. I'm less worried now. Slightly. 🙂" },
            { char:'friend', text:"Pre-learning phase. Valid. But at some point you have to DO the thing, not just prepare." },
          ]},
      ],
      ep2Question: "You hit a real obstacle. What do you do?",
      ep2Choices: [
        { id:'c2a', text:"Push through — persistence is the real differentiator.", label:'A', icon:'🔥',
          metrics:{ bank:-5000, happiness:-5, approval:+5 },
          reactions:[
            { char:'friend', text:"Day 90 and still going 💪 Tell me the specific tough part — I want the actual thing, not 'it's hard'." },
            { char:'mentor', text:"Make sure you're pushing through a real obstacle, not stubbornly repeating what isn't working." },
          ]},
        { id:'c2b', text:"Pivot — adapt based on what you've actually learned.", label:'B', icon:'💡',
          metrics:{ bank:-2000, happiness:+10, approval:0 },
          reactions:[
            { char:'mentor', text:"Pivoting based on evidence is intelligence, not weakness. What specifically led to this?" },
            { char:'friend', text:"New direction unlocked. I'm with it. Tell me the updated plan. Full detail." },
          ]},
        { id:'c2c', text:"Ask for help — you can't figure everything out alone.", label:'C', icon:'🎯',
          metrics:{ bank:-3000, happiness:+16, approval:+10 },
          reactions:[
            { char:'mentor', text:"Asking for help early is self-awareness, not weakness. Who specifically can help you here?" },
            { char:'parent', text:"You asked for help! Grown-up thinking! What do you need from us? We're here. 🙏" },
          ]},
      ],
      ep3Question: "Six months in. How do you define success?",
      ep3Choices: [
        { id:'c3a', text:"I achieved what I set out to do. It worked.", label:'A', icon:'🏆',
          metrics:{ bank:+20000, happiness:+20, approval:+16 },
          outcome:{ summary:"You did it. Exactly what you said you would. Not perfectly, not without cost — but you achieved the actual goal.", episodeTitle:"The One Where It Actually Worked", ending:'success' },
          reactions:[
            { char:'parent', text:"We always knew. Even when worried sick — deep down we believed. Proud doesn't cover it. 😭🎉" },
            { char:'friend', text:"CALLED IT. Mandatory celebration this weekend. I'm picking the place." },
          ]},
        { id:'c3b', text:"It's different from what I imagined — but worthwhile.", label:'B', icon:'💡',
          metrics:{ bank:+5000, happiness:+16, approval:+10 },
          outcome:{ summary:"Not what you pictured. But what you found was real and yours. The detour turned out to be the point.", episodeTitle:"The Unexpected Win", ending:'neutral' },
          reactions:[
            { char:'mentor', text:"The journey not matching the plan doesn't make it failure. Most meaningful paths look completely different from the inside." },
          ]},
        { id:'c3c', text:"It didn't work — but I grew through trying.", label:'C', icon:'',
          metrics:{ bank:-10000, happiness:+5, approval:-5 },
          outcome:{ summary:"The outcome wasn't what you hoped for. But you tried. Actually tried. And you're different now.", episodeTitle:"The Beautiful Attempt", ending:'fail' },
          reactions:[
            { char:'friend', text:"You genuinely, fully tried. Most people never do. Round 2 when ready — I'll be your first call." },
            { char:'parent', text:"Proud of you for trying, beta. Never forget that. Trying is everything. 🙏" },
          ]},
      ],
    },
  };
  // Alias topics that share templates
  CUSTOM_TEMPLATES.relationship = CUSTOM_TEMPLATES.generic;
  CUSTOM_TEMPLATES.career       = CUSTOM_TEMPLATES.business;

  function personalizeCustomScenario(scenario, customTitle) {
    const topic = detectTopic(customTitle);
    const tpl = CUSTOM_TEMPLATES[topic] || CUSTOM_TEMPLATES.generic;
    const episodes = scenario.episodes;

    // ── Inject scene messages, question & choices for each episode ──
    [tpl.ep1Scenes, tpl.ep2Scenes, tpl.ep3Scenes].forEach((sceneTpls, epIdx) => {
      const ep = episodes[epIdx];
      if (!ep) return;

      // Replace full scene data if template provides it
      if (sceneTpls) {
        sceneTpls.forEach((sd, scIdx) => {
          if (!ep.scenes[scIdx]) return;
          if (sd.label)    ep.scenes[scIdx].label    = sd.label;
          if (sd.messages) ep.scenes[scIdx].messages = sd.messages;
        });
      }

      // Always inject the narrator's opening line for ep0 scene 0
      if (epIdx === 0 && ep.scenes?.[0]?.messages?.[0]) {
        ep.scenes[0].messages[0].text =
          `You've decided to: "${customTitle}". The group chat has been notified. The journey starts now.`;
      }
    });

    // ── Inject questions & choices ──
    if (episodes[0]) { episodes[0].question = tpl.ep1Question; episodes[0].choices = tpl.ep1Choices; }
    if (episodes[1]) { episodes[1].question = tpl.ep2Question; episodes[1].choices = tpl.ep2Choices; }
    if (episodes[2]) { episodes[2].question = tpl.ep3Question; episodes[2].choices = tpl.ep3Choices; }
  }

  // ── INIT ──────────────────────────────────────────────────────
  function init(scenarioKey, customTitle) {
    const s = SCENARIOS[scenarioKey] || SCENARIOS.custom;
    state.scenario    = JSON.parse(JSON.stringify(s)); // deep clone
    state.episodeIndex = 0;
    state.sceneIndex   = 0;
    state.metrics      = { ...s.initialMetrics };
    state.choicesMade  = [];
    state.lastOutcome  = null;
    state.finalEnding  = null;
    state.customTitle  = customTitle || '';

    if (customTitle && scenarioKey === 'custom') {
      state.scenario.name  = customTitle.substring(0, 30);
      state.scenario.title = customTitle;
      personalizeCustomScenario(state.scenario, customTitle);
    }
  }

  // ── EPISODE & SCENE ACCESS ────────────────────────────────────
  function currentEpisode() {
    return state.scenario?.episodes[state.episodeIndex] || null;
  }
  function currentScene() {
    const ep = currentEpisode();
    return ep?.scenes?.[state.sceneIndex] || null;
  }
  function getSceneCount() {
    return currentEpisode()?.scenes?.length || 0;
  }
  function getSceneDisplayIndex() {
    return state.sceneIndex + 1;
  }
  function hasNextScene() {
    const ep = currentEpisode();
    return ep && state.sceneIndex < (ep.scenes?.length || 0) - 1;
  }
  function advanceScene() {
    if (!hasNextScene()) return false;
    state.sceneIndex++;
    return true;
  }
  function resetScene() {
    state.sceneIndex = 0;
  }
  function hasNextEpisode() {
    const ep = currentEpisode();
    if (!ep || ep.isEndpoint) return false;
    return state.episodeIndex < state.scenario.episodes.length - 1;
  }
  function advanceEpisode() {
    if (!hasNextEpisode()) return false;
    state.episodeIndex++;
    state.sceneIndex = 0;
    return true;
  }

  // ── CHOICE ────────────────────────────────────────────────────
  function resolveChoice(choiceId) {
    const ep = currentEpisode();
    if (!ep) return null;
    const choice = ep.choices.find(c => c.id === choiceId);
    if (!choice) return null;

    state.choicesMade.push(choiceId);
    const metricChanges = applyDelta(choice.metrics || {});

    // Update mem object
    mem.lastChoiceText = choice.text;
    mem.lastChoiceId = choiceId;

    if (choice.outcome) {
      state.lastOutcome  = choice.outcome;
      state.finalEnding  = choice.outcome.ending;
      saveHistory();
    }

    return { choice, metricChanges, isEndpoint: !!choice.outcome };
  }

  // ── OUTCOME ───────────────────────────────────────────────────
  function getOutcome() {
    const ending = state.finalEnding || 'neutral';
    const label  = getEpisodeLabel(ending, state.metrics.happiness, state.metrics.approval);
    return {
      summary:      state.lastOutcome?.summary      || '',
      episodeTitle: state.lastOutcome?.episodeTitle || "Today's Episode",
      ending,
      emoji:        state.scenario?.emoji    || '✨',
      name:         state.customTitle        || state.scenario?.name || 'Your Story',
      label,
      metrics:      { ...state.metrics },
      closingLine:  getClosingLine(state.metrics, ending),
      nextTeaser:   currentEpisode()?.nextTeaser || null
    };
  }


  // ── PUBLIC ────────────────────────────────────────────────────
  return {
    init, currentEpisode, currentScene, getSceneCount, getSceneDisplayIndex,
    hasNextScene, advanceScene, resetScene,
    hasNextEpisode, advanceEpisode,
    resolveChoice, getOutcome,
    formatBank, getMetricPercent,
    getMetrics: () => ({ ...state.metrics }),
    loadHistory
  };
})();

// Expose as global so app.js can access without ES modules
if (typeof window !== 'undefined') window.Engine = Engine;

