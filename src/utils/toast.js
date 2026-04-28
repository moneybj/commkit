/**
 * CommKit Toast
 * Lightweight notification system
 */

let toastEl = null
let toastTimer = null

export function initToast() {
  toastEl = document.createElement('div')
  toastEl.className = 'toast'
  toastEl.setAttribute('role', 'status')
  toastEl.setAttribute('aria-live', 'polite')
  document.body.appendChild(toastEl)
}

export function showToast(message, duration = 2400) {
  if (!toastEl) initToast()

  toastEl.textContent = message
  toastEl.classList.add('show')

  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show')
  }, duration)
}
