---
title: V5.4 — Feature Dossier và Human Gate
description: Quy trình first-principles khóa target quan sát được trước khi một task gameplay được phép code.
---

# V5.4 — Feature Dossier và Human Gate

> **Nguyên tắc:** Human gate phải được viết **và chạy rehearsal trên gold reference trước code**, không được sáng tác sau khi candidate đã xong.

## 1. Vấn đề cần giải

Công cụ có thể dịch Blueprint sang C++ nhanh. Nó không biết người chơi đang dựa vào chi tiết nào: một khoảng delay, hướng xoay, focus rule, sound cue, widget transition, retry behavior hay animation notify. Nếu target chỉ là “convert inventory”, implementation có thể compile hoàn hảo nhưng đã làm mất gameplay.

V5 tách hai quyền:

- **Planner/owner quyết định output nào phải tồn tại.**
- **Implementer tự quyết định cách tạo output ấy trong contract và write-set đã khóa.**

Implementation được phép thay đổi mạnh. Target không được trôi theo implementation.

## 2. Đơn vị kế hoạch: behavior slice

Không giao việc theo folder hoặc Blueprint. Một migration unit là **một đường quyết định authoritative và một outcome quan sát được**.

Ví dụ “inventory drag/drop” không phải một unit duy nhất. Nó có thể gồm:

1. chọn source slot;
2. validate target slot;
3. merge stack;
4. swap khác loại;
5. reject slot không hợp lệ;
6. cancel drag;
7. refresh view và toast.

Các row dùng chung state owner/transaction có thể vào cùng packet nhỏ; các row khác failure semantics hoặc presentation gate nên tách.

## 3. First-principles decomposition trước task

Planner trả lời theo thứ tự:

### 3.1. Player promise

Người chơi đang cố làm gì, và vì sao feature tồn tại trong vòng chơi? Câu trả lời phải player-facing, không phải tên class.

### 3.2. Observable loop

```text
Precondition → Player/AI action → Validation → State transition
→ Presentation → New affordance → Failure/retry path
```

Nếu chưa vẽ được loop, feature chưa đủ hiểu để code.

### 3.3. State model

- canonical state nào thay đổi;
- owner hiện tại và owner V5;
- legal transition;
- invariants;
- revision/idempotency;
- state nào chỉ là presentation cache.

### 3.4. Dependency

- capability bắt buộc đã có;
- authored asset/reference cần giữ;
- subsystem/provider scope;
- feature nào sẽ consume output sau này;
- điều gì bị cấm đổi trong task.

### 3.5. Variant và failure space

Liệt kê item/weapon/Pal/map/archetype variant, success, reject, cancel, retry, boundary, duplicate và interruption. Không cần cartesian-test vô hạn; phải chọn equivalence class có lý do và account mọi variant trong manifest.

### 3.6. Năm chiều parity

Mỗi behavior row khóa:

```text
P = <S, T, V, R, X>
```

| Chiều | Câu hỏi |
|---|---|
| `S` — State | Post-state và no-mutation-on-reject có giống reference không? |
| `T` — Temporal | Ordering, delay, window, cancel/interruption có giống không? |
| `V` — Presentation | Animation, camera, UI, audio, VFX và game feel có giống không? |
| `R` — Reference | Object path, default, component hierarchy và asset binding có giữ không? |
| `X` — Runtime health | Có crash, ensure, error, leak, duplicate callback hoặc stale handle mới không? |

State correctness dùng tolerance 0. Timing/performance/presentation tolerance phải được ghi trước khi xem candidate.

Behavior row giữ **hai snapshot riêng**:

- `reference_observation` ghi điều gold thực sự làm, kể cả bug;
- `approved_target_expectation` ghi điều candidate phải làm sau quyết định owner.

Với `PRESERVE_REFERENCE`, hai snapshot giống nhau trong tolerance. Với `KNOWN_REFERENCE_BUG`, row bắt buộc có ADR/deviation ID và target expectation mới; không được sửa đè observation cũ. Human card chọn snapshot bằng phase: rehearsal đọc reference, candidate acceptance đọc approved target.

## 4. Feature Dossier

Feature Dossier là hồ sơ design/readiness, không phải implementation checklist. Nó gồm:

1. identity, scope và feature parent;
2. player promise và reference version;
3. exact maps/save/seed/input/fps/hardware;
4. object path, graph/function/GUID và native source liên quan;
5. current state machine/owner/dependency;
6. target capability/owner/contract;
7. behavior matrix và parity tolerance;
8. presentation/reference inventory;
9. known reference bug và gold decision;
10. human gate rehearsed result;
11. migration units theo dependency;
12. explicit non-goal, write-set, rollback và stop condition;
13. evidence digest.

Dossier còn có traceability hai chiều:

```text
capability/variant/observable atlas → behavior row
graph/property/default/component/binding/dependency/mutation/reference
    → behavior row hoặc explicit non-behavior disposition + approver
```

Một presentation-only timing, level transition hoặc authored variant vẫn phải có row dù không bắt đầu từ public native command. Một source surface chỉ được đánh non-behavior khi có lý do và người duyệt; để trống là blocker.

Mẫu máy đọc được: [Feature Dossier](/V5/Templates/).

## 5. Reference characterization

### 5.1. Gold setup

Một observation chỉ có ý nghĩa khi pin:

- gold commit/build hash;
- UE 5.8.1 changelist;
- map, GameMode/profile;
- save/seed và starting inventory/state;
- input device/mapping;
- fps cap, resolution và hardware nếu quan sát timing/presentation;
- console/config overrides.

### 5.2. Characterization matrix

Mỗi public command/transition tối thiểu có:

- happy path;
- từng rejection reason;
- boundary;
- cancel/interruption;
- retry/idempotency;
- duplicate/out-of-order khi có async/network semantics;
- spawn/destroy hoặc activate/deactivate;
- exact post-state.

### 5.3. Gold không đồng nghĩa bug nào cũng đúng

Khi reference có hành vi đáng ngờ, owner chọn một trong ba:

- `PRESERVE_REFERENCE` — đây là behavior/polish cần giữ;
- `KNOWN_REFERENCE_BUG` — candidate theo contract sửa đã duyệt;
- `INCONCLUSIVE` — block unit và thu thêm evidence.

Không để implementer tự “sửa cho đẹp” rồi gọi khác biệt là refactor.

`KNOWN_REFERENCE_BUG` không thay đổi lịch sử quan sát: dossier lưu đồng thời `reference_observation`, `approved_target_expectation`, decision/deviation ID và evidence của cả hai.

## 6. Human gate phải rehearsal trước code

Human tester chạy test card trên gold và xác nhận:

- precondition tạo được;
- từng bước không mơ hồ;
- expected observation nhìn/nghe được;
- checkpoint đủ ngắn để tìm first wrong observation;
- evidence capture khả thi;
- test phân biệt được success với một implementation gần đúng.

Nếu card không chạy được trên reference, task chưa `READY`.

Mẫu: [Human Gate](/V5/Templates/).

## 7. Từ dossier tới task packet

Chỉ khi dossier `TARGET_APPROVED` và reference gate `REHEARSED_PASS`, planner mới tách task packet.

Mỗi packet khóa:

- một outcome;
- behavior row IDs;
- current và target owner;
- allowlisted paths;
- public contract được phép dùng;
- assets/defaults/references cấm đổi;
- automated/editor/human acceptance;
- rollback switch;
- stop/escalation conditions.

Packet không bắt implementer gõ từng dòng code. Nó đặt biên để nhiều cách implementation khác nhau vẫn có cùng output.

## 8. Migration state machine

```text
DISCOVERED
→ CHARACTERIZED
→ TARGET_APPROVED
→ GATE_REHEARSED
→ READY
→ GENERATED_STAGING? / HAND_WRITTEN
→ NATIVE_DORMANT
→ NATIVE_SHADOW?
→ AUTHORITATIVE_SWITCHED
→ AUTOMATED_PASS
→ HUMAN_PASS
→ PARITY_EVIDENCED
→ LEGACY_C/D_RETIRED
```

`BLOCKED` có thể xuất hiện ở mọi trạng thái kèm Question ID. Không được nhảy từ `DISCOVERED` sang converter rồi viết target ngược từ output generated.

## 9. Một authoritative path tại một thời điểm

Trong migration:

- old path có thể active hoặc shadow read-only;
- new path có thể dormant hoặc authoritative;
- không có trạng thái cả hai cùng commit mutation;
- switch phải explicit và revert được bằng một unit/commit;
- legacy C/D chỉ bị xóa sau parity evidence;
- A/B data/presentation asset được giữ.

Nếu task cần sửa owner hoặc public contract đã duyệt, implementer dừng và trả escalation packet. Không “fix nhanh” trong feature branch.

## 10. Human–agent contract

### Agent phải bàn giao

- exact build/commit;
- setup tự động được tối đa;
- test card ngắn, đánh số;
- expected observation ở mỗi checkpoint;
- log category/correlation ID nếu có;
- chỗ cần quay video/chụp ảnh;
- cách reset để chạy lại;
- mẫu report `first_wrong_observation`.

### Human phải trả lại

- `PASS`, `FAIL` hoặc `BLOCKED`;
- last correct step;
- first wrong observation;
- timestamp/correlation;
- media path;
- có tái hiện lần hai không;
- nhận xét game feel tách khỏi state correctness.

Human không bị yêu cầu đọc code hoặc đoán nguyên nhân. Agent dùng observation để diagnose.

## 11. Stop conditions

Implementer dừng ngay khi:

- target behavior mâu thuẫn hoặc thiếu gold decision;
- owner/dependency không đúng Core TDD;
- cần sửa ngoài write-set;
- converter có unsupported node ảnh hưởng semantics;
- asset parent/default/reference lệch ngoài allowlist;
- old/new double mutation;
- hai giả thuyết fix liên tiếp thất bại cùng một symptom;
- human gate cho thấy feature prerequisite chưa parity.

Dừng đúng lúc không phải thất bại. Nó bảo vệ dependency order và ngăn một task nhỏ âm thầm viết lại kiến trúc.

## 12. Definition of Ready và Done

### Ready

```text
Dossier complete
Gold reference pinned
Behavior rows characterized
Target owner/contract approved
Dependency VERIFIED
Human gate rehearsed
Write-set and rollback defined
Unknown blocking = 0
```

### Done

```text
Source present + clean build
Focused contract tests pass
Upstream regression pass
S/T/V/R/X parity pass
Human gate pass where required
Evidence points to candidate HEAD
Legacy authoritative path retired
Coverage ledger updated
Fresh review pass
```

Không dùng một chữ `done` nếu chỉ đạt compile.
