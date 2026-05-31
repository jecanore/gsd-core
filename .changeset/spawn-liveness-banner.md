---
type: Changed
pr: 9999
---
**Spawn points now state that the subagent runs silently** — every workflow that spawns a subagent (researcher, planner, executor, reviewer, auditor, …) carries a liveness note saying there's no output until it returns (~1–5 min) and that the quiet is expected, not a freeze. On the printed `◆ Spawning…` banners the user sees it directly; on the prose/heading spawn points the orchestrator is told to set the expectation. Stops a working subagent from being mistaken for a hung session and killed mid-run.
