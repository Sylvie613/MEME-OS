const META_KEY = 'meme_os';
const SCHEMA_VERSION = 5;

const DEFAULT_STATE = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    resources: { ap: 0, sv: 0 },
    host: {
        level: 1,
        charm: 0,
        stage: '初始改造阶段',
        progress: 0,
    },
    system: {
        level: 1,
        form: '意识体',
        status: 'ONLINE',
        attitudeStage: 0,
        pageUnlocked: false,
    },
    dev: {
        testGrant1000: true,
        cleanStartV074: false,
    },
    permission: {
        systemEligible: false,
        systemInviteReady: false,
        systemUnlockedByAdmin: false,
        adminInterestSignals: 0,
        milestones: {
            completedTasks: 0,
            purchasedUpgrades: 0,
            returningMen: 0,
        },
    },
    shop: {
        dynamic: [],
        plotTurn: 0,
    },
    upgrades: {},
    tasks: {
        active: {},
        completed: {},
    },
    men: {
        current: [],
        recent: [],
        returning: [],
    },
    pending: [],
    history: [],
});

function clone(value) {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function cloneDefaultState() {
    return clone(DEFAULT_STATE);
}

function charmToStage(charm) {
    const n = Number(charm) || 0;
    if (n < 10) return { attitudeStage: 0, stage: '初始改造阶段' };
    if (n < 20) return { attitudeStage: 1, stage: '勉强修复阶段' };
    if (n < 35) return { attitudeStage: 2, stage: '开始像样阶段' };
    if (n < 55) return { attitudeStage: 3, stage: '明显吸引阶段' };
    return { attitudeStage: 4, stage: '高魅力改造阶段' };
}

function mergeState(raw) {
    const base = cloneDefaultState();
    if (!raw || typeof raw !== 'object') return base;

    const merged = {
        ...base,
        ...raw,
        resources: { ...base.resources, ...(raw.resources ?? {}) },
        host: { ...base.host, ...(raw.host ?? {}) },
        system: { ...base.system, ...(raw.system ?? {}) },
        dev: { ...base.dev, ...(raw.dev ?? {}) },
        permission: {
            ...base.permission,
            ...(raw.permission ?? {}),
            milestones: {
                ...base.permission.milestones,
                ...(raw.permission?.milestones ?? {}),
            },
        },
        shop: {
            ...base.shop,
            ...(raw.shop ?? {}),
            dynamic: Array.isArray(raw.shop?.dynamic) ? raw.shop.dynamic : [],
        },
        upgrades: { ...base.upgrades, ...(raw.upgrades ?? {}) },
        tasks: {
            active: { ...base.tasks.active, ...(raw.tasks?.active ?? {}) },
            completed: { ...base.tasks.completed, ...(raw.tasks?.completed ?? {}) },
        },
        men: {
            current: Array.isArray(raw.men?.current) ? raw.men.current : [],
            recent: Array.isArray(raw.men?.recent) ? raw.men.recent : [],
            returning: Array.isArray(raw.men?.returning) ? raw.men.returning : [],
        },
        pending: Array.isArray(raw.pending) ? raw.pending : [],
        history: Array.isArray(raw.history) ? raw.history : [],
        schemaVersion: SCHEMA_VERSION,
    };

    const tone = charmToStage(merged.host.charm);
    merged.host.stage = tone.stage;
    merged.system.attitudeStage = tone.attitudeStage;
    merged.resources.ap = Math.max(0, Number(merged.resources.ap) || 0);
    merged.resources.sv = Math.max(0, Number(merged.resources.sv) || 0);
    merged.host.charm = Math.max(0, Number(merged.host.charm) || 0);

    return merged;
}

function getContext() {
    return globalThis.SillyTavern?.getContext?.() || null;
}

export function hasActiveChat() {
    const context = getContext();
    return Boolean(context?.chatMetadata && Array.isArray(context?.chat));
}

export function getState() {
    const context = getContext();
    if (!context?.chatMetadata) return cloneDefaultState();

    const merged = mergeState(context.chatMetadata[META_KEY]);
    context.chatMetadata[META_KEY] = merged;
    return merged;
}

export async function saveState(state) {
    const context = getContext();
    if (!context?.chatMetadata) return;

    context.chatMetadata[META_KEY] = mergeState(state);
    if (typeof context.saveMetadata === 'function') await context.saveMetadata();
}

export function getReservedResources(state = getState()) {
    return state.pending.reduce((sum, action) => {
        const effect = action?.effect;
        const apDelta = Number(effect?.apDelta) || 0;
        const svDelta = Number(effect?.svDelta) || 0;
        if (apDelta < 0) sum.ap += Math.abs(apDelta);
        if (svDelta < 0) sum.sv += Math.abs(svDelta);
        return sum;
    }, { ap: 0, sv: 0 });
}

export function getSpendableResources(state = getState()) {
    const reserved = getReservedResources(state);
    return {
        ap: Math.max(0, state.resources.ap - reserved.ap),
        sv: Math.max(0, state.resources.sv - reserved.sv),
    };
}

export async function addPendingAction(action) {
    const state = getState();
    state.pending.push(action);
    await saveState(state);
    return state;
}

export async function removePendingAction(actionId) {
    const state = getState();
    state.pending = state.pending.filter(item => item.id !== actionId);
    await saveState(state);
    return state;
}

export async function commitPendingActions(sentText) {
    const state = getState();
    if (!state.pending.length || !sentText) return { state, committed: [] };

    const committed = [];
    const remaining = [];

    for (const action of state.pending) {
        if (sentText.includes(action.text)) committed.push(action);
        else remaining.push(action);
    }

    if (!committed.length) return { state, committed: [] };

    state.pending = remaining;

    for (const action of committed) {
        applyEffect(state, action.effect);
        state.history.push({
            id: action.id,
            type: action.type,
            recordType: action.recordType || action.type,
            title: action.title || action.type,
            text: action.text,
            summary: action.summary || action.text,
            committedAt: Date.now(),
        });
    }

    if (state.history.length > 240) state.history = state.history.slice(-240);
    await saveState(state);
    return { state, committed };
}

function applyEffect(state, effect) {
    if (!effect || typeof effect !== 'object') return;

    if (Number.isFinite(effect.apDelta)) {
        state.resources.ap = Math.max(0, state.resources.ap + effect.apDelta);
    }

    if (Number.isFinite(effect.svDelta)) {
        state.resources.sv = Math.max(0, state.resources.sv + effect.svDelta);
    }

    if (Number.isFinite(effect.charmDelta)) {
        state.host.charm = Math.max(0, state.host.charm + effect.charmDelta);
    }

    if (effect.host && typeof effect.host === 'object') {
        Object.assign(state.host, effect.host);
    }

    if (effect.system && typeof effect.system === 'object') {
        Object.assign(state.system, effect.system);
    }

    if (effect.permission && typeof effect.permission === 'object') {
        Object.assign(state.permission, effect.permission);
    }

    if (effect.purchase && typeof effect.purchase === 'object') {
        const item = effect.purchase;
        const wasOwned = Boolean(state.upgrades[item.id]);
        const current = Number(state.upgrades[item.id]?.level) || 0;
        state.upgrades[item.id] = {
            ...(state.upgrades[item.id] || {}),
            id: item.id,
            title: item.title,
            category: item.category,
            level: Math.max(current + 1, Number(item.level) || current + 1),
            purchasedAt: Date.now(),
        };
        if (!wasOwned) state.permission.milestones.purchasedUpgrades += 1;
    }

    if (effect.taskAccept && typeof effect.taskAccept === 'object') {
        const task = effect.taskAccept;
        state.tasks.active[task.id] = {
            id: task.id,
            title: task.title,
            category: task.category,
            acceptedAt: Date.now(),
        };
    }

    if (effect.taskComplete && typeof effect.taskComplete === 'object') {
        const task = effect.taskComplete;
        const wasCompleted = Boolean(state.tasks.completed[task.id]);
        delete state.tasks.active[task.id];
        state.tasks.completed[task.id] = {
            id: task.id,
            title: task.title,
            category: task.category,
            completedAt: Date.now(),
        };
        if (!wasCompleted) state.permission.milestones.completedTasks += 1;
    }

    if (effect.men && typeof effect.men === 'object') {
        if (Array.isArray(effect.men.current)) state.men.current = effect.men.current.slice(0, 3);
        if (Array.isArray(effect.men.recent)) state.men.recent = effect.men.recent.slice(0, 8);
        if (Array.isArray(effect.men.returning)) state.men.returning = effect.men.returning.slice(0, 5);
    }

    const tone = charmToStage(state.host.charm);
    state.host.stage = tone.stage;
    state.system.attitudeStage = tone.attitudeStage;
    state.host.progress = Math.min(100, Math.max(Number(state.host.progress) || 0, state.host.charm * 1.45));

    const milestones = state.permission.milestones;
    state.permission.systemEligible =
        state.host.charm >= 1 &&
        milestones.completedTasks >= 2 &&
        milestones.purchasedUpgrades >= 1 &&
        state.permission.adminInterestSignals >= 1;

    state.permission.systemInviteReady =
        state.permission.systemEligible &&
        state.permission.adminInterestSignals >= 2;
}

export function createPendingAction({
    type = 'action',
    recordType = 'system',
    title = '',
    summary = '',
    text,
    effect = null,
}) {
    return {
        id: `meme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        recordType,
        title,
        summary,
        text,
        effect,
        createdAt: Date.now(),
    };
}
