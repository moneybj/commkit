/**
 * CommKit Storage
 * All persistent app data lives on-device in encrypted localStorage.
 */

import { base64ToBytes, bytesToBase64, decryptString, deriveAesKey, encryptString, getRandomBytes, isEncryptedPayload } from './crypto.js'

const KEYS = {
  PROFILE:     'ck_profile',
  TAGS:        'ck_tags',
  SESSIONS:    'ck_sessions',
  HISTORY:     'ck_history',
  RECIPIENTS:  'ck_recipient_memory',
  THREADS:     'ck_conversation_threads',
  INSTALLED:   'ck_installed',
  NUDGE_SHOWN: 'ck_install_dismissed',
  IOS_NUDGE:   'ck_ios_nudge_shown',
}

const CRYPTO_KEYS = {
  SALT: 'ck_crypto_salt',
  CHECK: 'ck_crypto_check',
}

const CHECK_VALUE = 'commkit-local-vault'
const encryptedKeys = Object.values(KEYS)
const cache = new Map()

let vaultKey = null
let persistQueue = Promise.resolve()

// ── Local encryption lifecycle ─────────────────

export function isEncryptionConfigured() {
  return !!(localStorage.getItem(CRYPTO_KEYS.SALT) && localStorage.getItem(CRYPTO_KEYS.CHECK))
}

export function isEncryptionUnlocked() {
  return !!vaultKey
}

export async function setupLocalEncryption(passphrase) {
  const salt = getRandomBytes(16)
  vaultKey = await deriveAesKey(passphrase, salt)
  localStorage.setItem(CRYPTO_KEYS.SALT, bytesToBase64(salt))

  hydrateCacheFromLocalStorage()
  await persistAllEncrypted()
  localStorage.setItem(CRYPTO_KEYS.CHECK, await encryptString(CHECK_VALUE, vaultKey))
}

export async function unlockLocalEncryption(passphrase) {
  const salt = base64ToBytes(localStorage.getItem(CRYPTO_KEYS.SALT) || '')
  const key = await deriveAesKey(passphrase, salt)
  const check = await decryptString(localStorage.getItem(CRYPTO_KEYS.CHECK), key)
  if (check !== CHECK_VALUE) throw new Error('Incorrect passphrase')

  vaultKey = key
  await hydrateCacheFromEncryptedStorage()
}

export function clearEncryptedStorage() {
  encryptedKeys.forEach(key => localStorage.removeItem(key))
  Object.values(CRYPTO_KEYS).forEach(key => localStorage.removeItem(key))
  cache.clear()
  vaultKey = null
}

function hydrateCacheFromLocalStorage() {
  encryptedKeys.forEach(key => {
    const raw = localStorage.getItem(key)
    if (raw != null && !isEncryptedPayload(raw)) {
      cache.set(key, raw)
    }
  })
}

async function hydrateCacheFromEncryptedStorage() {
  cache.clear()

  for (const key of encryptedKeys) {
    const raw = localStorage.getItem(key)
    if (raw == null) continue

    if (isEncryptedPayload(raw)) {
      cache.set(key, await decryptString(raw, vaultKey))
    } else {
      cache.set(key, raw)
    }
  }

  await persistAllEncrypted()
}

async function persistAllEncrypted() {
  for (const key of encryptedKeys) {
    if (cache.has(key)) {
      localStorage.setItem(key, await encryptString(cache.get(key), vaultKey))
    } else {
      localStorage.removeItem(key)
    }
  }
}

function readRaw(key) {
  if (vaultKey) return cache.get(key) || null

  const raw = localStorage.getItem(key)
  if (raw && isEncryptedPayload(raw)) return null
  return raw
}

function writeRaw(key, value) {
  if (!vaultKey) {
    localStorage.setItem(key, value)
    return
  }

  cache.set(key, value)
  persistQueue = persistQueue
    .then(async () => {
      localStorage.setItem(key, await encryptString(value, vaultKey))
    })
    .catch(err => console.warn('[CommKit] Encrypted write failed:', err))
}

function removeRaw(key) {
  cache.delete(key)
  localStorage.removeItem(key)
}

// ── Profile ──────────────────────────────────

export function getProfile() {
  try {
    const raw = readRaw(KEYS.PROFILE)
    const sessions = getSessionCount()
    const fallback = {
      role: '',
      style: '',
      sessionCount: sessions,
      layerDepth: 1,
      firstSeen: Date.now(),
    }
    return raw ? { ...fallback, ...JSON.parse(raw), sessionCount: sessions } : fallback
  } catch {
    return { role: '', style: '', sessionCount: getSessionCount(), layerDepth: 1, firstSeen: Date.now() }
  }
}

export function saveProfile(updates) {
  try {
    const current = getProfile()
    const updated = { ...current, ...updates }
    writeRaw(KEYS.PROFILE, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('[CommKit] Could not save profile:', err)
  }
}

export function hasProfile() {
  const p = getProfile()
  return !!(p.role && p.style)
}

// ── Tags ─────────────────────────────────────

export function getTags() {
  try {
    const raw = readRaw(KEYS.TAGS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTags(tags) {
  try {
    writeRaw(KEYS.TAGS, JSON.stringify(tags))
  } catch (err) {
    console.warn('[CommKit] Could not save tags:', err)
  }
}

export function addTag(tag) {
  const tags = getTags()
  // Avoid duplicates
  if (tags.find(t => t.label === tag.label)) return tags
  const updated = [...tags, { ...tag, addedAt: Date.now() }]
  saveTags(updated)
  return updated
}

export function removeTag(label) {
  const updated = getTags().filter(t => t.label !== label)
  saveTags(updated)
  return updated
}

// ── Sessions ─────────────────────────────────

export function getSessionCount() {
  return parseInt(readRaw(KEYS.SESSIONS) || '0', 10)
}

export function incrementSession() {
  const count = getSessionCount() + 1
  writeRaw(KEYS.SESSIONS, count.toString())
  saveProfile({
    sessionCount: count,
    layerDepth: calculateLayerDepth(),
  })
  return count
}

// ── History ──────────────────────────────────

export function getHistory() {
  try {
    const raw = readRaw(KEYS.HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addToHistory(entry) {
  try {
    const history = getHistory()
    const updated = [
      {
        id: Date.now(),
        kind: entry.kind || 'conversation',
        situation: entry.situation,
        situationTitle: entry.situationTitle,
        timestamp: Date.now(),
        versionUsed: entry.versionUsed || null,
        inputMethod: entry.inputMethod || 'text',
        framework: entry.framework || null,
        frameworkDetail: entry.frameworkDetail || null,
        receiver: entry.receiver || null,
        recipientLabel: entry.recipientLabel || entry.receiver || null,
        recipientKey: entry.recipientKey || null,
        relationship: entry.relationship || null,
        threadId: entry.threadId || null,
        threadTitle: entry.threadTitle || null,
        supportingDocs: entry.supportingDocs || null,
        responses: entry.responses || [],
        resourceBrief: entry.resourceBrief || null,
        refinements: entry.refinements || [],
      },
      ...history
    ].slice(0, 20) // Keep last 20 sessions
    writeRaw(KEYS.HISTORY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('[CommKit] Could not save history:', err)
    return getHistory()
  }
}

export function updateHistoryEntry(id, updates) {
  try {
    const history = getHistory()
    const updated = history.map(item => {
      if (item.id !== id) return item
      return {
        ...item,
        ...updates,
        id: item.id,
        timestamp: item.timestamp,
        updatedAt: Date.now(),
      }
    })
    writeRaw(KEYS.HISTORY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.warn('[CommKit] Could not update history:', err)
    return getHistory()
  }
}

// ── Recipient memory ───────────────────────────

export function makeRecipientKey(relationship = '', label = '') {
  const relationshipPart = slugify(relationship || 'general')
  const labelPart = slugify(label || relationship || 'unknown')
  return `${relationshipPart}:${labelPart}`
}

export function getRecipientMemories() {
  try {
    const raw = readRaw(KEYS.RECIPIENTS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getRecipientMemory(key) {
  if (!key) return null
  return getRecipientMemories()[key] || null
}

export function saveRecipientMemory(memory) {
  if (!memory?.key) return getRecipientMemories()

  const memories = getRecipientMemories()
  const updated = {
    ...memories,
    [memory.key]: {
      ...memory,
      updatedAt: Date.now(),
    },
  }
  const entries = Object.entries(updated).slice(0, 40)
  const capped = Object.fromEntries(entries)
  writeRaw(KEYS.RECIPIENTS, JSON.stringify(capped))
  return capped
}

// ── Conversation threads ───────────────────────

export function getConversationThreads() {
  try {
    const raw = readRaw(KEYS.THREADS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getThreadsForRecipient(recipientKey) {
  if (!recipientKey) return []

  return getConversationThreads()
    .filter(thread => thread.recipientKey === recipientKey)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getConversationThread(threadId) {
  if (!threadId) return null
  return getConversationThreads().find(thread => thread.id === threadId) || null
}

export function upsertConversationThread(thread) {
  if (!thread?.id) return getConversationThreads()

  const threads = getConversationThreads()
  const updatedThread = {
    ...thread,
    updatedAt: Date.now(),
  }
  const updated = [
    updatedThread,
    ...threads.filter(item => item.id !== thread.id),
  ]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 40)

  writeRaw(KEYS.THREADS, JSON.stringify(updated))
  return updated
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'unknown'
}

// ── Install state ─────────────────────────────

export function isInstalled() {
  return readRaw(KEYS.INSTALLED) === 'true'
}

export function markInstalled() {
  writeRaw(KEYS.INSTALLED, 'true')
}

export function isNudgeDismissed() {
  const dismissed = readRaw(KEYS.NUDGE_SHOWN)
  if (!dismissed) return false
  // Re-show after 7 days
  return Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000
}

export function dismissNudge() {
  writeRaw(KEYS.NUDGE_SHOWN, Date.now().toString())
}

export function isIosNudgeShown() {
  return !!readRaw(KEYS.IOS_NUDGE)
}

export function markIosNudgeShown() {
  writeRaw(KEYS.IOS_NUDGE, '1')
}

// ── Layer calculation ─────────────────────────

export function calculateLayerDepth() {
  const profile = getProfile()
  const sessions = getSessionCount()
  const tags = getTags()

  if (sessions >= 10 && tags.length >= 5) return 5
  if (sessions >= 6  && profile.style)     return 4
  if (sessions >= 3  && profile.role)      return 3
  if (sessions >= 1  && profile.role)      return 2
  return 1
}

// ── Clear all (debug / reset) ─────────────────

export function clearAll() {
  Object.values(KEYS).forEach(k => removeRaw(k))
  console.log('[CommKit] All data cleared')
}
