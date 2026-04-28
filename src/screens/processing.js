/**
 * CommKit Processing Screen
 * Shows while the API call runs
 * 4 animated steps, ~900ms each
 */

import { escapeHtml } from '../utils/escape.js'

const STEPS = [
  { icon: '👁️', label: 'Reading your situation',   subFn: (p) => `${p.situation || 'Custom situation'} · ${p.inputMethod === 'voice' ? 'Voice input' : 'Typed'}` },
  { icon: '⚡', label: 'Applying your Signals',    subFn: (p) => `${p.style || 'Your style'} · Session ${p.sessionCount}` },
  { icon: '📚', label: 'Selecting framework',      subFn: ()  => 'Research-backed approach...' },
  { icon: '✨', label: 'Generating 3 versions',    subFn: ()  => 'Calibrating to your voice...' },
]

let stepInterval = null

export function renderProcessing(profile) {
  const stepsHtml = STEPS.map((step, i) => `
    <div class="proc-step ${i === 0 ? 'active' : ''}" id="procStep${i}" style="display:flex;align-items:center;gap:12px;">
      <div class="proc-step-dot" id="procDot${i}" style="width:29px;height:29px;border-radius:50%;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;transition:all .3s;">
        ${step.icon}
      </div>
      <div>
        <div style="font-size:13px;color:var(--text2);font-weight:500;">${escapeHtml(step.label)}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:1px;" id="procSub${i}">${escapeHtml(step.subFn(profile))}</div>
      </div>
    </div>
  `).join('')

  return `
    <div id="screen-processing" class="screen active" style="
      background:var(--bg);
      justify-content:center;align-items:center;
      padding:40px 28px;
      position:relative;overflow:hidden;
    ">
      <!-- Glow -->
      <div style="position:absolute;width:280px;height:280px;border-radius:50%;top:-60px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,var(--accent-dim),transparent 70%);pointer-events:none;"></div>

      <!-- Spinner -->
      <div class="spin-ring" style="margin-bottom:32px;z-index:2;">
        <div style="font-size:38px;">✍️</div>
      </div>

      <!-- Title -->
      <div style="font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--text);text-align:center;margin-bottom:8px;z-index:2;">
        Reading your<br>situation...
      </div>
      <div style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:32px;z-index:2;line-height:1.6;">
        Applying your Signals to calibrate responses
      </div>

      <!-- Steps -->
      <div style="width:100%;z-index:2;display:flex;flex-direction:column;gap:11px;">
        ${stepsHtml}
      </div>

      <!-- Privacy note -->
      <div style="margin-top:28px;z-index:2;font-size:11px;color:var(--green);display:flex;align-items:center;gap:6px;">
        🔒 Local vault encrypted · Requests sent securely for generation
      </div>

      <!-- Error state (hidden by default) -->
      <div id="procError" style="
        margin-top:20px;z-index:2;
        background:var(--error-dim);border:1px solid var(--error-border);
        border-radius:10px;padding:12px 14px;
        font-size:12px;color:var(--error);
        display:none;text-align:center;line-height:1.6;
      "></div>
    </div>
  `
}

export function animateProcessingSteps() {
  clearInterval(stepInterval)

  // Reset all steps
  STEPS.forEach((_, i) => {
    const step = document.getElementById(`procStep${i}`)
    const dot  = document.getElementById(`procDot${i}`)
    if (step) step.className = `proc-step ${i === 0 ? 'active' : ''}`
    if (dot)  dot.textContent = STEPS[i].icon
  })

  let current = 0
  document.getElementById(`procStep${current}`)?.classList.add('active')

  stepInterval = setInterval(() => {
    // Mark current as done
    const currentStep = document.getElementById(`procStep${current}`)
    const currentDot  = document.getElementById(`procDot${current}`)
    if (currentStep) {
      currentStep.classList.remove('active')
      currentStep.classList.add('done')
    }
    if (currentDot) currentDot.textContent = '✓'

    current++

    if (current < STEPS.length) {
      document.getElementById(`procStep${current}`)?.classList.add('active')
    } else {
      clearInterval(stepInterval)
    }
  }, 900)
}

export function showProcessingError(message) {
  clearInterval(stepInterval)
  const errEl = document.getElementById('procError')
  if (errEl) {
    errEl.style.display = 'block'
    errEl.textContent = `⚠️ ${message} — tap ← to go back and retry.`
  }
}

export function stopProcessingAnimation() {
  clearInterval(stepInterval)
}
