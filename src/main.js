/**
 * CommKit — Main Entry Point
 * Initialises the app, handles routing between screens,
 * registers the service worker, and manages PWA install prompt
 */

import './style.css'

import { clearEncryptedStorage, getProfile, hasProfile, incrementSession, getSessionCount, getTags, addTag, removeTag, getHistory, addToHistory, updateHistoryEntry, makeRecipientKey, getRecipientMemory, saveRecipientMemory, upsertConversationThread, isEncryptionConfigured, isEncryptionUnlocked, setupLocalEncryption, unlockLocalEncryption, isInstalled, markInstalled, isNudgeDismissed, dismissNudge, isIosNudgeShown, markIosNudgeShown } from './utils/storage.js'
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
import { generateResponses, refineResponses, generateResourceBrief, refineResourceBrief } from './features/api.js'
import { recordSignal, SIGNAL_TYPES, getLayerInfo } from './features/signals.js'

// ── App State ────────────────────────────────

const appState = {
  currentScreen: null,
  profile: null,
  currentResult: null,
  currentHistoryId: null,
  currentProfileData: null,
  currentResourceInput: null,
  currentResourceBrief: null,
  currentSelectedResponseLabel: '',
  sessionData: {
    situation: '',
    situationText: '',
    relationship: '',
    recipientLabel: '',
    recipientKey: '',
    recipientMemory: null,
    conversationThread: null,
    supportingDocs: null,
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
    <button id="feedbackButton" aria-label="Send feedback to CommKit" style="position:absolute;right:18px;bottom:86px;z-index:80;background:var(--s2);border:1px solid var(--border);border-radius:999px;color:var(--text2);font-family:var(--font-body);font-size:11px;font-weight:800;padding:8px 11px;box-shadow:0 8px 22px rgba(0,0,0,.35);cursor:pointer;">CommKit feedback</button>
  `

  // Update clock every minute
  setInterval(() => {
    const el = app.querySelector('.time')
    if (el) el.textContent = getTime()
  }, 60000)

  // Init utilities
  initToast()
  initShare()
  initFeedbackButton()

  if (!isEncryptionUnlocked()) {
    if (isEncryptionConfigured()) {
      showPrivacyLock()
      return
    }

    showWelcome()
    return
  }

  startApp()
}

function startApp(initialScreen = '') {
  // Completed sessions drive Layers and install timing.
  const sessionNum = getSessionCount()
  appState.profile = getProfile()


  // Register service worker
  registerSW()

  // PWA install handling
  setupInstallPrompt(sessionNum)

  // Route to correct first screen
  if (initialScreen === 'session') {
    showSession()
  } else if (!hasProfile()) {
    showWelcome()
  } else {
    showHome()
  }

  // Network status
  window.addEventListener('offline', () => showToast('📡 You\'re offline — profile still works'))
  window.addEventListener('online',  () => showToast('✓ Back online'))
}

// ── Screen Router ────────────────────────────

function showPrivacyLock(error = '', afterUnlock = startApp) {
  const mode = isEncryptionConfigured() ? 'unlock' : 'setup'
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderPrivacyLock({ mode, error })
  bindPrivacyLock({
    mode,
    onSubmit: async ({ passphrase, confirm }) => {
      try {
        if (passphrase.length < 8) {
          showPrivacyLock('Use at least 8 characters.', afterUnlock)
          return
        }

        if (mode === 'setup') {
          if (passphrase !== confirm) {
            showPrivacyLock('Passphrases do not match.', afterUnlock)
            return
          }
          await setupLocalEncryption(passphrase)
        } else {
          await unlockLocalEncryption(passphrase)
        }

        afterUnlock()
      } catch {
        showPrivacyLock('Could not unlock. Check your passphrase.', afterUnlock)
      }
    },
    onReset: () => {
      clearEncryptedStorage()
      showWelcome()
    },
  })
  appState.currentScreen = 'privacy-lock'
}

function showWelcome() {
  const mount = document.getElementById('screenMount')
  mount.innerHTML = renderWelcome({})
  bindWelcome({
    onStart: () => {
      if (!isEncryptionUnlocked()) {
        showPrivacyLock('', () => startApp('session'))
        return
      }
      showSession()
    },
  })
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
    onRefine: handleResourceRefine,
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
    onGenerate: handleGenerate,
  })
  appState.currentScreen = 'session'
}

async function handleGenerate({ situation, situationText, relationship, recipientLabel, supportingDocs, conversationThread, inputMethod }) {
  const recipientKey = makeRecipientKey(relationship, recipientLabel)
  const recipientMemory = getRecipientMemory(recipientKey)
  appState.sessionData = { situation, situationText, relationship, recipientLabel, recipientKey, recipientMemory, conversationThread, supportingDocs, inputMethod }
  appState.currentSelectedResponseLabel = ''
  const profile = getProfile()
  const sessionCount = getSessionCount() + 1

  const profileData = {
    role:         profile.role || 'Professional',
    style:        profile.style || 'Balanced',
    situation:    situationText || situation,
    relationship,
    recipientLabel,
    recipientMemory,
    conversationThread,
    supportingDocs,
    sessionCount,
    inputMethod,
  }
  appState.currentProfileData = profileData

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
    const resultWithThread = { ...result, refinements: [] }
    const history = addToHistory({
      situation: situationText || situation,
      situationTitle: resultWithThread.situationTitle,
      inputMethod,
      framework: resultWithThread.framework?.name,
      frameworkDetail: resultWithThread.framework || null,
      receiver: recipientLabel,
      recipientLabel,
      recipientKey,
      relationship: relationship || getRelationshipCategory(situationText || situation),
      threadId: conversationThread?.id || null,
      threadTitle: conversationThread?.title || null,
      supportingDocs: getSupportingDocsSummary(supportingDocs),
      responses: getHistoryResponses(resultWithThread),
      refinements: [],
    })
    saveRecipientMemory(buildRecipientMemory({
      current: recipientMemory,
      recipientKey,
      recipientLabel,
      relationship,
      situation: situationText || situation,
      result: resultWithThread,
      profile,
    }))
    const updatedThread = upsertConversationThread(buildConversationThread({
      current: conversationThread,
      recipientKey,
      recipientLabel,
      relationship,
      situation: situationText || situation,
      result: resultWithThread,
      profile,
    }))[0]

    appState.currentHistoryId = history[0]?.id || null
    appState.currentResult = resultWithThread
    appState.sessionData.conversationThread = updatedThread
    appState.currentProfileData = { ...profileData, conversationThread: updatedThread }
    if (appState.currentHistoryId) {
      updateHistoryEntry(appState.currentHistoryId, {
        threadId: updatedThread?.id || null,
        threadTitle: updatedThread?.title || null,
      })
    }
    appState.profile = getProfile()
    showResult(resultWithThread, situation)
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
    contextPack: buildContextPack({
      result,
      sessionData: appState.sessionData,
      profile: getProfile(),
      stakeholderSafe: false,
    }),
    stakeholderContextPack: buildContextPack({
      result,
      sessionData: appState.sessionData,
      profile: getProfile(),
      stakeholderSafe: true,
    }),
  })
  bindResult({
    onBack: showSession,
    onNewSession: showSession,
    onHome: showHome,
    onVersionUsed: (versionLabel) => {
      appState.currentSelectedResponseLabel = versionLabel
      recordSignal(SIGNAL_TYPES.RESPONSE_CHOSEN, versionLabel)
      if (appState.currentHistoryId) {
        updateHistoryEntry(appState.currentHistoryId, { versionUsed: versionLabel })
      }
      saveRecipientMemory(buildRecipientMemory({
        current: getRecipientMemory(appState.sessionData.recipientKey),
        recipientKey: appState.sessionData.recipientKey,
        recipientLabel: appState.sessionData.recipientLabel,
        relationship: appState.sessionData.relationship,
        situation: appState.sessionData.situationText || appState.sessionData.situation,
        result: appState.currentResult,
        profile: getProfile(),
        selectedLabel: versionLabel,
      }))
      const updatedThread = upsertConversationThread(buildConversationThread({
        current: appState.sessionData.conversationThread,
        recipientKey: appState.sessionData.recipientKey,
        recipientLabel: appState.sessionData.recipientLabel,
        relationship: appState.sessionData.relationship,
        situation: appState.sessionData.situationText || appState.sessionData.situation,
        result: appState.currentResult,
        profile: getProfile(),
        selectedLabel: versionLabel,
      }))[0]
      appState.sessionData.conversationThread = updatedThread
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
    onRefine: handleResponseRefine,
    onCollateral: handleResponseCollateral,
  })
  appState.currentScreen = 'result'
}

async function handleResponseRefine(instruction) {
  const current = appState.currentResult
  if (!current) throw new Error('No response to refine yet')

  try {
    const refinements = current.refinements || []
    const refined = await refineResponses({
      profileData: appState.currentProfileData || {},
      currentResult: stripUiState(current),
      instruction,
      refinements,
    })
    const nextRefinements = [
      ...refinements,
      {
        request: instruction,
        note: refined.refinementNote || 'Responses updated.',
        timestamp: Date.now(),
      },
    ]
    const updated = { ...refined, refinements: nextRefinements }

    appState.currentResult = updated
    if (appState.currentHistoryId) {
      updateHistoryEntry(appState.currentHistoryId, {
        situationTitle: updated.situationTitle,
        framework: updated.framework?.name || null,
        frameworkDetail: updated.framework || null,
        responses: getHistoryResponses(updated),
        refinements: nextRefinements,
      })
    }
    saveRecipientMemory(buildRecipientMemory({
      current: getRecipientMemory(appState.sessionData.recipientKey),
      recipientKey: appState.sessionData.recipientKey,
      recipientLabel: appState.sessionData.recipientLabel,
      relationship: appState.sessionData.relationship,
      situation: appState.sessionData.situationText || appState.sessionData.situation,
      result: updated,
      profile: getProfile(),
      selectedLabel: appState.currentSelectedResponseLabel,
    }))
    const updatedThread = upsertConversationThread(buildConversationThread({
      current: appState.sessionData.conversationThread,
      recipientKey: appState.sessionData.recipientKey,
      recipientLabel: appState.sessionData.recipientLabel,
      relationship: appState.sessionData.relationship,
      situation: appState.sessionData.situationText || appState.sessionData.situation,
      result: updated,
      profile: getProfile(),
      selectedLabel: appState.currentSelectedResponseLabel,
    }))[0]
    appState.sessionData.conversationThread = updatedThread
    appState.currentProfileData = { ...(appState.currentProfileData || {}), conversationThread: updatedThread }
    showToast('✓ Responses refined')
    showResult(updated, appState.sessionData.situation)
  } catch (err) {
    showResult(current, appState.sessionData.situation)
    throw err
  }
}

async function handleResponseCollateral() {
  const current = appState.currentResult
  if (!current) return
  const supportingDocs = appState.sessionData.supportingDocs || {}

  const payload = {
    title: `${current.situationTitle || 'Conversation'} collateral`,
    audience: appState.sessionData.recipientLabel || getRelationshipLabel(appState.sessionData.relationship, ''),
    recipientLabel: appState.sessionData.recipientLabel,
    recipientKey: appState.sessionData.recipientKey,
    relationship: appState.sessionData.relationship,
    recipientMemory: getRecipientMemory(appState.sessionData.recipientKey),
    source: 'response',
    documentText: buildResponseCollateralContext(current, supportingDocs),
    context: `Create a summary, presentation outline, talking points, and email follow-up for ${appState.sessionData.recipientLabel || 'this recipient'}.`,
    attachments: (supportingDocs.attachments || []).filter(attachment => attachment.data),
  }

  appState.currentResourceInput = payload
  showResourceCenter({ isLoading: true, form: payload })

  try {
    const brief = await generateResourceBrief(payload)
    const briefWithThread = { ...brief, refinements: [] }
    const history = addToHistory({
      kind: 'resource',
      situation: `Collateral for ${appState.sessionData.recipientLabel || 'recipient'} · ${current.situationTitle || 'Generated response'}`,
      situationTitle: briefWithThread.title || 'Response Collateral',
      inputMethod: 'response',
      framework: briefWithThread.methodFramework?.name || 'Supporting Docs',
      frameworkDetail: briefWithThread.methodFramework || null,
      receiver: appState.sessionData.recipientLabel,
      recipientLabel: appState.sessionData.recipientLabel,
      recipientKey: appState.sessionData.recipientKey,
      relationship: appState.sessionData.relationship,
      resourceBrief: getHistoryResourceBrief(briefWithThread),
      refinements: [],
    })
    appState.currentHistoryId = history[0]?.id || null
    appState.currentResourceBrief = briefWithThread
    showToast('✓ Collateral saved to history')
    showResourceCenter({ brief: briefWithThread, form: payload })
  } catch (err) {
    console.error('[CommKit] Response collateral error:', err)
    showResourceCenter({
      error: err.message || 'Could not generate collateral. Please try again.',
      form: payload,
    })
  }
}

async function handleResourceGenerate(payload) {
  if (!payload.relationship || !payload.recipientLabel || payload.recipientLabel.length < 2) {
    showResourceCenter({
      error: 'Select the relationship and add a name, alias, or group first.',
      form: payload,
    })
    return
  }

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
    const recipientKey = makeRecipientKey(payload.relationship, payload.recipientLabel)
    const enrichedPayload = {
      ...payload,
      recipientKey,
      recipientMemory: getRecipientMemory(recipientKey),
    }
    const brief = await generateResourceBrief(enrichedPayload)
    const briefWithThread = { ...brief, refinements: [] }
    const history = addToHistory({
      kind: 'resource',
      situation: getResourceHistorySummary(enrichedPayload),
      situationTitle: briefWithThread.title || payload.title || 'Supporting Brief',
      inputMethod: 'document',
      framework: briefWithThread.methodFramework?.name || 'Supporting Docs',
      frameworkDetail: briefWithThread.methodFramework || null,
      receiver: enrichedPayload.recipientLabel || enrichedPayload.audience || getRelationshipLabel(enrichedPayload.relationship, ''),
      recipientLabel: enrichedPayload.recipientLabel,
      recipientKey,
      relationship: enrichedPayload.relationship || getRelationshipCategory(`${enrichedPayload.audience || ''} ${enrichedPayload.context || ''}`),
      resourceBrief: getHistoryResourceBrief(briefWithThread),
      refinements: [],
    })
    appState.currentHistoryId = history[0]?.id || null
    appState.currentResourceInput = enrichedPayload
    appState.currentResourceBrief = briefWithThread
    saveRecipientMemory(buildRecipientMemory({
      current: getRecipientMemory(recipientKey),
      recipientKey,
      recipientLabel: enrichedPayload.recipientLabel,
      relationship: enrichedPayload.relationship,
      situation: getResourceHistorySummary(enrichedPayload),
      result: briefWithThread,
      profile: getProfile(),
      source: 'resource',
    }))
    showToast('✓ Brief saved to history')
    showResourceCenter({ brief: briefWithThread })
  } catch (err) {
    console.error('[CommKit] Supporting Docs error:', err)
    showResourceCenter({
      error: err.message || 'Could not generate supporting brief. Please try again.',
      form: payload,
    })
  }
}

async function handleResourceRefine(instruction) {
  const current = appState.currentResourceBrief
  if (!current) throw new Error('No supporting brief to refine yet')

  try {
    const refinements = current.refinements || []
    const refined = await refineResourceBrief({
      originalInput: appState.currentResourceInput || {},
      currentBrief: stripUiState(current),
      instruction,
      refinements,
    })
    const nextRefinements = [
      ...refinements,
      {
        request: instruction,
        note: refined.refinementNote || 'Brief updated.',
        timestamp: Date.now(),
      },
    ]
    const updated = { ...refined, refinements: nextRefinements }

    appState.currentResourceBrief = updated
    if (appState.currentHistoryId) {
      updateHistoryEntry(appState.currentHistoryId, {
        situationTitle: updated.title || 'Supporting Brief',
        framework: updated.methodFramework?.name || 'Supporting Docs',
        frameworkDetail: updated.methodFramework || null,
        resourceBrief: getHistoryResourceBrief(updated),
        refinements: nextRefinements,
      })
    }
    saveRecipientMemory(buildRecipientMemory({
      current: getRecipientMemory(appState.currentResourceInput?.recipientKey),
      recipientKey: appState.currentResourceInput?.recipientKey,
      recipientLabel: appState.currentResourceInput?.recipientLabel,
      relationship: appState.currentResourceInput?.relationship,
      situation: getResourceHistorySummary(appState.currentResourceInput || {}),
      result: updated,
      profile: getProfile(),
      source: 'resource',
    }))
    showToast('✓ Brief refined')
    showResourceCenter({ brief: updated })
  } catch (err) {
    showResourceCenter({ brief: current, form: appState.currentResourceInput || {} })
    throw err
  }
}

function getResourceHistorySummary(payload) {
  const fileCount = (payload.attachments || []).filter(attachment => attachment.kind !== 'text').length
  const title = payload.title || 'Uploaded document'
  const audience = payload.audience ? ` for ${payload.audience}` : ''
  const files = fileCount ? ` · ${fileCount} file${fileCount === 1 ? '' : 's'}` : ''
  return `${title}${audience}${files}`
}

function getSupportingDocsSummary(supportingDocs = {}) {
  const attachments = supportingDocs.attachments || []
  const fileNames = attachments.map(file => file.name).filter(Boolean)
  const hasText = !!String(supportingDocs.documentText || '').trim()

  if (!fileNames.length && !hasText) return null

  return {
    fileCount: fileNames.length,
    fileNames: fileNames.slice(0, 4),
    hasPastedNotes: hasText,
  }
}

function initFeedbackButton() {
  document.getElementById('feedbackButton')?.addEventListener('click', () => {
    const local = 'contact_bj'
    const domain = 'yahoo.com'
    const subject = encodeURIComponent('CommKit feedback')
    const body = encodeURIComponent('Hi CommKit,\n\n')
    window.location.href = `mailto:${local}@${domain}?subject=${subject}&body=${body}`
  })
}

function buildRecipientMemory({ current = null, recipientKey, recipientLabel, relationship, situation, result, profile, selectedLabel = '', source = 'conversation' }) {
  if (!recipientKey) return null

  const title = result?.situationTitle || result?.title || situation || 'Recent conversation'
  const selectedTone = selectedLabel || result?.responses?.[1]?.tone || result?.responses?.[0]?.tone || profile?.style || ''
  const topic = compactText(title, 92)
  const lastNextStep = getMemoryNextStep(result, source)

  return {
    key: recipientKey,
    recipientLabel,
    relationship,
    lastTopic: topic,
    preferredTone: compactText(selectedTone ? `${selectedTone} tone has been useful` : current?.preferredTone || '', 90),
    relationshipNote: compactText(getRelationshipMemoryNote(relationship, profile?.style) || current?.relationshipNote || '', 120),
    lastNextStep: compactText(lastNextStep || current?.lastNextStep || '', 120),
    interactionCount: (current?.interactionCount || 0) + 1,
  }
}

function buildConversationThread({ current = null, recipientKey, recipientLabel, relationship, situation, result, profile, selectedLabel = '', source = 'conversation' }) {
  const responses = getHistoryResponses(result)
  const selected = responses.find(response => response.label === selectedLabel) || responses[1] || responses[0]
  const title = current?.title || result?.situationTitle || result?.title || compactText(situation, 64) || 'Conversation thread'
  const openQuestions = Array.isArray(result?.qaItems)
    ? result.qaItems.map(item => item.question).filter(Boolean).slice(0, 2)
    : current?.openQuestions || []

  return {
    id: current?.id || `thread_${Date.now()}`,
    recipientKey,
    recipientLabel,
    relationship,
    title: compactText(title, 80),
    topicTags: Array.from(new Set([...(current?.topicTags || []), compactText(result?.situationTitle || result?.title || situation, 36)].filter(Boolean))).slice(-5),
    summary: compactText(`Recent topic: ${result?.detectedSummary || result?.summary?.[0] || situation}`, 220),
    lastResponse: compactText(selected?.text || selected?.shortText || result?.refinementNote || '', 180),
    openQuestions,
    lastNextStep: compactText(getMemoryNextStep(result, source) || current?.lastNextStep || '', 140),
    tonePreference: compactText(selected?.tone || selectedLabel || profile?.style || current?.tonePreference || '', 80),
    updatedAt: Date.now(),
  }
}

function buildContextPack({ result, sessionData, profile, stakeholderSafe = false }) {
  const responses = getHistoryResponses(result)
  const selected = responses.find(response => response.label === appState.currentSelectedResponseLabel) || responses[1] || responses[0]
  const thread = sessionData?.conversationThread
  const supportingDocs = getSupportingDocsSummary(sessionData?.supportingDocs || {})
  const qaText = Array.isArray(result?.qaItems) && result.qaItems.length
    ? result.qaItems.slice(0, 3).map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n')
    : ''

  const sections = [
    stakeholderSafe ? 'CommKit Stakeholder Summary' : 'CommKit Context Pack',
    '',
    `Recipient: ${sessionData?.recipientLabel || 'Not specified'}`,
    `Relationship: ${getRelationshipLabel(sessionData?.relationship, 'Not specified')}`,
    thread?.title ? `Thread: ${thread.title}` : '',
    `Topic: ${result?.situationTitle || sessionData?.situationText || sessionData?.situation || 'Conversation'}`,
    '',
    'Situation:',
    sessionData?.situationText || sessionData?.situation || result?.detectedSummary || '',
    '',
    supportingDocs ? `Supporting context: ${supportingDocs.fileCount || 0} file(s)${supportingDocs.hasPastedNotes ? ' + pasted notes' : ''}` : '',
    stakeholderSafe ? '' : `Profile style: ${profile?.style || 'Balanced'}`,
    stakeholderSafe ? '' : result?.framework?.name ? `Model/framework: ${result.framework.name}` : '',
    '',
    stakeholderSafe ? 'Recommended message:' : 'Selected response:',
    selected?.text || result?.responses?.[0]?.text || '',
    '',
    selected?.emailText ? `Email option:\n${selected.emailText}` : '',
    '',
    stakeholderSafe ? '' : result?.coachingTip ? `Coaching note:\n${result.coachingTip}` : '',
    stakeholderSafe ? '' : qaText ? `Questions to expect:\n${qaText}` : '',
    '',
    `Next step: ${thread?.lastNextStep || getMemoryNextStep(result, 'conversation') || 'Follow up clearly.'}`,
  ]

  return sections.filter(line => line !== '').join('\n')
}

function getMemoryNextStep(result, source) {
  if (source === 'resource') {
    const firstPoint = Array.isArray(result?.talkingPoints) ? result.talkingPoints[0] : ''
    return firstPoint || result?.refinementNote || 'Prepared collateral for follow-up.'
  }

  const firstAnswer = Array.isArray(result?.qaItems) ? result.qaItems[0]?.answer : ''
  return firstAnswer || result?.coachingTip || result?.refinementNote || 'Prepared a response for the next conversation.'
}

function getRelationshipMemoryNote(relationship, style) {
  const styleText = style ? `${style.toLowerCase()} style` : 'clear tone'
  const notes = {
    manager: `Use ${styleText}; stay accountable without sounding defensive.`,
    peer: `Use ${styleText}; protect trust and keep next steps clear.`,
    'direct-report': `Use ${styleText}; be clear, fair, and coaching-oriented.`,
    client: `Use ${styleText}; keep confidence and ownership visible.`,
    professional: `Use ${styleText}; keep it concise and action-oriented.`,
    personal: `Use ${styleText}; avoid corporate language and protect the relationship.`,
    family: `Use ${styleText}; keep it human, patient, and specific.`,
    friend: `Use ${styleText}; sound natural and preserve trust.`,
  }
  return notes[relationship] || ''
}

function buildResponseCollateralContext(result, supportingDocs = {}) {
  const responses = getHistoryResponses(result)
  const selected = responses.find(response => response.label === appState.currentSelectedResponseLabel)
  const response = selected || responses[1] || responses[0]
  const qaText = Array.isArray(result?.qaItems)
    ? result.qaItems.slice(0, 2).map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n')
    : ''
  const supportingText = String(supportingDocs.documentText || '').trim().slice(0, 2600)
  const supportingFiles = (supportingDocs.attachments || [])
    .map(file => file.name)
    .filter(Boolean)
    .slice(0, 5)

  return [
    `Situation: ${appState.sessionData.situationText || appState.sessionData.situation}`,
    `Recipient: ${appState.sessionData.recipientLabel || 'recipient'}`,
    `Relationship: ${getRelationshipLabel(appState.sessionData.relationship, '')}`,
    supportingFiles.length ? `Supporting files: ${supportingFiles.join(', ')}` : '',
    supportingText ? `Supporting notes:\n${supportingText}` : '',
    result?.framework?.name ? `Framework: ${result.framework.name}` : '',
    response ? `Selected response:\n${response.text}` : '',
    result?.coachingTip ? `Coaching tip: ${result.coachingTip}` : '',
    qaText ? `Questions to expect:\n${qaText}` : '',
  ].filter(Boolean).join('\n\n')
}

function compactText(value = '', maxLength = 120) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
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
    title: brief.title || 'Supporting Brief',
    methodFramework: brief.methodFramework || null,
    summary: Array.isArray(brief.summary) ? brief.summary : [],
    presentationOutline: Array.isArray(brief.presentationOutline) ? brief.presentationOutline : [],
    talkingPoints: Array.isArray(brief.talkingPoints) ? brief.talkingPoints : [],
    emailDraft: brief.emailDraft || '',
    questionsToExpect: Array.isArray(brief.questionsToExpect) ? brief.questionsToExpect : [],
    refinementNote: brief.refinementNote || '',
  }
}

function stripUiState(value) {
  const clean = { ...(value || {}) }
  delete clean._refinementLoading
  return clean
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

function getRelationshipLabel(relationship = '', fallbackText = '') {
  return {
    manager: 'manager',
    peer: 'coworker / peer',
    'direct-report': 'direct report',
    client: 'client / partner',
    professional: 'professional stakeholder',
    personal: 'personal relationship',
    family: 'family',
    friend: 'friend',
  }[relationship] || getReceiverLabel(fallbackText)
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
