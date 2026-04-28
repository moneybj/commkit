/**
 * CommKit Resource Center
 * Document-to-summary, presentation, talking points, and email.
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
          <div style="font-family:var(--font-display);font-size:24px;font-weight:700;color:var(--text);line-height:1.05;">Resource Center</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;">Docs → summary, slides, talking points</div>
        </div>
      </div>

      <section style="padding-top:16px;">
        <div style="background:var(--s2);border:1.5px solid var(--border);border-radius:16px;padding:15px;margin-bottom:14px;">
          <div class="section-label">Upload or paste</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:12px;">
            Best for QC reviews, lab notes, SOP updates, incident summaries, and technical findings. Upload text files, PDFs, photos, screenshots, or use your camera to scan documents.
          </div>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Document title</label>
          <input id="resourceTitle" value="${escapeAttr(form.title || '')}" style="width:100%;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;color:var(--text);font-family:var(--font-body);margin-bottom:10px;" placeholder="e.g. QC review for batch deviation">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Audience</label>
          <input id="resourceAudience" value="${escapeAttr(form.audience || '')}" style="width:100%;background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;color:var(--text);font-family:var(--font-body);margin-bottom:10px;" placeholder="e.g. lab manager, QA lead, client">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Upload documents or images</label>
          <input id="resourceFile" type="file" multiple accept=".txt,.md,.csv,.json,.log,.pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="width:100%;font-size:12px;color:var(--muted);margin-bottom:10px;">

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Use camera / scan document</label>
          <input id="resourceCamera" type="file" accept="image/*" capture="environment" multiple style="width:100%;font-size:12px;color:var(--muted);margin-bottom:10px;">
          <div id="resourceFileName" style="font-size:11px;color:var(--green);line-height:1.5;margin-bottom:10px;${selectedAttachments.length ? '' : 'display:none;'}">${renderAttachmentSummary(selectedAttachments)}</div>

          <div style="font-size:11px;color:var(--muted);line-height:1.5;background:var(--s3);border:1px solid var(--border);border-radius:10px;padding:10px 11px;margin-bottom:10px;">
            PDF and image files are sent to Claude for reading. DOC/DOCX uploads are accepted, but for this beta paste the relevant text or export to PDF for best results.
          </div>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">Paste document text</label>
          <textarea id="resourceDoc" style="background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;min-height:150px;margin-bottom:10px;" placeholder="Paste QC review notes, lab findings, SOP changes, investigation summary...">${escapeHtml(form.documentText || '')}</textarea>

          <label style="display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px;">What do you need to do with it?</label>
          <textarea id="resourceContext" style="background:var(--s3);border:1.5px solid var(--border);border-radius:10px;padding:11px;min-height:74px;margin-bottom:12px;" placeholder="e.g. I need to brief my manager in person and send a follow-up email.">${escapeHtml(form.context || '')}</textarea>

          ${error ? `<div style="background:var(--error-dim);border:1px solid var(--error-border);border-radius:10px;padding:10px 11px;color:var(--error);font-size:12px;line-height:1.5;margin-bottom:12px;">${escapeHtml(error)}</div>` : ''}

          <button id="resourceGenerate" class="btn btn-primary btn-full" ${isLoading ? 'disabled' : ''}>${isLoading ? 'Generating brief...' : 'Generate resource brief →'}</button>
        </div>
      </section>

      ${brief ? renderBrief(brief) : ''}

      <div style="font-size:11px;color:var(--green-text);line-height:1.6;background:var(--green-dim);border:1px solid var(--green-border);border-radius:12px;padding:12px 14px;">
        <strong style="color:var(--green);">Privacy note.</strong> Document text is sent to Claude for generation, but CommKit does not store it server-side.
      </div>
    </div>
  `
}

export function bindResourceCenter({ onBack, onGenerate }) {
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
      ${renderListCard('Executive Summary', brief.summary)}
      ${renderPresentation(brief.presentationOutline)}
      ${renderListCard('Talking Points', brief.talkingPoints)}
      ${renderEmailCard(brief.emailDraft)}
      ${renderQuestions(brief.questionsToExpect)}
    </section>
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
