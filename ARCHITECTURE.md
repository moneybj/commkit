# CommKit — Architecture & Product Goals
> Reference document for Cursor agent mode.
> Read this before making any multi-file changes, adding features, or refactoring.

---

## 1. What CommKit Is (And Isn't)

### The one-sentence version
CommKit helps professionals say the right thing in hard workplace conversations — in under 60 seconds, on their phone, right before the conversation happens.

### The product insight
People don't avoid hard conversations because they lack communication skills. They avoid them because the gap between "I know I need to say something" and "knowing exactly how to say it" is too wide in the moment. Books and courses close that gap slowly. CommKit closes it instantly.

### What it is NOT
- Not a course or learning platform (even though learning happens as a byproduct)
- Not a chatbot or open-ended AI conversation
- Not a productivity tool or task manager
- Not enterprise HR software
- Not a writing assistant

### The target moment
A shift supervisor has 4 minutes before they need to address a team member about repeated lateness. They're anxious. They don't know what to say. CommKit is what they open in that moment. Everything is designed around that person, in that moment.

---

## 2. The Two Audiences

### Audience A — Individual Contributors (ICs)
New hires through senior professionals. Not people leaders. People who need to:
- Push back on decisions without damaging relationships
- Ask for raises or promotions
- Address difficult coworkers
- Follow up on ignored messages
- Navigate being overlooked or talked over

**Their fear:** Saying the wrong thing and making things worse, or looking weak.

### Audience B — Frontline Leaders
Shift leads, team leads, supervisors, assistant managers. First-time or early-stage people leaders. They need to:
- Give feedback that actually lands
- Address performance without triggering defensiveness
- Deliver bad news to their team
- Communicate upward to their own manager
- Handle conflict between team members

**Their fear:** Being disrespected, losing control of the room, or damaging a relationship they depend on.

### What both share
Neither audience wants a course. Neither has time. Both know they should handle the situation but keep avoiding it. CommKit gives them the exact words, right now, calibrated to who they are and who they're talking to.

---

## 3. Core Product Mechanics

### 3.1 Signals
**What they are:** Behavioral data points collected passively from usage.

**What gets recorded:**
- Which response version was chosen (Direct / Balanced / Careful)
- What situation type was selected or described
- Voice vs text input method
- Whether the framework card was expanded
- Feedback ratings (thumbs up/down)
- Session duration patterns

**Where they live:** `src/features/signals.js` + `src/utils/storage.js` (localStorage)

**The key insight:** Signals reveal how someone actually communicates vs how they think they communicate. A user who selects "Direct" personality but consistently picks the Balanced response version is giving CommKit real behavioral data that overrides the self-report.

**How they surface:** Inline Signal notification on the result screen after each session. Non-intrusive. The user can accept a suggested tag or dismiss it.

### 3.2 Layers
**What they are:** The depth of a user's profile, built from Signals over time. Visualized as tree rings — each Layer is a ring that grows deeper over sessions.

**Layer definitions:**
| Layer | Name | What unlocks | Sessions needed |
|---|---|---|---|
| 1 | Foundation | Role + first situation | Session 1 |
| 2 | Calibration | Style + receiver mapping | Session 2–3 |
| 3 | Pattern | Industry calibration | Session 3–5 |
| 4 | Voice | Tone fingerprint, voice calibration | Session 6–10 |
| 5 | Signature | Full comm profile, proactive coaching | Session 10+ |

**Where they live:** `src/features/signals.js` → `getLayerInfo()` and `getTreeRingsSVG()`

**The stickiness:** Layer depth is the primary retention mechanic. Users don't want to lose their Layers. As the profile gets more accurate, the responses feel more personal — which creates genuine value, not manufactured engagement.

### 3.3 Tag Profile
**What they are:** Instagram-style behavioral tags that represent how the user communicates. X-able (removable). Suggested by CommKit based on Signals. Never forced.

**Tag categories:**
- `style` — how they naturally communicate (Direct, Warm, Careful, Energetic)
- `tendency` — behavioral patterns, the honest ones (Avoids conflict, Delays hard convos)
- `strength` — what they're actually good at (Clear writer, Good listener)
- `growth` — aspirational tags they opt into (Building confidence, Getting more direct)

**The growth mechanic:** Tags fade visually when the behavior pattern stops appearing. A fading `Avoids conflict` tag — without the user doing anything — is the most powerful growth notification in the product. Better than any badge or streak.

**Where they live:** `src/utils/storage.js` → `getTags()`, `addTag()`, `removeTag()`

**Home screen:** Top half of the returning user home screen is the tag cloud. Bottom half is quick action. This split makes CommKit something users open even when they don't have an immediate hard conversation — they check their profile.

### 3.4 Frameworks
**What they are:** 6 research-backed communication models applied invisibly to every response. Revealed after generation with credibility context. Never taught upfront.

**The 6 frameworks:**
| ID | Name | Best for | Layer unlock |
|---|---|---|---|
| `sbi` | Situation · Behavior · Impact | Feedback, performance | Always |
| `harvard` | Difficult Conversations | Conflict, pushback, hard news | Always |
| `prep` | Point · Reason · Example · Point | Upward comms, raises | Session 5+ |
| `nvc` | Nonviolent Communication | Emotional/defensive receivers | Always |
| `coin` | Context · Opening · Impact · Next Steps | Performance plans | Layer 4 |
| `desc` | Describe · Express · Specify · Consequences | Assertiveness, ICs | Layer 5 |

**Where they live:** `src/data/frameworks.js` — full definitions including steps, stats, examples, organizations

**The credibility build:** Each session the user sees a different framework named. By session 8 they've encountered enough that they start trusting CommKit at a deeper level. The Framework Library screen (`frameworks.html`) shows all 6 with discovery/locked states.

**The reveal card rule:** Always end the framework reveal with the user as the hero. Not "here's a framework" — "you just did what Google trains its managers to do, in under a minute."

---

## 4. User Journey & Data Collection

### Progressive data collection — one question per session
The biggest UX mistake is collecting all profile data upfront. CommKit collects one new piece per session, always after delivering value first.

| Session | What's collected | How |
|---|---|---|
| 1 | Situation type | Tap or voice — no friction |
| End of session 1 | Starter tags | Auto-generated, user edits |
| Session 2 | Receiver style | Single card before generate |
| Session 3 | Industry | Single card before generate |
| Session 4 | Role | Role chip selection |
| Session 5 | Style (confirmed) | Suggested from behavioral data |
| Session 5+ | Behavioral tags | Suggested based on patterns |

### Session flow (new user)
```
Welcome screen
  → Session screen (role + style + situation)
    → Processing screen (API call, 4 animated steps)
      → Result screen (responses, signal, framework, Q&A, feedback)
```

### Session flow (returning user — session 2+)
```
Home screen (tag cloud + quick action)
  → Session screen (profile bar, situation only)
    → Processing screen
      → Result screen
```

### Sign-in timing (DO NOT gate early)
| Session | Sign-in action |
|---|---|
| 1–2 | No mention of sign-in |
| 3 | Soft nudge after results ("back up your profile") |
| 5 | Loss aversion nudge ("You're on Layer 3...") |
| Device switch | Restore prompt |
| Layer 4 | First honest gate |

Sign-in = Google or Apple only. No email/password forms. One tap.

---

## 5. File Architecture

```
commkit/
│
├── index.html                    # PWA shell. Meta tags, fonts, app mount point.
│                                 # Script src="/src/main.js" is the only entry.
│
├── api/
│   └── generate.js               # Vercel serverless function.
│                                 # Receives { prompt } POST, calls Anthropic,
│                                 # returns response. API key NEVER touches browser.
│
├── public/
│   ├── manifest.json             # PWA manifest. Theme color, icons, shortcuts.
│   ├── sw.js                     # Service worker. Cache-first for assets,
│   │                             # network-always for /api/* calls.
│   ├── offline.html              # Shown when offline + no cache hit.
│   └── icons/                    # icon-72 through icon-512. Generated by Pillow.
│
└── src/
    ├── main.js                   # ★ ENTRY POINT
    │                             # Boots app, owns routing between screens,
    │                             # registers SW, handles PWA install prompts,
    │                             # manages session counting.
    │
    ├── style.css                 # ★ DESIGN SYSTEM
    │                             # All CSS custom properties (tokens).
    │                             # Global reset, shared components (cards, buttons,
    │                             # tags, badges, toasts, bottom nav, share sheet).
    │                             # Animations. No screen-specific styles here.
    │
    ├── screens/                  # One file per screen. Each exports:
    │   │                         #   renderXxx(props) → HTML string
    │   │                         #   bindXxx(callbacks) → attaches event listeners
    │   │
    │   ├── welcome.js            # New user first screen. Logo, tagline, CTA.
    │   │                         # No data collection. One tap to session.
    │   │
    │   ├── session.js            # ★ MOST COMPLEX SCREEN
    │   │                         # Handles: profile bar (returning), role chips
    │   │                         # (first session), style cards (first session),
    │   │                         # situation grid, voice panel, text panel,
    │   │                         # tab switching, CTA state management.
    │   │                         # Owns VoiceInput instance lifecycle.
    │   │
    │   ├── processing.js         # Loading animation. 4 steps, 900ms each.
    │   │                         # Shows contextual labels from current profile.
    │   │                         # Exports animateProcessingSteps(),
    │   │                         # showProcessingError(msg).
    │   │
    │   └── result.js             # ★ RICHEST SCREEN
    │                             # 3 response cards → copy/share/use actions
    │                             # Active signals strip
    │                             # Detected context card
    │                             # Inline Signal notification (after ~1.2s delay)
    │                             # Framework reveal card (collapsed by default)
    │                             # Coaching tip
    │                             # Q&A accordion
    │                             # Layer unlock progress card
    │                             # Feedback module (thumbs + optional text)
    │                             # Privacy note
    │
    ├── features/
    │   ├── api.js                # buildPrompt(profileData) → string
    │   │                         # generateResponses(profileData) → parsed JSON
    │   │                         # Calls /api/generate, strips JSON fences,
    │   │                         # throws on parse error.
    │   │
    │   ├── voice.js              # VoiceInput class.
    │   │                         # State machine: idle→listening→done|error
    │   │                         # Wraps Web Speech API. Recreates recognition
    │   │                         # instance each start() call (iOS Safari req).
    │   │                         # Callbacks: onTranscript, onFinal, onStateChange,
    │   │                         # onError.
    │   │
    │   └── signals.js            # recordSignal(type, value) — writes to profile
    │                             # analyseSignals(currentResult) — pattern detection
    │                             # getLayerInfo() — current depth + next layer
    │                             # getTreeRingsSVG(depth, size) — SVG string
    │
    ├── data/
    │   └── frameworks.js         # FRAMEWORKS object — all 6 definitions.
    │                             # Each has: id, name, color, source, year,
    │                             # steps[], stats[], orgs[], why, before/after
    │                             # example, quote, applies[], unlockedBy.
    │                             # getFramework(id), getUnlockedFrameworks(depth)
    │
    └── utils/
        ├── storage.js            # ★ ALL LOCALSTORAGE GOES HERE
        │                         # getProfile/saveProfile, getTags/addTag/removeTag,
        │                         # getSessionCount/incrementSession,
        │                         # getHistory/addToHistory,
        │                         # install state helpers, calculateLayerDepth().
        │                         # NEVER import localStorage directly elsewhere.
        │
        ├── toast.js              # initToast(), showToast(msg, duration)
        │                         # Single DOM element, reused.
        │
        └── share.js              # openShare(text) — tries native share first,
                                  # falls back to custom sheet.
                                  # copyToClipboard(text), closeShare().
```

---

## 6. Data Flow

```
User action (tap situation / voice input)
  ↓
session.js collects: { situation, situationText, inputMethod }
  ↓
main.js handleGenerate() calls:
  ├── recordSignal(INPUT_METHOD, inputMethod)
  ├── recordSignal(SITUATION_TYPE, situation)
  ├── renderProcessing(profileData) → shows loading UI
  ├── animateProcessingSteps() → starts 4-step animation
  └── generateResponses(profileData) [api.js]
        ↓
        POST /api/generate { prompt }
          ↓ (Vercel serverless)
          Anthropic API → structured JSON response
          ↓
        Parse JSON, strip markdown fences
        Return parsed result object
  ↓
renderResult({ result, situationLabel, profile, sessionData })
  ↓
bindResult({
  onVersionUsed → recordSignal(RESPONSE_CHOSEN, label)
  onFrameworkOpened → recordSignal(FRAMEWORK_OPENED, true)
  onFeedback → recordSignal(FEEDBACK_GIVEN, type)
})
```

---

## 7. API Contract

### Request (client → serverless)
```json
POST /api/generate
{
  "prompt": "string (max 8000 chars)"
}
```

### Response (serverless → client)
Raw Anthropic messages response — client extracts `data.content[0].text`

### Prompt output format (Claude → client)
Claude is instructed to return raw JSON (no fences). The client strips fences as a safety net. Required fields:
```typescript
{
  situationTitle: string        // max 4 words
  detectedSummary: string       // one sentence
  profileApplied: string        // one sentence
  responses: [
    { label, why, tone, text }  // 3 items: Direct, Balanced, Careful
  ]
  framework: {
    name, source, explanation,
    stat1num, stat1label,
    stat2num, stat2label,
    usedBy
  }
  coachingTip: string
  qaItems: [{ question, answer }]  // 3 items
  signalObservation: string
  suggestedTag: string         // "emoji label"
}
```

### Error handling
- Network failure → `showProcessingError(message)` with retry
- Parse failure → rethrow with user-friendly message
- API key missing → 500 from serverless, caught and displayed

---

## 8. State Management

CommKit has no global state manager. State lives in three places:

### 1. localStorage (persistent, on-device)
Managed exclusively through `src/utils/storage.js`. Never access `localStorage` directly anywhere else.

Keys:
- `ck_profile` — `{ role, style, sessionCount, layerDepth, firstSeen, signals[] }`
- `ck_tags` — `Tag[]`
- `ck_sessions` — integer
- `ck_history` — last 20 sessions
- `ck_installed` — boolean
- `ck_install_dismissed` — timestamp
- `ck_ios_nudge_shown` — '1'

### 2. Screen-local state (in-memory, per render)
Each screen file manages its own local state object (e.g. `sessionState` in `session.js`). This state is discarded when the screen unmounts.

### 3. `appState` in main.js (in-memory, session-scoped)
```js
const appState = {
  currentScreen: null,
  profile: null,
  currentResult: null,
  sessionData: { situation, situationText, inputMethod }
}
```
This holds the result between processing and result screens.

---

## 9. Design System Rules

### Colors — never hardcode hex values in components
Always use CSS custom properties from `style.css`:
```css
var(--accent)      /* CommKit orange — CTAs, active states, key actions */
var(--gold)        /* Signals gold — Signal notifications, frameworks */
var(--green)       /* Success / privacy — copy confirmation, privacy notes */
var(--blue)        /* Informational — Careful response badge */
var(--text)        /* Primary text */
var(--text2)       /* Secondary text */
var(--muted)       /* Tertiary text, labels */
var(--bg)          /* App background */
var(--s2)          /* Card backgrounds */
var(--border)      /* Subtle borders */
```

### Typography rules
- Headlines, large numbers, editorial moments → `font-family: var(--font-display)` (Fraunces serif)
- All UI, body text, labels → `font-family: var(--font-body)` (Cabinet Grotesk)
- Mono labels, kickers, codes → `font-family: var(--font-mono)`
- Section labels always uppercase, letter-spaced, with a line after
- Response text always italic

### Component patterns
- Cards: `background: var(--s2); border: 1.5px solid var(--border); border-radius: 16px`
- Badges: small, pill-shaped, colored by context
- Buttons: always include active transform scale(.97-.98)
- CTAs fixed to bottom with gradient fade above

### Mobile-first non-negotiables
- No hover-only interactions (use active states instead)
- Tap targets minimum 44px
- No horizontal overflow
- Bottom nav always 80px from bottom of scrollable content
- Sticky headers use backdrop-filter blur

---

## 10. PWA Requirements

### Service worker strategy (`public/sw.js`)
- **Core app files** → cache-first, revalidate in background
- **Google Fonts** → cache-first (for offline use)
- **`/api/*`** → network-always (never cache AI responses)
- **Offline fallback** → `offline.html` for document requests

### Manifest requirements (`public/manifest.json`)
- `display: "standalone"` — no browser chrome
- `theme_color: "#e8622a"` — CommKit orange status bar
- `start_url: "/"` — always boots from root
- All 8 icon sizes required for full platform support

### Install prompt timing
- Android: show after session 3 using `beforeinstallprompt` event
- iOS: show after session 3 with manual Share → Add to Home Screen instructions
- Never show on session 1 or 2
- Respect dismissed state (don't re-show for 7 days)

---

## 11. Feature Roadmap (for context when adding features)

### Phase 1 — Beta (current)
- [x] Voice + text input
- [x] 3 response versions
- [x] Framework reveal cards
- [x] Q&A prep
- [x] Inline Signal notifications
- [x] Tag profile (basic)
- [x] Layer system (visual)
- [x] PWA install

### Phase 2 — Layer 4 unlock
- [ ] Home screen with full tag cloud (returning user split view)
- [ ] Tag profile persistence and evolution
- [ ] Receiver personality selector (mid-session refinement)
- [ ] Industry calibration (session 3 progressive collection)
- [ ] Framework Library screen (full browseable library)
- [ ] Session history screen

### Phase 3 — Layer 5 / Growth
- [ ] Growth tracking (tag fading, progression visualization)
- [ ] Proactive coaching moments
- [ ] Sign-in / account (Google + Apple, profile backup)
- [ ] Group vs individual communication toggle
- [ ] Document capture (OCR → situation detection)
- [ ] Push notifications (calendar-aware coaching)

### Phase 4 — B2B
- [ ] Team licenses (manager distributes to team)
- [ ] Anonymized aggregate team Signal reports
- [ ] White-label / custom industry calibration
- [ ] Enterprise SSO

---

## 12. Coding Conventions

### Naming
- Files: `camelCase.js`
- CSS classes: `kebab-case`
- Functions: `camelCase`, verbs (`getProfile`, `renderResult`, `bindSession`)
- Constants: `UPPER_SNAKE_CASE`
- CSS custom properties: `--kebab-case`

### Module pattern
Every screen module exports exactly:
```js
export function renderXxx(props) { return `<html string>` }
export function bindXxx(callbacks) { /* attach listeners */ }
```

### HTML generation
- Use template literals for HTML strings
- Escape user content before inserting (use `escapeAttr()` for attributes)
- Never use `innerHTML` with unescaped user data
- Prefer `textContent` for user-facing text insertion

### Async pattern
```js
// Always async/await
try {
  const result = await generateResponses(profile)
  // handle success
} catch (err) {
  // always handle errors — never silent failures
  showProcessingError(err.message)
}
```

### Storage access
```js
// CORRECT — always go through storage.js
import { getProfile, saveProfile } from '../utils/storage.js'
const profile = getProfile()

// WRONG — never do this
const profile = JSON.parse(localStorage.getItem('ck_profile'))
```

### Signal recording
```js
// Record signals at natural moments, not in bulk
recordSignal(SIGNAL_TYPES.RESPONSE_CHOSEN, 'Balanced version')
// Not: recordSignal('some_string', someValue) — always use SIGNAL_TYPES constants
```

---

## 13. Things Cursor Should Never Do

- **Never use React, Vue, or any frontend framework** — vanilla JS only
- **Never call `api.anthropic.com` from the browser** — always `/api/generate`
- **Never store sensitive content server-side** — only the prompt goes to the API
- **Never put API keys in client code** — Vercel env vars only
- **Never add npm packages for things achievable with vanilla JS** — keep the bundle lean
- **Never add feature gates before session 3**
- **Never make the onboarding longer** — one question at a time, always after value
- **Never make CommKit sound corporate** — "Say the right thing" not "optimize communication"
- **Never use `localStorage` directly** — always through `storage.js`
- **Never add modals or popups that block the main flow** — use inline cards instead
- **Never show sign-in prompts during the generate flow** — only after results

---

## 14. When Adding a New Feature — Checklist

Before writing any code, answer these questions:

1. **Which screen does this live on?** If it needs a new screen, create a new file in `src/screens/`
2. **Does it collect user data?** If yes, add storage keys to `storage.js` and document them in section 8
3. **Does it create Signals?** If yes, add a new `SIGNAL_TYPE` constant and call `recordSignal()`
4. **Does it affect Layer progression?** If yes, update `calculateLayerDepth()` in `storage.js`
5. **Does it need API access?** If yes, route through `/api/generate` — never directly
6. **Does it work offline?** If no, add appropriate offline fallback
7. **Is it frictionless on first session?** If the feature adds steps to session 1, reconsider
8. **Does it sound like CommKit?** Check the tone in section 12

---

## 15. Quick Reference — Key Function Locations

| What you need | Where it is |
|---|---|
| Navigate between screens | `main.js` → `showWelcome()`, `showSession()`, `showResult()` |
| Save/load user profile | `src/utils/storage.js` → `getProfile()`, `saveProfile()` |
| Record a behavioral signal | `src/features/signals.js` → `recordSignal()` |
| Get layer depth | `src/features/signals.js` → `getLayerInfo()` |
| Get tree ring SVG | `src/features/signals.js` → `getTreeRingsSVG()` |
| Show a toast | `src/utils/toast.js` → `showToast()` |
| Open share sheet | `src/utils/share.js` → `openShare(text)` |
| Copy to clipboard | `src/utils/share.js` → `copyToClipboard(text)` |
| Build Claude prompt | `src/features/api.js` → `buildPrompt()` |
| Get framework data | `src/data/frameworks.js` → `getFramework(id)` |
| Add a tag to profile | `src/utils/storage.js` → `addTag({ label, type })` |
| Calculate what's in history | `src/utils/storage.js` → `getHistory()` |
| Start voice input | `src/features/voice.js` → `new VoiceInput(callbacks)` |
| Show processing error | `src/screens/processing.js` → `showProcessingError(msg)` |
