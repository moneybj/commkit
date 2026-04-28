/**
 * CommKit Welcome Screen
 * First thing new users see
 * Goal: get to value in one tap
 */

export function renderWelcome() {
  return `
    <div id="screen-welcome" class="screen active" style="
      background: var(--bg);
      justify-content: flex-end;
      padding-bottom: 52px;
      position: relative;
      overflow: hidden;
    ">
      <!-- Atmospheric orbs -->
      <div style="position:absolute;width:300px;height:300px;top:-80px;right:-80px;border-radius:50%;filter:blur(60px);background:var(--accent-glow);pointer-events:none;"></div>
      <div style="position:absolute;width:200px;height:200px;bottom:100px;left:-60px;border-radius:50%;filter:blur(60px);background:var(--green-soft);pointer-events:none;"></div>
      <div style="position:absolute;width:150px;height:150px;top:35%;left:35%;border-radius:50%;filter:blur(60px);background:var(--gold-soft);pointer-events:none;"></div>

      <div style="position:relative;z-index:2;padding:0 28px;">
        <!-- Kicker -->
        <div style="font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;display:flex;align-items:center;gap:10px;">
          <span style="display:inline-block;width:18px;height:1px;background:var(--accent);"></span>
          Say the right thing — every time
        </div>

        <!-- Headline -->
        <div style="font-family:var(--font-display);font-size:56px;line-height:.92;color:var(--text);margin-bottom:8px;font-weight:700;letter-spacing:-.02em;">
          Comm<em style="color:var(--accent);">Kit</em>
        </div>

        <!-- Sub -->
        <div style="font-size:14px;color:var(--muted);line-height:1.65;margin-bottom:28px;max-width:300px;">
          Speak or type your situation. Get 3 calibrated responses — backed by research — in under a minute.
        </div>

        <!-- Audience pills -->
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:32px;">
          ${['🎤 Voice or type', '👤 Any level', '⚡ Signals · Layers', '🔒 On-device'].map(p => `
            <div style="display:flex;align-items:center;gap:6px;background:var(--s2);border:1px solid var(--border);border-radius:20px;padding:7px 12px;font-size:12px;font-weight:500;color:var(--text2);">${p}</div>
          `).join('')}
        </div>

        <!-- CTA -->
        <button id="welcomeStart" style="
          width:100%;padding:18px 24px;
          background:var(--accent);color:var(--on-accent);
          border-radius:18px;font-size:15px;font-weight:800;
          border:none;cursor:pointer;
          font-family:var(--font-body);
          display:flex;align-items:center;justify-content:space-between;
          box-shadow:0 8px 40px var(--accent-glow);
          transition:all .2s;
        ">
          <div>
            <div>Get started free</div>
            <div style="font-size:11px;font-weight:500;opacity:.75;margin-top:2px;">No signup · Just speak or type your situation</div>
          </div>
          <span>→</span>
        </button>
      </div>
    </div>
  `
}

export function bindWelcome({ onStart }) {
  document.getElementById('welcomeStart')?.addEventListener('click', onStart)
}
