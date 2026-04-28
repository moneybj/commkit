/**
 * CommKit Result Screen
 * 3 response cards, inline Signal notification,
 * framework reveal, Q&A prep, feedback module
 */

import { openShare, copyToClipboard } from '../utils/share.js'
import { analyseSignals, getTreeRingsSVG, getLayerInfo } from '../features/signals.js'
import { escapeAttr, escapeHtml } from '../utils/escape.js'
import { showToast } from '../utils/toast.js'

// ── Render ────────────────────────────────────

export function renderResult({ result, situationLabel, profile, sessionData }) {
  const layerInfo = getLayerInfo()
  const signal = analyseSignals({ ...result, inputMethod: sessionData?.inputMethod })

  const responses = normalizeResponses(result)
  const badgeClasses = ['badge-accent', 'badge-green', 'badge-blue']

  return `
    <div id="screen-result" class="screen active" style="background:var(--bg);overflow-y:auto;padding-bottom:80px;">

      <!-- Sticky header -->
      <div style="position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--border);padding:12px 20px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(12px);">
        <div id="resultBack" style="width:36px;height:36px;border-radius:50%;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;flex-shrink:0;color:var(--text2);">←</div>
        <div style="font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--text);flex:1;" id="resultTitle">${escapeHtml(result?.situationTitle || situationLabel)}</div>
        <div style="font-size:10px;color:var(--green);display:flex;align-items:center;gap:4px;">🔒 On-device</div>
      </div>

      <!-- Active signals strip -->
      <div style="padding:10px 16px;border-bottom:1px solid var(--border);background:var(--s1);">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin-bottom:6px;">Signals active for this conversation</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${profile?.style ? `<div class="tag style" style="cursor:default;">${escapeHtml(profile.style)}</div>` : ''}
          ${sessionData?.relationship ? `<div class="tag strength" style="cursor:default;">For: ${escapeHtml(sessionData.recipientLabel || getRelationshipLabel(sessionData.relationship))}</div>` : ''}
          ${sessionData?.inputMethod === 'voice' ? `<div class="tag strength" style="cursor:default;">🎤 Voice input</div>` : `<div class="tag style" style="cursor:default;">✏️ Typed</div>`}
          <div class="tag growth" style="cursor:default;">📍 Session ${profile?.sessionCount || 1}</div>
        </div>
      </div>

      ${sessionData?.recipientMemory ? renderMemoryNote(sessionData.recipientMemory, sessionData.recipientLabel) : ''}

      <!-- Detected context -->
      <div style="margin:13px 16px 0;background:var(--s2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:12px;padding:12px 14px;display:flex;gap:10px;">
        <div style="font-size:20px;flex-shrink:0;margin-top:1px;">🎯</div>
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:3px;">Situation · Profile applied</div>
          <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:2px;">${escapeHtml(result?.detectedSummary || situationLabel)}</div>
          <div style="font-size:11px;color:var(--muted);line-height:1.5;">${escapeHtml(result?.profileApplied || '')}</div>
        </div>
      </div>

      ${result?.framework ? renderMethodStrip(result.framework) : ''}

      <!-- Response cards -->
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);display:flex;align-items:center;gap:8px;padding:0 16px;margin:16px 0 10px;">
        3 Versions — Pick What Fits
        <span style="flex:1;height:1px;background:var(--border);display:block;"></span>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin:0 16px 14px;">
        ${responses.map((r, i) => renderResponseCard(r, i, badgeClasses[i])).join('')}
      </div>

      <!-- Inline Signal notification -->
      ${signal?.shouldSuggest ? renderSignalCard(signal) : ''}

      <!-- Framework reveal -->
      ${result?.framework ? renderFrameworkCard(result.framework) : ''}

      <!-- Coaching tip -->
      ${result?.coachingTip ? `
        <div style="margin:0 16px 14px;background:var(--s2);border:1px solid var(--border);border-left:3px solid var(--gold);border-radius:12px;padding:12px 14px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin-bottom:5px;">💡 From your Signals</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.65;">${escapeHtml(result.coachingTip)}</div>
        </div>
      ` : ''}

      <!-- Q&A prep -->
      ${result?.qaItems?.length ? `
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);display:flex;align-items:center;gap:8px;padding:0 16px;margin:0 0 10px;">
          Questions They Might Ask
          <span style="flex:1;height:1px;background:var(--border);display:block;"></span>
        </div>
        <div id="qaContainer">
          ${result.qaItems.map((qa, i) => `
            <div class="qa-item" data-index="${i}" style="background:var(--s2);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;margin:0 16px 8px;cursor:pointer;transition:all .2s;">
              <div style="font-size:13px;font-weight:600;color:var(--text);display:flex;gap:7px;align-items:flex-start;">
                <span style="color:var(--accent);font-weight:800;flex-shrink:0;">Q</span>
                <span>${escapeHtml(qa.question)}</span>
                <span style="margin-left:auto;color:var(--muted2);font-size:14px;flex-shrink:0;transition:transform .2s;" class="qa-chevron">▾</span>
              </div>
              <div class="qa-answer" style="display:none;font-size:12px;color:var(--muted);line-height:1.65;padding-top:9px;margin-top:9px;border-top:1px solid var(--border);">
                <span style="color:var(--green);font-weight:700;">A &nbsp;</span>${escapeHtml(qa.answer)}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${renderRefinementCard(result)}

      <!-- Next steps -->
      ${renderNextActions()}

      <!-- Layer unlock progress -->
      ${renderLayerCard(layerInfo)}

      <!-- Feedback -->
      ${renderFeedbackCard()}

      <!-- Privacy note -->
      <div style="margin:0 16px 32px;background:var(--green-dim);border:1px solid var(--green-border);border-radius:12px;padding:12px 14px;display:flex;gap:8px;">
        <div>🔒</div>
        <div style="font-size:11px;color:var(--green-text);line-height:1.6;"><strong style="color:var(--green);">Your Signals stay encrypted on this device.</strong> Generated requests still go securely to Claude when you ask CommKit to write.</div>
      </div>
    </div>
  `
}

function renderMethodStrip(framework) {
  return `
    <div style="margin:10px 16px 0;background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:12px;padding:10px 12px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:4px;">Model used to generate these responses</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.55;"><strong style="color:var(--gold-text);">${escapeHtml(framework.name || 'Communication framework')}</strong>${framework.source ? ` · ${escapeHtml(framework.source)}` : ''}</div>
    </div>
  `
}

function getRelationshipLabel(relationship = '') {
  return {
    manager: 'Manager',
    peer: 'Coworker / peer',
    'direct-report': 'Direct report',
    client: 'Client / partner',
    professional: 'Professional',
    personal: 'Personal',
    family: 'Family',
    friend: 'Friend',
  }[relationship] || relationship
}

function renderMemoryNote(memory, recipientLabel) {
  return `
    <div style="margin:10px 16px 0;background:var(--blue-dim);border:1px solid var(--blue-border);border-radius:12px;padding:10px 12px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--blue);margin-bottom:4px;">Using on-device history</div>
      <div style="font-size:11px;color:var(--text2);line-height:1.55;">${escapeHtml(recipientLabel || memory.recipientLabel || 'This recipient')} · ${escapeHtml(memory.lastTopic || 'recent context')}</div>
    </div>
  `
}

function renderResponseCard(response, index, badgeClass) {
  return `
    <article class="response-card" style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;min-height:168px;display:flex;flex-direction:column;">
      <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px;">${escapeHtml(response.label)}</div>
          <div style="font-size:10px;color:var(--muted);">${escapeHtml(response.why)}</div>
        </div>
        <div class="badge ${badgeClass}">${escapeHtml(response.tone)}</div>
      </div>
      <div style="padding:14px;font-size:13px;line-height:1.8;color:var(--text2);border-bottom:1px solid var(--border);font-style:italic;flex:1;" class="resp-text">${escapeHtml(response.text)}</div>
      <div style="padding:10px 12px;display:flex;gap:8px;min-height:62px;">
        <button class="btn copy-btn" style="flex:1;font-size:12px;" data-index="${index}">📋 Copy</button>
        <button class="btn share-btn" style="width:42px;height:42px;padding:0;" data-text="${escapeAttr(response.text)}">⬆️</button>
        <button class="btn btn-primary use-btn" style="flex:1.2;font-size:12px;box-shadow:0 4px 14px var(--accent-glow);" data-label="${escapeAttr(response.label)}">Use This</button>
      </div>
      <div style="padding:0 12px 12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="btn format-btn" data-format="short" data-label="${escapeAttr(response.label)}" data-text="${escapeAttr(response.shortText)}" style="font-size:12px;">Short reply</button>
        <button class="btn format-btn" data-format="email" data-label="${escapeAttr(response.label)}" data-text="${escapeAttr(response.emailText)}" style="font-size:12px;">Email instead</button>
      </div>
      <div class="format-panel" style="display:none;margin:0 12px 12px;background:var(--s3);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
        <div style="padding:9px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
          <div class="format-title" style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);">Short reply</div>
          <button class="format-close" style="margin-left:auto;background:transparent;border:none;color:var(--muted);font-size:16px;cursor:pointer;">×</button>
        </div>
        <div class="format-text" style="white-space:pre-wrap;padding:12px;font-size:12px;line-height:1.65;color:var(--text2);"></div>
        <div style="padding:0 12px 12px;display:flex;gap:8px;">
          <button class="btn format-copy" style="flex:1;font-size:12px;">Copy this</button>
          <button class="btn format-share" style="flex:1;font-size:12px;">Share</button>
        </div>
      </div>
    </article>
  `
}

function renderRefinementCard(result) {
  const refinements = Array.isArray(result?.refinements) ? result.refinements : []
  const isLoading = !!result?._refinementLoading

  return `
    <div style="margin:6px 16px 14px;background:linear-gradient(135deg,var(--s2),var(--s3));border:1.5px solid var(--border);border-top:2px solid var(--blue);border-radius:16px;padding:14px;">
      <div class="section-label" style="margin-bottom:8px;">Refine in conversation</div>
      <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);line-height:1.14;margin-bottom:7px;">Want it warmer, shorter, firmer, or more technical?</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:12px;">Ask CommKit to revise these responses. The framework stays visible so you know what model shaped the rewrite.</div>
      ${result?.refinementNote ? `<div style="background:var(--blue-dim);border:1px solid var(--blue-border);border-radius:10px;padding:9px 10px;font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:10px;"><strong style="color:var(--blue);">Latest change:</strong> ${escapeHtml(result.refinementNote)}</div>` : ''}
      ${refinements.length ? `
        <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:10px;">
          ${refinements.slice(-3).map(item => `
            <div style="background:var(--s2);border:1px solid var(--border);border-radius:10px;padding:9px 10px;">
              <div style="font-size:11px;color:var(--text);line-height:1.45;"><strong>You:</strong> ${escapeHtml(item.request || '')}</div>
              ${item.note ? `<div style="font-size:11px;color:var(--muted);line-height:1.45;margin-top:4px;"><strong>CommKit:</strong> ${escapeHtml(item.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px;">
        ${[
          ['Shorter', 'Make the responses shorter while keeping the meaning.'],
          ['Warmer', 'Make the responses warmer and more relationship-preserving.'],
          ['More direct', 'Make the responses more direct while staying respectful.'],
          ['Less formal', 'Make the responses sound more natural and less formal.'],
        ].map(([label, instruction]) => `
          <button class="btn result-refine-chip" data-instruction="${escapeAttr(instruction)}" style="font-size:11px;padding:8px 10px;">${escapeHtml(label)}</button>
        `).join('')}
      </div>
      <textarea id="resultRefineInput" style="background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;min-height:74px;margin-bottom:10px;" placeholder="Example: Make this sound more respectful to a manager, but keep it direct."></textarea>
      <button id="resultRefineSubmit" class="btn btn-primary btn-full" disabled>${isLoading ? 'Refining responses...' : 'Refine typed request →'}</button>
    </div>
  `
}

function normalizeResponses(result) {
  const labels = ['Direct version', 'Balanced version', 'Careful version']
  const tones = ['Direct', 'Balanced', 'Careful']

  if (Array.isArray(result?.responses) && result.responses.length > 0) {
    return result.responses.slice(0, 3).map((response, index) => ({
      label: response?.label || labels[index],
      why: response?.why || 'Use when this tone fits',
      tone: response?.tone || tones[index],
      text: response?.text || response?.response || response?.content || '',
      shortText: response?.shortText || response?.short || '',
      emailText: response?.emailText || response?.email || '',
    })).filter(response => response.text)
      .map(addDeliveryFallbacks)
  }

  const keyedResponses = [result?.direct, result?.balanced, result?.careful]
  const normalized = keyedResponses.map((value, index) => ({
    label: labels[index],
    why: 'Use when this tone fits',
    tone: tones[index],
    text: typeof value === 'string' ? value : value?.text,
    shortText: typeof value === 'object' ? value?.shortText : '',
    emailText: typeof value === 'object' ? value?.emailText : '',
  })).filter(response => response.text).map(addDeliveryFallbacks)

  if (normalized.length > 0) return normalized

  return [
    {
      label: 'Direct version',
      why: 'Clear, fast, and specific',
      tone: 'Direct',
      text: 'I want to talk about this directly so we can fix it early. Here is what I am noticing, why it matters, and what I need from here.',
      shortText: 'I want to talk about this directly so we can fix it early and agree on what changes from here.',
      emailText: 'Subject: Quick follow-up\n\nHi [Name],\n\nI want to address this directly so we can fix it early. Here is what I am noticing, why it matters, and what I need from here.\n\nCan we find a few minutes to align on next steps?\n\nThanks,\n[Your name]',
    },
    {
      label: 'Balanced version',
      why: 'Firm without closing the door',
      tone: 'Balanced',
      text: 'I want to check in about something important. I think we can handle it well if we get clear on what happened and agree on the next step.',
      shortText: 'I want to check in about this and agree on the next step before it becomes a bigger issue.',
      emailText: 'Subject: Checking in\n\nHi [Name],\n\nI want to check in about something important. I think we can handle it well if we get clear on what happened and agree on the next step.\n\nCould we find a time to talk this through?\n\nThanks,\n[Your name]',
    },
    {
      label: 'Careful version',
      why: 'Protects the relationship first',
      tone: 'Careful',
      text: 'Can we talk for a minute about something I have noticed? I want to understand your side and make sure we are aligned before this becomes bigger.',
      shortText: 'Can we talk for a minute about something I noticed? I want to understand your side and make sure we are aligned.',
      emailText: 'Subject: Can we talk this through?\n\nHi [Name],\n\nCan we talk for a minute about something I have noticed? I want to understand your side and make sure we are aligned before this becomes bigger.\n\nLet me know when would be a good time.\n\nThanks,\n[Your name]',
    },
  ]
}

function addDeliveryFallbacks(response) {
  return {
    ...response,
    shortText: response.shortText || makeShortReply(response.text),
    emailText: response.emailText || makeEmailDraft(response),
  }
}

function makeShortReply(text) {
  const firstSentence = String(text || '').match(/^[^.!?]+[.!?]/)?.[0]
  return firstSentence || text
}

function makeEmailDraft(response) {
  return `Subject: Quick follow-up

Hi [Name],

${response.text}

Could we find a time to talk this through?

Thanks,
[Your name]`
}

function renderSignalCard(signal) {
  return `
    <div id="inlineSignal" style="margin:0 16px 14px;background:var(--s2);border:1px solid var(--border);border-radius:14px;overflow:hidden;animation:screenIn .4s var(--ease-out);">
      <div style="padding:9px 13px;background:var(--s3);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:7px;">
        <div class="signal-pulse"></div>
        <div style="font-size:11px;font-weight:700;color:var(--gold);">⚡ New Signal detected</div>
        <div style="font-size:10px;color:var(--muted);margin-left:auto;">This session</div>
      </div>
      <div style="padding:12px 13px;">
        <div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:10px;">${escapeHtml(signal.observation)} <strong style="color:var(--gold);">${escapeHtml(signal.tagLabel)}</strong> — add to your profile?</div>
        <div style="display:flex;gap:7px;">
          <button id="sigAccept" class="btn" data-label="${escapeAttr(signal.tagLabel)}" data-type="${escapeAttr(signal.tagType || 'tendency')}" style="flex:1;font-size:12px;background:var(--gold-dim);color:var(--gold);border-color:var(--gold-border);">✓ Add to profile</button>
          <button id="sigDismiss" class="btn" style="font-size:12px;">Not yet</button>
        </div>
      </div>
    </div>
  `
}

function renderFrameworkCard(fw) {
  return `
    <div style="margin:0 16px 14px;background:linear-gradient(135deg,var(--s2),var(--s1));border-radius:16px;overflow:hidden;border:1px solid var(--gold-border);">
      <div style="padding:12px 14px;border-bottom:1px solid var(--gold-border);display:flex;align-items:center;gap:10px;">
        <div style="background:var(--gold-dim);color:var(--gold-text);border:1px solid var(--gold-border);border-radius:6px;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px;flex-shrink:0;">Research-Backed</div>
        <div style="font-family:var(--font-display);font-size:15px;font-weight:600;color:var(--text);flex:1;">${escapeHtml(fw.name)}</div>
        <div id="fwToggle" style="font-size:16px;color:var(--muted);cursor:pointer;transition:transform .2s;">▾</div>
      </div>
      <div id="fwBody" style="padding:14px;display:none;">
        <div style="font-size:11px;color:var(--muted);margin-bottom:10px;line-height:1.5;">📍 <strong style="color:var(--gold-text);">${escapeHtml(fw.source)}</strong></div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:14px;">${escapeHtml(fw.explanation)}</div>
        ${Array.isArray(fw.methodSteps) && fw.methodSteps.length ? `
          <div style="background:var(--s3);border:1px solid var(--gold-border);border-radius:10px;padding:10px;margin-bottom:12px;">
            <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:6px;">How CommKit used it</div>
            <ol style="padding-left:18px;color:var(--text2);font-size:11px;line-height:1.6;">
              ${fw.methodSteps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
            </ol>
          </div>
        ` : ''}
        <div style="display:flex;gap:10px;margin-bottom:12px;">
          <div style="flex:1;background:var(--s3);border-radius:10px;padding:10px;">
            <div style="font-family:var(--font-display);font-size:22px;color:var(--gold);">${escapeHtml(fw.stat1num)}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px;line-height:1.4;">${escapeHtml(fw.stat1label)}</div>
          </div>
          <div style="flex:1;background:var(--s3);border-radius:10px;padding:10px;">
            <div style="font-family:var(--font-display);font-size:22px;color:var(--gold);">${escapeHtml(fw.stat2num)}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px;line-height:1.4;">${escapeHtml(fw.stat2label)}</div>
          </div>
        </div>
        <div style="font-size:11px;color:var(--muted);line-height:1.6;">${escapeHtml(fw.usedBy)}</div>
      </div>
    </div>
  `
}

function renderLayerCard(layerInfo) {
  if (layerInfo.isMax) return ''
  const next = layerInfo.nextLayer
  return `
    <div style="margin:0 16px 14px;background:linear-gradient(135deg,var(--s2),var(--s3));border:1px solid var(--border);border-top:2px solid var(--accent);border-radius:14px;padding:14px;display:flex;gap:12px;align-items:center;">
      <div style="width:48px;height:48px;flex-shrink:0;">
        ${getTreeRingsSVG(layerInfo.current, 48)}
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px;">Layer ${layerInfo.current + 1} unlocking soon</div>
        <div style="font-size:11px;color:var(--muted);line-height:1.5;">${next?.name} — ${next?.desc}. Keep going.</div>
      </div>
    </div>
  `
}

function renderNextActions() {
  return `
    <div style="margin:6px 16px 14px;background:linear-gradient(135deg,var(--s2),var(--s3));border:1.5px solid var(--border);border-top:2px solid var(--accent);border-radius:16px;padding:14px;">
      <div class="section-label" style="margin-bottom:8px;">What next?</div>
      <div style="font-family:var(--font-display);font-size:21px;font-weight:700;color:var(--text);line-height:1.12;margin-bottom:7px;">You have the words. Keep moving.</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:13px;">Start another situation or go back to your growing profile.</div>
      <div style="display:flex;gap:8px;">
        <button id="nextNewSession" class="btn btn-primary" style="flex:1;font-size:12px;">New situation →</button>
        <button id="nextHome" class="btn" style="flex:1;font-size:12px;">View profile</button>
      </div>
      <button id="nextCollateral" class="btn" style="width:100%;font-size:12px;margin-top:8px;border-color:var(--blue-border);background:var(--blue-dim);">Create summary, slides, talking points →</button>
      <button id="nextResource" class="btn" style="width:100%;font-size:12px;margin-top:8px;">Upload docs for summary + talking points →</button>
    </div>
  `
}

function renderFeedbackCard() {
  return `
    <div style="margin:0 16px 14px;background:var(--s2);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;">
      <div style="padding:11px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
        <div style="font-size:17px;">💬</div>
        <div>
          <div style="font-size:13px;font-weight:700;color:var(--text);">Did this help?</div>
          <div style="font-size:10px;color:var(--muted);margin-top:1px;">Your feedback trains CommKit's Signals</div>
        </div>
      </div>
      <div id="fbMain" style="padding:13px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:11px;">How well did this fit your situation?</div>
        <div style="display:flex;gap:10px;margin-bottom:13px;">
          <div class="fb-thumb" data-type="up" style="flex:1;padding:11px;border-radius:11px;border:1.5px solid var(--border);background:var(--s3);display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:all .2s;">
            <div style="font-size:24px;">👍</div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);">Worked well</div>
          </div>
          <div class="fb-thumb" data-type="dn" style="flex:1;padding:11px;border-radius:11px;border:1.5px solid var(--border);background:var(--s3);display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:all .2s;">
            <div style="font-size:24px;">👎</div>
            <div style="font-size:11px;font-weight:700;color:var(--muted);">Needs work</div>
          </div>
        </div>
        <div id="fbTextWrap" style="display:none;">
          <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px;">What would make this better? (optional)</div>
          <textarea id="fbText" style="width:100%;padding:10px 11px;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;outline:none;font-family:var(--font-body);font-size:12px;color:var(--text);line-height:1.6;resize:none;min-height:64px;transition:border-color .2s;" placeholder="Too formal · Wrong tone · Missing context..."></textarea>
          <button id="fbSubmit" class="btn" style="margin-top:9px;width:100%;border-radius:10px;">Send feedback →</button>
        </div>
      </div>
      <div id="fbThanks" style="padding:18px;text-align:center;display:none;">
        <div style="font-size:28px;margin-bottom:8px;">🙌</div>
        <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px;">Thanks — Signal logged.</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.5;">Every rating makes CommKit smarter for the next person in this exact situation.</div>
      </div>
    </div>
  `
}

// ── Bind ──────────────────────────────────────

export function bindResult({ onBack, onNewSession, onHome, onResource, onVersionUsed, onFormatChosen, onFrameworkOpened, onFeedback, onTagAccepted, onRefine, onCollateral }) {
  // Back
  document.getElementById('resultBack')?.addEventListener('click', onBack)

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.response-card')
      const text = card?.querySelector('.resp-text')?.textContent || ''
      const ok = await copyToClipboard(text)
      if (ok) {
        const orig = btn.innerHTML
        btn.innerHTML = '✓ Copied'
        btn.style.background = 'var(--green-dim)'
        btn.style.color = 'var(--green)'
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = '' }, 2000)
      }
    })
  })

  // Share buttons
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => openShare(btn.dataset.text))
  })

  // Use This buttons
  document.querySelectorAll('.use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      onVersionUsed(btn.dataset.label)
      btn.textContent = '✓ Used'
      btn.style.background = 'var(--green)'
      setTimeout(() => { btn.textContent = 'Use This'; btn.style.background = '' }, 2000)
    })
  })

  // Delivery format buttons
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.response-card')
      const panel = card?.querySelector('.format-panel')
      const title = card?.querySelector('.format-title')
      const textEl = card?.querySelector('.format-text')
      const copyBtn = card?.querySelector('.format-copy')
      const shareBtn = card?.querySelector('.format-share')
      const isEmail = btn.dataset.format === 'email'
      const text = btn.dataset.text || ''

      if (!panel || !title || !textEl || !copyBtn || !shareBtn) return

      title.textContent = isEmail ? 'Email draft' : 'Short reply'
      textEl.textContent = text
      copyBtn.dataset.text = text
      shareBtn.dataset.text = text
      panel.style.display = 'block'
      onFormatChosen?.(`${btn.dataset.label}:${btn.dataset.format}`)
    })
  })

  document.querySelectorAll('.format-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.format-panel').style.display = 'none'
    })
  })

  document.querySelectorAll('.format-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await copyToClipboard(btn.dataset.text || '')
      if (ok) {
        const orig = btn.textContent
        btn.textContent = '✓ Copied'
        btn.style.background = 'var(--green-dim)'
        btn.style.color = 'var(--green)'
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.style.color = '' }, 2000)
      }
    })
  })

  document.querySelectorAll('.format-share').forEach(btn => {
    btn.addEventListener('click', () => openShare(btn.dataset.text || ''))
  })

  const resultRefineInput = document.getElementById('resultRefineInput')
  const resultRefineSubmit = document.getElementById('resultRefineSubmit')

  resultRefineInput?.addEventListener('input', () => {
    if (resultRefineSubmit) resultRefineSubmit.disabled = resultRefineInput.value.trim().length < 4
  })

  async function submitResultRefinement(instruction) {
    const input = document.getElementById('resultRefineInput')
    const btn = document.getElementById('resultRefineSubmit')

    if (instruction.length < 4) {
      input?.focus()
      return
    }

    const original = btn.textContent
    btn.disabled = true
    btn.textContent = 'Refining responses...'

    try {
      await onRefine?.(instruction)
    } catch (err) {
      btn.disabled = false
      btn.textContent = original
      showToast(err.message || 'Could not refine responses')
    }
  }

  resultRefineSubmit?.addEventListener('click', async () => {
    await submitResultRefinement(resultRefineInput?.value.trim() || '')
  })

  document.querySelectorAll('.result-refine-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.result-refine-chip').forEach(btn => {
        btn.disabled = true
      })
      chip.textContent = 'Refining...'
      await submitResultRefinement(chip.dataset.instruction || '')
    })
  })

  // Next-step navigation
  document.getElementById('nextNewSession')?.addEventListener('click', onNewSession)
  document.getElementById('nextHome')?.addEventListener('click', onHome)
  document.getElementById('nextCollateral')?.addEventListener('click', onCollateral)
  document.getElementById('nextResource')?.addEventListener('click', onResource)

  // Signal card
  document.getElementById('sigAccept')?.addEventListener('click', () => {
    const accept = document.getElementById('sigAccept')
    onTagAccepted?.({
      label: accept?.dataset.label || '',
      type: accept?.dataset.type || 'tendency',
    })
    const card = document.getElementById('inlineSignal')
    if (card) card.innerHTML = '<div style="padding:13px;display:flex;align-items:center;gap:10px;"><div style="font-size:18px;">✅</div><div style="font-size:12px;color:var(--text2);">Tag added to your profile. Your Layers are getting more accurate.</div></div>'
  })
  document.getElementById('sigDismiss')?.addEventListener('click', () => {
    document.getElementById('inlineSignal')?.remove()
  })

  // Framework toggle
  document.getElementById('fwToggle')?.addEventListener('click', () => {
    const body = document.getElementById('fwBody')
    const tog  = document.getElementById('fwToggle')
    const isOpen = body.style.display !== 'none'
    body.style.display = isOpen ? 'none' : 'block'
    tog.style.transform = isOpen ? '' : 'rotate(180deg)'
    if (!isOpen) onFrameworkOpened()
  })

  // Q&A accordion
  document.querySelectorAll('.qa-item').forEach(item => {
    item.addEventListener('click', () => {
      const ans = item.querySelector('.qa-answer')
      const chev = item.querySelector('.qa-chevron')
      const isOpen = ans.style.display !== 'none'
      ans.style.display = isOpen ? 'none' : 'block'
      if (chev) chev.style.transform = isOpen ? '' : 'rotate(180deg)'
    })
  })

  // Feedback thumbs
  document.querySelectorAll('.fb-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.fb-thumb').forEach(t => {
        t.style.borderColor = 'var(--border)'
        t.style.background = 'var(--s3)'
      })
      const type = thumb.dataset.type
      thumb.style.borderColor = type === 'up' ? 'var(--green)'  : 'var(--accent)'
      thumb.style.background  = type === 'up' ? 'var(--green-dim)' : 'var(--accent-dim)'
      document.getElementById('fbTextWrap').style.display = 'block'
      onFeedback(type)
    })
  })

  document.getElementById('fbSubmit')?.addEventListener('click', () => {
    document.getElementById('fbMain').style.display = 'none'
    document.getElementById('fbThanks').style.display = 'block'
  })

  // Scroll to top
  document.getElementById('screen-result')?.scrollTo(0, 0)
}

