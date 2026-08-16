# Task packet - Paldark Harness Paper

Status: APPROVED FOR DOCUMENTATION IMPLEMENTATION

Baseline: `8b0c7af26bd920fe7e575dc2b130f12a21957034`

Date: 2026-08-16

## 1. Goal

Replace the current landing page with one canonical Vietnamese research paper that consolidates the Paldark documentation into an auditable argument inspired by the public reasoning structure of *A Programming Paradigm for Spatiotemporal Composability*.

The paper must explain not only what architecture is proposed, but why the problem is decomposed that way, which assumptions make each claim stand, what evidence supports it, what alternatives were rejected, and where the guarantee stops. It must connect:

- the player-facing Palworld problem and the 15 systems in chapters 21-35;
- the PaldarkKit retrospective and the difference between source, compile, integration, normal play, human verification, and parity;
- KYWorld as a behavioral/reference corpus under a clean-room boundary, not as an architectural or licensing authority;
- Cordis effects/coeffects and DeepSeek Harness's public "Everything is a Plugin" architecture;
- Unreal Engine modules, plugins, Game Feature Plugins, Game Feature Actions, Modular Gameplay, GAS, Gameplay Tags/Messages, Lyra Experiences, and UEFN devices;
- a restart-safe Sol/Luna/reviewer/human workflow based on persisted specifications and evidence, not chat memory;
- a staged reconstruction and evaluation plan before any KYWorld-to-C++ implementation begins.

The canonical paper is `index.md`. Existing chapter files remain as a public archive and source corpus; they are not deleted or silently rewritten in this task.

## 2. Reader contract

The intended reader is a game developer who wants to learn the public method of reasoning demonstrated by the Cordis paper. The paper must never claim access to DeepSeek's private chain of thought. It reconstructs an auditable argument from public paper/source artifacts.

Use the established Paldark editorial voice in `.editorial/voice.md`: begin from concrete player/development failures, introduce abstractions only when they solve a named problem, and explain the consequence after every important table, model, or diagram.

## 3. Required argumentative structure

The exact wording may change, but the complete paper must contain the following logical sequence.

1. **Abstract and status note**
   - Identify this as a design/research paper, not an implementation-complete claim.
   - Pin the Cordis preprint to the 2026-08-13 draft and DeepSeek Harness to developer-preview status.
   - State the central thesis and contributions.

2. **Introduction and research questions**
   - Motivate the problem with the gap between broad feature scaffolding and polished player-observable gameplay.
   - Explain why a polished reference cannot simply be ported wholesale.
   - State research questions covering architecture, clean-room reconstruction, multi-agent continuity, evidence, and evaluation.

3. **Method and evidence discipline**
   - Define claim labels and an immutable evidence ladder from `DESIGNED` through `PARITY_EVIDENCED`.
   - Separate observations, measurements, user reports, inferences, proposals, and unknowns.
   - Explain why Git elapsed time is not person-hours and why percentages are heuristic snapshots rather than facts.

4. **Empirical diagnosis**
   - Consolidate the 15 systems (21-35), the PaldarkKit time/ROI retrospective, Wave 2/Task 52/Task 55 lessons, and the main integration failure patterns.
   - Preserve the distinction between engineering breadth, normal-play thin slices, and Palworld-like parity.
   - Include a compact maturity table and explicitly label its date/evidence limits.

5. **Theoretical preliminaries**
   - Explain effects, coeffects, temporal composability, spatial composability, observational equivalence, identity, ownership, authority, and transactions in plain Vietnamese before using symbols.
   - Cite Cordis rather than reproducing its notation or proofs verbatim.

6. **Paldark programming model**
   - Define a Paldark component in original notation, including `requires`, `provides`, installation effects/inverses, domain transactions, observation obligations, identity/scope/version, and lifecycle.
   - State invariants such as one canonical writer, declared dependency, reversible installation, transactional committed gameplay, evidence monotonicity, and no evidence promotion without a gate.
   - Give conditional propositions/proof sketches for local recovery, dependency coherence, restart reconciliation, integration containment, and evidence monotonicity. Every proposition must list assumptions and invalidation signals. Do not call these theorems about Unreal.
   - Make the critical split between reversible installation effects and irreversible/committed gameplay transactions.

7. **Correspondence with Unreal, Lyra, UEFN, and DeepSeek Harness**
   - Map each public Cordis/Harness concept to the closest Unreal mechanism and list the guarantee still missing.
   - Explain why "Everything is a Plugin" is a design heuristic, not a command to turn every class or actor into a plugin.
   - Define what belongs in a stable kernel, a Game Feature Plugin, a composable Actor/Component/device, a data contract, and an Experience.
   - Cover the Service Definition -> Provider -> Consumer seam and durable-event/log idea from the official Harness architecture.

8. **Proposed clean-room reconstruction architecture**
   - Preserve the isolated-lab-first decision, two-room provenance policy, typed contract graph, stable record plus actor lease, command/event/transaction grammar, and adapter-last integration.
   - Explain the proposed topology and stages CR-0 through CR-8.
   - Include the behavioral trace `Input -> Intent -> Owner -> State transition -> Commit/Reject -> Event/Snapshot -> Presentation`.

9. **Restart-safe multi-agent harness**
   - Specify Human, Sol orchestrator, Luna implementer, and fresh Sol reviewer roles.
   - State that the NDC talk supports separation of powers and fresh context, but does not prove a specific GPT-5.6 model is intrinsically best at a role.
   - Define task packet, escalation packet, review loop, bounded retry, devlog/checkpoint, reconciliation order, and human visual gate.
   - Make persisted artifacts the source of truth, not conversation memory.

10. **Implementation and evaluation plan**
    - Use vertical slices and gates, beginning with boot -> movement -> interaction/resource -> inventory HUD.
    - Cover parity contracts for later combat/crafting, build, creature/capture/PalBox, Work, persistence, and multiplayer.
    - Define measurable outcomes, ablations/comparisons, failure injection, and stop criteria.
    - Do not authorize code conversion or source/asset copying.

11. **Discussion, threats to validity, related work, conclusion**
    - Include binary Blueprint opacity, lack of controlled experiment, Cordis v3/v4 gap, Unreal analogy limits, human-observation limits, provenance/licensing, model-routing uncertainty, and percentage uncertainty.
    - Compare Cordis/DeepSeek Harness, Lyra, UEFN devices, GAS, and the NDC workflow by specific dimensions.
    - End with the next decision gate, not a claim that reconstruction is complete.

12. **Appendices inside the same file**
    - architecture decisions with rationale, invalidation signal, and fallback;
    - chapter-to-paper coverage map for all six existing books, course material, catalogs, and appendices;
    - compact task packet/human gate templates;
    - glossary and bibliography.

## 4. Source hierarchy

Prefer primary sources and label source class in prose where material.

Primary local sources:

- `../Documents/KYWorld/paper.pdf` - Cordis preprint, draft 2026-08-13.
- `../Documents/KYWorld/ke-hoach-tai-dung-kyworld-clean-room-cpp.md` - audited reconstruction plan and seed argument.
- `../Documents/KYWorld/claudecode_note.txt` - local transcript/notes for the NDC talk.
- `../Documents/PALDARK/**` - current Paldark book and evidence artifacts.
- `../PaldarkKit/**` - source/test evidence only; no changes.
- `../02.Palworld/Documents/**` and `../02.Palworld/Source/**` - evidence/provenance corpus only; no changes.

Primary public sources to link directly:

- `https://github.com/cordiverse/paper`
- `https://github.com/cordiverse/cordis`
- `https://github.com/deepseek-ai/deepseek-harness`
- `https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/master/docs/architecture.md`
- `https://dev.epicgames.com/documentation/en-us/unreal-engine/lyra-sample-game-in-unreal-engine`
- `https://dev.epicgames.com/documentation/en-us/unreal-engine/game-features-and-experiences-in-unreal-engine`
- `https://dev.epicgames.com/documentation/en-us/unreal-engine/modular-gameplay-in-unreal-engine`
- `https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-ability-system-for-unreal-engine`
- `https://dev.epicgames.com/documentation/en-us/fortnite/getting-started-with-devices-in-fortnite`
- the NDC Conferences video URL identified in `claudecode_note.txt`/research.

Secondary commentary such as `paper-review.txt` may explain why the paper is interesting but must not support biography, adoption, effectiveness, or formal claims.

## 5. Required design choices and their rationale

- **One canonical paper at the root:** satisfies the user's one-file request and gives the website one coherent argument. Old chapters remain as traceable archive because deleting them would destroy evidence and existing URLs.
- **Original Paldark notation and examples:** learns the reasoning pattern without copying paper prose, equations, algorithms, or diagrams. The paper repository does not state a content-reuse license.
- **Evidence-bounded claims:** prevents `COMPILED` from becoming `PLAYER_OBSERVABLE`, or a filename/commit from becoming parity.
- **Conditional proof sketches rather than formal-theorem claims:** the repository does not contain a mechanized proof of the proposed Unreal model.
- **Narrow reversible ledger:** registration handles, listeners, timers, input mappings, UI extensions, and removable grants can be tracked; damage, capture, inventory transfer, crafting output, building placement, progression, save, and network effects require transaction semantics.
- **Stable kernel plus variable capabilities:** not literally everything should be a plugin. Identity, ownership, authority, contract vocabulary, evidence schema, and loader rules need a stable trust boundary.
- **Existing VitePress/GitHub Pages architecture:** preserve package manager, lockfile, URL, old routes, and deployment workflow.

## 6. Allowed write set

- `index.md`
- `README.md`
- `.vitepress/config.mts`
- `.vitepress/sidebar.ts` only if navigation needs a minimal paper/archive adjustment
- `.vitepress/theme/**` only for paper-specific readability, and only if the current theme is insufficient
- `public/og.png` for one site-specific social card
- `.editorial/task-packet-paldark-harness-paper.md`
- `.editorial/paldark-harness-paper-review.md` for the independent reviewer report

## 7. Forbidden paths/actions for the implementer

- Do not edit `../PaldarkKit/**`, `../Documents/**`, `../02.Palworld/**`, any Unreal project, submodule, source, binary asset, or generated content.
- Do not delete/rewrite the archived chapter corpus.
- Do not add dependencies or replace VitePress/GitHub Pages.
- Do not commit, push, publish, merge, change GitHub settings, or change access.
- Do not claim legal clearance, 1:1 clone status, full Palworld parity, formal verification of Unreal, or access to private DeepSeek reasoning.

## 8. Acceptance criteria

1. `index.md` is the single canonical paper and contains the complete argumentative sequence above.
2. Every central architectural choice has a visible reason, assumptions/obligations, failure boundary, and fallback or invalidation signal.
3. The paper distinguishes Cordis theory, DeepSeek Harness implementation, Unreal correspondence, Paldark proposal, and observed Paldark/KYWorld evidence.
4. All 15 systems (21-35), all six existing books, the practical companion course, living catalogs, and appendices are represented in the coverage map or body.
5. Quantitative claims carry a snapshot/evidence caveat and do not convert wall-clock envelopes into labor.
6. Public primary-source links are direct and human-readable; local evidence references use stable repository paths/sections/commits where available.
7. Mermaid diagrams use valid syntax and add explanatory value. Tables are introduced and interpreted in prose.
8. Existing archived routes remain present. Navigation makes the research paper primary and the old book explicitly an archive/reference corpus.
9. Site metadata and README describe the new paper accurately; social metadata uses the final site URL.
10. `pnpm docs:check` succeeds.
11. `pnpm docs:build` succeeds without broken Mermaid/Markdown compilation.
12. The independent reviewer finds no blocking overclaim, source-class confusion, missing required section, broken link, or misleading model-routing statement.

## 9. Validation commands

Run from the `Paldark-Docs` repository with the bundled Node runtime available:

```powershell
pnpm docs:check
pnpm docs:build
git diff --check
git status --short
```

Also inspect:

- heading/word/link counts for `index.md`;
- the generated root HTML title, description, canonical URL, Open Graph fields, and presence of the major paper headings;
- `git diff --stat` and the exact write set.

## 10. Handoff contract

The Luna implementer returns changed files, a concise section inventory, exact validation results, unresolved claims, and risks. It does not self-approve.

A fresh Sol reviewer reads only this packet, the final diff, source/evidence references, and validation output. It writes findings without editing the implementation. Root decides corrections and performs any commit/publish only after acceptance.
