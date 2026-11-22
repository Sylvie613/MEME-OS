const META_KEY = 'meme_os';
const SCHEMA_VERSION = 15;

const DEFAULT_STATE = Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    resources: { ap: 0, sv: 0 },
    host: {
        level: 1,
        charm: 0,
        stage: '初始改造阶段',
        progress: 0,
        body: {
            lips: 0,
            face: 0,
            eyes: 0,
            skin: 0,
            hair: 0,
            posture: 0,
            bodyShape: 0,
            waistHip: 0,
            legs: 0,
            neckShoulders: 0,
            bust: 0,
            scent: 0,
            breath: 0,
            voice: 0,
            touch: 0,
            sensitivity: 0,
            arousal: 0,
            lubrication: 0,
            orgasm: 0,
            recovery: 0,
            specialMark: 0,
        },
    },
    system: {
        level: 1,
        form: '意识体',
        status: 'ONLINE',
        attitudeStage: 0,
        pageUnlocked: false,
        accessStage: 'locked',
        accessChangedAt: null,
        name: null,
        namingRightOffered: false,
        namingOfferedAt: null,
        namedAt: null,
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
        adminDesireSignals: 0,
        adminAttachmentSignals: 0,
        adminLove: false,
        adminBond: {
            moments: [],
            firstInterestAt: null,
            firstDesireAt: null,
            firstAttachmentAt: null,
            loveAt: null,
        },
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
    reactivity: {
        recentChanges: [],
        recentIssues: [],
        recentReactions: [],
    },
    upgrades: {},
    tasks: {
        storyDay: 1,
        active: {},
        completed: {},
        dailyCompleted: {},
        everCompleted: {},
    },
    men: {
        current: [],
        recent: [],
        returning: [],
        archive: {},
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
    if (n < 15) return { attitudeStage: 0, stage: '惨不忍睹阶段' };
    if (n < 35) return { attitudeStage: 1, stage: '抢救修复阶段' };
    if (n < 55) return { attitudeStage: 2, stage: '终于像样阶段' };
    if (n < 70) return { attitudeStage: 3, stage: '明显好看阶段' };
    if (n < 85) return { attitudeStage: 4, stage: '美女阶段' };
    return { attitudeStage: 5, stage: '高魅力美女阶段' };
}

function mergeState(raw) {
    const base = cloneDefaultState();
    if (!raw || typeof raw !== 'object') return base;

    const merged = {
        ...base,
        ...raw,
        resources: { ...base.resources, ...(raw.resources ?? {}) },
        host: {
            ...base.host,
            ...(raw.host ?? {}),
            body: {
                ...base.host.body,
                ...(raw.host?.body ?? {}),
            },
        },
        system: { ...base.system, ...(raw.system ?? {}) },
        dev: { ...base.dev, ...(raw.dev ?? {}) },
        permission: {
            ...base.permission,
            ...(raw.permission ?? {}),
            adminBond: {
                ...base.permission.adminBond,
                ...(raw.permission?.adminBond ?? {}),
                moments: Array.isArray(raw.permission?.adminBond?.moments)
                    ? raw.permission.adminBond.moments.slice(-32)
                    : [],
            },
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
        reactivity: {
            ...base.reactivity,
            ...(raw.reactivity ?? {}),
            recentChanges: Array.isArray(raw.reactivity?.recentChanges) ? raw.reactivity.recentChanges.slice(0, 8) : [],
            recentIssues: Array.isArray(raw.reactivity?.recentIssues) ? raw.reactivity.recentIssues.slice(0, 8) : [],
            recentReactions: Array.isArray(raw.reactivity?.recentReactions) ? raw.reactivity.recentReactions.slice(0, 8) : [],
        },
        upgrades: { ...base.upgrades, ...(raw.upgrades ?? {}) },
        tasks: {
            storyDay: Math.max(1, Number(raw.tasks?.storyDay) || 1),
            active: { ...base.tasks.active, ...(raw.tasks?.active ?? {}) },
            completed: { ...base.tasks.completed, ...(raw.tasks?.completed ?? {}) },
            dailyCompleted: { ...base.tasks.dailyCompleted, ...(raw.tasks?.dailyCompleted ?? {}) },
            everCompleted: { ...base.tasks.everCompleted, ...(raw.tasks?.everCompleted ?? {}), ...(raw.tasks?.completed ?? {}) },
        },
        men: {
            current: Array.isArray(raw.men?.current) ? raw.men.current.slice(0, 3) : [],
            recent: Array.isArray(raw.men?.recent) ? raw.men.recent.slice(0, 8) : [],
            returning: Array.isArray(raw.men?.returning) ? raw.men.returning.slice(0, 5) : [],
            archive: raw.men?.archive && typeof raw.men.archive === 'object' ? { ...raw.men.archive } : {},
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
    const allowedAccessStages = ['locked','peek','open','private'];
    if (!allowedAccessStages.includes(merged.system.accessStage)) {
        merged.system.accessStage = merged.system.pageUnlocked ? 'open' : 'locked';
    }
    if (merged.system.pageUnlocked && merged.system.accessStage === 'locked') {
        merged.system.accessStage = 'open';
    }
    merged.system.pageUnlocked = merged.system.accessStage !== 'locked';
    merged.tasks.storyDay = Math.max(1, Number(merged.tasks.storyDay) || 1);
    for (const key of Object.keys(base.host.body)) {
        merged.host.body[key] = Math.max(0, Number(merged.host.body[key]) || 0);
    }

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

function refreshDerivedState(state) {
    const tone = charmToStage(state.host.charm);
    state.host.stage = tone.stage;
    state.system.attitudeStage = tone.attitudeStage;
    state.host.progress = Math.min(100, Math.max(Number(state.host.progress) || 0, state.host.charm * 1.45));

    const milestones = state.permission.milestones;
    state.permission.systemEligible =
        state.host.charm >= 10 &&
        milestones.completedTasks >= 2 &&
        milestones.purchasedUpgrades >= 1 &&
        state.permission.adminInterestSignals >= 1;

    state.permission.systemInviteReady =
        state.permission.systemEligible &&
        state.permission.adminInterestSignals >= 2;
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

    if (effect.bodyDelta && typeof effect.bodyDelta === 'object') {
        state.host.body = state.host.body || {};
        for (const [key, delta] of Object.entries(effect.bodyDelta)) {
            if (!Number.isFinite(Number(delta))) continue;
            state.host.body[key] = Math.max(0, (Number(state.host.body[key]) || 0) + Number(delta));
        }
    }

    if (effect.purchase && typeof effect.purchase === 'object') {
        const item = effect.purchase;
        const wasOwned = Boolean(state.upgrades[item.id]);
        const current = Number(state.upgrades[item.id]?.level) || 0;
        const nextLevel = Math.max(current + 1, Number(item.level) || current + 1);
        state.upgrades[item.id] = {
            ...(state.upgrades[item.id] || {}),
            id: item.id,
            title: item.title,
            category: item.category,
            level: nextLevel,
            purchasedAt: Date.now(),
        };
        if (!wasOwned) state.permission.milestones.purchasedUpgrades += 1;

        const changedAxes = Object.entries(effect.bodyDelta || {})
            .filter(([, delta]) => Number(delta) > 0)
            .map(([axis, delta]) => ({ axis, delta: Number(delta) }));
        state.reactivity = state.reactivity || { recentChanges: [], recentIssues: [], recentReactions: [] };
        state.reactivity.recentChanges = [
            {
                id: `change_${Date.now()}_${item.id}`,
                itemId: item.id,
                title: item.title,
                level: nextLevel,
                axes: changedAxes,
                charmDelta: Number(effect.charmDelta) || 0,
                storyDay: Number(state.tasks?.storyDay) || 1,
                committedAt: Date.now(),
            },
            ...(state.reactivity.recentChanges || []),
        ].slice(0, 8);
    }

    if (effect.taskAccept && typeof effect.taskAccept === 'object') {
        const task = effect.taskAccept;
        state.tasks.active[task.id] = {
            id: task.id,
            title: task.title,
            category: task.category,
            storyDay: Number(state.tasks.storyDay) || 1,
            acceptedAt: Date.now(),
        };
    }

    if (effect.taskComplete && typeof effect.taskComplete === 'object') {
        const task = effect.taskComplete;
        const wasEverCompleted = Boolean(state.tasks.everCompleted?.[task.id]);
        delete state.tasks.active[task.id];

        if (task.category === 'daily') {
            const previous = state.tasks.dailyCompleted?.[task.id] || {};
            state.tasks.dailyCompleted[task.id] = {
                id: task.id,
                title: task.title,
                category: task.category,
                day: Number(state.tasks.storyDay) || 1,
                count: Math.max(0, Number(previous.count) || 0) + 1,
                completedAt: Date.now(),
            };
        } else {
            state.tasks.completed[task.id] = {
                id: task.id,
                title: task.title,
                category: task.category,
                completedAt: Date.now(),
            };
        }

        state.tasks.everCompleted[task.id] = {
            id: task.id,
            title: task.title,
            category: task.category,
            firstCompletedAt: state.tasks.everCompleted?.[task.id]?.firstCompletedAt || Date.now(),
        };

        if (!wasEverCompleted) state.permission.milestones.completedTasks += 1;
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
        state.host.charm >= 10 &&
        milestones.completedTasks >= 2 &&
        milestones.purchasedUpgrades >= 1 &&
        state.permission.adminInterestSignals >= 1;

    state.permission.systemInviteReady =
        state.permission.systemEligible &&
        state.permission.adminInterestSignals >= 2;
}

export async function claimVerifiedTaskReward({ id, title, category, ap = 0, sv = 0 }) {
    const state = getState();
    const storyDay = Math.max(1, Number(state.tasks?.storyDay) || 1);
    const active = state.tasks?.active?.[id];
    const verified = state.tasks?.verified?.[id];

    if (!active || !verified) return { ok: false, reason: 'not_verified', state };
    if (category === 'daily' && Number(verified.storyDay || 0) !== storyDay) {
        return { ok: false, reason: 'expired_daily_verification', state };
    }
    if (category === 'daily' && Number(state.tasks?.dailyCompleted?.[id]?.day || 0) === storyDay) {
        return { ok: false, reason: 'already_claimed', state };
    }
    if (category !== 'daily' && state.tasks?.completed?.[id]) {
        return { ok: false, reason: 'already_claimed', state };
    }

    const wasEverCompleted = Boolean(state.tasks.everCompleted?.[id]);
    state.resources.ap = Math.max(0, Number(state.resources.ap || 0) + Math.max(0, Number(ap) || 0));
    state.resources.sv = Math.max(0, Number(state.resources.sv || 0) + Math.max(0, Number(sv) || 0));

    delete state.tasks.active[id];
    delete state.tasks.verified[id];

    if (category === 'daily') {
        const previous = state.tasks.dailyCompleted?.[id] || {};
        state.tasks.dailyCompleted[id] = {
            id,
            title,
            category,
            day: storyDay,
            count: Math.max(0, Number(previous.count) || 0) + 1,
            completedAt: Date.now(),
        };
    } else {
        state.tasks.completed[id] = {
            id,
            title,
            category,
            completedAt: Date.now(),
        };
    }

    state.tasks.everCompleted[id] = {
        id,
        title,
        category,
        firstCompletedAt: state.tasks.everCompleted?.[id]?.firstCompletedAt || Date.now(),
    };
    if (!wasEverCompleted) state.permission.milestones.completedTasks += 1;

    state.history.push({
        id: `meme_task_claim_${Date.now()}_${id}`,
        type: 'task_claim',
        recordType: 'task',
        title: `领取：${title}`,
        text: `TASK REWARD CLAIMED: ${id}`,
        summary: `任务「${title}」验收通过并领取奖励：AP +${Math.max(0, Number(ap) || 0)}${Number(sv) > 0 ? ` / SV +${Math.max(0, Number(sv) || 0)}` : ''}。`,
        committedAt: Date.now(),
    });
    if (state.history.length > 240) state.history = state.history.slice(-240);

    refreshDerivedState(state);
    await saveState(state);
    return { ok: true, state };
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
