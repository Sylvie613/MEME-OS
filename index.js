/**
 * MÉMÉ OS v0.3.0
 * High-fidelity visual shell based on the approved succubus reference.
 * Native <dialog> retained for iOS Safari / SillyTavern reliability.
 */
const MEME_ID = 'meme-os-heart-launcher';
const DIALOG_ID = 'meme-os-dialog';

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

function launcherMarkup() {
  return `
    <svg viewBox="0 0 100 90" width="44" height="40" aria-hidden="true">
      <path d="M50 84 C43 76 11 57 7 34 C4 17 15 6 29 6 C39 6 46 12 50 20
               C54 12 61 6 71 6 C85 6 96 17 93 34 C89 57 57 76 50 84Z"
            fill="#f5a7c2" stroke="#dc789d" stroke-width="3"/>
      <path d="M24 18 C31 11 40 12 46 21"
            fill="none" stroke="rgba(255,255,255,.72)" stroke-width="5" stroke-linecap="round"/>
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
  button.setAttribute('aria-label','打开 MÉMÉ OS');
  button.innerHTML = launcherMarkup();
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openMemeOS();
  });
  document.body.appendChild(button);
  return button;
}

function crownMarkup() {
  return `
    <svg viewBox="0 0 92 82" width="54" height="48" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 29
                 C20 38 26 43 34 45
                 C38 46 41 45 46 41
                 C51 45 54 46 58 45
                 C66 43 72 38 78 29"
              stroke-width="3"/>
        <path d="M14 29 L25 36 L31 18 L40 36 L46 11 L52 36 L61 18 L67 36 L78 29"
              stroke-width="3"/>
        <path d="M27 50 C37 56 55 56 65 50" stroke-width="2.3"/>
        <path d="M46 53 L46 70" stroke-width="2.2"/>
      </g>
      <path d="M46 66 L51 72 L46 78 L41 72 Z" fill="currentColor"/>
      <path d="M46 8 L50 13 L46 18 L42 13 Z" fill="currentColor"/>
    </svg>
  `;
}

function moduleIcon(type) {
  const icons = {
    me: '<span class="meme-heart-outline">♡</span>',
    task: '<span class="meme-star-glyph">✦</span>',
    shop: '<span class="meme-diamond-glyph">◇</span>',
    men: '<span class="meme-mars-glyph">♂</span>',
    system: '<span class="meme-crown-mini">♛</span>',
    record: '<span class="meme-record-glyph">≋</span>',
    home: '<span class="meme-home-glyph">⌂</span>',
  };
  return icons[type] || '•';
}

function moduleCard(key, title, sub) {
  return `
    <button type="button" class="meme-module" data-meme-module="${key}">
      <span class="meme-module-icon">${moduleIcon(key)}</span>
      <span class="meme-module-copy">
        <b>${title}</b>
        <small>${sub}</small>
      </span>
      <span class="meme-module-arrow">›</span>
    </button>
  `;
}

function panelMarkup() {
  return `
    <section class="meme-os-window">
      <div class="meme-edge-glow meme-edge-glow--a"></div>
      <div class="meme-edge-glow meme-edge-glow--b"></div>

      <header class="meme-head">
        <div class="meme-brand">
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

          <div class="meme-crown-seal">
            <span class="meme-crown-orbit"></span>
            <span class="meme-crown-orbit meme-crown-orbit--inner"></span>
            <span class="meme-crown-symbol">${crownMarkup()}</span>
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
            ${moduleCard('me','ME','宿主改造')}
            ${moduleCard('task','TASK','任务与奖励')}
            ${moduleCard('shop','SHOP','欲望商城')}
            ${moduleCard('men','MEN','对象档案')}
            ${moduleCard('system','SYSTEM','管理员')}
            ${moduleCard('record','RECORD','成长记录')}
            ${moduleCard('home','HOME','系统总览')}
          </div>
        </section>
      </main>

      <footer class="meme-footer">
        <span class="meme-footer-spark">✦</span>
        <span>PRIVATE CONTRACT</span>
        <b>♥</b>
        <span>NO ESCAPE</span>
        <span class="meme-footer-spark">✦</span>
      </footer>
    </section>
  `;
}

function ensureDialog() {
  let dialog = document.getElementById(DIALOG_ID);
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.id = DIALOG_ID;
  dialog.setAttribute('aria-label','MÉMÉ OS');
  dialog.innerHTML = panelMarkup();

  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.closest('[data-meme-close]')) {
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

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeMemeOS();
  });

  document.body.appendChild(dialog);
  return dialog;
}

function openMemeOS() {
  const dialog = ensureDialog();
  if (!dialog.open) dialog.showModal();
  document.documentElement.classList.add('meme-os-open');
}

function closeMemeOS() {
  const dialog = document.getElementById(DIALOG_ID);
  if (dialog?.open) dialog.close();
  document.documentElement.classList.remove('meme-os-open');
}

function mount() {
  const button = makeLauncher();
  positionLauncher(button);
}

function start() {
  mount();
  ensureDialog();
  globalThis.__meme_os_probe_timer__ = setInterval(mount, 1000);
  window.addEventListener('resize', mount, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(mount,150), { passive:true });
}

if (globalThis.jQuery) globalThis.jQuery(start);
else if (globalThis.$) globalThis.$(start);
else setTimeout(start,1000);
