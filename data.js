/**
 * data.js — Dost League · Scene-structured scenario data
 */

const CHARACTERS = {
  parent:   { id:'parent',   name:'Amma',       emoji:'👩‍🦱', class:'sender-parent',   role:'parent'   },
  friend:   { id:'friend',   name:'Rahul',      emoji:'🧑‍💻', class:'sender-friend',   role:'friend'   },
  mentor:   { id:'mentor',   name:'Mr. Sharma', emoji:'👨‍💼', class:'sender-mentor',   role:'mentor'   },
  love:     { id:'love',     name:'Priya',      emoji:'👩',  class:'sender-love',     role:'love'     },
  narrator: { id:'narrator', name:'📍 Story',   emoji:'📍', class:'sender-narrator', role:'narrator' },
  system:   { id:'system',   name:'',           emoji:'',   class:'sender-system',   role:'system'   },
  you:      { id:'you',      name:'You',        emoji:'🧑', class:'sender-you',      role:'you'      }
};

const EPISODE_LABELS = {
  success_high: { emoji:'🏆', title:'The Unstoppable One',   sub:'Came, saw, absolutely destroyed it' },
  success:      { emoji:'🎯', title:'The Smart Player',      sub:'Calculated risks, clean wins' },
  neutral_bold: { emoji:'🔥', title:'The Chaos Starter',     sub:'Drama king/queen. Maximum entertainment.' },
  neutral:      { emoji:'⚖️',  title:'The Balanced Soul',    sub:'Not spectacular. But honestly? Valid.' },
  risky:        { emoji:'🎲', title:'The Risky Dreamer',     sub:'Bet everything on a feeling. Iconic.' },
  fail:         { emoji:'💀', title:'The Safe Player',       sub:'Chose comfort. Amma is proud at least.' }
};

function getEpisodeLabel(ending, happiness, approval) {
  if (ending==='success' && happiness>75 && approval>75) return EPISODE_LABELS.success_high;
  if (ending==='success') return EPISODE_LABELS.success;
  if (ending==='fail' && happiness<40)  return EPISODE_LABELS.fail;
  if (ending==='fail')    return EPISODE_LABELS.risky;
  if (approval<35 || happiness>70) return EPISODE_LABELS.neutral_bold;
  return EPISODE_LABELS.neutral;
}

function getClosingLine(metrics, ending) {
  const { approval, happiness, bank } = metrics;
  if (ending==='success' && approval>70) return "🙏 Amma is now your unofficial PR manager at kitty parties.";
  if (ending==='success')                return "✅ The sleep-deprived version of you wouldn't believe this.";
  if (ending==='fail'    && approval>60) return "😌 Amma is relieved. That counts for something.";
  if (ending==='fail')                   return "💀 Your bank app has started sending motivational quotes.";
  if (happiness>80)                      return "✨ For once, Sunday nights don't feel terrifying.";
  if (bank<20000)                        return "📉 Broke but with character. Bills don't accept character though.";
  return "🎭 Life is messy. But at least it's YOUR mess.";
}

const SCENARIOS = {

  // ── STARTUP ─────────────────────────────────────────────────
  startup: {
    id:'startup', emoji:'🚀', name:'Startup Founder', title:'Start a Startup',
    initialMetrics:{ bank:50000, happiness:60, approval:65 },
    episodes:[
      {
        id:'ep1', label:'Day 1', fullLabel:'Day 1 — The Leap',
        nextTeaser:"Month 1 — The grind is real. The doubt is realer. 😤",
        scenes:[
          { id:'sc1', label:'The Family Group Chat', messages:[
            { char:'narrator', text:"You've quit your ₹18 LPA Infosys job. LinkedIn post written. Macbook open. ₹50K in savings. The group chat has been notified. God help you." },
            { char:'system',   text:"Amma added you to 'Family Updates 🙏'" },
            { char:'parent',   text:"Beta I told your father. He hasn't spoken since Tuesday. I've been eating chapati alone. What is happening to this family. 😭" },
            { char:'parent',   text:"Your cousin Rohit just got promoted to Senior Engineer. Just so you know. Not comparing. Just sharing information." },
          ]},
          { id:'sc2', label:'Rahul Has Questions', messages:[
            { char:'system',   text:"Rahul is typing... (has been typing for 4 minutes)" },
            { char:'friend',   text:"Wait. You ACTUALLY quit. Like, not a bit? I need water. Maybe both simultaneously. HOW." },
            { char:'friend',   text:"OKAY I'M BACK. Full hype mode activated. This is unhinged and I am HERE FOR IT 🔥 What's the actual plan though?" },
          ]},
          { id:'sc3', label:'The Mentor Steps In', messages:[
            { char:'mentor',   text:"I've seen 47 people make this move in 20 years. Six made it. All six knew one thing before jumping: their runway. How many months before you're broke?" },
            { char:'system',   text:"Mr. Sharma has left you on read for exactly 47 seconds" },
            { char:'mentor',   text:"Your passion doesn't pay bills. Your execution does. So — what's your first real move?" },
          ]},
        ],
        question:"It's Day 1. What's your first actual move?",
        choices:[
          { id:'c1a', text:"Start building immediately. No overthinking.", label:'A', icon:'🔥',
            metrics:{ bank:-5000, happiness:+12, approval:-8 },
            reactions:[
              { char:'friend', text:"Day 1 and already in founder mode 💀🔥 Send me beta access. Actually make me co-founder. Salary later." },
              { char:'parent', text:"Building what exactly?? You're sitting in my house on your expensive laptop while I make tea. Explain." },
              { char:'mentor', text:"Good energy. But talk to 10 real customers before writing one line of code. Build what they'll pay for, not what you think they need." },
            ]},
          { id:'c1b', text:"Network first — startup events, IIT meetups, find a co-founder.", label:'B', icon:'💡',
            metrics:{ bank:-3000, happiness:+5, approval:0 },
            reactions:[
              { char:'friend', text:"Smart. I know an IIT-B guy building something real — not just LinkedIn-type. Intro?" },
              { char:'parent', text:"At least you're going out. Meeting people. But networking doesn't pay electricity bills, beta." },
              { char:'mentor', text:"Right instinct. A great co-founder doubles your odds. Don't spend months in coffee meetups without actually deciding anything." },
            ]},
          { id:'c1c', text:"Apply to Y Combinator — dream big from Day 1.", label:'C', icon:'🎯',
            metrics:{ bank:-2000, happiness:+18, approval:-12 },
            reactions:[
              { char:'parent', text:"Y Combinator? Is this a YouTube channel? Your cousin just got into ISRO. ISRO. With pension. AND—" },
              { char:'friend', text:"YOOO are you serious 😭 I'm quitting my job too. Wait no. But I SUPPORT YOU. 100%. From here." },
              { char:'mentor', text:"YC acceptance is under 2%. Apply. But fix the product first. Application without traction is just creative writing." },
            ]},
        ]
      },
      {
        id:'ep2', label:'Month 1', fullLabel:'Month 1 — Reality Bites',
        nextTeaser:"Month 6 — The runway is ending. Every hour counts. ⏰",
        scenes:[
          { id:'sc1', label:'Love Check-In', messages:[
            { char:'narrator', text:"One month in. Rough prototype. Zero paying users. ₹15K spent on AWS and 'strategy lunches'. The doubt is louder than the dream right now." },
            { char:'love',     text:"You've worked 14-hour days and missed my birthday dinner. I'm not angry. I just want to know — is this how it's going to be?" },
            { char:'system',   text:"Priya is typing... then stopped. Then typing again." },
            { char:'love',     text:"I'm not asking you to be less ambitious. I'm just asking you to remember I exist." },
          ]},
          { id:'sc2', label:'The Temptation', messages:[
            { char:'friend',   text:"Real talk — my cousin's company is hiring. ₹22 LPA, remote-friendly, actual health insurance. Just... putting it out there. 👀" },
            { char:'system',   text:"Rahul has shared a job listing" },
            { char:'friend',   text:"No pressure. Also full pressure. Also genuinely whatever you decide I'm with you. But that salary though." },
          ]},
          { id:'sc3', label:'Sharma Demands Numbers', messages:[
            { char:'mentor',   text:"One month review. I want numbers — user count, customer conversations, revenue pipeline. Not feelings. Numbers." },
            { char:'mentor',   text:"Stop pitching the dream version. Tell me the real version. What does your current traction actually look like?" },
          ]},
        ],
        question:"The pressure is real. How do you respond?",
        choices:[
          { id:'c2a', text:"Double down — 16-hour days, launch beta this week.", label:'A', icon:'🔥',
            metrics:{ bank:-8000, happiness:-8, approval:-5 },
            reactions:[
              { char:'love',   text:"Okay... text me goodnight sometimes. That's literally all I'm asking. 🥺" },
              { char:'friend', text:"I saw your last selfie. You look like a raccoon who forgot sleep exists. Showering is still required in startups." },
              { char:'parent', text:"Your dark circles have dark circles. I sent 3 tiffins this week. Zero eaten. At least eat the thepla. 😭" },
            ]},
          { id:'c2b', text:"Step back — talk to users, pivot if data says so.", label:'B', icon:'💡',
            metrics:{ bank:-4000, happiness:+12, approval:+5 },
            reactions:[
              { char:'mentor', text:"THAT is how smart founders think. What did users say? That data is worth more than any pitch deck." },
              { char:'friend', text:"Look at you doing ACTUAL founder things and not just posting 'Day 1 of my startup journey 🚀' every morning 😂" },
              { char:'love',   text:"You took Sunday off. I'm making chai right now. Be ready in 20 minutes. Non-negotiable." },
            ]},
          { id:'c2c', text:"Chase early funding — investors solve everything, right?", label:'C', icon:'🎯',
            metrics:{ bank:+20000, happiness:+8, approval:+12 },
            reactions:[
              { char:'parent', text:"Someone gave you real money?? Okay beta... maybe this isn't completely insane. I'll stop telling people you quit. Maybe." },
              { char:'mentor', text:"Good, but now you have investors to answer to. Spend carefully. Runway is everything at this stage." },
              { char:'friend', text:"WE'RE FUNDED?? Wait — YOU'RE funded. Practically same thing though right? First advisor, yes?" },
            ]},
        ]
      },
      {
        id:'ep3', label:'Month 6', fullLabel:'Month 6 — Make or Break',
        isEndpoint:true,
        scenes:[
          { id:'sc1', label:'Six Months In', messages:[
            { char:'narrator', text:"Six months. 200 users. Two-person team. Bank dangerously thin. Amma has started lighting extra diyas. The clock is ticking loudly." },
            { char:'system',   text:"Amma changed group name to 'Beta Please 😭'" },
            { char:'parent',   text:"I told your father everything is going amazingly. Please don't make me a liar. I really told him. In detail. 😬" },
          ]},
          { id:'sc2', label:'Everyone Weighs In', messages:[
            { char:'friend',   text:"Serious mode now — you need to decide. Raise big or charge users. Middle path at this stage is slow death. You know this." },
            { char:'mentor',   text:"Three months of runway. That's it. Every real founder faces this moment. What's your call?" },
          ]},
          { id:'sc3', label:'The Final Moment', messages:[
            { char:'system',   text:"The group has gone quiet. Everyone is waiting." },
            { char:'narrator', text:"This is it. The decision that defines the next chapter. No more runway to delay. Choose." },
          ]},
        ],
        question:"Make or break. What's the call?",
        choices:[
          { id:'c3a', text:"Raise a big round — pitch VCs, go all in.", label:'A', icon:'🔥',
            metrics:{ bank:+500000, happiness:+15, approval:+15 },
            outcome:{ summary:"You raised ₹2 Crore. Against Amma's tears, against every 'job security' WhatsApp forward — you raised actual funding. The real journey starts now.", episodeTitle:"The One Where You Actually Did It", ending:'success' },
            reactions:[
              { char:'friend', text:"LMAOOOO we're doing this 🔥 I'm putting 'Early Advisor' on my LinkedIn RIGHT NOW. Don't stop me." },
              { char:'parent', text:"Two crore rupees... I'm calling Sunita aunty at 10 PM. She NEEDS to know. 😭🎉" },
            ]},
          { id:'c3b', text:"Focus on revenue — charge users, become profitable.", label:'B', icon:'💡',
            metrics:{ bank:+30000, happiness:+22, approval:+10 },
            outcome:{ summary:"No flashy funding round. No unicorn headline. Just a real, profitable business with paying customers. That's actually rarer than you'd think.", episodeTitle:"The One Where You Kept It Real", ending:'neutral' },
            reactions:[
              { char:'mentor', text:"Bootstrapped profitability at month 6. I've seen funded startups with 10x your resources crash. This is genuinely impressive." },
              { char:'love',   text:"You made it work AND you're happy. Dinner is absolutely on you. I'm picking the restaurant 😊" },
            ]},
          { id:'c3c', text:"Shut it down — take that ₹22 LPA job offer.", label:'C', icon:'🎯',
            metrics:{ bank:+22000, happiness:-18, approval:+32 },
            outcome:{ summary:"You shut it down after 6 months. Amma stopped stress-eating. You're back in corporate with a story only founders understand.", episodeTitle:"The One Where You Chose Peace", ending:'fail' },
            reactions:[
              { char:'parent', text:"FINALLY. Fixed salary. PF. Mediclaim. Come home, I'm making rasam AND payasam. Both. 😭🙏" },
              { char:'friend', text:"You learned more in 6 months than 3 years of corporate. Round 2 someday? I'll be co-founder. For real this time." },
            ]},
        ],
        outcomes:{ success:"You raised funding and built a real company. Amma introduces you as 'Startup CEO' at kitty parties.", neutral:"Profitable and real. No unicorn headline — just a business that works. Turns out that's the hardest thing to build.", fail:"Six months. Full experience. The next idea already lives somewhere in the back of your head." }
      }
    ]
  },

  // ── UPSC ────────────────────────────────────────────────────
  upsc: {
    id:'upsc', emoji:'📚', name:'UPSC Aspirant', title:'Crack UPSC',
    initialMetrics:{ bank:30000, happiness:55, approval:80 },
    episodes:[
      {
        id:'ep1', label:'Day 1', fullLabel:'Day 1 — The Decision',
        nextTeaser:"Month 3 — The social life is gone. Is the dream still alive? 📚",
        scenes:[
          { id:'sc1', label:'The Colony Knows', messages:[
            { char:'narrator', text:"You've decided to prepare for UPSC. Coaching fees paid: ₹1.2L (no refund). Study schedule laminated. Parents quietly crying tears of pride. 6 lakh competitors completely unaware of you." },
            { char:'parent',   text:"My child. IAS officer. I've told the entire colony. Sharma uncle, Gupta aunty, the vegetable wala — everyone. Don't embarrass me now. Just study. 🙏" },
            { char:'system',   text:"Your mother has joined 3 'UPSC Parent Support' WhatsApp groups" },
          ]},
          { id:'sc2', label:"Friend's Math", messages:[
            { char:'friend',   text:"Bhai UPSC? Do you know the success rate is literally 0.2%? That's 2 per 1000. I'm just being honest. But also you're not most people. So. Go for it?" },
            { char:'system',   text:"Rahul sent a meme about UPSC. Then unsent it. Then sent it again." },
            { char:'friend',   text:"Okay I Googled it. You have 6 attempts. That's actually... fine. We're fine. YOU'RE fine." },
          ]},
          { id:'sc3', label:'The Real Question', messages:[
            { char:'mentor',   text:"UPSC is not just an exam. It's a mindset shift. Before strategy — tell me honestly: why do you want to be an IAS officer? Not the interview answer. The real one." },
            { char:'mentor',   text:"The people who last through multi-year prep are the ones with a real answer to that question. Think about it before you move forward." },
          ]},
        ],
        question:"Day 1. How do you actually start?",
        choices:[
          { id:'c1a', text:"NCERT grind from Class 6 — the foundational approach.", label:'A', icon:'💡',
            metrics:{ bank:-2000, happiness:+5, approval:+10 },
            reactions:[
              { char:'friend', text:"A grown adult reading Class 6 Geography with full sincerity 😭 But apparently THE move. Respect." },
              { char:'mentor', text:"Good foundation. Don't rush — understand concepts. Slow is smooth, smooth is fast. This phase sets everything." },
              { char:'parent', text:"So dedicated! Maid won't enter your room before 11 AM. Papa is getting special ghee. Study well. 😊" },
            ]},
          { id:'c1b', text:"Jump into mock tests — get humbled early, learn fast.", label:'B', icon:'🔥',
            metrics:{ bank:-4000, happiness:-5, approval:+5 },
            reactions:[
              { char:'mentor', text:"Test series without foundation is running before walking. You'll find gaps — but early humbling can demoralize. Proceed carefully." },
              { char:'friend', text:"34/100 on Day 1 and he called it 'baseline measurement'. Peak scientist energy honestly." },
            ]},
          { id:'c1c', text:"Start with Optional subject — Economics is your stronghold.", label:'C', icon:'🎯',
            metrics:{ bank:-1500, happiness:+10, approval:0 },
            reactions:[
              { char:'mentor', text:"Smart to play to your strengths. Optional can differentiate you in mains. But GS is where the real battle is." },
              { char:'parent', text:"Why economics? Can you also do history? Your uncle says history questions come every year. Don't ignore it." },
            ]},
        ]
      },
      {
        id:'ep2', label:'Month 3', fullLabel:'Month 3 — The Marathon',
        nextTeaser:"Exam Day — Everything you've prepared for. One morning. 🎓",
        scenes:[
          { id:'sc1', label:'The Disappearing Act', messages:[
            { char:'narrator', text:"Three months. NCERTs done. Coaching started. The Hindu read daily — all 28 pages. You've officially disappeared from every social circle." },
            { char:'friend',   text:"Yaar you have GHOSTED all of us. Goa trip — no. IPL final watch party — no. Are you even alive or just a UPSC bot?" },
            { char:'system',   text:"You've been removed from 'Goa 2026? 🏖️' group" },
          ]},
          { id:'sc2', label:'Parent Comparison Mode', messages:[
            { char:'parent',   text:"Are you eating? You look thin. Also Sunita aunty's son scored 95 percentile in his first mock. Just sharing. Not comparing. 😬" },
            { char:'parent',   text:"Come home for one weekend? You can study here also. I'll make your favourite food. Just one weekend." },
          ]},
          { id:'sc3', label:'Mentor Check-In', messages:[
            { char:'mentor',   text:"Quarter check. You should have: finished all NCERTs, covered one full GS paper, built a daily newspaper habit. Where are you? Actual numbers." },
            { char:'mentor',   text:"Burnout is real. Your mental health IS your preparation. Tell me honestly how you're doing." },
          ]},
        ],
        question:"The grind is hitting. How do you balance it?",
        choices:[
          { id:'c2a', text:"Full sacrifice — no social life, only UPSC.", label:'A', icon:'🔥',
            metrics:{ bank:0, happiness:-18, approval:+18 },
            reactions:[
              { char:'friend', text:"I respect it. But can you acknowledge my memes once a week? Just a thumbs up. I miss you man. 😔" },
              { char:'mentor', text:"Discipline matters. But burnout is a real threat. Your mental health IS preparation. Don't destroy yourself — that's not noble, it's risky." },
            ]},
          { id:'c2b', text:"Structured schedule with small breaks — sustainable prep.", label:'B', icon:'💡',
            metrics:{ bank:-500, happiness:+12, approval:+5 },
            reactions:[
              { char:'mentor', text:"This is the correct approach. Most toppers say balance kept them sane through multi-year prep. This is a marathon." },
              { char:'friend', text:"YOU CAME FOR CHAI! I thought you'd gone full monk mode. So good to know you still exist 😂" },
            ]},
          { id:'c2c', text:"Take a full weekend off — Goa trip, recharge completely.", label:'C', icon:'🎯',
            metrics:{ bank:-2500, happiness:+22, approval:-12 },
            reactions:[
              { char:'parent', text:"Beach trip?? Exam is in HOW MANY MONTHS. Sunita aunty's son studies on Diwali. DIWALI." },
              { char:'friend', text:"YESSSS YOU'RE BACK 🎉 Nobody will mention UPSC the entire trip. Mostly. Probably." },
            ]},
        ]
      },
      {
        id:'ep3', label:'Exam Day', fullLabel:'Exam Day — The Reckoning',
        isEndpoint:true,
        scenes:[
          { id:'sc1', label:'Exam Morning', messages:[
            { char:'narrator', text:"Prelims day. Cold exam hall at 7:45 AM. Six lakh hopefuls with the same dream. Previous years' papers flashing through your head. This is it." },
            { char:'parent',   text:"I lit diyas at two temples this morning. Just to cover all bases. You WILL do well. Call me the second it's done. 🙏" },
          ]},
          { id:'sc2', label:'Last Messages', messages:[
            { char:'friend',   text:"No jokes right now. You've put in the work. I've seen it. Just go do your thing. Chai is ready when you come out. 🤞" },
            { char:'love',     text:"Don't overthink. Close your eyes 10 seconds before you start. Breathe. You know this. 💙" },
          ]},
          { id:'sc3', label:'The Moment of Truth', messages:[
            { char:'system',   text:"100 questions. 2 hours. Negative marking for wrong answers." },
            { char:'narrator', text:"Everything you've prepared for comes down to this hall, this paper, this morning. How do you play it?" },
          ]},
        ],
        question:"2 hours. 100 questions. Your strategy?",
        choices:[
          { id:'c3a', text:"Attempt all — trust the prep, maximize attempts.", label:'A', icon:'🔥',
            metrics:{ bank:0, happiness:+12, approval:+22 },
            outcome:{ summary:"You attempted everything. Confident and thorough. Negative marking stung in places — but breadth of prep showed. Results in 3 months. Cautiously optimistic.", episodeTitle:"The All-In Attempt", ending:'success' },
            reactions:[
              { char:'parent', text:"HOW WAS IT?! Tell me EVERYTHING. I've made khichdi, raita, two types of pickle. You talk, I feed. 😭" },
              { char:'mentor', text:"Attempting all with confidence means thorough prep. Now — start mains prep from tomorrow regardless of result." },
            ]},
          { id:'c3b', text:"Play safe — only confident answers, avoid negative marking.", label:'B', icon:'💡',
            metrics:{ bank:0, happiness:+8, approval:+12 },
            outcome:{ summary:"Fewer attempts, higher accuracy. Often the smarter UPSC strategy. You walked out calm. That's already rare.", episodeTitle:"The Calculated Move", ending:'neutral' },
            reactions:[
              { char:'mentor', text:"In UPSC prelims, accuracy beats raw attempt count. If your accuracy was high, results will reflect that." },
              { char:'friend', text:"You came out looking like you finished a crossword. Teach me this energy 😂" },
            ]},
          { id:'c3c', text:"Anxiety hit hard — you froze, limited attempts made.", label:'C', icon:'',
            metrics:{ bank:0, happiness:-22, approval:-10 },
            outcome:{ summary:"Exam anxiety won this round. It happens to the best. You still attempted more than you think. Two attempts remain. This is data, not defeat.", episodeTitle:"The Human Moment", ending:'fail' },
            reactions:[
              { char:'love',   text:"Come here. You showed up. That already takes courage most people don't have. Filter coffee, no UPSC talk, right now." },
              { char:'mentor', text:"Exam anxiety is very real and very fixable. Before next attempt, we work on this specifically. Today is not a verdict." },
            ]},
        ],
        outcomes:{ success:"You went all in and gave it everything. The UPSC journey has many rounds, and you're in it for all of them.", neutral:"Precise, calm, strategic. Your result will reflect that maturity. You played well.", fail:"Not the day you wanted. You've identified what to fix — and you have attempts left. Every topper has a very hard day they didn't give up on." }
      }
    ]
  },

  // ── BANGALORE ───────────────────────────────────────────────
  bangalore: {
    id:'bangalore', emoji:'🏙️', name:'Bangalore Migrant', title:'Move to Bangalore',
    initialMetrics:{ bank:40000, happiness:70, approval:50 },
    episodes:[
      {
        id:'ep1', label:'Week 1', fullLabel:'Week 1 — The Landing',
        nextTeaser:"Month 2 — The city is changing you. In ways you didn't expect. 🏙️",
        scenes:[
          { id:'sc1', label:'Touchdown', messages:[
            { char:'narrator', text:"You've arrived. ₹15 LPA job, two suitcases, one duffel bag, Google Maps to Koramangala. The city doesn't care about your dreams — it's already 9 AM and the auto refused to come." },
            { char:'parent',   text:"Call me EVERY NIGHT. I've packed 3 months of pickle and MTR mix. Don't trust strangers. Trust your flatmates. Actually don't. Actually use judgment. 😭" },
          ]},
          { id:'sc2', label:'Friend Intel', messages:[
            { char:'friend',   text:"DUDE YOU'RE IN BANGS! I know people — Tarun from our college? Nerd mode off now apparently. Also Namma Metro is actually great, don't pay auto prices." },
            { char:'system',   text:"Rahul has sent you a 47-message survival guide for Bangalore" },
            { char:'friend',   text:"Rule #1: Never trust Google Maps ETA during Silk Board hours. Rule #2: Your first Udupi find is sacred. Never betray it." },
          ]},
          { id:'sc3', label:'Mentor Briefing', messages:[
            { char:'mentor',   text:"First month will feel overwhelming — that's normal. Focus on exactly three things: housing, commute route, team dynamics. In that order. Everything else can wait." },
          ]},
        ],
        question:"First week. Where do you live?",
        choices:[
          { id:'c1a', text:"PG near office — cheap, practical, figure the rest later.", label:'A', icon:'💡',
            metrics:{ bank:-8000, happiness:-5, approval:0 },
            reactions:[
              { char:'friend', text:"PG LIFE 😂 Curfew at 10PM. Shared bathroom. Suspicious Wi-Fi password. A true rite of passage. Embrace it." },
              { char:'parent', text:"PG? Who are these people? Are they decent? Lock your room. Actually lock it. Call me when you've locked it." },
            ]},
          { id:'c1b', text:"Flat with flatmates in Indiranagar — more rent, more freedom.", label:'B', icon:'🔥',
            metrics:{ bank:-18000, happiness:+16, approval:-5 },
            reactions:[
              { char:'friend', text:"INDIRANAGAR?? Okay fancy. Weekend plans unlocked. I'm visiting next month. Already planning." },
              { char:'parent', text:"So MUCH rent. That's three months of vegetables back home. Who are these flatmates? Responsible people?" },
            ]},
          { id:'c1c', text:"Company guesthouse — use the time to actually explore.", label:'C', icon:'🎯',
            metrics:{ bank:-5000, happiness:+5, approval:+5 },
            reactions:[
              { char:'mentor', text:"Smart. Use these weeks to visit neighbourhoods, talk to colleagues, understand real commute vs Google Maps reality." },
              { char:'friend', text:"Free decent wifi and edible food. No awkward flatmate introductions. Tactically very sound." },
            ]},
        ]
      },
      {
        id:'ep2', label:'Month 2', fullLabel:'Month 2 — Going Native',
        nextTeaser:"Month 6 — Real decisions. Real consequences. No more adjusting. 🎯",
        scenes:[
          { id:'sc1', label:'Distance Problems', messages:[
            { char:'narrator', text:"Two months. Metro map memorized. Udupi restaurant loyalty established. You've started complaining about Silk Board traffic. But the distance is feeling very real." },
            { char:'love',     text:"Long distance is getting hard. Like actually hard. You're barely picking up calls. Is Bangalore eating you alive or are you just... comfortable over there?" },
            { char:'system',   text:"Priya last seen 3 hours ago" },
          ]},
          { id:'sc2', label:'Identity Shift', messages:[
            { char:'friend',   text:"Bhai you sound different on calls. More 'professional'. Less fun. You said 'synergy' unironically last week. I've been worried since." },
            { char:'mentor',   text:"Your manager says you're settling technically. But you're not speaking up in team meetings. You have ideas. Why are you holding back?" },
          ]},
          { id:'sc3', label:'The Crossroads', messages:[
            { char:'narrator', text:"Distance is a slow leak. Work is all-consuming. Identity is shifting. Something needs to give." },
          ]},
        ],
        question:"Distance and new pressures. How do you handle it?",
        choices:[
          { id:'c2a', text:"Fly home for the weekend — people need you.", label:'A', icon:'🎯',
            metrics:{ bank:-8000, happiness:+20, approval:+16 },
            reactions:[
              { char:'parent', text:"YOU'RE COMING?! Dal makhani, your favourite sabzi, the sweet from that shop. You're NOT leaving before Sunday evening. Non-negotiable. 😭" },
              { char:'love',   text:"You actually came. I wasn't expecting it. Okay — all missed calls forgiven. Let's just sit here for a while." },
            ]},
          { id:'c2b', text:"Stay focused on work — relationships can handle patience.", label:'B', icon:'💡',
            metrics:{ bank:+5000, happiness:-8, approval:-12 },
            reactions:[
              { char:'love',   text:"I understand. But there's a difference between being patient and feeling invisible. Don't let too much time pass. Please." },
              { char:'mentor', text:"Career focus early is smart. But relationships need minimum maintenance. Neglect isn't the same as busy." },
            ]},
          { id:'c2c', text:"Invite them to Bangalore — show them your world.", label:'C', icon:'🔥',
            metrics:{ bank:-5000, happiness:+26, approval:+12 },
            reactions:[
              { char:'parent', text:"You're calling us to Bangalore?? On the PLANE?? Let me check which sarees to pack. Also I need to prepare food to bring. What do your neighbours like?" },
              { char:'love',   text:"You're bringing me into your city. Showing me your actual life. That's surprisingly thoughtful. I'm already packing. Don't say 'pack light'." },
            ]},
        ]
      },
      {
        id:'ep3', label:'Month 6', fullLabel:'Month 6 — This Is Home Now',
        isEndpoint:true,
        scenes:[
          { id:'sc1', label:'Six Month Status', messages:[
            { char:'narrator', text:"Six months. Favourite tapri. Gym membership used twice a week. You've said 'namma metro' without irony. Bangalore has stopped feeling like a city you landed in." },
            { char:'mentor',   text:"High-visibility project on the table. 60-hour weeks for next quarter. Significant career move that could define your next two years." },
          ]},
          { id:'sc2', label:'Converging Decisions', messages:[
            { char:'friend',   text:"My company has an opening in Bangalore. Same role, 20% hike. Should I also move? We could actually be in the same city again." },
            { char:'parent',   text:"Beta, cousin's wedding in December. You WILL be there minimum 10 days. Amma has already booked your flight. Not a discussion. 😤" },
          ]},
          { id:'sc3', label:'One Decision', messages:[
            { char:'system',   text:"Everything is converging at once. You can't choose all three." },
            { char:'narrator', text:"The project. The friend. The family. All asking for the same time. What do you choose?" },
          ]},
        ],
        question:"Everything is converging at once. What do you prioritize?",
        choices:[
          { id:'c3a', text:"Take the high-visibility project — career acceleration now.", label:'A', icon:'🔥',
            metrics:{ bank:+40000, happiness:+10, approval:-5 },
            outcome:{ summary:"You took the project, delivered brilliantly, and got the kind of review people screenshot and send to parents. Bangalore is officially home.", episodeTitle:"The Career Move That Paid Off", ending:'success' },
            reactions:[
              { char:'mentor', text:"Visibility from this project is worth months of regular work. Own every meeting. Be the person who moves things forward." },
              { char:'parent', text:"We understand beta. Career is important. Just come for the wedding. We can negotiate on 10 days. Maybe 7. We'll discuss." },
            ]},
          { id:'c3b', text:"Help Rahul relocate — build your support system.", label:'B', icon:'💡',
            metrics:{ bank:-3000, happiness:+30, approval:+5 },
            outcome:{ summary:"Your best friend moved to Bangalore. Sunday biryani is a standing plan. You have your people, your city, a career growing steadily.", episodeTitle:"The One Where You Chose People", ending:'neutral' },
            reactions:[
              { char:'friend', text:"BHAI I GOT THE JOB 🎉 Moving next month. Sunday biryani. Every. Single. Week." },
              { char:'mentor', text:"Career has many opportunity windows. Having genuine friends in a new city? That's rarer than people admit." },
            ]},
          { id:'c3c', text:"Go home for the wedding — some things can't wait.", label:'C', icon:'🎯',
            metrics:{ bank:-10000, happiness:+20, approval:+26 },
            outcome:{ summary:"You went home for ten days. Danced at the wedding, ate Amma's cooking, had conversations no video call can replicate. Bangalore waited. These moments didn't.", episodeTitle:"The One Where Home Won", ending:'neutral' },
            reactions:[
              { char:'parent', text:"You came! ACTUALLY came! Your grandfather has been asking about you every day. Every. Day. 😭" },
              { char:'love',   text:"Two weeks together after months apart. I have plans for every evening. No excuses accepted." },
            ]},
        ],
        outcomes:{ success:"Bangalore tested you hard and you found your stride. Amma still calls every night. Some things don't change.", neutral:"Career steady, city conquered, anchors built. The grind is real but so is the life around it.", fail:"You realized Bangalore is a chapter. A very good, formative chapter you'll tell stories about." }
      }
    ]
  },

  // ── MARRIAGE ────────────────────────────────────────────────
  marriage: {
    id:'marriage', emoji:'💍', name:'Love vs Arranged', title:'The Big Decision',
    initialMetrics:{ bank:35000, happiness:75, approval:55 },
    episodes:[
      {
        id:'ep1', label:'The Conversation', fullLabel:'The Conversation — It Begins',
        nextTeaser:"The Reckoning — The family drama peaks. Something has to give. 💔",
        scenes:[
          { id:'sc1', label:'Profile Alert', messages:[
            { char:'narrator', text:"You're 27. Three-year relationship. Parents just started the Profile Browsing Phase™. The awkward family dinner happened. Everyone has opinions. Welcome to Indian adulting." },
            { char:'parent',   text:"Beta we're not forcing you. Just one profile. Suresh uncle's daughter — well-settled, same community, lovely family. Just coffee. That's ALL we're saying. 😇" },
            { char:'system',   text:"Your parents have joined 'Shaadi Planning 2026 🙏' group" },
          ]},
          { id:'sc2', label:"Partner's Question", messages:[
            { char:'love',     text:"They showed you profiles today didn't they. I could tell from how long you took to reply. What are you actually thinking? About us?" },
            { char:'system',   text:"Priya is typing... then stopped. Then typing again." },
            { char:'love',     text:"I'm not asking for a speech. Just — am I a priority, or am I a complication you're trying to manage?" },
          ]},
          { id:'sc3', label:"Friend's Take", messages:[
            { char:'friend',   text:"And so begins the classic Indian 'love vs arranged' chapter 😂 Okay jokes aside — what does your GUT actually say? Before your brain overthinks it?" },
            { char:'mentor',   text:"Whatever you decide — decide for yourself. Not for the noise. You're 27 and everyone has opinions. But you're the one who lives with the choice." },
          ]},
        ],
        question:"The pressure is building. What do you do?",
        choices:[
          { id:'c1a', text:"Tell your parents about the relationship — they need to know.", label:'A', icon:'🔥',
            metrics:{ bank:0, happiness:-12, approval:-22 },
            reactions:[
              { char:'parent', text:"THREE YEARS. You hid this THREE YEARS. In MY house. While I was cooking your food. While I was PRAYING FOR YOU. Beta WHY 😭😭" },
              { char:'friend', text:"That took actual courage. Uncomfortable, real courage. Hard part isn't over — but no more pretending. That's already progress." },
              { char:'love',   text:"You told them. You actually told them. I didn't believe you would. I hate that I doubted you. Thank you." },
            ]},
          { id:'c1b', text:"Agree to meet the profile — keep the peace for now.", label:'B', icon:'🎯',
            metrics:{ bank:0, happiness:-16, approval:+16 },
            reactions:[
              { char:'love',   text:"You agreed to meet someone. While we're still together. I need you to explain to me exactly what's happening. Call. Not text." },
              { char:'parent', text:"She's lovely! Just open mind. Nothing else. No pressure at all. 😊" },
              { char:'friend', text:"This is going to get messy very fast. You need to make an actual decision before it gets more complicated." },
            ]},
          { id:'c1c', text:"Ask for more time — you're not ready for this conversation.", label:'C', icon:'💡',
            metrics:{ bank:0, happiness:-5, approval:0 },
            reactions:[
              { char:'parent', text:"Time? You're TWENTY-SEVEN. Just think seriously. We're not asking marriage tomorrow. Just seriousness." },
              { char:'mentor', text:"Taking time is fine — if you use it to decide, not just to delay discomfort. What will you do differently next month?" },
            ]},
        ]
      },
      {
        id:'ep2', label:'The Reckoning', fullLabel:'The Reckoning — The Choice',
        nextTeaser:"6 Months Later — Living with your choice. The real verdict. ⚖️",
        scenes:[
          { id:'sc1', label:'Everyone Weighs In', messages:[
            { char:'narrator', text:"Weeks of heavy conversations. Some brutal. Some tender. Some at 2 AM you wish you'd recorded. The actual decision can't be delayed any further." },
            { char:'friend',   text:"Forget everyone's opinion. Mine included. For one minute — what does YOUR gut want? Not what makes sense. What do you actually want?" },
          ]},
          { id:'sc2', label:'The Heart Question', messages:[
            { char:'parent',   text:"Beta we want your happiness. We genuinely do. But we've lived 30 more years. We've seen things. Just hear us out once." },
            { char:'love',     text:"I love you. That hasn't changed. But I need to know — am I a priority in your life or a complication you're managing? Be honest." },
            { char:'system',   text:"The group chat is quiet. Everyone is waiting." },
          ]},
          { id:'sc3', label:'The Decision', messages:[
            { char:'narrator', text:"No more time. No more delay. This is the moment the story turns. What do you choose?" },
          ]},
        ],
        question:"What does your heart decide?",
        choices:[
          { id:'c2a', text:"Choose your relationship — you're willing to fight for it.", label:'A', icon:'🔥',
            metrics:{ bank:0, happiness:+22, approval:-26 },
            reactions:[
              { char:'love',   text:"You chose us. I'm trying not to cry. I wasn't sure you would. I love you so much. 💙" },
              { char:'parent', text:"We're upset. We need time. But you are our child and that doesn't change. Come home this weekend. We'll talk properly." },
              { char:'friend', text:"Most grown-up terrifying thing I've ever watched you do. You okay? I'm ordering biryani either way." },
            ]},
          { id:'c2b', text:"Consider the arranged match — explore with honesty.", label:'B', icon:'💡',
            metrics:{ bank:0, happiness:-10, approval:+26 },
            reactions:[
              { char:'parent', text:"Beta... thank you for trusting us. We'll listen at every step. This isn't an order. We're in it together. 🙏" },
              { char:'love',   text:"I understand why. I think I even respect it. But I want you to know — this is goodbye for us. I hope you find what you're looking for." },
            ]},
          { id:'c2c', text:"Pause everything — figure yourself out first.", label:'C', icon:'🎯',
            metrics:{ bank:0, happiness:+6, approval:-5 },
            reactions:[
              { char:'friend', text:"OKAY. Unexpected but respectable. You need to know yourself before choosing someone else. Actually mature." },
              { char:'parent', text:"Stop running from everything. But... we hear you. Take a month. Come home. We'll talk properly." },
            ]},
        ]
      },
      {
        id:'ep3', label:'6 Months Later', fullLabel:'6 Months Later — The Verdict',
        isEndpoint:true,
        scenes:[
          { id:'sc1', label:'Six Months On', messages:[
            { char:'narrator', text:"Six months. Whatever path you chose, you've lived with it. Quietly, sometimes loudly, always honestly. The only question now: was it right for you?" },
            { char:'friend',   text:"Not asking about them or family drama. Just you. Personally. How are you actually doing right now?" },
          ]},
          { id:'sc2', label:'Final Check', messages:[
            { char:'parent',   text:"We see you trying. That's all we've ever wanted. Whatever it looks like — we're here. We're always here." },
            { char:'narrator', text:"The answer you give right now is the truest one you've given in six months." },
          ]},
          { id:'sc3', label:'The Honest Answer', messages:[
            { char:'system',   text:"Time to be honest. With yourself more than anyone else." },
          ]},
        ],
        question:"Six months later — what's your honest answer?",
        choices:[
          { id:'c3a', text:"I found my answer. I'm at peace with this.", label:'A', icon:'✨',
            metrics:{ bank:0, happiness:+26, approval:+10 },
            outcome:{ summary:"You made the decision that was right for you — not the easiest one. Not the one that made everyone happy. The right one. At 27, that's more than most people manage.", episodeTitle:"The One Where You Found Peace", ending:'success' },
            reactions:[
              { char:'friend', text:"You look lighter. Like something you were carrying is just... gone. Whatever you decided — you made it yours. That's rare." },
              { char:'parent', text:"We see you smiling. Really smiling. That's enough for us. More than enough." },
            ]},
          { id:'c3b', text:"It's messy and complicated. Isn't that just life?", label:'B', icon:'⚖️',
            metrics:{ bank:0, happiness:+10, approval:+5 },
            outcome:{ summary:"No grand resolution. Just quieter growth and more honest conversations. None of it is a clean equation. But you're still asking the right questions.", episodeTitle:"The Ongoing Episode", ending:'neutral' },
            reactions:[
              { char:'mentor', text:"The people who think life resolves cleanly have never really lived it. You're in good company." },
            ]},
          { id:'c3c', text:"I made a mistake. I'm slowly figuring out how to fix it.", label:'C', icon:'',
            metrics:{ bank:0, happiness:-5, approval:-5 },
            outcome:{ summary:"You were brave enough to admit you got it wrong. The next decision will come from a clearer, more honest place. That matters more than being right.", episodeTitle:"The Honest Admission", ending:'neutral' },
            reactions:[
              { char:'friend', text:"Saying 'I got it wrong' out loud is one of the hardest things a person can do. Most people just live silently with it. You didn't." },
              { char:'parent', text:"Beta come home. Whatever it is — we figure it out together. That's what family means." },
            ]},
        ],
        outcomes:{ success:"You found your answer in the middle of all that noise. Honest, costly, yours.", neutral:"Life's biggest choices rarely end cleanly. But you showed up, stayed honest, kept going.", fail:"You realized the choice wasn't right — and that realization is its own progress." }
      }
    ]
  },

  // ── CUSTOM ──────────────────────────────────────────────────
  custom: {
    id:'custom', emoji:'✨', name:'Your Story', title:'Custom Journey',
    initialMetrics:{ bank:45000, happiness:65, approval:65 },
    episodes:[
      {
        id:'ep1', label:'Day 1', fullLabel:'Day 1 — The Beginning',
        nextTeaser:"Month 3 — The real test begins. Can you handle what comes next? 🎯",
        scenes:[
          { id:'sc1', label:'The Decision Is Made', messages:[
            { char:'narrator', text:"You've made a bold decision. Nobody fully understands it yet — including you. The group chat has been notified. The journey is now officially, irreversibly, starting." },
            { char:'parent',   text:"Beta... 100% sure? Because once you start, finishing is the only acceptable option. I support you. But — are you sure? 😬" },
          ]},
          { id:'sc2', label:'Support System Activates', messages:[
            { char:'friend',   text:"I don't fully get the plan but you seem confident and that energy is contagious. What do you need from me? Co-founder? Hype person? Free tester? I'm available." },
            { char:'system',   text:"Rahul has already told 5 people about your plan" },
          ]},
          { id:'sc3', label:'Reality Check', messages:[
            { char:'mentor',   text:"Tell me the actual goal. Not the dream version. Not the LinkedIn version. The real, measurable goal. What does success actually look like?" },
          ]},
        ],
        question:"Day 1. What's your first move?",
        choices:[
          { id:'c1a', text:"Go all in immediately — full commitment, no safety net.", label:'A', icon:'🔥',
            metrics:{ bank:-10000, happiness:+16, approval:-10 },
            reactions:[
              { char:'friend', text:"FULLY COMMITTED on Day 1 🔥 No half measures. This is the energy. This is the STORY." },
              { char:'parent', text:"No safety net?? Keep emergency money aside. Just a little. For me. Please. 😭" },
            ]},
          { id:'c1b', text:"Start small and test — validate before going all in.", label:'B', icon:'💡',
            metrics:{ bank:-3000, happiness:+5, approval:+10 },
            reactions:[
              { char:'mentor', text:"Small experiments with real feedback loops. This is how sustainable successes actually begin." },
              { char:'friend', text:"'Test and validate' energy. Been listening to startup podcasts na. Very sensible honestly." },
            ]},
          { id:'c1c', text:"Build knowledge first — learn before you leap.", label:'C', icon:'🎯',
            metrics:{ bank:-2000, happiness:+10, approval:+15 },
            reactions:[
              { char:'parent', text:"YES. Learn everything properly. Knowledge is the best foundation. I'm less worried now. Slightly. 🙂" },
              { char:'friend', text:"Pre-learning phase. Valid. But at some point you have to DO the thing, not just prepare to do the thing." },
            ]},
        ]
      },
      {
        id:'ep2', label:'Month 3', fullLabel:'Month 3 — The Real Test',
        nextTeaser:"Month 6 — Time for the final verdict. Was it worth it? ⏰",
        scenes:[
          { id:'sc1', label:'Reality Check', messages:[
            { char:'narrator', text:"Three months in. Initial excitement has settled into something more complicated — real work, real obstacles, real discovery that this is harder than you thought." },
            { char:'friend',   text:"Actual honest answer — not the 'I'm fine' one you tell everyone. What's really happening?" },
          ]},
          { id:'sc2', label:'Mentor Mid-Point', messages:[
            { char:'mentor',   text:"What's working? What isn't? What have you learned you didn't expect? Be brutally honest — with me, more importantly with yourself." },
            { char:'parent',   text:"You look tired. Are you sleeping? Eating? There is a thing called sleep that humans require. Consider it. 🙂" },
          ]},
          { id:'sc3', label:'The Obstacle', messages:[
            { char:'narrator', text:"A real obstacle has appeared. Not theoretical. Not 'what if'. Actual, blocking-your-path obstacle. It needs a decision." },
          ]},
        ],
        question:"You hit a real obstacle. What do you do?",
        choices:[
          { id:'c2a', text:"Push through — persistence is the real differentiator.", label:'A', icon:'🔥',
            metrics:{ bank:-5000, happiness:-5, approval:+5 },
            reactions:[
              { char:'friend', text:"Day 90 and still going 💪 Tell me the specific tough part — I want the actual thing, not 'it's hard'." },
              { char:'mentor', text:"Make sure you're pushing through a real obstacle, not stubbornly repeating what isn't working. Those are very different things." },
            ]},
          { id:'c2b', text:"Pivot — adapt based on what you've actually learned.", label:'B', icon:'💡',
            metrics:{ bank:-2000, happiness:+10, approval:0 },
            reactions:[
              { char:'mentor', text:"Pivoting based on evidence is intelligence, not weakness. What specifically did you learn that led to this?" },
              { char:'friend', text:"New direction unlocked. I'm with it. Tell me the updated plan. Full detail." },
            ]},
          { id:'c2c', text:"Ask for help — you can't figure everything out alone.", label:'C', icon:'🎯',
            metrics:{ bank:-3000, happiness:+16, approval:+10 },
            reactions:[
              { char:'mentor', text:"Asking for help early is self-awareness, not weakness. What specific help do you need? Let's map it — who, what, by when." },
              { char:'parent', text:"You asked for help! Grown-up thinking! What do you need from us? We're here. Whatever it is. 🙏" },
            ]},
        ]
      },
      {
        id:'ep3', label:'Month 6', fullLabel:'Month 6 — The Verdict',
        isEndpoint:true,
        scenes:[
          { id:'sc1', label:'Six Months In', messages:[
            { char:'narrator', text:"Six months in. Highs, lows, strange surprises, and quiet moments of 'wait, am I actually doing this?' And yet — here you are. Still standing." },
            { char:'friend',   text:"Inside your head right now — would the version of you that started this 6 months ago approve of you now?" },
          ]},
          { id:'sc2', label:'The Wisdom', messages:[
            { char:'mentor',   text:"What's the single most important thing you've learned? Not a skill. Wisdom. The kind that changes how you see things." },
            { char:'narrator', text:"The answer you give defines not this chapter — but the next one." },
          ]},
          { id:'sc3', label:'Final Verdict', messages:[
            { char:'system',   text:"Six months. Three episodes. The verdict is yours to give." },
          ]},
        ],
        question:"How do you define success for this journey?",
        choices:[
          { id:'c3a', text:"I achieved what I set out to do. It worked.", label:'A', icon:'🏆',
            metrics:{ bank:+20000, happiness:+20, approval:+16 },
            outcome:{ summary:"You did it. Exactly what you said you would. Not perfectly, not without cost — but you achieved the actual goal. That's not nothing. That's everything.", episodeTitle:"The One Where It Actually Worked", ending:'success' },
            reactions:[
              { char:'parent', text:"We always knew. Even when worried sick — deep down we believed. Always. Proud doesn't cover it. 😭🎉" },
              { char:'friend', text:"CALLED IT 6 MONTHS AGO. Mandatory celebration this weekend. I'm picking the place." },
            ]},
          { id:'c3b', text:"It's different from what I imagined — but worthwhile.", label:'B', icon:'💡',
            metrics:{ bank:+5000, happiness:+16, approval:+10 },
            outcome:{ summary:"Not what you pictured. But what you found was real and yours. The detour turned out to be the point. Sometimes that's better than the original destination.", episodeTitle:"The Unexpected Win", ending:'neutral' },
            reactions:[
              { char:'mentor', text:"The journey not matching the plan doesn't make it failure. Most meaningful paths look completely different from the inside." },
            ]},
          { id:'c3c', text:"It didn't work — but I grew through trying.", label:'C', icon:'',
            metrics:{ bank:-10000, happiness:+5, approval:-5 },
            outcome:{ summary:"The outcome wasn't what you hoped for. But you tried. Actually tried. And you're different now — more honest, more resilient, more real.", episodeTitle:"The Beautiful Attempt", ending:'fail' },
            reactions:[
              { char:'friend', text:"You genuinely, fully tried. Most people never do. Round 2 when ready — I'll be your first call." },
              { char:'parent', text:"Proud of you for trying, beta. Never forget that. Trying is everything. 🙏" },
            ]},
        ],
        outcomes:{ success:"Six months of bold living. The leap landed. This chapter is one you'll tell stories about.", neutral:"Not the ending you scripted — but a real one. Growth rarely looks like what we originally pictured.", fail:"The result wasn't the goal. But the person who walked through this is not the same one who started." }
      }
    ]
  }
};
