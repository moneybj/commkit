/**
 * CommKit Supporting Docs
 * Turns conversation context and supporting material into collateral.
 */

import { copyToClipboard } from '../utils/share.js'
import { showToast } from '../utils/toast.js'
import { escapeAttr, escapeHtml } from '../utils/escape.js'

let selectedAttachments = []

export function renderResourceCenter({ brief = null, isLoading = false, error = '', form = {} } = {}) {
  selectedAttachments = form.attachments || []

  return `
    <div id="screen-resource" class="screen active" style="background:var(--bg);overflow-y:auto;padding:0 20px 120px;">
      <div style="position:sticky;top:0;z-index:10;background:var(--bg);border-bottom:1px solid var(--border);padding:18px 0 14px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(12px);">
        <button id="resourceBack" style="width:36px;height:36px;border-radius:50%;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;color:var(--text2);">←</button>
        <div>
          <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);line-height:1.05;">Supporting Docs</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;">Conversation context → summary, slides, talking points</div>
        </div>
      </div>

      <section style="padding-top:16px;">
        <div style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:15px;margin-bottom:14px;">
          <div class="section-label">Attached context</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:12px;">
            Best after CommKit generates responses. Add any extra material only if it helps shape the summary, slides, talking points, or email.
          </div>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Document title</label>
          <input id="resourceTitle" value="${escapeAttr(form.title || '')}" style="width:100%;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;color:var(--text);font-family:var(--font-body);margin-bottom:10px;" placeholder="e.g. QC review for batch deviation">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Audience</label>
          <input id="resourceAudience" value="${escapeAttr(form.audience || '')}" style="width:100%;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;color:var(--text);font-family:var(--font-body);margin-bottom:10px;" placeholder="e.g. lab manager, QA lead, client">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Name, alias, or group</label>
          <input id="resourceRecipient" value="${escapeAttr(form.recipientLabel || '')}" style="width:100%;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;color:var(--text);font-family:var(--font-body);margin-bottom:10px;" placeholder="e.g. Manager A, QA team, Client group">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Relationship / context</label>
          <select id="resourceRelationship" style="width:100%;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;color:var(--text);font-family:var(--font-body);margin-bottom:10px;">
            ${renderRelationshipOptions(form.relationship)}
          </select>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Attach extra documents or images</label>
          <input id="resourceFile" type="file" multiple accept=".txt,.md,.csv,.json,.log,.pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="width:100%;font-size:12px;color:var(--muted);margin-bottom:10px;">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Use camera / scan extra context</label>
          <input id="resourceCamera" type="file" accept="image/*" capture="environment" multiple style="width:100%;font-size:12px;color:var(--muted);margin-bottom:10px;">
          <div id="resourceFileName" style="font-size:11px;color:var(--green);line-height:1.5;margin-bottom:10px;${selectedAttachments.length ? '' : 'display:none;'}">${renderAttachmentSummary(selectedAttachments)}</div>

          <div style="font-size:11px;color:var(--muted);line-height:1.5;background:var(--s3);border:1px solid var(--border);border-radius:10px;padding:10px 11px;margin-bottom:10px;">
            PDF and image files are sent to Claude for reading. DOC/DOCX uploads are accepted, but for this beta paste the relevant text or export to PDF for best results.
          </div>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Paste supporting text</label>
          <textarea id="resourceDoc" style="background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;min-height:150px;margin-bottom:10px;" placeholder="Paste QC review notes, lab findings, SOP changes, investigation summary...">${escapeHtml(form.documentText || '')}</textarea>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">What do you need to do with it?</label>
          <textarea id="resourceContext" style="background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;min-height:74px;margin-bottom:12px;" placeholder="e.g. I need to brief my manager in person and send a follow-up email.">${escapeHtml(form.context || '')}</textarea>

          ${error ? `<div style="background:var(--error-dim);border:1px solid var(--error-border);border-radius:10px;padding:10px 11px;color:var(--error);font-size:12px;line-height:1.5;margin-bottom:12px;">${escapeHtml(error)}</div>` : ''}

          <button id="resourceGenerate" class="btn btn-primary btn-full" ${isLoading ? 'disabled' : ''}>${isLoading ? 'Generating brief...' : 'Generate supporting brief →'}</button>
        </div>
      </section>

      ${brief ? renderBrief(brief) : ''}

      <div style="font-size:11px;color:var(--green-text);line-height:1.6;background:var(--green-dim);border:1px solid var(--green-border);border-radius:12px;padding:12px 14px;">
        <strong style="color:var(--green);">Privacy note.</strong> Document text is sent to Claude for generation, but CommKit does not store it server-side.
      </div>
    </div>
  `
}

export function bindResourceCenter({ onBack, onGenerate, onRefine }) {
  document.getElementById('resourceBack')?.addEventListener('click', onBack)

  document.getElementById('resourceFile')?.addEventListener('change', async (event) => {
    await handleFiles(event.target.files)
  })

  document.getElementById('resourceCamera')?.addEventListener('change', async (event) => {
    await handleFiles(event.target.files)
  })

  document.getElementById('resourceGenerate')?.addEventListener('click', () => {
    onGenerate({
      title: document.getElementById('resourceTitle')?.value.trim() || '',
      audience: document.getElementById('resourceAudience')?.value.trim() || '',
      recipientLabel: document.getElementById('resourceRecipient')?.value.trim() || '',
      relationship: document.getElementById('resourceRelationship')?.value || '',
      documentText: document.getElementById('resourceDoc')?.value.trim() || '',
      context: document.getElementById('resourceContext')?.value.trim() || '',
      attachments: selectedAttachments,
    })
  })

  document.querySelectorAll('.resource-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await copyToClipboard(btn.dataset.text || '')
      if (ok) showToast('✓ Copied')
    })
  })

  const resourceRefineInput = document.getElementById('resourceRefineInput')
  const resourceRefineSubmit = document.getElementById('resourceRefineSubmit')

  resourceRefineInput?.addEventListener('input', () => {
    if (resourceRefineSubmit) resourceRefineSubmit.disabled = resourceRefineInput.value.trim().length < 4
  })

  async function submitResourceRefinement(instruction) {
    const input = document.getElementById('resourceRefineInput')
    const btn = document.getElementById('resourceRefineSubmit')

    if (instruction.length < 4) {
      input?.focus()
      return
    }

    const original = btn.textContent
    btn.disabled = true
    btn.textContent = 'Refining brief...'

    try {
      await onRefine?.(instruction)
    } catch (err) {
      btn.disabled = false
      btn.textContent = original
      showToast(err.message || 'Could not refine brief')
    }
  }

  resourceRefineSubmit?.addEventListener('click', async () => {
    await submitResourceRefinement(resourceRefineInput?.value.trim() || '')
  })

  document.querySelectorAll('.resource-refine-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      document.querySelectorAll('.resource-refine-chip').forEach(btn => {
        btn.disabled = true
      })
      chip.textContent = 'Refining...'
      await submitResourceRefinement(chip.dataset.instruction || '')
    })
  })
}

function renderRelationshipOptions(selected = '') {
  const options = [
    ['', 'Select relationship'],
    ['manager', 'Manager / senior stakeholder'],
    ['peer', 'Coworker / peer'],
    ['direct-report', 'Direct report'],
    ['client', 'Client / partner'],
    ['professional', 'Professional'],
    ['personal', 'Personal'],
    ['family', 'Family'],
    ['friend', 'Friend'],
  ]

  return options.map(([value, label]) => (
    `<option value="${escapeAttr(value)}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`
  )).join('')
}

async function handleFiles(fileList) {
  const files = Array.from(fileList || [])
  if (!files.length) return

  const textarea = document.getElementById('resourceDoc')
  const fileName = document.getElementById('resourceFileName')

  for (const file of files) {
    if (isTextFile(file)) {
      const text = await file.text()
      if (textarea) {
        textarea.value = `${textarea.value ? `${textarea.value}\n\n` : ''}--- ${file.name} ---\n${text}`
      }
      selectedAttachments.push({ name: file.name, mediaType: file.type || 'text/plain', kind: 'text' })
      continue
    }

    if (isSupportedAttachment(file)) {
      selectedAttachments.push(await createAttachment(file))
      continue
    }

    selectedAttachments.push({
      name: file.name,
      mediaType: file.type || 'application/octet-stream',
      kind: 'unsupported',
      note: 'Paste this document text or export it to PDF for analysis.',
    })
  }

  if (fileName) {
    fileName.innerHTML = renderAttachmentSummary(selectedAttachments)
    fileName.style.display = 'block'
  }
}

function isTextFile(file) {
  return /\.(txt|md|csv|json|log)$/i.test(file.name) || file.type.startsWith('text/')
}

function isSupportedAttachment(file) {
  return file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

async function createAttachment(file) {
  const attachmentFile = file.type.startsWith('image/') ? await resizeImage(file) : file
  const dataUrl = await fileToDataUrl(attachmentFile)
  const [, base64 = ''] = dataUrl.split(',')

  return {
    name: file.name,
    mediaType: attachmentFile.type || file.type || 'application/octet-stream',
    kind: attachmentFile.type.startsWith('image/') ? 'image' : 'document',
    data: base64,
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function resizeImage(file) {
  const dataUrl = await fileToDataUrl(file)
  const image = await loadImage(dataUrl)
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))

  if (scale === 1 && file.size < 1200000) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.82)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function renderAttachmentSummary(attachments) {
  if (!attachments.length) return ''
  return attachments.map(file => {
    const status = file.kind === 'unsupported' ? 'Needs pasted text/PDF' : 'Loaded'
    return `<div>${escapeHtml(status)}: ${escapeHtml(file.name)}</div>`
  }).join('')
}

function renderBrief(brief) {
  return `
    <section style="display:flex;flex-direction:column;gap:12px;margin-bottom:14px;">
      ${renderMethodFramework(brief.methodFramework)}
      ${renderListCard('Executive Summary', brief.summary)}
      ${renderPresentation(brief.presentationOutline)}
      ${renderListCard('Talking Points', brief.talkingPoints)}
      ${renderEmailCard(brief.emailDraft)}
      ${renderQuestions(brief.questionsToExpect)}
      ${renderResourceRefinementCard(brief)}
    </section>
  `
}

function renderMethodFramework(methodFramework) {
  if (!methodFramework) return ''

  return `
    <article style="background:var(--gold-dim);border:1px solid var(--gold-border);border-radius:16px;padding:14px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin-bottom:7px;">Model used to generate this brief</div>
      <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:3px;">${escapeHtml(methodFramework.name || 'Communication model')}</div>
      ${methodFramework.source ? `<div style="font-size:11px;color:var(--gold-text);line-height:1.5;margin-bottom:8px;">${escapeHtml(methodFramework.source)}</div>` : ''}
      ${methodFramework.explanation ? `<div style="font-size:12px;color:var(--text2);line-height:1.65;margin-bottom:10px;">${escapeHtml(methodFramework.explanation)}</div>` : ''}
      ${Array.isArray(methodFramework.steps) && methodFramework.steps.length ? `
        <ol style="padding-left:18px;color:var(--text2);font-size:11px;line-height:1.6;">
          ${methodFramework.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
        </ol>
      ` : ''}
    </article>
  `
}

function renderResourceRefinementCard(brief) {
  const refinements = Array.isArray(brief?.refinements) ? brief.refinements : []
  const isLoading = !!brief?._refinementLoading

  return `
    <article style="background:linear-gradient(135deg,var(--s2),var(--s3));border:1.5px solid var(--border);border-top:2px solid var(--blue);border-radius:16px;padding:14px;">
      <div class="section-label" style="margin-bottom:8px;">Refine in conversation</div>
      <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--text);line-height:1.14;margin-bottom:7px;">Tune the brief for your audience.</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:12px;">Ask for changes like more technical detail, a shorter executive summary, or a stronger email follow-up.</div>
      ${brief?.refinementNote ? `<div style="background:var(--blue-dim);border:1px solid var(--blue-border);border-radius:10px;padding:9px 10px;font-size:11px;color:var(--text2);line-height:1.5;margin-bottom:10px;"><strong style="color:var(--blue);">Latest change:</strong> ${escapeHtml(brief.refinementNote)}</div>` : ''}
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
          ['Shorter summary', 'Make the executive summary shorter and easier to scan.'],
          ['More technical', 'Add more technical detail while keeping the brief organized.'],
          ['Stronger email', 'Make the email draft clearer and more action-oriented.'],
          ['Executive tone', 'Make this more suitable for a senior leader.'],
        ].map(([label, instruction]) => `
          <button class="btn resource-refine-chip" data-instruction="${escapeAttr(instruction)}" style="font-size:11px;padding:8px 10px;">${escapeHtml(label)}</button>
        `).join('')}
      </div>
      <textarea id="resourceRefineInput" style="background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;min-height:74px;margin-bottom:10px;" placeholder="Example: Make this more suitable for a QA director and add stronger risk language."></textarea>
      <button id="resourceRefineSubmit" class="btn btn-primary btn-full" disabled>${isLoading ? 'Refining brief...' : 'Refine typed request →'}</button>
    </article>
  `
}

function renderListCard(title, items = []) {
  const text = items.join('\n')
  return `
    <article style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="section-label" style="margin:0;flex:1;">${escapeHtml(title)}</div>
        <button class="btn resource-copy" data-text="${escapeAttr(text)}" style="font-size:11px;padding:7px 10px;">Copy</button>
      </div>
      <ul style="padding-left:18px;color:var(--text2);font-size:12px;line-height:1.65;">
        ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </article>
  `
}

function renderPresentation(slides = []) {
  const text = slides.map(slide => `${slide.slide}\n${(slide.points || []).map(point => `- ${point}`).join('\n')}`).join('\n\n')
  return `
    <article style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="section-label" style="margin:0;flex:1;">Presentation Outline</div>
        <button class="btn resource-copy" data-text="${escapeAttr(text)}" style="font-size:11px;padding:7px 10px;">Copy</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px;">
        ${slides.map((slide, index) => `
          <div style="background:var(--s3);border:1px solid var(--border);border-radius:12px;padding:11px;">
            <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:6px;">${index + 1}. ${escapeHtml(slide.slide)}</div>
            <ul style="padding-left:18px;color:var(--text2);font-size:12px;line-height:1.6;">
              ${(slide.points || []).map(point => `<li>${escapeHtml(point)}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </article>
  `
}

function renderEmailCard(email = '') {
  return `
    <article style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="section-label" style="margin:0;flex:1;">Email Draft</div>
        <button class="btn resource-copy" data-text="${escapeAttr(email)}" style="font-size:11px;padding:7px 10px;">Copy</button>
      </div>
      <div style="white-space:pre-wrap;background:var(--s3);border:1px solid var(--border);border-radius:12px;padding:12px;color:var(--text2);font-size:12px;line-height:1.65;">${escapeHtml(email)}</div>
    </article>
  `
}

function renderQuestions(questions = []) {
  return `
    <article style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:14px;">
      <div class="section-label">Questions To Expect</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${questions.map(item => `
          <div style="background:var(--s3);border:1px solid var(--border);border-radius:12px;padding:11px;">
            <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:6px;">Q ${escapeHtml(item.question)}</div>
            <div style="font-size:12px;color:var(--text2);line-height:1.6;"><span style="color:var(--green);font-weight:800;">A</span> ${escapeHtml(item.answer)}</div>
          </div>
        `).join('')}
      </div>
    </article>
  `
}
