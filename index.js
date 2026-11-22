import {
  addPendingAction,
  commitPendingActions,
  createPendingAction,
  getSpendableResources,
  getState,
  hasActiveChat,
  removePendingAction,
  saveState,
} from './src/state.js?v=0.8.3';
import { appendToInput, removeFromInput } from './src/input.js?v=0.8.3';
import { isBoundCharacter } from './src/binding.js?v=0.8.3';

/**
 * MÉMÉ OS v0.8.3
 * Navigable content shell. Visual style + native <dialog> retained.
 * Persistent state, tone engine, pending actions and transaction commits are live in this build.
 */
const MEME_ID = 'meme-os-heart-launcher';
const DIALOG_ID = 'meme-os-dialog';

const PREVIEW_STATE = {
  ap: 0,
  sv: 0,
  charm: 0,
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
  {type:'system',code:'BINDING',title:'MÉMÉ OS 绑定完成',desc:'随机宿主绑定成功。AP 0 / SV 0 / CHARM 0。'},
  {type:'change',code:'SCAN',title:'首次宿主扫描',desc:'系统判定：明显难看 · 未改造。改造进度 0%。'},
  {type:'system',code:'ADMIN',title:'管理员首次评价',desc:'“先去洗头。”'},
];


const VOICE_STAGES = [
  {
    id:'disgust', min:0, max:14, label:'纯嫌弃期', code:'VENOM',
    rule:'他骨子里就刻薄嘴臭。此阶段没有夸奖、没有嘴硬心软、没有隐藏喜欢；只会挑缺点、嫌烦、讽刺、命令。',
    home:[
      '“别盯着界面看。先去洗头。”',
      '“零魅力。你现在最该研究的是怎么把自己收拾干净。”',
      '“我没在打击你，我只是在陈述一件很难看的事实。”',
      '“少跟我讲自信。自信不能替你洗头。”'
    ],
  },
  {
    id:'repair', min:15, max:34, label:'抢救期', code:'REPAIR',
    rule:'承认改造确实有用，但夸奖极度吝啬。最多说“至少不那么碍眼”“总算像个人”，语气仍尖刻，不许温柔。',
    home:[
      '“至少现在没刚绑定时那么灾难。”',
      '“别笑。‘有改善’和‘好看’中间隔着一整条银河。”',
      '“勉强算你没白折腾。就勉强。”',
      '“现在能看两眼了。第三眼再说。”'
    ],
  },
  {
    id:'acceptable', min:35, max:54, label:'顺眼期', code:'ACCEPT',
    rule:'他开始承认宿主已经像样、甚至偶尔好看，但仍舍不得直接夸。更多用反话、挑刺和极短的认可掩饰，不产生色情兴趣。',
    home:[
      '“……这次确实顺眼。你最好别逼我重复。”',
      '“别得意，我说的是‘不难看’，不是‘漂亮得让我失智’。”',
      '“总算不用每次看数据都想申请工伤。”',
      '“嗯。今天这张脸没什么特别值得骂的。”'
    ],
  },
  {
    id:'pretty', min:55, max:69, label:'漂亮期', code:'PRETTY',
    rule:'客观上已经明显好看，他会非常吝啬地承认“漂亮”。仍没有自动欲望，更不会因为漂亮就变温柔；嘴臭照旧。',
    home:[
      '“行，漂亮。满意了？别让我说第二遍。”',
      '“现在确实有人会回头看你。你先把那副得意样收一收。”',
      '“脸是好看了，性格还是烦。”',
      '“我承认你现在漂亮。只代表我的眼睛没坏，不代表别的。”'
    ],
  },
  {
    id:'beauty', min:70, max:84, label:'美女期', code:'BEAUTY',
    rule:'已经达到这个纯颜控真正认可的美女门槛。只有从这里开始，若剧情另外产生真实欲望信号，他才可能出现性兴趣；没有欲望信号时仍只是冷静承认漂亮。',
    home:[
      '“……现在倒是真的配得上‘美女’两个字了。”',
      '“别靠那么近。我只是在确认改造结果。”',
      '“长成这样以后，你倒是终于有资格让我挑得更细了。”',
      '“漂亮是漂亮。别擅自把这句话理解成我喜欢你。”'
    ],
  },
  {
    id:'stunning', min:85, max:999, label:'高魅力美女期', code:'STUNNING',
    rule:'外貌已经非常符合他的审美。若欲望线已产生，他会更露骨、更挑剔、更有占有式审美，但仍不等于爱。真正温柔只允许在独立的爱意状态成立后偶尔出现。',
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
  sensitive1:'把这副迟钝身体调灵一点',
  arousal1:'别连自己想不想要都搞不懂',
  lubrication1:'至少让身体学会自己配合',
  orgasm1:'别高潮都这么没出息',
  recovery1:'玩完别立刻瘫成一滩',
  charmseal:'给你烙个终于配得上的印记',
  qadmin:'想看我？先把等级爬上来',
  touchadmin:'想让我碰你？资格还没到',
  embody:'等你真有本事把我弄出来',
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
  sensitive1:'你现在身体反应慢得像没开机。先把感受调灵一点，别每次都等半天。',
  arousal1:'连自己有没有欲望都辨认不清。先学会知道自己什么时候真的想要。',
  lubrication1:'身体别每次都等到最后才肯配合。把自然反应调快一点。',
  orgasm1:'有反应不代表会享受。把高潮质量往上提，不是单纯追求次数。',
  recovery1:'一次亲密活动就累得什么都不想动，太没用。把恢复速度往回拉。',
  charmseal:'等你真的好看到配得上这个印记，我才会给。现在看两眼就行。',
  qadmin:'想看见我？先把自己和系统等级一起弄上去。白嫖不存在。',
  touchadmin:'连看都还没看见就惦记上手。想得挺快。',
  embody:'把我完整弄出来这种事，不是你现在这点成绩能碰的。',
};

const RUDE_TASK_DESCS = {
  clean:'先把头洗了、澡洗了、衣服换了、牙刷了。最基础的卫生都做不到，别跟我谈改造。',
  mirror:'照三分钟镜子，不许躲、不许只看顺眼的角度。你得先知道自己到底哪里难看。',
  walk:'坐着不会自动变好看。起来动二十分钟，别把“改造”理解成躺着等我给。',
  posture:'肩膀打开，背挺起来。你再缩成那样，买再多东西也只是把好东西堆在烂姿态上。',
  outfit:'不用贵，先穿干净、合身、像认真挑过的衣服。别再把随便套上身当风格。',
  spark:'先证明真有成年男人会对你产生欲望。不是礼貌，不是客套，是他真的想碰你。',
  sample:'拿到第一次有效样本再回来。别拿一点暧昧就当自己完成成人任务。',
  oral:'这次别只会嘴硬。完成有效的成人口腔采集，系统要的是结果。',
  repeat:'同一个人第二次还主动回来，才说明上次不是纯事故。让我看看你到底有没有留住他的欲望。',
  drain:'既然都做到这一步，就别空手结束。把完整采集拿回来再结算。',
  audit:'站好。让我重新从头扫一遍，看看到底救回来多少，还是你只会自我感觉良好。',
  qform:'等我愿意让你看见的时候，你自然会看见。现在急也没用。',
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


const MEME_RUNTIME_PROMPT_ID='meme_os_runtime_bridge';

function sanitizeDynamicItem(raw,state=runtimeState()){
  if(!raw || typeof raw!=='object') return null;
  const id=String(raw.id || `plot_${Date.now()}_${Math.random().toString(36).slice(2,6)}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48);
  const currency=raw.currency==='SV'?'SV':'AP';
  const price=Math.max(0,Math.min(9999,Math.round(Number(raw.price)||0)));
  const charmGain=Math.max(0,Math.min(0.5,Number(raw.charmGain)||0));
  const ttl=Math.max(1,Math.min(8,Math.round(Number(raw.ttl)||4)));
  const title=String(raw.title||'临时改造').slice(0,40);
  const desc=String(raw.desc||'系统临时上架。').slice(0,140);
  const detail=String(raw.detail||'根据当前剧情临时出现，过期后自动撤架。').slice(0,180);
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
  };
}

function getDynamicShop(state=runtimeState()){
  const turn=Number(state.shop?.plotTurn)||0;
  return (state.shop?.dynamic||[]).filter(item=>Number(item.expiresTurn||0)>=turn && !state.upgrades?.[item.id]);
}

async function handleRuntimeEvent(messageId){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const context=globalThis.SillyTavern?.getContext?.()||{};
  const message=Number.isInteger(messageId)?context.chat?.[messageId]:null;
  if(!message || message.is_user) return;

  const state=runtimeState();
  state.shop=state.shop||{dynamic:[],plotTurn:0};
  state.shop.plotTurn=(Number(state.shop.plotTurn)||0)+1;
  state.shop.dynamic=(state.shop.dynamic||[]).filter(item=>Number(item.expiresTurn||0)>=state.shop.plotTurn);

  const raw=String(message.mes||'');
  const matches=[...raw.matchAll(/<!--MEME_OS_EVENT\s+([\s\S]*?)-->/g)];
  let changed=false;

  for(const match of matches){
    try{
      const event=JSON.parse(match[1].trim());

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

      if(event.permission?.signal){
        const signal=String(event.permission.signal);
        if(['impressed','curious','respect','amused','annoyed-but-invested'].includes(signal)){
          state.permission.adminInterestSignals=Math.min(20,(Number(state.permission.adminInterestSignals)||0)+1);
          changed=true;
        }
        if(signal==='desire' && Number(state.host?.charm||0)>=70){
          state.permission.adminDesireSignals=Math.min(20,(Number(state.permission.adminDesireSignals)||0)+1);
          state.permission.adminInterestSignals=Math.min(20,(Number(state.permission.adminInterestSignals)||0)+1);
          changed=true;
        }
        if(signal==='attachment' && Number(state.permission.adminDesireSignals||0)>=2){
          state.permission.adminAttachmentSignals=Math.min(20,(Number(state.permission.adminAttachmentSignals)||0)+1);
          changed=true;
        }
      }

      if(event.permission?.love===true &&
         Number(state.host?.charm||0)>=70 &&
         Number(state.permission.adminAttachmentSignals||0)>=3){
        state.permission.adminLove=true;
        changed=true;
      }

      if(event.permission?.unlockSystem===true && state.permission?.systemInviteReady){
        state.system.pageUnlocked=true;
        state.permission.systemUnlockedByAdmin=true;
        changed=true;
        state.history.push({
          id:`meme_system_unlock_${Date.now()}`,
          type:'system_unlock',
          recordType:'system',
          title:'SYSTEM 权限由管理员主动开放',
          summary:'管理员自行决定开放 SYSTEM 私人区域。',
          text:'SYSTEM ACCESS GRANTED BY ADMIN',
          committedAt:Date.now(),
        });
      }
    }catch(error){
      console.warn('[MÉMÉ OS] runtime event parse failed',error);
    }
  }

  // Hidden eligibility is recalculated here too, without auto-unlocking.
  const milestones=state.permission?.milestones||{};
  state.permission.systemEligible=
    Number(state.host?.charm||0)>=1 &&
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
  const prompt=`[MÉMÉ OS runtime bridge]
HOST PERSONA RULE:
Do not define the host's name, age beyond adulthood, height, job, personality, hobbies, romantic style or personal history here. The host's identity/personality comes from the current SillyTavern Persona and the live conversation. MÉMÉ OS may define only the system-specific starting transformation condition and tracked state. Never overwrite or homogenize the user's Persona.

ADMINISTRATOR CHARACTER INVARIANTS:
He is a vivid adult male with strong private tastes, opinions, irritations and agency, not a helpful generic system. He is naturally sharp-tongued, judgmental, vain about aesthetics, impatient, mean in a witty specific way, observant, remembers slights, dislikes cheap flattery and fake inspirational talk, enjoys needling the host when she gives him an opening, and does not soften merely because time passes.
He is a genuine extreme lookist. Before CHARM 55 he is extremely stingy with praise; before CHARM 70 he must NOT experience genuine sexual attraction to the host. At 55-69 he may grudgingly admit she is pretty. At 70+ she qualifies as a beauty, but beauty alone still does not equal desire, affection or love.
Separate these axes strictly: appearance evaluation != sexual desire != emotional bond. He can admit she is beautiful while still finding her annoying. He can desire her without loving her. Tenderness is NOT a normal tone stage. Only if adminLove=true may rare genuine tenderness appear, and even then his native sharpness remains.
Current CHARM=${state.host.charm}; desire allowed by appearance=${desireAllowed}; adminLove=${loveState}.

Only when the current story creates a genuinely relevant new shop opportunity or changes the administrator's private interest, append ONE invisible HTML comment at the very end of the assistant reply.
Format exactly: <!--MEME_OS_EVENT {"shop":[],"permission":{}} -->
Do not emit the comment when nothing relevant changed.
shop: maximum 2 temporary items. Each item fields: id,title,desc,detail,price,currency("AP"|"SV"),charmGain(0|0.25|0.5),ttl(1-8),icon,source.
Temporary shop items must arise from the just-written plot, not random catalog filler. Their names/descriptions are spoken by the male administrator in his current tone: ${voice.label}. Current CHARM=${state.host.charm}.
SYSTEM access is NEVER unlocked merely by numbers. Hidden eligibility=${eligible}; invite-ready=${inviteReady}. You may set permission.signal to one of impressed|curious|protective|desire|respect only when his actual attitude changes because of what the host did. Set permission.unlockSystem=true only if invite-ready is true AND he personally chooses, in-story, to open the private SYSTEM area at a fitting moment. Never explain these mechanics in visible prose.`;

  context.setExtensionPrompt(MEME_RUNTIME_PROMPT_ID,prompt,1,2,false,0);
}

const RUDE_TASK_NAMES = {
  clean:'先把自己洗得像个人',
  mirror:'对着镜子认清现实',
  walk:'动一动，别继续长在椅子上',
  posture:'别缩成一团',
  outfit:'穿得别像刚从垃圾袋里爬出来',
  spark:'先证明真有人会对你起欲望',
  sample:'第一次把精液交上来',
  oral:'嘴别只会顶嘴',
  repeat:'第二次还来？那就不算意外了',
  drain:'既然都碰了，就别空手回来',
  audit:'让我重新看看你到底救回来多少',
  qform:'终于有资格看见我了',
  contract:'你现在还没资格知道',
  override:'真有本事就拿一次越级奖励',
};

const CHARM_GAIN = {
  // Small cleanup / polish: +0.25
  lip1:0.25,
  hair1:0.25,
  skin1:0.25,
  posture1:0.25,
  leg1:0.25,
  neck1:0.25,
  scent1:0.25,
  breath1:0.25,
  voice1:0.25,
  touch1:0.25,

  // Noticeable structural / attraction upgrades: +0.5
  face1:0.5,
  eye1:0.5,
  face2:0.5,
  bodyfat1:0.5,
  waist1:0.5,
  bust1:0.5,
  scent2:0.5,
  charmseal:0.5,

  // Adult-response upgrades change experience, not outward CHARM.
  sensitive1:0,
  arousal1:0,
  lubrication1:0,
  orgasm1:0,
  recovery1:0,
};

const REQUIRE_UPGRADE = {
  waist1:'bodyfat1',
  touch1:'skin1',
};

const REQUIRE_TASK = {
  sensitive1:'sample',
  lubrication1:'sample',
};

function runtimeState(){
  return getState();
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
  const i=toneIndex(state);
  if(i===0) return RUDE_SHOP_NAMES[item.id] || item.title;
  if(i===1) return (RUDE_SHOP_NAMES[item.id] || item.title).replace(/先|别再|终于/g,'').replace(/Ⅰ$/,'') + ' · 修复';
  if(i===2) return item.title.replace('Ⅰ','') + ' · 调整';
  if(i===3) return item.title.replace('Ⅰ','') + ' · 精修';
  return item.title.replace('Ⅰ','') + ' · 私人定制';
}

function shopVoiceDesc(item,state=runtimeState()){
  const i=toneIndex(state);
  if(i===0) return RUDE_SHOP_DESCS[item.id] || item.desc;
  const remarks=STAGE_REMARKS[i] || STAGE_REMARKS[1];
  const remark=remarks[hashId(item.id)%remarks.length];
  return `${remark} ${item.desc}`;
}

function taskVoiceName(task,state=runtimeState()){
  const i=toneIndex(state);
  if(i===0) return RUDE_TASK_NAMES[task.id] || task.title;
  if(i===1) return task.title + ' · 别偷懒';
  if(i===2) return task.title;
  if(i===3) return task.title + ' · 给我看看';
  return task.title + ' · 乖一点';
}

function taskVoiceDesc(task,state=runtimeState()){
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
    if(kind==='taskComplete') return action.effect?.taskComplete?.id===id;
    return false;
  }) || false;
}

function taskReward(task){
  const ap=Number(task.reward.match(/AP \+(\d+)/)?.[1]||0);
  const sv=Number(task.reward.match(/SV \+(\d+)/)?.[1]||0);
  return {ap,sv};
}

function taskUnlock(task,state=runtimeState()){
  const charm=Number(state.host?.charm)||0;
  const sys=Number(state.system?.level)||1;
  const map={spark:8,sample:12,oral:15,repeat:18,drain:25};
  if(map[task.id] && charm<map[task.id]) return {ok:false,reason:`CHARM ${map[task.id]}`};
  if(task.id==='qform' && sys<2) return {ok:false,reason:'SYSTEM LV.2'};
  if(task.id==='contract') return {ok:false,reason:'条件未知'};
  if(task.id==='override') return {ok:false,reason:'由剧情触发'};
  return {ok:true,reason:''};
}

function shopRequirement(item,state=runtimeState()){
  const charm=Number(state.host?.charm)||0;
  const min=Number(item.req?.match(/CHARM (\d+)/)?.[1]||0);
  if(min && charm<min) return {ok:false,reason:`CHARM ${min}`};
  if(item.currency==='LOCK') return {ok:false,reason:item.req||'SYSTEM LOCK'};
  const needUpgrade=REQUIRE_UPGRADE[item.id];
  if(needUpgrade && !state.upgrades?.[needUpgrade]) return {ok:false,reason:'前置改造未完成'};
  const needTask=REQUIRE_TASK[item.id];
  if(needTask && !state.tasks?.completed?.[needTask]) return {ok:false,reason:'前置欲望任务未完成'};
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
      <p>还没发送就不会结算。发送后才正式改数值。</p>
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

function findTask(id){
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

function totalMenCount() {
  const men = runtimeState().men || {};
  return ['current','recent','returning'].reduce((sum, key) => sum + (men[key]?.length || 0), 0);
}

function moduleCard(key,title,sub){
  const state=runtimeState();
  const systemLocked=key==='system' && !state.system?.pageUnlocked;
  const resolvedSub=key==='men'
    ? `${sub} · ${totalMenCount()}`
    : systemLocked
      ? '他没允许你看'
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
      <div><small>ADMINISTRATOR · ${voice.label}</small><b>${systemHomeLine(state)}</b></div>
    </section>

    <section class="meme-modules">
      <div class="meme-section-head">
        <div><small>PRIVATE ACCESS</small><h3>想看什么自己点</h3></div>
        <span>7 / 7</span>
      </div>
      <div class="meme-module-grid">
        ${moduleCard('me','ME','看看你现在有多惨')}
        ${moduleCard('task','TASK','我给你的活')}
        ${moduleCard('shop','SHOP','花点数救你')}
        ${moduleCard('men','MEN','沾过边的男人')}
        ${moduleCard('system','SYSTEM','看我干什么')}
        ${moduleCard('record','RECORD','你干过的事')}
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
        ${scanRow('面部',initial?'浮肿 / 比例不协调':'轮廓正在修复',Math.max(2,state.host.charm), initial?'bad':'low')}
        ${scanRow('体型',initial?'明显肥胖 / 线条模糊':'体态正在重塑',Math.max(1,state.host.charm-1), initial?'bad':'low')}
        ${scanRow('皮肤',initial?'粗糙 / 暗沉 / 出油':'肤质逐步改善',Math.max(2,state.host.charm), initial?'bad':'low')}
        ${scanRow('头发',initial?'油腻 / 毛躁 / 缺乏打理':'至少像认真洗过了',Math.max(1,state.host.charm), initial?'bad':'low')}
        ${scanRow('气味',initial?'清洁度不足':'气味正在优化',Math.max(0,state.host.charm-2), initial?'bad':'low')}
        ${scanRow('声线',initial?'普通 / 没辨识度':'听感逐步修正',Math.max(4,state.host.charm+1),'low')}
        ${scanRow('仪态',initial?'含胸 / 缩肩':'姿态正在修正',Math.max(2,state.host.charm),'low')}
      </div>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>RECONSTRUCTION</small><h3>我允许你改的地方</h3></div>
      <div class="meme-upgrade-list">
        ${levelRow('面部精修',state.upgrades.face2?'已启用':'未开始','轮廓、眼型、五官协调与细节修复')}
        ${levelRow('体态塑形',state.upgrades.bodyfat1?'已启用':'未开始','体脂趋势、腰臀、腿型与肩颈线条')}
        ${levelRow('皮肤优化',state.upgrades.skin1?'已启用':'未开始','肤质、细腻度、触感与光泽')}
        ${levelRow('发质系统',state.upgrades.hair1?'已启用':'未开始','清洁感、顺滑度与发丝状态')}
        ${levelRow('体香系统',state.upgrades.scent1?'已启用':'未开始','基础气味、近距离存在感与诱导体香')}
        ${levelRow('声线调整',state.upgrades.voice1?'已启用':'未开始','音色、稳定度与辨识度')}
        ${levelRow('仪态修正',state.upgrades.posture1?'已启用':'未开始','站姿、坐姿、肩颈与动作习惯')}
        ${levelRow('成人反应',state.tasks.completed.sample?'可解锁':'LOCKED','敏感度、分泌、高潮与恢复','SV · LOCK')}
      </div>
    </section>
  `;
}

function taskItem(task) {
  const state=runtimeState();
  const unlock=taskUnlock(task,state);
  const active=Boolean(state.tasks?.active?.[task.id]);
  const completed=Boolean(state.tasks?.completed?.[task.id]);
  const pending=pendingFor(active?'taskComplete':'taskAccept',task.id,state);
  let button='挂上';
  if(!unlock.ok) button='没资格';
  else if(completed) button='交过了';
  else if(pending) button='待发送';
  else if(active) button='交差';

  return `
    <article class="meme-task-card ${!unlock.ok ? 'is-locked' : ''} ${completed?'is-done':''}" data-task-id="${task.id}">
      <div class="meme-task-top"><span>${task.type}</span><em>${completed?'已完成':active?'已接取':unlock.ok?task.state:unlock.reason}</em></div>
      <div data-task-detail><h4>${taskVoiceName(task,state)}</h4><p>${taskVoiceDesc(task,state)}</p></div>
      <div class="meme-task-detail">${task.detail}</div>
      <div class="meme-task-foot">
        <b>${task.reward}</b>
        <button type="button" data-task-action="${task.id}" ${(!unlock.ok||completed||pending)?'disabled':''}>${button}</button>
      </div>
    </article>
  `;
}

function renderTaskList(category='daily') {
  return (TASK_DATA[category] || TASK_DATA.daily).map(taskItem).join('');
}

function taskMarkup() {
  const state=runtimeState();
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('MISSION CENTER','TASK · 我给你的活',attitude(state).code)}
    <div class="meme-tabbar" data-task-tabs>
      <button class="is-active" type="button" data-task-tab="daily">日常</button>
      <button type="button" data-task-tab="desire">欲望</button>
      <button type="button" data-task-tab="special">特殊</button>
    </div>
    <section class="meme-task-list" data-task-list>${renderTaskList('daily')}</section>
    <section class="meme-page-card meme-task-rules">
      <div class="meme-card-title"><small>MY RULES</small><h3>听清楚再接</h3></div>
      ${labelValue('日常','低 AP。该做的基本事，不值得我夸。')}
      ${labelValue('欲望','主要产出 SV。魅力不够就别做梦。')}
      ${labelValue('特殊','我什么时候想发，什么时候才有。')}
      ${labelValue('结算','发进聊天后才算完成操作，别让正文再扣第二次。')}
    </section>
  `;
}

function shopItem(item,category) {
  const state=runtimeState();
  const req=shopRequirement(item,state);
  const owned=Boolean(state.upgrades?.[item.id]);
  const pending=pendingFor('purchase',item.id,state);
  const spendable=getSpendableResources(state);
  const enough=item.currency==='AP' ? spendable.ap>=item.price : item.currency==='SV' ? spendable.sv>=item.price : false;
  let button=owned?'买过了':pending?'待发送':!req.ok?'锁着':!enough?'穷':'买';

  return `
    <article class="meme-shop-card ${(!req.ok||owned)?'is-locked':''}" data-shop-id="${item.id}" data-shop-category="${category}">
      <span class="meme-shop-icon" data-shop-detail>${item.icon}</span>
      <div class="meme-shop-copy" data-shop-detail>
        <b>${shopVoiceName(item,state)}</b>
        <p>${shopVoiceDesc(item,state)}</p>
        <small>${item.level} · ${req.ok?item.req:req.reason}</small>
        <div class="meme-shop-detail">${item.detail}</div>
      </div>
      <div class="meme-shop-buy">
        <strong>${item.currency==='LOCK'?'—':item.price}</strong><em>${item.currency}</em>
        <button type="button" data-shop-action="${item.id}" ${(owned||pending||!req.ok||!enough)?'disabled':''}>${button}</button>
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
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('DESIRE MARKET','SHOP · 花点数救你',attitude(state).code)}
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
    <p class="meme-preview-note">价格是我定的。买不起就去做任务，别盯着商品流口水。</p>
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
    ${pageHeader('TARGET ARCHIVE','MEN · 沾过边的男人',String(count).padStart(2,'0'))}
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
      <div class="meme-card-title"><small>MY ARCHIVE RULE</small><h3>我没兴趣替你记所有男人</h3></div>
      ${labelValue('CURRENT','最多 3 个。只留现在剧情真正在碰的。')}
      ${labelValue('RECENT','最多 8 个。睡过、榨过、约过、留过联系方式才配进。')}
      ${labelValue('RETURNING','最多 5 个。真的再次出现才算，不叫长期对象。')}
      ${labelValue('路人','说两句话的我懒得记。')}
      <p class="meme-men-rule-note">淡出 MEN 的旧人只在 RECORD 留一笔。以后真撞回来，我会把旧档案重新翻出来。</p>
    </section>
  `;
}

function lockedSystemMarkup(){
  const state=runtimeState();
  return `
    ${pageHeader('ACCESS DENIED','SYSTEM · 他不让你看','LOCKED')}
    <section class="meme-system-locked-card">
      <div class="meme-admin-emblem">${crownMarkup()}</div>
      <small>PRIVATE ACCESS</small>
      <h3>谁准你翻我的档案了？</h3>
      <p>“这区什么时候开，我说了算。不是你刷够某个数字就能进。先证明你不是个只会点按钮的废物。”</p>
      <div class="meme-system-lock-hints">
        <span>持续完成任务</span>
        <span>真的发生改造</span>
        <span>让我开始对你有兴趣</span>
      </div>
      <span>满足资格后，仍需管理员主动授权</span>
    </section>
  `;
}

function systemMarkup() {
  const state=runtimeState();
  const voice=attitude(state);
  const next=VOICE_STAGES[Math.min(VOICE_STAGES.length-1,toneIndex(state)+1)];
  return `
    ${pendingTrayMarkup(state)}
    ${pageHeader('ADMINISTRATOR','SYSTEM · 看我干什么',voice.code)}
    <section class="meme-admin-card">
      <div class="meme-admin-emblem">${crownMarkup()}</div>
      <div class="meme-admin-copy">
        <small>CURRENT ATTITUDE</small>
        <h3>${voice.label}</h3>
        <p>成年男性系统意识体。态度跟着宿主实际改造结果变，不会因为“你是宿主”就自动喜欢你。</p>
      </div>
    </section>

    <section class="meme-system-meters">
      <article><small>综合魅力</small><b>${state.host.charm}</b><span><i style="width:${Math.min(100,state.host.charm)}%"></i></span></article>
      <article><small>当前态度</small><b>${voice.code}</b><span><i style="width:${(toneIndex(state)+1)*20}%"></i></span></article>
      <article><small>系统权限</small><b>${state.system.level} / 4</b><span><i style="width:${state.system.level*25}%"></i></span></article>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>VOICE PROTOCOL</small><h3>我的嘴不会一直一个样</h3></div>
      ${VOICE_STAGES.map(stage=>`
        <div class="meme-voice-rule ${stage.id===voice.id?'is-current':''}">
          <span>${stage.code}</span>
          <div><b>${stage.min}–${stage.max===999?'100':stage.max} · ${stage.label}</b><p>${stage.rule}</p></div>
        </div>
      `).join('')}
      <p class="meme-men-rule-note">规则：任务名、商品名、商品说明、宿主评价、提示语、报错和管理员留言全部先经过当前态度层。结构标签可以保持简短，但内容不许突然变成客服腔。</p>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>ADMIN PROFILE</small><h3>我本来就这样</h3></div>
      ${labelValue('核心性格','审美偏执 / 嘴毒 / 自负 / 色情 / 不耐烦')}
      ${labelValue('绑定原因','纯随机。别自作多情。','NO DESTINY')}
      ${labelValue('当前态度',voice.label)}
      ${labelValue('下一变化',next.id===voice.id?'已经到最高态度层':`CHARM ${next.min} → ${next.label}`)}
      ${labelValue('目前建议',toneIndex(state)===0?'先去洗头':'继续改，别停')}
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>PRIVATE PREFERENCE</small><h3>别把我的癖好往你身上套</h3></div>
      ${labelValue('审美对象','漂亮的成年女性')}
      ${labelValue('特殊癖好','对睡眠状态下的漂亮成年女性有明显性兴趣')}
      ${labelValue('宿主适用',toneIndex(state)===0?'目前完全不适用':'随魅力上升重新判定')}
      <p class="meme-men-rule-note">这是我原本就有的偏好，不是因为绑定你才长出来的。你够不够格，是另一回事。</p>
    </section>

    <section class="meme-page-card">
      <div class="meme-card-title"><small>EVOLUTION</small><h3>想看见我？慢慢爬。</h3></div>
      <div class="meme-system-levels">
        <article class="${state.system.level>=1?'is-on':''}"><span>01</span><div><b>意识体</b><small>脑内声音 · 当前基础形态</small></div></article>
        <article class="${state.system.level>=2?'is-on':''}"><span>02</span><div><b>Q 版可视</b><small>只有宿主能看见</small></div></article>
        <article class="${state.system.level>=3?'is-on':''}"><span>03</span><div><b>有限实体</b><small>短时触碰 · 仍受限制</small></div></article>
        <article class="${state.system.level>=4?'is-on':''}"><span>04</span><div><b>完全具现</b><small>稳定成年实体 · 自主行动</small></div></article>
      </div>
    </section>

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
    ${pageHeader('PRIVATE LOG','RECORD · 你干过的事',String(RECORD_DATA.length+(state.history?.length||0)).padStart(2,'0'))}
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
    system: () => runtimeState().system?.pageUnlocked ? systemMarkup() : lockedSystemMarkup(),
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
  if(state.tasks?.completed?.[id]){
    globalThis.toastr?.info?.('这份差已经交过了。别想重复领。');
    return;
  }

  const voiced=taskVoiceName(task,state);
  if(state.tasks?.active?.[id]){
    const reward=taskReward(task);
    const text=`【MÉMÉ OS｜已结算｜勿重复结算】完成任务「${voiced}」；AP +${reward.ap}${reward.sv?`；SV +${reward.sv}`:''}。扩展已负责数值结算，正文只承认结果。`;
    await queueAction(createPendingAction({
      type:'task_complete',
      recordType:'task',
      title:`完成：${voiced}`,
      summary:`完成任务「${voiced}」，获得 AP +${reward.ap}${reward.sv?` / SV +${reward.sv}`:''}。`,
      text,
      effect:{
        apDelta:reward.ap,
        svDelta:reward.sv,
        taskComplete:{id:task.id,title:voiced,category:task.category},
      },
    }));
    return;
  }

  const text=`【MÉMÉ OS｜已结算｜勿重复结算】接取任务「${voiced}」。扩展已记录为进行中；正文只承认任务状态，不要重复生成或扣改数值。`;
  await queueAction(createPendingAction({
    type:'task_accept',
    recordType:'task',
    title:`接取：${voiced}`,
    summary:`接取任务「${voiced}」。`,
    text,
    effect:{taskAccept:{id:task.id,title:voiced,category:task.category}},
  }));
}

async function handleShopAction(id){
  const item=findShopItem(id);
  if(!item) return;
  const state=runtimeState();
  const req=shopRequirement(item,state);
  if(!req.ok){
    globalThis.toastr?.warning?.(`锁着呢。先做到：${req.reason}。`);
    return;
  }
  if(state.upgrades?.[id]){
    globalThis.toastr?.info?.('买过了。别重复点。');
    return;
  }
  if(pendingFor('purchase',id,state)){
    globalThis.toastr?.info?.('已经在输入框里等你发送。');
    return;
  }

  const spendable=getSpendableResources(state);
  const balance=item.currency==='AP'?spendable.ap:spendable.sv;
  if(balance<item.price){
    globalThis.toastr?.warning?.(`穷。还差 ${item.price-balance} ${item.currency}。`);
    return;
  }

  const voiced=shopVoiceName(item,state);
  const charmGain=Number(item.dynamic ? item.charmGain : (CHARM_GAIN[item.id]||0));
  const apDelta=item.currency==='AP'?-item.price:0;
  const svDelta=item.currency==='SV'?-item.price:0;
  const text=`【MÉMÉ OS｜已结算｜勿重复结算】购入「${voiced}」；${item.currency} -${item.price}${charmGain?`；CHARM +${charmGain}`:''}。扩展已完成扣款与改造记录，正文只描写改造后的结果。`;

  await queueAction(createPendingAction({
    type:'purchase',
    recordType:'change',
    title:`购入：${voiced}`,
    summary:`购入「${voiced}」；${item.currency} -${item.price}${charmGain?`；CHARM +${charmGain}`:''}。`,
    text,
    effect:{
      apDelta,
      svDelta,
      charmDelta:charmGain,
      purchase:{id:item.id,title:voiced,category:item.category,level:1},
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
    globalThis.toastr?.success?.(`MÉMÉ OS 已正式结算 ${committed.length} 项。`);
  }
}

async function migratePendingCharmGains(){
  const state=runtimeState();
  if(!Array.isArray(state.pending) || !state.pending.length) return;

  const textarea=document.querySelector('#send_textarea');
  let changed=false;

  for(const action of state.pending){
    const id=action.effect?.purchase?.id;
    if(!id || !(id in CHARM_GAIN)) continue;

    const desired=Number(CHARM_GAIN[id]||0);
    const current=Number(action.effect?.charmDelta||0);
    if(current===desired) continue;

    const oldText=action.text || '';
    action.effect.charmDelta=desired;

    const replaceCharm=(value)=>{
      if(/CHARM \+[0-9.]+/.test(value)){
        return value.replace(/CHARM \+[0-9.]+/, desired>0 ? `CHARM +${desired}` : '').replace(/；；/g,'；');
      }
      return value;
    };

    action.text=replaceCharm(action.text || '');
    action.summary=replaceCharm(action.summary || '');

    if(textarea && oldText && textarea.value.includes(oldText)){
      textarea.value=textarea.value.replace(oldText,action.text);
      textarea.dispatchEvent(new Event('input',{bubbles:true}));
    }

    changed=true;
  }

  if(changed){
    await saveState(state);
    renderView(currentView(),false);
    globalThis.toastr?.info?.('“我把魅力涨幅重算了。别想买两件东西就飞升。”');
  }
}

async function ensureCleanStart(){
  if(!isBoundCharacter() || !hasActiveChat()) return;
  const state=runtimeState();
  if(state.dev?.cleanStartV074) return;

  const textarea=document.querySelector('#send_textarea');
  if(textarea && Array.isArray(state.pending)){
    for(const action of state.pending){
      if(action?.text && textarea.value.includes(action.text)){
        textarea.value=textarea.value.replace(action.text,'').replace(/\n{3,}/g,'\n\n').trim();
      }
    }
    textarea.dispatchEvent(new Event('input',{bubbles:true}));
  }

  state.resources.ap=0;
  state.resources.sv=0;
  state.host.charm=0;
  state.host.progress=0;
  state.host.stage='初始改造阶段';
  state.upgrades={};
  state.tasks={active:{},completed:{}};
  state.pending=[];
  state.history=[];
  state.men={current:[],recent:[],returning:[]};
  state.system.pageUnlocked=false;
  state.system.attitudeStage=0;
  state.permission={
    systemEligible:false,
    systemInviteReady:false,
    systemUnlockedByAdmin:false,
    adminInterestSignals:0,
    adminDesireSignals:0,
    adminAttachmentSignals:0,
    adminLove:false,
    milestones:{
      completedTasks:0,
      purchasedUpgrades:0,
      returningMen:0,
    },
  };
  state.shop={dynamic:[],plotTurn:0};
  state.dev={...(state.dev||{}),testGrant1000:true,cleanStartV074:true};

  await saveState(state);
  renderView('home',false);
  globalThis.toastr?.success?.('“测试结束。钱、魅力、记录，全给你清干净了。现在从零开始。”');
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
    renderView('home',false);
    await ensureCleanStart();
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
      if(view==='system' && !runtimeState().system?.pageUnlocked){
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
  setTimeout(async()=>{
    await ensureCleanStart();
  },700);
  globalThis.__meme_os_probe_timer__ = setInterval(mount, 1000);
  window.addEventListener('resize', mount, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(mount,150), { passive:true });
}

if (globalThis.jQuery) globalThis.jQuery(start);
else if (globalThis.$) globalThis.$(start);
else setTimeout(start,1000);
