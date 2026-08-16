---
title: V5.5 — Blueprint→C++ conversion standard
description: Audit Soliz-Blueprint-C, qualification gate UE 5.6.1 và pipeline dùng converter mà không làm mất behavior.
---

# V5.5 — Blueprint→C++ conversion standard

> **Kết luận:** `Soliz-Blueprint-C` là extractor/scaffolder và draft generator hữu ích. Nó không phải parity authority và chưa được phép ghi trực tiếp production source.

Repository được audit tại [SlimeVRX/Soliz-Blueprint-C](https://github.com/SlimeVRX/Soliz-Blueprint-C), remote HEAD `6b380a7d407a9a5ffde3050f6dda0e9bfa01abfc`.

## 1. Kết quả build thực tế trên target V5

Toolchain thử nghiệm:

```text
Unreal Engine 5.6.1
Changelist 44394996
CompileHostEditor Win64 Development
99 build actions
```

Kết quả:

- vendored `NodeToCode` compile/link;
- `BPScaffold` nguyên trạng không compile;
- disposable diagnostic copy sau một số sửa tương thích compile được;
- automation suite sau sửa đạt **27 Success / 1 Fail**;
- test fail nằm ở `IdentifierSanitizer`: cách xử lý `New` và `Namespace` không khớp assertion.

Do đó main hiện tại chưa qualified cho UE 5.6.1 dù history có commit cũ tên “Fix build UE56”. “UE56” không thay thế clean build trên exact 5.6.1 HEAD.

## 2. Ba công cụ khác nhau trong repository

| Thành phần | Vai trò | Trạng thái |
|---|---|---|
| `BPScaffold` v1.0 | Analyzer, header/source scaffold, offline K2 translator, manifest | Editor source plugin, `Installed:false` |
| `NodeToCode` v1.2.2 | Graph JSON + LLM translation UI/bundle | Vendored sibling Editor plugin; Win64/Mac |
| `Sourcify` v1.4.876 | Vendor-claimed reference-rewriting converter riêng | Proprietary Editor Win64 wrapper; chưa runtime-verify vì binary/lib UE 5.6 không có trong Git tree |

Sourcify không thể được coi là buildable từ repository này: Build.cs yêu cầu `.lib/.dll` UE 5.6 riêng. Nếu muốn dùng, owner phải cung cấp licensed artifact và pin version độc lập.

Đây là ba sibling **Unreal Editor plugin**, không phải một CLI cài global. Qualification host phải pin project-local `BPScaffold/` + `NodeToCode/` dưới `Plugins/`; không cài Engine-wide. Hiện hai plugin này là một cặp vận hành vì BPScaffold Build.cs link NodeToCode vô điều kiện trên Win64/Mac. Sourcify mặc định disabled cho tới khi licensed artifact pass gate riêng. Generated game Runtime module tuyệt đối không được thêm dependency vào ba Editor tool.

Tool repo và game repo PaldarkV5 phải tách biệt. Không seed content KYWorld vào `Soliz-Blueprint-C`; chỉ qualification host/temporary staging được mount asset fixture.

Maturity snapshot của exact HEAD: 81 commit từ 2026-05-03 đến 2026-06-14; không quan sát thấy tag, release, root CI workflow hoặc check-run. Đây là lý do local green build phải sinh qualification certificate riêng, không được suy ra release readiness từ `main`.

## 3. Build blocker quan sát được

Các blocker của BPScaffold main gồm:

- include `UUserDefinedStruct` cũ không còn đúng trên 5.6.1;
- nested `/* TODO */` làm vỡ Doxygen comment trong header;
- `IsA<UBlueprintGeneratedClass>()` dùng không hợp lệ tại analyzer;
- golden fixture `.h` nằm trong `Source/` bị UHT coi như reflection header thật;
- thiếu module dependency `PropertyPath`, gây linker error;
- NodeToCode được ghi optional trong `.uplugin` nhưng Build.cs add unconditionally trên Win64/Mac.

Đây là compatibility work hữu hạn, nhưng phải được sửa trong fork/pin của tool trước W2. Không sửa ad hoc trong mỗi gameplay branch.

## 4. Input và output thật

Direct Content Browser selector nhận:

- Blueprint;
- Widget Blueprint;
- User Defined Struct/Enum;
- DataTable.

Selector trực tiếp không bao phủ đầy đủ AnimBlueprint và LevelScriptBlueprint; chúng có thể chỉ lọt vào qua dependency/live editor path. Đây là lý do tool selection không thể làm closed-world denominator.

Output có thể gồm:

- `.h/.cpp` scaffold;
- `Graph.json`, prompt và LLM bundle;
- dependency report và Build.cs hint;
- DataTable CSV/repoint note;
- migration manifest;
- game module/target setup note.

Tool không tự:

- reparent original Blueprint;
- rename/copy graph cũ thành `_Deprecated` đúng semantics;
- redirect toàn bộ asset reference;
- chứng minh behavior;
- chạy human gate;
- retire legacy owner.

## 5. Coverage claim phải đọc đúng

README tự ước lượng structural translation khoảng 60–75% common pattern và thừa nhận phần còn lại cần LLM/human. Implemented draft lowering đã có nhiều node thông dụng như function/event flow, variable, branch/sequence, cast, switch, loop, SpawnActor/NewObject, một số event-dispatcher bind/unbind/call path, Enhanced Input và Delay. Không được rút gọn điều này thành “delegate supported”: signature/type inference vẫn partial.

Partial/TODO đáng chú ý:

- N-way Select, FormatText;
- Make/Break struct và MakeArray/object literal;
- delegate inference;
- complex user macro;
- Timeline;
- LoadAsset/async task;
- MultiGate/DoOnce Reset.

Manual/unsupported:

- AnimGraph/state-machine pose evaluation;
- MathExpression;
- gameplay async như MoveTo/UAITask;
- generic struct/container và hard asset-reference CDO default;
- GAS specialization, round-trip/drift detection, Niagara/Material vẫn là roadmap/future.

Pinned README còn tự mâu thuẫn về Blueprint Interface: phần đầu hứa sinh override `_Implementation`, nhưng milestone M34 ở phần sau nói promise này chưa được hiện thực. Interface được classify `partial/unsupported` cho tới khi real interface asset compile **và** differential runtime fixture pass.

Golden tests hiện là hand-built POD fixtures, không dùng real `.uasset`; vì vậy chúng chưa chứng minh reflection extraction, K2 graph thật, generated module compilation, reparenting, cook/package hoặc gameplay parity.

## 6. Semantic risk quan trọng

### 6.1. Fail-open default

Offline translation và Tolerance Mode đang bật mặc định. Khi translator emit được một body, fallback `_Deprecated()` có thể bị suppress dù body vẫn có TODO. Production profile phải fail-closed.

### 6.2. Shared state sai semantics

`DoOnce`, `FlipFlop` và `MultiGate` có path lower thành function-local `static`. Blueprint node state thường thuộc từng object/node; `static` C++ chia state cho mọi instance. Code compile nhưng parity sai.

### 6.3. Latent lifetime

`RetriggerableDelay` dùng local timer handle và lambda raw `this`; cancellation, retrigger và object lifetime cần thiết kế member/weak binding riêng.

### 6.4. Dual Function Pattern chưa được nối tự động

Tool có thể tạo declaration `_Deprecated`, nhưng không tự rename graph/reparent/cutover. Nếu tưởng bridge đã tồn tại, cả old/new path có thể không chạy hoặc cùng chạy sai.

### 6.5. Dependency closure không phải product closure

Resolver bắt đầu từ asset người dùng chọn, mặc định `/Game`, dựa package-level Asset Registry và chỉ inspect first asset/package ở một số path. Nó không bao phủ config/string/dynamic load, plugin content hoặc shipping roots đầy đủ.

### 6.6. Output overwrite

Writer có thể overwrite `.h/.cpp` cùng tên và chỉ giữ một `.bak`. Vì vậy output production bắt buộc đi staging immutable, không trỏ canonical `Source/`.

## 7. Tool Qualification Gate `TQ0`

Trước `TQ0` chỉ được làm fixture/translator research trong qualification host, không chạm gameplay candidate. Sau `TQ0` mới chạy representative KYWorld pilot của P4. Chỉ sau khi cả TQ0 và P4 pass mới mở general gameplay conversion/cutover.

1. Fork/pin exact BPScaffold + NodeToCode commit; không dùng floating `main`.
2. Sửa clean-build blocker; clean UHT/UBT exact UE 5.6.1 pass.
3. Toàn bộ old + new test chạy bằng pinned automated runner; tối thiểu suite hiện tại 28/28, build/test log và result digest được lưu trong qualification certificate. Local click-run không đủ.
4. Thêm real `.uasset` fixtures: Actor, Component, Widget, AnimBP EventGraph/AnimGraph, Interface, RPC/RepNotify, GameplayAbility, Timeline/async/macro, UserDefinedStruct, UserDefinedEnum, DataTable và Level BP.
5. Mỗi fixture export hai lần phải byte-identical; generated module compile; Blueprint/DataValidation/MapCheck/cook/package pass.
6. Mỗi export ghi package hash; mọi BP/graph GUID/hash/node count; property/default, SCS component, UMG binding, AnimGraph và dependency surface; engine/tool/settings commit. Stale input bị reject.
7. Thêm headless commandlet/wrapper theo feature roots; xuất per-surface machine-readable `recognized/partial/unsupported` và zero-silent-omission manifest cho mọi graph, property/default, SCS component, binding, dependency và AnimGraph—not chỉ K2 node.
8. Output vào staging only; production source không được overwrite.
9. Hai profile không được trộn:

   **Production extraction profile** — lấy graph/scaffold/LLM bundle, không tin offline lowering:

   ```text
   Tolerance=false
   AutoGenerate=false
   OfflineTranslation=false
   LLMBundle=true
   activatable unit requires TODO=0
   ```

   **Isolated translator-qualification profile** — chỉ chạy real semantic fixtures trong qualification host; output không được đưa thẳng vào game:

   ```text
   Tolerance=false
   AutoGenerate=false
   OfflineTranslation=true
   LLMBundle=true
   StagingOnly=true
   ProductionAdoptionAllowed=false
   ```

   Mỗi profile có stable `profile_id` + settings digest trong toolchain lock, TQ0 qualification certificate, export manifest và task packet. Pattern nào fail compile/runtime/differential test bị tự động hạ `partial/unsupported` trong production capability manifest.

10. So closure của tool với closed-world Asset Registry/config/dynamic-load inventory V5; `Dependencies.md` không phải completion certificate.

11. Differential runtime fixtures bắt buộc so Blueprint với native output trên cùng world/setup:

    - nhiều instance độc lập cho `DoOnce`, `FlipFlop`, `MultiGate` và reset;
    - `RetriggerableDelay` retrigger/cancel/destroy-owner và stale callback;
    - dual-function bridge/cutover bảo đảm chính xác một authoritative path;
    - state, ordering và timing trace phải khớp, không chỉ compile.

    Node/surface pattern nào chưa pass fixture phải bị hạ thành `partial/unsupported`; không được gắn dấu supported nhờ golden text test.

`TQ0` chỉ chứng minh tool có thể tạo draft không âm thầm sai trên corpus fixture. Nó **không phải P4**. Gate P4 còn phải dùng một representative KYWorld feature để chứng minh toàn pipeline characterize→target→staging→cutover→A/B→rollback. Gameplay implementation chỉ được mở khi cả `TQ0` và `P4` pass.

## 8. Pipeline per feature

```text
Feature Dossier + gold human rehearsal
→ target owner/contract approved
→ export/scaffold to staging
→ classify recognized/partial/unsupported
→ rewrite/refactor into approved V5 module
→ compile/static/contract gates
→ native dormant
→ optional shadow state diff
→ one capability switch
→ automated + human A/B
→ rollback drill
→ retire legacy C/D owner
```

Converter output đưa unit tới `GENERATED_STAGING` hoặc nhiều nhất `NATIVE_DORMANT`. Nó không đưa unit tới `VERIFIED`.

## 9. Provenance trailer

Mỗi generated/adopted unit ghi:

```text
Generated-From-Package: <object path + package hash>
Generated-From-Graph: <name + GUID + node count>
Source-Surface-Manifest: <path + digest; graphs/defaults/SCS/bindings/dependencies>
Converter: Soliz-Blueprint-C@<commit>
NodeToCode: <version/commit>
Engine: 5.6.1-<P1_APPROVED_CHANGELIST>
Profile-ID: <production_extraction_v1>
Settings-Digest: <hash>
Translator-Status: recognized | partial | unsupported
Translator-Manifest: <path + digest + per-surface records>
Reviewed-Into: <native target symbol>
Behavior-Rows: <IDs>
```

Generated code không mang provenance hoặc còn TODO/unsupported silent omission không được cutover.

## 10. Quyết định

Tool không làm conversion “khó”; nó làm transcription nhanh hơn. Nhưng guarantee 100% đến từ Feature Dossier, owner contract, closed-world ledger, one-path cutover và human gate.

Khuyến nghị chốt:

- qualify/fork tool trong W0/W1;
- chỉ dùng sau one-way upgrade project lên 5.6.1;
- dùng extractor/scaffold/LLM bundle làm draft;
- không merge output thẳng;
- không dùng tool dependency report làm scope denominator;
- không cho một translator optimization thay đổi target behavior đã duyệt.
