from pathlib import Path
import re

index = Path("index.js").read_text(encoding="utf-8")
state = Path("src/state.js").read_text(encoding="utf-8")


def section(src, start, end):
    a = src.find(start)
    assert a >= 0, f"missing start marker: {start}"
    b = src.find(end, a + len(start))
    assert b >= 0, f"missing end marker after {start}: {end}"
    return src[a:b]


# 1) Reward table is explicit and stable. If rewards are intentionally changed,
# update this validator in the same commit.
for tier, charm, ap, sv in [
    (1, 8, 120, 20),
    (2, 18, 180, 35),
    (3, 35, 260, 50),
    (4, 55, 360, 70),
]:
    token = f"{tier}:{{minCharm:{charm}, ap:{ap}, sv:{sv}"
    assert token in index, f"DESIRE tier {tier} reward contract changed unexpectedly"

# 2) Clicking accept must NOT grant resources. It only queues taskAccept, and
# active state is created only after the exact acceptance text is actually sent.
accept = section(index, "async function handleTaskAction", "async function handleShopAction")
assert "effect:{taskAccept:" in accept, "task accept no longer uses taskAccept effect"
assert "apDelta" not in accept and "svDelta" not in accept, "accepting a task must never pay AP/SV"
for field in ("id:task.id", "desc:systemDesc", "detail:systemDetail", "reward:String(task.reward||'')",
              "tier:Number(task.tier)||null", "targetManId:task.targetManId||null"):
    assert field in accept, f"accepted-task snapshot missing {field}"

commit = section(state, "export async function commitPendingActions", "function applyEffect")
assert "sentText.includes(action.text)" in commit, "pending acceptance must require the exact sent text"
assert "applyEffect(state, action.effect)" in commit, "sent acceptance no longer commits its effect"

apply_effect = section(state, "function applyEffect", "export function createPendingAction")
assert "if (effect.taskAccept" in apply_effect, "taskAccept is not applied into state"
for field in ("desc:", "detail:", "reward:", "tier:", "targetManId:", "targetName:", "acceptedAt:"):
    assert field in apply_effect, f"active task snapshot missing {field}"

# 3) Hidden-event completion: must be active, evidence-verified, target-verified,
# duplicate-blocked, then pay once and remove active.
hidden = section(index, "function settleTaskFromModel", "function settleStoryRewardFromModel")
required_hidden = [
    "const active=state.tasks?.active?.[id]",
    "if(!task || !active) return false",
    "desireTargetMatches(settledTask,state,sceneText)",
    "taskCompletionEvidenceValid(settledTask,evidence,sceneText)",
    "if((state.history||[]).some(entry=>entry.id===historyId)) return false",
    "state.resources.ap=Math.max(0,Number(state.resources.ap||0)+reward.ap)",
    "state.resources.sv=Math.max(0,Number(state.resources.sv||0)+reward.sv)",
    "delete state.tasks.active[id]",
    "state.tasks.completed[id]=",
    "state.tasks.everCompleted[id]=",
    "reward:{ap:reward.ap,sv:reward.sv}",
]
for token in required_hidden:
    assert token in hidden, f"hidden completion lifecycle missing: {token}"

# 4) Visible completion fallback must obey the same active/evidence/target/payment rules.
visible = section(index, "function settleVisibleTaskCompletion", "function settleVisibleTaskCompletionsFromMessage")
required_visible = [
    "const active=state.tasks?.active?.[id]",
    "if(!active) return false",
    "desireTargetMatches(settledTask,state",
    "taskCompletionEvidenceValid(settledTask",
    "if((state.history||[]).some(entry=>entry.id===historyId)) return false",
    "state.resources.ap=Math.max",
    "state.resources.sv=Math.max",
    "delete state.tasks.active[id]",
    "state.tasks.completed[id]=",
    "state.tasks.everCompleted[id]=",
]
for token in required_visible:
    assert token in visible, f"visible completion lifecycle missing: {token}"

# 5) DESIRE evidence itself and current visible scene both have to prove the act/result.
verify = section(index, "function taskCompletionEvidenceValid", "function extractVisibleTaskCompletions")
for token in [
    "evidence itself",
    "visible/current scene",
    "requiredAxes.every",
]:
    assert token in verify, f"completion verifier weakened: missing {token}"

# 6) Bound target protection must exist, and DESIRE creation must have targetManId.
target = section(index, "function desireTargetMatches", "function taskCompletionEvidenceValid")
assert "targetManId" in target and "wrong or absent target man" in target, "DESIRE target-man settlement guard missing"
generate = section(index, "function sanitizeGeneratedDesireTask", "const DAILY_ACTION_PATTERNS")
assert "rejected DESIRE: missing targetManId" in generate, "DESIRE may be created without target binding"
assert "presentMen.length===1" in generate, "single-present-man auto-bind missing"

# 7) Swipe/regeneration rollback must rewind the money, task state, and audit history together.
snap = section(index, "const TURN_SNAPSHOT_KEYS", "function removeFallbackTasksCompetingWithFormalCard")
for key in ("'resources'", "'tasks'", "'history'", "'men'"):
    assert key in snap, f"turn snapshot missing {key}; swipe could duplicate or desync settlement"
assert "function captureTurnBase" in snap and "function restoreTurnBase" in snap, "turn rollback helpers missing"

# 8) Runtime contract must keep completion reporting strict.
assert 'tasks: max 4 ACTIVE completions' in index
assert 'vague completion labels are invalid' in index
assert 'Extension independently validates evidence and calculates rewards' in index

print("Critical task lifecycle invariants: PASS")
