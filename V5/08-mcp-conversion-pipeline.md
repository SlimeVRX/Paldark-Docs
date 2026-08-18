---
title: V5.8 — MCP + Blueprint conversion pipeline
description: Quy trình UE 5.8.1 kết hợp Epic MCP, BPScaffold, NodeToCode và LLM với graph closure, provenance, staging và parity gate.
---

# V5.8 — MCP + Blueprint conversion pipeline

> **Trạng thái:** `UE5.8 BUILD PASS — TOOL TESTS PASS — SCHEMA V2 / PILOT V3 DETERMINISTIC — CONVERSION_READY FALSE — NATIVE PILOT DORMANT / PARITY PARTIAL — TQ0 NOT PASSED — P4 NOT PASSED`
>
> **Target duy nhất:** Unreal Engine **5.8.1**, build `++UE5+Release-5.8`, changelist `56057345`.
>
> Pilot `BP_PlayerCharacter` v3 đã giữ 11 surface, 169 node, 604 pin, 65 execution edge và 145 data edge qua hai Editor process độc lập. Tool vẫn trả đúng `ok=false`, `conversion_ready=false`, `graph_coverage_complete=false` vì còn 59 partial nodes và mọi non-topology dimension chưa đóng. Native pilot vẫn dormant và **chưa** chứng minh gameplay parity; bulk conversion/cutover tiếp tục bị khóa.

Tài liệu này là hợp đồng vận hành giữa Epic MCP, bridge `SolizBlueprintCMCP`, `BPScaffold`, `NodeToCode`, LLM, Unreal build/test và người kiểm thử. Mục tiêu không phải “xuất được code”, mà là giữ đủ bằng chứng để một implementation C++ mới có thể bị bác bỏ khi khác KYWorld.

## 1. Kết luận pilot

Asset được pin:

```text
Object:  /Game/Blueprint/Character/Player/BP_PlayerCharacter.BP_PlayerCharacter
Package: /Game/Blueprint/Character/Player/BP_PlayerCharacter
Size:    565,996 bytes
MD5:     8596606bf1ce0861c885097e927e23ed
Parent:  APlayerCharacter
Engine:  5.8.1-56057345+++UE5+Release-5.8
Tool:    Soliz-Blueprint-C@6b380a7d407a9a5ffde3050f6dda0e9bfa01abfc
Profile: paldarkv5_mcp_extraction_v1
Settings MD5: feeaa5f068da24d61a2b4fe424126d3c
```

Kết quả sau khi sửa recursive graph inventory:

| Đại lượng | Kết quả | Ý nghĩa |
|---|---:|---|
| Graph surface được Epic nhìn thấy | 11 | 8 top-level + 3 owned nested/collapsed graph |
| Graph surface đủ điều kiện | 11 | Không có surface bị bỏ qua im lặng |
| Graph surface được serialize | 11 | `graphs_translated = surfaces_eligible` |
| Raw node | 169 | Mọi `UEdGraphNode` đang lưu trong 11 graph |
| K2 node | 169 | Trong pilot, mọi raw node đều là `UK2Node` |
| Routing knot | 5 | `UK2Node_Knot`, không mang operation riêng |
| Semantic candidate | 164 | `169 − 5` |
| Semantic node trong `Graph.json` | 164 | Mọi candidate có mặt |
| Source/serialized pins | 604 / 604 | Gồm unconnected, hidden, orphaned và default-only pin |
| Source/serialized execution edges | 65 / 65 | Pin-level authority |
| Source/serialized data edges | 145 / 145 | Mọi fan-out target được giữ |
| Extractor errors | 0 | Không có hard extraction error |
| Extractor warnings | 74 | Warning/disposition vẫn phải xử lý; không phải pass |

Node/surface census trên vẫn đúng. Tuy nhiên một graph không chỉ là tập node. Independent source/MCP edge audit tìm thấy:

| Data-edge view | Edges | Disposition |
|---|---:|---|
| Source/MCP directed data links | 145 | Denominator |
| `Graph.json` cũ, `flows.data` dạng `TMap<source,target>` | 129 | Mất fan-out |
| Directed targets bị mất | **16** | Coverage failure |

Một output data pin có thể nối nhiều input pin. `TMap<FString,FString>` chỉ giữ một value cho mỗi source key, nên target sau ghi đè/không thể cùng tồn tại với target trước. `129` không phải một cách nén tương đương `145`; nó làm LLM nhìn thiếu consumer và có thể sinh logic khác dù node count vẫn đúng.

Invariant của pilot:

```text
surfaces_discovered = surfaces_eligible = surfaces_serialized = 11
raw_nodes = k2_nodes = 169
k2_nodes = semantic_nodes + explicitly_suppressed_knots
169 = 164 + 5
unknown_surface_disposition = 0

target_v2:
source_execution_edge_ids = serialized_execution_edge_ids
source_data_edge_ids = serialized_data_edge_ids
missing_edges = unexpected_edges = 0
pins = 604 / 604
execution_edges = 65 / 65
data_edges = 145 / 145

still_failed:
partial_processor_nodes = 59
conversion_ready = false
graph_coverage_complete = false
```

V3 đã pass các invariant cardinality/edge reconciliation ở trên nhưng cố ý fail-closed vì processor và non-topology closure chưa đạt. Receipt v1 từng ghi `graph_coverage_complete: true` chỉ chứng minh surface/node closure và đã bị invalidated cho mục đích TQ0/P4; receipt v3 nói thật hơn dù topology inventory tốt hơn.

Tên `UpdateEnergeTimer` giữ nguyên chính tả của source asset. Không được “sửa đẹp” identifier trong lớp evidence vì sẽ làm mất traceability.

## 2. Vì sao trước đây Epic thấy 11 nhưng NodeToCode chỉ xuất 8

### 2.1. Hai bên duyệt graph theo hai closure khác nhau

Epic `BlueprintTools.list_graphs` đi qua `UBlueprintEditorLibrary::ListGraphs`, rồi `UBlueprint::GetAllGraphs`. `GetAllGraphs` duyệt cả graph cấp cao lẫn graph con thuộc node composite. Vì vậy Epic trả về:

```text
8 top-level
  EventGraph
  UserConstructionScript
  LevelUp
  CostStamina
  AddExp
  UpdateWidget
  UpdateState
  SetLevelData

3 owned nested
  UpdateHpTimer
  UpdateStaminaTimer
  UpdateEnergeTimer
```

Pipeline cũ của BPScaffold chỉ gom `UbergraphPages`, `FunctionGraphs` và `MacroGraphs`. NodeToCode biết một `UK2Node_Composite` có `BoundGraph`, nhưng `TranslationDepth = 0` làm ba graph con bị bỏ qua. Log pilot cũ ghi rõ cả ba lần skip. Vì vậy `graphs_translated = 8` chỉ là số graph đi qua loop cũ, không phải chứng chỉ closure.

### 2.2. Vì sao không chỉ đổi `TranslationDepth = 1`

Một composite graph **thuộc** Blueprint khác với một graph chỉ được **tham chiếu** bởi call/function node. Nếu dùng chung một depth queue, tool có thể kéo nhầm graph được gọi, duplicate graph, hoặc tạo closure không giới hạn.

Sửa đúng tách hai policy:

- `OwnedNestedDepth`: graph có outer chain quay về graph/node composite của chính Blueprint;
- `ReferencedGraphDepth`: graph được gọi hoặc tham chiếu nhưng không thuộc surface hiện tại;
- stable graph identity: GUID trước, object path/hash làm fallback;
- parent edge: `owned_nested`, `referenced`, `delegate`, `interface` hoặc `extension`;
- disposition bắt buộc cho mọi surface: `translated`, `policy_omitted` hoặc `failed` kèm lý do.

Bundle pilot dùng inventory recursive để liệt kê 11 surface, rồi translate từng owned surface đúng một lần. Referenced graph expansion vẫn đóng mặc định.

## 3. Vì sao `AnalyzeAsset = 123` nhưng `Graph.json = 118`

Hai con số cùng nói về 8 graph cấp cao, nhưng không cùng định nghĩa node:

| Khái niệm | Định nghĩa | Pilot cũ |
|---|---|---:|
| Raw node | Mọi `UEdGraphNode` trong `Graph->Nodes` | 123 |
| K2 node | Raw node kế thừa `UK2Node` | 123 |
| Routing knot | `UK2Node_Knot`, chỉ đổi hình học dây nối | 5 |
| Semantic node | Operation/data/control node được serialize | 118 |

Năm node thiếu đều nằm trong `UpdateState`:

```text
UpdateState raw = 22
UpdateState knot = 5
UpdateState semantic = 17

Top-level raw = 123
Top-level semantic = 123 − 5 = 118
```

NodeToCode cố ý không tạo operation giả cho reroute node. Đây chỉ là hành vi đúng khi `SurfaceManifest.json` ghi từng knot bằng GUID/path/class/reason và serializer bảo toàn connectivity qua knot. Nếu chỉ im lặng bỏ node, `118` là coverage gap; nếu có disposition và link normalization, `118` là representation khác của cùng semantics.

Ba nested timer có thêm `14 + 14 + 18 = 46` raw/semantic node. Sau fix:

```text
Full raw      = 123 + 46 = 169
Full semantic = 118 + 46 = 164
```

Không được so `AnalyzeAsset.raw_nodes` với `Graph.json.semantic_nodes` mà thiếu `suppressed_nodes`. Contract chung là:

```text
K2 = SerializedSemantic + ExplicitlySuppressed + Failed
```

`Failed` phải bằng 0 trước khi bundle được gắn `graph_coverage_complete: true`.

## 4. Vai trò không được trộn

| Thành phần | Có quyền làm gì | Không có quyền kết luận gì |
|---|---|---|
| Epic MCP Blueprint/Asset/Actor tools | Quan sát live UObject, recursive graph list, CDO/default, component/root, dependency/referencer, dirty state | Không thiết kế owner C++, không chứng minh behavior parity |
| `SolizBlueprintCMCP` | Nối MCP với converter; status, analyze, dependency report, safe graph inspection, immutable review-bundle export, receipt | Không sửa gameplay asset/source, không tự cutover |
| BPScaffold | Reflection inventory, property/function/component scaffold, bundle assembly, prompt và provenance | Scaffold không phải production architecture hoặc compilable truth |
| NodeToCode | Chuẩn hóa graph/node/pin/link thành semantic IR; giữ fan-out, pin-level branch identity, reflected type/default/provenance và processor disposition | Không đoán gameplay intent, không quyết định state owner |
| LLM | Đọc toàn bộ bundle, giải thích behavior, đối chiếu parent API, đề xuất seam/native code, lập unknown ledger | Không được bịa node/default, không tự gắn `VERIFIED` |
| UBT/UHT/Automation/cook | Chứng minh code và asset hợp lệ ở build/runtime scope đã pin | Compile pass không chứng minh state/timing/presentation parity |
| Human A/B | Quan sát polish, timing, feedback và failure path so với gold | Không thay thế machine closure, hash hoặc state trace |

MCP là kính hiển vi live; BPScaffold là người đóng gói hồ sơ; NodeToCode là máy lập IR; LLM là người phân tích/thiết kế; test và human gate là trọng tài. Gộp các vai trò này thành một nút “Convert” sẽ làm mất điểm dừng để phát hiện sai.

## 5. Tool call contract

### 5.1. Epic MCP trực tiếp

Một inspection packet tối thiểu dùng:

- `AssetTools.find_assets`: tìm đúng object path/class;
- `AssetTools.get_dependencies` và `get_referencers`: package graph hai chiều;
- `AssetTools.is_dirty`: cấm export từ state chưa save;
- `BlueprintTools.list_graphs`: independent recursive surface oracle;
- `BlueprintTools.read_graph_dsl`: đọc graph top-level khi wrapper hợp lệ;
- `BlueprintTools.get_default_object`: CDO/default;
- `ActorTools.get_components`, `get_root_component`, `get_parent_class`: component hierarchy và native inheritance.

Official `read_graph_dsl` UE 5.8.1 không đọc được owned nested graph khi nó cast immediate outer `K2Node_Composite` thành `Blueprint`. Outer chain thật là:

```text
child UEdGraph
→ UK2Node_Composite
→ parent UEdGraph
→ UBlueprint
```

Bridge không sửa Engine install. `ReadGraphSafe` resolve graph từ owning Blueprint, kiểm package hash/dirty state, rồi serialize node/pin/default/link trực tiếp theo graph GUID.

### 5.2. Bridge `SolizBlueprintCMCP`

Sáu operation thuộc toolset:

1. `GetConverterStatus` — engine/plugin/schema/profile capability;
2. `AnalyzeAsset` — property/function/component/top-level raw census;
3. `GetDependencyReport` — dependency closure có giới hạn;
4. `ExportReviewBundle` — staging-only export + receipt;
5. `InspectGraphSurface` — recursive surface inventory độc lập;
6. `ReadGraphSafe` — graph GUID read, stale/dirty rejection và node-level provenance.

Mọi batch runner phải lưu request arguments, ordered response digest, error list và editor log span. “MCP đã chạy” không đủ để audit.

### 5.3. BPScaffold + NodeToCode

Pipeline nội bộ chuẩn:

```text
UBlueprint::GetAllGraphs
→ Build SurfaceInventory
→ assign stable surface IDs + parent edges
→ collect raw/K2/knot counts
→ collect normalized source execution/data edge identities
→ translate each eligible owned surface once
→ serialize stable node/pin IDs + provenance + authoritative edge arrays
→ strict serialize→parse round-trip
→ reconcile edge identity/digest and processor disposition
→ write Graph.json
→ write SurfaceManifest.json v2
→ write Prompt.md + CodeGen_CPP.md
→ hash artifacts
→ emit MCP receipt
```

`SurfaceManifest.json` là denominator; `Graph.json` là semantic payload. Một file không thay thế file kia.

### 5.4. Edge, pin và round-trip contract

#### Authoritative edge arrays

```text
flows.data_edges[]       = directed output-pin → input-pin data edges
flows.execution_edges[]  = directed exec-output-pin → exec-input-pin edges
```

- `data_edges` là lossless authority; legacy `flows.data` object chỉ là one-target compatibility view.
- `execution_edges` là pin-level authority. Legacy `flows.execution` node pair không phân biệt được `True/False`, từng output của `Sequence`, hoặc từng case/default của `Switch`.
- Mỗi edge được canonicalize bằng stable source node GUID/path + source pin GUID/index → target node GUID/path + target pin GUID/index, sort rồi hash.
- Count match là cần nhưng chưa đủ: hai graph đều có 145 edge vẫn có thể nối sai pin. Gate yêu cầu count bằng, edge digest bằng, `missing_*` rỗng và `unexpected_*` rỗng trên từng surface.

Short ID như `N3.P2` chỉ hợp lệ trong một serialization. Reconciliation phải dùng provenance:

- `source_node_guid`, `source_node_path`, `source_node_class`;
- `source_pin_guid` cho từng input/output pin;
- exact subtype object path, không chỉ display subtype;
- map key category/subtype và `map_value_category`, `map_value_sub_category`, `map_value_sub_type_path` cho value terminal;
- `hidden`, `orphaned`, `not_connectable`, reference/const/container flags và default value.

Hidden pin không có nghĩa là vô nghĩa; nó có thể giữ implicit target, world context, enum/default hoặc compiler-facing semantics. Map cũng không thể được mô tả chỉ bằng cờ `is_map`, vì key/value là hai terminal type khác nhau.

#### Root cause của nondeterministic pin identity

V2 lần đầu còn có năm hidden `ErrorTolerance` pin của `K2Node_PromotableOperator` được reconstruct khi load. Runtime `PinId` của chúng đổi giữa Editor process, nên edge/prompt/manifest hash đổi dù package không đổi.

Stable identity policy hiện tại:

```text
node = NodeGuid, fallback object-path MD5
pin  = PersistentGuid khi valid,
       fallback stable-node-id + original source pin index
```

Không dùng runtime `PinId` làm cross-process identity. Source pin index phải tính trên ordered pin array gốc, gồm cả hidden pin; nếu lọc pin trước khi đánh index thì fallback lại nondeterministic theo representation. Automation đã thêm regression test cho reconstructed pin case này.

#### Strict serializer round-trip

Test tối thiểu là `FN2CBlueprint → JSON → FN2CBlueprint` và phải giữ nguyên:

- every data fan-out target;
- source pin của từng Branch/Sequence/Switch execution path;
- Exec pin `type` thay vì suy đoán do field bị thiếu;
- graphs, structs và enums; destination arrays phải clear để không giữ stale state;
- enum `name`, display name, hidden metadata và **exact numeric value**.

Enum numeric value không được suy bằng array index: UE enum có thể gap, alias hoặc explicit value. JSON number dùng floating representation không bảo đảm mọi `int64`, nên schema ghi thêm canonical `value_int64` string và parser ưu tiên field này.

#### Processor disposition

Mỗi semantic node phải có một trong các disposition:

| Disposition | Ý nghĩa | Được coi extraction-complete? |
|---|---|---|
| `processor_success` | Registered processor đọc node thành công | Có |
| `structural_inventory_covered` | Composite/tunnel semantics nằm trong owned graph boundary + pin/edge ledger | Có, cho extraction |
| `fallback_processor_failed` | Có processor nhưng xử lý thất bại; chỉ fallback metadata | Không |
| `fallback_no_processor` | Không có processor; chỉ fallback metadata | Không |

Manifest v2 liệt kê stable `partial_nodes`; chỉ `processor_success` và `structural_inventory_covered` được loại khỏi danh sách. `all_nodes_processor_complete` phải true trước S4. Điều này không có nghĩa code generation tự động đúng; nó chỉ nói semantic IR không âm thầm dùng fallback.

Fresh v3 disposition rollup trên 164 semantic nodes:

| Disposition trong `Graph.json` | Nodes | Complete? |
|---|---:|---|
| `processor_success` | 105 | Có |
| `fallback_no_processor` | 28 | Không |
| `fallback_processor_failed` | 21 | Không |
| `fallback_structural_port_mapping_missing` | 9 | Không |
| `fallback_processor_rejected_runtime_class` | 1 | Không |
| **Partial tổng** | **59** | **Không** |

Tất cả 11 surface vì vậy mang `translated_with_coverage_mismatch`. `extractor_errors=0` chỉ nói không có hard error; 74 warnings và 59 partial node là evidence bắt buộc phải được giải quyết/classify, không được xóa bằng cách đổi `ok` sang true.

### 5.5. Call ledger của lần pilot đầu

Lần inspection đầu dispatch **34 MCP call**. Đây là ledger của run đó, không phải con số bắt buộc cho mọi asset:

| Tool family | Operation | Calls | Kết quả liên quan |
|---|---|---:|---|
| `SolizBlueprintCMCP` | `GetConverterStatus` | 1 | Xác nhận bridge/plugin/profile |
| `SolizBlueprintCMCP` | `AnalyzeAsset` | 1 | 13 variables, 13 functions, 6 components; 8 top-level graph/123 raw node |
| `SolizBlueprintCMCP` | `GetDependencyReport` | 1 | Depth 2: 46 nodes, 2 reported cycles |
| `SolizBlueprintCMCP` | `ExportReviewBundle` | 1 | Bundle cũ 8 graph/118 semantic node |
| `AssetTools` | `find_assets` | 6 | Asset/corpus discovery |
| `AssetTools` | `get_dependencies` | 1 | 26 direct dependencies qua independent query |
| `AssetTools` | `get_referencers` | 1 | 111 referencers qua independent query |
| `AssetTools` | `is_dirty` | 1 | Export safety check |
| `BlueprintTools` | `list_graphs` | 1 | Independent oracle trả 11 graph |
| `BlueprintTools` | `read_graph_dsl` | 14 | 8 non-error, 6 nested-graph cast errors |
| `BlueprintTools` | `get_default_object` | 1 | CDO/default evidence |
| `ActorTools` | `get_components` | 1 | Component inventory |
| `ActorTools` | `get_root_component` | 1 | Root thật là `CollisionCylinder` |
| `ActorTools` | `get_parent_class` | 3 | Native inheritance checks |

Log không giữ arguments của mọi retry, nên không được khẳng định chắc từng timer đã bị gọi đúng hai lần; đó chỉ là inference từ 6 lỗi cho 3 nested graph. Evidence chắc chắn là 14 dispatch, 8 non-error và 6 cùng failure class.

NodeToCode không phải một MCP tool được dispatch 118 lần. Nó là pipeline nội bộ chạy trong `ExportReviewBundle`. Path cũ là:

```text
GatherTopLevelGraphs
→ CollectNodes
→ GenerateN2CStruct
→ MergeBlueprint
→ N2CSerializer
```

Path cũ collector đã nhìn thấy 123 raw node; translator chủ động suppress 5 `UK2Node_Knot`; top-level gather/depth policy mới là nguyên nhân mất ba timer graph. Sau fix, `GraphInventory` đứng trước collector, enumerate recursive surfaces, ghi disposition, rồi mỗi eligible owned surface đi qua translator/serializer đúng một lần.

`InspectGraphSurface` và `ReadGraphSafe` là hai operation bổ sung sau root-cause analysis; chúng không được cộng ngược vào ledger 34-call cũ.

## 6. Bằng chứng fresh v3 và archive schema cũ

### 6.1. Freshness của build/test

| Scope | Kết quả fresh | Evidence |
|---|---:|---|
| UE5.8.1 CL `56057345` full project build sau deterministic-pin patch | **PASS** | Current source revision |
| BPScaffold automation | **43/43 PASS** | `PaldarkV5/Saved/Logs/BPScaffoldFull-v5-stable-pin.log` |
| ConversionPilot focused automation | **3/3 PASS** | `PaldarkV5/Saved/Logs/ConversionPilot-v3.log` |

Fixture rename collision quan sát ở run trước đã được sửa và rerun trong evidence trên. Các test này chứng minh buildability cùng những invariant tool/pure pilot được cover; chúng không chứng minh cook/package, real gameplay differential, human parity, TQ0 hoặc P4.

### 6.2. Hash archive của schema cũ

Hai export `recursive-a` và `recursive-b` trước edge audit cho nội dung giống byte. Đây vẫn là evidence rằng **schema cũ** deterministic, nhưng không còn là proof graph-complete vì cả hai cùng lặp lại lỗi `TMap` 129/145.

MD5 archive của bundle **pre-edge-schema**:

| Artifact | MD5 A | MD5 B | Kết luận |
|---|---|---|---|
| `Graph.json` | `c0b59b08c322bc171e5f00cad72b2415` | cùng hash | **Superseded:** deterministic nhưng mất 16 data edge |
| `SurfaceManifest.json` | `d223347c6b58336aee64a01d2b0dd5d3` | cùng hash | **Superseded:** v1 không gate edge/disposition |
| `Prompt.md` | `e8166c85e5073fbcf1b2823aab7dce95` | cùng hash | **Superseded** cùng Graph v1 |
| `CodeGen_CPP.md` | `4bf2538729ef4477c208683fcaf1bcd8` | cùng hash | **Superseded** instruction trước edge authority |

Đối chiếu SHA-256 độc lập trên disk, cũng thuộc bundle pre-edge-schema:

| Artifact | SHA-256 |
|---|---|
| `Graph.json` | `101793834cab54d8dd3799642e57801aafd7082ef720e0b8f7b66c14a6569a43` |
| `SurfaceManifest.json` | `d7afab070b514484a4c0aae9a7d0027aeed0f3f37a019f2513799c8902e1ab95` |
| `Prompt.md` | `ca6fb85bc935e0889130407efa22a02a148e8caae8c2a8c8ecf6591b1fc17e6f` |
| `CodeGen_CPP.md` | `95600849410f0de9cd83383c73578c26c52cd2e491c0772ffb4b91ff9cb8fbbc` |

Receipt A/B khác nhau vì chứa export time, label và output path. Đó là provenance envelope dự kiến thay đổi; determinism claim chỉ áp dụng các artifact liệt kê ở trên.

### 6.3. Fresh-process A/B schema v2

Hai run dùng hai Editor process mới, không tái dùng in-memory Blueprint/tool singleton:

```text
bp-player-character-v3-a-20260819
bp-player-character-v3-b-20260819
```

Source package ở cả hai run là clean, MD5 `8596606bf1ce0861c885097e927e23ed`. Tất cả **7 non-receipt artifacts** byte-identical:

| Artifact | SHA-256 A = B | Receipt MD5 A = B |
|---|---|---|
| `BP_PlayerCharacter.cpp` | `462a5368c13c9851f71e4190b944307880df8c547d244fa81b90b1d75f6242e1` | — |
| `BP_PlayerCharacter.h` | `64e589f79f80734487d3499644de8ea6167ebe0fcfee4343c8494eaad32caed2` | — |
| `BuildCs_Hint.txt` | `1018bca73490b1dc640bc12d4db9ff9324c54500e56a27046d1553190386633a` | — |
| `CodeGen_CPP.md` | `85f79013ccf97541240fa4370e52eb53033ae33856f4e18cbb952661f8604bb0` | `15a1a2bbf53a6f3bdeaae9f6468eeb78` |
| `Graph.json` | `fe58321d87ee68f45a0a8c6ec5596fd42269c514d0014581929c78d7acfe13d3` | `8d469a24ccd96b3966f7041ca4457fbd` |
| `Prompt.md` | `2a45f0c7e3056aa126e3041842f294f5d25617e83c7dd17cae6073c36f7e1d7a` | `ca468ec1d4f9d795b1789cd2610e41d1` |
| `SurfaceManifest.json` v2 | `50f583ae656828eedeee8c2f8a5e1dbf283b4ab86b849ac8659155a64f81132d` | `dec983560c4c6cc0b3a0b5147e7eec93` |

Receipt không nằm trong nhóm 7 vì export UTC, run label và output path phải khác. Determinism claim đúng scope: cùng clean package/tool/settings tạo cùng analysis artifacts qua fresh processes.

### 6.4. Fail-closed receipt là kết quả đúng

Fresh v3 không biến extraction success thành conversion success:

| Field/dimension | Giá trị |
|---|---:|
| `analysis_export_ok` | `true` |
| `extractor_errors` / `extractor_warnings` | `0 / 74` |
| `ok` / `llm_bundle_ok` | `false / false` |
| `conversion_ready` / `graph_coverage_complete` | `false / false` |
| `graph_topology_complete` | `false` |
| `member_identity_complete` | `false` |
| `class_defaults_complete` | `false` |
| `component_hierarchy_complete` | `false` |
| `related_type_coverage_complete` | `false` |
| `referenced_graph_coverage_complete` | `false` |
| `native_compile_complete` / `scaffold_compile_checked` | `false / false` |
| `conversion_complete` / `cutover_ready` | `false / false` |

`graph_topology_complete=false` dù counts/digests khớp vì stricter graph gate còn 59 partial node/port dispositions; không được đổi tên cardinality pass thành coverage pass. `native_compile_complete=false` trong receipt cũng không mâu thuẫn project build PASS: receipt chưa compile/certify generated scaffold như native conversion output.

## 7. Quy trình 12 trạng thái cho mỗi conversion unit

`BLOCKED` là overlay có Question ID, không phải lối tắt. `HAND_WRITTEN` là route thay cho generated draft, không thay state.

| State | Tên | Exit evidence |
|---:|---|---|
| S0 | `DISCOVERED` | Asset/capability có stable ID và nằm trong closed corpus |
| S1 | `CHARACTERIZED` | Dossier, graph/default/component/dependency inventory và gold observations |
| S2 | `TARGET_APPROVED` | Behavior target, state owner, contract, retained A/B/DCL surface được duyệt |
| S3 | `GATE_REHEARSED` | Human card chạy được trên gold; failure/cancel path tái tạo được |
| S4 | `EXTRACTED_CLOSED` | Bundle deterministic; mọi surface/node/processor/edge có disposition; authoritative edge counts + identity digests match; strict round-trip; stale input reject |
| S5 | `LLM_REVIEWED` | LLM đọc toàn bundle; behavior map, unknown ledger và design proposal có citation |
| S6 | `GENERATED_STAGING` | Draft chỉ ở staging; `recognized/partial/unsupported` đầy đủ; không `_C.h`/root guess |
| S7 | `NATIVE_COMPILED` | Reviewed C++ pass UHT/UBT/static/automation trên exact UE 5.8.1 |
| S8 | `NATIVE_DORMANT` | Native path tồn tại nhưng không mutate production state; old path vẫn authority |
| S9 | `SHADOW_VERIFIED` | Read-only state/event/timing diff đạt tolerance; zero duplicate mutation |
| S10 | `AUTHORITATIVE_SWITCHED` | Một capability switch; new path authority; rollback drill pass |
| S11 | `PARITY_EVIDENCED` | Automated + human A/B pass, references healthy, legacy C/D owner retired |

Không được nhảy S4→S7 bằng cách coi generated source là reviewed source. Không được nhảy S8→S11 chỉ vì Editor boot hoặc function name đủ 100%.

## 8. Một packet hoàn chỉnh

### Phase A — Characterize trước khi viết code

1. Pin reference commit/build/package hash và xác nhận asset không dirty.
2. Tạo capability/behavior IDs, current owner, inputs, state mutation, outputs, failure/cancel path.
3. MCP inventory graph, variables, functions, components, CDO/default, deps/referrers.
4. Human chạy gold card; ghi first observable, ordering, timing, UI/audio/VFX và reset recipe.
5. Duyệt target owner/contract. Chưa duyệt thì dừng ở S1.

### Phase B — Extract và hiểu

6. `InspectGraphSurface` lấy independent surface census.
7. `ExportReviewBundle` vào immutable `Saved/BPScaffold/.../<run-label>`; cấm `Source/`/`Content/` write.
8. So Epic/source census với manifest: surface/node **và edge identity**, not just counts; partial processor node phải bằng 0.
9. Strict round-trip bundle, export lần hai và so hash artifact; mismatch phải điều tra trước LLM.
10. LLM đọc `Prompt.md`, `Graph.json`, `SurfaceManifest`, parent C++ API và related assets; sinh behavior map + unknown ledger trước source draft.

### Phase C — Thiết kế và implementation

11. Chọn `Adopt`, `Adapt`, `Keep`, `Replace` hoặc `Reject` cho từng surface/capability.
12. Tách authoritative domain state khỏi presentation/asset authoring; giữ object path trong parity phase.
13. Viết/review C++ trong allowlisted write-set. Generated scaffold chỉ là gợi ý.
14. Compile và chạy focused tests; phân loại mọi TODO thành blocker/partial/accepted retained surface.
15. Đưa native path vào dormant rồi shadow; không cho hai path cùng commit mutation.

### Phase D — Chứng minh và retire

16. Switch đúng một capability, chạy rollback drill.
17. Automated state/order/timing/reference tests trên gold và candidate.
18. Human A/B cùng setup, input, camera, frame cap và checkpoint.
19. Chỉ sau parity evidence mới retire executable Blueprint C/D owner.
20. Cập nhật corpus ledger, certificate, docs và hash; thay đổi source/content làm evidence cũ stale.

## 9. Prompt contract cho LLM

LLM phải trả kết quả theo thứ tự:

1. **Evidence index:** asset/package hash, surface/node totals và artifact digests.
2. **Behavior model:** trigger → guard → read → mutation → output → presentation → failure.
3. **Ownership map:** current owner, proposed native owner, retained asset/presentation.
4. **Unknown ledger:** fact chưa chứng minh, cách đo, owner và state bị block.
5. **Translation ledger:** từng function/graph là `recognized`, `partial`, `unsupported` hoặc `retained`.
6. **Native design:** contract, data model, lifecycle, transaction, thread/network/persistence assumptions.
7. **Implementation draft:** chỉ sau sáu phần trên; cite surface/node GUID ở logic quan trọng.
8. **Proof plan:** unit/functional/runtime/human/rollback tests.

LLM phải ưu tiên `SurfaceManifest.json` + `Graph.json` + actual parent API hơn scaffold. Cấm:

- include Blueprint generated class header kiểu `*_C.h`;
- gọi mọi SCS component là root;
- redeclare engine-generated wrapper mà không chứng minh cần thiết;
- biến reroute knot thành gameplay operation;
- đọc legacy `flows.data`/`flows.execution` như authority khi edge arrays tồn tại;
- hạ Branch/Sequence/Switch từ node-only edge làm mất source output pin;
- coi count edge bằng nhau là topology bằng nhau khi digest/missing/unexpected chưa match;
- bỏ hidden pin, map value terminal hoặc enum numeric value;
- suy default/asset path từ tên;
- đổi spelling source trong evidence layer;
- kết luận “100% converted” từ số variable/function đã sinh.

## 10. Gate trước bulk conversion

Bulk conversion chỉ mở khi tất cả gate dưới đây là `PASS`; `PARTIAL` không cộng thành pass.

| Gate | Điều kiện bắt buộc | Hiện tại |
|---|---|---|
| BG-00 Engine/docs lock | UE 5.8.1 exact CL/toolchain/plugin/profile pin; docs active không còn dùng UE5.6 làm target | **OPEN** |
| BG-01 Product/gold | Gold commit/build và canonical playthrough được owner duyệt | **OPEN** |
| BG-02 Immutable topology | Gold read-only, candidate/write-set/staging/rollback boundary rehearsal | **OPEN** |
| BG-03 Closed corpus | Blueprint/Widget/AnimBP/struct/enum/table/map/config/dynamic-load denominator có stable IDs | **OPEN** |
| BG-04 Core freeze | Module DAG, state owner, contract, lifecycle, transaction, GAS/persistence/presentation policy được duyệt | **OPEN** |
| BG-05 `TQ0` | Clean tool build; surface/node/edge closure; strict round-trip; processor dispositions; real-uasset + differential semantic + cook/package fixtures pass | **NOT PASSED** |
| BG-06 `P4` | Representative unit đi đủ S0→S11, gồm human A/B và rollback | **NOT PASSED** |
| BG-07 Human capacity | Card budget, hardware/input/video/report turnaround được chốt | **OPEN** |
| BG-08 Operational safety | Stale/dirty rejection, deterministic v2 export, edge identity/digest, no Content overwrite, receipt/ledger/recovery drill | **PARTIAL** |

Pilot v3 đã đóng deterministic surface/node/pin/edge inventory, project build và hai focused tool/pilot automation suites. Nó vẫn có 59 partial processor/port nodes, 74 warnings và mọi non-topology completion dimension false; ngoài ra chưa có real-fixture matrix đầy đủ, cook/package proof, multi-instance latent/state differential tests, shadow parity, authoritative switch, human A/B hoặc legacy retirement.

Vì vậy:

```text
TQ0 = NOT PASSED
P4  = NOT PASSED
bulk_conversion_authorized = false
```

## 11. Definition of converted

Một Blueprint không được gọi là converted chỉ vì tên variable/function đã có trong `.h/.cpp`.

Full V5 conversion cho một capability nghĩa là:

- authoritative state và executable gameplay/orchestration C/D đã chuyển sang reviewed native C++;
- data/presentation/declarative A/B/DCL được giữ có chủ ý và nằm trong allowlist;
- mọi source surface có terminal disposition;
- đúng một mutation owner active;
- state, ordering/timing, failure/cancel, presentation và reference health pass gold oracle;
- rollback đã rehearsal;
- legacy C/D path đã retire;
- evidence pin đúng source/content/config/engine/tool hashes.

UMG layout/animation, AnimBP pose graph, montage/notify, DataAsset, Behavior Tree, EQS, map, material, audio/VFX không cần bị ép thành C++ nếu chúng là retained declarative/presentation surface. “100% conversion” là **100% authority closure**, không phải 100% file extension `.cpp`.

## 12. Native pilot hiện tại và việc tiếp theo

`ABPPlayerCharacterNativePilot` đã được tạo trong `Source/Palworld_Base/ConversionPilot` với dormant posture. Nó có native implementation/seam tương ứng đủ **11/11 source surfaces**:

```text
EventGraph                → BeginPlay/EndPlay orchestration
UserConstructionScript    → constructor + OnConstruction
LevelUp                   → LevelUp
CostStamina               → CostStamina
AddExp                    → AddExp
UpdateWidget              → UpdateWidget
UpdateState               → UpdateState
SetLevelData              → SetLevelData
UpdateHpTimer             → UpdateHpTimer/UpdateHp
UpdateStaminaTimer        → UpdateStaminaTimer/UpdateStamina
UpdateEnergeTimer         → UpdateEnergeTimer/UpdateEnerge
```

Safety facts:

- không có tracked change dưới `PaldarkV5/Content`;
- original `BP_PlayerCharacter` không bị reparent;
- class native mới không được dùng làm production authority;
- legacy Blueprint vẫn là active oracle/owner;
- candidate dùng compatibility seams cho legacy components/UI/data, nên sự hiện diện của 11 method không đồng nghĩa behavior exact.

Nhãn đúng hiện tại là:

```text
native_artifact_posture = NATIVE_DORMANT
surface_implementation = 11/11
edge_inventory_v2 = 65/65 execution, 145/145 data, identity digests match
pin_inventory_v2 = 604/604
processor_complete = 105/164; partial = 59
analysis_export_ok = true
graph_coverage_complete = false
conversion_ready = false
behavior_parity = PARTIAL / NOT CERTIFIED
authoritative_switch = NOT PERFORMED
```

Không được ghi unit đã “đạt S8” theo state machine chỉ vì artifact mang dormant posture: evidence chain S4–S7 phải liên tục. V3 đã sửa edge loss/determinism nhưng fail S4 do partial processor/port nodes và non-topology closure; unit certified state vẫn dừng trước S4.

Packet tiếp theo phải:

1. triage 28 `fallback_no_processor`, 21 `fallback_processor_failed`, 9 structural port mapping gap và 1 runtime-class rejection bằng stable node IDs;
2. đóng hoặc explicit-classify 74 warnings; không suppress để làm đẹp receipt;
3. bổ sung member identity, class defaults, component hierarchy, related type và referenced graph closure;
4. re-export fresh-process A/B sau mỗi extractor fix; hash mới phải thay, không tái dùng v3 evidence cho changed source;
5. review native logic lại theo v2 authority arrays, đặc biệt 16 consumer từng bị bundle v1 bỏ mất;
6. compile-certify candidate/scaffold scope, rồi tạo shadow trace và human card cho HP/Stamina/Energy timers, level/EXP, widget update và construction behavior;
7. rehearsal switch/rollback;
8. chỉ đề nghị TQ0/P4 sign-off sau toàn bộ required fixtures, automated và human A/B.

Course triển khai toàn chương trình nằm tại [Paldark V5 — Evidence-Driven Blueprint-to-C++ Migration](/V5/Course/).
