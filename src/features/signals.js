/**
 * CommKit Signals
 * Tracks behavioral patterns and suggests profile tags
 */

import { getProfile, saveProfile, calculateLayerDepth } from '../utils/storage.js'

// Signal types CommKit tracks
export const SIGNAL_TYPES = {
  RESPONSE_CHOSEN:   'response_chosen',   // which version was used
  SITUATION_TYPE:    'situation_type',    // what category of situation
  INPUT_METHOD:      'input_method',      // voice vs text
  DELIVERY_FORMAT:   'delivery_format',   // in person vs short reply vs email
  FRAMEWORK_OPENED:  'framework_opened',  // did they expand the research card
  FEEDBACK_GIVEN:    'feedback_given',    // thumbs up/down
  SESSION_DURATION:  'session_duration',  // how long in the app
}

// In-memory signal log for current session
const sessionSignals = []

/**
 * Record a signal for the current session
 */
export function recordSignal(type, value) {
  sessionSignals.push({ type, value, timestamp: Date.now() })
  // Persist signal count to profile
  const profile = getProfile()
  const signals = (profile.signals || [])
  signals.push({ type, value, timestamp: Date.now() })
  // Keep last 50 signals
  saveProfile({ signals: signals.slice(-50) })
}

/**
 * Analyse signals and determine if a new tag should be suggested
 * Returns { shouldSuggest, observation, tagLabel } or null
 */
export function analyseSignals(currentResult) {
  const profile = getProfile()
  const signals = profile.signals || []
  const style   = profile.style || ''

  // Check: chosen version vs stated style
  const responseSignals = signals.filter(s => s.type === SIGNAL_TYPES.RESPONSE_CHOSEN)
  const balancedCount   = responseSignals.filter(s => s.value === 'Balanced version').length
  const carefulCount    = responseSignals.filter(s => s.value === 'Careful version').length
  const directCount     = responseSignals.filter(s => s.value === 'Direct version').length

  // Pattern: says Direct but picks Balanced/Careful
  if (style.includes('Direct') && (balancedCount + carefulCount) > directCount && responseSignals.length >= 3) {
    return {
      shouldSuggest: true,
      observation: `You've selected the Balanced or Careful version more than Direct — even though your profile says Direct. That's a meaningful Signal.`,
      tagLabel: '🤝 Warm in practice',
      tagType: 'tendency',
    }
  }

  // Pattern: heavy voice user
  const voiceSignals = signals.filter(s => s.type === SIGNAL_TYPES.INPUT_METHOD && s.value === 'voice')
  if (voiceSignals.length >= 3 && currentResult?.inputMethod === 'voice') {
    return {
      shouldSuggest: true,
      observation: `You consistently use voice input — that suggests you think through situations by talking them out rather than writing.`,
      tagLabel: '🎤 Thinks out loud',
      tagType: 'style',
    }
  }

  // Pattern: researches frameworks
  const frameworkOpened = signals.filter(s => s.type === SIGNAL_TYPES.FRAMEWORK_OPENED)
  if (frameworkOpened.length >= 2) {
    return {
      shouldSuggest: true,
      observation: `You've opened the research framework cards multiple times. You want to understand the why behind what works.`,
      tagLabel: '📚 Research-minded',
      tagType: 'strength',
    }
  }

  // Use signal from API response if no pattern detected
  if (currentResult?.signalObservation && currentResult?.suggestedTag) {
    return {
      shouldSuggest: true,
      observation: currentResult.signalObservation,
      tagLabel: currentResult.suggestedTag,
      tagType: 'tendency',
    }
  }

  return null
}

/**
 * Calculate which layer the user is on based on all signals
 */
export function getLayerInfo() {
  const depth = calculateLayerDepth()
  const layers = [
    { num: 1, name: 'Foundation',   desc: 'Role & first situation', color: 'var(--accent)' },
    { num: 2, name: 'Calibration',  desc: 'Style & receiver mapping', color: 'var(--gold)' },
    { num: 3, name: 'Pattern',      desc: 'Industry & behavior signals', color: 'var(--green)' },
    { num: 4, name: 'Voice',        desc: 'Your tone fingerprint', color: 'var(--blue)' },
    { num: 5, name: 'Signature',    desc: 'Full communication profile', color: 'var(--rose)' },
  ]

  return {
    current: depth,
    layers,
    currentLayer: layers[depth - 1],
    nextLayer: layers[depth] || null,
    isMax: depth >= 5,
  }
}

/**
 * Get the SVG tree ring visualization for layer depth
 */
export function getTreeRingsSVG(depth, size = 52) {
  const cx = size / 2
  const radii = [4, 9, 14, 19, 24]
  const colors = ['var(--accent)', 'var(--gold)', 'var(--green)', 'var(--blue)', 'var(--rose)']
  const bgColor = 'var(--s3)'

  let rings = ''

  // Background rings
  for (let i = 0; i < 5; i++) {
    rings += `<circle cx="${cx}" cy="${cx}" r="${radii[i]}" stroke="${bgColor}" stroke-width="3" fill="none"/>`
  }

  // Center dot
  rings += `<circle cx="${cx}" cy="${cx}" r="4" fill="${colors[0]}" opacity="0.9"/>`

  // Filled rings up to current depth
  for (let i = 0; i < Math.min(depth, 5); i++) {
    const r = radii[i]
    const circumference = 2 * Math.PI * r
    const offset = i === depth - 1 ? circumference * 0.35 : 0 // partial fill on current
    rings += `
      <circle cx="${cx}" cy="${cx}" r="${r}"
        stroke="${colors[i]}" stroke-width="3" fill="none"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        opacity="${0.9 - i * 0.1}"
        transform="rotate(-90 ${cx} ${cx})"
      />`
  }

  return `<svg viewBox="0 0 ${size} ${size}" fill="none" width="${size}" height="${size}">${rings}</svg>`
}
