/**
 * CommKit Privacy Lock
 * Sets up or unlocks the local encrypted vault.
 */

export function renderPrivacyLock({ mode, error = '' }) {
  const isSetup = mode === 'setup'

  return `
    <div id="screen-lock" class="screen active" style="background:var(--bg);justify-content:flex-end;padding:0 26px 54px;position:relative;overflow:hidden;">
      <div style="position:absolute;width:280px;height:280px;top:-70px;right:-90px;border-radius:50%;filter:blur(60px);background:var(--accent-glow);pointer-events:none;"></div>

      <div style="position:relative;z-index:2;">
        <div style="width:58px;height:58px;border-radius:18px;background:var(--s2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:22px;">🔐</div>
        <div class="kicker" style="margin-bottom:14px;">Local encryption</div>
        <div style="font-family:var(--font-display);font-size:36px;line-height:1.02;color:var(--text);font-weight:700;margin-bottom:10px;">
          ${isSetup ? 'Protect your CommKit profile' : 'Unlock CommKit'}
        </div>
        <div style="font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:22px;">
          ${isSetup
            ? 'Create a passphrase for this device. Your profile, tags, and conversation history will be encrypted before they are saved locally.'
            : 'Enter your passphrase to decrypt your on-device profile and conversation history.'}
        </div>

        <input id="lockPassphrase" type="password" autocomplete="current-password" style="width:100%;background:var(--s2);border:1.5px solid var(--border);border-radius:14px;padding:15px 14px;color:var(--text);font-family:var(--font-body);font-size:15px;margin-bottom:10px;" placeholder="${isSetup ? 'Create passphrase' : 'Passphrase'}">
        ${isSetup ? `<input id="lockConfirm" type="password" autocomplete="new-password" style="width:100%;background:var(--s2);border:1.5px solid var(--border);border-radius:14px;padding:15px 14px;color:var(--text);font-family:var(--font-body);font-size:15px;margin-bottom:10px;" placeholder="Confirm passphrase">` : ''}

        ${error ? `<div style="background:var(--error-dim);border:1px solid var(--error-border);border-radius:10px;padding:10px 11px;color:var(--error);font-size:12px;line-height:1.5;margin-bottom:12px;">${error}</div>` : ''}

        <button id="lockSubmit" class="btn btn-primary btn-full" style="margin-bottom:10px;">${isSetup ? 'Encrypt this device →' : 'Unlock →'}</button>
        ${!isSetup ? `<button id="lockReset" class="btn btn-full" style="border-radius:var(--radius-lg);">Reset local data</button>` : ''}

        <div style="font-size:11px;color:var(--muted);line-height:1.6;margin-top:14px;">
          CommKit cannot recover this passphrase. If you reset, only local profile/history data on this device is cleared.
        </div>
      </div>
    </div>
  `
}

export function bindPrivacyLock({ mode, onSubmit, onReset }) {
  document.getElementById('lockSubmit')?.addEventListener('click', () => {
    onSubmit({
      passphrase: document.getElementById('lockPassphrase')?.value || '',
      confirm: document.getElementById('lockConfirm')?.value || '',
    })
  })

  document.getElementById('lockPassphrase')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') document.getElementById('lockSubmit')?.click()
  })

  if (mode === 'setup') {
    document.getElementById('lockConfirm')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') document.getElementById('lockSubmit')?.click()
    })
  }

  document.getElementById('lockReset')?.addEventListener('click', () => {
    if (confirm('Reset encrypted CommKit data on this device? This cannot be undone.')) {
      onReset()
    }
  })
}
