/**
 * CommKit — Main Entry Point
 * Initialises the app, handles routing between screens,
 * registers the service worker, and manages PWA install prompt
 */

import './style.css'

import { clearEncryptedStorage, getProfile, hasProfile, incrementSession, getSessionCount, getTags, addTag, removeTag, getHistory, addToHistory, isEncryptionConfigured, isEncryptionUnlocked, setupLocalEncryption, unlockLocalEncryption, isInstalled, markInstalled, isNudgeDismissed, dismissNudge, isIosNudgeShown, markIosNudgeShown } from './utils/storage.js'
import { initToast, showToast } from './utils/toast.js'
import { initShare } from './utils/share.js'
import { renderPrivacyLock, bindPrivacyLock } from './screens/privacyLock.js'
import { renderWelcome, bindWelcome } from './screens/welcome.js'
import { renderHome, bindHome } from './screens/home.js'
import { renderHistory, bindHistory } from './screens/history.js'
import { renderResourceCenter, bindResourceCenter } from './screens/resourceCenter.js'
import { renderSession, bindSession } from './screens/session.js'
import { renderProcessing, animateProcessingSteps, showProcessingError } from './screens/processing.js'
import { renderResult, bindResult } from './screens/result.js'
import { generateResponses, generateResourceBrief } from './features/api.js'
import { recordSignal, SIGNAL_TYPES, getLayerInfo } from './features/signals.js'

// ── App State ────────────────────────────────

const appState = {
  currentScreen: null,
  profile: null,
  currentResult: null,
  sessionData: {
    situation: '',
    situationText: '',
    inputMethod: 'voice',
  },
}

// ── Boot ─────────────────────────────────────

async function boot() {
  const app = document.getElementById('app')

  // Status bar (always visible)
  app.innerHTML = `
    <div class="status-bar">
      <span class="time">${getTime()}</span>
      <div class="status-icons"><span>●●●●</span><span>WiFi</span><span>🔋</span></div>
    </div>
    <div id="screenMount"></div>
  `

  // Update clock every minute
  setInterval(() => {
    const el = app.querySelector('.time')
    if (el) el.textContent = getTime()
  }, 60000)

  // Init utilities
  initToast()
  initShare()

  if (!isEncryptionUnlocked()) {
    showPrivacyLock()
    return
  }

  startApp()
}

function startApp() {
  // Completed sessions drive Layers and install timing.
  const sessionNum = getSessionCount()
  appState.profile = getProfile()


  // Register service worker
  registerSW()

  // PWA install handling
  setupInstallPrompt(sessionNum)

  // Route to correct first screen
  const isNew = !hasProfile()
  if (isNew) {
    showWelcome()
  } else {
    showHome()
  }

  // Network status
  window.addEventListener('offline', () => showToast('📡 You\'re offline — profile still works'))
  window.addEventListener('online',  () => showToast('✓ Back online'))
}

// ── Screen Router ────────────────────────────

function showPrivacyLock(error = '') {
  const mode = isEncryptionConfigured() ? 'unlock' : 'setup'
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderPrivacyLock({ mode, error })
  bindPrivacyLock({
    mode,
    onSubmit: async ({ passphrase, confirm }) => {
      try {
        if (passphrase.length < 8) {
          showPrivacyLock('Use at least 8 characters.')
          return
        }

        if (mode === 'setup') {
          if (passphrase !== confirm) {
            showPrivacyLock('Passphrases do not match.')
            return
          }
          await setupLocalEncryption(passphrase)
        } else {
          await unlockLocalEncryption(passphrase)
        }

        startApp()
      } catch {
        showPrivacyLock('Could not unlock. Check your passphrase.')
      }
    },
    onReset: () => {
      clearEncryptedStorage()
      showPrivacyLock()
    },
  })
  appState.currentScreen = 'privacy-lock'
}

function showWelcome() {
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderWelcome({})
  bindWelcome({ onStart: showSession })
  appState.currentScreen = 'welcome'
}

function showHome() {
  appState.profile = getProfile()
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderHome({
    profile: appState.profile,
    tags: getTags(),
    layerInfo: getLayerInfo(),
    history: getHistory(),
    sessionCount: getSessionCount(),
  })
  bindHome({
    onStart: showSession,
    onResource: showResourceCenter,
    onHistory: showHistory,
    onRemoveTag: (label) => {
      removeTag(label)
      showHome()
    },
  })
  appState.currentScreen = 'home'
}

function showHistory() {
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderHistory({ history: getHistory() })
  bindHistory({
    onBack: showHome,
    onNewSession: showSession,
  })
  appState.currentScreen = 'history'
}

function showResourceCenter(props = {}) {
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderResourceCenter(props)
  bindResourceCenter({
    onBack: hasProfile() ? showHome : showWelcome,
    onGenerate: handleResourceGenerate,
  })
  appState.currentScreen = 'resource'
}

function showSession() {
  appState.profile = getProfile()
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderSession({ profile: appState.profile })
  bindSession({
    profile: appState.profile,
    onBack: hasProfile() ? showHome : showWelcome,
    onResource: showResourceCenter,
    onGenerate: handleGenerate,
  })
  appState.currentScreen = 'session'
}

async function handleGenerate({ situation, situationText, inputMethod }) {
  appState.sessionData = { situation, situationText, inputMethod }
  const profile = getProfile()
  const sessionCount = getSessionCount() + 1

  const profileData = {
    role:         profile.role || 'Professional',
    style:        profile.style || 'Balanced',
    situation:    situationText || situation,
    sessionCount,
    inputMethod,
  }

  // Show processing
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderProcessing(profileData)
  animateProcessingSteps()
  appState.currentScreen = 'processing'

  // Record signal
  recordSignal(SIGNAL_TYPES.INPUT_METHOD, inputMethod)
  recordSignal(SIGNAL_TYPES.SITUATION_TYPE, situation)

  try {
    // Wait minimum animation time + actual API response
    const [result] = await Promise.all([
      generateResponses(profileData),
      new Promise(resolve => setTimeout(resolve, 3800)),
    ])

    const completedSessions = incrementSession()
    addStarterTags(profile)
    addToHistory({
      situation: situationText || situation,
      situationTitle: result.situationTitle,
      inputMethod,
      framework: result.framework?.name,
      receiver: getReceiverLabel(situationText || situation),
      relationship: getRelationshipCategory(situationText || situation),
      responses: getHistoryResponses(result),
    })

    appState.currentResult = result
    appState.profile = getProfile()
    showResult(result, situation)
    maybeShowInstallPrompt(completedSessions)

  } catch (err) {
    console.error('[CommKit] Generate error:', err)
    showProcessingError(err.message || 'Something went wrong')
  }
}

function showResult(result, situationLabel) {
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderResult({
    result,
    situationLabel,
    profile: getProfile(),
    sessionData: appState.sessionData,
  })
  bindResult({
    onBack: showSession,
    onNewSession: showSession,
    onHome: showHome,
    onResource: showResourceCenter,
    onVersionUsed: (versionLabel) => {
      recordSignal(SIGNAL_TYPES.RESPONSE_CHOSEN, versionLabel)
      showToast('✓ Signal recorded')
    },
    onFormatChosen: (format) => {
      recordSignal(SIGNAL_TYPES.DELIVERY_FORMAT, format)
    },
    onFrameworkOpened: () => {
      recordSignal(SIGNAL_TYPES.FRAMEWORK_OPENED, true)
    },
    onFeedback: (type) => {
      recordSignal(SIGNAL_TYPES.FEEDBACK_GIVEN, type)
    },
    onTagAccepted: (tag) => {
      addTag(tag)
      showToast('✓ Tag added to your profile')
    },
  })
  appState.currentScreen = 'result'
}

async function handleResourceGenerate(payload) {
  const hasText = payload.documentText && payload.documentText.length >= 40
  const hasSupportedAttachments = (payload.attachments || []).some(attachment => attachment.data)

  if (!hasText && !hasSupportedAttachments) {
    showResourceCenter({
      error: 'Add enough pasted text, upload a PDF/image, or use the camera first.',
      form: payload,
    })
    return
  }

  showResourceCenter({ isLoading: true, form: payload })

  try {
    const brief = await generateResourceBrief(payload)
    addToHistory({
      kind: 'resource',
      situation: getResourceHistorySummary(payload),
      situationTitle: brief.title || payload.title || 'Resource Brief',
      inputMethod: 'document',
      framework: 'Resource Center',
      receiver: payload.audience || 'stakeholder',
      relationship: getRelationshipCategory(`${payload.audience || ''} ${payload.context || ''}`),
      resourceBrief: getHistoryResourceBrief(brief),
    })
    showToast('✓ Brief saved to history')
    showResourceCenter({ brief })
  } catch (err) {
    console.error('[CommKit] Resource Center error:', err)
    showResourceCenter({
      error: err.message || 'Could not generate resource brief. Please try again.',
      form: payload,
    })
  }
}

function getResourceHistorySummary(payload) {
  const fileCount = (payload.attachments || []).filter(attachment => attachment.kind !== 'text').length
  const title = payload.title || 'Uploaded document'
  const audience = payload.audience ? ` for ${payload.audience}` : ''
  const files = fileCount ? ` · ${fileCount} file${fileCount === 1 ? '' : 's'}` : ''
  return `${title}${audience}${files}`
}

// ── Service Worker ───────────────────────────

function registerSW() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('[CommKit] SW registered:', reg.scope)

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner()
          }
        })
      })
    } catch (err) {
      console.warn('[CommKit] SW registration failed:', err)
    }
  })
}

function showUpdateBanner() {
  const banner = document.createElement('div')
  banner.style.cssText = `
    position:fixed;top:0;left:50%;transform:translateX(-50%);
    width:100%;max-width:390px;
    background:var(--accent);color:var(--on-accent);
    padding:12px 20px;text-align:center;
    font-family:var(--font-body);font-size:13px;font-weight:700;
    z-index:9999;cursor:pointer;
  `
  banner.textContent = '✨ CommKit updated — tap to refresh'
  banner.addEventListener('click', () => window.location.reload())
  document.body.appendChild(banner)
}

// ── PWA Install ──────────────────────────────

let deferredInstallPrompt = null

function setupInstallPrompt(sessionNum) {
  // Android Chrome install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredInstallPrompt = e

    maybeShowInstallPrompt(sessionNum, 8000)
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    markInstalled()
    hideInstallNudge()
    showToast('✓ CommKit added to your home screen')
  })

  // iOS Safari prompt
  if (isIOS() && !isStandalone() && !isIosNudgeShown() && sessionNum >= 3) {
    setTimeout(() => showIOSNudge(), 12000)
  }
}

function maybeShowInstallPrompt(sessionNum, delay = 1200) {
  if (sessionNum < 3 || isInstalled() || isNudgeDismissed()) return

  if (deferredInstallPrompt) {
    setTimeout(() => showAndroidNudge(), delay)
    return
  }

  if (isIOS() && !isStandalone() && !isIosNudgeShown()) {
    setTimeout(() => showIOSNudge(), delay)
  }
}

function showAndroidNudge() {
  if (isInstalled() || isNudgeDismissed()) return

  const nudge = document.createElement('div')
  nudge.id = 'installNudge'
  nudge.className = 'install-nudge'
  nudge.innerHTML = `
    <div style="font-size:32px;flex-shrink:0;">📱</div>
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px;">Add CommKit to your home screen</div>
      <div style="font-size:11px;color:var(--muted);line-height:1.5;">Open it like any app — no App Store needed</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
      <button id="nudgeAdd" class="btn btn-primary" style="padding:8px 14px;font-size:12px;">Add</button>
      <button id="nudgeDismiss" style="background:transparent;border:none;color:var(--muted);font-size:11px;cursor:pointer;font-family:var(--font-body);">Not now</button>
    </div>
  `

  document.body.appendChild(nudge)

  document.getElementById('nudgeAdd')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return
    deferredInstallPrompt.prompt()
    const { outcome } = await deferredInstallPrompt.userChoice
    if (outcome === 'dismissed') dismissAndHideNudge()
    deferredInstallPrompt = null
  })

  document.getElementById('nudgeDismiss')?.addEventListener('click', dismissAndHideNudge)
}

function showIOSNudge() {
  markIosNudgeShown()
  const nudge = document.createElement('div')
  nudge.id = 'installNudge'
  nudge.className = 'install-nudge'
  nudge.style.flexDirection = 'column'
  nudge.style.gap = '10px'
  nudge.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="font-size:24px;">📱</div>
      <div style="font-size:13px;font-weight:800;color:var(--text);flex:1;">Add CommKit to your home screen</div>
      <button id="nudgeDismiss" style="background:transparent;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1;">×</button>
    </div>
    <div style="font-size:12px;color:var(--muted);line-height:1.65;">
      Tap <strong style="color:var(--text2);">Share ⬆️</strong> at the bottom of Safari, then tap <strong style="color:var(--text2);">"Add to Home Screen"</strong>.
    </div>
  `
  document.body.appendChild(nudge)
  document.getElementById('nudgeDismiss')?.addEventListener('click', hideInstallNudge)
}

function hideInstallNudge() {
  document.getElementById('installNudge')?.remove()
}

function dismissAndHideNudge() {
  dismissNudge()
  hideInstallNudge()
}

function addStarterTags(profile) {
  const currentTags = getTags()
  if (currentTags.length > 0) return

  if (profile.style) {
    addTag({ label: profile.style, type: 'style' })
  }

  if (profile.role) {
    addTag({ label: profile.role, type: 'growth' })
  }
}

function getHistoryResponses(result) {
  if (!Array.isArray(result?.responses)) return []

  return result.responses.slice(0, 3).map(response => ({
    label: response.label || 'Response',
    tone: response.tone || '',
    text: response.text || '',
    shortText: response.shortText || response.short || '',
    emailText: response.emailText || response.email || '',
  })).filter(response => response.text)
}

function getHistoryResourceBrief(brief) {
  return {
    title: brief.title || 'Resource Brief',
    summary: Array.isArray(brief.summary) ? brief.summary : [],
    presentationOutline: Array.isArray(brief.presentationOutline) ? brief.presentationOutline : [],
    talkingPoints: Array.isArray(brief.talkingPoints) ? brief.talkingPoints : [],
    emailDraft: brief.emailDraft || '',
    questionsToExpect: Array.isArray(brief.questionsToExpect) ? brief.questionsToExpect : [],
  }
}

function getReceiverLabel(situation = '') {
  const text = situation.toLowerCase()

  if (/\b(mom|mother|dad|father|parent|sister|brother|spouse|wife|husband|partner|child|son|daughter|family)\b/.test(text)) return 'family'
  if (/\b(friend|roommate|neighbor)\b/.test(text)) return 'friend'
  if (/\b(manager|boss|supervisor|lead|director)\b/.test(text)) return 'manager'
  if (/\b(employee|team member|direct report|staff|worker)\b/.test(text)) return 'direct report'
  if (/\b(coworker|colleague|peer|teammate)\b/.test(text)) return 'coworker'
  if (/\b(client|customer|vendor|partner)\b/.test(text)) return 'client'
  if (/\b(personal|relationship|dating|boyfriend|girlfriend)\b/.test(text)) return 'personal'

  return 'the other person'
}

function getRelationshipCategory(text = '') {
  const value = text.toLowerCase()

  if (/\b(mom|mother|dad|father|parent|sister|brother|spouse|wife|husband|child|son|daughter|family)\b/.test(value)) return 'family'
  if (/\b(friend|roommate|neighbor)\b/.test(value)) return 'friend'
  if (/\b(personal|relationship|dating|boyfriend|girlfriend)\b/.test(value)) return 'personal'
  if (/\b(manager|boss|supervisor|lead|director)\b/.test(value)) return 'manager'
  if (/\b(client|customer|vendor|partner)\b/.test(value)) return 'client'
  if (/\b(coworker|colleague|peer|teammate)\b/.test(value)) return 'peer'
  if (/\b(employee|team member|direct report|staff|worker)\b/.test(value)) return 'direct-report'

  return 'professional'
}

// ── Helpers ──────────────────────────────────

function getTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return ('standalone' in window.navigator) && window.navigator.standalone
}

// ── Go ────────────────────────────────────────

boot()
