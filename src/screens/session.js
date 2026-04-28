/**
 * CommKit Session Screen
 * Role/style selection (first session only)
 * Situation grid + voice/text input
 * Calls onGenerate when ready
 */

import { VoiceInput } from '../features/voice.js'
import { saveProfile } from '../utils/storage.js'
import { escapeAttr, escapeHtml } from '../utils/escape.js'

const SITUATIONS = [
  { icon: '📊', name: 'Performance issue',          desc: 'Output, quality or metrics below standard' },
  { icon: '🙋', name: 'Ask for raise or promotion', desc: 'Making the case for your next step' },
  { icon: '🔄', name: 'Push back on a decision',   desc: 'Disagree professionally without damage' },
  { icon: '😤', name: 'Difficult coworker',         desc: 'Conflict, tension, or repeated friction' },
  { icon: '✉️', name: 'Message being ignored',      desc: 'Follow-up without being passive-aggressive' },
  { icon: '📢', name: 'Deliver difficult news',     desc: 'Policy change, bad results, hard updates' },
]

const STYLES = [
  { key: 'Direct',    emoji: '🎯', desc: 'Say what needs saying. No fluff.',           cls: 'c1' },
  { key: 'Warm',      emoji: '🤝', desc: 'Lead with relationship. Build trust.',         cls: 'c2' },
  { key: 'Careful',   emoji: '📋', desc: 'Think before speaking. Get it right.',        cls: 'c3' },
  { key: 'Energetic', emoji: '⚡', desc: 'Bring energy. People feel your presence.',    cls: 'c4' },
]

const RELATIONSHIPS = [
  { key: 'manager', label: 'Manager', icon: '⬆️' },
  { key: 'peer', label: 'Coworker / peer', icon: '🤝' },
  { key: 'direct-report', label: 'Direct report', icon: '👥' },
  { key: 'client', label: 'Client / partner', icon: '🏢' },
  { key: 'professional', label: 'Professional', icon: '💼' },
  { key: 'personal', label: 'Personal', icon: '🧭' },
  { key: 'family', label: 'Family', icon: '🏠' },
  { key: 'friend', label: 'Friend', icon: '⭐' },
]

// ── State ─────────────────────────────────────

let sessionState = {
  role: '',
  style: '',
  relationship: '',
  situation: '',
  situationText: '',
  inputMethod: 'voice',
  tab: 'voice',
}

let voiceInput = null

// ── Render ────────────────────────────────────

export function renderSession({ profile }) {
  const hasProfile = !!(profile?.role && profile?.style)

  return `
    <div id="screen-session" class="screen active" style="background:var(--bg);overflow:hidden;">

      <!-- Header -->
      <div style="padding:18px 22px 16px;border-bottom:1px solid var(--border);flex-shrink:0;">
        <div id="sessionBack" style="width:36px;height:36px;border-radius:50%;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;margin-bottom:16px;color:var(--text2);transition:all .15s;">←</div>
        <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--text);line-height:1.1;">What do you<br>need to say?</div>
        <div style="font-size:13px;color:var(--muted);margin-top:5px;line-height:1.55;">Speak it or type it — CommKit does the rest.</div>
      </div>

      <!-- Scrollable body -->
      <div id="sessionBody" style="flex:1;overflow-y:auto;padding:20px 20px 140px;">

        ${hasProfile ? renderProfileBar(profile) : ''}
        ${!hasProfile ? renderRoleSection() : ''}
        ${!hasProfile ? renderStyleSection() : ''}

        <button id="sessionResource" style="width:100%;text-align:left;background:linear-gradient(135deg,var(--s2),var(--s3));border:1.5px solid var(--border);border-top:2px solid var(--accent);border-radius:16px;padding:14px 15px;margin-bottom:16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:var(--font-body);">
          <div style="width:42px;height:42px;border-radius:12px;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0;">📄</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:2px;">Use a document or photo</div>
            <div style="font-size:11px;color:var(--muted);line-height:1.45;">Upload files, take pictures, or scan notes for summaries and talking points.</div>
          </div>
          <div aria-hidden="true" style="color:var(--accent);font-size:22px;">›</div>
        </button>

        ${renderRelationshipSection()}

        <!-- Situation grid -->
        <div class="section-label" style="margin-top:${hasProfile ? '0' : '4px'};">Your situation</div>
        <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:16px;" id="sitGrid">
          ${SITUATIONS.map(s => `
            <div class="sit-item" data-name="${s.name}" style="
              background:var(--s2);border:1.5px solid var(--border);
              border-radius:13px;padding:13px 15px;cursor:pointer;
              transition:all .2s;display:flex;align-items:center;gap:13px;
            ">
              <div style="width:42px;height:42px;border-radius:11px;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;transition:background .2s;">${s.icon}</div>
              <div style="flex:1;">
                <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px;">${s.name}</div>
                <div style="font-size:11px;color:var(--muted);">${s.desc}</div>
              </div>
              <div style="color:var(--muted2);font-size:17px;" class="sit-arr">›</div>
            </div>
          `).join('')}
        </div>

        <!-- Divider -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:13px;font-size:11px;color:var(--muted2);font-weight:600;">
          <span style="flex:1;height:1px;background:var(--border);display:block;"></span>
          or describe your own situation
          <span style="flex:1;height:1px;background:var(--border);display:block;"></span>
        </div>

        <!-- Voice + Text input zone -->
        <div id="inputZone" style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:8px;transition:border-color .25s;">
          <!-- Tabs -->
          <div class="input-tab-bar">
            <div class="input-tab active" id="tabVoice" data-tab="voice">🎤 Speak it</div>
            <div class="input-tab" id="tabText" data-tab="text">✏️ Type it</div>
          </div>

          <!-- Voice panel -->
          <div id="voicePanel" style="padding:20px 16px 16px;">
            <div id="voiceUnsupported" style="text-align:center;padding:20px 14px;font-size:12px;color:var(--muted);line-height:1.7;display:none;">
              <strong style="color:var(--text2);display:block;margin-bottom:6px;">Voice not available</strong>
              Voice works on Chrome and Safari on iOS. Switch to Type to describe your situation.
            </div>
            <div id="micUI">
              <div style="display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:16px;">
                <!-- Waveform -->
                <div id="waveform" style="display:flex;align-items:center;gap:3px;height:32px;opacity:0;transition:opacity .3s;">
                  ${Array(10).fill(0).map((_, i) => `<div class="wave-bar" style="width:3px;border-radius:3px;background:var(--accent);min-height:4px;animation-delay:${i * 0.05}s;"></div>`).join('')}
                </div>
                <!-- Mic button -->
                <div id="micBtn" style="width:80px;height:80px;border-radius:50%;background:var(--s3);border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:all .2s;">
                  <div id="micIcon" style="font-size:32px;position:relative;z-index:1;transition:all .2s;">🎤</div>
                </div>
                <div id="micStatus" style="font-size:13px;font-weight:700;color:var(--muted);text-align:center;min-height:20px;transition:color .3s;">Tap to speak your situation</div>
              </div>
              <!-- Transcript -->
              <div id="transcriptBox" style="background:var(--s3);border:1px solid var(--border);border-radius:10px;padding:11px 13px;min-height:52px;font-size:13px;color:var(--text2);line-height:1.65;font-style:italic;display:none;"></div>
              <!-- Transcript actions -->
              <div id="transcriptActions" style="display:none;gap:8px;margin-top:10px;">
                <div id="taEdit"  class="btn" style="flex:1;font-size:12px;">✏️ Edit</div>
                <div id="taRedo"  class="btn" style="font-size:12px;">↺</div>
                <div id="taUse"   class="btn btn-primary" style="flex:1;font-size:12px;">Use this →</div>
              </div>
            </div>
          </div>

          <!-- Text panel (hidden by default) -->
          <div id="textPanel" style="display:none;">
            <div style="padding:10px 13px 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);">✏️ &nbsp;Describe your situation</div>
            <textarea id="ftTa" style="padding:7px 13px 13px;min-height:72px;" placeholder="e.g. My colleague keeps taking credit for my work in meetings..."></textarea>
          </div>
        </div>

        <div style="font-size:11px;color:var(--muted2);padding:0 2px;">Not seeing your situation above? Speak or type it — CommKit handles anything.</div>
      </div>

      <!-- Fixed CTA -->
      <div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:390px;padding:16px 20px 36px;background:linear-gradient(to top,var(--bg) 70%,transparent);z-index:40;">
        <button id="generateBtn" class="btn btn-primary btn-full" disabled>Generate my responses →</button>
      </div>
    </div>
  `
}

function renderProfileBar(profile) {
  return `
    <div style="background:var(--s3);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <div style="font-size:10px;color:var(--muted);font-weight:600;">Your profile:</div>
      <div style="background:var(--s4);border:1px solid var(--border2);border-radius:20px;padding:4px 9px;font-size:11px;color:var(--text2);font-weight:600;">${escapeHtml(profile.role)}</div>
      <div style="background:var(--s4);border:1px solid var(--border2);border-radius:20px;padding:4px 9px;font-size:11px;color:var(--text2);font-weight:600;">${escapeHtml(profile.style)}</div>
      <div id="editProfile" style="font-size:11px;color:var(--accent);cursor:pointer;margin-left:auto;text-decoration:underline;">Change</div>
    </div>
  `
}

function renderRoleSection() {
  const roles = ['New hire', 'Mid-level', 'Senior', 'Sales rep', 'Shift lead', 'Team lead', 'Supervisor', 'Manager']
  return `
    <div style="margin-bottom:20px;">
      <div class="section-label">Your role</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;" id="roleChips">
        ${roles.map(r => `<div class="role-chip" data-role="${escapeAttr(r)}" style="padding:8px 14px;border:1.5px solid var(--border);border-radius:22px;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s;background:var(--s2);">${escapeHtml(r)}</div>`).join('')}
      </div>
    </div>
  `
}

function renderStyleSection() {
  const colors = ['var(--accent)', 'var(--green)', 'var(--blue)', 'var(--gold)']
  return `
    <div style="margin-bottom:20px;">
      <div class="section-label">Your communication style</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" id="styleCards">
        ${STYLES.map((s, i) => `
          <div class="style-card" data-style="${s.key}" style="
            background:var(--s2);border:2px solid var(--border);border-radius:13px;
            padding:13px 11px;cursor:pointer;transition:all .2s;
            position:relative;overflow:hidden;
          ">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;border-radius:13px 13px 0 0;background:${colors[i]};opacity:0;transition:opacity .2s;" class="style-top-bar"></div>
            <div style="font-size:24px;margin-bottom:7px;">${s.emoji}</div>
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px;">${s.key}</div>
            <div style="font-size:11px;color:var(--muted);line-height:1.4;">${s.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderRelationshipSection() {
  return `
    <div style="margin-bottom:16px;">
      <div class="section-label">Who is this for?</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;" id="relationshipChips">
        ${RELATIONSHIPS.map(item => `
          <button class="relationship-chip" data-relationship="${escapeAttr(item.key)}" data-label="${escapeAttr(item.label)}" style="background:var(--s2);border:1.5px solid var(--border);border-radius:20px;padding:8px 10px;font-size:12px;font-weight:700;color:var(--muted);cursor:pointer;font-family:var(--font-body);display:flex;align-items:center;gap:6px;transition:all .2s;">
            <span>${item.icon}</span><span>${escapeHtml(item.label)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `
}

// ── Bind ──────────────────────────────────────

export function bindSession({ profile, onBack, onResource, onGenerate }) {
  // Restore session state from profile
  sessionState = {
    role: profile?.role || '',
    style: profile?.style || '',
    relationship: '',
    situation: '',
    situationText: '',
    inputMethod: 'voice',
    tab: 'voice',
  }

  // Back button
  document.getElementById('sessionBack')?.addEventListener('click', () => {
    onBack?.()
  })

  document.getElementById('sessionResource')?.addEventListener('click', () => {
    onResource?.()
  })

  // Edit profile
  document.getElementById('editProfile')?.addEventListener('click', () => {
    // Clear profile and reload session
    saveProfile({ role: '', style: '' })
    window.location.reload()
  })

  // Role chips
  document.querySelectorAll('.role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.role-chip').forEach(c => {
        c.style.borderColor = 'var(--border)'
        c.style.color = 'var(--muted)'
        c.style.background = 'var(--s2)'
        c.style.fontWeight = '600'
      })
      chip.style.borderColor = 'var(--accent)'
      chip.style.color = 'var(--accent)'
      chip.style.background = 'var(--accent-dim)'
      chip.style.fontWeight = '700'
      sessionState.role = chip.dataset.role
      saveProfile({ role: sessionState.role })
      checkCta()
    })
  })

  // Style cards
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.style-card').forEach(c => {
        c.style.borderColor = 'var(--border)'
        c.style.background = 'var(--s2)'
        c.querySelector('.style-top-bar').style.opacity = '0'
      })
      card.style.borderColor = 'var(--accent)'
      card.style.background = 'var(--accent-dim)'
      card.querySelector('.style-top-bar').style.opacity = '1'
      sessionState.style = card.dataset.style
      saveProfile({ style: sessionState.style })
      checkCta()
    })
  })

  // Situation grid
  document.querySelectorAll('.relationship-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.relationship-chip').forEach(c => {
        c.style.borderColor = 'var(--border)'
        c.style.color = 'var(--muted)'
        c.style.background = 'var(--s2)'
      })
      chip.style.borderColor = 'var(--accent)'
      chip.style.color = 'var(--accent)'
      chip.style.background = 'var(--accent-dim)'
      sessionState.relationship = chip.dataset.relationship
      checkCta()
    })
  })

  // Situation grid
  document.querySelectorAll('.sit-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sit-item').forEach(s => {
        s.style.borderColor = 'var(--border)'
        s.style.background = 'var(--s2)'
        s.querySelector('.sit-arr').style.color = 'var(--muted2)'
      })
      item.style.borderColor = 'var(--accent)'
      item.style.background = 'var(--accent-dim)'
      item.querySelector('.sit-arr').style.color = 'var(--accent)'
      sessionState.situation = item.dataset.name
      sessionState.situationText = ''
      // Clear text input
      const ta = document.getElementById('ftTa')
      if (ta) ta.value = ''
      checkCta()
    })
  })

  // Input tabs
  document.getElementById('tabVoice')?.addEventListener('click', () => switchTab('voice'))
  document.getElementById('tabText')?.addEventListener('click', () => switchTab('text'))

  // Text input
  document.getElementById('ftTa')?.addEventListener('input', (e) => {
    const val = e.target.value.trim()
    if (val.length > 0) {
      // Clear situation selection
      document.querySelectorAll('.sit-item').forEach(s => {
        s.style.borderColor = 'var(--border)'
        s.style.background = 'var(--s2)'
      })
      sessionState.situation = ''
      sessionState.situationText = val
    } else {
      sessionState.situationText = ''
    }
    checkCta()
  })

  // Voice input
  setupVoice()

  // Generate button
  document.getElementById('generateBtn')?.addEventListener('click', () => {
    if (!document.getElementById('generateBtn').disabled) {
      onGenerate({
        situation:    sessionState.situation,
        situationText: sessionState.situationText || sessionState.situation,
        relationship: sessionState.relationship,
        inputMethod:  sessionState.inputMethod,
      })
    }
  })

  // Initial CTA check
  checkCta()
}

function switchTab(tab) {
  sessionState.tab = tab
  sessionState.inputMethod = tab

  document.getElementById('tabVoice')?.classList.toggle('active', tab === 'voice')
  document.getElementById('tabText')?.classList.toggle('active', tab === 'text')
  document.getElementById('voicePanel').style.display = tab === 'voice' ? 'block' : 'none'
  document.getElementById('textPanel').style.display  = tab === 'text'  ? 'block' : 'none'

  if (tab === 'text') voiceInput?.stop()
}

function setupVoice() {
  voiceInput = new VoiceInput({
    onTranscript(text, isFinal) {
      const box = document.getElementById('transcriptBox')
      if (box) {
        box.style.display = 'block'
        box.textContent = text
        box.style.fontStyle = isFinal ? 'normal' : 'italic'
        box.style.color = isFinal ? 'var(--text)' : 'var(--muted)'
      }
    },
    onFinal(text) {
      sessionState.situationText = text
      sessionState.situation = ''
      document.querySelectorAll('.sit-item').forEach(s => {
        s.style.borderColor = 'var(--border)'
        s.style.background = 'var(--s2)'
      })
      showTranscriptActions()
      setMicState('done')
      checkCta()
    },
    onStateChange(state) {
      setMicState(state)
      const waveform = document.getElementById('waveform')
      if (waveform) {
        waveform.style.opacity = state === 'listening' ? '1' : '0'
        waveform.classList.toggle('active', state === 'listening')
      }
      document.getElementById('inputZone')?.style.setProperty('border-color', state === 'listening' ? 'var(--accent)' : 'var(--border)')
    },
    onError(msg) {
      const status = document.getElementById('micStatus')
      if (status) { status.textContent = msg; status.style.color = 'var(--error)' }
    },
  })

  if (!voiceInput.isSupported) {
    document.getElementById('voiceUnsupported').style.display = 'block'
    document.getElementById('micUI').style.display = 'none'
    switchTab('text')
    return
  }

  document.getElementById('micBtn')?.addEventListener('click', () => {
    if (voiceInput.isListening) {
      voiceInput.stop()
    } else {
      sessionState.situationText = ''
      document.getElementById('transcriptBox').style.display = 'none'
      document.getElementById('transcriptActions').style.display = 'none'
      voiceInput.start()
    }
  })

  document.getElementById('taEdit')?.addEventListener('click', () => {
    switchTab('text')
    const ta = document.getElementById('ftTa')
    if (ta) { ta.value = voiceInput.transcript; ta.focus() }
    sessionState.situationText = voiceInput.transcript
    checkCta()
  })

  document.getElementById('taRedo')?.addEventListener('click', () => {
    voiceInput.reset()
    sessionState.situationText = ''
    document.getElementById('transcriptBox').style.display = 'none'
    document.getElementById('transcriptActions').style.display = 'none'
    checkCta()
    setTimeout(() => voiceInput.start(), 300)
  })

  document.getElementById('taUse')?.addEventListener('click', () => {
    sessionState.inputMethod = 'voice'
    checkCta()
    document.getElementById('generateBtn')?.click()
  })
}

function setMicState(state) {
  const btn  = document.getElementById('micBtn')
  const icon = document.getElementById('micIcon')
  const status = document.getElementById('micStatus')

  const states = {
    idle:      { ico: '🎤', msg: 'Tap to speak your situation',   color: 'var(--muted)',  bg: 'var(--s3)', border: 'var(--border2)' },
    listening: { ico: '⏹',  msg: 'Listening... tap to stop',       color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'var(--accent)' },
    done:      { ico: '✓',  msg: 'Got it — tap to record again',   color: 'var(--green)',  bg: 'var(--s3)', border: 'var(--border2)' },
    error:     { ico: '🎤', msg: 'Tap to try again',               color: 'var(--error)',  bg: 'var(--s3)', border: 'var(--border2)' },
  }

  const s = states[state] || states.idle
  if (icon)   icon.textContent = s.ico
  if (status) { status.textContent = s.msg; status.style.color = s.color }
  if (btn)    {
    btn.style.background    = s.bg
    btn.style.borderColor   = s.border

    // Ripple rings for listening state
    btn.className = state === 'listening' ? 'mic-btn listening' : 'mic-btn'
  }
}

function showTranscriptActions() {
  const actions = document.getElementById('transcriptActions')
  if (actions) {
    actions.style.display = 'flex'
  }
}

function checkCta() {
  const hasSit = sessionState.situation || (sessionState.situationText && sessionState.situationText.length > 8)
  const hasRelationship = sessionState.relationship
  const hasRole = sessionState.role
  const hasStyle = sessionState.style

  // Check if profile setup is shown
  const roleSection = document.getElementById('roleChips')
  const needsProfile = !!roleSection

  const profileOk = needsProfile ? (hasRole && hasStyle) : true
  const ready = hasSit && hasRelationship && profileOk

  const btn = document.getElementById('generateBtn')
  if (btn) btn.disabled = !ready
}
