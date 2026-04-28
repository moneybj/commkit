/**
 * CommKit History Screen
 * Shows saved conversation summaries from localStorage.
 */

import { copyToClipboard, openShare } from '../utils/share.js'
import { showToast } from '../utils/toast.js'
import { escapeAttr, escapeHtml } from '../utils/escape.js'

export function renderHistory({ history }) {
  return `
    <div id="screen-history" class="screen active" style="background:var(--bg);overflow-y:auto;padding:0 20px 110px;">
      <div style="position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--border);padding:18px 0 14px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(12px);">
        <button id="historyBack" style="width:36px;height:36px;border-radius:50%;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;color:var(--text2);">←</button>
        <div>
          <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);line-height:1.05;">Conversations</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;">Last ${history.length} saved on this device</div>
        </div>
      </div>

      <div style="padding-top:16px;display:flex;flex-direction:column;gap:10px;">
        ${history.length ? history.map(renderHistoryItem).join('') : renderEmptyState()}
      </div>
    </div>
  `
}

export function bindHistory({ onBack, onNewSession }) {
  document.getElementById('historyBack')?.addEventListener('click', onBack)
  document.getElementById('historyStart')?.addEventListener('click', onNewSession)

  document.querySelectorAll('.history-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await copyToClipboard(btn.dataset.text || '')
      if (ok) showToast('✓ Copied from history')
    })
  })

  document.querySelectorAll('.history-share').forEach(btn => {
    btn.addEventListener('click', () => {
      openShare(btn.dataset.text || '')
    })
  })
}

function renderHistoryItem(item) {
  if (item.kind === 'resource' || item.resourceBrief) {
    return renderResourceHistoryItem(item)
  }

  const responses = Array.isArray(item.responses) ? item.responses : []
  const relation = getRelationshipMeta(item)

  return `
    <article style="background:var(--s2);border:1.5px solid var(--border);border-left:4px solid ${relation.color};border-radius:14px;padding:13px 14px;">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:7px;">
        <div style="width:34px;height:34px;border-radius:10px;background:${relation.bg};color:${relation.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${relation.icon}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px;">${escapeHtml(item.situationTitle || 'Conversation')}</div>
          <div style="font-size:11px;color:var(--muted);line-height:1.5;">${escapeHtml(formatDate(item.timestamp))} · ${escapeHtml(item.framework || 'Framework applied')}</div>
        </div>
        <div style="background:${relation.bg};color:${relation.color};border:1px solid ${relation.border};border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800;white-space:nowrap;">${escapeHtml(relation.label)}</div>
      </div>
      <div style="font-size:12px;color:var(--text2);line-height:1.55;">${escapeHtml(item.situation || 'No situation saved')}</div>
      ${item.recipientLabel ? `<div style="font-size:11px;color:var(--muted);line-height:1.5;margin-top:6px;">Recipient: ${escapeHtml(item.recipientLabel)}</div>` : ''}
      ${renderHistoryContextActions(item)}
      ${renderSupportingDocsNote(item.supportingDocs)}
      ${renderHistoryMethod(item.frameworkDetail, item.framework)}
      ${renderHistoryRefinements(item.refinements)}
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:13px 0 8px;">Responses for ${escapeHtml(item.recipientLabel || item.receiver || inferReceiverLabel(item.situation))}</div>
      ${responses.length ? `
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${responses.map(renderHistoryResponse).join('')}
        </div>
      ` : `
        <div style="background:var(--s3);border:1px solid var(--border);border-radius:10px;padding:11px 12px;font-size:11px;color:var(--muted);line-height:1.5;">
          This older history item only saved the situation summary. New conversations will save the generated responses here.
        </div>
      `}
    </article>
  `
}

function renderResourceHistoryItem(item) {
  const brief = item.resourceBrief || {}
  const summaryText = listToText('Executive Summary', brief.summary)
  const talkingText = listToText('Talking Points', brief.talkingPoints)
  const presentationText = presentationToText(brief.presentationOutline)
  const relation = getRelationshipMeta(item)

  return `
    <article style="background:var(--s2);border:1.5px solid var(--border);border-left:4px solid ${relation.color};border-radius:14px;padding:13px 14px;">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:7px;">
        <div style="width:34px;height:34px;border-radius:10px;background:${relation.bg};color:${relation.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">📄</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px;">${escapeHtml(item.situationTitle || brief.title || 'Supporting Brief')}</div>
          <div style="font-size:11px;color:var(--muted);line-height:1.5;">${escapeHtml(formatDate(item.timestamp))} · ${escapeHtml(item.framework || item.receiver || 'stakeholder')}</div>
        </div>
        <div style="background:${relation.bg};color:${relation.color};border:1px solid ${relation.border};border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800;white-space:nowrap;">${escapeHtml(relation.label)}</div>
      </div>
      <div style="font-size:12px;color:var(--text2);line-height:1.55;margin-bottom:12px;">${escapeHtml(item.situation || 'Document brief')}</div>
      ${item.recipientLabel ? `<div style="font-size:11px;color:var(--muted);line-height:1.5;margin:-6px 0 12px;">Recipient: ${escapeHtml(item.recipientLabel)}</div>` : ''}
      ${renderHistoryContextActions(item)}
      ${renderHistoryMethod(item.frameworkDetail || brief.methodFramework, item.framework)}
      ${renderHistoryRefinements(item.refinements)}

      ${brief.summary?.length ? renderBriefSection('Executive Summary', summaryText, brief.summary) : ''}
      ${brief.talkingPoints?.length ? renderBriefSection('Talking Points', talkingText, brief.talkingPoints) : ''}
      ${brief.presentationOutline?.length ? renderPresentationSection(presentationText, brief.presentationOutline) : ''}
      ${brief.emailDraft ? renderEmailSection(brief.emailDraft) : ''}
    </article>
  `
}

function renderHistoryMethod(detail, fallbackName) {
  if (!detail && !fallbackName) return ''

  const steps = Array.isArray(detail?.methodSteps) ? detail.methodSteps : detail?.steps

  return `
    <div style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:10px;padding:10px 11px;margin-top:10px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:5px;">Model / framework used</div>
      <div style="font-size:12px;font-weight:800;color:var(--text);line-height:1.45;">${escapeHtml(detail?.name || fallbackName || 'Communication framework')}</div>
      ${detail?.source ? `<div style="font-size:11px;color:var(--gold-text);line-height:1.45;margin-top:2px;">${escapeHtml(detail.source)}</div>` : ''}
      ${detail?.explanation ? `<div style="font-size:11px;color:var(--text2);line-height:1.55;margin-top:6px;">${escapeHtml(detail.explanation)}</div>` : ''}
      ${Array.isArray(steps) && steps.length ? `
        <ol style="padding-left:18px;color:var(--text2);font-size:11px;line-height:1.55;margin-top:6px;">
          ${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
      ` : ''}
    </div>
  `
}

function renderHistoryRefinements(refinements = []) {
  if (!Array.isArray(refinements) || refinements.length === 0) return ''

  return `
    <div style="background:var(--blue-dim);border:1px solid var(--blue-border);border-radius:10px;padding:10px 11px;margin-top:10px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--blue);margin-bottom:6px;">Refinement conversation</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${refinements.slice(-3).map(item => `
          <div style="font-size:11px;color:var(--text2);line-height:1.5;">
            <strong style="color:var(--text);">You:</strong> ${escapeHtml(item.request || '')}
            ${item.note ? `<br><strong style="color:var(--blue);">CommKit:</strong> ${escapeHtml(item.note)}` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderSupportingDocsNote(supportingDocs) {
  if (!supportingDocs) return ''

  const fileCount = supportingDocs.fileCount || 0
  const hasPastedNotes = !!supportingDocs.hasPastedNotes
  const parts = [
    fileCount ? `${fileCount} file${fileCount === 1 ? '' : 's'}` : '',
    hasPastedNotes ? 'pasted notes' : '',
  ].filter(Boolean)

  if (!parts.length) return ''

  return `
    <div style="background:var(--blue-dim);border:1px solid var(--blue-border);border-radius:10px;padding:8px 10px;margin-top:10px;font-size:11px;color:var(--text2);line-height:1.5;">
      <strong style="color:var(--blue);">Supporting docs used:</strong> ${escapeHtml(parts.join(' + '))}
    </div>
  `
}

function renderHistoryContextActions(item) {
  const context = buildHistoryContextPack(item, false)
  const safe = buildHistoryContextPack(item, true)

  return `
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;">
      <button class="btn history-copy" data-text="${escapeAttr(context)}" style="font-size:11px;padding:8px 10px;">Copy context</button>
      <button class="btn history-share" data-text="${escapeAttr(context)}" style="font-size:11px;padding:8px 10px;">Share</button>
      <button class="btn history-copy" data-text="${escapeAttr(safe)}" style="font-size:11px;padding:8px 10px;">Stakeholder-safe</button>
    </div>
  `
}

function buildHistoryContextPack(item, stakeholderSafe) {
  const responses = Array.isArray(item.responses) ? item.responses : []
  const preferred = responses.find(response => response.label === item.versionUsed) || responses[1] || responses[0]
  const brief = item.resourceBrief || {}
  const briefText = [
    brief.summary?.length ? listToText('Executive Summary', brief.summary) : '',
    brief.talkingPoints?.length ? listToText('Talking Points', brief.talkingPoints) : '',
    brief.emailDraft ? `Email Draft\n${brief.emailDraft}` : '',
  ].filter(Boolean).join('\n\n')

  return [
    stakeholderSafe ? 'CommKit Stakeholder Summary' : 'CommKit Context Pack',
    `Recipient: ${item.recipientLabel || item.receiver || 'Not specified'}`,
    `Relationship: ${getRelationshipMeta(item).label}`,
    item.threadTitle ? `Thread: ${item.threadTitle}` : '',
    `Topic: ${item.situationTitle || item.situation || 'Conversation'}`,
    '',
    'Situation:',
    item.situation || '',
    '',
    stakeholderSafe ? '' : item.framework ? `Model/framework: ${item.framework}` : '',
    preferred?.text ? `${stakeholderSafe ? 'Recommended message' : 'Selected response'}:\n${preferred.text}` : '',
    preferred?.emailText ? `Email option:\n${preferred.emailText}` : '',
    briefText,
  ].filter(line => line !== '').join('\n')
}

function renderBriefSection(title, copyText, items) {
  return `
    <div style="background:var(--s3);border:1px solid var(--border);border-radius:12px;padding:11px;margin-top:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);flex:1;">${escapeHtml(title)}</div>
        <button class="btn history-copy" data-text="${escapeAttr(copyText)}" style="font-size:11px;padding:7px 10px;">Copy</button>
      </div>
      <ul style="padding-left:17px;color:var(--text2);font-size:12px;line-height:1.6;">
        ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </div>
  `
}

function renderPresentationSection(copyText, slides) {
  return `
    <div style="background:var(--s3);border:1px solid var(--border);border-radius:12px;padding:11px;margin-top:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);flex:1;">Presentation Outline</div>
        <button class="btn history-copy" data-text="${escapeAttr(copyText)}" style="font-size:11px;padding:7px 10px;">Copy</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        ${slides.map((slide, index) => `
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:4px;">${index + 1}. ${escapeHtml(slide.slide)}</div>
            <ul style="padding-left:17px;color:var(--text2);font-size:12px;line-height:1.55;">
              ${(slide.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderEmailSection(email) {
  return `
    <div style="background:var(--s3);border:1px solid var(--border);border-radius:12px;padding:11px;margin-top:8px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);flex:1;">Email Draft</div>
        <button class="btn history-copy" data-text="${escapeAttr(email)}" style="font-size:11px;padding:7px 10px;">Copy</button>
      </div>
      <div style="white-space:pre-wrap;color:var(--text2);font-size:12px;line-height:1.6;">${escapeHtml(email)}</div>
    </div>
  `
}

function renderHistoryResponse(response) {
  const text = response.text || response.shortText || response.emailText || ''

  return `
    <div style="background:var(--s3);border:1px solid var(--border);border-radius:12px;overflow:hidden;">
      <div style="padding:9px 11px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
        <div style="font-size:12px;font-weight:800;color:var(--text);flex:1;">${escapeHtml(response.label || 'Response')}</div>
        ${response.tone ? `<div class="badge badge-accent">${escapeHtml(response.tone)}</div>` : ''}
      </div>
      <div style="padding:11px;font-size:12px;color:var(--text2);line-height:1.65;font-style:italic;">${escapeHtml(text)}</div>
      ${response.shortText || response.emailText ? `
        <div style="padding:0 11px 10px;display:flex;gap:7px;flex-wrap:wrap;">
          ${response.shortText ? `<button class="btn history-copy" data-text="${escapeAttr(response.shortText)}" style="font-size:11px;padding:8px 10px;">Copy short</button>` : ''}
          ${response.emailText ? `<button class="btn history-copy" data-text="${escapeAttr(response.emailText)}" style="font-size:11px;padding:8px 10px;">Copy email</button>` : ''}
          <button class="btn history-copy" data-text="${escapeAttr(text)}" style="font-size:11px;padding:8px 10px;">Copy spoken</button>
        </div>
      ` : `
        <div style="padding:0 11px 10px;">
          <button class="btn history-copy" data-text="${escapeAttr(text)}" style="font-size:11px;padding:8px 10px;">Copy response</button>
        </div>
      `}
    </div>
  `
}

function renderEmptyState() {
  return `
    <div style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:18px 16px;text-align:center;">
      <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--text);margin-bottom:8px;">No conversations yet</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:14px;">Generate your first response and it will show up here.</div>
      <button id="historyStart" class="btn btn-primary btn-full">Start a conversation →</button>
    </div>
  `
}

function formatDate(timestamp) {
  if (!timestamp) return 'Recently'
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function listToText(title, items = []) {
  return `${title}\n${items.map(item => `- ${item}`).join('\n')}`
}

function presentationToText(slides = []) {
  return slides.map(slide => `${slide.slide}\n${(slide.points || []).map(point => `- ${point}`).join('\n')}`).join('\n\n')
}

function getRelationshipMeta(item) {
  const category = item.relationship || inferRelationshipCategory(`${item.receiver || ''} ${item.situation || ''}`)
  const meta = RELATIONSHIP_META[category] || RELATIONSHIP_META.professional
  return meta
}

const RELATIONSHIP_META = {
  professional: {
    label: 'Professional',
    icon: '💼',
    color: 'var(--accent)',
    bg: 'var(--accent-dim)',
    border: 'var(--accent-glow)',
  },
  manager: {
    label: 'Manager',
    icon: '⬆️',
    color: 'var(--gold)',
    bg: 'var(--gold-dim)',
    border: 'var(--gold-border)',
  },
  peer: {
    label: 'Peer',
    icon: '🤝',
    color: 'var(--blue)',
    bg: 'var(--blue-dim)',
    border: 'var(--blue-border)',
  },
  'direct-report': {
    label: 'Direct report',
    icon: '👥',
    color: 'var(--green)',
    bg: 'var(--green-dim)',
    border: 'var(--green-border)',
  },
  client: {
    label: 'Client',
    icon: '🏢',
    color: 'var(--green)',
    bg: 'var(--green-dim)',
    border: 'var(--green-border)',
  },
  personal: {
    label: 'Personal',
    icon: '🧭',
    color: 'var(--rose)',
    bg: 'var(--rose-dim)',
    border: 'var(--rose-border)',
  },
  family: {
    label: 'Family',
    icon: '🏠',
    color: 'var(--green)',
    bg: 'var(--green-dim)',
    border: 'var(--green-border)',
  },
  friend: {
    label: 'Friend',
    icon: '⭐',
    color: 'var(--blue)',
    bg: 'var(--blue-dim)',
    border: 'var(--blue-border)',
  },
}

function inferRelationshipCategory(value = '') {
  const text = String(value).toLowerCase()

  if (/\b(mom|mother|dad|father|parent|sister|brother|spouse|wife|husband|child|son|daughter|family)\b/.test(text)) return 'family'
  if (/\b(friend|roommate|neighbor)\b/.test(text)) return 'friend'
  if (/\b(personal|relationship|dating|boyfriend|girlfriend)\b/.test(text)) return 'personal'
  if (/\b(manager|boss|supervisor|lead|director)\b/.test(text)) return 'manager'
  if (/\b(client|customer|vendor|partner)\b/.test(text)) return 'client'
  if (/\b(coworker|colleague|peer|teammate)\b/.test(text)) return 'peer'
  if (/\b(employee|team member|direct report|staff|worker)\b/.test(text)) return 'direct-report'

  return 'professional'
}

function inferReceiverLabel(situation = '') {
  const text = String(situation).toLowerCase()

  if (/\b(manager|boss|supervisor|lead|director)\b/.test(text)) return 'manager'
  if (/\b(employee|team member|direct report|staff|worker)\b/.test(text)) return 'direct report'
  if (/\b(coworker|colleague|peer|teammate)\b/.test(text)) return 'coworker'
  if (/\b(client|customer|vendor|partner)\b/.test(text)) return 'client'

  return 'the other person'
}
