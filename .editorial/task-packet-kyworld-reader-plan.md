# Task packet — Reader-first KYWorld C++ reconstruction plan

Status: APPROVED FOR DOCUMENTATION IMPLEMENTATION

Baseline: `604707eb1ffe7d85ae855cdec3331b3a23ee8fc0`

Date: 2026-08-16

## 1. User feedback and correction goal

The current `index.md` is rigorous but unreadable as a Paldark chapter. It asks one page to be a landing page, academic paper, evidence audit, architecture specification and operations handbook at the same time. The corrective goal is not a cosmetic edit. Replace the root page with the project's most important deliverable:

> **Tái dựng KYWorld bằng C++ — từ hành vi đã quan sát đến gameplay có thể kiểm chứng.**

The reader must understand, in this order:

1. why adding more PaldarkKit breadth is paused;
2. why KYWorld is valuable as a polished behavioral reference but not a donor architecture or license;
3. why behavior must be reconstructed rather than Blueprint/code translated;
4. why an isolated C++ lab is safer than editing PaldarkKit first;
5. what the C++ architecture is and why its boundaries exist;
6. what happens from CR-0 through CR-8;
7. how all 15 systems, presentation polish, assets and later Paldark integration are covered;
8. which decisions are still required before the first line of implementation code.

This is documentation and planning only. It does not authorize Unreal/code/asset work.

## 2. Source hierarchy

Read completely before writing:

- `.editorial/voice.md`;
- `Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi.md` as the primary voice exemplar;
- the current `index.md` for research content and honesty boundaries;
- `../Documents/KYWorld/ke-hoach-tai-dung-kyworld-clean-room-cpp.md` as the audited technical plan;
- the original user brief supplied with this task attachment (its machine-local path is intentionally not published);
- `00-MucLuc.md`, `.vitepress/config.mts`, `.vitepress/sidebar.ts`, `README.md` for information architecture.

Keep these evidence facts unchanged:

- the local technical plan is version 0.1, `PROPOSED — AWAITING ARCHITECTURE APPROVAL`;
- no CR stage is open and no conversion is authorized;
- KYWorld census snapshot: 10,173 tracked paths, 10,040 `.uasset`, 51 `.umap`, 34 `.cpp`, 36 `.h`, 3 `.cs`, about 2,919 physical native C++ header/source lines;
- static assets, names, commits and documents are not normal-runtime proof;
- the plan has a strong architecture/stage/gate backbone, but a complete behavior inventory, concrete C++ API, asset replacement inventory and full conversion backlog still require CR-0 work;
- the 21 PaldarkKit GameFeatures are Active/static packaging, not proven dynamic composition;
- Work → PalBehavior is dependency debt; registry is a stub; event bus is synchronous; persistence/multiplayer are QA-only; no benchmark exists; Task 55 remains UNKNOWN;
- Cordis/DeepSeek Harness provide public theory/architecture heuristics, not private chain of thought or a proof of Unreal/Paldark correctness;
- no donor asset/code redistribution or legal-clearance claim.

## 3. Reader and voice contract

The primary reader is a game developer who should be able to read the first half without already knowing Cordis, coeffects, provider generations or Paldark internals.

Follow `.editorial/voice.md` strictly:

- open with a concrete player-visible failure or contrast;
- move from what the player sees to conditions, state, owner and only then mechanisms;
- introduce one technical term only when it answers a question already raised;
- write natural Vietnamese paragraphs of roughly two to five sentences;
- use `bạn` for a concrete scene and `chúng ta` when following the reasoning together;
- explain every important table/diagram before it appears and state the conclusion after it;
- end sections with a consequence, boundary or bridge;
- translate the role of English terminology on first use; use backticks for identifiers;
- keep audit caveats, but place them after the insight they bound rather than before every sentence.

Avoid:

- front-loading abstract/RQ/contribution/source-taxonomy material;
- strings of headings, tables and checklists without narrative bridges;
- unexplained code-switching;
- repeating the same boundary in abstract, body, conclusion, ADR and glossary;
- writing as if the page were a legal memo or an internal status dump;
- saying the plan is already execution-complete.

## 4. Progressive-disclosure structure for `index.md`

Target roughly 8,000–11,000 Vietnamese words. The first 3,500–5,000 words must form a complete reader narrative. Technical/reference sections follow in the same file so the root remains the single canonical plan.

Use this logical sequence; wording and exact heading names may improve, but do not reorder the reasoning.

### Part I — The readable decision and journey

1. **Opening scene: a repository can contain a feature while the player still sees a broken promise.** Use the second-`V`/teleport or pickup/HUD example. Connect the scene directly to the pause decision.
2. **Why pause PaldarkKit now.** Distinguish breadth, compiled seams, normal play, human verification and polish without calling prior work a failure.
3. **What is worth keeping from KYWorld.** Treat polish and observed loops as the target. Explain the static census briefly and why binary breadth is both valuable and opaque.
4. **What “reconstruct” means.** Rebuild observable promises and failure behavior in original C++; do not translate Blueprint graphs or copy assets. Define a behavior contract through one ore-pickup example.
5. **Why an isolated lab comes before PaldarkKit.** Explain discardable hypotheses, clean-room two-room separation, neutral contracts and adapter-last.
6. **The C++ skeleton.** Explain Foundation, Data, Composition Host, domain owners, Presentation and the eventual Paldark Adapter. Use one Mermaid diagram and interpret it.
7. **Why plugin/composability ideas help only within a boundary.** Explain installation effects versus committed gameplay first; then Cordis, Harness, Game Features, Lyra, GAS and UEFN. “Everything is a Plugin” is a boundary heuristic, not one plugin per class.
8. **CR-0 to CR-8 as a journey.** Start with the player-visible outcome of each stage, then say what must be true to enter/exit. The first slice is boot → movement → interaction/resource → inventory HUD. Later stages cover combat/crafting, building, creature/capture/PalBox, Work, hardening and adapter integration.
9. **How work survives restart.** Tell one concrete packet → Luna → escalation → fresh Sol review → human normal-input gate → persisted checkpoint cycle. Role authority comes from workflow, not claims of inherent model superiority.
10. **The decision required now.** End Part I with the human choices needed to open CR-0 and an explicit statement that no code begins automatically.

### Part II — The master plan and reference

11. **Definition of full recreation.** State what must eventually be inventoried: behavior, failure, timing, camera, animation, UI, audio, data, save/network where required, known deltas and provenance. Explain that CR-0 creates the complete backlog; the current document is the master plan, not a fabricated inventory of opaque Blueprint behavior.
12. **Fifteen-system completeness map.** Cover chapters 21–35. For each system give current evidence band, reconstruction promise, owner, planned stage and missing observation/specification. Group related systems in prose before the table.
13. **C++ module and ownership map.** Give proposed module/plugin boundaries, one-writer rules, stable record/Actor lease, command/event/transaction flow and the `requires/provides` responsibility. Do not pretend headers/APIs are frozen before CR-0/CR-1.
14. **Content and polish pipeline.** Add the missing plan for camera/movement feel, animation, bow timing, HUD/layout, audio/VFX, asset provenance and original/licensed replacements. Explain how visual tolerance and human observation become acceptance criteria without copying trade dress/assets.
15. **Version/platform decision.** Explain KYWorld UE 5.4 reference versus proposed UE 5.6 lab, compatibility spike, plugin/platform matrix and fallback if behavior diverges.
16. **Workstreams, dependencies and parallelism.** Show the critical path and safe parallel tracks: corpus/provenance, behavior specification, foundation/composition, domain slices, presentation/assets, validation, adapter. Parallel work may not create two canonical writers or bypass stage prerequisites.
17. **Gates and stop conditions.** Preserve PG-0…PG-8 in readable form; explain why compile is not observation and observation is not parity. Include restart/retry/failure and performance measurement plans without inventing benchmark numbers.
18. **CR-0 deliverables.** List the concrete artifacts that turn this master plan into execution-ready packets: complete behavior inventory, evidence ledger, reference manifest, provenance manifest/schema, observation scripts, media hashes, unknown register, API decision records, feature backlog/dependency graph, asset replacement inventory, test/gate cards and first CR-1/CR-2 packet.
19. **Risks, unresolved decisions and sources.** Keep clean-room/IP, Blueprint opacity, missing behavior, human-gate limits and analogy limits. Link the public primary sources. Local paths must be marked as parent-workspace provenance references, not public links.

## 5. Information architecture and site copy

- `index.md` stays `/` and becomes the plan above.
- Preserve the current academic paper as `NghienCuu/paldark-composability-harness.md` using an `apply_patch` move before replacing `index.md`. Its title/status stays clear that it is the research foundation, not the primary plan.
- Keep every existing archive route and `00-MucLuc.md` path unchanged.
- Add a short “Tài liệu ưu tiên” block near the top of `00-MucLuc.md`: plan `/`, research foundation, then the six-book archive.
- Navigation:
  - `Kế hoạch KYWorld C++` → `/`
  - `Sách Paldark` → `/00-MucLuc`
  - dropdown `Nghiên cứu & bằng chứng` with the research paper, evidence ledger and current ADR
  - GitHub remains available.
- Sidebar “Bắt đầu”: plan, research foundation, book index, current ADR.
- `README.md`, site title/description, OG title/description/alt and footer must describe the KYWorld C++ reconstruction plan as primary.
- Add a brief link near the start of the new index for readers looking for the previous composability research paper.

## 6. Social card

Root will generate exactly one replacement social card after this packet. Implementer must use the resulting `public/og.png` dimensions in site metadata and must not generate another image.

The card message is the plan, not the previous generic paper. Do not use Palworld/KYWorld copyrighted characters, logos, screenshots or trade dress.

## 7. Allowed write set

- `index.md`
- `NghienCuu/paldark-composability-harness.md`
- `00-MucLuc.md`
- `README.md`
- `.vitepress/config.mts`
- `.vitepress/sidebar.ts`
- `public/og.png`
- `.editorial/task-packet-kyworld-reader-plan.md`
- `.editorial/kyworld-reader-plan-review.md`

## 8. Forbidden paths and actions

- Do not edit `../Documents/**`, `../PaldarkKit/**`, `../02.Palworld/**`, Unreal projects, code, assets or submodules.
- Do not add or update dependencies, package manager or deployment workflow.
- Do not delete or rename any Q1–Q6, Course, Catalog, Appendix or template route.
- Do not create a second full plan route; `/` is canonical.
- Do not claim full recreation is already specified, conversion has begun, dynamic GameFeature composition exists, parity is achieved or legal clearance is granted.
- Implementer must not commit, push, deploy or self-approve.

## 9. Acceptance criteria

1. A reader can understand the pause decision, KYWorld value, reconstruction strategy and next human decision from Part I without reading appendices.
2. The prose demonstrably follows `.editorial/voice.md`: concrete scene first, natural Vietnamese, cause before terminology, tables introduced/interpreted and consequences closing sections.
3. The plan—not the abstract programming model—is the root page's primary promise.
4. The page covers CR-0…CR-8, PG-0…PG-8, all 15 systems, C++ topology, clean-room, content/polish, UE versioning, workstreams, restart-safe agents and Paldark adapter integration.
5. The document states exactly what exists now and what CR-0 must still discover; it never markets the master plan as a complete opaque-Blueprint conversion backlog.
6. The current research paper remains accessible at the new research route; archive routes remain unchanged.
7. Navigation, README and metadata consistently foreground the plan.
8. The social card matches the plan and uses correct dimensions.
9. Local evidence paths have an explicit base and are not presented as public links; public primary sources are direct.
10. `pnpm docs:check`, `pnpm docs:build` and `git diff --check` pass.
11. A fresh Sol reviewer returns ACCEPT with no blocker for readability, factual overclaim, missing master-plan area or broken information architecture.

## 10. Validation

Run from `Paldark-Docs` with the bundled Node runtime:

```powershell
pnpm docs:check
pnpm docs:build
git diff --check
git status --short
```

Also inspect:

- word, heading, table/list and code-block counts for the new root page;
- first 1,500 words manually against `.editorial/voice.md`;
- title/canonical/OG metadata in generated root HTML;
- presence of the research route in built output;
- exact write set and archive-route count;
- no absolute machine paths, secrets or private asset references in published prose.

## 11. Handoff

Luna returns changed files, section inventory, exact validation output, unresolved content decisions and risks. Luna does not approve its own writing. A fresh Sol reviewer then reads the user feedback, this packet, final root page, moved research paper and full diff, and reports findings without editing.
