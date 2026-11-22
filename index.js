/**
 * MÉMÉ OS v0.2.1
 * Visual-only succubus shell. Keeps the proven timing-safe launcher mount.
 */
const MEME_ID = 'meme-os-heart-launcher';
const OVERLAY_ID = 'meme-os-overlay';

function positionLauncher(button) {
  const send = document.getElementById('send_but');
  if (!send) {
    button.style.right = '18px';
    button.style.bottom = '112px';
    return;
  }

  const rect = send.getBoundingClientRect();
  const width = 44;
  const height = 40;
  const gap = 18;
  const left = Math.min(window.innerWidth - width - 10, rect.left + (rect.width - width) / 2 - 8);
  const top = Math.max(8, rect.top - height - gap);

  button.style.left = left + 'px';
  button.style.top = top + 'px';
  button.style.right = 'auto';
  button.style.bottom = 'auto';
}

function heartMarkup() {
  return `
    <svg viewBox="0 0 100 90" width="44" height="40" aria-hidden="true">
      <path d="M50 84
               C43 76 11 57 7 34
               C4 17 15 6 29 6
               C39 6 46 12 50 20
               C54 12 61 6 71 6
               C85 6 96 17 93 34
               C89 57 57 76 50 84Z"
            fill="#f5a7c2"
            stroke="#dc789d"
            stroke-width="3"/>
      <path d="M24 18 C31 11 40 12 46 21"
            fill="none"
            stroke="rgba(255,255,255,.72)"
            stroke-width="5"
            stroke-linecap="round"/>
    </svg>
    <span>MÉ</span>
  `;
}

function makeLauncher() {
  let button = document.getElementById(MEME_ID);
  if (button) return button;

  button = document.createElement('button');
  button.id = MEME_ID;
  button.type = 'button';
  button.title = '打开 MÉMÉ OS';
  button.setAttribute('aria-label', '打开 MÉMÉ OS');
  button.innerHTML = heartMarkup();

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openMemeOS();
  });

  document.body.appendChild(button);
  return button;
}

function moduleCard(key, sigil, title, sub) {
  return `
    <button type="button" class="meme-module meme-module--${key}" data-meme-module="${key}">
      <span class="meme-module-sigil">${sigil}</span>
      <span class="meme-module-copy">
        <b>${title}</b>
        <small>${sub}</small>
      </span>
      <span class="meme-module-arrow">›</span>
    </button>
  `;
}

function shellMarkup() {
  return `
    <div class="meme-os-dim" data-meme-close></div>

    <section class="meme-os-window" role="dialog" aria-modal="true" aria-label="MÉMÉ OS">
      <div class="meme-ambient meme-ambient--pink"></div>
      <div class="meme-ambient meme-ambient--violet"></div>

      <div class="meme-horn meme-horn--left"></div>
      <div class="meme-horn meme-horn--right"></div>

      <header class="meme-head">
        <div>
          <span class="meme-kicker">SUCCUBUS PROTOCOL</span>
          <div class="meme-title"><span>MÉMÉ</span><i>OS</i></div>
        </div>
        <button class="meme-close" type="button" data-meme-close aria-label="关闭">×</button>
      </header>

      <main class="meme-scroll">
        <section class="meme-contract">
          <div class="meme-contract-top">
            <span class="meme-status"><i></i> BOUND</span>
            <span class="meme-code">HOST · 001</span>
          </div>

          <div class="meme-seal">
            <span class="meme-seal-ring"></span>
            <span class="meme-seal-heart">♥</span>
          </div>

          <p class="meme-contract-label">DESIRE ENGINE</p>
          <h2>初始改造阶段</h2>
          <p class="meme-contract-copy">外貌、欲望、奖励与代价，都将被系统记录。</p>

          <div class="meme-progress"><span></span></div>

          <div class="meme-stat-grid">
            <article>
              <small>AP</small>
              <strong>000</strong>
              <em>改造点</em>
            </article>
            <article>
              <small>SV</small>
              <strong>000</strong>
              <em>精液值</em>
            </article>
            <article>
              <small>CHARM</small>
              <strong>03</strong>
              <em>综合魅力</em>
            </article>
          </div>
        </section>

        <section class="meme-modules">
          <div class="meme-section-head">
            <div>
              <small>PRIVATE ACCESS</small>
              <h3>欲望系统</h3>
            </div>
            <span>7 / 7</span>
          </div>

          <div class="meme-module-grid">
            ${moduleCard('me','♡','ME','宿主改造')}
            ${moduleCard('task','✦','TASK','任务与奖励')}
            ${moduleCard('shop','◇','SHOP','欲望商城')}
            ${moduleCard('men','♂','MEN','对象档案')}
            ${moduleCard('system','♛','SYSTEM','管理员')}
            ${moduleCard('record','≋','RECORD','成长记录')}
            ${moduleCard('home','⌂','HOME','系统总览')}
          </div>
        </section>

        <section class="meme-whisper">
          <span class="meme-whisper-mark">♥</span>
          <div>
            <small>SYSTEM WHISPER</small>
            <p>“别急。你现在还只是绑定成功而已。”</p>
          </div>
        </section>
      </main>

      <footer class="meme-footer">
        <span>PRIVATE CONTRACT</span>
        <b>♥</b>
        <span>NO ESCAPE</span>
      </footer>
    </section>
  `;
}

function ensureOverlay() {
  let overlay = document.getElementById(OVERLAY_ID);
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'meme-os-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = shellMarkup();

  // Hard-pin the modal to the real viewport. This avoids SillyTavern theme/layout
  // transforms and iOS Safari stacking contexts swallowing the visual window.
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('width', '100vw', 'important');
  overlay.style.setProperty('height', '100dvh', 'important');
  overlay.style.setProperty('z-index', '2147483000', 'important');
  overlay.style.setProperty('display', 'block', 'important');
  overlay.style.setProperty('opacity', '0', 'important');
  overlay.style.setProperty('pointer-events', 'none', 'important');
  overlay.style.setProperty('transform', 'none', 'important');
  overlay.style.setProperty('overflow', 'visible', 'important');

  const dim = overlay.querySelector('.meme-os-dim');
  if (dim) {
    dim.style.setProperty('position', 'fixed', 'important');
    dim.style.setProperty('inset', '0', 'important');
    dim.style.setProperty('width', '100vw', 'important');
    dim.style.setProperty('height', '100dvh', 'important');
    dim.style.setProperty('z-index', '2147483001', 'important');
  }

  const win = overlay.querySelector('.meme-os-window');
  if (win) {
    win.style.setProperty('position', 'fixed', 'important');
    win.style.setProperty('left', '50%', 'important');
    win.style.setProperty('right', 'auto', 'important');
    win.style.setProperty('top', 'auto', 'important');
    win.style.setProperty('bottom', 'max(18px, env(safe-area-inset-bottom))', 'important');
    win.style.setProperty('width', 'min(390px, calc(100vw - 20px))', 'important');
    win.style.setProperty('max-height', '78dvh', 'important');
    win.style.setProperty('z-index', '2147483002', 'important');
    win.style.setProperty('display', 'flex', 'important');
    win.style.setProperty('visibility', 'visible', 'important');
    win.style.setProperty('opacity', '1', 'important');
    win.style.setProperty('transform', 'translateX(-50%) translateY(14px) scale(.985)', 'important');
  }

  overlay.addEventListener('click', (event) => {
    if (event.target.closest('[data-meme-close]')) {
      closeMemeOS();
      return;
    }

    const card = event.target.closest('[data-meme-module]');
    if (card) {
      card.classList.remove('meme-module-pulse');
      void card.offsetWidth;
      card.classList.add('meme-module-pulse');
    }
  });

  document.documentElement.appendChild(overlay);
  return overlay;
}

function openMemeOS() {
  const overlay = ensureOverlay();
  const win = overlay.querySelector('.meme-os-window');
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-open');
  overlay.style.setProperty('opacity', '1', 'important');
  overlay.style.setProperty('pointer-events', 'auto', 'important');
  if (win) {
    win.style.setProperty('transform', 'translateX(-50%) translateY(0) scale(1)', 'important');
  }
  document.documentElement.classList.add('meme-os-open');
}

function closeMemeOS() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  const win = overlay.querySelector('.meme-os-window');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('is-open');
  overlay.style.setProperty('opacity', '0', 'important');
  overlay.style.setProperty('pointer-events', 'none', 'important');
  if (win) {
    win.style.setProperty('transform', 'translateX(-50%) translateY(14px) scale(.985)', 'important');
  }
  document.documentElement.classList.remove('meme-os-open');
}

function mount() {
  const button = makeLauncher();
  positionLauncher(button);
  return true;
}

function start() {
  mount();
  ensureOverlay();

  const timer = setInterval(mount, 1000);
  globalThis.__meme_os_probe_timer__ = timer;

  window.addEventListener('resize', mount, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(mount, 150), { passive: true });
}

if (globalThis.jQuery) {
  globalThis.jQuery(() => start());
} else if (globalThis.$) {
  globalThis.$(() => start());
} else {
  setTimeout(start, 1000);
}
