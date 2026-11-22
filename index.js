/**
 * MÉMÉ OS v0.5.0
 * Navigable content shell. Visual style + native <dialog> retained.
 * State-changing actions are intentionally preview-only in this build.
 */
const MEME_ID = 'meme-os-heart-launcher';
const DIALOG_ID = 'meme-os-dialog';

const PREVIEW_STATE = {
  ap: 0,
  sv: 0,
  charm: 3,
  stage: '初始改造阶段',
  systemLevel: 1,
  systemForm: '意识体',
  men: {
    current: [],
    recent: [],
    returning: [],
  },
};

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
        <path d="M14 29 C20 38 26 43 34 45 C38 46 41 45 46 41 C51 45 54 46 58 45 C66 43 72 38 78 29" stroke-width="3"/>
        <path d="M14 29 L25 36 L31 18 L40 36 L46 11 L52 36 L61 18 L67 36 L78 29" stroke-width="3"/>
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
    me: '♡',
    task: '✦',
    shop: '◇',
    men: '♂',
    system: '♛',
    record: '≋',
    home: '⌂',
  };
  return icons[type] || '•';
}

function totalMenCount() {
  const men = PREVIEW_STATE.men || {};
  return ['current','recent','returning'].reduce((sum, key) => sum + (men[key]?.length || 0), 0);
}

function moduleCard(key, title, sub) {
  const resolvedSub = key === 'men' ? `${sub} · ${totalMenCount()}` : sub;
  return `
    <button type="button" class="meme-module" data-meme-module="${key}">
      <span class="meme-module-icon">${moduleIcon(key)}</span>
      <span class="meme-module-copy"><b>${title}</b><small>${resolvedSub}</small></span>
      <span class="meme-module-arrow">›</span>
    </button>
  `;
}

function statsMarkup(compact = false) {
  return `
    <div class="meme-stat-grid ${compact ? 'meme-stat-grid--compact' : ''}">
      <article><small>AP</small><strong>${String(PREVIEW_STATE.ap).padStart(3,'0')}</strong><em>改造点</em></article>
      <article><small>SV</small><strong>${String(PREVIEW_STATE.sv).padStart(3,'0')}</strong><em>精液值</em></article>
      <article><small>CHARM</small><strong>${String(PREVIEW_STATE.charm).padStart(2,'0')}</strong><em>综合魅力</em></article>
    </div>
  `;
}

function homeMarkup() {
  return `
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
      <h2>${PREVIEW_STATE.stage}</h2>
      <p class="meme-contract-copy">外貌、欲望、奖励与代价，都将被系统记录。</p>

      <div class="meme-progress"><span></span></div>
      ${statsMarkup()}
    </section>

    <section class="meme-modules">
      <div class="meme-section-head">
        <div><small>PRIVATE ACCESS</small><h3>欲望系统</h3></div>
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
  `;
}

function pageHeader(kicker, title, meta='') {
  return `
    <div class="meme-view-head">
      <button type="button" class="meme-back" data-meme-back aria-label="返回">‹</button>
      <div><small>${kicker}</small><h2>${title}</h2></div>
      <span>${meta}</span>
    </div>
  `;
}

function labelValue(label, value, sub='') {
  return `
    <div class="meme-info-row">
      <span><small>${label}</small><b>${value}</b></span>
      ${sub ? `<em>${sub}</em>` : ''}
    </div>
  `;
}

function levelRow(name, level, desc, status='LV.0') {
  return `
    <article class="meme-upgrade-row">
      <div><small>${status}</small><b>${name}</b><p>${desc}</p></div>
      <span>${level}</span>
    </article>
  `;
}

function meMarkup() {
  return `
    ${pageHeader('HOST PROFILE','ME · 宿主改造','LV.01')}
    ${statsMarkup(true)}

    <section class="meme-page-card">
      <div class="meme-card-title"><small>CURRENT STATE</small><h3>当前宿主</h3></div>
      ${labelValue('改造阶段', PREVIEW_STATE.stage, '0.3%')}
      ${labelValue('系统评价', '明显难看 · 未改造')}
      ${labelValue('绑定状态', '永久绑定', 'ACTIVE')}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>RECONSTRUCTION</small><h3>改造槽位</h3></div>
      <div class="meme-upgrade-list">
        ${levelRow('面部精修','未开始','五官比例、轮廓与细节优化')}
        ${levelRow('体态塑形','未开始','体重、线条与身体比例')}
        ${levelRow('皮肤优化','未开始','肤质、细腻度与光泽')}
        ${levelRow('体香系统','未开始','基础气味与近距离吸引力')}
        ${levelRow('声线调整','未开始','音色、咬字与听感')}
      </div>
    </section>
  `;
}

function taskItem(type, title, desc, reward, state='可接取') {
  return `
    <article class="meme-task-card">
      <div class="meme-task-top"><span>${type}</span><em>${state}</em></div>
      <h4>${title}</h4>
      <p>${desc}</p>
      <div class="meme-task-foot"><b>${reward}</b><button type="button" data-meme-preview>查看</button></div>
    </article>
  `;
}

function taskMarkup() {
  return `
    ${pageHeader('MISSION CENTER','TASK · 任务中心','03')}
    <div class="meme-tabbar">
      <button class="is-active" type="button">日常</button>
      <button type="button">欲望</button>
      <button type="button">特殊</button>
    </div>

    <section class="meme-task-list">
      ${taskItem('DAILY','把自己收拾干净','完成基础清洁、头发整理与换洗。','AP +20')}
      ${taskItem('DAILY','照镜子三分钟','完整观察当前外貌，不许跳过任何一项。','AP +10')}
      ${taskItem('LOCKED','第一次欲望任务','魅力达到 8 后解锁第一条成人欲望任务。','???','未解锁')}
    </section>
  `;
}

function shopItem(icon, title, desc, price, tag='AP') {
  return `
    <article class="meme-shop-card">
      <span class="meme-shop-icon">${icon}</span>
      <div class="meme-shop-copy"><b>${title}</b><p>${desc}</p><small>LV.1</small></div>
      <div class="meme-shop-buy"><strong>${price}</strong><em>${tag}</em><button type="button" data-meme-preview>预览</button></div>
    </article>
  `;
}

function shopMarkup() {
  return `
    ${pageHeader('DESIRE MARKET','SHOP · 欲望商城','AP 000')}
    <div class="meme-shop-filter"><span class="is-active">外貌</span><span>身体</span><span>感官</span><span>特殊</span></div>
    <section class="meme-shop-list">
      ${shopItem('✧','体香优化Ⅰ','降低汗味与油腻气味，形成干净的基础体香。','500')}
      ${shopItem('◇','皮肤细化Ⅰ','改善粗糙与暗沉，提升触感与均匀度。','800')}
      ${shopItem('♪','声线柔化Ⅰ','让音色更柔和、稳定，降低刺耳感。','650')}
      ${shopItem('♡','唇色调整Ⅰ','改善唇色暗沉与干燥感。','400')}
    </section>
    <p class="meme-preview-note">当前版本仅展示商品，不会实际扣除 AP。</p>
  `;
}

function menPersonCard(person) {
  const id = person.id || Math.random().toString(36).slice(2,8);
  const badges = (person.badges || []).map(badge => `<span>${badge}</span>`).join('');
  return `
    <article class="meme-men-person" data-men-person="${id}">
      <button type="button" class="meme-men-person-head" data-men-person-toggle>
        <span class="meme-men-avatar">${person.avatar || '♂'}</span>
        <span class="meme-men-main">
          <small>${person.meta || 'ADULT · NPC'}</small>
          <b>${person.name || '未命名对象'}</b>
          <em>${person.summary || '档案待补充'}</em>
        </span>
        <span class="meme-men-chevron">⌄</span>
      </button>
      <div class="meme-men-person-body">
        <div class="meme-men-badges">${badges}</div>
        ${labelValue('关系状态', person.relation || '未判定')}
        ${labelValue('欲望信号', person.desire || '未记录')}
        ${labelValue('最近接触', person.lastContact || '暂无')}
        ${person.note ? `<p class="meme-men-note">${person.note}</p>` : ''}
      </div>
    </article>
  `;
}

function menEmptyGroup(kind) {
  const copy = {
    current: ['NO ACTIVE TARGET','暂无当前对象','当前任务或近期剧情中心对象会暂存在这里。'],
    recent: ['NO RECENT TRACE','暂无近期痕迹','发生过重要接触但已离开当前剧情的人会短暂保留。'],
    returning: ['NO RETURNING TARGET','暂无再遇对象','只有真正再次出现的人，才会从近期痕迹重新被系统唤醒。'],
  }[kind];

  return `
    <div class="meme-men-empty">
      <small>${copy[0]}</small>
      <b>${copy[1]}</b>
      <p>${copy[2]}</p>
    </div>
  `;
}

function menGroupMarkup(kind, label, title, defaultOpen=false) {
  const list = PREVIEW_STATE.men?.[kind] || [];
  const body = list.length ? list.map(menPersonCard).join('') : menEmptyGroup(kind);

  return `
    <section class="meme-men-group ${defaultOpen ? 'is-open' : ''}" data-men-group="${kind}">
      <button type="button" class="meme-men-group-head" data-men-group-toggle>
        <span>
          <small>${label}</small>
          <b>${title}</b>
        </span>
        <span class="meme-men-group-meta">${String(list.length).padStart(2,'0')} <i>⌄</i></span>
      </button>
      <div class="meme-men-group-body">
        ${body}
      </div>
    </section>
  `;
}

function menMarkup() {
  const count = totalMenCount();
  return `
    ${pageHeader('TARGET ARCHIVE','MEN · 对象档案',String(count).padStart(2,'0'))}

    <section class="meme-men-summary">
      <div><small>CURRENT</small><b>${PREVIEW_STATE.men.current.length}</b><em>当前</em></div>
      <div><small>RECENT</small><b>${PREVIEW_STATE.men.recent.length}</b><em>近期</em></div>
      <div><small>RETURNING</small><b>${PREVIEW_STATE.men.returning.length}</b><em>再遇</em></div>
    </section>

    <div class="meme-men-groups">
      ${menGroupMarkup('current','CURRENT','当前对象',true)}
      ${menGroupMarkup('recent','RECENT','近期痕迹',false)}
      ${menGroupMarkup('returning','RETURNING','再遇对象',false)}
    </div>

    <section class="meme-page-card meme-men-rules">
      <div class="meme-card-title"><small>ARCHIVE LOGIC</small><h3>档案规则</h3></div>
      ${labelValue('建档条件','任务关联 / 性接触 / 明显欲望 / 联系方式 / 关键剧情')}
      ${labelValue('普通路人','不建档')}
      ${labelValue('近期衰减','长期未再出现 → 从 MEN 主界面淡出')}
      ${labelValue('再次出现','旧档案自动唤醒 → RETURNING')}
      <p class="meme-men-rule-note">MEN 不预设“长期对象”。一个人是否留下，只由后续剧情里他是否真的再次出现决定。</p>
    </section>
  `;
}

function systemMarkup() {
  return `
    ${pageHeader('ADMINISTRATOR','SYSTEM · 管理员','LV.01')}
    <section class="meme-admin-card">
      <div class="meme-admin-emblem">${crownMarkup()}</div>
      <div class="meme-admin-copy">
        <small>CURRENT FORM</small>
        <h3>${PREVIEW_STATE.systemForm}</h3>
        <p>仅存在于宿主脑内的成年男性系统意识体。</p>
      </div>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>ADMIN STATUS</small><h3>管理员状态</h3></div>
      ${labelValue('外显形态','不可见 · 仅声音')}
      ${labelValue('当前态度','嫌弃 / 不耐烦')}
      ${labelValue('触碰权限','未解锁')}
      ${labelValue('具现等级','0 / 3')}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>EVOLUTION</small><h3>形态进化</h3></div>
      <div class="meme-evo-line">
        <span class="is-on">意识体</span><i></i><span>Q版</span><i></i><span>有限实体</span><i></i><span>完全具现</span>
      </div>
    </section>
  `;
}

function recordMarkup() {
  return `
    ${pageHeader('PRIVATE LOG','RECORD · 成长记录','01')}
    <section class="meme-timeline">
      <article>
        <span></span>
        <div><small>2026 · BINDING</small><h4>MÉMÉ OS 绑定完成</h4><p>宿主初始化完成。AP 0 / SV 0 / CHARM 3。</p></div>
      </article>
      <article class="is-future">
        <span></span>
        <div><small>WAITING</small><h4>下一条记录尚未生成</h4><p>完成任务、购买改造或触发关键剧情后自动写入。</p></div>
      </article>
    </section>
  `;
}

function renderView(view='home') {
  const root = document.querySelector('#meme-os-dialog .meme-scroll');
  if (!root) return;

  const views = {
    home: homeMarkup,
    me: meMarkup,
    task: taskMarkup,
    shop: shopMarkup,
    men: menMarkup,
    system: systemMarkup,
    record: recordMarkup,
  };

  root.classList.add('is-switching');
  setTimeout(() => {
    root.innerHTML = (views[view] || views.home)();
    root.scrollTop = 0;
    root.dataset.view = view;
    root.classList.remove('is-switching');
  }, 90);
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

      <main class="meme-scroll" data-view="home">
        ${homeMarkup()}
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

    if (event.target.closest('[data-meme-back]')) {
      renderView('home');
      return;
    }

    const card = event.target.closest('[data-meme-module]');
    if (card) {
      const view = card.dataset.memeModule || 'home';
      if (view === 'home') renderView('home');
      else renderView(view);
      return;
    }

    const groupToggle = event.target.closest('[data-men-group-toggle]');
    if (groupToggle) {
      groupToggle.closest('[data-men-group]')?.classList.toggle('is-open');
      return;
    }

    const personToggle = event.target.closest('[data-men-person-toggle]');
    if (personToggle) {
      personToggle.closest('[data-men-person]')?.classList.toggle('is-open');
      return;
    }

    if (event.target.closest('[data-meme-preview]')) {
      globalThis.toastr?.info?.('预览版：下一阶段再接真实操作与结算。');
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
