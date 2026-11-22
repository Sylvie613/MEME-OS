import {
    addPendingAction,
    commitPendingActions,
    createPendingAction,
    getState,
    hasActiveChat,
    removePendingAction,
} from './state.js';
import { appendToInput, removeFromInput } from './input.js';

const ROOT_ID = 'meme-os-root';
const PANEL_ID = 'meme-os-panel';
const LAUNCHER_ID = 'meme-os-launcher';
let initialized = false;

export function initMemeOS() {
    if (initialized) return;
    initialized = true;
    mountUi();
    bindSillyTavernEvents();
    refreshUi();
    console.log('[MÉMÉ OS] v0.1.0 loaded');
}

function mountUi() {
    if (document.getElementById(ROOT_ID)) return;

    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.innerHTML = `
        <button id="${LAUNCHER_ID}" type="button" aria-label="打开 MÉMÉ OS">MÉ</button>
        <section id="${PANEL_ID}" class="meme-os-panel" aria-hidden="true">
            <div class="meme-os-shell">
                <header class="meme-os-header">
                    <div>
                        <div class="meme-os-eyebrow">MÉMÉ</div>
                        <div class="meme-os-title">OS</div>
                    </div>
                    <button class="meme-os-close" type="button" aria-label="关闭">×</button>
                </header>

                <main class="meme-os-content">
                    <section class="meme-os-card meme-os-overview">
                        <div><span>AP</span><strong data-meme="ap">0</strong></div>
                        <div><span>SV</span><strong data-meme="sv">0</strong></div>
                        <div><span>魅力</span><strong data-meme="charm">0</strong></div>
                    </section>

                    <section class="meme-os-card">
                        <div class="meme-os-row"><span>宿主阶段</span><strong data-meme="stage">未初始化</strong></div>
                        <div class="meme-os-row"><span>管理员形态</span><strong data-meme="form">意识体</strong></div>
                    </section>

                    <section class="meme-os-card">
                        <div class="meme-os-section-title">PENDING</div>
                        <div data-meme="pending-list" class="meme-os-pending-list"></div>
                    </section>

                    <section class="meme-os-card meme-os-dev-card">
                        <div class="meme-os-section-title">v0.1 TEST</div>
                        <p>先只测试“操作 → 输入框 → 发送后结算”链路，不代表最终商城内容。</p>
                        <button data-action="test-purchase" type="button">测试加入一条待结算操作</button>
                    </section>
                </main>

                <footer class="meme-os-footer">MÉMÉ OS · core shell 0.1.0</footer>
            </div>
        </section>
    `;

    document.body.appendChild(root);

    root.querySelector(`#${LAUNCHER_ID}`).addEventListener('click', togglePanel);
    root.querySelector('.meme-os-close').addEventListener('click', closePanel);
    root.querySelector('[data-action="test-purchase"]').addEventListener('click', handleTestPurchase);
    root.querySelector('[data-meme="pending-list"]').addEventListener('click', handlePendingListClick);
}

function bindSillyTavernEvents() {
    const { eventSource, eventTypes } = SillyTavern.getContext();
    eventSource.on(eventTypes.CHAT_CHANGED, refreshUi);
    eventSource.on(eventTypes.MESSAGE_SENT, handleMessageSent);
}

function togglePanel() {
    const panel = document.getElementById(PANEL_ID);
    const open = panel.getAttribute('aria-hidden') === 'true';
    panel.setAttribute('aria-hidden', String(!open));
    panel.classList.toggle('is-open', open);
    if (open) refreshUi();
}

function closePanel() {
    const panel = document.getElementById(PANEL_ID);
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('is-open');
}

async function handleTestPurchase() {
    if (!hasActiveChat()) {
        globalThis.toastr?.warning?.('请先打开一个角色聊天，再使用 MÉMÉ OS。');
        return;
    }

    const text = '【MÉMÉ OS｜已结算】测试操作：AP +10。';
    const action = createPendingAction({
        type: 'dev_test',
        text,
        effect: { apDelta: 10 },
    });

    await addPendingAction(action);
    appendToInput(action.text);
    refreshUi();
    globalThis.toastr?.success?.('已写入输入框；发送后才会正式结算。');
}

async function handlePendingListClick(event) {
    const button = event.target.closest('[data-remove-pending]');
    if (!button) return;

    const actionId = button.dataset.removePending;
    const state = getState();
    const action = state.pending.find((item) => item.id === actionId);
    if (!action) return;

    removeFromInput(action.text);
    await removePendingAction(actionId);
    refreshUi();
}

async function handleMessageSent(messageId) {
    const { chat } = SillyTavern.getContext();
    const sentMessage = chat?.[messageId];
    if (!sentMessage?.is_user) return;
    const sentText = sentMessage.mes ?? '';

    const { committed } = await commitPendingActions(sentText);
    if (committed.length) {
        globalThis.toastr?.success?.(`MÉMÉ OS 已结算 ${committed.length} 项操作。`);
        refreshUi();
    }
}

function refreshUi() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const state = getState();
    setText(root, 'ap', state.resources.ap);
    setText(root, 'sv', state.resources.sv);
    setText(root, 'charm', state.host.charm);
    setText(root, 'stage', state.host.stage);
    setText(root, 'form', state.system.form);

    const list = root.querySelector('[data-meme="pending-list"]');
    if (!state.pending.length) {
        list.innerHTML = '<div class="meme-os-empty">暂无待结算操作</div>';
        return;
    }

    list.innerHTML = state.pending.map((item) => `
        <div class="meme-os-pending-item">
            <span>${escapeHtml(item.text)}</span>
            <button type="button" data-remove-pending="${escapeHtml(item.id)}">撤销</button>
        </div>
    `).join('');
}

function setText(root, key, value) {
    const node = root.querySelector(`[data-meme="${key}"]`);
    if (node) node.textContent = String(value);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
