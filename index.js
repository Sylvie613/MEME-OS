import {
  addPendingAction,
  commitPendingActions,
  createPendingAction,
  getSpendableResources,
  getState,
  hasActiveChat,
  removePendingAction,
  saveState,
} from './src/state.js?v=0.13.0';
import { appendToInput, removeFromInput } from './src/input.js?v=0.13.0';
import { isBoundCharacter } from './src/binding.js?v=0.13.0';

/**
 * MÉMÉ OS v0.13.0
 * Navigable content shell. Visual style + native <dialog> retained.
 * Persistent state, tone engine, pending actions and transaction commits are live in this build.\n * Rolling task board + authoritative resource sync. CI validation target.
 */
const MEME_ID = 'meme-os-heart-launcher';
const DIALOG_ID = 'meme-os-dialog';
const MEME_SCENE_CLOCK_PROMPT_ID = 'meme-os-scene-clock';
const MEME_NPC_WHEEL_PROMPT_ID = 'meme-os-npc-wheel';

let memoryQuietSyncInFlight=false;
let memoryQuietLastAttemptTurn=-999;

const TASK_DATA = {
  daily: [
    { id:'clean', type:'DAILY', title:'先把自己收拾干净', desc:'完成洗头、洗澡、换洗衣物与基础口腔清洁。系统拒绝给“脏乱”找借口。', reward:'AP +120', state:'可接取', detail:'DAY 001 的开场日常；以后隔几天也可能重新回池。' },
    { id:'mirror', type:'DAILY', title:'镜前扫描', desc:'在镜子前完整观察当前外貌三分钟，不遮脸、不跳过身体状态。', reward:'AP +70', state:'可接取', detail:'看看现在到底变成什么样，别只挑顺眼角度。' },
    { id:'walk', type:'DAILY', title:'动起来', desc:'完成一次不少于二十分钟的步行或低强度活动。', reward:'AP +150', state:'可接取', detail:'只判定完成与否，不计算现实热量。' },
    { id:'posture', type:'DAILY', title:'别塌着', desc:'在一段完整场景中保持肩颈舒展、坐姿或站姿不持续蜷缩。', reward:'AP +100', state:'可接取', detail:'姿态不修，漂亮零件堆上去也白搭。' },
    { id:'outfit', type:'DAILY', title:'像样地出门', desc:'搭配一套干净、合身、没有明显邋遢感的外出服。', reward:'AP +110', state:'可接取', detail:'不用贵，至少得像认真选过。' },
    { id:'bedreset', type:'DAILY', title:'床别再像事故现场', desc:'把床铺、散落衣物、纸巾和床边杂物彻底收拾一遍。', reward:'AP +90', state:'可接取', detail:'睡觉的地方先别像刚打完仗。' },
    { id:'deskreset', type:'DAILY', title:'把桌面救回来', desc:'清掉桌面垃圾和无关杂物，把常用东西归位。', reward:'AP +80', state:'可接取', detail:'至少腾出一块能正常用的桌面。' },
    { id:'skincare', type:'DAILY', title:'脸先别摆烂', desc:'完成一次基础洁面与护肤，不拿“懒得动”当理由。', reward:'AP +85', state:'可接取', detail:'基础护理，不要求昂贵产品。' },
    { id:'stretch', type:'DAILY', title:'把自己展开', desc:'完成一轮肩颈、腰背和腿部的轻度拉伸或舒展。', reward:'AP +95', state:'可接取', detail:'别整天缩成一团。' },
    { id:'photo', type:'DAILY', title:'留一张证据', desc:'拍一张不刻意藏角度的全身或半身记录照，留作改造对比。', reward:'AP +75', state:'可接取', detail:'只做剧情记录，不要求公开。' },
    { id:'wardrobe', type:'DAILY', title:'衣柜别装死', desc:'整理一小块衣柜或衣物区，把乱塞的衣服叠好、挂好或分类。', reward:'AP +90', state:'可接取', detail:'不用一次收完整个衣柜，做完一块就算。' },
    { id:'laundry', type:'DAILY', title:'把脏衣服清掉', desc:'处理一批脏衣物：洗、晾、烘或把该洗的完整分类送进洗衣流程。', reward:'AP +100', state:'可接取', detail:'别让脏衣服继续堆着发酵。' },
    { id:'bagreset', type:'DAILY', title:'包里别养垃圾', desc:'把日常用包里的票据、包装、废纸和无用杂物清掉并重新归位。', reward:'AP +70', state:'可接取', detail:'包不是移动垃圾桶。' },
    { id:'shoes', type:'DAILY', title:'鞋也算你的一部分', desc:'清理今天最常穿的一双鞋，至少处理明显灰尘、污渍或乱放状态。', reward:'AP +80', state:'可接取', detail:'别上面收拾得像样，脚下还一塌糊涂。' },
    { id:'scent', type:'DAILY', title:'闻起来像个人', desc:'完成一次基础身体与衣物气味管理：洗净、换洗、止汗或适量留香任选其一。', reward:'AP +85', state:'可接取', detail:'不是拿香水盖脏味，先把源头处理掉。' },
  ],
  desire: [
    { id:'spark', type:'DESIRE', title:'先让男人看着你硬起来', desc:'让一名成年男人因为你出现明确、可识别的性唤起。礼貌夸奖、暧昧客套、说你好看都不算；至少得让他真的起色心，明显想摸、想操、想把你弄上床。', reward:'AP +250 · SV +10', state:'CHARM 8 解锁', locked:true, detail:'一次性里程碑。可以不真正上床，但必须有明确成人性欲与身体/行为证据。' },
    { id:'sample', type:'DESIRE', title:'第一次把精液交上来', desc:'从成年对象处拿到第一次可结算的精液。别拿暧昧当成果，系统收的是精液，不是空气。', reward:'AP +350 · SV +50', repeatable:'daily', repeatReward:'SV +50', state:'CHARM 12 解锁', locked:true, detail:'首次完成给里程碑奖励；之后每个剧情日可再采集一次，仅结算 SV。' },
    { id:'oral', type:'DESIRE', title:'嘴别只会顶嘴', desc:'和成年对象完成一次口交，并拿到系统认可的射精结算。嘴硬不算本事，真把活干完才算。', reward:'AP +450 · SV +70', repeatable:'daily', repeatReward:'SV +80', state:'CHARM 15 解锁', locked:true, detail:'首次完成给里程碑奖励；之后每个剧情日最多再结算一次，仅产出 SV。' },
    { id:'repeat', type:'DESIRE', title:'操过一次还想再操你', desc:'和同一个成年男人发生第二次明确的性接触、性行为或射精事件。光聊天、调情、约会都不算；得证明他上次碰过你以后还想再来。', reward:'AP +550 · SV +70', state:'CHARM 18 解锁', locked:true, detail:'一次性里程碑。若对象曾淡出，完成后会被 MEN 自动提升为 RETURNING。' },
    { id:'drain', type:'DESIRE', title:'真有本事就把他榨干', desc:'在一次成人性场景里把成年对象操到系统判定的“完全采集”，别做到一半就只顾自己爽。', reward:'AP +800 · SV +120', repeatable:'daily', repeatReward:'SV +130', state:'CHARM 25 解锁', locked:true, detail:'首次完成是高阶里程碑；之后每个剧情日最多再结算一次，仅产出 SV。' },
  ],
  special: [
    { id:'audit', type:'SYSTEM', title:'管理员审美复检', desc:'触发一次完整宿主扫描，管理员会根据当前阶段重新评价。', reward:'AP +200', state:'阶段任务', detail:'一次性阶段任务。评价可能很难听，但不会凭空增加或减少属性。' },
    { id:'contract', type:'HIDDEN', title:'隐藏契约', desc:'满足未知条件后由系统主动触发。', reward:'???', state:'条件未知', locked:true, detail:'隐藏任务不会提前向模型公开完整触发条件。' },
    { id:'override', type:'RARE', title:'越级奖励', desc:'在极少数高风险或高价值剧情节点触发一次越级改造机会。', reward:'RANDOM', state:'稀有事件', locked:true, detail:'由剧情事件触发，不作为普通可刷任务。' },
  ],
};

function deterministicTaskRotation(list,category,state=runtimeState(),count=3){
  const items=Array.isArray(list)?list:[];
  if(items.length<=count) return [...items];
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  const salt={daily:17,desire:31,special:47}[category]||7;
  return [...items]
    .map((task,index)=>({
      task,
      score:hashId(`${category}|${day}|${salt}|${task.id}|${index}`),
    }))
    .sort((a,b)=>a.score-b.score)
    .slice(0,count)
    .map(entry=>entry.task);
}

function deterministicDailyRotationForDay(list,day,count=3){
  const items=Array.isArray(list)?list:[];
  if(!items.length) return [];
  const targetDay=Math.max(1,Number(day)||1);
  const history=[];

  for(let d=1;d<=targetDay;d++){
    const previousTwo=history.slice(-2).flat();
    const forbidden=new Set(previousTwo.map(task=>task.id));
    let eligible=items.filter(task=>!forbidden.has(task.id));

    // With the expanded pool this normally never triggers, but keep a safe
    // fallback that relaxes from two-day avoidance to one-day avoidance.
    if(eligible.length<count){
      const yesterday=new Set((history.at(-1)||[]).map(task=>task.id));
      eligible=items.filter(task=>!yesterday.has(task.id));
    }
    if(eligible.length<count) eligible=[...items];

    const ranked=[...eligible].sort((a,b)=>{
      const sa=hashId(`daily-v2|${d}|${a.id}`);
      const sb=hashId(`daily-v2|${d}|${b.id}`);
      return sa-sb || String(a.id).localeCompare(String(b.id));
    });

    let chosen=ranked.slice(0,count);

    // DAY 001 always contains the onboarding cleanup task.
    if(d===1){
      const onboarding=items.find(task=>task.id==='clean');
      if(onboarding && !chosen.some(task=>task.id==='clean')){
        chosen=[onboarding,...chosen.filter(task=>task.id!=='clean')].slice(0,count);
      }
    }
    history.push(chosen);
  }

  return history[targetDay-1]||[];
}

function currentStaticTaskPool(category,state=runtimeState()){
  const list=TASK_DATA[category]||[];

  if(category==='daily'){
    const day=Math.max(1,Number(state.tasks?.storyDay)||1);
    return deterministicDailyRotationForDay(list,day,3);
  }

  // Foundational desire entries are backend milestones only.
  // The visible DESIRE board is fully plot/person generated.
  if(category==='desire') return [];
  if(category==='special') return deterministicTaskRotation(list,category,state,2);
  return [...list];
}

const DYNAMIC_DESIRE_TIERS = {
  1:{minCharm:8, ap:120, sv:20, label:'TIER I'},
  2:{minCharm:18, ap:180, sv:35, label:'TIER II'},
  3:{minCharm:35, ap:260, sv:50, label:'TIER III'},
  4:{minCharm:55, ap:360, sv:70, label:'TIER IV'},
};

function dynamicDesireRewardLabel(tier=1){
  const meta=DYNAMIC_DESIRE_TIERS[Math.max(1,Math.min(4,Number(tier)||1))] || DYNAMIC_DESIRE_TIERS[1];
  return `AP +${meta.ap} · SV +${meta.sv}`;
}

const DYNAMIC_DAILY_REWARDS = {
  light:{base:60,min:40,max:90,gapShare:0.30,label:'LIGHT'},
  normal:{base:90,min:60,max:130,gapShare:0.48,label:'NORMAL'},
  hard:{base:130,min:90,max:180,gapShare:0.68,label:'HARD'},
};

function roundEconomy(value,step=10){
  return Math.max(0,Math.round(Number(value||0)/step)*step);
}

function clampEconomy(value,min,max){
  return Math.max(min,Math.min(max,Number(value)||0));
}

function availableApPriceTargets(state=runtimeState()){
  const prices=[];
  for(const list of Object.values(SHOP_DATA)){
    for(const item of list){
      if(item.currency!=='AP' || item.currency==='LOCK') continue;
      const view=staticShopView(item,state);
      const req=shopRequirement(item,state);
      const payment=shopPaymentMeta(item,state,view);
      if(view.soldOut || !req.ok || payment.currency!=='AP') continue;
      if(Number(payment.price)>0) prices.push(Number(payment.price));
    }
  }
  for(const item of getDynamicShop(state)){
    const view=staticShopView(item,state);
    const payment=shopPaymentMeta(item,state,view);
    if(payment.currency==='AP' && Number(payment.price)>0) prices.push(Number(payment.price));
  }
  for(const item of getLifestyleShelf(state)){
    const view=staticShopView(item,state);
    const payment=shopPaymentMeta(item,state,view);
    if(payment.currency==='AP' && Number(payment.price)>0) prices.push(Number(payment.price));
  }
  return prices.sort((a,b)=>a-b);
}

function economyApReference(state=runtimeState()){
  const balance=Math.max(0,Number(getSpendableResources(state).ap)||0);
  const prices=availableApPriceTargets(state);
  const next=prices.find(price=>price>balance);
  if(next) return {balance,target:next,gap:Math.max(0,next-balance)};
  if(prices.length){
    const mid=prices[Math.floor(prices.length/2)];
    return {balance,target:mid,gap:0};
  }
  const phase=currentShopPhase(state);
  const fallback=Number(PLOT_PRICES.AP?.[phase.id]||220);
  return {balance,target:fallback,gap:Math.max(0,fallback-balance)};
}

function dynamicDailyRewardMeta(difficulty='normal',state=runtimeState()){
  const meta=DYNAMIC_DAILY_REWARDS[String(difficulty||'normal').toLowerCase()] || DYNAMIC_DAILY_REWARDS.normal;
  const econ=economyApReference(state);
  const wealthRatio=econ.target>0 ? econ.balance/econ.target : 0;
  const wealthFactor=wealthRatio>=2.2 ? 0.72 : wealthRatio>=1.5 ? 0.82 : wealthRatio>=1.0 ? 0.92 : 1;
  const gapSupport=econ.gap>0 ? econ.gap*meta.gapShare : 0;
  const raw=Math.max(meta.base*wealthFactor,gapSupport);
  const ap=roundEconomy(clampEconomy(raw,meta.min,meta.max),10);
  return {...meta,ap,economy:{balance:econ.balance,target:econ.target,gap:econ.gap}};
}

const SHOP_DATA = {
  appearance: [
    {id:'lip1',icon:'♡',title:'唇部修复Ⅰ',desc:'改善干裂、暗沉与边缘粗糙感。',price:160,currency:'AP',level:'LV.1',req:'无',detail:'完成后只改变基础状态，不直接赋予“漂亮”标签。'},
    {id:'hair1',icon:'⌁',title:'发质修复Ⅰ',desc:'降低毛躁、油腻与枯涩感，让头发更顺。',price:180,currency:'AP',level:'LV.1',req:'无',detail:'先从“像洗过头”开始。'},
    {id:'skin1',icon:'◇',title:'皮肤细化Ⅰ',desc:'改善粗糙、暗沉与肤质不均。',price:300,currency:'AP',level:'LV.1',req:'无',detail:'提升细腻度与基础光泽，不改变肤色种族特征。'},
    {id:'face1',icon:'✦',title:'轮廓收束Ⅰ',desc:'轻度优化面部浮肿感与轮廓松散。',price:450,currency:'AP',level:'LV.1',req:'CHARM 5',detail:'属于缓慢改造，不会一夜换脸。'},
    {id:'eye1',icon:'◉',title:'眼型优化Ⅰ',desc:'改善眼周疲态与比例，让眼神更干净。',price:550,currency:'AP',level:'LV.1',req:'CHARM 8',detail:'不会改变身份识别，只做比例与状态优化。'},
    {id:'face2',icon:'♢',title:'五官协调Ⅰ',desc:'小幅调整五官之间的比例协调度。',price:650,currency:'AP',level:'LV.1',req:'CHARM 10',detail:'高于单项修复，属于整体面部优化。'},
  ],
  body: [
    {id:'posture1',icon:'↟',title:'姿态矫正Ⅰ',desc:'改善含胸、塌肩与习惯性蜷缩。',price:260,currency:'AP',level:'LV.1',req:'完成日常任务',detail:'优先改变视觉体态，再进入比例改造。'},
    {id:'bodyfat1',icon:'⌇',title:'体脂重塑Ⅰ',desc:'缓慢调整整体体型与脂肪分布趋势。',price:450,currency:'AP',level:'LV.1',req:'CHARM 6',detail:'系统改造效果按剧情阶段逐步体现。'},
    {id:'waist1',icon:'⌁',title:'腰臀比例Ⅰ',desc:'让腰臀线条更清晰，但仍保持自然比例。',price:520,currency:'AP',level:'LV.1',req:'体脂重塑Ⅰ',detail:'不是夸张沙漏体型，只做第一阶段比例优化。'},
    {id:'leg1',icon:'Ⅱ',title:'腿型修正Ⅰ',desc:'调整站姿、膝踝线条与整体腿部观感。',price:380,currency:'AP',level:'LV.1',req:'姿态矫正Ⅰ',detail:'优先修正视觉线条。'},
    {id:'neck1',icon:'⌃',title:'肩颈线条Ⅰ',desc:'让肩颈过渡更舒展、轻盈。',price:300,currency:'AP',level:'LV.1',req:'姿态矫正Ⅰ',detail:'与体态类效果叠加。'},
    {id:'bust1',icon:'◡',title:'胸型调整Ⅰ',desc:'改善胸部轮廓与位置，使整体比例更协调。',price:600,currency:'AP',level:'LV.1',req:'CHARM 12',detail:'仅为虚构系统中的外形改造。'},
  ],
  sensory: [
    {id:'scent1',icon:'✧',title:'体香优化Ⅰ',desc:'降低汗味与油腻气味，形成干净的基础体香。',price:180,currency:'AP',level:'LV.1',req:'无',detail:'最基础的近距离感官优化。'},
    {id:'breath1',icon:'○',title:'口腔气息Ⅰ',desc:'维持清洁、清新的近距离呼吸气味。',price:120,currency:'AP',level:'LV.1',req:'无',detail:'不带强制魅惑效果。'},
    {id:'voice1',icon:'♪',title:'声线柔化Ⅰ',desc:'让音色更稳定柔和，减少刺耳与含混。',price:220,currency:'AP',level:'LV.1',req:'无',detail:'改变听感，不直接改变说话内容。'},
    {id:'touch1',icon:'≈',title:'肌肤触感Ⅰ',desc:'提升皮肤柔软度与细腻触感。',price:320,currency:'AP',level:'LV.1',req:'皮肤细化Ⅰ',detail:'属于触觉向改造。'},
    {id:'scent2',icon:'✧',title:'诱导体香Ⅰ',desc:'让体香在近距离更容易被成年对象注意。',price:50,currency:'SV',level:'LV.1',req:'CHARM 15',detail:'仅增强存在感，不控制他人意志。'},
  ],
  desire: [
    {id:'sensitive1',icon:'♥',title:'敏感度微调Ⅰ',desc:'轻度提高成人性刺激下的身体反馈。',price:60,currency:'SV',level:'LV.1',req:'首次精液采集',detail:'只影响宿主自身感受，不改变他人。'},
    {id:'arousal1',icon:'♢',title:'欲望阈值Ⅰ',desc:'让宿主更容易识别并接受自身成人欲望。',price:50,currency:'SV',level:'LV.1',req:'CHARM 12',detail:'不会强制进入发情或失去判断力。'},
    {id:'lubrication1',icon:'⌁',title:'分泌反应Ⅰ',desc:'增强成人性唤起时的自然润滑反应。',price:70,currency:'SV',level:'LV.1',req:'CHARM 15',detail:'虚构系统生理改造项。'},
    {id:'orgasm1',icon:'✦',title:'高潮感受Ⅰ',desc:'提高达到高潮时的主观强度上限。',price:100,currency:'SV',level:'LV.1',req:'CHARM 20',detail:'不会让宿主无条件自动高潮。'},
    {id:'recovery1',icon:'↺',title:'亲密恢复Ⅰ',desc:'缩短成人性活动后的疲惫恢复时间。',price:90,currency:'SV',level:'LV.1',req:'CHARM 20',detail:'仅用于虚构剧情数值，不对应现实医学效果。'},
  ],
  special: [
    {id:'charmseal',icon:'♛',title:'魅魔印记',desc:'最终魅力完成改造。只有常规精修已经走到近完成体才开放。',price:250,currency:'SV',level:'FINAL',req:'CHARM 93',detail:'购买后将当前 CHARM 直接补足至 100，并解锁完成体视觉反馈；不是普通阶梯改造。'},
  ],
};

const RECORD_DATA = [
  {type:'system',code:'BINDING',title:'MÉMÉ OS 绑定完成',desc:'随机宿主绑定成功。AP 0 / SV 0 / CHARM 0。'},
  {type:'change',code:'SCAN',title:'首次宿主扫描',desc:'系统判定：明显难看 · 未改造。改造进度 0%。'},
  {type:'system',code:'ADMIN',title:'管理员首次评价',desc:'“先去洗头。”'},
];


const VOICE_STAGES = [
  {
    id:'disgust', min:0, max:9, label:'纯嫌弃期', code:'VENOM',
    rule:'低互动欲 + 高嘴臭度。此阶段他是真的嫌弃宿主，也真的懒得在宿主身上浪费口舌；没有夸奖、嘴硬心软或隐藏喜欢。平常能一句说完绝不讲三段，常见反应是短促脏话、半句打住、懒得解释、直接不接话。',
    home:['“……又怎么了。”','“操。任务自己看。”','“少烦我。先把你自己收拾明白。”','“啧。”'],
  },
  {
    id:'repair', min:10, max:29, label:'抢救期', code:'REPAIR',
    rule:'承认改造开始有效，但整体仍处于抢救。可以说“至少没刚绑定时那么灾难”，不能提前把宿主描述成漂亮或真正像样。',
    home:['“至少现在没刚绑定时那么灾难。”','“有改善。别急着得意。”','“继续修。还没到能吹的时候。”','“总算不是完全没救。”'],
  },
  {
    id:'acceptable', min:30, max:54, label:'顺眼期', code:'ACCEPT',
    rule:'宿主已经跨过普通人线：不再丑得扎眼，整体顺眼，认真收拾时足以让成年男人产生普通性兴趣；但离真正漂亮仍有明显距离。',
    home:['“行。现在至少算顺眼。”','“普通人线过了，别把自己当美女。”','“现在有人愿意多看两眼，我不意外。”','“能看了。离漂亮还早。”'],
  },
  {
    id:'pretty', min:55, max:69, label:'漂亮期', code:'PRETTY',
    rule:'客观上明显漂亮。他会承认“漂亮”，但嘴依旧脏；漂亮不等于他本人想操/想睡，更不等于温柔。',
    home:['“行，漂亮。满意了？”','“现在确实有人会回头看你。”','“脸是好看了，性格还是烦。”','“我承认你现在漂亮。只代表我的眼睛没坏。”'],
  },
  {
    id:'beauty', min:70, max:84, label:'美女期', code:'BEAUTY',
    rule:'真正跨过美女审美门槛。只有从这里开始，具体剧情才可能让他出现更直接的真实性欲；没有欲望信号时仍只是嘴很脏的审美评价者。',
    home:['“……现在倒是真的配得上美女两个字了。”','“漂亮是漂亮。别擅自理解成我喜欢你。”','“现在别人盯你，我能理解。”','“行，这次没什么值得挑的大毛病。”'],
  },
  {
    id:'stunning', min:85, max:92, label:'高魅力美女期', code:'STUNNING',
    rule:'外貌高度出众，已经明显超出普通美女。若欲望线已产生，他会更露骨、更敢直接表达身体吸引，但仍不等于爱。',
    home:['“这张脸现在确实很合我胃口。”','“别晃。让我多看两秒。”','“现在这副样子，确实够惹眼。”','“长成这样是你的本事。让我喜欢你是另一回事。”'],
  },
  {
    id:'near_complete', min:93, max:99, label:'近完成体', code:'NEAR',
    rule:'固定常规改造已经接近系统上限，只差最终完成机制。系统哥会承认这是极高完成度，但仍把100视为单独的最终节点。',
    home:['“差最后一点。别现在掉链子。”','“已经很接近了。最后那格不是白送的。”','“现在挑毛病都得挑得很细。”','“九十多分了，别急着替自己封神。”'],
  },
  {
    id:'complete', min:100, max:999, label:'魅力完成体', code:'COMPLETE',
    rule:'CHARM 100。外貌与系统魅力改造达到完整终点。后续成长应转向剧情、关系、能力、欲望玩法与特殊商品，而不是继续无意义堆CHARM。',
    home:['“一百。行，这次没得赖。”','“完成体。总算让我把这栏关了。”','“别再问还能不能更漂亮。数值已经到头。”','“这回是真毕业了。”'],
  },
];

const RUDE_SHOP_NAMES = {
  lip1:'先把这张起皮的嘴救回来',
  hair1:'油头急救Ⅰ',
  skin1:'把这层粗糙皮先磨细点',
  face1:'脸别再肿成一团Ⅰ',
  eye1:'把那副没睡醒的眼睛救一下',
  face2:'五官别各长各的Ⅰ',
  posture1:'别再缩得像挨骂一样',
  bodyfat1:'先把这一身赘肉处理掉Ⅰ',
  waist1:'终于开始找腰了Ⅰ',
  leg1:'腿线别再乱七八糟Ⅰ',
  neck1:'把脖子和肩膀从肉里捞出来',
  bust1:'胸型至少别拖整体后腿',
  scent1:'先把这股汗油味压下去',
  breath1:'嘴里别再一股闷味',
  voice1:'说话别那么难听Ⅰ',
  touch1:'摸起来别再这么粗糙',
  scent2:'终于可以谈“好闻”了',
  sensitive1:'别被操了半天身体还像死机',
  arousal1:'先学会知道自己什么时候真发情',
  lubrication1:'别每次想要了下面还干得丢人',
  orgasm1:'高潮别像挤牙膏一样寒碜',
  recovery1:'被操完别立刻瘫成一滩',
  charmseal:'给你烙个终于配得上的印记',
};


const RUDE_SHOP_DESCS = {
  lip1:'嘴唇干得起皮，颜色还发暗。先把裂口和粗糙收拾掉，至少别让人第一眼只看见一张缺水的嘴。',
  hair1:'头发又油又毛，贴着头皮还炸着发尾。先把这堆东西洗顺了，再谈什么发型。',
  skin1:'近看全是粗糙和暗沉，出油还不均匀。把肤质磨细一点，别让底子继续拖后腿。',
  face1:'脸现在肿得轮廓都快找不到。先把松散和浮肿往回收，不然五官再改也白搭。',
  eye1:'眼周疲态太重，眼神像永远没睡醒。先把这副困相救回来。',
  face2:'鼻子、眼睛、嘴各长各的，互相一点都不配合。先把比例拉回一个能看的整体。',
  posture1:'你一缩肩一塌背，整个人立刻又矮又丧。先学会把自己撑起来。',
  bodyfat1:'现在的问题不是“肉一点”，是整体轮廓被脂肪糊掉了。先把体型从一团里分出来。',
  waist1:'腰线基本失踪。先把上下身的分界找回来，别急着幻想沙漏。',
  leg1:'站姿和腿线一起乱。先把膝踝和受力修顺，至少别越站越难看。',
  neck1:'肩颈挤成一块，显得头重、脖子短。把这条线先拉开。',
  bust1:'胸型现在只是在跟着体型一起往下坠。先把位置和轮廓整理到不拖后腿。',
  scent1:'汗味、油味和闷味混在一起。先把“难闻”处理掉，离“好闻”还远。',
  breath1:'近距离说话之前先把口气解决。别让别人刚靠近就想后退。',
  voice1:'声音不算难听，但毫无记忆点，还带点含混。先让人听清楚你在说什么。',
  touch1:'皮肤摸起来粗，干湿还不均。先把触感做得像皮肤，而不是砂纸。',
  scent2:'基础清洁过关以后，才轮得到“让人想再靠近一点”这种东西。',
  sensitive1:'你这身体迟钝得像没通电。真被人摸、舔、操的时候至少该知道哪里爽，别半天才有反应。',
  arousal1:'连自己什么时候真想要、什么时候只是嘴硬都分不清。先把发情这件事认明白。',
  lubrication1:'都想被碰了下面还干得跟没这回事一样。把自然湿润反应调快点，省得每次都丢人。',
  orgasm1:'会叫不等于会爽。把高潮调得像样一点，别每次都像勉强交作业。',
  recovery1:'被操一次就瘫得像报废，太没用。把恢复速度拉回来，至少还能继续折腾。',
  charmseal:'等你真的好看到配得上这个印记，我才会给。现在看两眼就行。',
};

const RUDE_TASK_DESCS = {
  clean:'先把头洗了、澡洗了、衣服换了、牙刷了。最基础的卫生都做不到，别跟我谈改造。',
  mirror:'照三分钟镜子，不许躲、不许只看顺眼的角度。你得先知道自己到底哪里难看。',
  walk:'坐着不会自动变好看。起来动二十分钟，别把“改造”理解成躺着等我给。',
  posture:'肩膀打开，背挺起来。你再缩成那样，买再多东西也只是把好东西堆在烂姿态上。',
  outfit:'不用贵，先穿干净、合身、像认真挑过的衣服。别再把随便套上身当风格。',
  bedreset:'床铺、纸巾、衣服、乱七八糟的东西都给我收了。别每天睡在事故现场里。',
  deskreset:'桌面清出一块能正常用的地方。垃圾扔掉，常用的东西归位。',
  skincare:'洗脸，做基础护理。不是让你买贵东西，是别连最简单的都懒得做。',
  stretch:'肩颈、腰背、腿都舒展开一点。你再一直缩着，我看着都烦。',
  photo:'留一张不藏角度的记录照。以后变了才知道到底变了多少。',
  wardrobe:'挑一小块衣柜整理，叠好、挂好、分好。别每次找衣服都像翻垃圾场。',
  laundry:'处理一批脏衣服。洗、晾、烘，至少让它们进入正常流程，别继续堆。',
  bagreset:'把包里废纸、包装和没用的东西清掉。包不是你随身携带的垃圾桶。',
  shoes:'把最常穿的那双鞋清理一下。别上半身收拾了，脚底下还一副逃难样。',
  scent:'先处理干净，再谈香。洗净、换洗、止汗或适量留香，别拿香水盖脏味。',
  spark:'先让个成年男人因为你硬起来。不是夸你好看，不是嘴上说骚话，是他真的被你弄出性反应，想摸、想操、想把你按到床上。',
  sample:'我要的是第一次能结算的精液。别拿几句骚话和摸两下回来邀功，射出来、收得到，才算数。',
  oral:'这张嘴平时除了顶嘴没别的本事。去做一次真正的口交，等对方射出来再回来交差。',
  repeat:'同一个男人操过一次以后还想再操你，才说明上次不是一时脑热。别拿约会和聊天糊弄我，我要看第二次真碰、真做、真起反应。',
  drain:'都做到床上去了就别装矜持。把人榨到射干净，再把SV给我带回来。',
  audit:'站好。让我重新从头扫一遍，看看到底救回来多少，还是你只会自我感觉良好。',
  contract:'隐藏就是不想让你提前知道。老实玩，别总想翻答案。',
  override:'真碰到值得越级奖励的事，我会自己开。你没资格手动刷。',
};

const STAGE_REMARKS = {
  1:['总算知道先修哪里了。','这项至少不算浪费点数。','先把这一处补上，别急着邀功。','可以做，做完大概没那么碍眼。'],
  2:['这项做完应该会更顺眼。','嗯，这里确实值得再调一点。','可以，继续往这个方向改。','这个选得还行，别逼我夸第二次。'],
  3:['这项值得精修。','别乱动，我挑这一项。','这里再收一点会更漂亮。','行，这次确实是为了变漂亮，不是抢救。'],
  4:['这个我想看效果。','长成美女以后总算有资格挑细节了。','这里再漂亮一点，会很抓眼。','买。你现在值得做这种精修。'],
  5:['这个按我的审美改。','别问，我觉得这样更好看。','这项做完应该会非常漂亮。','买。难得有一张脸值得我认真挑。']
};

function hashId(value=''){
  let h=0;
  for(const ch of String(value)) h=(h*31+ch.charCodeAt(0))>>>0;
  return h;
}


const PLOT_PRICES = {
  AP: { rescue:220, refine:360, beauty:540, advanced:780 },
  SV: { rescue:45, refine:65, beauty:95, advanced:130 },
};

const PLOT_IMPACT_MULTIPLIERS = {
  minor:0.82,
  standard:1,
  major:1.22,
};

function dynamicPlotPrice(state,currency='AP',impact='standard'){
  const phase=currentShopPhase(state);
  const base=Number(PLOT_PRICES[currency]?.[phase.id] || (currency==='SV'?45:220));
  const spendable=getSpendableResources(state);
  const balance=Math.max(0,Number(currency==='SV'?spendable.sv:spendable.ap)||0);
  const impactMult=PLOT_IMPACT_MULTIPLIERS[String(impact||'standard').toLowerCase()] || 1;
  const ratio=base>0 ? balance/base : 0;

  // Balance affects the band, but never chases the user upward point-for-point.
  // Poor hosts get a modest rescue discount; rich hosts pay a small premium.
  const economyMult=ratio<0.35 ? 0.78
    : ratio<0.75 ? 0.90
    : ratio>2.25 ? 1.18
    : ratio>1.40 ? 1.08
    : 1;

  const step=currency==='SV'?5:10;
  const floor=currency==='SV'?20:80;
  const ceiling=currency==='SV'?220:980;
  const price=roundEconomy(clampEconomy(base*impactMult*economyMult,floor,ceiling),step);
  return {price,base,balance,phase,impact:String(impact||'standard').toLowerCase()};
}

const PLOT_CHARM_AXES = new Set([
  'face','eyes','bodyShape','waistHip','legs','neckShoulders','bust',
]);
const PLOT_POLISH_AXES = new Set([
  'lips','skin','hair','posture','scent','breath','voice','touch','specialMark',
]);

function dynamicDesireTierForState(state=runtimeState()){
  const charm=Number(state.host?.charm)||0;
  if(charm>=55) return 4;
  if(charm>=35) return 3;
  if(charm>=18) return 2;
  if(charm>=8) return 1;
  return 0;
}

const MEME_RUNTIME_PROMPT_ID='meme_os_runtime_bridge';

function adminCopyText(value,fallback='',max=180){
  // MÉMÉ OS and the administrator are the same speaking personality.
  // Normalize formatting only; never scrub away his first-person voice,
  // insults, dirty wording, judgments or stage-dependent attitude.
  const text=String(value??fallback??'')
    .replace(/[\r\n\t]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  return text.slice(0,max) || String(fallback||'').slice(0,max);
}

function sanitizeGeneratedDesireTask(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const title=adminCopyText(raw.title,'剧情欲望任务',48);
  const desc=adminCopyText(raw.desc,'',180);
  const detail=adminCopyText(raw.detail,'',180);
  if(!title || !desc) return null;

  const tier=dynamicDesireTierForState(state);
  if(tier<1) return null;

  const fingerprint=`${title.toLowerCase()}|${desc.toLowerCase()}`;
  const id=`desire_${hashId(fingerprint).toString(36)}`;
  if(state.tasks?.completed?.[id] || state.tasks?.everCompleted?.[id]) return null;
  if((state.tasks?.generated||[]).some(task=>task.id===id)) return null;
  if(state.tasks?.active?.[id]) return null;

  return {
    id,
    type:'DESIRE',
    category:'desire',
    dynamicTask:true,
    tier,
    title,
    desc,
    detail:detail || '剧情生成的一次性成人任务。完成后计入“不同色情任务”进度。',
    reward:dynamicDesireRewardLabel(tier),
    state:'剧情任务',
    locked:false,
    createdDay:Number(state.tasks?.storyDay)||1,
    createdTurn:Number(state.shop?.plotTurn)||0,
    source:adminCopyText(raw.source,'当前剧情',80),
    targetManId:String(raw.targetManId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48) || null,
  };
}

const DAILY_ACTION_PATTERNS = {
  hair_wash:/(洗头|洗(?:一遍)?头发|头发.{0,8}(?:洗净|洗干净))/i,
  shower:/(洗澡|淋浴|冲澡|冲(?:个|一下)?澡)/i,
  hair_dry:/(吹干.{0,8}(?:头发|头)|(?:头发|湿发).{0,10}吹干|吹头发)/i,
  change_clothes:/(换(?:掉|下|上|一身|套)?.{0,8}(?:衣服|衣物|内衣|T恤|睡衣)|换洗衣物)/i,
  oral_hygiene:/(刷牙|口腔清洁|漱口)/i,
  bed_cleanup:/(床单|床铺|被罩|纸巾|脏衣服|垃圾堆|收拾.{0,8}床|整理.{0,8}床|换.{0,6}(?:床单|被罩))/i,
  posture:/(含胸|塌肩|肩颈|坐姿|站姿|姿态|背挺|挺背)/i,
  outfit:/(穿搭|搭配.{0,8}(?:衣服|外出服)|合身.{0,8}(?:衣服|衣物)|像样.{0,8}出门)/i,
  mirror:/(镜子|镜前|照镜|观察.{0,8}外貌)/i,
  movement:/(步行|散步|运动|走路|活动.{0,8}(?:分钟|小时)|动起来)/i,
  desk_cleanup:/(桌面|书桌|电脑桌|收拾.{0,8}(?:桌|桌面)|整理.{0,8}(?:桌|桌面))/i,
  skincare:/(洁面|洗脸|护肤|面霜|乳液|基础护理)/i,
  stretch:/(拉伸|伸展|舒展|活动.{0,8}(?:肩颈|腰背|腿))/i,
  photo_record:/(记录照|全身照|半身照|自拍|拍.{0,4}(?:照片|照))/i,
  wardrobe:/(衣柜|衣物区|叠.{0,4}衣|挂.{0,4}衣|整理.{0,8}衣服)/i,
  laundry:/(洗衣|脏衣|洗衣机|晾衣|烘衣|衣物分类)/i,
  bag_reset:/(包里|背包|手提包|整理.{0,8}包|清.{0,8}包)/i,
  shoes:/(擦鞋|清理.{0,6}鞋|鞋面|鞋子.{0,8}(?:灰|污渍|清理))/i,
  scent:/(止汗|体香|香水|留香|气味管理|衣物气味|身体气味)/i,
};

const STATIC_DAILY_ACTIONS = {
  clean:['hair_wash','shower','change_clothes','oral_hygiene'],
  mirror:['mirror'],
  walk:['movement'],
  posture:['posture'],
  outfit:['outfit'],
  bedreset:['bed_cleanup'],
  deskreset:['desk_cleanup'],
  skincare:['skincare'],
  stretch:['stretch'],
  photo:['photo_record'],
  wardrobe:['wardrobe'],
  laundry:['laundry'],
  bagreset:['bag_reset'],
  shoes:['shoes'],
  scent:['scent'],
};

function extractDailyActionTags(text=''){
  const source=String(text||'');
  return Object.entries(DAILY_ACTION_PATTERNS)
    .filter(([,pattern])=>pattern.test(source))
    .map(([tag])=>tag);
}

function taskActionTags(task){
  if(!task) return [];
  if(Array.isArray(task.actionTags) && task.actionTags.length) return [...new Set(task.actionTags.map(String))];
  const staticTags=STATIC_DAILY_ACTIONS[String(task.id||'')];
  if(staticTags) return [...staticTags];
  return extractDailyActionTags(`${task.title||''} ${task.desc||''} ${task.detail||''}`);
}

function completedDailyActionTags(state=runtimeState()){
  const tags=new Set();
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  for(const [id,record] of Object.entries(state.tasks?.dailyCompleted||{})){
    if(Number(record?.day||0)!==day) continue;
    const saved=Array.isArray(record?.actionTags)?record.actionTags:[];
    saved.forEach(tag=>tags.add(String(tag)));
    const staticTags=STATIC_DAILY_ACTIONS[id]||[];
    staticTags.forEach(tag=>tags.add(tag));
    const task=findTask(id,state);
    taskActionTags(task).forEach(tag=>tags.add(tag));
  }
  return tags;
}

function isSemanticallyFinishedDaily(task,state=runtimeState()){
  const tags=taskActionTags(task);
  if(!tags.length) return false;
  const completed=completedDailyActionTags(state);
  return tags.every(tag=>completed.has(tag));
}

function hasOpenSemanticDuplicate(task,state=runtimeState()){
  const tags=taskActionTags(task);
  if(!tags.length) return false;
  const tagSet=new Set(tags);
  const open=[
    ...(state.tasks?.generatedDaily||[]),
    ...currentStaticTaskPool('daily',state),
  ];
  return open.some(existing=>{
    if(existing.id===task.id) return false;
    const other=taskActionTags(existing);
    return other.length>0 && tags.every(tag=>other.includes(tag));
  });
}

function pruneRedundantGeneratedDaily(state=runtimeState()){
  state.tasks=state.tasks||{};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  const seenSemantic=new Set();
  let changed=false;
  state.tasks.generatedDaily=state.tasks.generatedDaily.filter(task=>{
    if(isSemanticallyFinishedDaily(task,state)){
      changed=true;
      return false;
    }
    const tags=taskActionTags(task).sort();
    const key=tags.length?tags.join('|'):`id:${task.id}`;
    if(tags.length && seenSemantic.has(key) && !state.tasks?.active?.[task.id]){
      changed=true;
      return false;
    }
    seenSemantic.add(key);
    return true;
  });
  return changed;
}

function normalizedTaskTitle(value=''){
  return String(value||'').replace(/\s+/g,'').replace(/[“”"'「」『』【】\[\]·•・⋅∙:：|｜，,。！？!?；;]/g,'').toLowerCase();
}

function isDismissedGeneratedTask(candidate,state=runtimeState()){
  const dismissed=Array.isArray(state.tasks?.dismissed)?state.tasks.dismissed:[];
  const storyDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const title=normalizedTaskTitle(candidate?.title);
  const tags=taskActionTags(candidate).sort().join('|');
  return dismissed.some(item=>{
    if(Number(item?.storyDay||0)!==storyDay) return false;
    const oldTitle=normalizedTaskTitle(item?.title);
    const oldTags=Array.isArray(item?.actionTags)?[...item.actionTags].map(String).sort().join('|'):'';
    return (title && oldTitle && title===oldTitle) || (tags && oldTags && tags===oldTags);
  });
}

function rememberDismissedTask(state,task){
  if(!task) return;
  state.tasks=state.tasks||{};
  state.tasks.dismissed=Array.isArray(state.tasks.dismissed)?state.tasks.dismissed:[];
  const record={
    id:String(task.id||''),
    title:String(task.title||''),
    category:String(task.category||'daily'),
    actionTags:taskActionTags(task),
    storyDay:Math.max(1,Number(state.tasks.storyDay)||1),
    dismissedTurn:Number(state.shop?.plotTurn)||0,
    dismissedAt:Date.now(),
  };
  state.tasks.dismissed=[
    ...state.tasks.dismissed.filter(item=>!(item.id===record.id || (
      Number(item.storyDay||0)===record.storyDay &&
      normalizedTaskTitle(item.title)===normalizedTaskTitle(record.title)
    ))),
    record,
  ].slice(-40);
}

function sanitizeGeneratedDailyTask(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const title=adminCopyText(raw.title,'剧情任务',48);
  const desc=adminCopyText(raw.desc,'',180);
  const detail=adminCopyText(raw.detail,'',180);
  if(!title || !desc) return null;

  const difficulty=['light','normal','hard'].includes(String(raw.difficulty||'').toLowerCase())
    ? String(raw.difficulty).toLowerCase()
    : 'normal';
  const reward=dynamicDailyRewardMeta(difficulty,state);
  const source=String(raw.source||'当前剧情').replace(/\s+/g,' ').trim().slice(0,80);
  const actionTags=extractDailyActionTags(`${title} ${desc} ${detail}`);
  const fingerprint=`${title.toLowerCase()}|${desc.toLowerCase()}|${source.toLowerCase()}|day:${Math.max(1,Number(state.tasks?.storyDay)||1)}`;
  const id=`daily_${hashId(fingerprint).toString(36)}`;
  const candidate={id,title,desc,detail,actionTags};
  if(state.tasks?.everCompleted?.[id]) return null;
  if((state.tasks?.generatedDaily||[]).some(task=>task.id===id)) return null;
  if(state.tasks?.active?.[id]) return null;
  if(isDismissedGeneratedTask(candidate,state)) return null;
  if(isSemanticallyFinishedDaily(candidate,state)) return null;
  if(hasOpenSemanticDuplicate(candidate,state)) return null;

  return {
    id,
    type:'DAILY',
    category:'daily',
    dynamicDailyTask:true,
    difficulty,
    title,
    desc,
    actionTags,
    detail:detail || '根据当前剧情生成的一次性日常任务。完成后从任务板移除。',
    reward:`AP +${reward.ap}`,
    state:'剧情生成',
    locked:false,
    createdDay:Number(state.tasks?.storyDay)||1,
    createdTurn:Number(state.shop?.plotTurn)||0,
    source,
  };
}

function extractCanonicalTaskMarkers(raw=''){
  const text=String(raw||'');
  const tasks=[];
  // Canonical syntax:
  // [TASK｜任务名｜任务要求｜AP +90]
  const re=/\[\s*TASK\s*[｜|]\s*([^｜|\]\n]{2,48})\s*[｜|]\s*([^｜|\]\n]{2,220})\s*[｜|]\s*(?:奖励\s*)?AP\s*\+\s*(\d{1,4})\s*\]/gi;
  for(const match of text.matchAll(re)){
    const title=String(match[1]||'').replace(/\s+/g,' ').trim().slice(0,48);
    const desc=String(match[2]||'').replace(/\s+/g,' ').trim().slice(0,180);
    const shownReward=Math.max(0,Number(match[3])||0);
    if(title && desc) tasks.push({title,desc,shownReward});
  }
  return tasks;
}

function plotTaskFrequency(state=runtimeState()){
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  const turn=Number(state.shop?.plotTurn)||0;
  const sameDay=Number(state.tasks?.plotTaskIssuedDay||0)===day;
  const count=sameDay?Math.max(0,Number(state.tasks?.plotTaskIssuedCount)||0):0;
  const last=sameDay?Number(state.tasks?.lastPlotTaskTurn??-999):-999;
  return {
    day,turn,count,last,limit:2,
    canIssue:count===0 || (count===1 && turn-last>=8),
  };
}

function plotTaskRewardOptions(state=runtimeState()){
  return {
    light:dynamicDailyRewardMeta('light',state).ap,
    normal:dynamicDailyRewardMeta('normal',state).ap,
    hard:dynamicDailyRewardMeta('hard',state).ap,
  };
}

function markPlotTaskIssued(state){
  const freq=plotTaskFrequency(state);
  state.tasks.plotTaskIssuedDay=freq.day;
  state.tasks.plotTaskIssuedCount=freq.count+1;
  state.tasks.lastPlotTaskTurn=freq.turn;
}

function taskFromCanonicalMarker(card,state=runtimeState()){
  if(!card) return null;
  const title=String(card.title||'').replace(/\s+/g,' ').trim().slice(0,48);
  const desc=String(card.desc||'').replace(/\s+/g,' ').trim().slice(0,180);
  if(!title || !desc) return null;

  const options=plotTaskRewardOptions(state);
  const rewardMatch=Object.entries(options).find(([,value])=>Number(value)===Number(card.shownReward));
  const actionCount=(desc.match(/[，,、；;]/g)||[]).length+1;
  const hardCue=/(二十分钟|半小时|一小时|坚持|运动|出门|公共|社交|当众|长时间|彻底|完整完成|连续)/.test(desc);
  const lightCue=actionCount<=1 && /(扔|擦|关|拿|喝|换一件|刷牙|洗脸|吹干)/.test(desc);
  const difficulty=rewardMatch?.[0] || (hardCue?'hard':lightCue?'light':'normal');

  const task=sanitizeGeneratedDailyTask({
    title,
    desc,
    detail:'由正文 [TASK] 标记直接同步；完成后按滚动任务规则退场。',
    source:'剧情[TASK]标记',
    difficulty,
  },state);
  if(task){
    task.canonicalMarker=true;
    task.source='剧情[TASK]标记';
    task.shownReward=Math.max(0,Number(card.shownReward)||0);
    // The visible canonical card is already a published world fact.
    // Keep OS reward identical to prose instead of silently recalculating it.
    task.reward=`AP +${task.shownReward}`;
    task.rewardVerified=true;
  }
  return task;
}

function distinctEroticTaskCount(state=runtimeState()){
  return Object.values(state.tasks?.completed||{}).filter(task=>task?.category==='desire').length;
}

const LIFESTYLE_SHOP_KINDS=new Set([
  'skincare','food','daily','clothing','electronics','home','entertainment','service','other',
]);

function sanitizeDynamicItem(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const bodyAxis=BODY_AXES.has(String(raw.bodyAxis||'')) ? String(raw.bodyAxis) : null;
  const requestedCurrency=raw.currency==='SV'?'SV':'AP';
  const appearanceAxis=PLOT_CHARM_AXES.has(bodyAxis) || PLOT_POLISH_AXES.has(bodyAxis);
  const currency=(Number(state.host?.charm)||0)>=AP_CHARM_CAP && appearanceAxis ? 'SV' : requestedCurrency;
  const impact=['minor','standard','major'].includes(String(raw.impact||'').toLowerCase())
    ? String(raw.impact).toLowerCase()
    : 'standard';
  const economy=dynamicPlotPrice(state,currency,impact);
  const price=economy.price;
  const ttl=Math.max(1,Math.min(8,Math.round(Number(raw.ttl)||4)));
  const title=adminCopyText(raw.title,'临时改造',40);
  const desc=adminCopyText(raw.desc,'系统临时上架。',140);
  const detail=adminCopyText(raw.detail,'根据当前剧情临时出现，过期后自动撤架。',180);
  const fingerprint=`${title.toLowerCase()}|${desc.toLowerCase()}|${bodyAxis||'none'}|${currency}|${String(raw.source||'')}`;
  const id=`plot_${hashId(fingerprint).toString(36)}`;
  const charmGain=PLOT_CHARM_AXES.has(bodyAxis) ? 0.5 : PLOT_POLISH_AXES.has(bodyAxis) ? 0.25 : 0;
  return {
    id,
    icon:String(raw.icon||'✦').slice(0,4),
    title,
    desc,
    detail,
    price,
    currency,
    level:'PLOT',
    req:'剧情触发',
    category:'plot',
    dynamic:true,
    charmGain,
    createdTurn:Number(state.shop?.plotTurn)||0,
    expiresTurn:(Number(state.shop?.plotTurn)||0)+ttl,
    source:adminCopyText(raw.source,'剧情临时上架',80),
    impact,
    economyBasis:{base:economy.base,balanceAtCreation:economy.balance,phase:economy.phase.id},
    bodyAxis,
    sourceIssueId:String(raw.sourceIssueId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48) || null,
  };
}

function sanitizeLifestyleItem(raw,state=runtimeState(),slot=0){
  if(!raw || typeof raw!=='object') return null;
  if((Number(state.host?.charm)||0)<AP_CHARM_CAP) return null;
  const kindRaw=String(raw.kind||'daily').toLowerCase();
  const kind=LIFESTYLE_SHOP_KINDS.has(kindRaw)?kindRaw:'other';
  const impact=['minor','standard','major'].includes(String(raw.impact||'').toLowerCase())
    ? String(raw.impact).toLowerCase()
    : 'standard';
  const economy=dynamicPlotPrice(state,'AP',impact);
  const title=adminCopyText(raw.title,'日常用品',40);
  const desc=adminCopyText(raw.desc,'我觉得你现在用得上。',140);
  const detail=adminCopyText(raw.detail,'普通商品，不改身体数值。',180);
  const consumable=raw.consumable===undefined
    ? ['skincare','food','daily','service'].includes(kind)
    : Boolean(raw.consumable);
  const fingerprint=`${title.toLowerCase()}|${kind}|${slot}`;
  return {
    id:`dailygoods_${hashId(fingerprint).toString(36)}`,
    icon:String(raw.icon||'◇').slice(0,4),
    title,
    desc,
    detail,
    price:economy.price,
    currency:'AP',
    level:'DAILY GOODS',
    req:`CHARM ${AP_CHARM_CAP}`,
    category:'dailygoods',
    kind,
    consumable,
    dynamic:true,
    charmGain:0,
    createdTurn:Number(state.shop?.plotTurn)||0,
    createdDay:Number(state.tasks?.storyDay)||1,
    source:adminCopyText(raw.source,'我觉得你现在用得上',80),
    impact,
    bodyAxis:null,
    sourceIssueId:null,
  };
}

function getDynamicShop(state=runtimeState()){
  const turn=Number(state.shop?.plotTurn)||0;
  return (state.shop?.dynamic||[]).filter(item=>Number(item.expiresTurn||0)>=turn && !state.upgrades?.[item.id]);
}

function getLifestyleShelf(state=runtimeState()){
  if((Number(state.host?.charm)||0)<AP_CHARM_CAP) return [];
  return Array.isArray(state.shop?.lifestyleShelf) ? state.shop.lifestyleShelf.slice(0,5) : [];
}

function cleanMemoryText(value,max=240){
  return String(value||'').replace(/\s+/g,' ').trim().slice(0,max);
}

function escapeUiText(value){
  return String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function uniqueMemoryList(values,maxItems,maxChars){
  const out=[];
  const seen=new Set();
  for(const raw of Array.isArray(values)?values:[]){
    const text=cleanMemoryText(raw,maxChars);
    if(!text) continue;
    const key=text.toLowerCase();
    if(seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if(out.length>=maxItems) break;
  }
  return out;
}

function memoryNeedsCompression(state=runtimeState()){
  const memory=state.memory||{};
  return (Array.isArray(memory.short) && memory.short.length>=15)
    || (Array.isArray(memory.long) && memory.long.length>=10);
}

function applyMemoryEvent(state,raw,visibleTurns=0){
  if(!raw || typeof raw!=='object') return false;
  state.memory=state.memory||{
    initialized:false,bootstrappedAt:null,sourceTurns:0,
    short:[],long:[],permanent:[],lastUpdatedTurn:0,
  };
  state.memory.short=Array.isArray(state.memory.short)?state.memory.short:[];
  state.memory.long=Array.isArray(state.memory.long)?state.memory.long:[];
  state.memory.permanent=Array.isArray(state.memory.permanent)?state.memory.permanent:[];
  const turn=Math.max(0,Number(state.shop?.plotTurn)||0);

  if(raw.bootstrap===true && !state.memory.initialized){
    state.memory.short=uniqueMemoryList(raw.short,15,36);
    state.memory.long=uniqueMemoryList(raw.long,10,240);
    const permanentRaw=Array.isArray(raw.permanent)
      ? raw.permanent
      : (Array.isArray(raw.core)?raw.core:[]);
    state.memory.permanent=uniqueMemoryList(
      [...state.memory.permanent,...permanentRaw],
      9999,
      340
    );
    state.memory.initialized=true;
    state.memory.bootstrappedAt=Date.now();
    state.memory.sourceTurns=Math.max(0,Number(visibleTurns)||0);
    state.memory.lastUpdatedTurn=turn;
    return true;
  }

  if(!state.memory.initialized) return false;

  let changed=false;

  // Exactly one SHORT may be recorded per plot turn.
  if(turn>Number(state.memory.lastUpdatedTurn||0)){
    const candidate=Array.isArray(raw.short)
      ? cleanMemoryText(raw.short[0],36)
      : cleanMemoryText(raw.short,36);
    if(candidate){
      state.memory.short=[...state.memory.short,candidate].slice(-15);
      state.memory.lastUpdatedTurn=turn;
      changed=true;
    }
  }

  // The extension, not the model, owns the thresholds and clearing.
  const longSummary=cleanMemoryText(
    raw.longSummary || (Array.isArray(raw.long)?raw.long[0]:''),
    260
  );
  if(state.memory.short.length>=15 && longSummary){
    state.memory.long=[...state.memory.long,longSummary].slice(-10);
    state.memory.short=[];
    changed=true;
  }

  const permanentSummary=cleanMemoryText(
    raw.permanentSummary
      || (Array.isArray(raw.permanent)?raw.permanent[0]:'')
      || (Array.isArray(raw.core)?raw.core[0]:''),
    340
  );
  if(state.memory.long.length>=10 && permanentSummary){
    if(!state.memory.permanent.includes(permanentSummary)){
      state.memory.permanent.push(permanentSummary);
    }
    state.memory.long=[];
    changed=true;
  }

  return changed;
}

function extractJsonObject(raw){
  const text=String(raw||'').trim()
    .replace(/^\`\`\`(?:json)?\s*/i,'')
    .replace(/\s*\`\`\`$/,'');
  const start=text.indexOf('{');
  const end=text.lastIndexOf('}');
  if(start<0 || end<=start) return null;
  try{return JSON.parse(text.slice(start,end+1));}catch{return null;}
}

function extractVisibleStoryDay(raw=''){
  const text=String(raw||'').slice(0,6000);
  const matches=[...text.matchAll(/[【\[]\s*DAY\s*0*(\d{1,3})\s*[】\]]/gi)];
  if(!matches.length) return null;
  const days=matches
    .map(match=>Math.max(1,Number(match[1])||0))
    .filter(Boolean);
  return days.length?Math.max(...days):null;
}

function visibleStoryText(raw=''){
  return String(raw||'')
    .replace(/<!--MEME_OS_EVENT[\s\S]*?-->/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function parseSmallChineseNumber(token=''){
  const raw=String(token||'').trim();
  if(/^\d{1,2}$/.test(raw)) return Math.max(0,Number(raw)||0);
  const map={一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};
  if(Object.prototype.hasOwnProperty.call(map,raw)) return map[raw];
  const m=raw.match(/^十([一二三四五六七八九])$/);
  if(m) return 10+map[m[1]];
  const n=raw.match(/^([二三四五六七八九])十([一二三四五六七八九]?)$/);
  if(n) return map[n[1]]*10+(n[2]?map[n[2]]:0);
  return 0;
}

function relativeStoryDayJump(text=''){
  const source=String(text||'');
  if(/(?:^|[。！？!?；;，,\n\s])(次日|翌日|第二天(?:一早|清晨|早上|上午)?|隔天|又过了一夜|过了一夜|一夜过去|新的一天)(?:[，,。！？!?；;\s]|$)/u.test(source)) return 1;

  const dayJump=source.match(/(?:^|[。！？!?；;，,\n\s])([一二两三四五六七八九十\d]{1,3})\s*天(?:之)?后(?:[，,。！？!?；;\s]|$)/u);
  if(dayJump){
    const days=parseSmallChineseNumber(dayJump[1]);
    if(days>0) return days;
  }

  const weekJump=source.match(/(?:^|[。！？!?；;，,\n\s])([一二两三四五六七八九十\d]{1,3})\s*(?:周|星期)(?:之)?后(?:[，,。！？!?；;\s]|$)/u);
  if(weekJump){
    const weeks=parseSmallChineseNumber(weekJump[1]);
    if(weeks>0) return weeks*7;
  }
  return 0;
}

function currentNightCue(text=''){
  return /(今晚|今夜|当天晚上|傍晚|晚上|深夜|夜深|凌晨|半夜|准备睡|去睡|睡下|睡着|入睡|上床睡|熬到天亮)/u.test(String(text||''));
}

function morningCue(text=''){
  return /(晨光|晨曦|清晨|早晨|早上|上午|天亮|天色(?:已经)?亮|大亮|朝阳|日光|窗外[^。！？!?]{0,24}(?:亮|晨光|日光))/u.test(String(text||''));
}

function wakeCue(text=''){
  return /(醒来|睡醒|醒过来|睁开眼|睁眼|从睡梦中醒|被[^。！？!?]{0,24}(?:憋醒|吵醒|惊醒|叫醒|弄醒))/u.test(String(text||''));
}

function priorNightReferenceCue(text=''){
  return /(昨晚|昨天晚上|昨夜|夜里|后半夜|一整夜|整夜|睡了一夜)/u.test(String(text||''));
}

function reconstructStoryTimeline(chat=[]){
  const messages=Array.isArray(chat)?chat:[];
  let day=1;
  let dayStartIndex=0;
  let sawCurrentNight=false;
  let morningClusterActive=false;
  let previousText='';
  const boundaries=[];

  for(let i=0;i<messages.length;i++){
    const message=messages[i];
    if(!message) continue;
    const text=visibleStoryText(message.mes||'');
    if(!text) continue;

    const explicitDay=extractVisibleStoryDay(text);
    if(explicitDay && explicitDay>day){
      day=explicitDay;
      dayStartIndex=i;
      boundaries.push({index:i,day,kind:'visible-day'});
      sawCurrentNight=currentNightCue(text);
      morningClusterActive=morningCue(text);
      previousText=text;
      continue;
    }

    const jump=relativeStoryDayJump(text);
    if(jump>0){
      day+=jump;
      dayStartIndex=i;
      boundaries.push({index:i,day,kind:'explicit-transition',jump});
      sawCurrentNight=currentNightCue(text);
      morningClusterActive=morningCue(text);
      previousText=text;
      continue;
    }

    const morning=morningCue(text);
    const wake=wakeCue(text);
    const priorNight=priorNightReferenceCue(text);
    const previousWake=wakeCue(previousText);
    const previousMorning=morningCue(previousText);

    const selfContainedMorningBoundary=morning && wake && priorNight;
    const contextualMorningBoundary=
      sawCurrentNight &&
      (
        (morning && wake) ||
        (morning && priorNight) ||
        (morning && previousWake) ||
        (wake && previousMorning && priorNight)
      );
    const strongMorningBoundary=
      !morningClusterActive &&
      (selfContainedMorningBoundary || contextualMorningBoundary);

    if(strongMorningBoundary){
      day+=1;
      dayStartIndex=i;
      boundaries.push({
        index:i,
        day,
        kind:selfContainedMorningBoundary?'self-contained-morning':'night-to-morning',
      });
      sawCurrentNight=false;
      morningClusterActive=true;
    }

    // A real present-night/sleep cue arms the next morning and closes the
    // current morning cluster. Historical "昨晚 / 后半夜" references do not.
    if(currentNightCue(text)){
      sawCurrentNight=true;
      morningClusterActive=false;
    }else if(morning){
      morningClusterActive=true;
    }
    previousText=text;
  }

  return {
    day:Math.max(1,day),
    dayStartIndex:Math.max(0,dayStartIndex),
    boundaries,
    scannedMessages:messages.length,
  };
}

function syncStoryDayTo(state,targetDay,{source='timeline-scan',allowCorrection=true}={}){
  const target=Math.max(1,Number(targetDay)||1);
  state.tasks=state.tasks||{storyDay:1,active:{},generated:[],generatedDaily:[],dismissed:[],lastGeneratedDesireDay:0,lastGeneratedDailyTurn:0,completed:{},dailyCompleted:{},everCompleted:{}};
  const current=Math.max(1,Number(state.tasks.storyDay)||1);
  if(target===current) return false;
  if(target<current && !allowCorrection) return false;

  state.tasks.storyDay=target;

  for(const [taskId] of Object.entries(state.tasks.active||{})){
    const task=findTask(taskId,state);
    if(task?.category==='daily' || task?.repeatable==='daily') delete state.tasks.active[taskId];
  }
  state.tasks.generatedDaily=[];
  state.tasks.generated=(state.tasks.generated||[]).filter(task=>Boolean(state.tasks.active?.[task.id]));
  state.tasks.lastGeneratedDesireDay=0;
  state.tasks.lastGeneratedDailyTurn=0;
  state.tasks.plotTaskIssuedDay=target;
  state.tasks.plotTaskIssuedCount=0;
  state.tasks.lastPlotTaskTurn=-999;
  delete state.tasks.naturalDayBoundaryKeys;
  delete state.tasks.lastNaturalDayBoundaryTurn;

  state.history=Array.isArray(state.history)?state.history:[];
  const historyId=`meme_story_day_${target}_timeline`;
  if(!state.history.some(entry=>entry.id===historyId)){
    state.history.push({
      id:historyId,
      type:'story_day',
      recordType:'system',
      title:`DAY ${String(target).padStart(3,'0')} · 时间线已对齐`,
      summary:`按完整可见剧情重建自然日：DAY ${String(current).padStart(3,'0')} → DAY ${String(target).padStart(3,'0')}。日常候选同步刷新。`,
      text:`STORY DAY REBUILT: ${current} -> ${target} FROM ${String(source).toUpperCase()}`,
      committedAt:Date.now(),
    });
  }
  return true;
}

async function quietSyncMemory({force=false,bootstrapOnly=false}={}){
  if(memoryQuietSyncInFlight || !isBoundCharacter() || !hasActiveChat()) return false;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const generateQuietPrompt=context?.generateQuietPrompt;
  if(typeof generateQuietPrompt!=='function'){
    console.warn('[MÉMÉ OS] generateQuietPrompt unavailable; memory quiet sync skipped');
    return false;
  }

  const state=runtimeState();
  state.memory=state.memory||{
    initialized:false,bootstrappedAt:null,sourceTurns:0,
    short:[],long:[],permanent:[],lastUpdatedTurn:0,
  };
  state.memory.short=Array.isArray(state.memory.short)?state.memory.short:[];
  state.memory.long=Array.isArray(state.memory.long)?state.memory.long:[];
  state.memory.permanent=Array.isArray(state.memory.permanent)?state.memory.permanent:[];

  const turn=Math.max(0,Number(state.shop?.plotTurn)||0);
  const bootstrap=!state.memory.initialized;
  if(bootstrapOnly && !bootstrap) return false;

  const needShort=!bootstrap && Number(state.memory.lastUpdatedTurn||0)<turn;
  const shortCount=state.memory.short.length;
  const longCount=state.memory.long.length;
  const needShortCompression=!bootstrap && (shortCount>=15 || (needShort && shortCount===14));
  const prospectiveLongCount=longCount+(needShortCompression?1:0);
  const needLongCompression=!bootstrap && (longCount>=10 || prospectiveLongCount>=10);

  if(!bootstrap && !force && !needShort && !needShortCompression && !needLongCompression) return false;
  if(memoryQuietLastAttemptTurn===turn && !bootstrap && !force && !memoryNeedsCompression(state)) return false;

  memoryQuietSyncInFlight=true;
  memoryQuietLastAttemptTurn=turn;

  const chatCount=Array.isArray(context.chat)?context.chat.length:0;
  const prompt=bootstrap
    ? `你正在为持续角色扮演聊天建立第一次 MEMORY。请阅读当前能看到的完整聊天历史，并按“每一个 user+assistant 剧情回合对应一条短期记忆”的规则回填。

只输出纯 JSON，不要代码块或解释：
{"short":[],"long":[],"permanent":[]}

严格规则：
1. 每条 short 是一个完整剧情回合的摘要，约20-30个中文字符，最多36字。不要只挑“大事”；普通吃饭、洗澡、对话也照样按回合概括。
2. 从最早到最新按回合整理。每满15个完整回合，把那15条内容压成1条约180-220字的 long，不再把那15条保留在 short。
3. 最后不足15个回合的尾段，逐回合放进 short，最多14条。
4. 每满10条 long，再把那10条压成1条约220-320字的 permanent，并从 long 中移除。permanent 永久保留。
5. 不记录AP/SV/CHARM余额；系统结构化数值由扩展自己保存。
6. 不凭空编造人物、事件或关系。`
    : `你正在给 MÉMÉ OS 做本回合 MEMORY 同步。

当前 SHORT（${shortCount}/15）：
${JSON.stringify(state.memory.short)}
当前 LONG（${longCount}/10）：
${JSON.stringify(state.memory.long)}
永久记忆：
${JSON.stringify(state.memory.permanent)}

只输出纯 JSON，不要代码块或解释：
{"short":"","longSummary":"","permanentSummary":""}

严格执行：
1. needShort=${needShort}。若为 true，short 必须写且只能写1条，概括“最新一个 user+assistant 剧情回合”，约20-30个中文字符，最多36字。哪怕本回合只是普通日常也必须记。若为 false，short 留空。
2. needShortCompression=${needShortCompression}。若为 true，longSummary 必须把构成本批次的15条 SHORT 压成约180-220字的一条长期记忆。若本次同时需要新short，必须把刚生成的这条也算进15条里。若为 false，longSummary 留空。
3. needLongCompression=${needLongCompression}。若为 true，permanentSummary 必须把构成本批次的10条 LONG 压成约220-320字永久记忆；如果本次刚生成第10条 longSummary，也必须把它算进去。若为 false，permanentSummary 留空。
4. LONG/永久总结要保留人物关系、重要变化、持续后果和关键剧情，不要写成空泛感想。
5. 不写AP/SV/CHARM余额，不猜不存在的事实。`;

  try{
    const raw=await generateQuietPrompt({quietPrompt:prompt});
    const parsed=extractJsonObject(raw);
    if(!parsed) throw new Error('quiet memory response was not valid JSON');

    const latest=runtimeState();
    let changed=false;
    const memoryRaw=bootstrap
      ? {
          bootstrap:true,
          short:Array.isArray(parsed.short)?parsed.short:[],
          long:Array.isArray(parsed.long)?parsed.long:[],
          permanent:Array.isArray(parsed.permanent)?parsed.permanent:[],
        }
      : {
          bootstrap:false,
          short:parsed.short||'',
          longSummary:parsed.longSummary||'',
          permanentSummary:parsed.permanentSummary||'',
        };

    if(applyMemoryEvent(latest,memoryRaw,chatCount)) changed=true;

    // If a summary was malformed/missing, leave the full bucket intact and try
    // again on the next assistant event rather than deleting memories.
    if(changed){
      await saveState(latest);
      renderView(currentView(),false);
      installRuntimePrompt();
      console.info(`[MÉMÉ OS] memory ${bootstrap?'bootstrap':'rolling sync'} completed`);
    }
    return changed;
  }catch(error){
    console.warn('[MÉMÉ OS] quiet memory sync failed',error);
    return false;
  }finally{
    memoryQuietSyncInFlight=false;
  }
}


function lifestyleShelfDisposition(state=runtimeState()){
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  const turn=Math.max(0,Number(state.shop?.plotTurn)||0);
  const roll=hashId(`lifestyle|${day}|${turn}`) % 100;
  if(roll<40){
    return {
      id:'practical',
      roll,
      label:'正常',
      instruction:'优先回应真实需求，但仍保留系统哥自己的审美和嘴臭。',
    };
  }
  if(roll<75){
    return {
      id:'mischief',
      roll,
      label:'恶作剧',
      instruction:'可以故意不完全满足需求、塞入让宿主无语或尴尬的偏题商品；如果改货架，至少有一格体现他的坏心眼。',
    };
  }
  return {
    id:'corrupt',
    roll,
    label:'恶劣黄油化',
    instruction:'允许恶意曲解需求，把合理购物意图往更下流、更羞耻、更成人游戏化的方向偏转；如果改货架，至少两格应体现这种恶劣偏转。',
  };
}

function sanitizeSceneIssue(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const note=adminCopyText(raw.note,'',120);
  if(!note) return null;
  const axis=BODY_AXES.has(String(raw.axis||'')) ? String(raw.axis) : null;
  const source=adminCopyText(raw.source,'当前剧情',60);
  const severity=['low','medium','high'].includes(String(raw.severity||'')) ? String(raw.severity) : 'medium';
  const key=String(raw.id||raw.key||`issue_${hashId(axis+'|'+source+'|'+note)}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
  return {
    id:key,
    axis,
    source,
    note,
    severity,
    storyDay:Number(state.tasks?.storyDay)||1,
    plotTurn:Number(state.shop?.plotTurn)||0,
    recordedAt:Date.now(),
  };
}

function sanitizeSceneReaction(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const note=String(raw.note||'').trim().slice(0,120);
  if(!note) return null;
  const axis=BODY_AXES.has(String(raw.axis||'')) ? String(raw.axis) : null;
  const source=adminCopyText(raw.source,'剧情人物',60);
  const valence=['negative','neutral','positive','sexual'].includes(String(raw.valence||'')) ? String(raw.valence) : 'neutral';
  const key=String(raw.id||raw.key||`reaction_${hashId(axis+'|'+source+'|'+note)}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
  return {
    id:key,
    axis,
    source,
    valence,
    note,
    storyDay:Number(state.tasks?.storyDay)||1,
    plotTurn:Number(state.shop?.plotTurn)||0,
    recordedAt:Date.now(),
  };
}


function sanitizeMenUpdate(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object' || raw.qualifies===false) return null;
  const name=String(raw.name||'').trim().slice(0,40);
  if(!name) return null;
  const metaRaw=String(raw.meta||'NPC').trim().slice(0,60);
  const meta=/adult/i.test(metaRaw) ? metaRaw : `ADULT · ${metaRaw}`;
  const generatedId=`man_${hashId(name.toLowerCase()+'|'+meta.toLowerCase()).toString(36)}`;
  const id=String(raw.id||generatedId).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48) || generatedId;
  const badges=Array.isArray(raw.badges)
    ? raw.badges.map(x=>String(x).trim().slice(0,20)).filter(Boolean).slice(0,4)
    : [];
  return {
    id,
    name,
    meta,
    summary:adminCopyText(raw.summary,'',100),
    relation:adminCopyText(raw.relation,'未判定',60),
    desire:adminCopyText(raw.desire,'未记录',80),
    lastContact:adminCopyText(raw.lastContact,'',100),
    note:adminCopyText(raw.note,'',140),
    badges:badges.map(badge=>adminCopyText(badge,'',20)).filter(Boolean),
    present:raw.present!==false,
    contactDelta:Math.max(0,Math.min(5,Math.round(Number(raw.contactDelta)||0))),
    storyDay:Number(state.tasks?.storyDay)||1,
    plotTurn:Number(state.shop?.plotTurn)||0,
  };
}

function removeManFromVisibleBuckets(state,id){
  for(const key of ['current','recent','returning']){
    state.men[key]=(state.men[key]||[]).filter(person=>person.id!==id);
  }
}

function pushManToBucket(state,person,bucket){
  removeManFromVisibleBuckets(state,person.id);
  state.men[bucket]=[person,...(state.men[bucket]||[]).filter(old=>old.id!==person.id)];

  if(bucket==='current' && state.men.current.length>3){
    const overflow=state.men.current.splice(3);
    for(const old of overflow){
      const archived=state.men.archive?.[old.id]||old;
      archived.status='recent';
      state.men.archive[old.id]=archived;
      state.men.recent=[archived,...state.men.recent.filter(x=>x.id!==old.id)];
    }
  }

  if(bucket==='returning' && state.men.returning.length>5){
    const overflow=state.men.returning.splice(5);
    for(const old of overflow){
      const archived=state.men.archive?.[old.id]||old;
      archived.status='recent';
      state.men.archive[old.id]=archived;
      state.men.recent=[archived,...state.men.recent.filter(x=>x.id!==old.id)];
    }
  }

  state.men.recent=(state.men.recent||[]).slice(0,8);
}

function applyMenUpdate(raw,state=runtimeState()){
  const incoming=sanitizeMenUpdate(raw,state);
  if(!incoming) return null;
  state.men=state.men||{current:[],recent:[],returning:[],archive:{}};
  state.men.archive=state.men.archive||{};
  const existing=state.men.archive[incoming.id]||null;
  const previousStatus=existing?.status||null;
  const wasKnown=Boolean(existing);
  const returningNow=incoming.present && wasKnown && (previousStatus==='recent' || previousStatus==='returning');
  const status=!incoming.present ? 'recent' : returningNow ? 'returning' : 'current';
  const contactCount=Math.max(0,Number(existing?.contactCount)||0)+incoming.contactDelta;
  const returnCount=Math.max(0,Number(existing?.returnCount)||0)+(returningNow && previousStatus!=='returning' ? 1 : 0);

  const person={
    ...existing,
    ...incoming,
    summary:incoming.summary || existing?.summary || '档案待补充',
    relation:incoming.relation || existing?.relation || '未判定',
    desire:incoming.desire || existing?.desire || '未记录',
    lastContact:incoming.lastContact || existing?.lastContact || '暂无',
    note:incoming.note || existing?.note || '',
    badges:incoming.badges.length ? incoming.badges : (existing?.badges||[]),
    status,
    contactCount,
    returnCount,
    firstSeenAt:existing?.firstSeenAt||Date.now(),
    firstSeenDay:existing?.firstSeenDay||incoming.storyDay,
    firstSeenTurn:Number.isFinite(Number(existing?.firstSeenTurn)) ? Number(existing.firstSeenTurn) : incoming.plotTurn,
    lastSeenAt:Date.now(),
    lastSeenDay:incoming.storyDay,
    lastSeenTurn:incoming.plotTurn,
  };

  state.men.archive[person.id]=person;
  pushManToBucket(state,person,status);
  if(returningNow && previousStatus!=='returning'){
    state.permission.milestones.returningMen=Math.max(0,Number(state.permission.milestones.returningMen)||0)+1;
  }
  return person;
}

function decayMenBuckets(state,touchedIds=new Set()){
  state.men=state.men||{current:[],recent:[],returning:[],archive:{}};
  state.men.archive=state.men.archive||{};
  const turn=Number(state.shop?.plotTurn)||0;
  let changed=false;
  for(const bucket of ['current','returning']){
    for(const person of [...(state.men[bucket]||[])]){
      if(touchedIds.has(person.id)) continue;
      const archived=state.men.archive[person.id]||person;
      const lastTurn=Number(archived.lastSeenTurn)||0;
      if(turn-lastTurn<2) continue;
      archived.status='recent';
      state.men.archive[person.id]=archived;
      pushManToBucket(state,archived,'recent');
      changed=true;
    }
  }
  return changed;
}


const BOND_INVESTMENT_TAGS = new Set([
  'personal_priority','protective_choice','trust','vulnerability',
  'sacrifice','habit_broken_for_host','private_disclosure','future_choice',
]);

const BOND_LOVE_TAGS = new Set([
  'sacrifice','personal_priority','vulnerability','future_choice','identity_choice',
]);

function extractVisibleTaskCompletions(raw=''){
  const text=String(raw||'');
  const completions=[];
  const re=/[【\[]\s*TASK\s*[｜|]\s*([^｜|\]】\n]{1,60})\s*[】\]]\s*[-—–_=~·•\s]*(划掉|已完成|完成|结算|DONE)/giu;
  for(const match of text.matchAll(re)){
    const title=String(match[1]||'').replace(/\s+/g,' ').trim().slice(0,60);
    const marker=String(match[2]||'').trim();
    if(title) completions.push({title,marker,index:Number(match.index)||0});
  }
  return completions;
}

function currentTaskCandidates(state=runtimeState()){
  const currentDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const activeIds=new Set(Object.keys(state.tasks?.active||{}));
  const items=[
    ...(state.tasks?.generatedDaily||[])
      .filter(task=>Number(task.createdDay||currentDay)===currentDay || activeIds.has(task.id))
      .map(task=>({...task,category:'daily',dynamicDailyTask:true})),
    ...(state.tasks?.generated||[]).map(task=>({...task,category:'desire',dynamicTask:true})),
    ...currentStaticTaskPool('daily',state).map(task=>({...task,category:'daily'})),
    ...currentStaticTaskPool('desire',state).map(task=>({...task,category:'desire'})),
    ...currentStaticTaskPool('special',state).map(task=>({...task,category:'special'})),
  ];
  for(const id of activeIds){
    const task=findTask(id,state);
    if(task) items.unshift(task);
  }
  const seen=new Set();
  return items.filter(task=>{
    if(!task?.id || seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}

function findCurrentTaskByVisibleTitle(title,state=runtimeState()){
  const needle=normalizedTaskTitle(title);
  if(!needle) return null;
  const candidates=currentTaskCandidates(state);

  const exact=candidates.find(task=>normalizedTaskTitle(task.title)===needle);
  if(exact) return exact;

  const partial=candidates
    .filter(task=>{
      const candidate=normalizedTaskTitle(task.title);
      return candidate && (candidate.includes(needle) || needle.includes(candidate));
    })
    .sort((a,b)=>Math.abs(normalizedTaskTitle(a.title).length-needle.length)-Math.abs(normalizedTaskTitle(b.title).length-needle.length));
  if(partial.length===1) return partial[0];

  const titleTags=new Set(extractDailyActionTags(title));
  if(titleTags.size){
    const tagged=candidates.filter(task=>{
      const tags=taskActionTags(task);
      return tags.length && [...titleTags].every(tag=>tags.includes(tag));
    });
    if(tagged.length===1) return tagged[0];
  }
  return null;
}

function settleVisibleTaskCompletion(state,completion,messageId){
  const task=findCurrentTaskByVisibleTitle(completion?.title,state);
  if(!task) return false;

  const id=String(task.id||'').trim();
  if(!id) return false;

  const currentDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const repeatable=task.repeatable==='daily';
  const isRollingDaily=task.category==='daily';
  const dailyLike=isRollingDaily || repeatable;

  if(dailyLike && Number(state.tasks?.dailyCompleted?.[id]?.day||0)===currentDay) return false;
  if(!dailyLike && state.tasks?.completed?.[id]) return false;

  const historyId=`meme_visible_task_complete_${currentDay}_${messageId}_${id}`;
  if((state.history||[]).some(entry=>entry.id===historyId)) return false;

  const reward=taskReward(task,state);
  const wasEverCompleted=Boolean(state.tasks?.everCompleted?.[id]);
  const active=state.tasks?.active?.[id];
  const title=active?.title || task.title || completion.title;
  const evidence=`正文明确标记「${completion.title}」${completion.marker||'完成'}。`;

  state.resources.ap=Math.max(0,Number(state.resources.ap||0)+Math.max(0,Number(reward.ap)||0));
  state.resources.sv=Math.max(0,Number(state.resources.sv||0)+Math.max(0,Number(reward.sv)||0));
  if(state.tasks?.active?.[id]) delete state.tasks.active[id];

  if(dailyLike){
    const previous=state.tasks.dailyCompleted?.[id]||{};
    state.tasks.dailyCompleted[id]={
      id,
      title,
      category:task.category,
      day:currentDay,
      count:Math.max(0,Number(previous.count)||0)+1,
      evidence,
      completedAt:Date.now(),
      completedTurn:Number(state.shop?.plotTurn)||0,
      actionTags:task.category==='daily'?taskActionTags(task):[],
    };
  }else{
    state.tasks.completed[id]={
      id,
      title,
      category:task.category,
      evidence,
      completedAt:Date.now(),
    };
  }

  state.tasks.everCompleted[id]={
    id,
    title,
    category:task.category,
    actionTags:task.category==='daily' ? taskActionTags(task) : (state.tasks.everCompleted?.[id]?.actionTags||[]),
    firstCompletedAt:state.tasks.everCompleted?.[id]?.firstCompletedAt||Date.now(),
  };

  if(task.dynamicDailyTask){
    state.tasks.generatedDaily=(state.tasks.generatedDaily||[]).filter(item=>item.id!==id);
  }
  if(task.dynamicTask){
    state.tasks.generated=(state.tasks.generated||[]).filter(item=>item.id!==id);
  }

  state.permission.milestones.taskSettlements=Math.max(0,Number(state.permission.milestones.taskSettlements)||0)+1;
  if(!wasEverCompleted){
    state.permission.milestones.completedTasks=Math.max(0,Number(state.permission.milestones.completedTasks)||0)+1;
  }

  const rewardText=[
    reward.ap>0?`AP +${reward.ap}`:'',
    reward.sv>0?`SV +${reward.sv}`:'',
  ].filter(Boolean).join(' / ') || '无资源奖励';

  state.history.push({
    id:historyId,
    type:'task_complete_visible',
    recordType:'task',
    title:`正文验收完成：${title}`,
    summary:`正文已经把这项任务划掉；扩展同步结算 ${rewardText}，并从 DAY ${String(currentDay).padStart(3,'0')} 任务板退场。`,
    text:`VISIBLE TASK COMPLETED: ${id}`,
    committedAt:Date.now(),
  });
  if(state.history.length>240) state.history=state.history.slice(-240);
  return true;
}

function settleVisibleTaskCompletionsFromMessage(state,raw,messageId){
  let changed=false;
  for(const completion of extractVisibleTaskCompletions(raw)){
    if(settleVisibleTaskCompletion(state,completion,messageId)) changed=true;
  }
  return changed;
}

function settleTaskFromModel(state,rawTask,messageId){
  if(!rawTask || typeof rawTask!=='object') return false;
  const id=String(rawTask.id||'').trim();
  const status=String(rawTask.status||'').toLowerCase();
  if(!id || status!=='completed') return false;

  const task=findTask(id);
  const active=state.tasks?.active?.[id];
  if(!task || !active) return false;

  const currentDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const repeatable=task.repeatable==='daily';
  const isRollingDaily=task.category==='daily';
  const dailyLike=isRollingDaily || repeatable;
  if(repeatable && Number(active.storyDay||0)!==currentDay) return false;
  if(repeatable && Number(state.tasks?.dailyCompleted?.[id]?.day||0)===currentDay) return false;
  if(isRollingDaily && Number(state.tasks?.dailyCompleted?.[id]?.day||0)===currentDay) return false;
  if(!dailyLike && state.tasks?.completed?.[id]) return false;

  const evidence=String(rawTask.evidence||'').replace(/\s+/g,' ').trim().slice(0,180);
  if(!evidence) return false;

  const historyId=`meme_task_verified_${messageId}_${id}`;
  if((state.history||[]).some(entry=>entry.id===historyId)) return false;

  const wasEverCompleted=Boolean(state.tasks?.everCompleted?.[id]);
  const reward=taskReward(task,state);
  const title=active.title || taskVoiceName(task,state);

  state.resources.ap=Math.max(0,Number(state.resources.ap||0)+reward.ap);
  state.resources.sv=Math.max(0,Number(state.resources.sv||0)+reward.sv);
  delete state.tasks.active[id];

  if(dailyLike){
    const previous=state.tasks.dailyCompleted?.[id]||{};
    state.tasks.dailyCompleted[id]={
      id,
      title,
      category:task.category,
      day:currentDay,
      count:Math.max(0,Number(previous.count)||0)+1,
      evidence,
      completedAt:Date.now(),
      completedTurn:Number(state.shop?.plotTurn)||0,
      actionTags:task.category==='daily'?taskActionTags(task):[],
    };
  }

  if(task.category!=='daily' && !wasEverCompleted){
    state.tasks.completed[id]={
      id,
      title,
      category:task.category,
      evidence,
      completedAt:Date.now(),
    };
  }

  state.tasks.everCompleted[id]={
    id,
    title,
    category:task.category,
    actionTags:task.category==='daily' ? taskActionTags(task) : (state.tasks.everCompleted?.[id]?.actionTags||[]),
    firstCompletedAt:state.tasks.everCompleted?.[id]?.firstCompletedAt||Date.now(),
  };

  if(task.dynamicDailyTask){
    state.tasks.generatedDaily=(state.tasks.generatedDaily||[]).filter(task=>task.id!==id);
  }
  if(task.dynamicTask){
    state.tasks.generated=(state.tasks.generated||[]).filter(task=>task.id!==id);
  }

  state.permission.milestones.taskSettlements=Math.max(0,Number(state.permission.milestones.taskSettlements)||0)+1;
  if(!wasEverCompleted) state.permission.milestones.completedTasks+=1;

  const rewardText=[
    reward.ap>0 ? `AP +${reward.ap}` : '',
    reward.sv>0 ? `SV +${reward.sv}` : '',
  ].filter(Boolean).join(' / ') || '无资源奖励';

  state.history.push({
    id:historyId,
    type:'task_complete',
    recordType:'task',
    title:`${wasEverCompleted && repeatable?'又给你结了一次':'这次算你做完'}：${title}`,
    summary:`我验过了。「${title}」算完成；${rewardText}。你干了什么我记着：${evidence}`,
    text:`TASK VERIFIED AND SETTLED: ${id}`,
    committedAt:Date.now(),
  });
  if(state.history.length>240) state.history=state.history.slice(-240);
  return true;
}

function settleStoryRewardFromModel(state,rawReward,messageId){
  if(!rawReward || typeof rawReward!=='object') return false;

  // Retroactive story rewards share the exact same "system favor" budget as
  // published plot [TASK] cards. They are not a second AP faucet.
  const freq=plotTaskFrequency(state);
  if(!freq.canIssue) return false;
  const title=String(rawReward.title||'').replace(/\s+/g,' ').trim().slice(0,48);
  const evidence=String(rawReward.evidence||'').replace(/\s+/g,' ').trim().slice(0,180);
  if(!title || !evidence) return false;

  const difficulty=['light','normal','hard'].includes(String(rawReward.difficulty||'').toLowerCase())
    ? String(rawReward.difficulty).toLowerCase()
    : 'normal';
  const reward=dynamicDailyRewardMeta(difficulty,state);
  const source=String(rawReward.source||'当前剧情').replace(/\s+/g,' ').trim().slice(0,80);
  const id=`story_${hashId((title+'|'+evidence+'|'+source).toLowerCase()).toString(36)}`;
  const historyId=`meme_story_reward_${messageId}_${id}`;
  if((state.history||[]).some(entry=>entry.id===historyId) || state.tasks?.everCompleted?.[id]) return false;

  state.tasks=state.tasks||{storyDay:1,active:{},generated:[],generatedDaily:[],lastGeneratedDesireDay:0,lastGeneratedDailyTurn:0,completed:{},dailyCompleted:{},everCompleted:{}};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  const task={
    id,
    type:'DAILY',
    category:'daily',
    dynamicDailyTask:true,
    difficulty,
    title,
    desc:evidence,
    detail:'剧情中临时触发并当场完成的一次性任务。',
    reward:`AP +${reward.ap}`,
    state:'已完成',
    locked:false,
    createdDay:Number(state.tasks.storyDay)||1,
    createdTurn:Number(state.shop?.plotTurn)||0,
    source,
  };
  state.tasks.generatedDaily=[task,...state.tasks.generatedDaily.filter(old=>old.id!==id)].slice(0,8);
  state.resources.ap=Math.max(0,Number(state.resources.ap||0)+reward.ap);
  state.tasks.dailyCompleted[id]={
    id,
    title,
    category:'daily',
    day:Number(state.tasks.storyDay)||1,
    count:1,
    evidence,
    completedAt:Date.now(),
    completedTurn:Number(state.shop?.plotTurn)||0,
  };
  state.tasks.everCompleted[id]={id,title,category:'daily',actionTags:taskActionTags(task),firstCompletedAt:Date.now()};
  state.permission.milestones.taskSettlements=Math.max(0,Number(state.permission.milestones.taskSettlements)||0)+1;
  state.permission.milestones.completedTasks=Math.max(0,Number(state.permission.milestones.completedTasks)||0)+1;
  markPlotTaskIssued(state);
  state.history.push({
    id:historyId,
    type:'story_task_complete',
    recordType:'task',
    title:`这次算你捡到了：${title}`,
    summary:`我看过了，这个临时任务算你做成。AP +${reward.ap}。别装傻，依据是：${evidence}`,
    text:`STORY TASK VERIFIED AND SETTLED: ${id}`,
    committedAt:Date.now(),
  });
  if(state.history.length>240) state.history=state.history.slice(-240);
  return true;
}

function normalizeBondReason(value){
  return String(value||'').replace(/\s+/g,' ').trim().slice(0,180);
}

function normalizeBondTag(value){
  return String(value||'').toLowerCase().trim().replace(/[^a-z0-9_-]/g,'').slice(0,40);
}

function bondMoments(state,kind=null){
  const list=Array.isArray(state.permission?.adminBond?.moments)?state.permission.adminBond.moments:[];
  return kind ? list.filter(item=>item.kind===kind) : list;
}

function bondDistinctDays(state,kinds=null){
  const allow=Array.isArray(kinds)?new Set(kinds):null;
  const days=new Set(
    bondMoments(state)
      .filter(item=>!allow || allow.has(item.kind))
      .map(item=>Number(item.storyDay)||1)
  );
  return days.size;
}

function lastBondDay(state,kind){
  const list=bondMoments(state,kind);
  return list.length ? Math.max(...list.map(item=>Number(item.storyDay)||1)) : 0;
}

function canAcceptBondSignal(state,signal,tag=''){
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  const interest=Number(state.permission?.adminInterestSignals)||0;
  const desire=Number(state.permission?.adminDesireSignals)||0;
  const attachment=Number(state.permission?.adminAttachmentSignals)||0;

  if(['impressed','curious','respect','amused','annoyed-but-invested'].includes(signal)){
    if(lastBondDay(state,'interest')===day) return {ok:false,reason:'interest already changed today'};
    return {ok:true};
  }

  if(signal==='desire'){
    if(Number(state.host?.charm||0)<70) return {ok:false,reason:'beauty threshold not met'};
    if(interest<5 || bondDistinctDays(state,['interest'])<4) return {ok:false,reason:'not enough long-term personal interest'};
    if(lastBondDay(state,'desire')===day) return {ok:false,reason:'desire already changed today'};
    return {ok:true};
  }

  if(signal==='attachment'){
    if(desire<3 || bondDistinctDays(state,['desire'])<3) return {ok:false,reason:'desire history too shallow'};
    if(interest<7) return {ok:false,reason:'personal interest too shallow'};
    if(!BOND_INVESTMENT_TAGS.has(tag)) return {ok:false,reason:'attachment needs a real investment-type event'};
    const last=lastBondDay(state,'attachment');
    if(last && day-last<2) return {ok:false,reason:'attachment progression cooldown'};
    return {ok:true};
  }

  return {ok:false,reason:'unsupported signal'};
}

function canAdminLove(state,loveTag=''){
  const moments=bondMoments(state);
  const attachmentMoments=bondMoments(state,'attachment');
  const attachmentTags=new Set(attachmentMoments.map(item=>item.tag).filter(Boolean));
  const interest=Number(state.permission?.adminInterestSignals)||0;
  const desire=Number(state.permission?.adminDesireSignals)||0;
  const attachment=Number(state.permission?.adminAttachmentSignals)||0;

  if(Number(state.host?.charm||0)<70) return {ok:false,reason:'beauty threshold not met'};
  if(interest<8) return {ok:false,reason:'interest too shallow'};
  if(desire<4) return {ok:false,reason:'desire history too shallow'};
  if(attachment<5) return {ok:false,reason:'attachment too shallow'};
  if(bondDistinctDays(state)<10) return {ok:false,reason:'not enough distinct story days'};
  if(bondDistinctDays(state,['attachment'])<5) return {ok:false,reason:'attachment did not mature across enough days'};
  if(moments.length<17) return {ok:false,reason:'relationship history too short'};
  if(attachmentTags.size<3) return {ok:false,reason:'attachment lacks varied forms of investment'};
  if(!BOND_LOVE_TAGS.has(loveTag)) return {ok:false,reason:'love needs a major personal-choice event'};
  return {ok:true};
}

function recordAdminBondMoment(state,{kind,signal,reason,tag,messageId}){
  const cleaned=normalizeBondReason(reason);
  const cleanTag=normalizeBondTag(tag);
  if(!cleaned) return false;
  state.permission.adminBond=state.permission.adminBond||{moments:[],firstInterestAt:null,firstDesireAt:null,firstAttachmentAt:null,loveAt:null};
  state.permission.adminBond.moments=Array.isArray(state.permission.adminBond.moments)?state.permission.adminBond.moments:[];
  const fingerprint=`${kind}|${signal||kind}|${cleanTag}|${cleaned.toLowerCase()}`;
  const id=`bond_${messageId}_${hashId(fingerprint).toString(36)}`;
  if(state.permission.adminBond.moments.some(item=>item.id===id)) return false;
  if(state.permission.adminBond.moments.some(item=>
    item.kind===kind &&
    String(item.signal||item.kind)===String(signal||kind) &&
    String(item.reason||'').toLowerCase()===cleaned.toLowerCase()
  )) return false;
  const now=Date.now();
  const moment={
    id,
    kind,
    signal:signal||kind,
    tag:cleanTag||null,
    reason:cleaned,
    storyDay:Number(state.tasks?.storyDay)||1,
    plotTurn:Number(state.shop?.plotTurn)||0,
    createdAt:now,
  };
  state.permission.adminBond.moments=[...state.permission.adminBond.moments,moment].slice(-32);
  if(kind==='interest' && !state.permission.adminBond.firstInterestAt) state.permission.adminBond.firstInterestAt=now;
  if(kind==='desire' && !state.permission.adminBond.firstDesireAt) state.permission.adminBond.firstDesireAt=now;
  if(kind==='attachment' && !state.permission.adminBond.firstAttachmentAt) state.permission.adminBond.firstAttachmentAt=now;
  if(kind==='love' && !state.permission.adminBond.loveAt) state.permission.adminBond.loveAt=now;
  return true;
}


function messageDateKey(message){
  const raw=message?.send_date;
  if(raw===undefined || raw===null || raw==='') return '';
  if(typeof raw==='string' || typeof raw==='number') return String(raw);
  try{return JSON.stringify(raw);}catch{return String(raw);}
}

function assistantTurnKey(context,messageId,message){
  const chat=Array.isArray(context?.chat)?context.chat:[];
  if(Number.isInteger(messageId)){
    for(let i=messageId-1;i>=0;i--){
      const prior=chat[i];
      if(!prior?.is_user) continue;
      const date=messageDateKey(prior);
      if(date) return `turn_u_${hashId(date).toString(36)}`;
      const text=String(prior.mes||'');
      return `turn_u_${hashId(`${i}|${text}`).toString(36)}`;
    }
  }

  const firstSwipe=Array.isArray(message?.swipes) && message.swipes.length
    ? String(message.swipes[0]||'')
    : String(message?.mes||'');
  const firstInfo=Array.isArray(message?.swipe_info) && message.swipe_info.length
    ? message.swipe_info[0]
    : null;
  const rootDate=messageDateKey(firstInfo)||messageDateKey(message);
  return `turn_a_${hashId(`${rootDate}|${firstSwipe}|${String(message?.name||'')}`).toString(36)}`;
}

function runtimeMessageAlreadyProcessed(state,messageId,messageKey){
  const list=Array.isArray(state.runtime?.processedAssistantMessages)
    ? state.runtime.processedAssistantMessages
    : [];
  return list.includes(messageKey) || (Number.isInteger(messageId) && list.includes(messageId));
}

function migrateLegacyRuntimeMessageKey(state,messageId,messageKey){
  if(!Number.isInteger(messageId) || !messageKey) return false;
  state.runtime=state.runtime||{processedAssistantMessages:[]};
  const list=Array.isArray(state.runtime.processedAssistantMessages)
    ? state.runtime.processedAssistantMessages
    : [];
  if(!list.includes(messageId) || list.includes(messageKey)) return false;
  state.runtime.processedAssistantMessages=[
    ...list.filter(id=>id!==messageId),
    messageKey,
  ].slice(-4000);
  return true;
}

function markRuntimeMessageProcessed(state,messageKey){
  if(!messageKey) return;
  state.runtime=state.runtime||{processedAssistantMessages:[]};
  const list=Array.isArray(state.runtime.processedAssistantMessages)
    ? state.runtime.processedAssistantMessages
    : [];
  state.runtime.processedAssistantMessages=[
    ...list.filter(id=>id!==messageKey),
    messageKey,
  ].slice(-4000);
}

const TURN_SNAPSHOT_KEYS=[
  'resources','host','system','permission','shop','inventory','memory','reactivity','encounters','upgrades','tasks','men','history',
];

function cloneTurnValue(value){
  if(typeof structuredClone==='function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function captureTurnBase(state){
  const base={};
  for(const key of TURN_SNAPSHOT_KEYS) base[key]=cloneTurnValue(state[key]);
  return base;
}

function restoreTurnBase(state,base){
  if(!base || typeof base!=='object') return false;
  for(const key of TURN_SNAPSHOT_KEYS){
    if(Object.prototype.hasOwnProperty.call(base,key)) state[key]=cloneTurnValue(base[key]);
  }
  return true;
}

function assistantVariantKey(message){
  const swipeId=Number.isInteger(message?.swipe_id) ? message.swipe_id : -1;
  const info=swipeId>=0 && Array.isArray(message?.swipe_info) ? message.swipe_info[swipeId] : null;
  const stamp=messageDateKey(info)||messageDateKey(message);
  const text=String(message?.mes||'');
  return `variant_${swipeId}_${hashId(`${stamp}|${text}`).toString(36)}`;
}

function resolveAssistantMessageId(ref){
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const chat=Array.isArray(context.chat)?context.chat:[];
  if(Number.isInteger(ref) && chat[ref] && !chat[ref].is_user) return ref;
  if(ref && typeof ref==='object'){
    for(const key of ['message_id','messageId','id','mesId']){
      const value=Number(ref[key]);
      if(Number.isInteger(value) && chat[value] && !chat[value].is_user) return value;
    }
  }
  for(let i=chat.length-1;i>=0;i--){
    if(chat[i] && !chat[i].is_user) return i;
  }
  return null;
}



function removeFallbackTasksCompetingWithFormalCard(state,formalTask){
  if(!formalTask) return false;
  state.tasks=state.tasks||{};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  const formalTags=new Set(taskActionTags(formalTask));
  let changed=false;
  state.tasks.generatedDaily=state.tasks.generatedDaily.filter(task=>{
    if(task.id===formalTask.id) return true;
    if(state.tasks?.active?.[task.id]) return true;
    const source=String(task.source||'');
    const lowConfidence=/可见剧情任务卡兜底|当前可见剧情直接触发/.test(source);
    if(!lowConfidence) return true;

    const tags=taskActionTags(task);
    const overlaps=tags.length && tags.some(tag=>formalTags.has(tag));
    const generic=/先把自己收拾干净|现在先把头洗了|先把头洗了|收拾干净/.test(String(task.title||''));
    if(overlaps || generic){
      changed=true;
      return false;
    }
    return true;
  });
  return changed;
}

function purgeKnownLegacyWrongGeneratedTasks(state=runtimeState()){
  state.tasks=state.tasks||{};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  const badTitle=/(先把自己收拾干净|现在先把头洗了|先把头洗了)/;
  let changed=false;
  state.tasks.generatedDaily=state.tasks.generatedDaily.filter(task=>{
    if(badTitle.test(String(task.title||''))){
      if(state.tasks?.active?.[task.id]) delete state.tasks.active[task.id];
      changed=true;
      return false;
    }
    // All pre-canonical dialogue/fallback guesses are retired once 0.10.16 loads.
    const source=String(task.source||'');
    if(/可见剧情任务卡兜底|当前可见剧情直接触发/.test(source)){
      if(state.tasks?.active?.[task.id]) delete state.tasks.active[task.id];
      changed=true;
      return false;
    }
    return true;
  });
  return changed;
}

function removeGeneratedTaskByTitle(state,title){
  const needle=String(title||'').trim();
  if(!needle) return null;
  state.tasks=state.tasks||{};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  state.tasks.generated=Array.isArray(state.tasks.generated)?state.tasks.generated:[];
  let removed=null;

  for(const key of ['generatedDaily','generated']){
    state.tasks[key]=state.tasks[key].filter(task=>{
      const taskTitle=String(task.title||'').trim();
      const match=taskTitle===needle || taskTitle.includes(needle) || needle.includes(taskTitle);
      if(match && !removed){
        removed=task;
        return false;
      }
      return true;
    });
    if(removed) break;
  }

  if(removed){
    if(state.tasks?.active?.[removed.id]) delete state.tasks.active[removed.id];
    rememberDismissedTask(state,removed);
  }
  return removed;
}

function removeLatestGeneratedTask(state){
  state.tasks=state.tasks||{};
  const list=[
    ...(Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[]),
    ...(Array.isArray(state.tasks.generated)?state.tasks.generated:[]),
  ];
  if(!list.length) return null;
  const sorted=[...list].sort((a,b)=>
    Number(b.createdTurn||0)-Number(a.createdTurn||0) ||
    Number(b.createdDay||0)-Number(a.createdDay||0)
  );
  return removeGeneratedTaskByTitle(state,sorted[0].title);
}

function parseOsTaskCorrections(text=''){
  const source=String(text||'');
  const directives=[];
  const re=/[（(]\s*(?:MÉMÉ\s*OS|MEME\s*OS|OS)\s*[：:]\s*([^）)]+)[）)]/gi;
  for(const match of source.matchAll(re)){
    const body=String(match[1]||'').trim();
    if(!body) continue;
    if(!/(删|删除|删掉|移除|不该出现|不应该出现|撤掉|去掉)/.test(body)) continue;
    const quoted=body.match(/[“"「『]([^”"」』]{1,48})[”"」』]/)?.[1]
      || body.match(/(?:删掉|删除|移除|去掉)\s*([^，。；;]{2,48})/)?.[1]?.trim();
    directives.push({
      type:'remove_task',
      title:quoted||null,
      latest:/这个任务|刚才(?:那个)?任务|上一(?:个|条)?任务|不该出现这个|不应该出现这个/.test(body),
      raw:body,
    });
  }
  return directives;
}

async function applyOsTaskCorrectionsFromUserMessage(text=''){
  const directives=parseOsTaskCorrections(text);
  if(!directives.length) return [];
  const state=runtimeState();
  state.tasks=state.tasks||{storyDay:1,active:{},generated:[],generatedDaily:[],lastGeneratedDesireDay:0,lastGeneratedDailyTurn:0,completed:{},dailyCompleted:{},everCompleted:{}};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  const results=[];

  for(const directive of directives){
    let removed=null;
    if(directive.title) removed=removeGeneratedTaskByTitle(state,directive.title);
    if(!removed && directive.latest) removed=removeLatestGeneratedTask(state);
    if(!removed && !directive.title) removed=removeLatestGeneratedTask(state);
    if(!removed) continue;

    state.history.push({
      id:`meme_user_task_correction_${Date.now()}_${removed.id}`,
      type:'user_task_correction',
      recordType:'task',
      title:`行，给你删了：「${removed.title}」`,
      summary:`你说这任务不该出现，我就从 TASK 里撤掉。当天别指望它换个名字又冒回来。`,
      text:`USER TASK CORRECTION REMOVE: ${removed.id}`,
      committedAt:Date.now(),
    });
    results.push(removed);
  }

  if(results.length){
    if(state.history.length>240) state.history=state.history.slice(-240);
    await saveState(state);
    renderView(currentView(),false);
    installRuntimePrompt();
  }
  return results;
}

function extractLegacyDailyCardsForMigration(raw=''){
  const text=String(raw||'');
  const cards=[];
  const re=/【\s*(?:DAILY|日常)\s*[·•・⋅∙:：|｜-]\s*([^】\n]{2,48})】/gi;
  const matches=[...text.matchAll(re)];
  for(let i=0;i<matches.length;i++){
    const match=matches[i];
    const title=String(match[1]||'').replace(/\s+/g,' ').trim().slice(0,48);
    const start=Number(match.index||0)+String(match[0]||'').length;
    const next=i+1<matches.length?Number(matches[i+1].index||text.length):text.length;
    const lines=text.slice(start,next).split(/\r?\n/);
    const req=[];
    for(const rawLine of lines){
      const line=String(rawLine||'').trim();
      if(!line){
        if(req.length) break;
        continue;
      }
      if(/^【/.test(line) || /^\[TASK/i.test(line)) break;
      if(req.length && /^(?:你|他|男人|管理员|系统).{0,12}(?:说|看|盯|笑|冷笑|声音|视线|问|答|开口|僵|愣|咬|攥)/u.test(line)) break;
      req.push(line);
      if(req.join(' ').length>=220) break;
    }
    const desc=req.join(' ').replace(/\s+/g,' ').trim().slice(0,180);
    if(title && desc) cards.push({title,desc});
  }
  return cards;
}

function taskFromLegacyDailyCard(card,state=runtimeState()){
  if(!card) return null;
  const actionCount=(String(card.desc||'').match(/[，,、；;]/g)||[]).length+1;
  const hardCue=/(二十分钟|半小时|一小时|坚持|运动|出门|公共|社交|当众|长时间|彻底|完整完成|连续)/.test(card.desc||'');
  const lightCue=actionCount<=1 && /(扔|擦|关|拿|喝|换一件|刷牙|洗脸|吹干)/.test(card.desc||'');
  const difficulty=hardCue?'hard':lightCue?'light':'normal';
  const task=sanitizeGeneratedDailyTask({
    title:card.title,
    desc:card.desc,
    detail:'旧式 DAILY 可见任务卡一次性迁移；后续新任务只认 [TASK]。',
    source:'迁移：旧式DAILY卡',
    difficulty,
  },state);
  if(task) task.legacyMigrated=true;
  return task;
}

async function reconcileRecentVisibleTaskOffers(){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const chat=Array.isArray(context.chat)?context.chat:[];
  const state=runtimeState();
  state.tasks=state.tasks||{storyDay:1,active:{},generated:[],generatedDaily:[],lastGeneratedDesireDay:0,lastGeneratedDailyTurn:0,completed:{},dailyCompleted:{},everCompleted:{}};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];

  let changed=pruneRedundantGeneratedDaily(state);
  if(purgeKnownLegacyWrongGeneratedTasks(state)) changed=true;

  const timeline=reconstructStoryTimeline(chat);
  if(syncStoryDayTo(state,timeline.day,{source:'full-chat-reconcile',allowCorrection:true})) changed=true;

  state.tasks.timelineAudit={
    storyDay:timeline.day,
    dayStartIndex:timeline.dayStartIndex,
    boundaries:timeline.boundaries.slice(-16),
    scannedMessages:timeline.scannedMessages,
    updatedAt:Date.now(),
  };

  state.tasks.generatedDaily=(state.tasks.generatedDaily||[])
    .filter(task=>Number(task.createdDay||timeline.day)===timeline.day || Boolean(state.tasks?.active?.[task.id]));

  for(let i=Math.max(0,timeline.dayStartIndex);i<chat.length;i++){
    const message=chat[i];
    if(!message || message.is_user) continue;
    const raw=String(message.mes||'');

    const canonicalCards=extractCanonicalTaskMarkers(raw);
    let tasks=canonicalCards
      .map(card=>taskFromCanonicalMarker(card,state))
      .filter(Boolean);

    if(!tasks.length){
      const legacy=extractLegacyDailyCardsForMigration(raw);
      if(legacy.length){
        const migrated=taskFromLegacyDailyCard(legacy[legacy.length-1],state);
        if(migrated) tasks=[migrated];
      }
    }

    for(const task of tasks){
      if((task.canonicalMarker || task.legacyMigrated) && removeFallbackTasksCompetingWithFormalCard(state,task)) changed=true;
      if(state.tasks.everCompleted?.[task.id] || state.tasks.active?.[task.id] || state.tasks.generatedDaily.some(old=>old.id===task.id)) continue;

      state.tasks.generatedDaily=[task,...state.tasks.generatedDaily].slice(0,8);
      const historyId=`meme_visible_task_reconcile_${timeline.day}_${i}_${task.id}`;
      if(!(state.history||[]).some(entry=>entry.id===historyId)){
        state.history.push({
          id:historyId,
          type:'visible_task_reconcile',
          recordType:'task',
          title:`正文任务已同步：${task.title}`,
          summary:`仅从 DAY ${String(timeline.day).padStart(3,'0')} 的剧情起点往后读取 [TASK]。`,
          text:`VISIBLE TASK RECONCILED: ${task.id}`,
          committedAt:Date.now(),
        });
      }
      changed=true;
    }
  }

  if(changed){
    if(state.history.length>240) state.history=state.history.slice(-240);
    await saveState(state);
    renderView(currentView(),false);
    installRuntimePrompt();
  }
}

async function reconcileRecentVisibleTaskCompletions(){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const chat=Array.isArray(context.chat)?context.chat:[];
  const state=runtimeState();

  const timeline=reconstructStoryTimeline(chat);
  const dayChanged=syncStoryDayTo(state,timeline.day,{source:'visible-completion-reconcile',allowCorrection:true});

  let changed=Boolean(dayChanged);
  const start=Math.max(0,timeline.dayStartIndex);
  for(let i=start;i<chat.length;i++){
    const message=chat[i];
    if(!message || message.is_user) continue;
    const raw=String(message.mes||'');
    if(settleVisibleTaskCompletionsFromMessage(state,raw,i)) changed=true;
  }

  if(changed){
    await saveState(state);
    renderView(currentView(),false);
    installRuntimePrompt();
  }
}

async function reconcileRecentVisibleSettlements(){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const chat=Array.isArray(context.chat)?context.chat:[];
  const state=runtimeState();
  let changed=false;
  const recent=chat.slice(Math.max(0,chat.length-16));
  const baseIndex=Math.max(0,chat.length-16);

  recent.forEach((message,offset)=>{
    if(!message || message.is_user) return;
    const raw=String(message.mes||'');
    const re=/【(?:DAILY|STORY)\s*TASK\s*ID:([a-zA-Z0-9_-]+)[^】]*?(?:「([^」]+)」)?[^】]*?已结算】[\s\S]{0,500}?【奖励\s*[:：]\s*AP\s*\+(\d+)[^】]*】/g;
    for(const match of raw.matchAll(re)){
      const originalId=String(match[1]||'').trim();
      if(!originalId || state.tasks?.everCompleted?.[originalId]) continue;
      const shown=Math.max(0,Number(match[3])||0);
      const choices=[70,100,150];
      const ap=choices.reduce((best,n)=>Math.abs(n-shown)<Math.abs(best-shown)?n:best,100);
      const difficulty=ap===70?'light':ap===150?'hard':'normal';
      const title=String(match[2]||originalId).trim().slice(0,48);
      const historyId=`meme_legacy_visible_${baseIndex+offset}_${originalId}`;
      if((state.history||[]).some(entry=>entry.id===historyId)) continue;

      state.tasks=state.tasks||{storyDay:1,active:{},generated:[],generatedDaily:[],lastGeneratedDesireDay:0,lastGeneratedDailyTurn:0,completed:{},dailyCompleted:{},everCompleted:{}};
      state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
      const task={
        id:originalId,type:'DAILY',category:'daily',dynamicDailyTask:true,difficulty,
        title,desc:'由旧版剧情文本识别并同步到MÉMÉ OS。',detail:'兼容旧回复中的显式剧情任务结算。',
        reward:`AP +${ap}`,state:'已完成',locked:false,
        createdDay:Number(state.tasks.storyDay)||1,createdTurn:Number(state.shop?.plotTurn)||0,source:'旧版剧情兼容',
      };
      state.tasks.generatedDaily=[task,...state.tasks.generatedDaily.filter(old=>old.id!==originalId)].slice(0,8);
      state.resources.ap=Math.max(0,Number(state.resources.ap||0)+ap);
      state.tasks.dailyCompleted[originalId]={
        id:originalId,title,category:'daily',day:Number(state.tasks.storyDay)||1,count:1,
        evidence:'旧版回复明确标记该剧情任务已结算。',
        completedAt:Date.now(),completedTurn:Number(state.shop?.plotTurn)||0,
      };
      state.tasks.everCompleted[originalId]={id:originalId,title,category:'daily',firstCompletedAt:Date.now()};
      state.permission.milestones.taskSettlements=Math.max(0,Number(state.permission.milestones.taskSettlements)||0)+1;
      state.permission.milestones.completedTasks=Math.max(0,Number(state.permission.milestones.completedTasks)||0)+1;
      state.history.push({
        id:historyId,type:'legacy_story_task_sync',recordType:'task',title:`旧账我也给你补了：${title}`,
        summary:`旧回复里这笔明明结过，我给你补进 OS。AP +${ap}。`,text:`LEGACY VISIBLE SETTLEMENT: ${originalId}`,committedAt:Date.now(),
      });
      changed=true;
    }
  });

  if(changed){
    if(state.history.length>240) state.history=state.history.slice(-240);
    await saveState(state);
    renderView(currentView(),false);
    installRuntimePrompt();
  }
}

async function handleRuntimeEvent(messageId){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const message=Number.isInteger(messageId)?context.chat?.[messageId]:null;
  if(!message || message.is_user) return;

  const state=runtimeState();

  // Chronology repair is independent of per-turn settlement replay. Run it
  // BEFORE the legacy processed-message early return so old chats can still
  // repair DAY / daily-board state when a visible reply proves a later day.
  const preflightTimeline=reconstructStoryTimeline(Array.isArray(context.chat)?context.chat:[]);
  const preflightTimelineChanged=syncStoryDayTo(
    state,
    preflightTimeline.day,
    {source:'runtime-preflight',allowCorrection:true}
  );
  state.tasks.timelineAudit={
    storyDay:preflightTimeline.day,
    dayStartIndex:preflightTimeline.dayStartIndex,
    boundaries:preflightTimeline.boundaries.slice(-16),
    scannedMessages:preflightTimeline.scannedMessages,
    updatedAt:Date.now(),
  };
  if(preflightTimelineChanged){
    await saveState(state);
    renderView(currentView(),false);
  }

  const messageKey=assistantTurnKey(context,messageId,message);
  const variantKey=assistantVariantKey(message);
  state.runtime=state.runtime||{processedAssistantMessages:[],lastTurnKey:null,lastTurnVariant:null,lastTurnBase:null};

  // Chats created before swipe-safe snapshots existed may already have the
  // current turn frozen in the legacy processed list. Do not replay those
  // historical effects because there is no trustworthy pre-turn base to restore.
  if(!state.runtime.lastTurnBase && runtimeMessageAlreadyProcessed(state,messageId,messageKey)){
    if(migrateLegacyRuntimeMessageKey(state,messageId,messageKey)) await saveState(state);
    console.info(`[MÉMÉ OS] legacy assistant turn ${messageKey} left frozen to avoid duplicate settlement`);
    return;
  }

  if(state.runtime.lastTurnKey===messageKey && state.runtime.lastTurnBase){
    if(state.runtime.lastTurnVariant===variantKey){
      console.info(`[MÉMÉ OS] assistant variant ${variantKey} already applied`);
      return;
    }
    // Same user turn, different swipe/regeneration: rewind every assistant-owned
    // domain to the exact pre-turn snapshot, then replay only the visible variant.
    restoreTurnBase(state,state.runtime.lastTurnBase);
  }else{
    if(state.runtime.lastTurnKey) markRuntimeMessageProcessed(state,state.runtime.lastTurnKey);
    state.runtime.lastTurnKey=messageKey;
    state.runtime.lastTurnVariant=null;
    state.runtime.lastTurnBase=captureTurnBase(state);
  }

  // This is the exact wheel result that governed the visible assistant reply.
  // Compute it from the restored pre-turn state so swipes keep the same result.
  const encounterForTurn=npcEncounterWheel(context,state);

  state.shop=state.shop||{dynamic:[],plotTurn:0};
  // plotTurn advances from the pre-turn snapshot, so every swipe/regeneration
  // of this same user message lands on exactly the same turn number.
  state.shop.plotTurn=(Number(state.shop.plotTurn)||0)+1;
  state.shop.dynamic=(state.shop.dynamic||[]).filter(item=>Number(item.expiresTurn||0)>=state.shop.plotTurn);
  state.tasks=state.tasks||{storyDay:1,active:{},generated:[],generatedDaily:[],lastGeneratedDesireDay:0,lastGeneratedDailyTurn:0,completed:{},dailyCompleted:{},everCompleted:{}};
  state.tasks.generatedDaily=Array.isArray(state.tasks.generatedDaily)?state.tasks.generatedDaily:[];
  pruneRedundantGeneratedDaily(state);
  state.tasks.generatedDaily=state.tasks.generatedDaily.filter(task=>{
    const done=state.tasks.dailyCompleted?.[task.id];
    if(!done) return true;
    return Number(done.completedTurn||-1) >= Number(state.shop.plotTurn||0);
  });

  const raw=String(message.mes||'');

  let encounterCooldownChanged=false;
  if(encounterForTurn.hit){
    state.encounters=state.encounters||{};
    state.encounters.randomMale=state.encounters.randomMale||{};
    state.encounters.randomMale.lastHitTurn=Number(state.shop?.plotTurn)||0;
    state.encounters.randomMale.lastHitDay=Math.max(1,Number(state.tasks?.storyDay)||1);
    state.encounters.randomMale.lastSeed=encounterForTurn.seed||null;
    state.encounters.randomMale.lastScene=encounterForTurn.scene?.id||null;
    encounterCooldownChanged=true;
  }

  const visibleCompletionChanged=settleVisibleTaskCompletionsFromMessage(state,raw,messageId);

  const canonicalCards=extractCanonicalTaskMarkers(raw);
  const canonicalTasks=canonicalCards
    .map(card=>taskFromCanonicalMarker(card,state))
    .filter(Boolean);

  if(canonicalTasks.length){
    purgeKnownLegacyWrongGeneratedTasks(state);
    for(const canonicalTask of canonicalTasks){
      removeFallbackTasksCompetingWithFormalCard(state,canonicalTask);
      state.tasks.generatedDaily=[
        canonicalTask,
        ...state.tasks.generatedDaily.filter(old=>old.id!==canonicalTask.id),
      ].slice(0,8);
    }
    state.tasks.lastGeneratedDailyTurn=Number(state.shop?.plotTurn)||0;
    // Visible [TASK] cards are authoritative. Frequency limits control what the
    // model SHOULD publish, not whether OS is allowed to acknowledge published cards.
    state.tasks.plotTaskIssuedDay=Math.max(1,Number(state.tasks?.storyDay)||1);
    state.tasks.plotTaskIssuedCount=Math.max(
      Number(state.tasks.plotTaskIssuedCount)||0,
      canonicalTasks.length
    );
    state.tasks.lastPlotTaskTurn=Number(state.shop?.plotTurn)||0;
  }

  const allMatches=[...raw.matchAll(/<!--MEME_OS_EVENT\s+([\s\S]*?)-->/g)];
  const matches=allMatches.length ? [allMatches[allMatches.length-1]] : [];
  let changed=true;
  const touchedMenIds=new Set();

  for(const match of matches){
    try{
      const event=JSON.parse(match[1].trim());

      state.reactivity=state.reactivity||{recentChanges:[],recentIssues:[],recentReactions:[]};

      if(Array.isArray(event.taskOffers)){
        state.tasks=state.tasks||{storyDay:1,active:{},generated:[],lastGeneratedDesireDay:0,completed:{},dailyCompleted:{},everCompleted:{}};
        state.tasks.generated=Array.isArray(state.tasks.generated)?state.tasks.generated:[];
        const currentDay=Math.max(1,Number(state.tasks.storyDay)||1);
        const boardOpen=state.tasks.generated.filter(task=>!state.tasks.completed?.[task.id]).length;
        const canGenerate=Number(state.tasks.lastGeneratedDesireDay||0)!==currentDay && boardOpen<3;
        if(canGenerate){
          const task=sanitizeGeneratedDesireTask(event.taskOffers[0],state);
          if(task){
            const combined=[task,...state.tasks.generated.filter(old=>old.id!==task.id)];
            combined.sort((a,b)=>
              Number(Boolean(state.tasks.active?.[b.id]))-
              Number(Boolean(state.tasks.active?.[a.id]))
            );
            state.tasks.generated=combined.slice(0,8);
            state.tasks.lastGeneratedDesireDay=currentDay;
            changed=true;
          }
        }
      }

      if(Array.isArray(event.tasks)){
        for(const rawTask of event.tasks.slice(0,4)){
          if(settleTaskFromModel(state,rawTask,messageId)) changed=true;
        }
      }

      if(Array.isArray(event.storyRewards)){
        for(const rawReward of event.storyRewards.slice(0,1)){
          if(settleStoryRewardFromModel(state,rawReward,messageId)) changed=true;
        }
      }

      if(Array.isArray(event.feedback?.issues)){
        for(const rawIssue of event.feedback.issues.slice(0,2)){
          const issue=sanitizeSceneIssue(rawIssue,state);
          if(!issue) continue;
          state.reactivity.recentIssues=[
            issue,
            ...(state.reactivity.recentIssues||[]).filter(old=>old.id!==issue.id),
          ].slice(0,8);
          changed=true;
        }
      }

      if(Array.isArray(event.feedback?.reactions)){
        for(const rawReaction of event.feedback.reactions.slice(0,2)){
          const reaction=sanitizeSceneReaction(rawReaction,state);
          if(!reaction) continue;
          state.reactivity.recentReactions=[
            reaction,
            ...(state.reactivity.recentReactions||[]).filter(old=>old.id!==reaction.id),
          ].slice(0,8);
          changed=true;
        }
      }

      if(Array.isArray(event.men)){
        for(const rawMan of event.men.slice(0,3)){
          const person=applyMenUpdate(rawMan,state);
          if(!person) continue;
          touchedMenIds.add(person.id);
          changed=true;
        }
      }

      if(Array.isArray(event.shop)){
        for(const candidate of event.shop.slice(0,2)){
          const item=sanitizeDynamicItem(candidate,state);
          if(!item) continue;
          state.shop.dynamic=state.shop.dynamic.filter(old=>old.id!==item.id);
          state.shop.dynamic.unshift(item);
          state.shop.dynamic=state.shop.dynamic.slice(0,6);
          changed=true;
        }
      }

      if(Array.isArray(event.lifestyleShop) && (Number(state.host?.charm)||0)>=AP_CHARM_CAP){
        if(event.lifestyleShop.length===5){
          const nextShelf=event.lifestyleShop
            .map((candidate,index)=>sanitizeLifestyleItem(candidate,state,index))
            .filter(Boolean);
          const uniqueIds=new Set(nextShelf.map(item=>item.id));
          if(nextShelf.length===5 && uniqueIds.size===5){
            state.shop.lifestyleShelf=nextShelf;
            changed=true;
          }
        }
      }


      // timeline.storyDay/dayAdvance is advisory metadata only.
      // The complete visible chat timeline is the sole authority for storyDay.

      if(event.evolution?.targetLevel){
        const targetLevel=Math.round(Number(event.evolution.targetLevel)||0);
        const currentLevel=Math.max(1,Math.min(4,Number(state.system?.level)||1));
        const reason=String(event.evolution?.reason||'').replace(/\s+/g,' ').trim().slice(0,180);
        const historyId=`meme_system_evolution_${messageId}_${targetLevel}`;
        const alreadyHandled=(state.history||[]).some(entry=>entry.id===historyId);
        const gate=systemEvolutionReadiness(state,targetLevel);

        if(!alreadyHandled && reason && targetLevel===currentLevel+1 && gate.ok){
          const meta=SYSTEM_EVOLUTION[targetLevel];
          const now=Date.now();
          state.system.level=targetLevel;
          state.system.form=meta.form;
          state.system.evolution=state.system.evolution||{history:[],lastChangedAt:null,lastReason:null};
          state.system.evolution.history=[
            ...(state.system.evolution.history||[]),
            {
              level:targetLevel,
              form:meta.form,
              reason,
              storyDay:Number(state.tasks?.storyDay)||1,
              changedAt:now,
            },
          ].slice(-8);
          state.system.evolution.lastChangedAt=now;
          state.system.evolution.lastReason=reason;
          state.history.push({
            id:historyId,
            type:'system_evolution',
            recordType:'system',
            title:`SYSTEM LV.${targetLevel} · ${meta.label}`,
            summary:`我这边已经进到「${meta.form}」。别乱脑补，触发原因我记的是：${reason}`,
            text:`SYSTEM EVOLUTION: LV.${targetLevel}`,
            committedAt:now,
          });
          changed=true;
        }
      }

      const loveReadinessBeforeSignal=canAdminLove(state,normalizeBondTag(event.permission?.loveTag));

      if(event.permission?.signal){
        const signal=String(event.permission.signal);
        const reason=event.permission?.signalReason;
        const tag=normalizeBondTag(event.permission?.signalTag);
        const gate=canAcceptBondSignal(state,signal,tag);

        if(gate.ok){
          const kind=['impressed','curious','respect','amused','annoyed-but-invested'].includes(signal)
            ? 'interest'
            : signal;
          const recorded=recordAdminBondMoment(state,{kind,signal,reason,tag,messageId});
          if(recorded){
            if(kind==='interest'){
              state.permission.adminInterestSignals=Math.min(20,(Number(state.permission.adminInterestSignals)||0)+1);
            }else if(kind==='desire'){
              state.permission.adminDesireSignals=Math.min(20,(Number(state.permission.adminDesireSignals)||0)+1);
            }else if(kind==='attachment'){
              state.permission.adminAttachmentSignals=Math.min(20,(Number(state.permission.adminAttachmentSignals)||0)+1);
            }
            changed=true;
          }
        }
      }

      const wasAlreadyInLove=Boolean(state.permission?.adminLove);
      if(event.permission?.love===true &&
         !state.permission.adminLove &&
         loveReadinessBeforeSignal.ok){
        const recorded=recordAdminBondMoment(state,{
          kind:'love',
          signal:'love',
          reason:event.permission?.loveReason,
          tag:event.permission?.loveTag,
          messageId,
        });
        if(recorded){
          state.permission.adminLove=true;
          changed=true;
        }
      }

      if(event.identity?.offerNaming===true &&
         wasAlreadyInLove &&
         !state.system?.namingRightOffered){
        state.system.namingRightOffered=true;
        state.system.namingOfferedAt=Date.now();
        changed=true;
        state.history.push({
          id:`meme_naming_confession_${Date.now()}`,
          type:'naming_confession',
          recordType:'system',
          title:'命名权给你了',
          summary:'我主动把命名权交给你。不是系统抽奖，是我自己给的。',
          text:'NAMING RIGHT OFFERED BY ADMIN',
          committedAt:Date.now(),
        });
      }

      if(event.identity?.name &&
         state.system?.namingRightOffered &&
         !state.system?.name){
        const chosen=String(event.identity.name).trim().replace(/[<>\n\r]/g,'').slice(0,24);
        if(chosen){
          state.system.name=chosen;
          state.system.namedAt=Date.now();
          changed=true;
          state.history.push({
            id:`meme_admin_named_${Date.now()}`,
            type:'admin_named',
            recordType:'system',
            title:`行，以后就叫「${chosen}」`,
            summary:`名字我收了。以后 OS 和我的档案都按「${chosen}」记。`,
            text:`ADMIN NAME: ${chosen}`,
            committedAt:Date.now(),
          });
        }
      }

      const currentAccess=systemAccessStage(state);
      const requestedAccess=String(event.permission?.systemAccess||'').toLowerCase();
      let targetAccess=requestedAccess;

      // Backward compatibility: old unlockSystem means only the first peek, never a full skip.
      if(!targetAccess && event.permission?.unlockSystem===true) targetAccess='peek';

      const validNext={
        locked:'peek',
        peek:'open',
        open:'private',
        private:null,
      }[currentAccess];

      const canAdvance=
        targetAccess===validNext &&
        (
          (targetAccess==='peek' && Boolean(state.permission?.systemInviteReady)) ||
          (targetAccess==='open' && systemOpenReady(state)) ||
          (targetAccess==='private' && systemPrivateReady(state))
        );

      if(canAdvance){
        state.system.accessStage=targetAccess;
        state.system.pageUnlocked=true;
        state.system.accessChangedAt=Date.now();
        state.permission.systemUnlockedByAdmin=true;
        changed=true;

        const accessCopy={
          peek:['SYSTEM · PEEK','SYSTEM 访问权限已更新：PEEK。仅开放表层资料。'],
          open:['SYSTEM · OPEN','SYSTEM 访问权限已更新：OPEN。基本档案已开放。'],
          private:['SYSTEM · PRIVATE','SYSTEM 访问权限已更新：PRIVATE。私人档案权限已开放。'],
        }[targetAccess];

        state.history.push({
          id:`meme_system_access_${targetAccess}_${Date.now()}`,
          type:'system_access',
          recordType:'system',
          title:accessCopy[0],
          summary:accessCopy[1],
          text:`SYSTEM ACCESS: ${targetAccess.toUpperCase()}`,
          committedAt:Date.now(),
        });
      }
    }catch(error){
      console.warn('[MÉMÉ OS] runtime event parse failed',error);
    }
  }

  if(decayMenBuckets(state,touchedMenIds)) changed=true;
  if(Array.isArray(state.history) && state.history.length>240){
    state.history=state.history.slice(-240);
  }

  // Remember exactly which visible swipe currently owns this turn's effects.
  // Even a truncated/no-event variant is recorded: regenerating to a different
  // variant will rewind to lastTurnBase and replay, while duplicate dispatch of
  // the same visible variant becomes a no-op.
  state.runtime.lastTurnKey=messageKey;
  state.runtime.lastTurnVariant=variantKey;

  // Hidden eligibility is recalculated here too, without auto-unlocking.
  const milestones=state.permission?.milestones||{};
  state.permission.systemEligible=
    Number(state.host?.charm||0)>=10 &&
    Number(milestones.completedTasks||0)>=2 &&
    Number(milestones.purchasedUpgrades||0)>=1 &&
    Number(state.permission?.adminInterestSignals||0)>=1;
  state.permission.systemInviteReady=
    state.permission.systemEligible &&
    Number(state.permission?.adminInterestSignals||0)>=2;

  if(changed || visibleCompletionChanged || encounterCooldownChanged || matches.length || state.shop.dynamic.length){
    await saveState(state);
    renderView(currentView(),false);
  }
}


function latestUserTurnSeed(chat=[]){
  const messages=Array.isArray(chat)?chat:[];
  for(let i=messages.length-1;i>=0;i--){
    const message=messages[i];
    if(!message?.is_user) continue;
    const date=messageDateKey(message);
    const text=String(message.mes||'').trim();
    return {
      index:i,
      text,
      seed:date ? ('u:'+date) : ('u:'+i+':'+hashId(text).toString(36)),
    };
  }
  return {index:-1,text:'',seed:'u:none'};
}

function recentSceneText(chat=[],limit=4){
  const messages=Array.isArray(chat)?chat:[];
  return messages
    .slice(Math.max(0,messages.length-Math.max(1,Number(limit)||4)))
    .map(message=>visibleStoryText(message?.mes||''))
    .filter(Boolean)
    .join(' ');
}

function chatThroughLatestUser(chat=[]){
  const messages=Array.isArray(chat)?chat:[];
  for(let i=messages.length-1;i>=0;i--){
    if(messages[i]?.is_user) return messages.slice(0,i+1);
  }
  return messages;
}

function classifyNpcEncounterSource(source=''){
  const text=String(source||'').toLowerCase();
  if(/(交友软件|约会软件|相亲软件|交友平台|约会平台|探探|陌陌|tinder|bumble|hinge|grindr|soul|附近的人|滑卡|右滑|左滑|匹配.{0,8}(?:男人|男性|男生)|刷.{0,8}(?:男人|男性|男生))/iu.test(text)){
    return {id:'dating',label:'线上交友',multiplier:1.45};
  }
  if(/(酒吧|夜店|club|派对|聚会|联谊|ktv|livehouse|酒会|舞会|相亲局|社交局|朋友局|聚餐|蹦迪)/iu.test(text)){
    return {id:'social',label:'主动社交场',multiplier:1.25};
  }
  if(/(街上|街边|路上|人行道|公园|广场|步行街|景区|户外|室外|河边|江边|海边|商圈|夜市|菜市场|小吃街|校园里|操场)/iu.test(text)){
    return {id:'outdoor',label:'户外公共场景',multiplier:1.00};
  }
  if(/(商场|超市|便利店|咖啡店|咖啡馆|餐厅|饭店|电影院|健身房|图书馆|医院|诊所|学校|教室|公司|办公室|写字楼|地铁|公交|车站|机场|高铁|火车|酒店大堂|前台|理发店|美发店|美甲店|店里|门店)/iu.test(text)){
    return {id:'public_indoor',label:'室内公共场景',multiplier:0.90};
  }
  if(/(小区|楼道|走廊|电梯|楼下|门口|快递柜|物业|停车场|地下车库|公寓公共区|宿舍楼)/iu.test(text)){
    return {id:'residential',label:'住宅公共区',multiplier:0.55};
  }
  if(/(家里|家中|卧室|客厅|厨房|浴室|卫生间|阳台|床上|房间里|宿舍里|公寓里|在家|回家|回到家|到家)/iu.test(text)){
    return {id:'home',label:'私人住宅',multiplier:0.35};
  }
  return null;
}

function classifyNpcEncounterScene(context,state=runtimeState()){
  const chat=chatThroughLatestUser(context?.chat);
  const user=latestUserTurnSeed(chat);
  const status=latestVisibleSceneStatus(chat);
  const explicit=classifyNpcEncounterSource(user.text);
  if(explicit) return explicit;

  const fromLocation=classifyNpcEncounterSource(status?.location||'');
  if(fromLocation) return fromLocation;

  const recent=classifyNpcEncounterSource(recentSceneText(chat,3));
  return recent || {id:'unknown',label:'一般剧情场景',multiplier:0.65};
}

function npcCharmReactionGuide(charm){
  const value=Math.max(0,Math.min(100,Number(charm)||0));
  if(value<10) return '0-9 纯嫌弃/明显难看阶段：命中只代表男性NPC有合理介入机会，不代表审美兴趣。默认更可能是事务性、礼貌性、中性或无兴趣互动；不能因为轮盘命中就突然性吸引。';
  if(value<30) return '10-29 抢救阶段：外观有所改善但仍不算顺眼。男性NPC可以正常交流、偶尔注意或产生个体化兴趣，但主动搭讪和明显性欲仍应少见。';
  if(value<55) return '30-54 顺眼阶段：已跨普通人线。成年男性出现普通好感、注意、多看、搭话或轻度性兴趣都合理，但仍取决于个人审美与情境。';
  if(value<70) return '55-69 漂亮阶段：客观漂亮。男性NPC主动注意、找话题、搭讪、试探联系方式或产生较明确性兴趣更自然，但不能人人同一种反应。';
  if(value<85) return '70-84 美女阶段：明显美女。较强注意、主动接近、调情与成人性兴趣可更常见；仍保留个人偏好、已有伴侣、性格和场合约束。';
  if(value<93) return '85-92 高魅力美女阶段：外貌高度出众。陌生男性注意和主动介入的社会反馈明显增强，但仍不能让所有男人失去人格或自动发情。';
  if(value<100) return '93-99 近完成体：极高外貌完成度。高注意率和强烈第一印象合理，男性NPC仍需保持独立动机、边界与个人审美。';
  return '100 魅力完成体：系统魅力达到上限。命中时高度容易引起注意，但依旧不是精神控制；男性NPC仍是独立成年人，不保证喜欢、搭讪、性同意或持续关系。';
}

function latestNewManTurn(state=runtimeState()){
  const archive=state.men?.archive||{};
  let latest=-999;
  for(const person of Object.values(archive)){
    const turn=Number(person?.firstSeenTurn);
    if(Number.isFinite(turn)) latest=Math.max(latest,turn);
  }
  return latest;
}


function userExplicitlyInvitesNewMaleInteraction(context){
  const chat=chatThroughLatestUser(context?.chat);
  const user=latestUserTurnSeed(chat);
  const text=String(user.text||'');
  return /(想认识.{0,8}(?:新|别的|其他).{0,6}(?:男人|男的|男性|男生)|想找.{0,8}(?:男人|男的|男性|男生)|找个.{0,8}(?:男人|男的|男性|男生)|刷.{0,6}(?:交友|约会|男人|男的|男性|男生)|打开.{0,6}(?:交友|约会).{0,6}(?:软件|app|应用)|去.{0,6}(?:联谊|相亲|酒吧|夜店|聚会|派对)|想要.{0,8}(?:第三个|第三人|另一个|再来一个|多人)|叫.{0,8}(?:别人|另一个男人|其他男人).{0,8}(?:来|过来)|邀请.{0,8}(?:另一个|其他).{0,6}(?:男人|男性|男生))/iu.test(text);
}

function currentMaleSceneFocus(context,state=runtimeState()){
  const chat=chatThroughLatestUser(context?.chat);
  const recent=recentSceneText(chat,3);
  const user=latestUserTurnSeed(chat);
  const userText=String(user.text||'');
  const currentMen=Array.isArray(state.men?.current)?state.men.current:[];
  const explicitNew=userExplicitlyInvitesNewMaleInteraction(context);
  const currentTurn=Math.max(0,Number(state.shop?.plotTurn)||0);

  const exitCue=/(他走了|他离开了|送走他|和他告别|跟他告别|目送他离开|我离开他|我先走了|我回家了|我一个人回家|结束约会|结束见面|各自回去|分开了|散场了|挂断.{0,6}(?:电话|视频)|退出.{0,6}(?:聊天|通话))/iu.test(userText);

  const intimacy=/(接吻|亲吻|拥吻|继续亲|(?:我|你).{0,6}(?:亲|吻).{0,6}(?:他|男人|对方)|(?:他|男人|对方).{0,6}(?:亲|吻).{0,6}(?:我|你)|上床|做爱|性交|插入|抽插|口交|手交|足交|乳交|后庭|肛交|自慰|高潮|射精|精液|阴茎|肉棒|鸡巴|阴道|小穴|乳房|奶头|脱.{0,4}衣|赤裸|裸体|前戏|爱抚|抚摸.{0,8}(?:胸|腿|腰|臀|阴部|下体)|骑乘|体位|亲密行为|性行为)/iu.test(recent);

  const datingFocus=/(约会|单独吃饭|一起吃饭|一起喝酒|一起散步|一起回家|送你回家|送我回家|单独相处|陪着你|陪着我|两个人|二人世界)/iu.test(recent);

  const pronounInteraction=/(?:我|你).{0,10}(?:看|问|抱|亲|摸|拉|推|靠|贴|坐到|走向|跟着|回应|笑着对|转向).{0,8}(?:他|男人|对方)|(?:他|男人|对方).{0,10}(?:看|问|抱|亲|摸|拉|推|靠|贴|跟|对着|回应).{0,8}(?:我|你)/iu.test(recent);

  const activeNames=currentMen.map(person=>String(person?.name||'').trim()).filter(Boolean);
  const namedPresent=activeNames.some(name=>recent.includes(name));
  const userNamesCurrent=activeNames.some(name=>userText.includes(name));
  const explicitContinuation=userNamesCurrent || /(和他|跟他|我们俩|我们一起|他陪我|他跟我|他送我|我跟他|我和他)/u.test(userText);
  const soloCue=/(我一个人|我独自|独自一人|自己一个人|只剩我|我自己去|我自己回)/u.test(userText);
  const timeCutCue=/(第二天|次日|翌日|隔天|第二天早上|第二天晚上|几小时后|一觉醒来|睡醒后)/u.test(userText) && !explicitContinuation;
  const locationCutCue=/(我(?:去|到了|来到|回到).{0,10}(?:公司|学校|教室|图书馆|商场|超市|便利店|医院|健身房|公园|街上|办公室|宿舍|家里))/u.test(userText) && !explicitContinuation;
  const sceneCutCue=soloCue || timeCutCue || locationCutCue;

  const heartbeat=currentMen.some(person=>{
    const last=Number(person?.lastSeenTurn);
    return Number.isFinite(last) && last>=currentTurn;
  });

  const activeCurrent=currentMen.length>0;
  const hardLock=!exitCue && !sceneCutCue && activeCurrent && intimacy;
  const softLock=!exitCue && !sceneCutCue && activeCurrent && (heartbeat || namedPresent || datingFocus || pronounInteraction);
  const locked=!explicitNew && (hardLock || softLock);

  return {
    locked,
    hardLock,
    explicitNew,
    exitCue,
    sceneCutCue,
    intimacy,
    datingFocus,
    pronounInteraction,
    namedPresent,
    heartbeat,
    activeCurrent,
    currentMen:currentMen.map(person=>({id:person.id,name:person.name||'未命名对象'})),
    reason:locked
      ? (hardLock ? '当前男性NPC处于亲密/色情场景，焦点硬锁' : '当前男性NPC仍被本回合确认在场')
      : explicitNew
        ? '宿主主动要求引入新男性/新社交对象'
        : exitCue
          ? '宿主明确结束当前男性场景'
          : sceneCutCue
            ? '宿主明确切到新的单独/时间跳转场景'
            : '无可靠当前男性焦点',
  };
}

function npcEncounterWheel(context,state=runtimeState()){
  const charm=Math.max(0,Math.min(100,Number(state.host?.charm)||0));
  const baseChance=Math.max(10,charm);
  const scene=classifyNpcEncounterScene(context,state);
  const chance=Math.min(95,Math.max(0,Math.round(baseChance*scene.multiplier*10)/10));
  const user=latestUserTurnSeed(context?.chat);
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  const nextTurn=Math.max(1,(Number(state.shop?.plotTurn)||0)+1);
  const roll=(hashId('npc-wheel-v4|'+user.seed)%10000)/100;
  const recordedHitTurn=Number(state.encounters?.randomMale?.lastHitTurn);
  const lastNewTurn=Math.max(
    Number.isFinite(recordedHitTurn) ? recordedHitTurn : -999,
    latestNewManTurn(state)
  );
  const blockedByCooldown=lastNewTurn>-999 && nextTurn-lastNewTurn<=2;
  const cooldownRemaining=blockedByCooldown ? Math.max(0,3-(nextTurn-lastNewTurn)) : 0;
  const focus=currentMaleSceneFocus(context,state);
  const pausedByFocus=focus.locked;
  const hit=!pausedByFocus && !blockedByCooldown && roll<chance;
  return {
    day,
    nextTurn,
    charm,
    baseChance,
    scene,
    chance,
    roll:Math.round(roll*100)/100,
    hit,
    pausedByFocus,
    focus,
    blockedByCooldown,
    cooldownRemaining,
    reactionGuide:npcCharmReactionGuide(charm),
    seed:user.seed,
  };
}

function latestVisibleSceneStatus(chat=[]){
  const messages=Array.isArray(chat)?chat:[];
  for(let i=messages.length-1;i>=0;i--){
    const message=messages[i];
    if(!message || message.is_user) continue;
    const raw=String(message.mes||'');
    const match=raw.match(/【\s*DAY\s*0*(\d{1,3})\s*｜\s*([^｜】\n]+)\s*｜\s*([^｜】\n]+)\s*｜\s*([^｜】\n]+)\s*｜\s*([^】\n]+)\s*】/u);
    if(!match) continue;
    return {
      raw:match[0],
      day:Math.max(1,Number(match[1])||1),
      date:String(match[2]||'').trim(),
      time:String(match[3]||'').trim(),
      weather:String(match[4]||'').trim(),
      location:String(match[5]||'').trim(),
      messageIndex:i,
    };
  }
  return null;
}

function installRuntimePrompt(){
  if(!isBoundCharacter()) return;
  const context=globalThis.SillyTavern?.getContext?.();
  if(typeof context?.setExtensionPrompt!=='function') return;

  const state=runtimeState();
  const voice=attitude(state);
  const eligible=Boolean(state.permission?.systemEligible);
  const inviteReady=Boolean(state.permission?.systemInviteReady);
  const desireAllowed=Number(state.host?.charm||0)>=70;
  const loveState=Boolean(state.permission?.adminLove);
  const accessStage=systemAccessStage(state);
  const openReady=systemOpenReady(state);
  const privateReady=systemPrivateReady(state);
  const evolution=currentSystemEvolution(state);
  const nextEvolution=nextSystemEvolution(state);
  const plotTaskRewards=plotTaskRewardOptions(state);
  const plotTaskFreq=plotTaskFrequency(state);
  const lifestyleDisposition=lifestyleShelfDisposition(state);
  const previousSceneStatus=latestVisibleSceneStatus(context?.chat);
  const previousSceneStatusText=previousSceneStatus?.raw || 'NONE — establish a precise scene clock in this reply';
  const npcWheel=npcEncounterWheel(context,state);
  const prompt=`[MÉMÉ OS runtime bridge · v0.13]
AUTHORITY / TONE:
- Extension state is the only authority for AP, SV, CHARM, purchases, task settlement, MEN buckets, system access/evolution and unlocks. Never mentally add/subtract numbers or reuse stale balances.
- The host persona comes from the active SillyTavern Persona + visible chat. Do not invent host identity/history beyond established system transformation facts.
- All sexual/intimate participants are explicit adults. MÉMÉ OS is a vulgar adult-game transformation system, not a wholesome tracker or default romance route. Male public personalities remain unrestricted; private sexual tastes may strongly contrast.
- Administrator current tone stage=${voice.label}. Stage rule=${voice.rule}
- At CHARM 0-14 without a real bond turning point, administrator speech stays sparse: usually 0-1 short burst, max 2 ordinary bursts. Dirty wording does not mean attraction.
- Administrator sexual attraction to host is mechanically appearance-eligible only at CHARM 70+ and still needs a concrete story trigger. CHARM != desire != bond != love.
- Do not output a second custom status panel. The dedicated scene-clock prompt owns the single visible DAY/date/time/weather/location header.

LIVE STATE:
DAY=${Number(state.tasks?.storyDay)||1}; AP=${Number(state.resources?.ap)||0}; SV=${Number(state.resources?.sv)||0}; CHARM=${Number(state.host?.charm)||0}.
Spendable after pending: AP=${getSpendableResources(state).ap}; SV=${getSpendableResources(state).sv}.
Body/upgrades=${JSON.stringify(state.host?.body||{})}.

TASK BOARD:
Base DAILY today=${JSON.stringify(currentStaticTaskPool('daily',state).map(t=>({id:t.id,title:t.title,desc:t.desc,reward:t.reward})))}.
Plot DAILY currently open=${JSON.stringify((state.tasks?.generatedDaily||[]).map(t=>({id:t.id,title:t.title,desc:t.desc,difficulty:t.difficulty,source:t.source,createdDay:t.createdDay,active:Boolean(state.tasks?.active?.[t.id])})))}.
Active tasks=${JSON.stringify(Object.values(state.tasks?.active||{}))}.
Completed daily action tags today=${JSON.stringify([...completedDailyActionTags(state)])}.
Dismissed plot tasks today=${JSON.stringify((state.tasks?.dismissed||[]).filter(t=>Number(t.storyDay||0)===Number(state.tasks?.storyDay||1)).map(t=>({title:t.title,actionTags:t.actionTags})))}.
Plot-task budget today=${plotTaskFreq.count}/${plotTaskFreq.limit||2}; current turn=${plotTaskFreq.turn}; last issued turn=${plotTaskFreq.last}; canIssue=${plotTaskFreq.canIssue}.
Allowed visible plot-task AP rewards: light=${plotTaskRewards.light}, normal=${plotTaskRewards.normal}, hard=${plotTaskRewards.hard}.
Rules: base DAILY is extension-owned and must not be republished as extra plot tasks. A new plot task must be caused by the current visible scene, require an unfinished action, and not duplicate an open/completed semantic action.
If publishing a plot task, visible canonical format is EXACTLY [TASK｜title｜requirement｜AP +N] and N must equal one allowed reward above. Visible TASK cards are authoritative and may be backfilled by the extension.

DESIRE:
CHARM < 8 => DESIRE is fully SEALED. Do not reveal task names, targets, acts, rewards or future conditions.
Generated DESIRE currently open=${JSON.stringify((state.tasks?.generated||[]).map(t=>({id:t.id,title:t.title,tier:t.tier,desc:t.desc,createdDay:t.createdDay,active:Boolean(state.tasks?.active?.[t.id]),targetManId:t.targetManId||null})))}.
Distinct erotic missions completed=${distinctEroticTaskCount(state)}; last generated story day=${Number(state.tasks?.lastGeneratedDesireDay)||0}.
At CHARM 8+, visible DESIRE uses no fixed daily pool. Generate at most one new mission per natural story day and only when the current plot has a usable adult target/scenario.
Mission formula: target man × current scene × CHARM tier × unlocked host capability × sexual act/body part × constraint/control/presentation/risk × measurable completion/SV goal.
Do not disguise dating, compliments, affection farming or administrator romance as DESIRE. Target men may be any adult archetype; public persona and private XP are independent axes.

SHOP / REACTIVITY:
Current shop phase=${currentShopPhase(state).label}/${currentShopPhase(state).code}; total upgrade levels=${shopProgressLevels(state)}; appearance AP->SV gate begins at CHARM ${AP_CHARM_CAP}.
Dynamic BODY/PLOT shop=${JSON.stringify(getDynamicShop(state).map(i=>({id:i.id,title:i.title,desc:i.desc,currency:i.currency,price:i.price,expiresTurn:i.expiresTurn,bodyAxis:i.bodyAxis})))}.
Recent changes=${JSON.stringify((state.reactivity?.recentChanges||[]).slice(0,6))}.
Recent issues=${JSON.stringify((state.reactivity?.recentIssues||[]).slice(0,6))}.
Recent reactions=${JSON.stringify((state.reactivity?.recentReactions||[]).slice(0,6))}.
Lifestyle shelf=${JSON.stringify(getLifestyleShelf(state).map(i=>({title:i.title,desc:i.desc,kind:i.kind,consumable:i.consumable,source:i.source,price:i.price})))}.
Lifestyle disposition this turn=${lifestyleDisposition.id}/${lifestyleDisposition.label}: ${lifestyleDisposition.instruction}
Inventory=${JSON.stringify(inventoryItems(state).map(i=>({title:i.title,kind:i.kind,count:i.count,consumable:i.consumable})))}.
Dynamic BODY/PLOT goods must answer a concrete current plot need; the model supplies effect/context, never final price. Lifestyle shelf before CHARM ${AP_CHARM_CAP} stays locked; after unlock, emit either [] to keep it or EXACTLY 5 full replacement items.

MEN:
Archive snapshot=${JSON.stringify({current:(state.men?.current||[]).map(p=>({id:p.id,name:p.name,meta:p.meta,relation:p.relation,desire:p.desire,contactCount:p.contactCount,lastSeenTurn:p.lastSeenTurn,status:p.status})),recent:(state.men?.recent||[]).map(p=>({id:p.id,name:p.name,relation:p.relation,status:p.status})),returning:(state.men?.returning||[]).map(p=>({id:p.id,name:p.name,relation:p.relation,status:p.status}))})}.
Random adult men may vary widely in class, job, looks, height, temperament and sexual preferences; do not flatten them into one archetype. Existing MEN identity is canonical.
If the host actively re-cues a task NPC for continued development, only a clearly high-quality long-term candidate may solidify; then preserve a full independent biography and life outside the host.
Presence heartbeat: while a known MEN person remains physically/actively in the current scene, include a men event for him every reply with the SAME id/name, present:true, contactDelta:0 unless a real new contact count is warranted. When he actually leaves the active scene, emit present:false once. This heartbeat exists so the NPC focus lock can pause random newcomers accurately.

ADMIN / SYSTEM:
Recent admin bond moments=${JSON.stringify((state.permission?.adminBond?.moments||[]).slice(-12).map(m=>({kind:m.kind,signal:m.signal,tag:m.tag,reason:m.reason,storyDay:m.storyDay})))}.
Current CHARM=${state.host.charm}; admin desire appearance-gate=${desireAllowed}; adminLove=${loveState}.
System level=${state.system?.level||1}; form=${evolution.form}; capability=${evolution.capability}; next=${nextEvolution?('LV.'+nextEvolution.level+' '+nextEvolution.form):'MAX'}; nextReady=${nextEvolution?nextEvolution.readiness.ok:true}.
System access=${accessStage.toUpperCase()}; eligible=${eligible}; inviteReady=${inviteReady}; openReady=${openReady}; privateReady=${privateReady}.
Naming right offered=${Boolean(state.system?.namingRightOffered)}; accepted name=${state.system?.name||'NONE'}.
Relationship signals are sparse state changes, not running mood captions. Interest/desire/attachment/love must be caused by a concrete new event. Beauty/sex/jealousy alone never equals love.

HIDDEN EVENT:
Append at most ONE invisible comment at the very end ONLY when this reply changes structured MÉMÉ OS state, or when a MEN presence heartbeat/exit is required.
Exact container: <!--MEME_OS_EVENT {"taskOffers":[],"tasks":[],"storyRewards":[],"shop":[],"lifestyleShop":[],"feedback":{"issues":[],"reactions":[]},"men":[],"evolution":{"targetLevel":null,"reason":""},"permission":{"signal":null,"signalReason":"","signalTag":"","love":false,"loveReason":"","loveTag":"","systemAccess":null},"identity":{}} -->
Do NOT add retired compatibility fields. MEMORY and scene chronology are owned by separate extension paths.
taskOffers: max 1 new DESIRE; fields title,desc,detail,source,targetManId(optional). Never include id/tier/reward. If it introduces a new relevant man, include matching men entry and link targetManId.
tasks: max 4 ACTIVE completions; fields id,status:"completed",evidence. Extension calculates rewards.
storyRewards: max 1 substantial unexpected non-routine achievement; fields title,evidence,source,difficulty(light|normal|hard).
shop: max 2 temporary BODY/PLOT candidates; fields title,desc,detail,currency(AP|SV),ttl,icon,source,impact(minor|standard|major),bodyAxis(optional),sourceIssueId(optional). No price/charmGain.
lifestyleShop: [] to keep shelf, or exactly 5 full items after unlock; fields title,desc,detail,icon,source,impact,kind,consumable. No price/currency/charmGain.
feedback.issues: max 2 direct observed issues {id,axis?,source,note,severity}; feedback.reactions: max 2 direct reactions {id,axis?,source,note,valence}.
men: max 3 updates {id?,name,meta,summary,relation,desire,lastContact,note,badges,present,contactDelta,qualifies}. Reuse known ids. Heartbeat uses contactDelta:0.
evolution: only a visible one-step form change that is mechanically ready; targetLevel=current+1 and short concrete reason.
permission.signal may be impressed|curious|respect|amused|annoyed-but-invested|desire|attachment only on a genuinely new event. signalTag must be one of personal_priority|protective_choice|trust|vulnerability|sacrifice|habit_broken_for_host|private_disclosure|future_choice.
permission.love=true only for a genuinely established love change involving meaningful personal investment/choice; loveTag must be sacrifice|personal_priority|vulnerability|future_choice|identity_choice.
permission.systemAccess may request peek|open|private only when the corresponding readiness above is satisfied and the administrator actually chooses to grant it.
identity is only for real administrator identity/name state changes supported by the story.

MEMORY is NOT part of the main reply event. The extension's quiet memory sync owns bootstrap + one SHORT per plot round + 15 SHORT -> 1 LONG + 10 LONG -> 1 PERMANENT.
`;

  const sceneClockPrompt=`[MÉMÉ OS — SCENE CLOCK — ABSOLUTE OUTPUT FORMAT]
This instruction controls ONLY the FIRST visible line of the next assistant story reply and overrides any older scene-header format found in chat history.

Previous visible scene header:
${previousSceneStatusText}

MANDATORY FIRST LINE — EXACTLY FIVE FIELDS:
【DAY ${String(Math.max(1,Number(state.tasks?.storyDay)||1)).padStart(3,'0')}｜<M月D日>｜<HH:MM>｜<天气>｜<地点>】

NON-NEGOTIABLE:
- <M月D日> MUST be a concrete Chinese month+day such as 11月23日. NEVER output only 11月, only 23日, 今天, 次日, or any vague date.
- <HH:MM> MUST be a concrete 24-hour clock time such as 08:17, 16:42, 23:05. NEVER output 上午, 下午, 清晨, 晚上, 深夜, or another time-of-day word in this field.
- The old format “【DAY 003｜11月｜下午｜晴｜卧室】” is INVALID and MUST NOT be repeated.
- Continue from the previous precise header when one exists. Advance minutes/hours only by the amount of time plausibly consumed by the visible narrative.
- If the previous header is old/incomplete, repair it NOW into a concrete M月D日 + HH:MM consistent with the current story, then treat that repaired value as the new anchor.
- Keep weather/location unchanged unless the story changes them.
- Output this header BEFORE any narration, dialogue, TASK card, or other text.
`;

  const npcWheelPrompt=`[MÉMÉ OS — RANDOM ADULT MALE NPC WHEEL]
This is a BACKEND-authoritative encounter roll for the next story reply. Do not reroll it yourself.

CHARM=${npcWheel.charm}; public-scene base chance=${npcWheel.baseChance}%.
Scene=${npcWheel.scene.label}; scene multiplier=${npcWheel.scene.multiplier}.
Final encounter chance=${npcWheel.chance}%.
Deterministic roll=${npcWheel.roll}.
Scene-focus lock active=${npcWheel.pausedByFocus}; reason=${npcWheel.focus.reason}.
Current focused MEN=${JSON.stringify(npcWheel.focus.currentMen)}.
Two-turn newcomer cooldown active=${npcWheel.blockedByCooldown}.
RESULT=${npcWheel.pausedByFocus
  ? 'PAUSED — current male scene focus owns the story; do not introduce a random new male NPC'
  : npcWheel.hit
    ? 'HIT — introduce one new adult male NPC naturally in this reply'
    : 'MISS — do not introduce a new random male NPC solely because of the wheel'}.

REACTION RULE FOR CURRENT CHARM:
${npcWheel.reactionGuide}

HARD RULES:
- SCENE FOCUS LOCK outranks the random wheel. While an existing male NPC is actively sharing the scene with the host, especially during a date, private one-on-one interaction, intimacy or sex, the random newcomer wheel is PAUSED for as many turns as that scene lasts. There is NO fixed maximum duration.
- The focus lock ends only when the focused man actually leaves/exits the active scene, the scene clearly changes away from him, or the host explicitly asks to meet/invite/search for additional new men.
- A sexual/intimate scene with a current male NPC is a HARD LOCK. Never inject a courier, passerby, neighbor, app match, staff member or other random newcomer into the active intimate sequence merely because enough turns passed.
- One wheel result per user-story turn when the wheel is not focus-paused. Same user turn / swipe / regeneration keeps the same result.
- HIT means ONE new explicit-adult male NPC gets a plausible opportunity to enter/intervene in the story. It does NOT mean attraction, sex, consent, romance, a DESIRE task, or long-term importance.
- On HIT, fit the entry method to the scene: home can use courier/delivery/building staff/neighbor/doorbell/phone/social contact; public scenes can use passersby/staff/customers/classmates/coworkers/etc.; online dating/social scenes can use a match/message/profile interaction.
- Generate the man's public personality from the full unrestricted adult archetype range. His private sexuality/XP is a separate axis and may contrast strongly with his public persona.
- If the scene already requires a male NPC for an independent plot reason, that required NPC is allowed regardless of MISS; the wheel only governs extra RANDOM incidental male intervention.
- On MISS, do not force a random newcomer into the scene. Existing/returning MEN and plot-required men may still act normally.
- A wheel-spawned man enters MEN only if the interaction becomes memorable, relevant, sexual, repeated, or otherwise meets MEN archive rules. A courier who says one line and leaves does not need a permanent MEN entry.
- Do not expose the roll, probability, seed or cooldown in visible prose unless the host explicitly asks the administrator/system about the mechanic in-story.
`;

  context.setExtensionPrompt(MEME_SCENE_CLOCK_PROMPT_ID,sceneClockPrompt,1,0,false,0);
  context.setExtensionPrompt(MEME_NPC_WHEEL_PROMPT_ID,npcWheelPrompt,1,0,false,0);
  context.setExtensionPrompt(MEME_RUNTIME_PROMPT_ID,prompt,1,2,false,0);
}

const RUDE_TASK_NAMES = {
  clean:'先把自己洗得像个人',
  mirror:'对着镜子认清现实',
  walk:'动一动，别继续长在椅子上',
  posture:'别缩成一团',
  outfit:'穿得别像刚从垃圾袋里爬出来',
  bedreset:'床先别像案发现场',
  deskreset:'把你那堆破烂桌面清出来',
  skincare:'脸先别继续摆烂',
  stretch:'把自己从一团肉里展开',
  photo:'拍张照，别只会自欺欺人',
  wardrobe:'衣柜也给我收拾了',
  laundry:'脏衣服别继续发酵',
  bagreset:'包里那堆垃圾倒了',
  shoes:'鞋脏成那样你也穿得出去？',
  scent:'先别让自己闻着像事故现场',
  spark:'先让个男人看着你硬起来',
  sample:'第一次精液，别空手回来',
  oral:'这张嘴总得有点别的用处',
  repeat:'操过一次还想再操你',
  drain:'都上床了就把精液榨干净',
  audit:'让我重新看看你到底救回来多少',
  contract:'你现在还没资格知道',
  override:'真有本事就拿一次越级奖励',
};

const CHARM_GAIN_CLASS = {
  // Fine cleanup/presentation: early repairs barely move overall attractiveness;
  // later refinement matters much more once the base is no longer disastrous.
  lip1:'polish', hair1:'polish', skin1:'polish', posture1:'polish', leg1:'polish', neck1:'polish',
  scent1:'polish', breath1:'polish', voice1:'polish', touch1:'polish', scent2:'polish',
  charmseal:'none',

  // Structural/proportion changes have more visual leverage at every level.
  face1:'structural', eye1:'structural', face2:'structural', bodyfat1:'structural',
  waist1:'structural', bust1:'structural',

  // Adult-response upgrades affect sexual experience, not outward CHARM.
  sensitive1:'none', arousal1:'none', lubrication1:'none', orgasm1:'none', recovery1:'none',
};

const CHARM_GAIN_LADDERS = {
  // I = rescue, II = visible improvement, III = real refinement,
  // IV = high-end polishing (normally already inside the SV era).
  polish:[0.4,1.0,2.0,3.3],
  structural:[0.8,1.6,3.0,4.5],
  none:[0,0,0,0],
};

function staticCharmGain(item,state=runtimeState(),view=null){
  if(!item) return 0;
  const resolved=view||staticShopView(item,state);
  const cls=CHARM_GAIN_CLASS[item.id]||'none';
  const ladder=CHARM_GAIN_LADDERS[cls]||CHARM_GAIN_LADDERS.none;
  const level=Math.max(1,Math.min(4,Number(resolved.nextLevel)||1));
  return Number(ladder[level-1]||0);
}

function cumulativeCharmForStaticUpgrade(id,level){
  const cls=CHARM_GAIN_CLASS[id]||'none';
  const ladder=CHARM_GAIN_LADDERS[cls]||CHARM_GAIN_LADDERS.none;
  const count=Math.max(0,Math.min(4,Number(level)||0));
  return ladder.slice(0,count).reduce((sum,value)=>sum+Number(value||0),0);
}

function migrateLegacyCharmLadder(state=runtimeState()){
  state.runtime=state.runtime||{};
  if(state.runtime.charmLadderMigratedV1) return false;
  state.runtime.charmLadderMigratedV1=true;

  const current=Math.max(0,Number(state.host?.charm)||0);
  // Advanced saves may already contain SV-era progression from several old
  // versions; do not rewrite them retroactively.
  if(current<=0 || current>=AP_CHARM_CAP) return true;

  let oldStatic=0;
  let newStatic=0;
  for(const upgrade of Object.values(state.upgrades||{})){
    const id=String(upgrade?.id||'');
    const cls=CHARM_GAIN_CLASS[id]||'none';
    if(cls==='none') continue;
    const level=Math.max(0,Math.min(4,Number(upgrade?.level)||0));
    const oldPerLevel=cls==='structural'?2.1:1.3;
    oldStatic+=oldPerLevel*level;
    newStatic+=cumulativeCharmForStaticUpgrade(id,level);
  }

  // Anything not explained by old static-shop math is preserved as plot/dynamic
  // contribution, so old temporary story upgrades are not erased.
  const residual=Math.max(0,current-oldStatic);
  const migrated=Math.min(AP_CHARM_CAP,Math.round((residual+newStatic)*10)/10);
  state.host.charm=migrated;
  state.host.progress=migrated;
  return true;
}

const SHOP_MAX_LEVEL = {
  lip1:3, hair1:4, skin1:4, face1:3, eye1:3, face2:3,
  posture1:3, bodyfat1:4, waist1:4, leg1:3, neck1:3, bust1:4,
  scent1:3, breath1:3, voice1:4, touch1:3, scent2:3,
  sensitive1:4, arousal1:4, lubrication1:4, orgasm1:4, recovery1:4,
  charmseal:1,
};

const SHOP_PHASES = [
  {id:'rescue', minLevels:0, label:'抢救货架', code:'RESCUE', level:1},
  // Level II should feel like continuing a chosen route, not clearing the whole starter shop.
  {id:'refine', minLevels:2, label:'精修货架', code:'REFINE', level:2},
  // Level III/IV remain progressively stricter so late-game transformation still has pacing.
  {id:'beauty', minLevels:8, label:'美女货架', code:'BEAUTY', level:3},
  {id:'advanced', minLevels:18, label:'高阶货架', code:'ADVANCED', level:4},
];

const SHOP_PRICE_MULTIPLIERS = [1,1.45,2.05,2.8];
const ROMAN_LEVELS = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ'];
const SHOP_LEVEL_PREFIXES = {
  2:['半成品别急着得意','既然救回来了就继续修','总算配做第二轮了','别卡在能看这一步'],
  3:['现在才轮得到精修','总算能往美女那边改了','这回别把好底子糟蹋了','终于不是单纯抢救了'],
  4:['这张脸现在值得我认真挑','别浪费现在这副身子','高阶货不卖给半成品','现在才配碰这种东西'],
};

const BODY_EFFECTS = {
  lip1:{lips:1},
  hair1:{hair:1},
  skin1:{skin:1},
  face1:{face:1},
  eye1:{eyes:1},
  face2:{face:1},
  posture1:{posture:1},
  bodyfat1:{bodyShape:1},
  waist1:{waistHip:1},
  leg1:{legs:1},
  neck1:{neckShoulders:1},
  bust1:{bust:1},
  scent1:{scent:1},
  breath1:{breath:1},
  voice1:{voice:1},
  touch1:{touch:1},
  scent2:{scent:1},
  sensitive1:{sensitivity:1},
  arousal1:{arousal:1},
  lubrication1:{lubrication:1},
  orgasm1:{orgasm:1},
  recovery1:{recovery:1},
  charmseal:{specialMark:1},
};

const AP_CHARM_CAP = 30;

function itemImprovesAppearance(item){
  if(!item) return false;
  if(item.dynamic){
    return PLOT_CHARM_AXES.has(String(item.bodyAxis||'')) || PLOT_POLISH_AXES.has(String(item.bodyAxis||''));
  }
  return (CHARM_GAIN_CLASS[item.id]||'none')!=='none';
}

function svRefinementPriceFromAp(apPrice){
  const raw=Math.max(0,Number(apPrice)||0);
  return Math.max(25,roundEconomy(raw/7,5));
}

function shopPaymentMeta(item,state=runtimeState(),view=null){
  const resolved=view||staticShopView(item,state);
  if(item.currency==='LOCK') return {currency:'LOCK',price:0,switched:false};
  if(item.category==='dailygoods') return {currency:'AP',price:resolved.price,switched:false,reason:'生活商品只收 AP'};
  const charm=Math.max(0,Number(state.host?.charm)||0);
  const switchToSv=item.currency==='AP' && itemImprovesAppearance(item) && charm>=AP_CHARM_CAP;
  if(switchToSv){
    return {
      currency:'SV',
      price:svRefinementPriceFromAp(resolved.price),
      switched:true,
      reason:`CHARM ${AP_CHARM_CAP} 后的外貌精修只收 SV`,
    };
  }
  return {currency:item.currency,price:resolved.price,switched:false,reason:''};
}

const BODY_AXES = new Set([
  'lips','face','eyes','skin','hair','posture','bodyShape','waistHip','legs',
  'neckShoulders','bust','scent','breath','voice','touch','sensitivity',
  'arousal','lubrication','orgasm','recovery','specialMark'
]);

const REQUIRE_UPGRADE = {
  waist1:'bodyfat1',
  leg1:'posture1',
  neck1:'posture1',
  touch1:'skin1',
};

const REQUIRE_TASK = {
  sensitive1:'sample',
  lubrication1:'sample',
};

function runtimeState(){
  return getState();
}

function bodyLevel(key,state=runtimeState()){
  return Math.max(0,Number(state.host?.body?.[key])||0);
}

function bodyScore(keys,state=runtimeState()){
  const list=Array.isArray(keys)?keys:[keys];
  const total=list.reduce((sum,key)=>sum+bodyLevel(key,state),0);
  return Math.min(100,Math.max(2,4+total*18));
}

function bodyStatus(keys,baseline,levels,state=runtimeState()){
  const list=Array.isArray(keys)?keys:[keys];
  const total=list.reduce((sum,key)=>sum+bodyLevel(key,state),0);
  if(total<=0) return baseline;
  const options=Array.isArray(levels)?levels:[String(levels||'已改善')];
  return options[Math.min(options.length-1,total-1)] || options[options.length-1];
}

const SHOP_PHASE_EXCLUDED = new Set(['sensitive1','arousal1','lubrication1','orgasm1','recovery1']);

function totalUpgradeLevels(state=runtimeState()){
  return Object.values(state.upgrades||{}).reduce((sum,item)=>sum+Math.max(0,Number(item?.level)||0),0);
}

function shopProgressLevels(state=runtimeState()){
  return Object.values(state.upgrades||{}).reduce((sum,item)=>{
    if(SHOP_PHASE_EXCLUDED.has(String(item?.id||''))) return sum;
    return sum+Math.max(0,Number(item?.level)||0);
  },0);
}

function currentShopPhase(state=runtimeState()){
  const total=shopProgressLevels(state);
  return [...SHOP_PHASES].reverse().find(phase=>total>=phase.minLevels) || SHOP_PHASES[0];
}

function shopPhaseForLevel(level=1){
  return SHOP_PHASES[Math.max(0,Math.min(SHOP_PHASES.length-1,Number(level||1)-1))] || SHOP_PHASES[0];
}

function staticShopView(item,state=runtimeState()){
  if(item.dynamic){
    const ownedLifestyle=Boolean(state.inventory?.items?.[item.id]);
    return {
      currentLevel:item.category==='dailygoods' && ownedLifestyle ? 1 : 0,
      nextLevel:1,
      maxLevel:1,
      soldOut:item.category==='dailygoods'
        ? Boolean(ownedLifestyle && !item.consumable)
        : Boolean(state.upgrades?.[item.id]),
      price:Number(item.price)||0,
      phase:currentShopPhase(state),
      phaseUnlocked:true,
    };
  }
  const currentLevel=Math.max(0,Number(state.upgrades?.[item.id]?.level)||0);
  const maxLevel=Math.max(1,Number(SHOP_MAX_LEVEL[item.id])||1);
  const nextLevel=Math.min(maxLevel,currentLevel+1);
  const soldOut=currentLevel>=maxLevel;
  const phase=shopPhaseForLevel(nextLevel);
  const currentPhase=currentShopPhase(state);
  const phaseUnlocked=currentPhase.level>=phase.level;
  const mult=SHOP_PRICE_MULTIPLIERS[nextLevel-1] || SHOP_PRICE_MULTIPLIERS[SHOP_PRICE_MULTIPLIERS.length-1];
  const price=Math.max(0,Math.round((Number(item.price)||0)*mult/10)*10);
  return {currentLevel,nextLevel,maxLevel,soldOut,price,phase,phaseUnlocked,currentPhase};
}

function levelledShopTitle(item,state=runtimeState()){
  const view=staticShopView(item,state);
  if(item.dynamic) return item.title;
  const clean=String(item.title||'').replace(/[ⅠⅡⅢⅣ]+$/,'').trim();
  const roman=ROMAN_LEVELS[Math.max(0,view.nextLevel-1)] || '';
  if(view.nextLevel<=1) return RUDE_SHOP_NAMES[item.id] || `${clean}${roman}`;
  const prefixes=SHOP_LEVEL_PREFIXES[view.nextLevel] || SHOP_LEVEL_PREFIXES[4];
  const prefix=prefixes[hashId(item.id+`_${view.nextLevel}`)%prefixes.length];
  return `${prefix} · ${clean}${roman}`;
}

function attitude(state=runtimeState()){
  const charm=Number(state.host?.charm)||0;
  return VOICE_STAGES.find(stage=>charm>=stage.min && charm<=stage.max) || VOICE_STAGES[0];
}

function toneIndex(state=runtimeState()){
  return Math.max(0, VOICE_STAGES.findIndex(stage=>stage.id===attitude(state).id));
}

function pickStable(lines, state=runtimeState(), salt=0){
  if(!Array.isArray(lines)||!lines.length) return '';
  const seed=(Number(state.host?.charm)||0)+(Number(state.history?.length)||0)+(Number(salt)||0);
  const index=Math.floor(Math.abs(Number.isFinite(seed)?seed:0))%lines.length;
  return String(lines[index] ?? lines[0] ?? '').trim();
}

function systemHomeLine(state=runtimeState()){
  const stage=attitude(state);
  return pickStable(stage?.home,state,3) || '“啧。”';
}

function shopVoiceName(item,state=runtimeState()){
  if(item.dynamic) return item.title;
  return levelledShopTitle(item,state);
}

function shopVoiceDesc(item,state=runtimeState()){
  if(item.dynamic) return item.desc;
  const view=staticShopView(item,state);
  const i=toneIndex(state);
  if(view.nextLevel===1 && i===0) return RUDE_SHOP_DESCS[item.id] || item.desc;
  const remarks=STAGE_REMARKS[i] || STAGE_REMARKS[1];
  const remark=remarks[hashId(item.id+`_${view.nextLevel}`)%remarks.length];
  const levelNote=view.nextLevel===1
    ? ''
    : view.nextLevel===2
      ? '这轮不是救命，是把上次那点半成品继续往上拽。'
      : view.nextLevel===3
        ? '做到这一级才算真正开始精修，别拿Ⅰ级效果冒充美女。'
        : '这是高阶细调，已经不是给惨不忍睹阶段擦屁股的货。';
  return `${remark} ${levelNote} ${item.desc}`.trim();
}

function taskVoiceName(task,state=runtimeState()){
  if(task.dynamicTask || task.dynamicDailyTask || task.canonicalMarker || task.legacyMigrated) return task.title;
  const i=toneIndex(state);
  if(i===0) return RUDE_TASK_NAMES[task.id] || task.title;
  if(i===1) return task.title + ' · 别偷懒';
  if(i===2) return task.title;
  if(i===3) return task.title + ' · 给我看看';
  return task.title + ' · 乖一点';
}

function taskVoiceDesc(task,state=runtimeState()){
  if(task.dynamicTask || task.dynamicDailyTask || task.canonicalMarker || task.legacyMigrated) return task.desc;
  const storyDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  if(task.id==='clean' && storyDay===1 && !state.tasks?.everCompleted?.clean){
    return '刚才还在床上摸自己，手都没洗就别跟我谈改造。先洗头、洗澡、刷牙、换掉这身衣服。至少先把自慰现场和自己收拾得像个人。';
  }
  const i=toneIndex(state);
  if(i===0) return RUDE_TASK_DESCS[task.id] || task.desc;
  const pools={
    1:['做完再来邀功。','别偷懒，我会看结果。','先把这件事做好。','这次别敷衍。'],
    2:['认真做，我会记。','这次做像样一点。','去吧，回来给我看结果。','别让我觉得你又退步了。'],
    3:['去做。我想看结果。','这次我亲自验收。','别让我白等。','做好一点，别浪费现在这张脸。'],
    4:['去做。长成美女以后总得有点美女的效率。','我会验收，别擅自脑补别的。','别磨蹭。我只是想看完成度。','做漂亮点，省得我还得挑第二遍。'],
    5:['去。别仗着好看就偷懒。','这次我会看得很仔细，别误会。','做完回来。你现在至少值得我认真验收。','别让我觉得这张脸配不上你的执行力。'],
  };
  const pool=pools[i]||pools[1];
  return `${pool[hashId(task.id)%pool.length]} ${task.desc}`;
}

function currentView(){
  return document.querySelector('#meme-os-dialog .meme-scroll')?.dataset?.view || 'home';
}

function pendingFor(kind,id,state=runtimeState()){
  return state.pending?.some(action=>{
    if(kind==='purchase') return action.effect?.purchase?.id===id || action.effect?.inventoryAdd?.id===id;
    if(kind==='taskAccept') return action.effect?.taskAccept?.id===id;
    return false;
  }) || false;
}

function parseTaskReward(label=''){
  const text=String(label||'');
  const ap=Number(text.match(/AP \+(\d+)/)?.[1]||0);
  const sv=Number(text.match(/SV \+(\d+)/)?.[1]||0);
  return {ap,sv};
}

function taskReward(task,state=runtimeState()){
  const repeated=task.repeatable==='daily' && Boolean(state.tasks?.everCompleted?.[task.id]);
  return parseTaskReward(repeated ? (task.repeatReward||task.reward) : task.reward);
}

function taskRewardLabel(task,state=runtimeState()){
  const repeated=task.repeatable==='daily' && Boolean(state.tasks?.everCompleted?.[task.id]);
  return repeated ? (task.repeatReward||task.reward) : task.reward;
}

function taskUnlock(task,state=runtimeState()){
  const charm=Number(state.host?.charm)||0;
  if(task.dynamicTask){
    const tierMeta=DYNAMIC_DESIRE_TIERS[Math.max(1,Math.min(4,Number(task.tier)||1))] || DYNAMIC_DESIRE_TIERS[1];
    if(charm<tierMeta.minCharm) return {ok:false,reason:`CHARM ${tierMeta.minCharm}`};
  }
  const map={spark:8,sample:12,oral:15,repeat:18,drain:25};
  if(map[task.id] && charm<map[task.id]) return {ok:false,reason:`CHARM ${map[task.id]}`};
  if(task.id==='contract') return {ok:false,reason:'条件未知'};
  if(task.id==='override') return {ok:false,reason:'由剧情触发'};
  return {ok:true,reason:''};
}

function shopRequirement(item,state=runtimeState()){
  const charm=Number(state.host?.charm)||0;
  const view=staticShopView(item,state);
  if(view.soldOut) return {ok:false,reason:'已经改到当前上限'};
  if(item.currency==='LOCK') return {ok:false,reason:item.req||'SYSTEM LOCK'};
  if(!view.phaseUnlocked){
    return {ok:false,reason:`${view.phase.label} · 总改造累计 ${view.phase.minLevels} 级`};
  }
  const min=Number(item.req?.match(/CHARM (\d+)/)?.[1]||0);
  if(view.nextLevel===1 && min && charm<min) return {ok:false,reason:`CHARM ${min}`};
  const needUpgrade=REQUIRE_UPGRADE[item.id];
  if(view.nextLevel===1 && needUpgrade && !state.upgrades?.[needUpgrade]) return {ok:false,reason:'前置改造未完成'};
  if(view.nextLevel===1 && item.id==='posture1'){
    const dailyDone=['clean','mirror','walk','posture','outfit'].some(id=>Boolean(state.tasks?.everCompleted?.[id]));
    if(!dailyDone) return {ok:false,reason:'先完成至少一项日常任务'};
  }
  const needTask=REQUIRE_TASK[item.id];
  if(view.nextLevel===1 && needTask && !state.tasks?.completed?.[needTask]) return {ok:false,reason:'前置欲望任务未完成'};
  const payment=shopPaymentMeta(item,state,view);
  return {ok:true,reason:payment.switched?payment.reason:''};
}

function pendingTrayMarkup(state=runtimeState()){
  if(!state.pending?.length) return '';
  return `
    <section class="meme-pending-tray">
      <div class="meme-pending-title"><span>PENDING ACTION</span><b>${state.pending.length}</b></div>
      ${state.pending.map(action=>`
        <div class="meme-pending-item">
          <span>${action.title || '待结算操作'}</span>
          <button type="button" data-remove-pending="${action.id}">撤销</button>
        </div>
      `).join('')}
      <p>还没发送就不会生效。任务接取只登记状态；奖励要等剧情验收通过后由扩展自动结算。</p>
    </section>
  `;
}

async function queueAction(action){
  if(!hasActiveChat()){
    globalThis.toastr?.warning?.('先打开角色聊天。连账本都没有，我给你结算到空气里？');
    return;
  }
  await addPendingAction(action);
  appendToInput(action.text);
  renderView(currentView(),false);
  globalThis.toastr?.success?.('已经塞进输入框。没发送之前还能反悔。');
}

function findShopItem(id){
  const dailyItem=getLifestyleShelf().find(item=>item.id===id);
  if(dailyItem) return {...dailyItem,category:'dailygoods'};
  const dynamic=getDynamicShop();
  const plotItem=dynamic.find(item=>item.id===id);
  if(plotItem) return {...plotItem,category:'plot'};
  for(const [category,items] of Object.entries(SHOP_DATA)){
    const item=items.find(x=>x.id===id);
    if(item) return {...item,category};
  }
  return null;
}

function findTask(id,state=runtimeState()){
  const generatedDaily=(state.tasks?.generatedDaily||[]).find(task=>task.id===id);
  if(generatedDaily) return {...generatedDaily,category:'daily',dynamicDailyTask:true};
  const generated=(state.tasks?.generated||[]).find(task=>task.id===id);
  if(generated) return {...generated,category:'desire',dynamicTask:true};
  for(const [category,tasks] of Object.entries(TASK_DATA)){
    const task=tasks.find(x=>x.id===id);
    if(task) return {...task,category};
  }
  return null;
}

function positionLauncher(button) {
  const width = 44;
  const height = 40;
  const gap = 18;
  const viewportWidth = window.visualViewport?.width || window.innerWidth;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const viewportTop = window.visualViewport?.offsetTop || 0;
  const viewportLeft = window.visualViewport?.offsetLeft || 0;

  // Some mobile SillyTavern layouts leave a hidden/zero-size #send_but in the DOM.
  // Never anchor the launcher to a zero-size or off-screen placeholder.
  const candidates = [...document.querySelectorAll('[id="send_but"], #send_form button[type="submit"], #send_form .send_but')];
  const send = candidates.find(el => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width >= 24
      && rect.height >= 24
      && rect.right > viewportLeft
      && rect.left < viewportLeft + viewportWidth
      && rect.bottom > viewportTop
      && rect.top < viewportTop + viewportHeight;
  });

  if (!send) {
    button.style.left = 'auto';
    button.style.top = 'auto';
    button.style.right = '18px';
    button.style.bottom = '112px';
    return;
  }

  const rect = send.getBoundingClientRect();
  const minLeft = viewportLeft + 8;
  const maxLeft = viewportLeft + viewportWidth - width - 8;
  const desiredLeft = rect.left + (rect.width - width) / 2 - 8;
  const left = Math.max(minLeft, Math.min(maxLeft, desiredLeft));
  const top = Math.max(viewportTop + 8, rect.top - height - gap);

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
    memory: '✧',
    home: '⌂',
  };
  return icons[type] || '•';
}

function adminDisplayName(state=runtimeState()){
  const name=String(state.system?.name||'').trim();
  return name || 'ADMINISTRATOR';
}

const SYSTEM_ACCESS_STAGES = ['locked','peek','open','private'];

function systemAccessStage(state=runtimeState()){
  const raw=String(state.system?.accessStage||'').toLowerCase();
  if(SYSTEM_ACCESS_STAGES.includes(raw)) return raw;
  return state.system?.pageUnlocked ? 'open' : 'locked';
}

function systemAccessRank(state=runtimeState()){
  return Math.max(0,SYSTEM_ACCESS_STAGES.indexOf(systemAccessStage(state)));
}

function systemAccessMeta(state=runtimeState()){
  const stage=systemAccessStage(state);
  return {
    locked:{label:'LOCKED',sub:'他没允许你看'},
    peek:{label:'PEEK',sub:'只准你看一点'},
    open:{label:'OPEN',sub:'基本档案开放'},
    private:{label:'PRIVATE',sub:'私人权限开放'},
  }[stage];
}

function systemOpenReady(state=runtimeState()){
  const m=state.permission?.milestones||{};
  return systemAccessStage(state)==='peek' &&
    Number(state.permission?.adminInterestSignals||0)>=4 &&
    Number(m.completedTasks||0)>=3 &&
    Number(m.purchasedUpgrades||0)>=2;
}

function systemPrivateReady(state=runtimeState()){
  return systemAccessStage(state)==='open' &&
    Number(state.permission?.adminInterestSignals||0)>=6 &&
    (Number(state.permission?.adminAttachmentSignals||0)>=1 || Boolean(state.permission?.adminLove));
}

const SYSTEM_EVOLUTION = {
  1:{form:'意识体',label:'意识体',capability:'只能在宿主意识中说话，没有可见身体，也不能触碰现实。'},
  2:{form:'Q版可视体',label:'Q版可视',capability:'宿主可以直接看见他的Q版形态；仍然没有实体触碰能力。'},
  3:{form:'有限成年实体',label:'有限实体',capability:'可以短时间以成年实体出现并触碰现实，但具现时间和行动范围仍受系统限制。'},
  4:{form:'完全具现',label:'完全具现',capability:'拥有稳定成年实体与自主行动能力，可离开宿主身边活动并与现实世界发生物理互动。'},
};

function systemEvolutionReadiness(state=runtimeState(),targetLevel=(Number(state.system?.level)||1)+1){
  const current=Math.max(1,Math.min(4,Number(state.system?.level)||1));
  const target=Math.max(1,Math.min(4,Number(targetLevel)||current));
  if(target!==current+1) return {ok:false,reason:'只能逐级进化',target};
  const day=Math.max(1,Number(state.tasks?.storyDay)||1);
  const eroticTasks=distinctEroticTaskCount(state);
  const upgrades=totalUpgradeLevels(state);

  if(target===2){
    return {
      ok:day>=2 && eroticTasks>=3 && upgrades>=4,
      reason:'需要更稳定的周目运行与基础改造进度',
      target,
    };
  }
  if(target===3){
    return {
      ok:day>=5 && eroticTasks>=8 && upgrades>=16,
      reason:'需要中期任务与改造进度支撑实体化',
      target,
    };
  }
  if(target===4){
    return {
      ok:day>=9 && eroticTasks>=18 && upgrades>=34,
      reason:'需要长线周目进度支撑稳定具现',
      target,
    };
  }
  return {ok:false,reason:'已经到最高等级',target};
}

function currentSystemEvolution(state=runtimeState()){
  const level=Math.max(1,Math.min(4,Number(state.system?.level)||1));
  return SYSTEM_EVOLUTION[level] || SYSTEM_EVOLUTION[1];
}

function nextSystemEvolution(state=runtimeState()){
  const current=Math.max(1,Math.min(4,Number(state.system?.level)||1));
  if(current>=4) return null;
  const target=current+1;
  return {
    level:target,
    ...SYSTEM_EVOLUTION[target],
    readiness:systemEvolutionReadiness(state,target),
  };
}

function totalMenCount() {
  const men = runtimeState().men || {};
  return ['current','recent','returning'].reduce((sum, key) => sum + (men[key]?.length || 0), 0);
}

function moduleCard(key,title,sub){
  const state=runtimeState();
  const access=systemAccessMeta(state);
  const systemLocked=key==='system' && systemAccessStage(state)==='locked';
  const resolvedSub=key==='men'
    ? `${sub} · ${totalMenCount()}`
    : key==='system'
      ? access.sub
      : sub;
  return `
    <button type="button" class="meme-module ${systemLocked?'is-system-locked':''}" data-meme-module="${key}" ${systemLocked?'data-system-locked="true"':''}>
      <span class="meme-module-icon">${systemLocked?'⌁':moduleIcon(key)}</span>
      <span class="meme-module-copy"><b>${title}</b><small>${resolvedSub}</small></span>
      <span class="meme-module-arrow">${systemLocked?'×':'›'}</span>
    </button>
  `;
}

function formatCharm(value){
  const n=Math.round((Number(value)||0)*10)/10;
  return Number.isInteger(n)?String(n):n.toFixed(1);
}

function statsMarkup(compact = false) {
  const state=runtimeState();
  return `
    <div class="meme-stat-grid ${compact ? 'meme-stat-grid--compact' : ''}">
      <article><small>AP</small><strong>${String(state.resources.ap).padStart(3,'0')}</strong><em>改造点</em></article>
      <article><small>SV</small><strong>${String(state.resources.sv).padStart(3,'0')}</strong><em>精液值</em></article>
      <article><small>CHARM</small><strong>${formatCharm(state.host.charm)}</strong><em>综合魅力</em></article>
    </div>
  `;
}

function memoryLayerMarkup(title,code,items,emptyText,open=false){
  const list=Array.isArray(items)?items:[];
  return `
    <details class="meme-memory-layer" ${open?'open':''}>
      <summary><span><small>${code}</small><b>${title}</b></span><em>${list.length}</em></summary>
      <div class="meme-memory-body">
        ${list.length
          ? list.map((item,index)=>`<article><i>${String(index+1).padStart(2,'0')}</i><p>${escapeUiText(item)}</p></article>`).join('')
          : `<p class="meme-memory-empty">${emptyText}</p>`}
      </div>
    </details>
  `;
}

function memoryMarkup(){
  const state=runtimeState();
  const memory=state.memory||{};
  const initialized=Boolean(memory.initialized);
  return `
    ${pageHeader('CONTEXT VAULT','MEMORY · 我替你记着',initialized?'SYNCED':'BOOTSTRAP')}
    <section class="meme-page-card">
      <div class="meme-card-title">
        <small>MEMORY STATUS</small>
        <h3>${initialized?'旧账已经接上了':'等下一轮自动巡查旧聊天'}</h3>
      </div>
      ${labelValue('回填状态',initialized?'BOOTSTRAPPED':'PENDING',initialized?`首次回填参考了约 ${Number(memory.sourceTurns)||0} 条可见消息`:'第一次生成回复时，会回看当前模型能看到的旧聊天后再建档。')}
      ${labelValue('滚动规则',`SHORT ${(memory.short||[]).length}/15 · LONG ${(memory.long||[]).length}/10`,'每回合一条短记忆；15条压1条长期，10条长期压1条永久。永久记忆不清空。')}
    </section>

    <section class="meme-memory-stack">
      ${memoryLayerMarkup('近期','SHORT',memory.short,'下一回合会记下第一条短期记忆。',true)}
      ${memoryLayerMarkup('长期','LONG',memory.long,'每满15条短期记忆，会压成约200字长期记忆。')}
      ${memoryLayerMarkup('永久','PERMANENT',memory.permanent,'每满10条长期记忆，会压成一条永久记忆；这里不会因滚动压缩而消失。')}
    </section>
  `;
}

function homeMarkup() {
  const state=runtimeState();
  const voice=attitude(state);
  const nextUnlock=state.host.charm<8 ? 'CHARM 8 · 欲望任务' : '欲望任务已开放';
  const activeCount=Object.keys(state.tasks?.active||{}).length;
  return `
    ${pendingTrayMarkup(state)}
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
      <p class="meme-contract-label">DESIRE ENGINE · ${voice.code}</p>
      <h2>${state.host.stage}</h2>
      <p class="meme-contract-copy">“${voice.label}。别急着高兴，你现在离让我满意还远。”</p>
      <div class="meme-progress"><span style="width:${Math.max(3,Math.min(100,state.host.progress||0))}%"></span></div>
      ${statsMarkup()}
    </section>

    <section class="meme-home-strip">
      <article><small>CURRENT TASK</small><b>${activeCount ? `已挂上 ${activeCount} 项` : '一项都没接'}</b><em>${activeCount ? '做完再回来邀功' : '去 TASK，别装忙'}</em></article>
      <article><small>NEXT UNLOCK</small><b>${nextUnlock}</b><em>我说开才开</em></article>
    </section>

    <section class="meme-whisper-card">
      <span>♛</span>
      <div><small>${adminDisplayName(state)} · ${voice.label}</small><b>${systemHomeLine(state)}</b></div>
    </section>

    <section class="meme-modules">
      <div class="meme-section-head">
        <div><small>PRIVATE ACCESS</small><h3>想看什么自己点</h3></div>
        <span>8 / 8</span>
      </div>
      <div class="meme-module-grid">
        ${moduleCard('me','ME','看看这副身子还剩多少能救')}
        ${moduleCard('task','TASK','去干活，别光会发骚')}
        ${moduleCard('shop','SHOP','花钱把这副身子修得能看')}
        ${moduleCard('men','MEN','睡过你、想睡你的男人')}
        ${moduleCard('system','SYSTEM','看我干什么')}
        ${moduleCard('record','RECORD','你干过的脏事我都记着')}
        ${moduleCard('memory','MEMORY','前面的事别指望我忘')}
        ${moduleCard('home','HOME','滚回总览')}
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
  const state=runtimeState();
  const voice=attitude(state);
  const initial=toneIndex(state)===0;
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('HOST PROFILE','ME · 宿主改造',voice.code)}
    ${statsMarkup(true)}

    <section class="meme-page-card">
      <div class="meme-card-title"><small>CURRENT STATE</small><h3>${initial ? '这就是我抽到的宿主？' : '现在总算有点变化了'}</h3></div>
      ${labelValue('改造阶段', state.host.stage, `${Number(state.host.progress||0).toFixed(1)}%`)}
      ${labelValue('系统总评', initial ? '肥胖 / 油腻 / 邋遢 / 明显难看' : voice.label)}
      ${labelValue('综合魅力', `${state.host.charm} / 100`, voice.code)}
      ${labelValue('绑定状态', '跑不掉', 'ACTIVE')}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>BASELINE SCAN</small><h3>${initial ? '别躲，难看也得看完' : '复检结果'}</h3></div>
      <div class="meme-scan-list">
        ${scanRow('面部',bodyStatus(['lips','face','eyes'],'浮肿 / 比例不协调 / 唇部状态差',['局部开始修复','轮廓与细节已有改善','五官协调度明显提升','面部进入精修状态'],state),bodyScore(['lips','face','eyes'],state),bodyLevel('lips',state)+bodyLevel('face',state)+bodyLevel('eyes',state)>0?'low':'bad')}
        ${scanRow('体型',bodyStatus(['bodyShape','waistHip','legs','neckShoulders','bust'],'明显肥胖 / 线条模糊',['整体轮廓开始调整','局部比例开始成形','体型与线条已有明显变化','身体比例进入精修状态'],state),bodyScore(['bodyShape','waistHip','legs','neckShoulders','bust'],state),bodyLevel('bodyShape',state)+bodyLevel('waistHip',state)+bodyLevel('legs',state)+bodyLevel('neckShoulders',state)+bodyLevel('bust',state)>0?'low':'bad')}
        ${scanRow('皮肤',bodyStatus(['skin','touch'],'粗糙 / 暗沉 / 出油',['肤质开始修复','细腻度与触感都在改善','皮肤状态已经明显精细'],state),bodyScore(['skin','touch'],state),bodyLevel('skin',state)+bodyLevel('touch',state)>0?'low':'bad')}
        ${scanRow('头发',bodyStatus('hair','油腻 / 毛躁 / 缺乏打理',['发质开始修复','头发状态明显改善','发质进入精修状态'],state),bodyScore('hair',state),bodyLevel('hair',state)>0?'low':'bad')}
        ${scanRow('气味',bodyStatus(['scent','breath'],'汗油味 / 近距离气息差',['基础气味开始清理','近距离气味明显改善','已经具备主动吸引力'],state),bodyScore(['scent','breath'],state),bodyLevel('scent',state)+bodyLevel('breath',state)>0?'low':'bad')}
        ${scanRow('声线',bodyStatus('voice','普通 / 没辨识度',['音色与稳定度开始调整','声线已有明显辨识度','声线进入精修状态'],state),bodyScore('voice',state),bodyLevel('voice',state)>0?'low':'bad')}
        ${scanRow('仪态',bodyStatus('posture','含胸 / 缩肩',['姿态开始修正','仪态已经明显舒展','仪态进入稳定精修'],state),bodyScore('posture',state),bodyLevel('posture',state)>0?'low':'bad')}
      </div>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>RECONSTRUCTION</small><h3>我允许你改的地方</h3></div>
      <div class="meme-upgrade-list">
        ${levelRow('面部精修',bodyLevel('face',state)+bodyLevel('eyes',state)+bodyLevel('lips',state)>0?'已启用':'未开始','轮廓、眼型、唇部与五官协调')}
        ${levelRow('体态塑形',bodyLevel('bodyShape',state)+bodyLevel('waistHip',state)+bodyLevel('legs',state)+bodyLevel('neckShoulders',state)+bodyLevel('bust',state)>0?'已启用':'未开始','整体体型、腰臀、腿型、肩颈与胸型')}
        ${levelRow('皮肤优化',bodyLevel('skin',state)+bodyLevel('touch',state)>0?'已启用':'未开始','肤质、细腻度、触感与光泽')}
        ${levelRow('发质系统',bodyLevel('hair',state)>0?'已启用':'未开始','清洁感、顺滑度与发丝状态')}
        ${levelRow('体香系统',bodyLevel('scent',state)+bodyLevel('breath',state)>0?'已启用':'未开始','体香、口腔气息与近距离存在感')}
        ${levelRow('声线调整',bodyLevel('voice',state)>0?'已启用':'未开始','音色、稳定度与辨识度')}
        ${levelRow('仪态修正',bodyLevel('posture',state)>0?'已启用':'未开始','站姿、坐姿、肩颈与动作习惯')}
        ${levelRow('成人反应',bodyLevel('sensitivity',state)+bodyLevel('arousal',state)+bodyLevel('lubrication',state)+bodyLevel('orgasm',state)+bodyLevel('recovery',state)>0?'已改造':state.tasks.completed.sample?'可解锁':'LOCKED','敏感度、欲望、分泌、高潮与恢复','SV · LOCK')}
      </div>
    </section>
  `;
}

function taskItem(task) {
  const state=runtimeState();
  const unlock=taskUnlock(task,state);
  const storyDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const repeatable=task.repeatable==='daily';
  const isRollingDaily=task.category==='daily';
  const dailyLike=isRollingDaily || repeatable;
  const activeRecord=state.tasks?.active?.[task.id];
  const active=Boolean(activeRecord) && (!repeatable || Number(activeRecord.storyDay||storyDay)===storyDay);
  const dailyRecord=state.tasks?.dailyCompleted?.[task.id];
  const justCompleted=isRollingDaily && Boolean(dailyRecord) && Number(dailyRecord.completedTurn??-1)===Number(state.shop?.plotTurn||0);
  const completed=isRollingDaily
    ? justCompleted
    : repeatable
      ? Number(dailyRecord?.day||0)===storyDay
      : Boolean(state.tasks?.completed?.[task.id]);
  const hasHistory=Boolean(state.tasks?.everCompleted?.[task.id]);
  const pending=pendingFor('taskAccept',task.id,state);
  let button='接取';
  if(!unlock.ok) button='没资格';
  else if(completed) button=dailyLike?'今天已完成':'已完成';
  else if(pending) button='待发送';
  else if(active) button='待验收';
  else if(repeatable && hasHistory) button='再做一次';

  const statusText=completed
    ? (dailyLike?'今天已完成':'已完成')
    : active
      ? '等待剧情验收'
      : repeatable && hasHistory
        ? '今日可重复'
        : unlock.ok?task.state:unlock.reason;

  return `
    <article class="meme-task-card ${!unlock.ok ? 'is-locked' : ''} ${completed?'is-done':''}" data-task-id="${task.id}">
      <div class="meme-task-top"><span>${task.type}</span><em>${statusText}</em></div>
      <div data-task-detail><h4>${taskVoiceName(task,state)}</h4><p>${taskVoiceDesc(task,state)}</p></div>
      <div class="meme-task-detail">${task.detail}</div>
      <div class="meme-task-foot">
        <b>${taskRewardLabel(task,state)}</b>
        <button type="button" data-task-action="${task.id}" ${(!unlock.ok||completed||pending||active)?'disabled':''}>${button}</button>
      </div>
    </article>
  `;
}

function renderTaskList(category='daily') {
  const state=runtimeState();
  const storyDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const activeIds=new Set(Object.keys(state.tasks?.active||{}));

  if(category==='desire' && Number(state.host?.charm||0)<8){
    return `
      <div class="meme-men-empty meme-desire-sealed">
        <small>DESIRE · SEALED</small>
        <b>未解锁</b>
        <p>权限不足。任务名称、对象、玩法、奖励与条件全部隐藏。</p>
      </div>
    `;
  }

  if(category==='daily'){
    const turn=Number(state.shop?.plotTurn)||0;
    const selected=currentStaticTaskPool('daily',state);
    const activeStatic=TASK_DATA.daily.filter(task=>activeIds.has(task.id) && !selected.some(item=>item.id===task.id));
    const base=[...selected,...activeStatic]
      .map(task=>({...task,category:'daily'}))
      .filter(task=>{
        const done=state.tasks?.dailyCompleted?.[task.id];
        if(Number(done?.day||0)!==storyDay) return true;
        return Number(done.completedTurn??-1)===turn;
      });

    const generatedDaily=(state.tasks?.generatedDaily||[])
      .filter(task=>Number(task.createdDay||storyDay)===storyDay || activeIds.has(task.id))
      .map(task=>({...task,category:'daily',dynamicDailyTask:true}))
      .filter(task=>{
        const done=state.tasks?.dailyCompleted?.[task.id];
        if(Number(done?.day||0)!==storyDay) return true;
        return Number(done.completedTurn??-1)===turn;
      });

    const all=[...base,...generatedDaily];
    return all.length
      ? all.map(task=>taskItem(task)).join('')
      : '<div class="meme-men-empty"><small>DAILY BOARD</small><b>今天暂时没新活</b><p>继续走剧情；自然日变化后任务池会重新洗牌。</p></div>';
  }

  const selected=currentStaticTaskPool(category,state);
  const activeStatic=(TASK_DATA[category]||[]).filter(task=>activeIds.has(task.id) && !selected.some(item=>item.id===task.id));
  const base=[...selected,...activeStatic]
    .map(task=>({...task,category}))
    .filter(task=>{
      if(category==='desire' && state.tasks?.completed?.[task.id] && task.repeatable!=='daily') return false;
      return true;
    });
  const generated=category==='desire'
    ? (state.tasks?.generated||[]).map(task=>({...task,category:'desire',dynamicTask:true}))
    : [];
  const all=[...base,...generated];
  if(category==='desire' && !all.length){
    return '<div class="meme-men-empty"><small>DESIRE BOARD</small><b>现在没活</b><p>欲望栏已经开放，但任务只从当前剧情和成年对象现场生成；没有合适情境时不会硬塞一条。</p></div>';
  }
  return all.map(task=>taskItem(task)).join('');
}

function taskMarkup() {
  const state=runtimeState();
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('MISSION CENTER','TASK · 去干活，别光发骚',`DAY ${String(Math.max(1,Number(state.tasks?.storyDay)||1)).padStart(3,'0')}`)}
    <div class="meme-tabbar" data-task-tabs>
      <button class="is-active" type="button" data-task-tab="daily">日常</button>
      <button type="button" data-task-tab="desire">欲望</button>
      <button type="button" data-task-tab="special">特殊</button>
    </div>
    <section class="meme-task-list" data-task-list>${renderTaskList('daily')}</section>
    <section class="meme-page-card meme-task-rules">
      <div class="meme-card-title"><small>MY RULES</small><h3>听清楚再接</h3></div>
      ${labelValue('日常','每天固定轮换 3 个基础日常；前两天出现过的任务优先禁止连续回池。当天完成后退出，剧情临时 TASK 另算，不占这 3 个位置。')}
      ${labelValue('欲望','CHARM 8 前完全封锁，不透任务内容。解锁后不抽固定池；按当前男人 × 地点 × CHARM × 性行为 × 限制条件 × 结算目标现场生成。男人类型不限，公开人格与私下XP可强烈反差。')}
      ${labelValue('不同任务',`${distinctEroticTaskCount(state)} 个已完成`,'重复做同一任务不重复计数')}
      ${labelValue('特殊','候选会随自然日轮换；真正的剧情放水任务不会高频出现。')}
      ${labelValue('结算','接取只登记任务，不要求立刻完成。以后剧情里什么时候真正做到，模型验收通过时扩展才发奖励并划掉任务。')}
    </section>
  `;
}

function inventoryItems(state=runtimeState()){
  return Object.values(state.inventory?.items||{})
    .filter(item=>Number(item.count||0)>0)
    .sort((a,b)=>Number(b.lastPurchasedAt||b.acquiredAt||0)-Number(a.lastPurchasedAt||a.acquiredAt||0));
}

function inventoryItemCard(item){
  const kindLabels={
    skincare:'护肤',food:'食物',daily:'日用',clothing:'穿搭',electronics:'电子',
    home:'家居',entertainment:'娱乐',service:'服务',other:'其他',plot:'剧情',
  };
  return `
    <article class="meme-shop-card">
      <span class="meme-shop-icon">◇</span>
      <div class="meme-shop-copy">
        <b>${item.title||'未命名物品'}</b>
        <p>${item.consumable?'消耗品，可以继续买。':'已经归你了。后面剧情要用的时候别装没买过。'}</p>
        <small>INVENTORY · ${kindLabels[item.kind]||'物品'} · 持有 ${Math.max(1,Number(item.count)||1)}</small>
      </div>
      <div class="meme-shop-buy">
        <strong>×${Math.max(1,Number(item.count)||1)}</strong><em>OWNED</em>
      </div>
    </article>
  `;
}

function shopItem(item,category) {
  const state=runtimeState();
  const view=staticShopView(item,state);
  const req=shopRequirement(item,state);
  const pending=pendingFor('purchase',item.id,state);
  const spendable=getSpendableResources(state);
  const payment=shopPaymentMeta(item,state,view);
  const enough=payment.currency==='AP' ? spendable.ap>=payment.price : payment.currency==='SV' ? spendable.sv>=payment.price : false;
  const soldOut=view.soldOut;
  let button=soldOut?'改满了':pending?'待发送':!req.ok?'锁着':!enough?'穷':'买';
  const levelMeta=item.dynamic
    ? (item.category==='dailygoods' ? `DAILY GOODS · ${String(item.kind||'daily').toUpperCase()}` : 'PLOT · 临时货')
    : `${view.phase.code} · ${view.currentLevel}/${view.maxLevel} → ${ROMAN_LEVELS[Math.max(0,view.nextLevel-1)]}`;

  return `
    <article class="meme-shop-card ${(!req.ok||soldOut)?'is-locked':''}" data-shop-id="${item.id}" data-shop-category="${category}">
      <span class="meme-shop-icon" data-shop-detail>${item.icon}</span>
      <div class="meme-shop-copy" data-shop-detail>
        <b>${soldOut ? (state.upgrades?.[item.id]?.title || state.inventory?.items?.[item.id]?.title || item.title) : shopVoiceName(item,state)}</b>
        <p>${soldOut ? (item.category==='dailygoods'?'买过了。耐用品又不是让你一天买八个。':'这项已经被你改到当前版本上限。再点也榨不出第五层。') : shopVoiceDesc(item,state)}</p>
        <small>${levelMeta} · ${req.ok ? (payment.switched ? '精液阶段 · AP 抢救上限已到' : (view.nextLevel===1 ? item.req : view.phase.label)) : req.reason}</small>
        <div class="meme-shop-detail">${item.detail}</div>
      </div>
      <div class="meme-shop-buy">
        <strong>${payment.currency==='LOCK'?'—':payment.price}</strong><em>${payment.currency}${item.id==='charmseal' ? ' · CHARM → 100' : (!item.dynamic && staticCharmGain(item,state,view)>0 ? ` · CHARM +${staticCharmGain(item,state,view)}` : '')}</em>
        <button type="button" data-shop-action="${item.id}" ${(soldOut||pending||!req.ok||!enough)?'disabled':''}>${button}</button>
      </div>
    </article>
  `;
}

function renderShopList(category='appearance') {
  if(category==='dailygoods'){
    const state=runtimeState();
    if((Number(state.host?.charm)||0)<AP_CHARM_CAP){
      return '<div class="meme-men-empty"><small>DAILY GOODS · LOCKED</small><b>CHARM 30 解锁</b><p>先把自己救到普通人的程度。后面这格才轮得到你逛。</p></div>';
    }
    const items=getLifestyleShelf(state);
    return items.length===5
      ? items.map(item=>shopItem(item,'dailygoods')).join('')
      : '<div class="meme-men-empty"><small>DAILY GOODS</small><b>货架还在整理</b><p>下一回合我会按你现在缺的东西塞满五格。</p></div>';
  }
  if(category==='plot'){
    const items=getDynamicShop();
    return items.map(item=>shopItem(item,'plot')).join('')
      || '<div class="meme-men-empty"><small>NO PLOT GOODS</small><b>现在没什么值得临时上架</b><p>剧情真发生点有意思的事，我自然会塞东西进来。</p></div>';
  }
  if(category==='inventory'){
    const items=inventoryItems();
    return items.map(inventoryItemCard).join('')
      || '<div class="meme-men-empty"><small>INVENTORY</small><b>空的</b><p>买点东西再来翻。</p></div>';
  }
  return (SHOP_DATA[category] || SHOP_DATA.appearance).map(item=>shopItem(item,category)).join('');
}

function shopMarkup() {
  const state=runtimeState();
  const spendable=getSpendableResources(state);
  const phase=currentShopPhase(state);
  const levels=shopProgressLevels(state);
  const nextPhase=SHOP_PHASES.find(item=>item.minLevels>levels) || null;
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('DESIRE MARKET','SHOP · 把这副身子修得能看',phase.code)}
    <section class="meme-page-card">
      <div class="meme-card-title"><small>CURRENT SHELF</small><h3>${phase.label}</h3></div>
      ${labelValue('外观进度',`${levels} 级`,nextPhase?`再完成 ${Math.max(0,nextPhase.minLevels-levels)} 级外观/感官改造开 ${nextPhase.label}`:'固定商城已到最高货架')}
      ${labelValue('货架规则','同一项目可以继续升Ⅱ / Ⅲ / Ⅳ级。','CHARM 30 前 AP 负责抢救；到 30 后外貌与身体精修自动改收 SV。')}
      ${labelValue('普通人上限',`CHARM ${AP_CHARM_CAP}`,Number(state.host?.charm||0)>=AP_CHARM_CAP?'身体精修改收 SV；AP 留着买生活货、便利和别的乱七八糟东西。':'日常和 AP 只能先把你救到普通、能看、有人愿意碰的程度。')}
      ${labelValue('日常用品',Number(state.host?.charm||0)>=AP_CHARM_CAP?'5 格动态货架':'LOCKED · CHARM 30','不按日期乱刷。你缺什么、提到什么、什么坏了，我才考虑换。')}
    </section>
    <div class="meme-shop-balance">
      <span><small>AP 可用</small><b>${String(spendable.ap).padStart(3,'0')}</b></span>
      <i></i>
      <span><small>SV 可用</small><b>${String(spendable.sv).padStart(3,'0')}</b></span>
    </div>
    <div class="meme-shop-filter" data-shop-filters>
      <button class="is-active" type="button" data-shop-filter="appearance">外貌</button>
      <button type="button" data-shop-filter="body">身体</button>
      <button type="button" data-shop-filter="sensory">感官</button>
      <button type="button" data-shop-filter="desire">欲望</button>
      <button type="button" data-shop-filter="special">特殊</button>
      ${getDynamicShop(state).length ? '<button type="button" data-shop-filter="plot">剧情 · '+getDynamicShop(state).length+'</button>' : ''}
      ${inventoryItems(state).length ? '<button type="button" data-shop-filter="inventory">持有 · '+inventoryItems(state).length+'</button>' : ''}
      <button type="button" data-shop-filter="dailygoods" ${Number(state.host?.charm||0)<AP_CHARM_CAP?'disabled aria-disabled="true"':''}>日常用品${Number(state.host?.charm||0)<AP_CHARM_CAP?' · LOCK':''}</button>
    </div>
    <section class="meme-shop-list" data-shop-list>${renderShopList('appearance')}</section>
    <p class="meme-preview-note">价格是我定的。买不起就去做任务，别一边穷一边对着改造项目发骚。</p>
  `;
}

function menPersonCard(person) {
  const id = person.id || Math.random().toString(36).slice(2,8);
  const badges = (person.badges || []).map(badge => `<span>${badge}</span>`).join('');
  return `
    <article class="meme-men-person" data-men-person="${id}">
      <button type="button" class="meme-men-person-head" data-men-person-toggle>
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
        ${labelValue('接触次数', String(person.contactCount||0), person.returnCount ? `再遇 ${person.returnCount} 次` : '')}
        ${labelValue('时间', `DAY ${String(person.lastSeenDay||1).padStart(3,'0')}`, `初见 DAY ${String(person.firstSeenDay||1).padStart(3,'0')}`)}
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
  const list = runtimeState().men?.[kind] || [];
  const body = list.length ? list.map(menPersonCard).join('') : menEmptyGroup(kind);
  return `
    <section class="meme-men-group ${defaultOpen ? 'is-open' : ''}" data-men-group="${kind}">
      <button type="button" class="meme-men-group-head" data-men-group-toggle>
        <span><small>${label}</small><b>${title}</b></span>
        <span class="meme-men-group-meta">${String(list.length).padStart(2,'0')} <i>⌄</i></span>
      </button>
      <div class="meme-men-group-body">${body}</div>
    </section>
  `;
}

function menMarkup() {
  const state=runtimeState();
  const count=totalMenCount();
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('TARGET ARCHIVE','MEN · 睡过你、想睡你的男人',String(count).padStart(2,'0'))}
    <section class="meme-men-summary">
      <div><small>CURRENT</small><b>${state.men.current.length}</b><em>正在碰</em></div>
      <div><small>RECENT</small><b>${state.men.recent.length}</b><em>刚碰过</em></div>
      <div><small>RETURNING</small><b>${state.men.returning.length}</b><em>又回来了</em></div>
    </section>
    <div class="meme-men-groups">
      ${menGroupMarkup('current','CURRENT','现在还没走的',true)}
      ${menGroupMarkup('recent','RECENT','最近留过痕迹的',false)}
      ${menGroupMarkup('returning','RETURNING','居然又找回来的',false)}
    </div>
    <section class="meme-page-card meme-men-rules">
      <div class="meme-card-title"><small>MY ARCHIVE RULE</small><h3>我没兴趣替你记每一个想往你身上蹭的男人</h3></div>
      ${labelValue('CURRENT','最多 3 个。只留现在剧情真正在碰的。')}
      ${labelValue('RECENT','最多 8 个。睡过、榨过、约过、留过联系方式才配进。')}
      ${labelValue('RETURNING','最多 5 个。真的再次出现才算，不叫长期对象。')}
      ${labelValue('路人','说两句话、看两眼就走的废物我懒得记。')}
      <p class="meme-men-rule-note">随机任务男只是任务对象。只有你主动再次找他、联系他或明确想继续，而且他通过长期质量锁，才会固化成有完整小传和独立生活线的人物。</p>
    </section>
  `;
}

function systemEvolutionLadderMarkup(state=runtimeState()){
  const level=Math.max(1,Math.min(4,Number(state.system?.level)||1));
  const next=nextSystemEvolution(state);
  const rows=[
    [1,'意识体','脑内声音 · 不可见 · 不可触碰'],
    [2,'Q版可视','宿主可见 · 无实体触碰'],
    [3,'有限成年实体','短时具现 · 可触碰 · 行动受限'],
    [4,'完全具现','稳定成年实体 · 自主行动'],
  ];
  return `
    <div class="meme-system-levels">
      ${rows.map(row=>`<article class="${level>=row[0]?'is-on':''}"><span>0${row[0]}</span><div><b>${row[1]}</b><small>${row[2]}</small></div></article>`).join('')}
    </div>
    <div class="meme-info-row">
      <span><small>NEXT EVOLUTION</small><b>${next ? `LV.${next.level} · ${next.label}` : 'MAX LEVEL'}</b></span>
      <em>${next ? (next.readiness.ok ? '资格已满足 · 等他自己触发' : '周目进度还不够') : '具现能力已完整'}</em>
    </div>
  `;
}

function systemAccessLadder(state=runtimeState()){
  const rank=systemAccessRank(state);
  const rows=[
    ['00','LOCKED','完全封闭 · 你连门都进不来'],
    ['01','PEEK','只给你看系统状态和表层资料'],
    ['02','OPEN','基本档案、进化与公开资料开放'],
    ['03','PRIVATE','私人偏好与更深资料开放'],
  ];
  return `
    <div class="meme-system-levels">
      ${rows.map((row,index)=>`<article class="${rank>=index?'is-on':''}"><span>${row[0]}</span><div><b>${row[1]}</b><small>${row[2]}</small></div></article>`).join('')}
    </div>
  `;
}

function lockedSystemMarkup(){
  const state=runtimeState();
  return `
    ${pageHeader('ACCESS DENIED','SYSTEM · LOCKED','LOCKED')}
    <section class="meme-system-locked-card">
      <div class="meme-admin-emblem">${crownMarkup()}</div>
      <small>PRIVATE ACCESS</small>
      <h3>谁准你翻我的档案了？</h3>
      <p>“门关着就是不想让你进。刷数字只能让你有资格站门口，开不开还是我说了算。”</p>
      <div class="meme-system-lock-hints">
        <span>持续完成任务</span>
        <span>真的发生改造</span>
        <span>让我开始对你有兴趣</span>
      </div>
      <span>满足资格后，也只可能先得到 PEEK。</span>
    </section>
    <section class="meme-page-card">
      <div class="meme-card-title"><small>ACCESS LADDER</small><h3>别想着一步翻到底。</h3></div>
      ${systemAccessLadder(state)}
    </section>
  `;
}

function systemMarkup() {
  const state=runtimeState();
  const voice=attitude(state);
  const stage=systemAccessStage(state);
  const rank=systemAccessRank(state);
  const access=systemAccessMeta(state);
  const evolution=currentSystemEvolution(state);
  const nextEvolution=nextSystemEvolution(state);
  const next=VOICE_STAGES[Math.min(VOICE_STAGES.length-1,toneIndex(state)+1)];
  const intro={
    peek:'只准你看一眼。能看到什么就看什么，手别往里面伸。',
    open:'基本档案给你开了。别把“允许查看”脑补成我在跟你交心。',
    private:'私人区给你进，不代表我从此什么都得向你汇报。少得寸进尺。',
  }[stage] || '';

  const snapshot=`
    <section class="meme-page-card">
      <div class="meme-card-title"><small>SYSTEM SNAPSHOT</small><h3>${rank===1?'只许看这些':'基础资料'}</h3></div>
      ${labelValue('识别',state.system?.name || 'SYSTEM / ADMINISTRATOR',state.system?.name?'HOST-NAMED':'SYSTEM ID')}
      ${labelValue('当前形态',state.system?.form || '意识体',`SYSTEM LV.${state.system?.level||1}`)}
      ${labelValue('当前能力',evolution.capability)}
      ${labelValue('运行状态',state.system?.status || 'ONLINE','ACTIVE')}
      ${labelValue('系统经历','跨世界、多类型任务','不是第一次上岗')}
      ${labelValue('本次绑定','纯随机','NO DESTINY')}
      ${state.system?.namingRightOffered && !state.system?.name ? labelValue('命名权','已由本人主动交给宿主','WAITING') : ''}
    </section>
  `;

  const openSections=rank>=2 ? `
    <section class="meme-system-meters">
      <article><small>综合魅力</small><b>${state.host.charm}</b><span><i style="width:${Math.min(100,state.host.charm)}%"></i></span></article>
      <article><small>当前态度</small><b>${voice.code}</b><span><i style="width:${Math.min(100,((toneIndex(state)+1)/VOICE_STAGES.length)*100)}%"></i></span></article>
      <article><small>系统等级</small><b>${state.system.level} / 4</b><span><i style="width:${state.system.level*25}%"></i></span></article>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>ADMIN PROFILE</small><h3>基本档案，够你看了。</h3></div>
      ${labelValue('核心性格','审美偏执 / 嘴毒 / 恶俗 / 自负 / 色情 / 不耐烦')}
      ${labelValue('系统经历','重生 / 事业 / 修仙 / 其他跨世界任务')}
      ${labelValue('本次异常','第一次抽到这么严重的审美灾难宿主')}
      ${labelValue('当前态度',voice.label)}
      ${labelValue('下一变化',next.id===voice.id?'已经到最高外貌评价层':`CHARM ${next.min} → ${next.label}`)}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>EVOLUTION</small><h3>我的身体不是你花钱买来的。</h3></div>
      ${systemEvolutionLadderMarkup(state)}
      ${state.system?.evolution?.lastReason ? `<p class="meme-men-rule-note">上一次进化：${state.system.evolution.lastReason}</p>` : ''}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>VOICE PROTOCOL</small><h3>我的嘴不会一直一个样</h3></div>
      ${VOICE_STAGES.map(item=>`
        <div class="meme-voice-rule ${item.id===voice.id?'is-current':''}">
          <span>${item.code}</span>
          <div><b>${item.min}–${item.max===999?'100':item.max} · ${item.label}</b><p>${item.rule}</p></div>
        </div>
      `).join('')}
    </section>
  ` : '';

  const privateSections=rank>=3 ? `
    <section class="meme-page-card">
      <div class="meme-card-title"><small>PRIVATE PREFERENCE</small><h3>既然放你进来了，就别装纯。</h3></div>
      ${labelValue('审美对象','漂亮的成年女性')}
      ${labelValue('特殊癖好','对熟睡状态下的漂亮成年女性有明显性兴趣')}
      ${labelValue('审美原则','漂亮会让我多看，但不代表喜欢，更不代表爱')}
      ${labelValue('本次宿主',Number(state.host?.charm||0)<70?'仍未跨过我的真实欲望门槛':Number(state.permission?.adminDesireSignals||0)>0?'已经产生过针对性欲望':'达到美女门槛，但我想不想碰是另一回事')}
      <p class="meme-men-rule-note">PRIVATE 不是“全部秘密公开”。我愿意给你看的才会出现在这里，没说的别替我补。</p>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>OLD ASSIGNMENTS</small><h3>以前带过的可没你这么离谱。</h3></div>
      ${labelValue('重生类','处理人生重启、身份与目标重构')}
      ${labelValue('事业类','处理成功、资源、竞争与社会跃迁')}
      ${labelValue('修仙类','处理修为、资源、境界与世界规则')}
      ${labelValue('本次评价','第一次遇到开局审美灾难严重到让我想申请换人的宿主')}
      <p class="meme-men-rule-note">PRIVATE 也不是全知权限。还有些东西我没说，就是没打算现在给你看。</p>
    </section>
  ` : `
    <section class="meme-page-card">
      <div class="meme-card-title"><small>PRIVATE DATA</small><h3>这里不是你现在能翻的。</h3></div>
      ${labelValue('状态','SEALED',stage==='peek'?'先拿着这点 PEEK 权限别得寸进尺。':'我开的是基本档案，不是把底裤都给你看。')}
    </section>
  `;

  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader(adminDisplayName(state),`SYSTEM · ${access.label}`,voice.code)}
    <section class="meme-admin-card">
      <div class="meme-admin-emblem">${crownMarkup()}</div>
      <div class="meme-admin-copy">
        <small>ACCESS · ${access.label}</small>
        <h3>${voice.label}</h3>
        <p>${intro}</p>
      </div>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>ACCESS LADDER</small><h3>权限是我一层一层给的。</h3></div>
      ${systemAccessLadder(state)}
    </section>

    ${snapshot}
    ${openSections}
    ${privateSections}

    <section class="meme-admin-quote">
      <small>LIVE COMMENT · ${voice.code}</small>
      <p>${systemHomeLine(state)}</p>
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
  const state=runtimeState();
  const dynamic=(state.history||[]).map(entry=>({
    type:entry.recordType==='purchase'?'change':entry.recordType || entry.type || 'system',
    code:String(entry.type||'EVENT').toUpperCase(),
    title:entry.title || '我记了一笔',
    desc:entry.summary || entry.text || '发生过的事我没忘。',
  }));
  const all=[...RECORD_DATA,...dynamic];
  const list=filter==='all'?all:all.filter(item=>item.type===filter);
  const items=list.map(recordItem).join('');
  return items + `
    <article class="is-future">
      <span></span>
      <div><small>WAITING</small><h4>后面还有。</h4><p>你做过的任务、买过的改造、碰过的人，我都会记。</p></div>
    </article>
  `;
}

function recordMarkup() {
  const state=runtimeState();
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('PRIVATE LOG','RECORD · 你干过的脏事',String(RECORD_DATA.length+(state.history?.length||0)).padStart(2,'0'))}
    <div class="meme-record-filter" data-record-filters>
      <button class="is-active" type="button" data-record-filter="all">全部</button>
      <button type="button" data-record-filter="change">改造</button>
      <button type="button" data-record-filter="task">任务</button>
      <button type="button" data-record-filter="men">对象</button>
      <button type="button" data-record-filter="system">系统</button>
    </div>
    <section class="meme-timeline" data-record-list>${renderRecordList('all')}</section>
    <p class="meme-preview-note">别担心，旧男人淡出 MEN 也不会凭空失忆。历史我替你留着，只是不拿来每回合浪费上下文。</p>
  `;
}

function renderView(view='home', animate=true) {
  const root = document.querySelector('#meme-os-dialog .meme-scroll');
  if (!root) return;

  const views = {
    home: homeMarkup,
    me: meMarkup,
    task: taskMarkup,
    shop: shopMarkup,
    men: menMarkup,
    system: () => systemAccessStage(runtimeState())==='locked' ? lockedSystemMarkup() : systemMarkup(),
    record: recordMarkup,
    memory: memoryMarkup,
  };

  const paint=()=>{
    root.innerHTML=(views[view]||views.home)();
    root.scrollTop=0;
    root.dataset.view=view;
    root.classList.remove('is-switching');
  };
  if(!animate){ paint(); return; }
  root.classList.add('is-switching');
  setTimeout(paint,90);
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

      <main class="meme-scroll" data-view="home">${homeMarkup()}</main>

      <footer class="meme-footer">
        <span class="meme-footer-spark">✦</span>
        <span>PRIVATE CONTRACT</span>
        <b>♥</b>
        <span>NO ESCAPE</span>
        <small style="opacity:.48;font-size:9px;letter-spacing:.08em">v0.13.0</small>
        <span class="meme-footer-spark">✦</span>
      </footer>
    </section>
  `;
}


async function handleTaskAction(id){
  const task=findTask(id);
  if(!task) return;
  const state=runtimeState();
  const unlock=taskUnlock(task,state);
  if(!unlock.ok){
    globalThis.toastr?.warning?.(`任务未解锁：${unlock.reason}。`);
    return;
  }

  const storyDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const repeatable=task.repeatable==='daily';
  const dailyLike=task.category==='daily' || repeatable;
  const completedToday=dailyLike && Number(state.tasks?.dailyCompleted?.[id]?.day||0)===storyDay;
  const completedPermanent=!dailyLike && task.category!=='daily' && Boolean(state.tasks?.completed?.[id]);
  if(completedToday || completedPermanent){
    globalThis.toastr?.info?.(completedToday?'今天这笔我已经给你结过了，别想再薅一次。':'这任务我已经给你结过账了。重复做不算第二份。');
    return;
  }
  if(state.tasks?.active?.[id]){
    globalThis.toastr?.info?.('已经挂上了。真做完我自然会验收。');
    return;
  }
  if(pendingFor('taskAccept',id,state)){
    globalThis.toastr?.info?.('接取内容塞进输入框了。发出去才算你真接。');
    return;
  }

  const systemTitle=adminCopyText(task.title,'未命名任务',48);
  const systemDesc=adminCopyText(task.desc,'按任务条件完成。',180);
  const dayTag=dailyLike?`DAY ${String(storyDay).padStart(3,'0')}｜`:'';
  const text=`【MÉMÉ OS｜任务接取】${dayTag}TASK_ID:${task.id}｜「${systemTitle}」\n任务要求：${systemDesc}`;

  await queueAction(createPendingAction({
    type:'task_accept',
    recordType:'task',
    title:`接了就别装没看见：${systemTitle}`,
    summary:`「${systemTitle}」我给你挂上了。真做到条件，我会自己验收。`,
    text,
    effect:{taskAccept:{id:task.id,title:systemTitle,category:task.category}},
  }));
}
async function handleShopAction(id){
  const item=findShopItem(id);
  if(!item) return;
  const state=runtimeState();
  const view=staticShopView(item,state);
  const req=shopRequirement(item,state);
  if(view.soldOut){
    globalThis.toastr?.info?.(item.category==='dailygoods'?'这个耐用品你已经买过了。':'这项已经改到当前上限了。再点也榨不出下一层。');
    return;
  }
  if(!req.ok){
    globalThis.toastr?.warning?.(`还没开。先把 ${req.reason} 做到，别急着惦记这件。`);
    return;
  }
  if(pendingFor('purchase',id,state)){
    globalThis.toastr?.info?.('购买内容已经塞进输入框。发出去我才给你扣账。');
    return;
  }

  const spendable=getSpendableResources(state);
  const payment=shopPaymentMeta(item,state,view);
  const balance=payment.currency==='AP'?spendable.ap:spendable.sv;
  if(balance<payment.price){
    globalThis.toastr?.warning?.(`差 ${payment.price-balance} ${payment.currency}。穷就先去做任务，别盯着买不起的东西流口水。`);
    return;
  }

  const systemTitle=item.dynamic
    ? adminCopyText(item.title,item.category==='dailygoods'?'日常用品':'临时改造',40)
    : levelledShopTitle(item,state);
  const lifestyle=item.category==='dailygoods';
  const currentCharm=Math.max(0,Number(state.host?.charm)||0);
  const baseCharmGain=lifestyle
    ? 0
    : (item.id==='charmseal'
        ? Math.max(0,100-currentCharm)
        : Number(item.dynamic ? item.charmGain : staticCharmGain(item,state,view)));
  // The AP/SV gate is checked BEFORE purchase. If the host is still below 30,
  // the final AP-funded rescue upgrade receives its full CHARM gain even when
  // that purchase crosses 30. Only subsequent appearance purchases switch to SV.
  const charmGain=baseCharmGain;
  const bodyDelta=lifestyle
    ? {}
    : (item.dynamic ? (item.bodyAxis ? {[item.bodyAxis]:1} : {}) : (BODY_EFFECTS[item.id] || {}));
  const apDelta=payment.currency==='AP'?-payment.price:0;
  const svDelta=payment.currency==='SV'?-payment.price:0;
  const levelText=lifestyle?'生活商品':(item.dynamic?'剧情临时改造':`LV.${view.nextLevel}`);
  const text=`【MÉMÉ OS｜已结算｜勿重复结算】购买完成：「${systemTitle}」· ${levelText}；${payment.currency} -${payment.price}${charmGain?`；CHARM +${charmGain}`:''}。状态已写入，正文仅承接购买结果。`;

  await queueAction(createPendingAction({
    type:'purchase',
    recordType:'change',
    title:`钱我扣了：${systemTitle}`,
    summary:`「${systemTitle}」已经算到你身上。 ${payment.currency} -${payment.price}${charmGain?`；CHARM +${charmGain}`:''}。买都买了，别回头装后悔。`,
    text,
    effect:{
      apDelta,
      svDelta,
      charmDelta:charmGain,
      bodyDelta,
      ...(lifestyle
        ? {inventoryAdd:{id:item.id,title:systemTitle,kind:item.kind||'daily',consumable:Boolean(item.consumable),quantity:1}}
        : {purchase:{id:item.id,title:systemTitle,category:item.category,level:view.nextLevel}}),
    },
  }));
}
async function handleRemovePending(actionId){
  const state=runtimeState();
  const action=state.pending?.find(item=>item.id===actionId);
  if(!action) return;
  removeFromInput(action.text);
  await removePendingAction(actionId);
  renderView(currentView(),false);
  globalThis.toastr?.info?.('撤了。没发送就当没发生。');
}

async function handleMessageSent(messageId){
  const context=globalThis.SillyTavern?.getContext?.() || {};
  let sentMessage=null;
  if(Number.isInteger(messageId)) sentMessage=context.chat?.[messageId] || null;
  if(!sentMessage && messageId && typeof messageId==='object' && 'mes' in messageId) sentMessage=messageId;
  if(!sentMessage){
    const chat=context.chat || [];
    sentMessage=[...chat].reverse().find(message=>message?.is_user) || null;
  }
  if(!sentMessage?.is_user) return;
  const corrections=await applyOsTaskCorrectionsFromUserMessage(sentMessage.mes || '');
  const {committed}=await commitPendingActions(sentMessage.mes || '');
  if(corrections.length){
    globalThis.toastr?.success?.(`MÉMÉ OS 已删除 ${corrections.length} 个错误剧情任务。`);
  }
  if(committed.length){
    renderView(currentView(),false);
    globalThis.toastr?.success?.(`MÉMÉ OS 已登记 ${committed.length} 项操作。`);
  }
  installRuntimePrompt();
}

function bindSillyTavernEvents(){
  if(globalThis.__meme_os_events_bound__) return;
  const context=globalThis.SillyTavern?.getContext?.();
  const source=context?.eventSource;
  const events=context?.event_types || context?.eventTypes || {};
  if(!source?.on) return;
  if(events.MESSAGE_SENT) source.on(events.MESSAGE_SENT,handleMessageSent);
  const handleAssistantVariant=async(ref)=>{
    const messageId=resolveAssistantMessageId(ref);
    if(!Number.isInteger(messageId)) return;
    await handleRuntimeEvent(messageId);
    installRuntimePrompt();

    const state=runtimeState();
    const turn=Math.max(0,Number(state.shop?.plotTurn)||0);
    if(!state.memory?.initialized){
      await quietSyncMemory({force:true});
    }else if(Number(state.memory?.lastUpdatedTurn||0)<turn || memoryNeedsCompression(state)){
      // Every round needs exactly one SHORT. Compression is also extension-owned.
      await quietSyncMemory({force:true});
    }
  };
  if(events.MESSAGE_RECEIVED) source.on(events.MESSAGE_RECEIVED,handleAssistantVariant);
  if(events.MESSAGE_SWIPED) source.on(events.MESSAGE_SWIPED,handleAssistantVariant);
  if(events.CHAT_CHANGED) source.on(events.CHAT_CHANGED,async()=>{
    // getState() is chatId-scoped. Switching chats only re-renders the state
    // that belongs to that chat; it never clears or mutates another save.
    runtimeState();
    await reconcileRecentVisibleSettlements();
    await reconcileRecentVisibleTaskCompletions();
    await reconcileRecentVisibleTaskOffers();
    renderView('home',false);
    installRuntimePrompt();
    await quietSyncMemory({bootstrapOnly:true});
  });
  globalThis.__meme_os_events_bound__=true;
}

function ensureDialog() {
  let dialog = document.getElementById(DIALOG_ID);
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.id = DIALOG_ID;
  dialog.setAttribute('aria-label','MÉMÉ OS');
  dialog.innerHTML = panelMarkup();

  dialog.addEventListener('click', async event => {
    if (event.target === dialog || event.target.closest('[data-meme-close]')) {
      closeMemeOS();
      return;
    }

    if (event.target.closest('[data-meme-back]')) {
      renderView('home');
      return;
    }

    const card=event.target.closest('[data-meme-module]');
    if(card){
      const view=card.dataset.memeModule||'home';
      if(view==='system' && systemAccessStage(runtimeState())==='locked'){
        globalThis.toastr?.warning?.('“谁准你看的？我没开就是没开。”');
        return;
      }
      if(view==='home') renderView('home');
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

    const taskAction = event.target.closest('[data-task-action]');
    if (taskAction) {
      await handleTaskAction(taskAction.dataset.taskAction);
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

    const shopAction = event.target.closest('[data-shop-action]');
    if (shopAction) {
      await handleShopAction(shopAction.dataset.shopAction);
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

    const removePendingButton=event.target.closest('[data-remove-pending]');
    if(removePendingButton){
      await handleRemovePending(removePendingButton.dataset.removePending);
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


  });

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeMemeOS();
  });

  document.body.appendChild(dialog);
  return dialog;
}

async function openMemeOS() {
  const dialog=ensureDialog();
  try{
    // Never show a stale DAY/task board. Rebuild from the visible chat before paint.
    await reconcileRecentVisibleTaskOffers();
  }catch(error){
    console.warn('[MÉMÉ OS] open-time timeline/task repair failed',error);
  }
  renderView(currentView(),false);
  if(!dialog.open) dialog.showModal();
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

async function start() {
  mount();
  ensureDialog();
  {
    const state=runtimeState();
    const purged=purgeKnownLegacyWrongGeneratedTasks(state);
    const migrated=migrateLegacyCharmLadder(state);
    if(purged || migrated){
      try{
        await saveState(state);
        renderView('home',false);
      }catch(error){
        console.warn('[MÉMÉ OS] startup migration failed',error);
      }
    }
  }
  try{
    await reconcileRecentVisibleSettlements();
    await reconcileRecentVisibleTaskCompletions();
    await reconcileRecentVisibleTaskOffers();
  }catch(error){
    console.warn('[MÉMÉ OS] startup state reconciliation failed',error);
  }
  bindSillyTavernEvents();
  installRuntimePrompt();
  setTimeout(()=>quietSyncMemory({bootstrapOnly:true}),900);
  globalThis.__meme_os_probe_timer__ = setInterval(mount, 1000);
  window.addEventListener('resize', mount, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(mount,150), { passive:true });
}

if (globalThis.jQuery) globalThis.jQuery(start);
else if (globalThis.$) globalThis.$(start);
else setTimeout(start,1000);
