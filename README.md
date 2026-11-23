# MÉMÉ OS

MÉMÉ OS 是为 SillyTavern 制作的成人剧情改造系统扩展。当前主线把扩展当作唯一结构化状态权威：模型负责剧情与事件判断，扩展负责 AP / SV / CHARM、任务、商城、MEN、系统权限、记忆压缩与随机 NPC 机制。

当前版本：`0.13.0`

## 安装 / 更新

扩展仓库：

`https://github.com/Sylvie613/MEME-OS`

SillyTavern 中使用同一仓库 URL 安装或更新扩展。

当前 canonical 角色卡 PNG：

`https://raw.githubusercontent.com/Sylvie613/MEME-OS/main/cards/meme_os_card_v0.4.0-alpha.png`

## 当前结构

```text
MEME-OS/
├─ manifest.json
├─ index.js
├─ index-v0.13.0.js
├─ style.css
├─ src/
│  ├─ binding.js
│  ├─ input.js
│  └─ state.js
├─ cards/
│  ├─ meme_os_card_v0.4.0-alpha.json
│  └─ meme_os_card_v0.4.0-alpha.png
├─ presets/
│  └─ MEME-OS_Gemini3.1Pro_Momo_LongReply_v1.json
├─ scripts/
│  └─ build_card_png.py
└─ .github/workflows/
   └─ build-card-png.yml
```

## 状态权威

每个聊天拥有独立的 `chatMetadata.meme_os` 存档。扩展是以下数据的唯一正式来源：

- AP / SV / CHARM 与身体改造等级。
- TASK 的接取、完成、奖励与自然日刷新。
- SHOP 的购买、价格、动态商品与日常用品货架。
- MEN 的当前 / 近期 / 再遇对象档案。
- SYSTEM 形态、访问权限与管理员关系状态。
- MEMORY 的 SHORT / LONG / PERMANENT 滚动记忆。

用户点击会产生 Pending Action；只有实际发送后才正式结算，避免“点了但没发”就改账。

## 剧情时钟

OS 面板不再保存或显示一套独立的日期 / 时间 / 天气 / 地点状态。

正文顶部由扩展强制要求唯一一行剧情时钟：

`【DAY 003｜11月23日｜16:42｜晴｜卧室】`

日期必须包含月和日，时间使用 24 小时制精确到分钟。下一回合以上一条可见时钟为锚点连续推进。

## DAILY

基础 DAILY 由扩展自己的 15 条任务池生成：

- 每个自然日固定 3 条。
- 优先避免前两天出现过的任务。
- 剧情额外发布的 `[TASK｜任务名｜要求｜AP +N]` 不占这 3 个基础位置。
- 已完成任务按当前自然日结算并退出当天任务板。

## DESIRE

CHARM 8 前完全封锁，只显示 SEALED / LOCKED 与基础解锁门槛，不提前泄露任务名、对象、玩法、奖励或后续条件。

解锁后不使用固定可见任务池。任务按当前剧情生成：

`成年男性对象 × 当前场景 × CHARM × 已解锁能力 × 性行为/身体部位 × 限制条件 × 明确结算目标`

固定的旧 DESIRE 项只作为后台里程碑兼容数据，不作为每日抽卡内容。

## MEN 与随机男性 NPC

MEN 不是固定男主列表。随机成年男性可以拥有不同职业、阶层、外貌、性格与公开气质；公开人格与私下成人偏好是独立轴。

扩展每个剧情回合计算一次确定性的随机男性介入轮盘：

- 公共场景基础概率约为 `max(10, CHARM)%`。
- 宅家、住宅公共区、普通公共场所、户外、主动社交、交友软件分别使用不同场景倍率。
- 同一 user 回合重生成不会重抽。
- 新随机男性出现后有 2 回合新人冷却；冷却由轮盘自身记录命中，不依赖该 NPC 是否值得写入 MEN。

### 剧情焦点锁

当已知 MEN 对象仍被本回合确认在当前场景，随机新人轮盘暂停。约会、私密独处和成人亲密场景尤其是硬锁，持续多久都不会因为回合数到了而强插新人。

已知男性仍在场时，模型通过 MEN heartbeat 保持 `present:true`；真正离场时写一次 `present:false`。用户明确要求认识、寻找或邀请新男性时，可以主动解除新人屏蔽。

## MEMORY

MEMORY 由独立 quiet sync 负责，不再要求主回复同时输出一份重复记忆 JSON：

- 每个剧情回合 1 条 SHORT。
- 15 条 SHORT → 1 条 LONG。
- 10 条 LONG → 1 条 PERMANENT。
- PERMANENT 不参与后续滚动清空。

首次在已有聊天中安装时，会按同一规则回填当前可见历史。

## 角色卡与 PNG 构建

`cards/meme_os_card_v0.4.0-alpha.json` 是唯一角色卡 JSON 源。

`scripts/build_card_png.py` 使用当前 canonical PNG 本身作为图像底板，只替换 `chara` / `ccv3` 与 MÉMÉ OS 版本元数据，因此不会改变现有头像画面。

推送 canonical JSON、构建脚本或当前扩展源码后，GitHub Action 会校验 JavaScript / JSON 并刷新 canonical PNG。

## 开发原则

1. 同一状态只保留一个权威来源，避免卡、扩展、旧兼容字段互相改写。
2. 静态人设放角色卡 / 预设；runtime prompt 只注入实时状态和必须即时执行的硬规则。
3. 查看 UI 不产生剧情事实；用户真正发送后才提交 Pending 操作。
4. 完整状态保存在聊天元数据中，不把整套 OS 数据每回合重复塞给模型。
5. 可见剧情是自然日与场景连续性的主要依据；旧的独立 `storyStatus` 状态已退休。
6. 项目、界面、仓库统一称为 **MÉMÉ OS**。
