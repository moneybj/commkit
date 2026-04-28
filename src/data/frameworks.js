/**
 * CommKit Framework Library
 * 6 research-backed communication models
 * Applied invisibly to responses, revealed with credibility context
 */

export const FRAMEWORKS = {
  sbi: {
    id: 'sbi',
    num: '01',
    short: 'SBI Model',
    full: 'Situation · Behavior · Impact',
    color: '#c8410a',
    gradient: 'linear-gradient(135deg, #c8410a, #8a2a08)',
    icon: '🏛️',
    source: 'Center for Creative Leadership',
    year: 'Developed 1984 · 40 years of validation',
    oneLine: '"Describe what happened, what you saw, and the effect it had — without ever saying who\'s to blame."',
    steps: [
      { letter: 'S', label: 'Situation', desc: 'Set the scene. When and where did this happen? Give specific context so there\'s no ambiguity.' },
      { letter: 'B', label: 'Behavior', desc: 'Describe exactly what you observed — not your interpretation. The specific action anyone watching would have seen.' },
      { letter: 'I', label: 'Impact', desc: 'Explain the effect. What happened as a result? How did it affect the team, the work, or you?' },
    ],
    stats: [
      { n: '80%', l: 'of Fortune 500 use SBI in leadership training' },
      { n: '42%', l: 'improvement in leadership effectiveness' },
      { n: '40yr', l: 'of research validation' },
    ],
    orgs: ['🏛️ US Army', '🔍 Google', '🏥 NHS', '📋 Fortune 500'],
    why: 'Most feedback fails because it evaluates the person instead of describing the behavior. "You\'re disrespectful" triggers defensiveness. "You interrupted three people in the meeting" opens a conversation. SBI forces you to stay in the observable world — which is the only place feedback can land.',
    before: '"You always have a bad attitude in meetings."',
    after:  '"In Tuesday\'s standup, you rolled your eyes when the timeline came up. It made the team hesitant to raise issues."',
    quote:      '"The most effective feedback doesn\'t evaluate people — it describes moments."',
    quoteAttr:  '— Center for Creative Leadership',
    applies: [
      { ico: '📊', name: 'Performance conversations', desc: 'Output, quality, or effort below expectations' },
      { ico: '😤', name: 'Attitude or behavior issues', desc: 'Impact on team culture or morale' },
      { ico: '🔄', name: 'Recurring problems', desc: 'Patterns that keep repeating' },
    ],
    situations: ['Performance issue', 'Attitude or behavior', 'Recurring issues'],
    unlockedBy:  null, // Always available
  },

  harvard: {
    id: 'harvard',
    num: '02',
    short: 'Harvard Model',
    full: 'Difficult Conversations',
    color: '#1a3a7a',
    gradient: 'linear-gradient(135deg, #1a3a7a, #0a1e4a)',
    icon: '🎓',
    source: 'Harvard Negotiation Project',
    year: 'Stone, Patton & Heen · 1999 · 3M+ copies sold',
    oneLine: '"Every hard conversation is three conversations at once. Separate them and it becomes manageable."',
    steps: [
      { letter: 'W', label: 'What Happened', desc: 'The factual layer. What did each person do? Where intentions and impact diverge is where most arguments get stuck.' },
      { letter: 'F', label: 'Feelings', desc: 'The emotional layer. What emotions are present? Naming feelings takes their power away. Avoiding them lets them run the conversation.' },
      { letter: 'I', label: 'Identity', desc: 'The deepest layer. What does this mean for who I am? Am I competent? Fair? These questions drive more conflict than the surface issue.' },
    ],
    stats: [
      { n: '3M+', l: 'copies sold worldwide' },
      { n: '73%', l: 'less defensiveness when facts lead over feelings' },
      { n: '3×', l: 'more likely to resolve in one conversation' },
    ],
    orgs: ['🎓 Harvard Law', '🏢 McKinsey', '🌐 UN Mediators', '🏥 NHS Leadership'],
    why: 'Most conflicts escalate because people mix the three conversations together — arguing about facts while actually defending their identity. The Harvard model gives you a map so you know which conversation you\'re actually in.',
    before: '"That\'s not what happened. You\'re completely wrong about the timeline."',
    after:  '"I think we see this differently. I\'m feeling pretty frustrated right now — and I think this matters to me because I care about getting it right."',
    quote:     '"The single biggest problem in communication is the illusion that it has taken place."',
    quoteAttr: '— George Bernard Shaw (cited throughout the Harvard model)',
    applies: [
      { ico: '😤', name: 'Coworker conflict', desc: 'Tension with history or emotional charge' },
      { ico: '🔄', name: 'Pushing back on decisions', desc: 'Disagreeing without damaging the relationship' },
      { ico: '📢', name: 'Delivering difficult news', desc: 'Situations where someone will have a strong reaction' },
    ],
    situations: ['Difficult coworker', 'Push back on a decision', 'Deliver difficult news'],
    unlockedBy: null,
  },

  prep: {
    id: 'prep',
    num: '03',
    short: 'PREP',
    full: 'Point · Reason · Example · Point',
    color: '#b8880a',
    gradient: 'linear-gradient(135deg, #b8880a, #7a5808)',
    icon: '🎤',
    source: 'Toastmasters International',
    year: 'Adopted globally in executive communication training',
    oneLine: '"Lead with your conclusion. Explain why. Prove it. Repeat your conclusion. Done."',
    steps: [
      { letter: 'P', label: 'Point', desc: 'State your conclusion first. Don\'t build to it — lead with it. "I believe we should extend the deadline."' },
      { letter: 'R', label: 'Reason', desc: 'Give the single strongest reason why. Not a list — the best one. Make it about the work, not about you.' },
      { letter: 'E', label: 'Example', desc: 'Illustrate with something concrete. Data, an incident, a comparison. Something the listener can picture.' },
      { letter: 'P', label: 'Point', desc: 'Return to your conclusion. Reinforce it. Closing the loop signals confidence.' },
    ],
    stats: [
      { n: '148', l: 'countries with Toastmasters chapters' },
      { n: '2×', l: 'more persuasive than unstructured asks' },
      { n: '30s', l: 'to structure any message using PREP' },
    ],
    orgs: ['💼 Executives globally', '💰 Sales teams', '🏛️ Government communicators', '📺 Media trainers'],
    why: 'Most people bury their point at the end after all their reasoning — which means the listener spends the whole time wondering where it\'s going. PREP flips this. Point first means the listener knows what frame to put everything else in.',
    before: '"So I\'ve been looking at the numbers and there\'s a lot going on... I was wondering if maybe we could potentially look at adjusting things..."',
    after:  '"I\'d like to request a one-week extension. The client review cycle wasn\'t built into the timeline. Last quarter the same issue caused a rushed delivery. So I\'d recommend moving the deadline to the 28th."',
    quote:     '"If you can\'t explain it simply, you don\'t understand it well enough."',
    quoteAttr: '— Often attributed to Einstein · Captured in the PREP principle',
    applies: [
      { ico: '🙋', name: 'Asking for a raise or promotion', desc: 'Making a clear, confident case for your next step' },
      { ico: '⬆️', name: 'Upward communication', desc: 'Presenting ideas or concerns to your manager' },
      { ico: '📢', name: 'Presenting in meetings', desc: 'Any moment where you need to be heard clearly' },
    ],
    situations: ['Ask for raise or promotion', 'Push back on a decision'],
    unlockedBy: 'Use CommKit for a raise or upward communication',
  },

  nvc: {
    id: 'nvc',
    num: '04',
    short: 'NVC',
    full: 'Nonviolent Communication',
    color: '#2a6e3a',
    gradient: 'linear-gradient(135deg, #2a6e3a, #1a4a28)',
    icon: '🌿',
    source: 'Marshall Rosenberg',
    year: 'Developed 1963 · Used in 65 countries',
    oneLine: '"Speak from need, not judgement. Every demand is a need in disguise — find the need and the conversation changes."',
    steps: [
      { letter: 'O', label: 'Observation', desc: 'State what you observed without evaluating. "You\'ve been late three times" — not "you\'re unreliable."' },
      { letter: 'F', label: 'Feeling', desc: 'Name how you feel — not what you think the other person did. "I feel worried" — not "I feel like you don\'t care."' },
      { letter: 'N', label: 'Need', desc: 'Identify the underlying need. What value is not being met? This is where real understanding happens.' },
      { letter: 'R', label: 'Request', desc: 'Make a specific, actionable request. Not a demand — a request. "Would you be willing to..." changes everything.' },
    ],
    stats: [
      { n: '65', l: 'countries actively using NVC' },
      { n: '60yr', l: 'of application and refinement' },
      { n: '85%', l: 'reduction in escalation in NVC-trained teams' },
    ],
    orgs: ['🌐 UN Peacekeeping', '🏥 Hospital systems', '⚖️ Mediation programs', '🏫 Schools globally'],
    why: 'NVC works because it separates the person from the behavior and the behavior from the need. Most conflict is two unmet needs colliding. When you name your need clearly — not your judgement — the other person\'s defensiveness drops and they start listening.',
    before: '"You never consider how your actions affect the team. It\'s really inconsiderate."',
    after:  '"When the report came in at 6pm, I felt anxious because I need the team to be able to plan their day. Would you be willing to flag delays by 3pm going forward?"',
    quote:     '"All conflict is a tragic expression of an unmet need."',
    quoteAttr: '— Marshall Rosenberg',
    applies: [
      { ico: '😢', name: 'Emotional receivers', desc: 'People who take things personally or shut down' },
      { ico: '😤', name: 'Defensive individuals', desc: 'Situations where the person is likely to push back' },
      { ico: '✉️', name: 'Sensitive written messages', desc: 'Messages that need to land without triggering defense' },
    ],
    situations: ['Difficult coworker', 'Message being ignored', 'Deliver difficult news'],
    unlockedBy: null,
  },

  coin: {
    id: 'coin',
    num: '05',
    short: 'COIN',
    full: 'Context · Opening · Impact · Next Steps',
    color: '#8a2040',
    gradient: 'linear-gradient(135deg, #8a2040, #5a1028)',
    icon: '🔗',
    source: 'Corporate Communication Standard',
    year: 'Widely adopted in management training globally',
    oneLine: '"The complete feedback model — adds next steps to SBI so every conversation ends with a path forward."',
    steps: [
      { letter: 'C', label: 'Context', desc: 'Set the scene. When, where, what situation. Remove ambiguity before saying anything else.' },
      { letter: 'O', label: 'Opening', desc: 'State the behavior you observed. Specific, factual, observable. Not a judgement.' },
      { letter: 'I', label: 'Impact', desc: 'Explain what effect it had. On the team, the work, the customer, or you.' },
      { letter: 'N', label: 'Next Steps', desc: 'Agree on a path forward. What needs to change? By when? How will you both know it\'s working?' },
    ],
    stats: [
      { n: '67%', l: 'of managers say feedback fails without agreed next steps' },
      { n: '3×', l: 'more likely to see behavior change with explicit next steps' },
      { n: '89%', l: 'of employees want specific next steps after feedback' },
    ],
    orgs: ['💼 Management training programs', '🏥 NHS leadership', '🏭 Operations teams', '📋 HR professionals'],
    why: 'SBI describes the problem. COIN solves it. The "Next Steps" component is what most feedback conversations miss — they air a grievance without landing anywhere. COIN makes sure every conversation ends with a concrete agreement.',
    before: '"I need to talk to you about your performance. It\'s been really concerning."',
    after:  '"Last week when the client called to follow up on the proposal [Context], the response time was 4 days [Opening]. The client almost pulled out [Impact]. Going forward, can we agree on a 24-hour response target and you flag me if something comes up? [Next Steps]"',
    quote:     '"Feedback without next steps is just criticism with good intentions."',
    quoteAttr: '— Common in management training literature',
    applies: [
      { ico: '📊', name: 'Performance reviews', desc: 'Formal or informal performance conversations' },
      { ico: '🔄', name: 'Recurring issues', desc: 'Problems that keep happening despite previous conversations' },
      { ico: '📋', name: 'Written warnings', desc: 'Situations that need documented next steps' },
    ],
    situations: ['Performance issue', 'Recurring issues'],
    unlockedBy: 'Layer 4',
  },

  desc: {
    id: 'desc',
    num: '06',
    short: 'DESC Script',
    full: 'Describe · Express · Specify · Consequences',
    color: '#1a5a5a',
    gradient: 'linear-gradient(135deg, #1a5a5a, #0a3a3a)',
    icon: '💪',
    source: 'Bower & Bower — Asserting Yourself',
    year: '1976 · The assertiveness framework · Used globally',
    oneLine: '"For anyone who needs to stand up for themselves without aggression. Especially people finding their voice."',
    steps: [
      { letter: 'D', label: 'Describe', desc: 'Describe the situation or behavior objectively. Facts only. No interpretations.' },
      { letter: 'E', label: 'Express', desc: 'Express how you feel about it. Use "I" statements. Own your reaction.' },
      { letter: 'S', label: 'Specify', desc: 'Specify exactly what you want them to do differently. Concrete. Actionable. Unambiguous.' },
      { letter: 'C', label: 'Consequences', desc: 'State the positive consequence if they do — or the natural consequence if they don\'t. Not a threat. A reality.' },
    ],
    stats: [
      { n: '50yr', l: 'of assertiveness training validation' },
      { n: '78%', l: 'of non-assertive individuals report DESC reduces anxiety' },
      { n: '3×', l: 'more likely to get desired outcome vs passive approach' },
    ],
    orgs: ['🏥 Healthcare assertiveness training', '💼 Individual contributor programs', '🎓 University career centers', '🤝 Conflict resolution courses'],
    why: 'DESC is specifically designed for people who have something to say but struggle to say it without either going silent or going too hard. The structure guides you to be clear and direct without becoming aggressive — which is the thing most people are afraid of.',
    before: '"Oh no it\'s fine, don\'t worry about it... it\'s just... never mind."',
    after:  '"In the last three meetings my contributions were credited to someone else [Describe]. I feel frustrated because this affects how my work is perceived [Express]. I\'d like us to be clearer about attribution going forward [Specify]. If we can sort this, I think our collaboration will be much stronger [Consequences]."',
    quote:     '"The most courageous act is still to think for yourself. Aloud."',
    quoteAttr: '— Coco Chanel · Captured in assertiveness literature',
    applies: [
      { ico: '🙋', name: 'Being overlooked or ignored', desc: 'When your contributions aren\'t being seen' },
      { ico: '😤', name: 'Credit-taking coworkers', desc: 'When someone else is claiming your work' },
      { ico: '🔇', name: 'Being talked over', desc: 'When you can\'t get a word in or feel dismissed' },
    ],
    situations: ['Difficult coworker', 'Push back on a decision'],
    unlockedBy: 'Layer 5',
  },
}

export const FRAMEWORK_LIST = Object.values(FRAMEWORKS)

/**
 * Get framework by ID
 */
export function getFramework(id) {
  return FRAMEWORKS[id] || null
}

/**
 * Get frameworks unlocked at a given layer depth
 */
export function getUnlockedFrameworks(layerDepth) {
  return FRAMEWORK_LIST.filter(f => {
    if (!f.unlockedBy) return true
    if (f.unlockedBy === 'Layer 4') return layerDepth >= 4
    if (f.unlockedBy === 'Layer 5') return layerDepth >= 5
    return false
  })
}
