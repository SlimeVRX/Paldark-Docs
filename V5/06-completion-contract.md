---
title: V5.6 — Completion Contract
description: Closed-world coverage, native ownership, parity evidence và certificate để chứng minh Paldark V5 hoàn tất.
---

# V5.6 — Completion Contract

## 1. Điều certificate có thể và không thể bảo đảm

Certificate có thể chứng minh trên exact build rằng:

- toàn bộ corpus đã được accounted;
- mọi authoritative gameplay/integration decision đã native;
- retained Blueprint nằm trong allowlist data/presentation/declarative;
- behavior atlas, reference graph, build/cook/load, rollback và conformance pass;
- không còn unknown hoặc duplicate owner bị che giấu.

Nó không thể chứng minh tương đương toán học cho mọi chuỗi input/hardware/timing, hoặc game sẽ không bao giờ có bug. Presentation/game feel vẫn cần human observation.

Tuyên bố đúng là:

> Paldark V5 đạt full native ownership và reference parity trên closed corpus, scenario matrix, target UE 5.6.1 và tolerance đã được pin trong certificate.

## 2. Closed-world sets

W0 phải tạo chín tập:

- `T` — toàn bộ tracked path của gold UE 5.6.1;
- `P` — runtime-reachable package từ shipping roots qua hard/soft/manage/config/string/dynamic reference;
- `G(P)` — mọi executable graph/function/GUID trong `P`;
- `M` — mọi authoritative mutation, validation và ordering decision;
- `O` — mọi observable trong regression atlas: state, timing, presentation, transition, authored variant và failure path;
- `B` — mọi player-observable behavior row;
- `E` — mọi runtime reference edge;
- `U` — mọi source surface có thể mang semantics/reference: graph, property/default, SCS component, binding, dependency, mutation và reference;
- `N` — mọi legacy native `.h/.cpp` symbol cần adopt/refactor/replace/remove disposition.

Seed KYWorld hiện có 10.173 tracked path và 10.091 Unreal package. Đó là check ban đầu, không phải con số được hard-code vĩnh viễn; W0 phải tái sinh denominator sau upgrade 5.6.1 và record digest.

File ngoài runtime closure vẫn có row `VENDOR_DEMO_PRESERVED`, `EDITOR_TEST` hoặc `UNUSED_PROVED`. Nó không được biến mất chỉ vì không nằm trong shipping map.

## 3. Phân loại graph, không phân loại cả asset cho tiện

| Loại | Nội dung | Terminal disposition |
|---|---|---|
| `A — DATA` | defaults, definition, table, config, references | `RETAINED_DATA` |
| `B — PRESENTATION` | UMG layout/animation, AnimGraph, montage, audio/VFX/material | `RETAINED_PRESENTATION` |
| `DCL — DECLARATIVE` | BT/EQS policy, DataAsset authoring không mutate state | `RETAINED_DECLARATIVE` |
| `C — GAMEPLAY` | validation, calculation, authoritative mutation/rule | `NATIVE_VERIFIED` |
| `D — ORCHESTRATION` | boot, level flow, spawn/wiring/global discovery | `NATIVE_VERIFIED` |
| `HYBRID` | cùng asset có A/B/DCL và C/D | giữ phần authoring, migrate C/D |

Widget có layout B nhưng EventGraph add item là C. AnimBP có animation B nhưng event apply damage là C. Level Blueprint có placement/map B nhưng boot orchestration là D.

## 4. Hai trục terminal disposition

Package lifecycle và graph conversion không được gộp vào một enum. Mỗi runtime package có đúng một lifecycle:

```text
Lifecycle(P) = RETAINED ⊎ REPLACED_OR_REMOVED ⊎ EXCLUDED_PROVED
UNCLASSIFIED_LIFECYCLE(P) = 0
MULTIPLE_LIFECYCLE(P) = 0
```

Mỗi graph/unit trong package retained có đúng một role và terminal state:

```text
Role(G) = A ⊎ B ⊎ DCL ⊎ C ⊎ D
A/B/DCL → RETAINED_VERIFIED
C/D     → NATIVE_VERIFIED ⊎ LEGACY_C/D_TEMPORARY
```

`HYBRID` là derived package label khi cùng package giữ A/B/DCL và retire C/D; package vẫn chỉ có lifecycle `RETAINED`. Nhờ vậy Widget/AnimBP/Level asset không bị bắt chọn sai giữa “retained” và “migrated”.

Muốn full conversion:

```text
LEGACY_C/D_TEMPORARY = 0
PERMANENT_EXECUTABLE_BP_EXCEPTION = 0
```

Retained data/presentation/declarative asset là design choice, không phải exception. Authoritative Blueprint được giữ vĩnh viễn làm status thành `HYBRID`, không phải `COMPLETE`.

## 5. Ledger bắt buộc

| Ledger | Trường cốt lõi |
|---|---|
| `tracked-content.csv` | path, blob/package hash, class, source/vendor/test, wave, disposition |
| `packages.csv` | object path, reachability roots, owner, cook/load result |
| `graphs.csv` | graph GUID/name/type/hash, latent/tick/dispatcher, A/B/DCL/C/D, native target |
| `mutations.csv` | state key, current writer, target writer, validation/commit path |
| `references.csv` | from/to/kind, baseline/candidate resolve/cook/load |
| `behaviors/*.yaml` | Given/When/Then, S/T/V/R/X, variant, tolerance, evidence |
| `observables.csv` | observable ID, source atlas/card/video, variant và behavior row |
| `traceability.csv` | source surface ID/kind → behavior row hoặc explicit non-behavior disposition + approver |
| `state-ownership.yaml` | owner, scope, authority, mutation API, revision, persistence/event |
| `blueprint-allowlist.yaml` | exact object/hash, retained role, permitted graphs/calls |
| `native-convergence.csv` | mọi legacy `.h/.cpp` và symbol: adopt/refactor/replace/remove |
| `exclusions.yaml` | vendor/demo/editor/unreachable proof và approver |
| `deviations.yaml` | severity, effect, owner, expiry, approval |
| `rollback.yaml` | switch/revert và clean-worktree result |
| `conformance.yaml` | capability/provider/owner/dependency/lifecycle checks |
| `evidence-manifest.yaml` | certificate field → source ledger → digest → deterministic recompute query; bao phủ scope/unknown/zero gates |

Ledger là trạng thái chương trình. Markdown giải thích lý do; nó không thay thế denominator máy đọc được.

## 6. Native ownership lint

Editor commandlet phải load mọi runtime-reachable Blueprint và fail khi:

- graph chưa classify;
- UI trực tiếp sửa canonical domain state;
- AnimBP/notify apply damage hoặc quyết định gameplay rule;
- BT/EQS Blueprint task mutate/validate authoritative state;
- Level Blueprint giữ global gameplay orchestration;
- latent/timeline/tick/dispatcher không có ledger row;
- direct cross-feature concrete dependency/global discovery ngoài policy;
- old và new path cùng commit mutation;
- dynamic/string load không có declaration;
- asset parent/default/reference lệch ngoài approved delta.

Blueprint được phép gọi typed command như `RequestTransfer`. Native handler phải sở hữu validation và mutation.

## 7. Behavior coverage và denominator integrity

Mỗi native command/state machine có:

- happy path;
- mọi public rejection/guard reason;
- boundary;
- cancel/interruption;
- retry/idempotency;
- duplicate/out-of-order nếu liên quan;
- lifecycle/spawn/destroy;
- exact post-state;
- no-mutation-on-reject.

Line/branch coverage là diagnostic. Gate chính là:

```text
capability/variant/observable atlas → ít nhất một behavior row → evidence
public command/state transition/rejection → ít nhất một behavior row → evidence
source graph/property/default/component/binding/dependency/mutation/reference
    → behavior row hoặc explicit non-behavior disposition + approver
```

Traceability phải hai chiều. Presentation-only timing, level transition, sound/VFX cue và authored variant vẫn thuộc `O` dù không gắn public native command. Source surface không được mất khỏi denominator chỉ vì translator không nhận nó.

Human gate có ba tầng:

1. focused feature gate;
2. wave integration gate;
3. full-game/canonical playthrough gate.

## 8. Closure equations

Full certificate yêu cầu:

```text
Terminal(T) / |T|                               = 100%
LifecycleTerminal(P) / |P|                      = 100%
RoleTerminal(G) / |G|                           = 100%
NativeVerified(G_C/D) / |G_C/D|                 = 100%
NativeOwned(M) / |M|                            = 100%
LinkedToBehavior(O) / |O|                       = 100%
BehaviorOrDisposition(U) / |U|                  = 100%
VALIDATED(B) / |B|                              = 100%
ResolvedCookedLoaded(E_runtime) / |E_runtime|   = 100%
Terminal(N) / |N|                               = 100%
```

Trong đó:

```text
VALIDATED(B) = EXACT_PASS(B) ⊎ ACCEPTED_DEVIATION(B)
EXACT_PASS(B) ∩ ACCEPTED_DEVIATION(B) = ∅
```

Validator tự sinh/recompute numerator và denominator từ ledger digest, không tin số người viết tay. `evidence-manifest.yaml` map mọi certificate scope/closure/zero field tới source ledger, digest và deterministic query; field không có mapping là invalid. Với KYWorld seed, mọi tập `T/P/G/M/O/B/E/U/N` và `G_C/D` phải có denominator > 0; `0/0` không phải 100%. Terminal status bị cấm khi digest/count lệch, required digest/reference-candidate hash/approval rỗng, hoặc `validated != exact + accepted != total`.

Và đồng thời:

```text
UNKNOWN                            = 0
UNASSIGNED                         = 0
UNALLOWLISTED_RUNTIME_BLUEPRINT    = 0
PERMANENT_EXECUTABLE_BP_EXCEPTION = 0
FORBIDDEN_BLUEPRINT_MUTATION       = 0
DUPLICATE_STATE_OWNER              = 0
LEGACY_AUTHORITATIVE_PATH          = 0
UNRESOLVED_ADAPTER                 = 0
DEPENDENCY_CYCLE                   = 0
ORPHAN_OBSERVABLE                  = 0
ORPHAN_SOURCE_SURFACE              = 0
UNAPPROVED_DEVIATION               = 0
OPEN_HIGH_OR_CRITICAL_DEVIATION    = 0
STALE_EVIDENCE                     = 0
NEW_ERROR_ENSURE_MISSING_REFERENCE = 0
```

## 9. Positive gates bắt buộc

Phương trình đúng nhưng build không chạy vẫn không đủ. Certificate machine-readable phải có `result` và non-empty evidence digest cho mọi gate required:

- Editor build, Blueprint compile, Data Validation, Map Check;
- cook, package và cold launch;
- automated behavior, feature/wave human gate và canonical playthrough;
- reference closure và performance profile;
- rollback drill, Paldark conformance và independent review.

Disk-save scope thêm save round-trip/recovery gate. Listen/dedicated scope thêm network matrix gate. `NOT_APPLICABLE` chỉ hợp lệ khi scope manifest + decision ID chứng minh overlay bị tắt; ô trống không phải N/A. Validator cấm phát hành terminal status khi gate required không `PASS` hoặc digest rỗng.

## 10. Certificate status

| Status | Nghĩa |
|---|---|
| `COMPLETE` | Conversion/reference closure + positive/zero gates pass; `EXACT_PASS(B)=100%`; observable deviation = 0 |
| `HYBRID` | Behavior validated nhưng còn allowlisted authoritative executable Blueprint; không phải full conversion |
| `PARITY_WITH_DEVIATIONS` | Conversion closure + positive gates pass; `EXACT_PASS + ACCEPTED_DEVIATION = 100%` và accepted deviation > 0 |
| `FAILED` | Closure/reference/ownership/parity gate không pass |

`APPROVED_DEVIATION` không được cộng vào `EXACT_PASS`. Mỗi accepted difference cần behavior ID, deviation ID, owner, severity, evidence và expiry/review policy. Nếu behavior thay đổi có chủ ý, tên certificate phải nói thật.

Mẫu: [Completion Certificate](/V5/Templates/).

## 11. Evidence freshness và invalidation

Certificate pin:

- reference và candidate commit/build hash;
- UE 5.6.1 exact changelist;
- target/platform/compiler/plugin/config;
- evidence/field-source/scope-decision/unknown/mutation inventory; Asset Registry/allowlist/behavior/native-convergence/test/human/performance/rollback/conformance digest.

Certificate bị vô hiệu khi source/content, config/plugin, engine/target, inventory digest hoặc evidence-required behavior thay đổi. Không tái dùng video/test report của commit cũ chỉ vì feature name giống nhau.

## 12. Minimal assurance, không phải CI theatre

Chỉ xây automation trực tiếp bảo vệ target:

- toolchain lock;
- build/Blueprint/DataValidation/MapCheck;
- owner/dependency/manifest/BP lint;
- focused behavior tests;
- reference/cook/load closure;
- evidence freshness và certificate generation.

Không tạo dashboard hoặc pipeline phức tạp nếu không chặn một failure mode cụ thể. Công việc lặp lại phù hợp với commandlet/script; visual/game-feel phù hợp với human gate.

## 13. W12 exit

W12 chỉ được phát hành khi:

- all closure equations pass;
- retained Blueprint allowlist review pass;
- all legacy native symbols có terminal disposition;
- clean supported target build/cook/package/cold launch;
- canonical playthrough và domain human gates pass;
- mọi required positive gate có `PASS` + non-empty digest; conditional save/network gate có PASS hoặc justified N/A;
- rollback drill pass;
- Paldark Core conformance pass;
- fresh independent review pass;
- product owner ký certificate.
