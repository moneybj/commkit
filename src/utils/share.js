/**
 * CommKit Share
 * Native share sheet + fallback copy
 */

import { showToast } from './toast.js'

let shareOverlayEl = null
let shareSheetEl = null
let currentText = ''

export function initShare() {
  shareOverlayEl = document.createElement('div')
  shareOverlayEl.className = 'share-overlay'
  shareOverlayEl.addEventListener('click', closeShare)

  shareSheetEl = document.createElement('div')
  shareSheetEl.className = 'share-sheet'
  shareSheetEl.innerHTML = `
    <div class="share-handle"></div>
    <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:16px;">Share this response</div>
    <div class="share-apps">
      <div class="share-app" data-app="email">
        <div class="share-app-icon" style="background:var(--s3);">📧</div>
        <div class="share-app-label">Email</div>
      </div>
      <div class="share-app" data-app="whatsapp">
        <div class="share-app-icon" style="background:var(--green-dim);">💬</div>
        <div class="share-app-label">WhatsApp</div>
      </div>
      <div class="share-app" data-app="slack">
        <div class="share-app-icon" style="background:var(--rose-dim);">⚡</div>
        <div class="share-app-label">Slack</div>
      </div>
      <div class="share-app" data-app="messages">
        <div class="share-app-icon" style="background:var(--blue-dim);">💭</div>
        <div class="share-app-label">Messages</div>
      </div>
      <div class="share-app" data-app="copy">
        <div class="share-app-icon" style="background:var(--s3);">📋</div>
        <div class="share-app-label">Copy</div>
      </div>
    </div>
    <button class="btn btn-full" style="border-radius:12px;" id="shareClose">Cancel</button>
  `

  shareSheetEl.querySelectorAll('.share-app').forEach(app => {
    app.addEventListener('click', () => handleShareApp(app.dataset.app))
  })
  shareSheetEl.querySelector('#shareClose').addEventListener('click', closeShare)

  document.body.appendChild(shareOverlayEl)
  document.body.appendChild(shareSheetEl)
}

export function openShare(text) {
  currentText = text

  // Try native share first (works great on mobile)
  if (navigator.share) {
    navigator.share({
      title: 'CommKit Response',
      text: text,
    }).catch(() => {
      // User cancelled or error — show custom sheet
      showShareSheet()
    })
    return
  }

  showShareSheet()
}

function showShareSheet() {
  if (!shareSheetEl) initShare()
  shareOverlayEl.classList.add('open')
  shareSheetEl.classList.add('open')
}

export function closeShare() {
  shareOverlayEl?.classList.remove('open')
  shareSheetEl?.classList.remove('open')
}

function handleShareApp(app) {
  closeShare()
  const encoded = encodeURIComponent(currentText)

  switch (app) {
    case 'email':
      window.location.href = `mailto:?subject=CommKit Response&body=${encoded}`
      break
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encoded}`, '_blank')
      break
    case 'slack':
      copyToClipboard(currentText)
      showToast('Copied — paste into Slack')
      break
    case 'messages':
      window.location.href = `sms:?body=${encoded}`
      break
    case 'copy':
      copyToClipboard(currentText)
      showToast('✓ Copied to clipboard')
      break
  }
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // Fallback
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  } catch {
    return false
  }
}
