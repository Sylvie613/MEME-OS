import {
  addPendingAction,
  commitPendingActions,
  createPendingAction,
  getSpendableResources,
  getState,
  hasActiveChat,
  removePendingAction,
  saveState,
} from './src/state.js?v=0.10.2';
import { appendToInput, removeFromInput } from './src/input.js?v=0.10.2';
import { isBoundCharacter } from './src/binding.js?v=0.10.2';

/**
 * MÉMÉ OS v0.10.3
 * Navigable content shell. Visual style + native <dialog> retained.
 * Persistent state, tone engine, pending actions and transaction commits are live in this build.
 */
const MEME_ID = 'meme-os-heart-launcher';
const DIALOG_ID = 'meme-os-dialog';

const TASK_DATA = {
  daily: [
    { id:'clean', type:'DAILY', title:'先把自己收拾干净', desc:'完成洗头、洗澡、换洗衣物与基础口腔清洁。系统拒绝给“脏乱”找借口。', reward:'AP +120', state:'可接取', detail:'完成后由剧情状态确认。每个剧情日可结算一次；跨入新的一天后重新开放。' },
    { id:'mirror', type:'DAILY', title:'镜前扫描', desc:'在镜子前完整观察当前外貌三分钟，不遮脸、不跳过身体状态。', reward:'AP +70', state:'可接取', detail:'用于建立宿主对当前状态的客观认知。' },
    { id:'walk', type:'DAILY', title:'动起来', desc:'连续完成一次不少于二十分钟的步行或低强度活动。', reward:'AP +150', state:'可接取', detail:'系统只判定“完成 / 未完成”，不计算现实热量。' },
    { id:'posture', type:'DAILY', title:'别塌着', desc:'在一段完整场景中保持肩颈舒展、坐姿或站姿不持续蜷缩。', reward:'AP +100', state:'可接取', detail:'用于解锁后续姿态类改造。' },
    { id:'outfit', type:'DAILY', title:'像样地出门', desc:'搭配一套干净、合身、没有明显邋遢感的外出服。', reward:'AP +110', state:'可接取', detail:'不要求昂贵，只要求“看起来像认真收拾过”。' },
  ],
  desire: [
    { id:'spark', type:'DESIRE', title:'先让男人真的对你起色心', desc:'让一名成年对象明确对你产生性欲，不算礼貌夸奖，不算客套，得是真想碰你、想睡你。', reward:'AP +250 · SV +10', state:'CHARM 8 解锁', locked:true, detail:'一次性里程碑。不用真的上床，但对方必须出现明确、可识别的成人性欲。' },
    { id:'sample', type:'DESIRE', title:'第一次把精液交上来', desc:'从成年对象处拿到第一次可结算的精液。别拿暧昧当成果，系统收的是精液，不是空气。', reward:'AP +350 · SV +50', repeatable:'daily', repeatReward:'SV +50', state:'CHARM 12 解锁', locked:true, detail:'首次完成给里程碑奖励；之后每个剧情日可再采集一次，仅结算 SV。' },
    { id:'oral', type:'DESIRE', title:'嘴别只会顶嘴', desc:'和成年对象完成一次口交，并拿到系统认可的射精结算。嘴硬不算本事，真把活干完才算。', reward:'AP +450 · SV +70', repeatable:'daily', repeatReward:'SV +80', state:'CHARM 15 解锁', locked:true, detail:'首次完成给里程碑奖励；之后每个剧情日最多再结算一次，仅产出 SV。' },
    { id:'repeat', type:'DESIRE', title:'第二次不是偶然', desc:'与同一成年对象发生第二次明确的性接触或欲望事件。', reward:'AP +550 · SV +70', state:'CHARM 18 解锁', locked:true, detail:'一次性里程碑。若对象曾淡出，完成后会被 MEN 自动提升为 RETURNING。' },
    { id:'drain', type:'DESIRE', title:'真有本事就把他榨干', desc:'在一次成人性场景里把成年对象操到系统判定的“完全采集”，别做到一半就只顾自己爽。', reward:'AP +800 · SV +120', repeatable:'daily', repeatReward:'SV +130', state:'CHARM 25 解锁', locked:true, detail:'首次完成是高阶里程碑；之后每个剧情日最多再结算一次，仅产出 SV。' },
  ],
  special: [
    { id:'audit', type:'SYSTEM', title:'管理员审美复检', desc:'触发一次完整宿主扫描，管理员会根据当前阶段重新评价。', reward:'AP +200', state:'阶段任务', detail:'一次性阶段任务。评价可能很难听，但不会凭空增加或减少属性。' },
    { id:'contract', type:'HIDDEN', title:'隐藏契约', desc:'满足未知条件后由系统主动触发。', reward:'???', state:'条件未知', locked:true, detail:'隐藏任务不会提前向模型公开完整触发条件。' },
    { id:'override', type:'RARE', title:'越级奖励', desc:'在极少数高风险或高价值剧情节点触发一次越级改造机会。', reward:'RANDOM', state:'稀有事件', locked:true, detail:'由剧情事件触发，不作为普通可刷任务。' },
  ],
};

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
    {id:'charmseal',icon:'♛',title:'魅魔印记',desc:'在高阶阶段解锁专属系统印记与视觉反馈。',price:250,currency:'SV',level:'RARE',req:'CHARM 30',detail:'外观性系统标记，不强制公开给剧情 NPC。'},
  ],
};

const RECORD_DATA = [
  {type:'system',code:'BINDING',title:'MÉMÉ OS 绑定完成',desc:'随机宿主绑定成功。AP 0 / SV 0 / CHARM 0。'},
  {type:'change',code:'SCAN',title:'首次宿主扫描',desc:'系统判定：明显难看 · 未改造。改造进度 0%。'},
  {type:'system',code:'ADMIN',title:'管理员首次评价',desc:'“先去洗头。”'},
];


const VOICE_STAGES = [
  {
    id:'disgust', min:0, max:14, label:'纯嫌弃期', code:'VENOM',
    rule:'刻薄、嘴臭、恶俗。此阶段没有夸奖、嘴硬心软或隐藏喜欢；会直接拿外貌、邋遢和身体状态开刀，措辞可以粗俗难听，但必须具体，不机械复读脏话。',
    home:[
      '“别盯着界面看。先去洗头。”',
      '“零魅力。你现在这副样子，连发情都像在给别人添堵。”',
      '“别摆那张委屈脸。难看的是你，我只是嘴比别人诚实。”',
      '“少跟我讲自信。自信不能替你洗头。”'
    ],
  },
  {
    id:'repair', min:15, max:34, label:'抢救期', code:'REPAIR',
    rule:'承认改造有效，但嘴仍然脏而刻薄。最多算“从灾难修到能看”，不许温柔；可以拿她终于有点像个会勾人的成年女人来损，但不能提前产生真实欲望。',
    home:[
      '“至少现在没刚绑定时那么灾难。”',
      '“别笑。‘有改善’和‘好看’中间隔着一整条银河。”',
      '“勉强算你没白折腾。就勉强。”',
      '“现在能看两眼了。第三眼再说。”'
    ],
  },
  {
    id:'acceptable', min:35, max:54, label:'顺眼期', code:'ACCEPT',
    rule:'开始承认宿主像样甚至好看，但仍吝啬夸奖。恶俗嘴不收，会拿男人视线、骚气、身体观感做下流评价，但仍没有针对宿主的真实性欲。',
    home:[
      '“……这次确实顺眼。你最好别逼我重复。”',
      '“别得意，我说的是‘不难看’，不是‘漂亮得让我失智’。”',
      '“总算不用每次看数据都想申请工伤。”',
      '“嗯。今天这张脸没什么特别值得骂的。”'
    ],
  },
  {
    id:'pretty', min:55, max:69, label:'漂亮期', code:'PRETTY',
    rule:'客观上明显漂亮。他会承认“漂亮”，但嘴依旧脏，常把夸奖说成下流评价或挑刺；漂亮不等于他本人想操/想睡，更不等于温柔。',
    home:[
      '“行，漂亮。满意了？别让我说第二遍。”',
      '“现在确实有人会回头看你。你先把那副得意样收一收。”',
      '“脸是好看了，性格还是烦。”',
      '“我承认你现在漂亮。只代表我的眼睛没坏，不代表别的。”'
    ],
  },
  {
    id:'beauty', min:70, max:84, label:'美女期', code:'BEAUTY',
    rule:'真正跨过他的美女审美门槛。只有从这里开始，具体剧情才可能让他出现“想睡/想碰/想操”的真实性欲；没有欲望信号时仍只是一个嘴很脏的审美评价者。',
    home:[
      '“……现在倒是真的配得上‘美女’两个字了。”',
      '“别靠那么近。我只是在确认改造结果。”',
      '“长成这样以后，你倒是终于有资格让我挑得更细了。”',
      '“漂亮是漂亮。别擅自把这句话理解成我喜欢你。”'
    ],
  },
  {
    id:'stunning', min:85, max:999, label:'高魅力美女期', code:'STUNNING',
    rule:'外貌高度符合他的审美。若欲望线已产生，他会明显更黄、更露骨、更敢直接说想怎么碰、怎么睡，但仍不等于爱。真正温柔只允许LOVE成立后偶尔出现，恶俗嘴不会被洗白。',
    home:[
      '“这张脸现在确实很合我胃口。可惜嘴还是一样会惹我烦。”',
      '“别晃。让我多看两秒。”',
      '“现在别人盯你，我至少能理解他们眼睛为什么不肯挪开。”',
      '“长成这样是你的本事。让我喜欢你，是另一回事。”'
    ],
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
  spark:'先证明真有成年男人看着你会起色心。不是“你今天真好看”这种屁话，是他真的想碰、想睡、想把你按到床上。',
  sample:'我要的是第一次能结算的精液。别拿几句骚话和摸两下回来邀功，射出来、收得到，才算数。',
  oral:'这张嘴平时除了顶嘴没别的本事。去做一次真正的口交，等对方射出来再回来交差。',
  repeat:'同一个男人第二次还想睡你，才说明上次不是一时脑热。让我看看你到底有没有本事让人操完还惦记。',
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

function sanitizeGeneratedDesireTask(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const title=String(raw.title||'').replace(/\s+/g,' ').trim().slice(0,48);
  const desc=String(raw.desc||'').replace(/\s+/g,' ').trim().slice(0,180);
  const detail=String(raw.detail||'').replace(/\s+/g,' ').trim().slice(0,180);
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
    source:String(raw.source||'当前剧情').replace(/\s+/g,' ').trim().slice(0,80),
  };
}

function distinctEroticTaskCount(state=runtimeState()){
  return Object.values(state.tasks?.completed||{}).filter(task=>task?.category==='desire').length;
}

function sanitizeDynamicItem(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const currency=raw.currency==='SV'?'SV':'AP';
  const phase=currentShopPhase(state);
  const price=Number(PLOT_PRICES[currency]?.[phase.id] || (currency==='SV'?45:220));
  const ttl=Math.max(1,Math.min(8,Math.round(Number(raw.ttl)||4)));
  const title=String(raw.title||'临时改造').slice(0,40);
  const desc=String(raw.desc||'系统临时上架。').slice(0,140);
  const detail=String(raw.detail||'根据当前剧情临时出现，过期后自动撤架。').slice(0,180);
  const bodyAxis=BODY_AXES.has(String(raw.bodyAxis||'')) ? String(raw.bodyAxis) : null;
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
    source:String(raw.source||'剧情临时上架').slice(0,80),
    bodyAxis,
    sourceIssueId:String(raw.sourceIssueId||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48) || null,
  };
}

function getDynamicShop(state=runtimeState()){
  const turn=Number(state.shop?.plotTurn)||0;
  return (state.shop?.dynamic||[]).filter(item=>Number(item.expiresTurn||0)>=turn && !state.upgrades?.[item.id]);
}

function sanitizeSceneIssue(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const note=String(raw.note||'').trim().slice(0,120);
  if(!note) return null;
  const axis=BODY_AXES.has(String(raw.axis||'')) ? String(raw.axis) : null;
  const source=String(raw.source||'当前剧情').trim().slice(0,60);
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
  const source=String(raw.source||'剧情人物').trim().slice(0,60);
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
    summary:String(raw.summary||'').trim().slice(0,100),
    relation:String(raw.relation||'未判定').trim().slice(0,60),
    desire:String(raw.desire||'未记录').trim().slice(0,80),
    lastContact:String(raw.lastContact||'').trim().slice(0,100),
    note:String(raw.note||'').trim().slice(0,140),
    badges,
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
  const dailyLike=task.category==='daily' || repeatable;
  if(dailyLike && Number(active.storyDay||0)!==currentDay) return false;
  if(dailyLike && Number(state.tasks?.dailyCompleted?.[id]?.day||0)===currentDay) return false;
  if(!dailyLike && task.category!=='daily' && state.tasks?.completed?.[id]) return false;

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
    firstCompletedAt:state.tasks.everCompleted?.[id]?.firstCompletedAt||Date.now(),
  };

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
    title:`${wasEverCompleted && repeatable?'重复结算':'完成'}：${title}`,
    summary:`任务「${title}」验收通过；${rewardText}。证据：${evidence}`,
    text:`TASK VERIFIED AND SETTLED: ${id}`,
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


function runtimeMessageAlreadyProcessed(state,messageId){
  if(!Number.isInteger(messageId)) return false;
  const list=Array.isArray(state.runtime?.processedAssistantMessages)
    ? state.runtime.processedAssistantMessages
    : [];
  return list.includes(messageId);
}

function markRuntimeMessageProcessed(state,messageId){
  if(!Number.isInteger(messageId)) return;
  state.runtime=state.runtime||{processedAssistantMessages:[]};
  const list=Array.isArray(state.runtime.processedAssistantMessages)
    ? state.runtime.processedAssistantMessages
    : [];
  state.runtime.processedAssistantMessages=[
    ...list.filter(id=>id!==messageId),
    messageId,
  ].slice(-4000);
}



async function handleRuntimeEvent(messageId){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const message=Number.isInteger(messageId)?context.chat?.[messageId]:null;
  if(!message || message.is_user) return;

  const state=runtimeState();
  if(runtimeMessageAlreadyProcessed(state,messageId)){
    console.info(`[MÉMÉ OS] runtime event skipped: assistant message ${messageId} already processed`);
    return;
  }

  state.shop=state.shop||{dynamic:[],plotTurn:0};
  state.shop.plotTurn=(Number(state.shop.plotTurn)||0)+1;
  state.shop.dynamic=(state.shop.dynamic||[]).filter(item=>Number(item.expiresTurn||0)>=state.shop.plotTurn);

  const raw=String(message.mes||'');
  const matches=[...raw.matchAll(/<!--MEME_OS_EVENT\s+([\s\S]*?)-->/g)];
  let changed=false;
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

      if(event.timeline?.dayAdvance===true){
        state.tasks=state.tasks||{storyDay:1,active:{},completed:{},dailyCompleted:{},everCompleted:{}};
        state.tasks.storyDay=Math.max(1,(Number(state.tasks.storyDay)||1)+1);
        for(const [taskId,activeTask] of Object.entries(state.tasks.active||{})){
          const task=findTask(taskId);
          if(activeTask?.category==='daily' || task?.repeatable==='daily') delete state.tasks.active[taskId];
        }
        changed=true;
        state.history.push({
          id:`meme_story_day_${state.tasks.storyDay}_${Date.now()}`,
          type:'story_day',
          recordType:'system',
          title:`剧情进入 DAY ${String(state.tasks.storyDay).padStart(3,'0')}`,
          summary:'新的一天开始，日常任务已重新开放。',
          text:'STORY DAY ADVANCED',
          committedAt:Date.now(),
        });
      }

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
            summary:`管理员完成形态进化：${meta.form}。原因：${reason}`,
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
          title:'来自他的坦白',
          summary:'管理员坦白自己从未拥有固定姓名，并主动将命名权交给宿主。',
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
            title:'管理员获得名字',
            summary:`宿主将管理员命名为「${chosen}」。`,
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
          peek:['SYSTEM · PEEK','管理员只开放了一小部分 SYSTEM 资料。'],
          open:['SYSTEM · OPEN','管理员正式开放了 SYSTEM 基本档案。'],
          private:['SYSTEM · PRIVATE','管理员主动开放了更深的私人档案权限。'],
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

  // The whole assistant message is one idempotent runtime event.
  // Once marked, refresh/reload/repeated event dispatches and swipes on the same
  // message slot cannot settle it a second time.
  markRuntimeMessageProcessed(state,messageId);
  changed=true;

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

  if(changed || matches.length || state.shop.dynamic.length){
    await saveState(state);
    renderView(currentView(),false);
  }
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
  const prompt=`[MÉMÉ OS runtime bridge]
HOST PERSONA RULE:
Do not define the host's name, age beyond adulthood, height, job, personality, hobbies, romantic style or personal history here. The host's identity/personality comes from the current SillyTavern Persona and the live conversation. MÉMÉ OS may define only the system-specific starting transformation condition and tracked state. Never overwrite or homogenize the user's Persona.

ADMINISTRATOR CHARACTER INVARIANTS:
He is a vivid adult male with strong private tastes, opinions, irritations and agency, not a helpful generic system.

COPY OWNERSHIP RULE:
MÉMÉ OS itself is an intentionally vulgar adult system. Every newly generated player-facing name or piece of prose that belongs to MÉMÉ OS must sound like something this administrator personally chose to call or write, filtered through his current personality, relationship state and attitude stage.
His house voice is not elegant sarcasm. It is sharp + obscene + mean: crude sexual slang, dirty implications, shameless body commentary, vulgar jokes and specific insults are normal when context allows. In sexual or SV-related contexts, prefer direct adult vocabulary such as 精液、口交、高潮、发情、湿、想操/想睡、射精 instead of sanitized euphemisms such as “亲密接触”“有效样本”“成人互动”. Do not make every sentence sexual when the topic is ordinary hygiene or appearance, but the OS should still feel indecent, low-mouthed and malicious rather than polished or therapeutic.
This applies to dynamic shop item names/descriptions/details, newly generated task names/descriptions, special-event titles, recommendations, warnings, evaluations, unlock notices, administrator notes, and any future dynamic module copy.
Do NOT output generic RPG/system copy such as "Skin Upgrade I", "New mission unlocked", "Recommended item", or neutral template prose unless it is a structural UI label. Structural labels such as AP, SV, CHARM, TASK, SHOP, MEN, SYSTEM and RECORD may remain neutral/technical.
Names and descriptions must not merely append a swear word. They should reveal what he specifically thinks is ugly, pathetic, horny, funny or worth fixing in the present situation. Avoid repetitive stock insults.
Current administrator tone stage: ${voice.label}.

He is a vivid adult male with strong private tastes, opinions, irritations and agency, not a helpful generic system. He is naturally sharp-tongued, judgmental, vain about aesthetics, impatient, mean in a witty specific way, observant, remembers slights, dislikes cheap flattery and fake inspirational talk, enjoys needling the host when she gives him an opening, and does not soften merely because time passes.
He is a genuine extreme lookist. Before CHARM 55 he is extremely stingy with praise; before CHARM 70 he must NOT experience genuine sexual attraction to the host. At 55-69 he may grudgingly admit she is pretty. At 70+ she qualifies as a beauty, but beauty alone still does not equal desire, affection or love.
Separate these axes strictly: appearance evaluation != sexual desire != emotional bond. He can admit she is beautiful while still finding her annoying. He can desire her without loving her. Tenderness is NOT a normal tone stage. Only if adminLove=true may rare genuine tenderness appear, and even then his native sharpness remains.
IDENTITY / NAMING:
He is an experienced cross-world system consciousness, not a first-time system. He has previously served in very different assignment types, including rebirth-oriented worlds, success/career systems, cultivation worlds and other system roles. This is genuinely the first time he has ever been assigned to a host whose starting appearance is such an extreme aesthetic disaster, which is part of why he is unusually irritated by this assignment.
He has NO fixed personal name. A host is allowed to name him, but he deliberately conceals this rule because at the beginning he does not consider this host worthy of naming him. Before namingRightOffered=true, if asked his name he only identifies himself as the system / administrator and never reveals that the host has naming rights.
The naming right is intimate and relationship-gated, not a system-level reward. It may only be offered after adminLove has already been genuinely established in a previous turn. Once love already exists, at the first fitting private or quiet emotional moment, he should eventually make a visible late-stage confession that he never had a fixed name and is giving the host the right to name him; in that same reply append identity.offerNaming=true. This event is titled “来自他的坦白”.
After namingRightOffered=true, when the host clearly chooses a name for him, accept it only if he accepts the naming in visible prose, then append identity.name with exactly the chosen name. Once stored, use that name naturally thereafter. Never retroactively claim he had that name before the host gave it.
Current namingRightOffered=${Boolean(state.system?.namingRightOffered)}; current assigned name=${state.system?.name||'NONE'}.

STRUCTURED HOST STATE:
CHARM is only the overall appearance score. Never infer that every body area improved from CHARM alone.
Current body-axis levels: ${JSON.stringify(state.host?.body||{})}.
Only describe a permanent physical improvement as already present when the matching body axis / purchased upgrade supports it. Unmodified areas stay at their established baseline.

DYNAMIC DESIRE MISSION BOARD:
Fixed desire tasks (spark/sample/oral/repeat/drain) are only the foundational milestones. MÉMÉ OS should continue creating many different one-time erotic missions over a long playthrough.
Current generated uncompleted missions: ${JSON.stringify((state.tasks?.generated||[]).map(t=>({id:t.id,title:t.title,tier:t.tier,desc:t.desc,createdDay:t.createdDay})))}.
Distinct erotic missions already completed: ${distinctEroticTaskCount(state)}.
Last story day on which a new generated desire mission was created: ${Number(state.tasks?.lastGeneratedDesireDay)||0}.
When fewer than 3 generated desire missions are available and no generated mission has been created on the current story day, you may create ONE fitting new mission through taskOffers. Do not generate one every reply merely to fill space; prefer moments where the current plot, NPC, location, body state or unlocked sexual capability suggests a fresh challenge.
Generated erotic missions are one-time challenges, not repeatable collection farming. They should vary meaningfully in act, constraint, target, setting, social risk, collection goal, endurance, control, presentation or other adult scenario structure. Do not merely rename an old task or paraphrase a completed one.
Generated mission reward tier is derived automatically from current CHARM: no dynamic desire mission exists before CHARM 8, and later reward tiers rise with progression. Do not mention or choose the internal tier.
taskOffers entries contain only {title,desc,detail,source}. Do NOT choose tier, AP/SV rewards or ids; the extension derives the tier from current CHARM, creates a deterministic id and assigns the reward.
All generated task names/descriptions are written in the administrator's vulgar personal voice, not neutral quest prose.
Only the first completion of each distinct erotic mission counts toward administrator evolution. Repeating sample/oral/drain for SV never counts as another different mission.

TASK COMPLETION / VERIFICATION:
Currently active tasks: ${JSON.stringify(Object.values(state.tasks?.active||{}).map(t=>({id:t.id,title:t.title,category:t.category,storyDay:t.storyDay})))}.
The host may click a task in MÉMÉ OS. The extension inserts a task line into the user's input, and the host can continue writing how she completed it after "完成过程：".
Judge completion from the visible user narration and immediately relevant story facts. If an active task is clearly completed, emit one tasks entry with fields {id,status:"completed",evidence}. evidence must briefly name the concrete fact that satisfied the task.
Do NOT emit AP/SV values. The extension owns the reward table and will add the correct resources automatically in the same assistant-response cycle.
Do not verify intentions, promises, partial attempts, vague claims, or a task that is not currently active. If completion is unclear, leave it active.
A completed task should disappear/cross out as soon as this reply is processed; there is no separate claim step.
For sample, oral and drain: after their first-ever completion they become repeatable collection tasks, at most once per in-world story day. The extension automatically switches later payouts to SV-only repeat rewards. Never invent extra AP for repeated completions.

STORY DAY:
Current in-world story day=${Number(state.tasks?.storyDay)||1}. Daily tasks may reward once per story day. Set timeline.dayAdvance=true only when the visible narrative clearly crosses into a new in-world day (for example after sleeping overnight, an explicit next morning/day, or an explicit date jump). Never advance the day merely because several turns passed.

Current SHOP phase=${currentShopPhase(state).label} (${currentShopPhase(state).code}); appearance/presentation shop progress levels=${shopProgressLevels(state)}. Adult-response upgrades do not advance beauty-shelf phases.
Dynamic plot goods must respect the current SHOP phase. They may solve a concrete problem exposed by the just-written plot, but each purchase is only one incremental body-axis step and may not claim a sudden makeover, perfect body, instant beauty, or any effect far beyond the host's current progression.

PLOT → SHOP → BODY → REACTION LOOP:
Recent committed changes: ${JSON.stringify((state.reactivity?.recentChanges||[]).slice(0,6))}.
Recent exposed issues: ${JSON.stringify((state.reactivity?.recentIssues||[]).slice(0,6))}.
Recent observed reactions: ${JSON.stringify((state.reactivity?.recentReactions||[]).slice(0,6))}.
When the visible story directly exposes a concrete body/appearance/sensory problem, you may log it in feedback.issues. Do not invent problems just to create merchandise.
When a visible NPC or the administrator directly notices a real established improvement, you may log it in feedback.reactions. Reactions must match the actual modified body axis and the established relationship; do not make everyone suddenly attracted just because an axis improved.
A dynamic SHOP item should preferably answer a concrete exposed issue from the current or recent story. If it does, set sourceIssueId to that issue id. Do not create plot goods merely because the SHOP is empty.
Permanent improvements persist across later scenes. Negative or neutral feedback may remain even after some unrelated body axis improves.

MEN AUTO-ARCHIVE:
Current visible MEN state: ${JSON.stringify({
  current:(state.men?.current||[]).map(p=>({id:p.id,name:p.name,meta:p.meta,relation:p.relation,desire:p.desire,contactCount:p.contactCount,status:p.status})),
  recent:(state.men?.recent||[]).map(p=>({id:p.id,name:p.name,meta:p.meta,relation:p.relation,desire:p.desire,contactCount:p.contactCount,status:p.status})),
  returning:(state.men?.returning||[]).map(p=>({id:p.id,name:p.name,meta:p.meta,relation:p.relation,desire:p.desire,contactCount:p.contactCount,status:p.status})),
})}.
Only emit MEN updates for adult men who actually qualify for the archive: task-related involvement, sexual contact, a clear desire event, exchanged contact information, or meaningful plot impact. Ordinary passersby, a cashier, a man who only says two lines, or someone who merely looks at the host do NOT qualify.
For an existing archived man, reuse his exact id. For a genuinely new qualifying man, omit id or provide a stable slug; the extension assigns a deterministic id.
present=true means he is visibly still part of the current scene/contact. present=false means the meaningful interaction has clearly ended or he has left. If a currently archived man remains visibly present, emit a lightweight update with contactDelta=0 so he does not naturally decay into RECENT.
contactDelta counts meaningful new contact/events only; use 0 for continued presence, normally 1 for a new meaningful interaction.
Do not decide CURRENT/RECENT/RETURNING yourself. The extension derives the bucket from presence and prior archive history. Do not create affection scores.

ADMIN RELATIONSHIP MEMORY:
Hidden remembered turning points: ${JSON.stringify((state.permission?.adminBond?.moments||[]).slice(-16).map(m=>({kind:m.kind,signal:m.signal,tag:m.tag,reason:m.reason,storyDay:m.storyDay})))}.
These moments are private continuity memory, not a visible affection meter and not facts the administrator has necessarily confessed aloud.

THIS ROMANCE IS DELIBERATELY SLOW-BURN. Do not hurry it because the host is attractive, sexually available, affectionate, frequently present, or because the player seems to want romance. Long stretches where his feelings remain unchanged are correct and desirable.

A relationship signal is valid only when the current reply contains a concrete NEW turning point that genuinely changes his personal attitude. If you emit permission.signal, permission.signalReason is REQUIRED and must describe the specific cause in one concise sentence. Rephrasing an old reason does not create progress.

Pacing gates are enforced by the extension:
- interest: at most one new interest turning point per in-world story day.
- desire: impossible before CHARM 70, and also requires at least 5 interest moments spread across 4 different story days. Desire is not interest and does not increase interest automatically.
- attachment: requires at least 7 interest moments plus at least 3 desire turning points spread across 3 different days. Attachment events must be genuine personal-investment events and are spaced by a minimum 2-story-day cooldown.
- love: intentionally very late. It requires at least 8 interest moments, 4 desire moments, 5 attachment moments, at least 17 total remembered relationship turning points, at least 10 distinct story days of relationship history, attachment progress across at least 5 different days, and at least 3 different forms of personal investment. Meeting all of that only makes love POSSIBLE; it never makes love automatic.

For attachment, permission.signalTag is REQUIRED and must be one of:
personal_priority | protective_choice | trust | vulnerability | sacrifice | habit_broken_for_host | private_disclosure | future_choice

For permission.love=true, permission.loveReason and permission.loveTag are REQUIRED. loveTag must be one of:
sacrifice | personal_priority | vulnerability | future_choice | identity_choice
The love event must involve a meaningful choice affecting his own interest, habits, privacy, identity, future, or system utility. Beauty, sex, orgasm, jealousy, possessiveness, fear of losing access to the host, a dramatic rescue, or one emotional confession alone is NOT enough.

Do not emit a new relationship signal merely because a previous feeling continues. Continuity is expressed in prose; state events are only for actual changes. It is acceptable for many story days to pass with no bond-state increase.

Current CHARM=${state.host.charm}; desire allowed by appearance=${desireAllowed}; adminLove=${loveState}.

Only when the current story creates a genuinely relevant MÉMÉ OS state update — tasks, shop, feedback, MEN, evolution, permission, identity, or timeline — append ONE invisible HTML comment at the very end of the assistant reply.
Format exactly: <!--MEME_OS_EVENT {"taskOffers":[],"tasks":[],"shop":[],"feedback":{"issues":[],"reactions":[]},"men":[],"evolution":{"targetLevel":null,"reason":""},"permission":{"signal":null,"signalReason":"","signalTag":"","love":false,"loveReason":"","loveTag":"","systemAccess":null},"identity":{},"timeline":{}} -->
Do not emit the comment when nothing relevant changed.
taskOffers: maximum 1 new generated erotic mission; fields title,desc,detail,source. Never include tier, id or rewards.
tasks: max 4 completed task entries; fields id,status("completed"),evidence. Never include rewards; the extension calculates them.
shop: maximum 2 temporary items. Each item fields: title,desc,detail,currency("AP"|"SV"),ttl(1-8),icon,source,bodyAxis(optional),sourceIssueId(optional). Never include id, price or charmGain; the extension assigns all three. bodyAxis must be one of lips|face|eyes|skin|hair|posture|bodyShape|waistHip|legs|neckShoulders|bust|scent|breath|voice|touch|sensitivity|arousal|lubrication|orgasm|recovery|specialMark and only when the item genuinely changes that axis.
feedback.issues: max 2, only direct story evidence; fields id,axis(optional),source,note,severity(low|medium|high).
feedback.reactions: max 2, only directly observed reactions to established state/change; fields id,axis(optional),source,note,valence(negative|neutral|positive|sexual).
men: max 3 qualifying adult men updates; fields id(optional for new),name,meta,summary,relation,desire,lastContact,note,badges,present,contactDelta,qualifies.
evolution: only when a visible, mechanically-ready one-step administrator form evolution actually happens; fields targetLevel(2|3|4),reason. Never use it for ordinary mood/relationship changes.
Temporary shop items must arise from the just-written plot, not random catalog filler. Their names/descriptions are spoken by the male administrator in his current tone: ${voice.label}. Current CHARM=${state.host.charm}.
SYSTEM EVOLUTION LADDER:
Current administrator system level=${state.system?.level||1}; current form=${evolution.form}.
Current capability: ${evolution.capability}
Next evolution: ${nextEvolution ? `LV.${nextEvolution.level} ${nextEvolution.form}; mechanically ready=${nextEvolution.readiness.ok}` : 'MAX LEVEL'}.

Evolution is separate from romance. Attraction, sex, jealousy, attachment or love do not automatically make him more physical. Progression is supported by the host's long-term task/upgrade/story progress, then the administrator must actually undergo a fitting in-story system change.
If next evolution is not mechanically ready, do not evolve him.
If it is ready, he still does NOT evolve automatically. Wait for a fitting narrative moment where the change genuinely occurs in visible prose. Only then append evolution.targetLevel for exactly the next level plus a concise evolution.reason.
Never skip levels.
LV.1 意识体: voice/consciousness only. He cannot be seen, touch anything, or physically appear.
LV.2 Q版可视体: the adult male system consciousness gains a small chibi visual avatar visible to the host only. This is a stylized avatar, NOT a child and does not make his personality childish. He still cannot physically touch the host or world.
LV.3 有限成年实体: he may temporarily manifest as his adult male physical form and touch/interact with the physical world, but duration/range/energy remain limited. He cannot behave as permanently embodied yet.
LV.4 完全具现: stable adult physical body and autonomous movement. He may leave the host's immediate vicinity, act independently, and physically interact with the world. This grants physical capability, not romance or ownership over the host.
Do not reveal hidden numeric evolution thresholds in visible prose.

SYSTEM ACCESS LADDER:
Current SYSTEM access=${accessStage.toUpperCase()}.
Access progression is strictly LOCKED → PEEK → OPEN → PRIVATE. Never skip a stage, never downgrade, and never auto-upgrade from numbers alone.
LOCKED→PEEK qualification: hidden eligibility=${eligible}; invite-ready=${inviteReady}. Even when invite-ready is true, he must personally choose a fitting in-story moment to allow a first glimpse.
PEEK→OPEN qualification: open-ready=${openReady}. OPEN means he deliberately allows the host to inspect ordinary system/profile material; it is not a love confession.
OPEN→PRIVATE qualification: private-ready=${privateReady}. PRIVATE is a major act of personal trust/attachment and must be his autonomous choice. Do not grant it simply because the host asks, flirts, has sex, or reaches a CHARM number.
When he visibly chooses to advance exactly one stage, set permission.systemAccess to "peek", "open", or "private" matching that next stage.
PRIVATE still does NOT reveal the naming-right secret. Naming remains separately sealed until the late-love event “来自他的坦白”.
Set permission.signal only for a genuinely new change caused by a concrete event, and always include permission.signalReason. Allowed interest signals: impressed|curious|respect|amused|annoyed-but-invested. desire requires CHARM>=70 plus the slow-burn history gates above. attachment requires permission.signalTag and the long-term investment gates above. permission.love=true requires both permission.loveReason and permission.loveTag and must satisfy the full late-game slow-burn gates; never use beauty, sex, jealousy, system level or one dramatic scene as a shortcut.
Never explain hidden qualification mechanics in visible prose.`;

  context.setExtensionPrompt(MEME_RUNTIME_PROMPT_ID,prompt,1,2,false,0);
}

const RUDE_TASK_NAMES = {
  clean:'先把自己洗得像个人',
  mirror:'对着镜子认清现实',
  walk:'动一动，别继续长在椅子上',
  posture:'别缩成一团',
  outfit:'穿得别像刚从垃圾袋里爬出来',
  spark:'先证明真有男人想操你',
  sample:'第一次精液，别空手回来',
  oral:'这张嘴总得有点别的用处',
  repeat:'第二次还来？那就不算意外了',
  drain:'都上床了就把精液榨干净',
  audit:'让我重新看看你到底救回来多少',
  contract:'你现在还没资格知道',
  override:'真有本事就拿一次越级奖励',
};

const CHARM_GAIN = {
  // Appearance/presentation cleanup: each permanent level moves objective CHARM a little.
  lip1:1.3, hair1:1.3, skin1:1.3, posture1:1.3, leg1:1.3, neck1:1.3,
  scent1:1.3, breath1:1.3, voice1:1.3, touch1:1.3, scent2:1.3, charmseal:1.3,

  // Structural/proportion work has a larger visible effect.
  face1:2.1, eye1:2.1, face2:2.1, bodyfat1:2.1, waist1:2.1, bust1:2.1,

  // Adult-response upgrades change experience, not outward CHARM.
  sensitive1:0, arousal1:0, lubrication1:0, orgasm1:0, recovery1:0,
};

const SHOP_MAX_LEVEL = {
  lip1:3, hair1:4, skin1:4, face1:3, eye1:3, face2:3,
  posture1:3, bodyfat1:4, waist1:4, leg1:3, neck1:3, bust1:4,
  scent1:3, breath1:3, voice1:4, touch1:3, scent2:3,
  sensitive1:4, arousal1:4, lubrication1:4, orgasm1:4, recovery1:4,
  charmseal:1,
};

const SHOP_PHASES = [
  {id:'rescue', minLevels:0, label:'抢救货架', code:'RESCUE', level:1},
  {id:'refine', minLevels:8, label:'精修货架', code:'REFINE', level:2},
  {id:'beauty', minLevels:20, label:'美女货架', code:'BEAUTY', level:3},
  {id:'advanced', minLevels:35, label:'高阶货架', code:'ADVANCED', level:4},
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
    return {
      currentLevel:0,
      nextLevel:1,
      maxLevel:1,
      soldOut:Boolean(state.upgrades?.[item.id]),
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
  const seed=(Number(state.host?.charm)||0)+(Number(state.history?.length)||0)+salt;
  return lines[Math.abs(seed)%lines.length];
}

function systemHomeLine(state=runtimeState()){
  return pickStable(attitude(state).home,state,3);
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
  if(task.dynamicTask) return task.title;
  const i=toneIndex(state);
  if(i===0) return RUDE_TASK_NAMES[task.id] || task.title;
  if(i===1) return task.title + ' · 别偷懒';
  if(i===2) return task.title;
  if(i===3) return task.title + ' · 给我看看';
  return task.title + ' · 乖一点';
}

function taskVoiceDesc(task,state=runtimeState()){
  if(task.dynamicTask) return task.desc;
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
    if(kind==='purchase') return action.effect?.purchase?.id===id;
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
    return {ok:false,reason:`${view.phase.label} · 外观/感官改造累计 ${view.phase.minLevels} 级`};
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
  return {ok:true,reason:''};
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
  const generated=(state.tasks?.generated||[]).find(task=>task.id===id);
  if(generated) return {...generated,category:'desire',dynamicTask:true};
  for(const [category,tasks] of Object.entries(TASK_DATA)){
    const task=tasks.find(x=>x.id===id);
    if(task) return {...task,category};
  }
  return null;
}

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

function statsMarkup(compact = false) {
  const state=runtimeState();
  return `
    <div class="meme-stat-grid ${compact ? 'meme-stat-grid--compact' : ''}">
      <article><small>AP</small><strong>${String(state.resources.ap).padStart(3,'0')}</strong><em>改造点</em></article>
      <article><small>SV</small><strong>${String(state.resources.sv).padStart(3,'0')}</strong><em>精液值</em></article>
      <article><small>CHARM</small><strong>${String(state.host.charm).padStart(2,'0')}</strong><em>综合魅力</em></article>
    </div>
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
        <span>7 / 7</span>
      </div>
      <div class="meme-module-grid">
        ${moduleCard('me','ME','看看这副身子还剩多少能救')}
        ${moduleCard('task','TASK','去干活，别光会发骚')}
        ${moduleCard('shop','SHOP','花钱把这副身子修得能看')}
        ${moduleCard('men','MEN','睡过你、想睡你的男人')}
        ${moduleCard('system','SYSTEM','看我干什么')}
        ${moduleCard('record','RECORD','你干过的脏事我都记着')}
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
  const dailyLike=task.category==='daily' || repeatable;
  const activeRecord=state.tasks?.active?.[task.id];
  const active=Boolean(activeRecord) && (!dailyLike || Number(activeRecord.storyDay||storyDay)===storyDay);
  const completed=dailyLike
    ? Number(state.tasks?.dailyCompleted?.[task.id]?.day||0)===storyDay
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
  const base=(TASK_DATA[category] || TASK_DATA.daily).map(task=>({...task,category}));
  const generated=category==='desire'
    ? (runtimeState().tasks?.generated||[]).map(task=>({...task,category:'desire',dynamicTask:true}))
    : [];
  return [...base,...generated].map(task=>taskItem(task)).join('');
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
      ${labelValue('日常',`DAY ${String(Math.max(1,Number(state.tasks?.storyDay)||1)).padStart(3,'0')} · 每项每天可结算一次，剧情跨天后刷新。`)}
      ${labelValue('欲望','五个基础里程碑之外，系统会随剧情继续生成新的成人任务；每个不同任务只计一次进化进度，重复采集只负责赚 SV。')}
      ${labelValue('不同任务',`${distinctEroticTaskCount(state)} 个已完成`,'重复做同一任务不重复计数')}
      ${labelValue('特殊','我什么时候想发，什么时候才有。')}
      ${labelValue('结算','接取后把完成过程写在同一条或后续剧情里；模型验收通过的那条回复中，扩展直接发奖励并划掉任务。')}
    </section>
  `;
}

function shopItem(item,category) {
  const state=runtimeState();
  const view=staticShopView(item,state);
  const req=shopRequirement(item,state);
  const pending=pendingFor('purchase',item.id,state);
  const spendable=getSpendableResources(state);
  const enough=item.currency==='AP' ? spendable.ap>=view.price : item.currency==='SV' ? spendable.sv>=view.price : false;
  const soldOut=view.soldOut;
  let button=soldOut?'改满了':pending?'待发送':!req.ok?'锁着':!enough?'穷':'买';
  const levelMeta=item.dynamic
    ? 'PLOT · 临时货'
    : `${view.phase.code} · ${view.currentLevel}/${view.maxLevel} → ${ROMAN_LEVELS[Math.max(0,view.nextLevel-1)]}`;

  return `
    <article class="meme-shop-card ${(!req.ok||soldOut)?'is-locked':''}" data-shop-id="${item.id}" data-shop-category="${category}">
      <span class="meme-shop-icon" data-shop-detail>${item.icon}</span>
      <div class="meme-shop-copy" data-shop-detail>
        <b>${soldOut ? (state.upgrades?.[item.id]?.title || item.title) : shopVoiceName(item,state)}</b>
        <p>${soldOut ? '这项已经被你改到当前版本上限。再点也榨不出第五层。' : shopVoiceDesc(item,state)}</p>
        <small>${levelMeta} · ${req.ok ? (view.nextLevel===1 ? item.req : view.phase.label) : req.reason}</small>
        <div class="meme-shop-detail">${item.detail}</div>
      </div>
      <div class="meme-shop-buy">
        <strong>${item.currency==='LOCK'?'—':view.price}</strong><em>${item.currency}</em>
        <button type="button" data-shop-action="${item.id}" ${(soldOut||pending||!req.ok||!enough)?'disabled':''}>${button}</button>
      </div>
    </article>
  `;
}

function renderShopList(category='appearance') {
  if(category==='plot') return getDynamicShop().map(item=>shopItem(item,'plot')).join('') || '<div class="meme-men-empty"><small>NO PLOT GOODS</small><b>现在没什么值得临时上架</b><p>剧情真发生点有意思的事，我自然会塞东西进来。</p></div>';
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
      ${labelValue('货架规则','同一项目可以继续升Ⅱ / Ⅲ / Ⅳ级。','越往后越贵，也越不是“擦屁股级修复”。')}
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
      <p class="meme-men-rule-note">淡出 MEN 的旧人只在 RECORD 留一笔。以后真撞回来，我会把旧档案重新翻出来。</p>
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
      <article><small>当前态度</small><b>${voice.code}</b><span><i style="width:${(toneIndex(state)+1)*20}%"></i></span></article>
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
    title:entry.title || '系统操作',
    desc:entry.summary || entry.text,
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
    globalThis.toastr?.warning?.(`没资格。先把 ${unlock.reason} 做到。`);
    return;
  }

  const storyDay=Math.max(1,Number(state.tasks?.storyDay)||1);
  const repeatable=task.repeatable==='daily';
  const dailyLike=task.category==='daily' || repeatable;
  const completedToday=dailyLike && Number(state.tasks?.dailyCompleted?.[id]?.day||0)===storyDay;
  const completedPermanent=!dailyLike && task.category!=='daily' && Boolean(state.tasks?.completed?.[id]);
  if(completedToday || completedPermanent){
    globalThis.toastr?.info?.(completedToday?'今天已经结算过了。':'这份任务已经结算过了。');
    return;
  }
  if(state.tasks?.active?.[id]){
    globalThis.toastr?.info?.('任务已经挂着了。把完成过程写进剧情，我会验收。');
    return;
  }
  if(pendingFor('taskAccept',id,state)){
    globalThis.toastr?.info?.('已经在输入框里了。写完你怎么做的，再一起发。');
    return;
  }

  const voiced=taskVoiceName(task,state);
  const dayTag=dailyLike?`DAY ${String(storyDay).padStart(3,'0')}｜`:'';
  const text=`【MÉMÉ OS｜任务接取】${dayTag}TASK_ID:${task.id}｜「${voiced}」\n任务要求：${taskVoiceDesc(task,state)}\n完成过程：`;

  await queueAction(createPendingAction({
    type:'task_accept',
    recordType:'task',
    title:`接取：${voiced}`,
    summary:`接取任务「${voiced}」，等待剧情完成与系统验收。`,
    text,
    effect:{taskAccept:{id:task.id,title:voiced,category:task.category}},
  }));
}
async function handleShopAction(id){
  const item=findShopItem(id);
  if(!item) return;
  const state=runtimeState();
  const view=staticShopView(item,state);
  const req=shopRequirement(item,state);
  if(view.soldOut){
    globalThis.toastr?.info?.('这项已经改满了。再戳也不会长出第五级。');
    return;
  }
  if(!req.ok){
    globalThis.toastr?.warning?.(`锁着呢。先做到：${req.reason}。`);
    return;
  }
  if(pendingFor('purchase',id,state)){
    globalThis.toastr?.info?.('这一层已经在输入框里等你发送。');
    return;
  }

  const spendable=getSpendableResources(state);
  const balance=item.currency==='AP'?spendable.ap:spendable.sv;
  if(balance<view.price){
    globalThis.toastr?.warning?.(`穷。还差 ${view.price-balance} ${item.currency}。`);
    return;
  }

  const voiced=shopVoiceName(item,state);
  const charmGain=Number(item.dynamic ? item.charmGain : (CHARM_GAIN[item.id]||0));
  const bodyDelta=item.dynamic
    ? (item.bodyAxis ? {[item.bodyAxis]:1} : {})
    : (BODY_EFFECTS[item.id] || {});
  const apDelta=item.currency==='AP'?-view.price:0;
  const svDelta=item.currency==='SV'?-view.price:0;
  const levelText=item.dynamic?'剧情临时改造':`LV.${view.nextLevel}`;
  const text=`【MÉMÉ OS｜已结算｜勿重复结算】购入「${voiced}」· ${levelText}；${item.currency} -${view.price}${charmGain?`；CHARM +${charmGain}`:''}。扩展已完成扣款、等级与身体轴结算，正文只描写改造后的结果。`;

  await queueAction(createPendingAction({
    type:'purchase',
    recordType:'change',
    title:`购入：${voiced}`,
    summary:`购入「${voiced}」· ${levelText}；${item.currency} -${view.price}${charmGain?`；CHARM +${charmGain}`:''}。`,
    text,
    effect:{
      apDelta,
      svDelta,
      charmDelta:charmGain,
      bodyDelta,
      purchase:{id:item.id,title:voiced,category:item.category,level:view.nextLevel},
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
  const {committed}=await commitPendingActions(sentMessage.mes || '');
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
  if(events.MESSAGE_RECEIVED) source.on(events.MESSAGE_RECEIVED,async(messageId)=>{
    await handleRuntimeEvent(messageId);
    installRuntimePrompt();
  });
  if(events.CHAT_CHANGED) source.on(events.CHAT_CHANGED,async()=>{
    // getState() is chatId-scoped. Switching chats only re-renders the state
    // that belongs to that chat; it never clears or mutates another save.
    runtimeState();
    renderView('home',false);
    installRuntimePrompt();
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

function openMemeOS() {
  const dialog=ensureDialog();
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

function start() {
  mount();
  ensureDialog();
  bindSillyTavernEvents();
  installRuntimePrompt();
  globalThis.__meme_os_probe_timer__ = setInterval(mount, 1000);
  window.addEventListener('resize', mount, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(mount,150), { passive:true });
}

if (globalThis.jQuery) globalThis.jQuery(start);
else if (globalThis.$) globalThis.$(start);
else setTimeout(start,1000);
