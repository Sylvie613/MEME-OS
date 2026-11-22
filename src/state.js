const META_KEY = 'meme_os';
const SCHEMA_VERSION = 1;

const DEFAULT_STATE = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    resources: { ap: 0, sv: 0 },
    host: { level: 1, charm: 3, stage: '明显难看 · 未改造' },
    system: { level: 1, form: '意识体', status: 'ONLINE' },
    pending: [],
    history: [],
});

function cloneDefaultState() {
    return structuredClone(DEFAULT_STATE);
}

function mergeState(raw) {
    const base = cloneDefaultState();
    if (!raw || typeof raw !== 'object') return base;

    return {
        ...base,
        ...raw,
        resources: { ...base.resources, ...(raw.resources ?? {}) },
        host: { ...base.host, ...(raw.host ?? {}) },
        system: { ...base.system, ...(raw.system ?? {}) },
        pending: Array.isArray(raw.pending) ? raw.pending : [],
        history: Array.isArray(raw.history) ? raw.history : [],
        schemaVersion: SCHEMA_VERSION,
    };
}

export function hasActiveChat() {
    const context = SillyTavern.getContext();
    return Boolean(context.chatMetadata && Array.isArray(context.chat));
}

export function getState() {
    const context = SillyTavern.getContext();
    if (!context.chatMetadata) return cloneDefaultState();

    const merged = mergeState(context.chatMetadata[META_KEY]);
    context.chatMetadata[META_KEY] = merged;
    return merged;
}

export async function saveState(state) {
    const context = SillyTavern.getContext();
    if (!context.chatMetadata) return;

    context.chatMetadata[META_KEY] = mergeState(state);
    await context.saveMetadata();
}

export async function addPendingAction(action) {
    const state = getState();
    state.pending.push(action);
    await saveState(state);
    return state;
}

export async function removePendingAction(actionId) {
    const state = getState();
    state.pending = state.pending.filter((item) => item.id !== actionId);
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
            text: action.text,
            committedAt: Date.now(),
        });
    }

    if (state.history.length > 200) state.history = state.history.slice(-200);

    await saveState(state);
    return { state, committed };
}

function applyEffect(state, effect) {
    if (!effect || typeof effect !== 'object') return;
    if (Number.isFinite(effect.apDelta)) state.resources.ap += effect.apDelta;
    if (Number.isFinite(effect.svDelta)) state.resources.sv += effect.svDelta;
    if (effect.host && typeof effect.host === 'object') Object.assign(state.host, effect.host);
    if (effect.system && typeof effect.system === 'object') Object.assign(state.system, effect.system);
}

export function createPendingAction({ type = 'action', text, effect = null }) {
    return {
        id: `meme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        text,
        effect,
        createdAt: Date.now(),
    };
}
