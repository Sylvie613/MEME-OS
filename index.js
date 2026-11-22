/**
 * MÉMÉ OS v0.2.2
 * Separate backdrop + panel structure for iOS/SillyTavern compatibility.
 */
const MEME_ID = 'meme-os-heart-launcher';
const BACKDROP_ID = 'meme-os-backdrop';
const PANEL_ID = 'meme-os-panel';

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
    <button type="button" class="meme-module" data-meme-module="${key}">
      <span class="meme-module-sigil">${sigil}</span>
      <span class="meme-module-copy"><b>${title}</b><small>${sub}</small></span>
      <span class="meme-module-arrow">›</span>
    </button>
  `;
}

function panelMarkup() {
  return `
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
          <article><small>AP</small><strong>000</strong><em>改造点</em></article>
          <article><small>SV</small><strong>000</strong><em>精液值</em></article>
          <article><small>CHARM</small><strong>03</strong><em>综合魅力</em></article>
        </div>
      </section>

      <section class="meme-modules">
        <div class="meme-section-head">
          <div><small>PRIVATE ACCESS</small><h3>欲望系统</h3></div>
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
      <span>PRIVATE CONTRACT</span><b>♥</b><span>NO ESCAPE</span>
    </footer>
  `;
}

function ensureShell() {
  let backdrop = document.getElementById(BACKDROP_ID);
  let panel = document.getElementById(PANEL_ID);

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = BACKDROP_ID;
    backdrop.addEventListener('click', closeMemeOS);
    document.body.appendChild(backdrop);
  }

  if (!panel) {
    panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.className = 'meme-os-window';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'MÉMÉ OS');
    panel.innerHTML = panelMarkup();

    panel.addEventListener('click', (event) => {
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

    document.body.appendChild(panel);
  }

  return { backdrop, panel };
}

function openMemeOS() {
  const { backdrop, panel } = ensureShell();
  backdrop.classList.add('is-open');
  panel.classList.add('is-open');
  document.documentElement.classList.add('meme-os-open');
}

function closeMemeOS() {
  document.getElementById(BACKDROP_ID)?.classList.remove('is-open');
  document.getElementById(PANEL_ID)?.classList.remove('is-open');
  document.documentElement.classList.remove('meme-os-open');
}

function mount() {
  const button = makeLauncher();
  positionLauncher(button);
}

function start() {
  mount();
  ensureShell();

  globalThis.__meme_os_probe_timer__ = setInterval(mount, 1000);
  window.addEventListener('resize', mount, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(mount, 150), { passive: true });
}

if (globalThis.jQuery) {
  globalThis.jQuery(start);
} else if (globalThis.$) {
  globalThis.$(start);
} else {
  setTimeout(start, 1000);
}
