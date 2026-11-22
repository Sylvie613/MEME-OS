# MÉMÉ OS

MÉMÉ OS 是为 SillyTavern 设计的可交互剧情系统终端扩展。

当前阶段：`v0.1.0 core shell`

## 现在已经接通的能力

- 独立的 MÉMÉ OS 浮动入口与手机式面板。
- 每个聊天使用独立 `chatMetadata` 存档，切换聊天不会串数据。
- Pending Actions：点击系统操作后先进入待结算队列。
- 自动把待结算操作写入 SillyTavern 的 `#send_textarea`，不会自动发送。
- 用户仍可继续在输入框里补正文，最后只发送一次。
- 监听 `MESSAGE_SENT`：只有实际发出的用户消息包含对应操作文本时才提交状态。
- 支持撤销尚未发送的 Pending Action，并同步尝试从输入框移除。

## 这一版故意没有做的东西

暂时不填充 SHOP、ME、TASK、MEN、SYSTEM、RECORD 的完整内容，也不加入角色卡专属的身体数据库、任务数据库与 NPC 数据库。

v0.1.0 只验证最重要的底层链路：

`操作 UI → Pending → 输入框 → 用户发送 → 正式结算 → 当前聊天存档`

后续所有复杂功能都会建立在这条链路上，而不会把完整手机数据每轮塞给模型。

## 文件结构

```text
MEME-OS/
├─ manifest.json
├─ index.js
├─ style.css
└─ src/
   ├─ input.js
   ├─ state.js
   └─ ui.js
```

## 开发原则

1. “查看”不产生剧情，也不向模型发送数据。
2. “操作”只进入 Pending，不立即结算。
3. “发送”才把该操作变成世界事实。
4. 完整状态存在聊天元数据中；模型只应获得当前回合必要的精简状态或操作结果。
5. 项目、界面与代码统一称为 **MÉMÉ OS**。

## 说明

本仓库目前为私有开发仓库，仍处于早期原型阶段。


## 角色卡绑定

MÉMÉ OS 不会对所有角色卡全局启用。只有角色卡包含以下扩展标记时，MÉ 按钮才会出现：

```json
{
  "data": {
    "extensions": {
      "meme_os": {
        "enabled": true,
        "profile": "beauty_reconstruction_v1",
        "schema_version": 1,
        "minimum_extension_version": "0.1.1"
      }
    }
  }
}
```

切换到没有该标记的角色卡时，MÉMÉ OS 会隐藏面板并停止该卡的状态操作。
