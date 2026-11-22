/**
 * MÉMÉ OS v0.6.0
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

const TASK_DATA = {
  daily: [
    { id:'clean', type:'DAILY', title:'先把自己收拾干净', desc:'完成洗头、洗澡、换洗衣物与基础口腔清洁。系统拒绝给“脏乱”找借口。', reward:'AP +20', state:'可接取', detail:'完成后由剧情状态确认。重复完成只记录，不重复刷取首通奖励。' },
    { id:'mirror', type:'DAILY', title:'镜前扫描', desc:'在镜子前完整观察当前外貌三分钟，不遮脸、不跳过身体状态。', reward:'AP +10', state:'可接取', detail:'用于建立宿主对当前状态的客观认知。' },
    { id:'walk', type:'DAILY', title:'动起来', desc:'连续完成一次不少于二十分钟的步行或低强度活动。', reward:'AP +25', state:'可接取', detail:'系统只判定“完成 / 未完成”，不计算现实热量。' },
    { id:'posture', type:'DAILY', title:'别塌着', desc:'在一段完整场景中保持肩颈舒展、坐姿或站姿不持续蜷缩。', reward:'AP +15', state:'可接取', detail:'用于解锁后续姿态类改造。' },
    { id:'outfit', type:'DAILY', title:'像样地出门', desc:'搭配一套干净、合身、没有明显邋遢感的外出服。', reward:'AP +20', state:'可接取', detail:'不要求昂贵，只要求“看起来像认真收拾过”。' },
  ],
  desire: [
    { id:'spark', type:'DESIRE', title:'第一次欲望信号', desc:'与一名成年对象产生明确、双方可感知的性吸引或欲望互动。', reward:'AP +80 · SV +10', state:'CHARM 8 解锁', locked:true, detail:'不要求发生性行为；只记录明确的成人欲望信号。' },
    { id:'sample', type:'DESIRE', title:'第一次精液采集', desc:'从成年对象处获得一次有效精液采集，并让系统完成确认。', reward:'AP +120 · SV +40', state:'CHARM 12 解锁', locked:true, detail:'完成后该对象会进入 MEN 的 CURRENT 或 RECENT，视剧情是否继续。' },
    { id:'oral', type:'DESIRE', title:'口腔采集', desc:'完成一次成人口腔性接触，并取得系统判定的有效样本。', reward:'AP +160 · SV +60', state:'CHARM 15 解锁', locked:true, detail:'属于欲望任务，不会被当作日常重复任务刷取。' },
    { id:'repeat', type:'DESIRE', title:'第二次不是偶然', desc:'与同一成年对象发生第二次明确的性接触或欲望事件。', reward:'AP +180 · SV +50', state:'CHARM 18 解锁', locked:true, detail:'若对象曾淡出，完成后会被 MEN 自动提升为 RETURNING。' },
    { id:'drain', type:'DESIRE', title:'榨干奖励', desc:'在一次成人性场景中让对象达到系统判定的“完全采集”。', reward:'AP +260 · SV +100', state:'CHARM 25 解锁', locked:true, detail:'高阶采集任务。系统会记录对象状态，但不会因此强制建立长期关系。' },
  ],
  special: [
    { id:'audit', type:'SYSTEM', title:'管理员审美复检', desc:'触发一次完整宿主扫描，管理员会根据当前阶段重新评价。', reward:'AP +50', state:'阶段任务', detail:'评价可能很难听，但不会凭空增加或减少属性。' },
    { id:'qform', type:'SPECIAL', title:'第一次看见他', desc:'将管理员形态推进到 Q 版可见状态。', reward:'SYSTEM EXP', state:'系统 LV.2 解锁', locked:true, detail:'不是购买项，只能通过系统升级事件解锁。' },
    { id:'contract', type:'HIDDEN', title:'隐藏契约', desc:'满足未知条件后由系统主动触发。', reward:'???', state:'条件未知', locked:true, detail:'隐藏任务不会提前向模型公开完整触发条件。' },
    { id:'override', type:'RARE', title:'越级奖励', desc:'在极少数高风险或高价值剧情节点触发一次越级改造机会。', reward:'RANDOM', state:'稀有事件', locked:true, detail:'由剧情事件触发，不作为普通可刷任务。' },
  ],
};

const SHOP_DATA = {
  appearance: [
    {id:'lip1',icon:'♡',title:'唇部修复Ⅰ',desc:'改善干裂、暗沉与边缘粗糙感。',price:400,currency:'AP',level:'LV.1',req:'无',detail:'完成后只改变基础状态，不直接赋予“漂亮”标签。'},
    {id:'hair1',icon:'⌁',title:'发质修复Ⅰ',desc:'降低毛躁、油腻与枯涩感，让头发更顺。',price:450,currency:'AP',level:'LV.1',req:'无',detail:'先从“像洗过头”开始。'},
    {id:'skin1',icon:'◇',title:'皮肤细化Ⅰ',desc:'改善粗糙、暗沉与肤质不均。',price:800,currency:'AP',level:'LV.1',req:'无',detail:'提升细腻度与基础光泽，不改变肤色种族特征。'},
    {id:'face1',icon:'✦',title:'轮廓收束Ⅰ',desc:'轻度优化面部浮肿感与轮廓松散。',price:1200,currency:'AP',level:'LV.1',req:'CHARM 5',detail:'属于缓慢改造，不会一夜换脸。'},
    {id:'eye1',icon:'◉',title:'眼型优化Ⅰ',desc:'改善眼周疲态与比例，让眼神更干净。',price:1500,currency:'AP',level:'LV.1',req:'CHARM 8',detail:'不会改变身份识别，只做比例与状态优化。'},
    {id:'face2',icon:'♢',title:'五官协调Ⅰ',desc:'小幅调整五官之间的比例协调度。',price:1800,currency:'AP',level:'LV.1',req:'CHARM 10',detail:'高于单项修复，属于整体面部优化。'},
  ],
  body: [
    {id:'posture1',icon:'↟',title:'姿态矫正Ⅰ',desc:'改善含胸、塌肩与习惯性蜷缩。',price:700,currency:'AP',level:'LV.1',req:'完成日常任务',detail:'优先改变视觉体态，再进入比例改造。'},
    {id:'bodyfat1',icon:'⌇',title:'体脂重塑Ⅰ',desc:'缓慢调整整体体型与脂肪分布趋势。',price:1200,currency:'AP',level:'LV.1',req:'CHARM 6',detail:'系统改造效果按剧情阶段逐步体现。'},
    {id:'waist1',icon:'⌁',title:'腰臀比例Ⅰ',desc:'让腰臀线条更清晰，但仍保持自然比例。',price:1400,currency:'AP',level:'LV.1',req:'体脂重塑Ⅰ',detail:'不是夸张沙漏体型，只做第一阶段比例优化。'},
    {id:'leg1',icon:'Ⅱ',title:'腿型修正Ⅰ',desc:'调整站姿、膝踝线条与整体腿部观感。',price:1100,currency:'AP',level:'LV.1',req:'姿态矫正Ⅰ',detail:'优先修正视觉线条。'},
    {id:'neck1',icon:'⌃',title:'肩颈线条Ⅰ',desc:'让肩颈过渡更舒展、轻盈。',price:900,currency:'AP',level:'LV.1',req:'姿态矫正Ⅰ',detail:'与体态类效果叠加。'},
    {id:'bust1',icon:'◡',title:'胸型调整Ⅰ',desc:'改善胸部轮廓与位置，使整体比例更协调。',price:1600,currency:'AP',level:'LV.1',req:'CHARM 12',detail:'仅为虚构系统中的外形改造。'},
  ],
  sensory: [
    {id:'scent1',icon:'✧',title:'体香优化Ⅰ',desc:'降低汗味与油腻气味，形成干净的基础体香。',price:500,currency:'AP',level:'LV.1',req:'无',detail:'最基础的近距离感官优化。'},
    {id:'breath1',icon:'○',title:'口腔气息Ⅰ',desc:'维持清洁、清新的近距离呼吸气味。',price:300,currency:'AP',level:'LV.1',req:'无',detail:'不带强制魅惑效果。'},
    {id:'voice1',icon:'♪',title:'声线柔化Ⅰ',desc:'让音色更稳定柔和，减少刺耳与含混。',price:650,currency:'AP',level:'LV.1',req:'无',detail:'改变听感，不直接改变说话内容。'},
    {id:'touch1',icon:'≈',title:'肌肤触感Ⅰ',desc:'提升皮肤柔软度与细腻触感。',price:900,currency:'AP',level:'LV.1',req:'皮肤细化Ⅰ',detail:'属于触觉向改造。'},
    {id:'scent2',icon:'✧',title:'诱导体香Ⅰ',desc:'让体香在近距离更容易被成年对象注意。',price:80,currency:'SV',level:'LV.1',req:'CHARM 15',detail:'仅增强存在感，不控制他人意志。'},
  ],
  desire: [
    {id:'sensitive1',icon:'♥',title:'敏感度微调Ⅰ',desc:'轻度提高成人性刺激下的身体反馈。',price:100,currency:'SV',level:'LV.1',req:'首次精液采集',detail:'只影响宿主自身感受，不改变他人。'},
    {id:'arousal1',icon:'♢',title:'欲望阈值Ⅰ',desc:'让宿主更容易识别并接受自身成人欲望。',price:80,currency:'SV',level:'LV.1',req:'CHARM 12',detail:'不会强制进入发情或失去判断力。'},
    {id:'lubrication1',icon:'⌁',title:'分泌反应Ⅰ',desc:'增强成人性唤起时的自然润滑反应。',price:120,currency:'SV',level:'LV.1',req:'CHARM 15',detail:'虚构系统生理改造项。'},
    {id:'orgasm1',icon:'✦',title:'高潮感受Ⅰ',desc:'提高达到高潮时的主观强度上限。',price:180,currency:'SV',level:'LV.1',req:'CHARM 20',detail:'不会让宿主无条件自动高潮。'},
    {id:'recovery1',icon:'↺',title:'亲密恢复Ⅰ',desc:'缩短成人性活动后的疲惫恢复时间。',price:150,currency:'SV',level:'LV.1',req:'CHARM 20',detail:'仅用于虚构剧情数值，不对应现实医学效果。'},
  ],
  special: [
    {id:'charmseal',icon:'♛',title:'魅魔印记',desc:'在高阶阶段解锁专属系统印记与视觉反馈。',price:500,currency:'SV',level:'RARE',req:'CHARM 30',detail:'外观性系统标记，不强制公开给剧情 NPC。'},
    {id:'qadmin',icon:'♟',title:'管理员可视权限',desc:'允许宿主在特定条件下看见管理员 Q 版形态。',price:0,currency:'LOCK',level:'SYSTEM',req:'系统 LV.2',detail:'不可购买，由系统进化自动开启。'},
    {id:'touchadmin',icon:'✥',title:'管理员触碰权限',desc:'让具现后的管理员能够与宿主发生有限实体接触。',price:0,currency:'LOCK',level:'SYSTEM',req:'系统 LV.3',detail:'不可购买，由剧情与系统等级共同解锁。'},
    {id:'embody',icon:'♛',title:'完全具现',desc:'管理员获得稳定成年实体形态与自主行动能力。',price:0,currency:'LOCK',level:'SYSTEM',req:'系统 LV.4',detail:'终阶系统权限。'},
  ],
};

const RECORD_DATA = [
  {type:'system',code:'BINDING',title:'MÉMÉ OS 绑定完成',desc:'随机宿主绑定成功。AP 0 / SV 0 / CHARM 3。'},
  {type:'change',code:'SCAN',title:'首次宿主扫描',desc:'系统判定：明显难看 · 未改造。改造进度 0.3%。'},
  {type:'system',code:'ADMIN',title:'管理员首次评价',desc:'“先去洗头。”'},
];

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
  const nextUnlock = PREVIEW_STATE.charm < 8 ? 'CHARM 8 · 欲望任务' : '欲望任务已开放';
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

    <section class="meme-home-strip">
      <article><small>CURRENT TASK</small><b>未接取</b><em>去 TASK 看任务</em></article>
      <article><small>NEXT UNLOCK</small><b>${nextUnlock}</b><em>系统按阶段开放内容</em></article>
    </section>

    <section class="meme-whisper-card">
      <span>♛</span>
      <div><small>ADMINISTRATOR</small><b>“别盯着界面看。先去洗头。”</b></div>
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

function scanRow(label, value, score, tone='bad') {
  return `
    <div class="meme-scan-row">
      <span><small>${label}</small><b>${value}</b></span>
      <div class="meme-scan-meter"><i class="${tone}" style="width:${Math.max(2, score)}%"></i></div>
      <em>${score}</em>
    </div>
  `;
}

function meMarkup() {
  return `
    ${pageHeader('HOST PROFILE','ME · 宿主改造','LV.01')}
    ${statsMarkup(true)}

    <section class="meme-page-card">
      <div class="meme-card-title"><small>CURRENT STATE</small><h3>当前宿主</h3></div>
      ${labelValue('改造阶段', PREVIEW_STATE.stage, '0.3%')}
      ${labelValue('系统总评', '明显难看 · 肥胖 · 油腻 · 未整理')}
      ${labelValue('基础魅力', '3 / 100', 'VERY LOW')}
      ${labelValue('绑定状态', '永久绑定', 'ACTIVE')}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>BASELINE SCAN</small><h3>初始扫描</h3></div>
      <div class="meme-scan-list">
        ${scanRow('面部','浮肿 / 比例不协调',2, 'bad')}
        ${scanRow('体型','明显肥胖 / 线条模糊',1, 'bad')}
        ${scanRow('皮肤','粗糙 / 暗沉 / 出油',2, 'bad')}
        ${scanRow('头发','油腻 / 毛躁 / 缺乏打理',1, 'bad')}
        ${scanRow('气味','清洁度不足',0, 'bad')}
        ${scanRow('声线','普通 / 缺乏辨识度',4, 'low')}
        ${scanRow('仪态','含胸 / 缩肩',2, 'bad')}
      </div>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>RECONSTRUCTION</small><h3>改造槽位</h3></div>
      <div class="meme-upgrade-list">
        ${levelRow('面部精修','未开始','轮廓、眼型、五官协调与细节修复')}
        ${levelRow('体态塑形','未开始','体脂趋势、腰臀、腿型与肩颈线条')}
        ${levelRow('皮肤优化','未开始','肤质、细腻度、触感与光泽')}
        ${levelRow('发质系统','未开始','清洁感、顺滑度与发丝状态')}
        ${levelRow('体香系统','未开始','基础气味、近距离存在感与诱导体香')}
        ${levelRow('声线调整','未开始','音色、稳定度与辨识度')}
        ${levelRow('仪态修正','未开始','站姿、坐姿、肩颈与动作习惯')}
        ${levelRow('成人反应','LOCKED','敏感度、分泌、高潮与恢复','SV · LOCK')}
      </div>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>UNLOCK LOGIC</small><h3>解锁规则</h3></div>
      ${labelValue('AP 改造','外貌 / 身体 / 感官')}
      ${labelValue('SV 改造','成人欲望 / 性反应')}
      ${labelValue('高阶改造','需要 CHARM 与前置项目')}
      ${labelValue('系统具现','不在商城购买，由 SYSTEM 独立升级')}
    </section>
  `;
}

function taskItem(task) {
  return `
    <article class="meme-task-card ${task.locked ? 'is-locked' : ''}" data-task-id="${task.id}">
      <div class="meme-task-top"><span>${task.type}</span><em>${task.state}</em></div>
      <h4>${task.title}</h4>
      <p>${task.desc}</p>
      <div class="meme-task-detail">${task.detail}</div>
      <div class="meme-task-foot">
        <b>${task.reward}</b>
        <button type="button" data-task-detail>${task.locked ? '条件' : '详情'}</button>
      </div>
    </article>
  `;
}

function renderTaskList(category='daily') {
  return (TASK_DATA[category] || TASK_DATA.daily).map(taskItem).join('');
}

function taskMarkup() {
  return `
    ${pageHeader('MISSION CENTER','TASK · 任务中心','AUTO')}
    <div class="meme-tabbar" data-task-tabs>
      <button class="is-active" type="button" data-task-tab="daily">日常</button>
      <button type="button" data-task-tab="desire">欲望</button>
      <button type="button" data-task-tab="special">特殊</button>
    </div>
    <section class="meme-task-list" data-task-list>
      ${renderTaskList('daily')}
    </section>
    <section class="meme-page-card meme-task-rules">
      <div class="meme-card-title"><small>MISSION LOGIC</small><h3>任务规则</h3></div>
      ${labelValue('日常任务','低 AP · 可重复出现')}
      ${labelValue('欲望任务','主要产出 SV · 按魅力阶段解锁')}
      ${labelValue('特殊任务','管理员 / 剧情 / 隐藏条件触发')}
      ${labelValue('生成原则','任务随剧情变化，不固定刷同一套')}
    </section>
  `;
}

function shopItem(item) {
  const locked = item.currency === 'LOCK';
  return `
    <article class="meme-shop-card ${locked ? 'is-locked' : ''}" data-shop-id="${item.id}">
      <span class="meme-shop-icon">${item.icon}</span>
      <div class="meme-shop-copy">
        <b>${item.title}</b>
        <p>${item.desc}</p>
        <small>${item.level} · ${item.req}</small>
        <div class="meme-shop-detail">${item.detail}</div>
      </div>
      <div class="meme-shop-buy">
        <strong>${locked ? '—' : item.price}</strong><em>${item.currency}</em>
        <button type="button" data-shop-detail>${locked ? '条件' : '预览'}</button>
      </div>
    </article>
  `;
}

function renderShopList(category='appearance') {
  return (SHOP_DATA[category] || SHOP_DATA.appearance).map(shopItem).join('');
}

function shopMarkup() {
  return `
    ${pageHeader('DESIRE MARKET','SHOP · 欲望商城',`AP ${String(PREVIEW_STATE.ap).padStart(3,'0')}`)}
    <div class="meme-shop-balance">
      <span><small>AP</small><b>${String(PREVIEW_STATE.ap).padStart(3,'0')}</b></span>
      <i></i>
      <span><small>SV</small><b>${String(PREVIEW_STATE.sv).padStart(3,'0')}</b></span>
    </div>
    <div class="meme-shop-filter" data-shop-filters>
      <button class="is-active" type="button" data-shop-filter="appearance">外貌</button>
      <button type="button" data-shop-filter="body">身体</button>
      <button type="button" data-shop-filter="sensory">感官</button>
      <button type="button" data-shop-filter="desire">欲望</button>
      <button type="button" data-shop-filter="special">特殊</button>
    </div>
    <section class="meme-shop-list" data-shop-list>
      ${renderShopList('appearance')}
    </section>
    <p class="meme-preview-note">本版已填完整商品结构；真实购买、扣款与写入聊天框将在下一阶段接通。</p>
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
      ${labelValue('CURRENT 上限','3 人 · 只留当前剧情中心对象')}
      ${labelValue('RECENT 上限','8 人 · 超出后最旧痕迹淡出')}
      ${labelValue('RETURNING 上限','5 人 · 只保留近期真正回流者')}
      ${labelValue('近期衰减','长期未再出现 → 从 MEN 主界面淡出')}
      ${labelValue('再次出现','旧档案自动唤醒 → RETURNING')}
      <p class="meme-men-rule-note">MEN 不预设“长期对象”。超出显示上限的旧人只在 RECORD 留历史痕迹，不持续占用模型上下文；以后真的再次出现，再重新唤醒。</p>
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
        <p>成年男性系统意识体。当前仅存在于宿主脑内，不能被其他人看见。</p>
      </div>
    </section>

    <section class="meme-system-meters">
      <article><small>审美容忍</small><b>0</b><span><i style="width:0%"></i></span></article>
      <article><small>宿主性吸引</small><b>0</b><span><i style="width:0%"></i></span></article>
      <article><small>系统权限</small><b>1 / 4</b><span><i style="width:25%"></i></span></article>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>ADMIN PROFILE</small><h3>管理员档案</h3></div>
      ${labelValue('核心性格','审美偏执 / 嘴毒 / 自负 / 色情 / 不耐烦')}
      ${labelValue('绑定原因','完全随机', 'NO DESTINY')}
      ${labelValue('当前态度','嫌弃宿主外貌 · 无触碰欲望')}
      ${labelValue('初始评价','“这就是我这次的宿主？”')}
      ${labelValue('目前建议','先去洗头')}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>PRIVATE PREFERENCE</small><h3>私人偏好</h3></div>
      ${labelValue('审美对象','漂亮的成年女性')}
      ${labelValue('特殊癖好','对睡眠状态下的漂亮成年女性有明显性兴趣')}
      ${labelValue('宿主适用','当前不适用', '0%')}
      <p class="meme-men-rule-note">他的偏好是他原本就存在的私人性癖，不是因为宿主才产生。宿主目前远未达到他的审美阈值。</p>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>EVOLUTION</small><h3>形态进化</h3></div>
      <div class="meme-system-levels">
        <article class="is-on"><span>01</span><div><b>意识体</b><small>脑内声音 · 当前</small></div></article>
        <article><span>02</span><div><b>Q 版可视</b><small>宿主可见 · 其他人不可见</small></div></article>
        <article><span>03</span><div><b>有限实体</b><small>短时触碰 · 受系统限制</small></div></article>
        <article><span>04</span><div><b>完全具现</b><small>稳定成年实体 · 自主行动</small></div></article>
      </div>
    </section>

    <section class="meme-admin-quote">
      <small>LIVE COMMENT</small>
      <p>“你最好别把我这里当换装小游戏。赚不到点数，丑就是丑。”</p>
    </section>
  `;
}

function recordItem(item) {
  return `
    <article data-record-type="${item.type}">
      <span></span>
      <div><small>DAY 001 · ${item.code}</small><h4>${item.title}</h4><p>${item.desc}</p></div>
    </article>
  `;
}

function renderRecordList(filter='all') {
  const list = filter === 'all' ? RECORD_DATA : RECORD_DATA.filter(item => item.type === filter);
  const items = list.map(recordItem).join('');
  return items + `
    <article class="is-future">
      <span></span>
      <div><small>WAITING</small><h4>下一条记录尚未生成</h4><p>任务、购买、对象变化与系统进化都会写入这里。</p></div>
    </article>
  `;
}

function recordMarkup() {
  return `
    ${pageHeader('PRIVATE LOG','RECORD · 成长记录',String(RECORD_DATA.length).padStart(2,'0'))}
    <div class="meme-record-filter" data-record-filters>
      <button class="is-active" type="button" data-record-filter="all">全部</button>
      <button type="button" data-record-filter="change">改造</button>
      <button type="button" data-record-filter="task">任务</button>
      <button type="button" data-record-filter="men">对象</button>
      <button type="button" data-record-filter="system">系统</button>
    </div>
    <section class="meme-timeline" data-record-list>
      ${renderRecordList('all')}
    </section>
    <p class="meme-preview-note">RECORD 保存历史痕迹；旧对象淡出 MEN 后仍可在记录中留下简短事件，不持续占用模型上下文。</p>
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

    const taskTab = event.target.closest('[data-task-tab]');
    if (taskTab) {
      const tabs = taskTab.closest('[data-task-tabs]');
      tabs?.querySelectorAll('[data-task-tab]').forEach(btn => btn.classList.toggle('is-active', btn === taskTab));
      const list = dialog.querySelector('[data-task-list]');
      if (list) list.innerHTML = renderTaskList(taskTab.dataset.taskTab);
      return;
    }

    const taskDetail = event.target.closest('[data-task-detail]');
    if (taskDetail) {
      taskDetail.closest('.meme-task-card')?.classList.toggle('is-open');
      return;
    }

    const shopFilter = event.target.closest('[data-shop-filter]');
    if (shopFilter) {
      const filters = shopFilter.closest('[data-shop-filters]');
      filters?.querySelectorAll('[data-shop-filter]').forEach(btn => btn.classList.toggle('is-active', btn === shopFilter));
      const list = dialog.querySelector('[data-shop-list]');
      if (list) list.innerHTML = renderShopList(shopFilter.dataset.shopFilter);
      return;
    }

    const shopDetail = event.target.closest('[data-shop-detail]');
    if (shopDetail) {
      shopDetail.closest('.meme-shop-card')?.classList.toggle('is-open');
      return;
    }

    const recordFilter = event.target.closest('[data-record-filter]');
    if (recordFilter) {
      const filters = recordFilter.closest('[data-record-filters]');
      filters?.querySelectorAll('[data-record-filter]').forEach(btn => btn.classList.toggle('is-active', btn === recordFilter));
      const list = dialog.querySelector('[data-record-list]');
      if (list) list.innerHTML = renderRecordList(recordFilter.dataset.recordFilter);
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
