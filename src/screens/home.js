/**
 * CommKit Home Screen
 * Returning user profile snapshot + quick action.
 */

import { escapeAttr, escapeHtml } from '../utils/escape.js'
import { getTreeRingsSVG } from '../features/signals.js'

export function renderHome({ profile, tags, layerInfo, history, sessionCount }) {
  const visibleTags = tags?.length ? tags : getStarterTags(profile)
  const recent = history?.[0]

  return `
    <div id="screen-home" class="screen active" style="background:var(--bg);overflow-y:auto;padding:22px 20px 120px;">
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:24px;">
        <div style="width:58px;height:58px;flex-shrink:0;">
          ${getTreeRingsSVG(layerInfo.current, 58)}
        </div>
        <div style="flex:1;">
          <div style="font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:5px;">Layer ${layerInfo.current} · ${escapeHtml(layerInfo.currentLayer.name)}</div>
          <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:var(--text);line-height:1.05;">Your comm profile</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.55;margin-top:6px;">
            ${sessionCount ? `${sessionCount} session${sessionCount === 1 ? '' : 's'} logged` : 'Ready for your first Signal'}${profile?.role ? ` · ${escapeHtml(profile.role)}` : ''}
          </div>
        </div>
      </div>

      <section style="background:linear-gradient(135deg,var(--s2),var(--s3));border:1.5px solid var(--border);border-top:2px solid var(--accent);border-radius:18px;padding:16px;margin-bottom:14px;">
        <div class="section-label">Quick action</div>
        <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);line-height:1.1;margin-bottom:8px;">Need words for a hard moment?</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:16px;">
          Speak or type what is happening. CommKit will give you three ways to say it in under a minute.
        </div>
        <button id="homeStart" class="btn btn-primary btn-full">Start a conversation →</button>
        <button id="homeResource" class="btn btn-full" style="margin-top:9px;border-radius:var(--radius-lg);">Upload docs for a brief →</button>
      </section>

      <section style="min-height:330px;background:var(--s2);border:1.5px solid var(--border);border-radius:18px;padding:16px;margin-bottom:16px;">
        <div class="section-label">Your Signals</div>
        <div style="font-family:var(--font-display);font-size:22px;font-weight:600;color:var(--text);line-height:1.12;margin-bottom:10px;">What CommKit is learning</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.65;margin-bottom:15px;">
          Tags come from what you actually choose, not a personality quiz. Remove any that do not fit.
        </div>
        <div id="homeTagCloud" style="display:flex;flex-wrap:wrap;gap:8px;">
          ${visibleTags.map(tag => renderTag(tag, tags?.length > 0)).join('')}
        </div>
      </section>

      ${recent ? `
        <button id="historyOpen" style="width:100%;text-align:left;background:var(--s1);border:1px solid var(--border);border-radius:14px;padding:13px 14px;margin-bottom:16px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:var(--font-body);">
          <div style="flex:1;min-width:0;">
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;">Last conversation</div>
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(recent.situationTitle || recent.situation || 'Recent session')}</div>
            <div style="font-size:11px;color:var(--muted);line-height:1.5;">${escapeHtml(recent.framework || 'Framework applied')} · ${escapeHtml(recent.inputMethod || 'text')}</div>
          </div>
          <div aria-hidden="true" style="width:34px;height:34px;border-radius:50%;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:22px;flex-shrink:0;">›</div>
        </button>
      ` : ''}

      <div style="font-size:11px;color:var(--green);line-height:1.6;background:var(--green-dim);border:1px solid var(--green-border);border-radius:12px;padding:12px 14px;">
        <strong style="color:var(--green);">Encrypted on this device.</strong> Your profile, tags, and history stay in your local vault.
      </div>
    </div>
  `
}

export function bindHome({ onStart, onResource, onHistory, onRemoveTag }) {
  document.getElementById('homeStart')?.addEventListener('click', onStart)
  document.getElementById('homeResource')?.addEventListener('click', onResource)
  document.getElementById('historyOpen')?.addEventListener('click', onHistory)

  document.querySelectorAll('.home-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      onRemoveTag(btn.dataset.label)
    })
  })
}

function renderTag(tag, removable) {
  const type = tag.type || 'style'
  return `
    <button class="tag ${escapeAttr(type)}" style="border:none;" ${removable ? `data-label="${escapeAttr(tag.label)}"` : 'disabled'}>
      <span>${escapeHtml(tag.label)}</span>
      ${removable ? `<span class="tag-x home-tag-remove" data-label="${escapeAttr(tag.label)}" aria-label="Remove ${escapeAttr(tag.label)}">×</span>` : ''}
    </button>
  `
}

function getStarterTags(profile) {
  const tags = []
  if (profile?.style) tags.push({ label: profile.style, type: 'style' })
  if (profile?.role) tags.push({ label: profile.role, type: 'growth' })
  if (!tags.length) tags.push({ label: 'Building confidence', type: 'growth' })
  return tags
}
