---
title: V5.2 — Core Technical Design
description: Thiết kế Core, capability, owner, lifecycle, transaction và feature capsule cho Paldark V5.
---

# V5.2 — Core Technical Design

> **Trạng thái:** `PROPOSED — CORE DESIGN GATE P2`
>
> Tài liệu này quyết định quan hệ nào được phép tồn tại. Nó chưa quyết định class implementation chi tiết và không cho phép viết gameplay code trước khi owner duyệt.

## 1. First principles

Một game đã polish không phải tập class. Nó là một hệ chuyển trạng thái có:

- đầu vào từ người chơi, AI, clock và world;
- điều kiện được phép hoặc bị từ chối;
- canonical state và một chủ thể có quyền ghi;
- thứ tự/timing;
- biểu hiện qua animation, camera, UI, sound và VFX;
- reference tới authored content;
- lifecycle khi world, player hoặc feature xuất hiện/biến mất.

Vì vậy primitive của V5 không phải `Actor`, `Component` hay `Plugin`. Primitive là **capability có hợp đồng**:

```text
Capability = <Identity, Scope, Authority, Requirements, OwnedState,
              Commands, Queries, Events, Lifecycle, Evidence>
```

Unreal type chỉ là cách một provider hiện thực capability ấy.

## 2. Điều học từ bốn nguồn

### 2.1. Cordis / DeepSeek Harness

Hai ý tưởng được áp dụng có điều kiện:

- **Spatial composability:** provider khai báo điều nó cung cấp và điều nó cần; composition runtime giải dependency từ context thay vì class tự tìm global peer.
- **Temporal composability:** effect của việc cài một provider phải có receipt để tháo đúng những gì nó đã cài.

Điều không được cường điệu: damage, item transfer, capture hay build đã commit không phải lifecycle effect có inverse tự nhiên. Chúng là gameplay transaction; nếu muốn đảo phải phát một compensating command có semantics riêng.

### 2.2. Lyra

Giữ:

- Experience/profile chọn tập feature;
- Game Feature dùng như content/lifecycle capsule;
- component injection thay vì sửa mọi base actor;
- GAS cho action/effect/tag có lifecycle phù hợp;
- UI extension và input mapping có handle.

Không copy mù quáng:

- feature action thiếu teardown đầy đủ;
- async deactivation không khép kín;
- chỉ deactivate mà không thực sự unload module;
- dependency ẩn sau Experience hoặc asset.

V5 bắt buộc receipt, generation và activation-cycle test để biến convention thành invariant kiểm được.

### 2.3. UEFN

Giữ tư duy **device façade**: designer có thể đặt một Actor/Component cấu hình bằng data và nối typed port mà không biết implementation. Device không được biến thành canonical owner của domain khác hoặc giao tiếp bằng string/global search tùy ý.

Phân tích đầy đủ về project/content model, devices, Verse, Scene Graph, gameplay domains, validation, runtime và vận hành nằm ở [V5.9 — Kiến trúc UEFN và bài học cho PaldarkV5](/V5/09-uefn-architecture-and-paldarkv5). UEFN là reference architecture/lab, không phải runtime dependency của PaldarkV5.

### 2.4. Paldark V1–V4

Giữ stable identity, authority-shaped request, versioned payload, reservation, idempotency, manifest và evidence ladder.

Không lặp lại:

- core chứa interface/type của mọi domain và phụ thuộc UMG;
- plugin-per-noun nhưng tất cả luôn active;
- event bus đồng bộ làm đường mutation chính;
- codec/provider đăng ký mà không unregister receipt;
- Work, Inventory, PalBehavior hoặc HUD thành god component;
- hai feature cùng viết một state rồi dùng adapter che duplicate authority.

PaldarkKit V4 vì vậy là donor của invariant và failure case, không phải final host để V5 phải merge vào lần thứ hai. PaldarkV5 là target codebase duy nhất ngay từ full KYWorld seed.

### 2.5. Evidence register cho các bài học

Các kết luận trên không dựa vào tên framework hoặc trí nhớ hội thoại. P2 pin các nguồn sau; thay source/version phải review lại kết luận tương ứng:

| Evidence ID | Nguồn đã pin | Điều tài liệu dùng |
|---|---|---|
| `SRC-CORDIS-001` | `Documents/KYWorld/paper.pdf`, SHA-256 `4D48478DC0B6222D9F74D7DB10EE776449B1209EB112632336544D32A49DB97F` | calculus về effect/coeffect, temporal/spatial composition; phần self-evolving harness là hướng validation, không phải guarantee đã chứng minh cho Unreal |
| `SRC-HARNESS-001` | `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`; `architecture.md` SHA-256 `C5B2D290BE49F06019B412E56FEE4C9B36B853813FD927D4E31FE678712A9C70`, `cordis-primer.md` `90E493EA854A8E23FED0FA6B973ADE950D4FD100E6365C6AD52D83D3436F27E9`, `capability-seams.md` `CD42EB79CD51E228F869407A97D92EFB55DA97BFE3F36EB2BBC0A6618C6A6114` | Harness dùng Cordis/capability seams và plugin composition; repository claim không tự chứng minh Unreal teardown/transaction semantics |
| `SRC-LYRA-001` | `17.Hipernova-Lyra-Inventory@d0c190f13cb67e81f170de2275a74fd5132ff253`, `LyraExperienceManagerComponent.cpp:384–465` | FILO teardown, partial-load TODO, giới hạn async deactivation và deactivate-vs-unload |
| `SRC-UEFN-001` | [V5.9 UEFN synthesis](/V5/09-uefn-architecture-and-paldarkv5); Epic UEFN/Verse/Scene Graph/validation/Lore sources và local build 42.00 reverified 2026-08-22 | governed creator platform, capability façade, composition/lifecycle, generated digest, hybrid migration và validation; không suy ra canonical Paldark state owner |
| `SRC-V4-CORE-001` | `Soliz-Devin-Palworld@d0c190f13cb67e81f170de2275a74fd5132ff253`; CoreContracts blob `9cdf943e11d473ea6f985c8afc92598253be760d`, Build.cs blob `3063fb91ceafdd986c383288ecaf998c3206be18` | domain contract dồn vào Core và public dependency `UMG` là debt phải tránh |
| `SRC-V4-RETRO-001` | `Paldark-Docs@581e9bd:index.md`, nay lưu tại [V4 archive](/V4/kyworld-cpp-parity-ue54) | receipt/owner/adapter/manifest lessons và các giới hạn quan sát của V4 |

Evidence register của implementation phải bổ sung source commit/hash và exact spans; link prose không thay thế source pin.

## 3. Năm khái niệm không được trộn

| Khái niệm | Ý nghĩa | Ví dụ |
|---|---|---|
| **Package** | Boundary build/deploy/content | Unreal module hoặc plugin |
| **Capability** | Lời hứa semantic | Inventory transfer, Apply Damage |
| **Provider instance** | Implementation active trong một scope | Inventory provider của Player A |
| **Effect receipt** | Handle tháo registration/attachment | delegate, input mapping, ability grant |
| **Gameplay transaction** | State change được validate và commit | transfer item, capture Pal |

Một Actor Component có thể cung cấp capability nhưng không vì thế thành plugin. Một plugin có thể chứa nhiều capability. Một receipt chỉ undo installation effect, không xóa lịch sử gameplay.

## 4. Topology vật lý

### 4.1. Always-on spine

Bảy package dưới đây là **project Runtime module**, không phải Game Feature plugin:

| Module | Chịu trách nhiệm | Cấm |
|---|---|---|
| `PaldarkCore` | ID, result/reason, authority, scope, revision, correlation, idempotency, tags, logging primitives | UMG, GAS implementation, domain state |
| `PaldarkData` | Stable definition identity, authored schema, validation và lookup seam | gameplay mutation, UI |
| `PaldarkComposition` | Capability descriptor/registry, dependency DAG, provider generation, profile reconcile, receipt stack | domain rule |
| `PaldarkPersistenceContracts` | SaveChunk/schema/codec/registrar/recovery-port types; dependency inversion seam | storage implementation, feature payload |
| `PaldarkPersistence` | Manifest/checksum/storage, codec registry có unregister receipt, schema migration orchestration | include domain hoặc sở hữu feature payload |
| `PaldarkRuntimeHost` | GameInstance/GameMode/PlayerState/Pawn host shell và scope creation | Inventory/Health/Capture canonical state |
| `PaldarkAbilitySystem` | GAS bootstrap, ASC host/rebind policy, grant/input/effect handle helpers | public owner của mọi gameplay transaction |

Spine nhỏ luôn tồn tại vì đây là infrastructure của product, không phải feature có thể tùy ý biến mất giữa frame.

### 4.2. Package matrix đã chọn cho P2

Các domain lớn là **regular Runtime plugin**, mỗi plugin có đúng một module cùng tên `*Runtime`. Contract nằm trong thư mục `Public/`; implementation nằm `Private/`. Module riêng `*Contracts` chỉ được tách bằng ADR khi public fan-out/build cost đo được, không tạo trước theo thói quen.

| Plugin | Runtime module | Public capability/owner chính | Activation scope |
|---|---|---|---|
| `PaldarkFrontend` | `PaldarkFrontendRuntime` | session flow, menu/character creation handoff | game instance/profile |
| `PaldarkPlayer` | `PaldarkPlayerRuntime` | player profile, progression, needs, locomotion/camera | player/pawn |
| `PaldarkInteraction` | `PaldarkInteractionRuntime` | focus/target và interaction request | local player |
| `PaldarkItems` | `PaldarkItemsRuntime` | catalog, Inventory, Equipment | player/container |
| `PaldarkCombat` | `PaldarkCombatRuntime` | action/attack và Health | actor |
| `PaldarkCreatures` | `PaldarkCreaturesRuntime` | identity, behavior, capture, roster/PalBox, traversal | world/player/actor |
| `PaldarkProduction` | `PaldarkProductionRuntime` | coordinator, Craft, Build, Cook, Work | world |
| `PaldarkWorld` | `PaldarkWorldRuntime` | world kernel, clock, spawn, resource node, transition | world |
| `PaldarkPresentation` | `PaldarkPresentationRuntime` | HUD/UMG/minimap/audio/VFX read models | local player |

`PaldarkCombatRuntime` chứa cả Combat và Health nhưng hai capability vẫn là hai owner khác nhau. `PaldarkProductionRuntime` chứa coordinator, Craft, Build và Work nhưng coordinator không sở hữu job/structure/item state.

Một regular Runtime plugin `PaldarkIntegration` chứa hai leaf module `PaldarkWorldItemsIntegration` và `PaldarkCreatureCombatIntegration`. Đây là owning `.uplugin` rõ ràng của integration code; chúng không phải project module trôi nổi.

Chỉ hai package profile được đề xuất là **Game Feature plugin**:

| Game Feature profile | C++ module | Lý do lifecycle | Được sở hữu |
|---|---|---|---|
| `GF_PaldarkFrontendProfile` | none; content-only | frontend maps/input/UI khác world session và cần activate/deactivate như một tập | descriptor, asset/input/UI installation receipt; không canonical gameplay state |
| `GF_PaldarkWorldProfile` | none; content-only | world experience chọn provider/content set cho session | descriptor, component/input/ability/UI installation receipt; không domain state |

Domain module có thể đã load nhưng provider chỉ active trong scope/profile đã resolve. V5 không tạo `GF_*` cho từng noun và không giả vờ native DLL được unload. Nếu W0 chứng minh frontend/world không có lifecycle độc lập, hai wrapper này bị loại bằng ADR; domain topology không đổi.

Các seam cần fan-in domain nằm trong `PaldarkIntegration`:

| Integration module | Allowed dependencies | State được phép sở hữu |
|---|---|---|
| `PaldarkWorldItemsIntegration` | World + Interaction + Items public API | ResourceInteraction không có state; ResourceSettlement chỉ sở hữu reservation/commit-decision; WorldResources vẫn sở hữu node, Inventory vẫn sở hữu item |
| `PaldarkCreatureCombatIntegration` | Creatures + Combat public API | none; AI gửi action command tới Combat |

### 4.3. Exact allowed-edge matrix

Mọi `Build.cs` dependency giữa Paldark module phải thuộc bảng này; thêm cạnh là ADR + cycle check. “Public API” dưới đây nghĩa include chỉ từ `Public/`, không cast concrete type hoặc gọi `Private/` implementation.

| Module | Được phụ thuộc Paldark module |
|---|---|
| `PaldarkCore` | none |
| `PaldarkData` | Core |
| `PaldarkComposition` | Core |
| `PaldarkPersistenceContracts` | Core |
| `PaldarkPersistence` | Core, PersistenceContracts |
| `PaldarkRuntimeHost` | Core, Data, Composition, PersistenceContracts, Persistence |
| `PaldarkAbilitySystem` | Core, Data, Composition, RuntimeHost, PersistenceContracts |
| `PaldarkFrontendRuntime` | Core, Data, Composition, RuntimeHost |
| `PaldarkPlayerRuntime` | Core, Data, Composition, RuntimeHost, AbilitySystem, PersistenceContracts, Frontend public API |
| `PaldarkInteractionRuntime` | Core, Data, Composition, Player public API |
| `PaldarkItemsRuntime` | Core, Data, Composition, AbilitySystem, PersistenceContracts |
| `PaldarkWorldRuntime` | Core, Data, Composition, RuntimeHost, PersistenceContracts |
| `PaldarkCombatRuntime` | Core, Data, Composition, AbilitySystem, PersistenceContracts, Items public API |
| `PaldarkCreaturesRuntime` | Core, Data, Composition, AbilitySystem, PersistenceContracts, Combat/Items/Player public API |
| `PaldarkProductionRuntime` | Core, Data, Composition, PersistenceContracts, Items/Interaction/World/Player/Creatures public API |
| `PaldarkPresentationRuntime` | Core, Data, Composition và public API của tám domain plugin còn lại |
| `PaldarkWorldItemsIntegration` | Core, Composition, PersistenceContracts, World/Interaction/Items public API |
| `PaldarkCreatureCombatIntegration` | Core, Composition, Creatures/Combat public API |

Engine modules (`GameplayAbilities`, `UMG`, `AIModule`...) cũng phải nằm trong per-module allowlist, nhưng không làm thay đổi Paldark DAG. Presentation là leaf fan-in; domain không được phụ thuộc ngược Presentation. Integration là leaf; domain không được phụ thuộc ngược integration.

### 4.4. Contract placement

Universal primitive nằm trong `PaldarkCore`. Domain contract nằm cạnh semantic owner trong `Public/` của domain module. Implementation nằm `Private/`; consumer chỉ biết typed command/query/snapshot/event port. Descriptor ví dụ vì vậy trỏ `PaldarkItemsRuntime`, không trỏ một module tưởng tượng.

Không tạo một `PaldarkAllGameplayInterfaces` mới vì nó sẽ lặp lại core god-module. High-fanout contract chỉ tách theo domain bằng ADR, không tách theo consumer.

## 5. Capability descriptor

Mọi provider phải có descriptor máy đọc được:

```yaml
capability_id: paldark.inventory.transfer
semantic_version: 1.0.0
scope: player
authority_role: authoritative
cardinality: exactly_one
provides:
  - paldark.inventory.transfer
requires:
  - paldark.items.catalog@^1
owned_state_keys:
  - inventory.slots
  - inventory.quantities
commands:
  - Inventory.Transfer.v1
queries:
  - Inventory.Snapshot.v1
events:
  - Inventory.TransferCommitted.v1
save_chunk: inventory
schema_version: 1
provider_module: PaldarkItemsRuntime
engine_range: "=5.8.1"
```

Composition phải reject provider thứ hai cho cùng tuple:

```text
(CapabilityId, OwnedStateKey, ScopeInstance, AuthorityRole)
```

`requires` và `provides` là hai field riêng. Descriptor không được tự khai mình vừa thiếu vừa cung cấp cùng capability để làm cycle biến mất trên giấy.

## 6. Command, query, snapshot và event

### 6.1. Command context

Mọi mutation request mang tối thiểu:

- `CorrelationId` để nối input→transaction→presentation;
- `IdempotencyKey` cho retry;
- principal/authority identity;
- scope/world/player identity;
- `ExpectedRevision` nếu có concurrent state;
- payload version.

Command trả structured result/reason, revision mới và snapshot/delta cần thiết. `bool` không đủ cho UI, test và debug.

### 6.2. Query

Query không trả mutable internal container hoặc UObject pointer làm canonical state. Nó trả immutable snapshot/value view có revision.

### 6.3. Event

Event dùng thì quá khứ và chỉ phát **sau commit**: `TransferCommitted`, không phải `PleaseTransferSomehow`. Consumer muốn thay state của domain khác phải gửi command tới owner, không mutate từ event callback.

Event bus là observability/integration seam, không phải cách né owner và transaction.

## 7. State owner và transaction

### 7.1. Owner matrix nền

| State | Owner duy nhất | Domain khác phải làm gì |
|---|---|---|
| session/map flow | Frontend/Session | gửi transition command |
| attack, defense, work speed, stamina, carry capacity, resistance và non-vital modifier set | Attributes | Locomotion/Equipment/Progression gửi typed command; không gồm max/current HP, hunger, XP/level hoặc carried weight |
| XP/level | Progression | Combat/Work phát committed reward fact hoặc command, không ghi level |
| hunger/sleep need | Survival Needs | feeding/Work gửi consume/satisfy command |
| locomotion mode/velocity intent | Locomotion | input/camera gửi intent |
| focus target | Interaction | UI chỉ render snapshot |
| item definition | Item Catalog | consumer query stable ID |
| quantity/slot/container và aggregate carried weight | Inventory | Craft/Build/Work gửi reserve/settle command; carry capacity query từ Attributes |
| equipped loadout | Equipment | Combat query/loadout event |
| attack/action execution | Combat | input/AI gửi action command |
| effective max HP/current HP/death và max-health modifier set | Health | Combat gửi damage; Equipment/Progression gửi max-health modifier command |
| creature identity/species/active lease | CreatureRepository | Capture/Behavior giữ stable ID hoặc lease, không sở hữu record |
| capture attempt/outcome | Capture | Inventory cung cấp sphere reservation; Health cung cấp snapshot |
| party/PalBox membership | CreatureRepository | UI gửi selection command |
| production reservation/commit decision | Production Coordinator | chỉ giữ transaction state; không sở hữu item/job/structure |
| build structure | Build | Inventory settle material qua contract |
| craft job/recipe progress | Craft | Inventory reserve/commit output |
| work assignment/progress | Work | Pal Behavior nhận intent; Inventory settle item |
| resource-node state | WorldResources | Interaction/settlement gửi typed command |
| clock/spawn/world runtime | World | feature query/event qua contract |
| HUD/widget state | không canonical | Presentation dùng read model |

Owner matrix đầy đủ được sinh trong W0; bảng này chỉ khóa nguyên tắc và các ranh giới dễ mơ hồ nhất.

#### Invariant MaxHealth ↔ CurrentHP

`Health` sở hữu cả `EffectiveMaxHP` và `CurrentHP`; việc hai giá trị nằm trong GAS `AttributeSet` không chuyển authority sang Attributes/GAS. Max-health modifier được route thẳng tới Health.

- `0 <= CurrentHP <= EffectiveMaxHP` và mặc định `EffectiveMaxHP >= 1`.
- Giảm max xuống dưới current phải commit `EffectiveMaxHP` + clamped `CurrentHP` trong **một Health revision**; không có frame/event trung gian vi phạm invariant.
- Tăng max không tự heal trừ khi gold behavior row đã pin `preserve_ratio` hoặc `fill_delta`; nếu chưa characterize policy, command bị block thay vì chọn ngầm.
- Clamp do capacity change không phát damage event. Death chỉ commit nếu CurrentHP thực sự về 0 theo policy đã duyệt; zero-max là explicit deviation/behavior, không default.
- Sau commit chỉ phát một `Health.VitalsChanged` chứa old/new max/current, policy, reason và revision. Combat/Presentation không tự clamp lần hai.

W6 Feature Dossier phải chọn `preserve_absolute_clamp`, `preserve_ratio` hoặc `fill_delta` từ gold evidence trước implementation.

### 7.2. Transaction protocol

Transaction có dạng:

```text
Validate → Reserve → Commit → Publish → Present
```

- reject/cancel trước commit phải để state giống trước request;
- retry cùng idempotency key không được commit lần hai;
- event chỉ sau commit;
- failure trả reason có version;
- compensation sau commit là transaction mới, không gọi lifecycle teardown.

Inventory, capture, build, craft và work settlement đều phải dùng cùng discipline, nhưng không nhất thiết dùng cùng god transaction manager.

### 7.3. Atomicity nhiều owner

Không có global transaction manager sở hữu mọi domain. Mỗi use case có một coordinator semantic (`Capture`, `ProductionCoordinator`, `ResourceSettlement`), còn participant vẫn là owner của state nó giữ.

Protocol bắt buộc:

1. Coordinator tạo `TransactionId`, `IdempotencyKey`, participant set và expected revisions.
2. Tất cả participant `Validate`; bước này không mutate.
3. Coordinator `Reserve` theo thứ tự participant key ổn định. Reservation trả token, revision và lease expiry theo authoritative world time.
4. Nếu bất kỳ reserve fail/cancel trước decision, release token theo thứ tự ngược và state phải trở về trước request.
5. Khi mọi reserve pass, coordinator ghi `COMMIT_DECIDED`. Nếu disk persistence thuộc scope, decision journal phải durable **trước** participant commit.
6. Participant commit idempotent theo thứ tự đã pin. Failure sau `COMMIT_DECIDED` không rollback tùy tiện; coordinator retry/roll-forward cho tới đủ acknowledgement.
7. Chỉ khi mọi participant ack mới publish domain events và cho presentation chạy success path.

Participant API tối thiểu là `Validate`, `Reserve`, `Commit`, `ReleaseBeforeDecision` và `QueryTransaction`. Token không được reuse; expiry không được dựa vào client clock. Cancel sau commit decision trả `AlreadyCommitted`; muốn đảo phải dùng compensating command được feature định nghĩa và test riêng.

Crash/travel semantics phụ thuộc scope đã duyệt:

- session-only: quiesce chặn transaction mới, drain hoặc abort toàn bộ pre-decision reservation trước travel;
- disk save: journal + recovery scan phải roll-forward committed decision hoặc release expired pre-decision reservation trước khi mở input;
- network: authority giữ coordinator/journal; client retry cùng idempotency key và không tự commit predicted canonical state.

Mỗi transaction test phải fault-inject tại mọi ranh giới reserve/decision/participant commit/publish. Đây là điều bảo vệ “không mất/duplicate item”; riêng chuỗi chữ `Validate → Reserve → Commit` không đủ.

## 8. Temporal composability và receipt ledger

Activation action phải trả typed receipt cho:

- delegate binding;
- Enhanced Input mapping;
- component request/injection;
- Gameplay Ability hoặc Gameplay Effect grant;
- timer/ticker;
- UI extension;
- capability provider registration;
- persistence codec registration;
- spawned helper có lifecycle thật.

Receipt được thu hồi LIFO. Mỗi scope giữ generation; callback từ generation cũ bị từ chối sau deactivate/reactivate.

```text
Discovered → Loading → Activating → Active
                                  ↓
Inactive ← Deactivating ← Quiescing
                         ↘ Failed
```

Receipt mang scope, owner và generation; release idempotent, dùng weak UObject reference, quay về game thread nếu UE object yêu cầu, LIFO trong capsule và reverse-DAG giữa capsule. Provider phải trở thành unavailable trước khi dependent hoàn tất teardown.

Gate nền chạy nhiều vòng activate/deactivate và yêu cầu component/delegate/input/ability/timer/UI/provider/codec count trở về baseline. V5 không hứa unload native DLL an toàn trong runtime; mục tiêu là tháo provider và effect, không giả vờ module chưa từng được load.

## 9. Spatial composability và dependency

Provider không được tự `GetAllActorsOfClass`, cast global hoặc include concrete peer để tìm dependency tùy ý. Nó khai `requires`, composition resolve provider theo scope/profile và truyền typed interface/snapshot/command port.

Luật dependency:

1. Core không phụ thuộc domain.
2. Presentation phụ thuộc contract/read model, không ngược lại.
3. Hai domain không include concrete implementation của nhau.
4. Khi A và B cần phối hợp hai chiều, tạo integration leaf phụ thuộc public contract của cả hai; leaf không sở hữu state của A/B, nhưng có thể sở hữu một coordination-transaction state được catalog riêng như `ResourceSettlement`.
5. Build graph và runtime descriptor graph đều phải acyclic.
6. Missing required provider làm activation fail có reason; không âm thầm fallback sang global search.

## 10. GAS policy

KYWorld đã dùng GAS; V5 giữ GAS như implementation mạnh cho action, effect, tag, cooldown, montage/task và attribute replication.

ASC host/lifecycle được khóa như sau:

- **Player:** ASC nằm trên `PlayerState`; `OwnerActor = PlayerState`, `AvatarActor = pawn hiện tại`. Profile/attributes sống qua pawn respawn; possess/`OnRep_PlayerState` init actor info và attach avatar generation mới. Unpossess/travel quiesce input/task, revoke pawn-scoped receipts rồi clear avatar; không tạo ASC thứ hai trên pawn.
- **Pal active actor:** ASC nằm trên Pal actor; `OwnerActor = AvatarActor = active Pal actor`. Persistent identity/stats thuộc `CreatureRepository` record, không giữ raw ASC/UObject pointer. Spawn hydrate qua typed snapshot; despawn quiesce, settle allowed state, revoke receipts rồi destroy actor.
- **Authority:** server/standalone authority commit canonical attribute/health/action state. Client prediction chỉ là GAS execution detail; rejection/reconciliation quay về domain contract result.
- **Order:** create scope → init actor info → install AttributeSet/ability/effect/input receipts → expose provider. Teardown làm provider unavailable → quiesce/cancel pawn-scoped work → revoke input/ability/effect/attribute receipts LIFO → clear avatar/actor info.
- **Death không phải deactivation:** Health commit death trước; death presentation/ability response theo contract. Không `ClearAllAbilities` hoặc xóa committed effect chỉ vì actor chết nếu dossier không yêu cầu.
- **Rebind:** mọi task/callback/grant mang scope generation; callback từ avatar/generation cũ bị reject sau respawn, possession change hoặc Pal despawn.

GAS không trở thành ngôn ngữ duy nhất của mọi hệ thống:

- Inventory transfer, build placement, craft settlement và save transaction không bị ép thành Gameplay Ability;
- Health có thể dùng AttributeSet nhưng Health contract vẫn là owner public;
- Combat ability gọi Health damage command/contract thay vì ghi HP tùy ý;
- ability grant/input binding/effect handle có receipt;
- committed GameplayEffect không bị xóa chỉ vì feature deactivate;
- retained Gameplay Ability Blueprint chỉ được data/config/presentation; C/D rule phải native.

## 11. Blueprint, presentation và device façade

### Blueprint được giữ

- class defaults và asset reference;
- UMG layout/animation;
- AnimGraph, montage, BlendSpace;
- audio/VFX/material;
- BT/EQS declarative authoring;
- designer configuration và device wiring typed.

### Blueprint bị cấm làm owner

- inventory/HP/capture/party/build/save mutation;
- authoritative validation;
- Widget hoặc AnimBP quyết định damage/rule;
- Level Blueprint làm global gameplay orchestrator;
- BT Blueprint task trực tiếp commit domain state;
- string/global discovery thay capability contract.

Device façade nhận config, exposes typed command/event port và gọi native owner. Nó cho designer trải nghiệm lắp ghép giống UEFN mà không biến level graph thành service locator.

Data policy là hybrid có chủ ý:

- text canonical cho ADR, capability/ownership/dependency manifest, schema, test và evidence metadata;
- Unreal DataAsset/DataTable canonical cho designer-authored data có reference tới class/mesh/animation;
- binary authored data có deterministic text index/export để diff và validation;
- không tạo JSON và DataAsset thành hai source of truth cạnh tranh.

## 12. Persistence

- Feature sở hữu payload và schema.
- `PaldarkPersistenceContracts` sở hữu duy nhất typed `SaveChunk`, codec, registrar và recovery-port interfaces; nó chỉ phụ thuộc Core.
- `PaldarkPersistence` sở hữu storage, manifest, checksum, atomic write và migration orchestration.
- Stateful domain/transaction module được phép phụ thuộc `PaldarkPersistenceContracts`, implement codec cạnh semantic owner và nhận registrar port qua composition. Nó không link/cast `PaldarkPersistence` implementation.
- `PaldarkPersistence` không include domain; codec registration đi qua contract và trả receipt/unregister handle.
- Save dùng stable ID/version, không serialize raw UObject pointer làm identity.
- Mỗi capability descriptor khai `SaveChunk` và schema version nếu có state persisted.
- Load không được gọi trực tiếp concrete feature; composition cung provider rồi persistence chuyển chunk qua codec contract.

Production persistence chỉ nằm trong scope nếu KYWorld reference thật sự có behavior cần giữ. Core seam vẫn phải đúng từ đầu để không khóa kiến trúc về sau.

## 13. Profile và activation

Không mặc định mọi Game Feature `Active`. Một product profile/experience khai tập capsule cần cho flow cụ thể.

Bootstrap order:

```text
Core → Data + PersistenceContracts → Persistence + Composition → Runtime scopes
→ resolve profile → activate providers theo DAG
→ attach actor capabilities → grant input/abilities → presentation
```

Shutdown/deactivation đi ngược receipt order. Profile diff được reconcile deterministic; provider thay thế phải tăng generation và không để callback cũ mutate state mới.

## 14. Enforcement thay vì convention

Static/editor checks phải fail khi:

- duplicate `OwnedStateKey`;
- dependency cycle;
- core import UMG hoặc domain runtime;
- concrete cross-feature dependency ngoài approved integration;
- manifest khai listener nhưng không có emitter/provider;
- manifest drift với GameFeatureData/component action;
- provider/codec không có unregister receipt;
- Blueprint runtime graph chưa classify;
- forbidden Blueprint mutation;
- old và new path cùng authoritative;
- dynamic/string load không có reference declaration.

Runtime checks phải fail/log structured reason khi missing provider, stale generation, revision conflict, duplicate idempotency key hoặc authority mismatch.

## 15. Test seams sinh ra từ thiết kế

Mỗi public command cần test:

- happy path;
- từng guard/rejection;
- boundary;
- cancel/interruption;
- retry/idempotency;
- duplicate/out-of-order nếu liên quan;
- spawn/destroy hoặc activate/deactivate;
- exact post-state và no-mutation-on-reject.

Line coverage chỉ là diagnostic. Contract/state-transition coverage và differential reference evidence mới là gate.

## 16. Alternatives bị từ chối

| Alternative | Lý do từ chối |
|---|---|
| Copy nguyên PaldarkKit làm Core | Mang theo UE/version, god component, manifest/lifecycle debt và semantics khác KYWorld |
| Mỗi gameplay class là một plugin | Package count tăng nhưng owner/dependency không tự rõ hơn |
| Một event bus cho mọi giao tiếp | Không bảo đảm authority, ordering, transaction hay result |
| Một module `AllContracts` | Trở thành god compile boundary mới |
| GAS cho mọi transaction | Ép inventory/build/persistence vào semantics không phù hợp |
| UMG/AnimBP giữ gameplay rule để bảo toàn polish | Giữ presentation nhưng giữ luôn duplicate authority |
| Chỉ thiết kế architecture ở cuối conversion | Lúc đó coupling đã được converter đóng băng vào native code |

## 17. Gate P2 — Core freeze

Trước khi viết Core code, owner phải duyệt:

1. always-on spine, regular-plugin/Game-Feature package matrix và exact allowed-edge DAG;
2. capability descriptor/schema;
3. single-owner matrix;
4. command/query/event và multi-owner atomic transaction semantics;
5. receipt ledger và scope/generation;
6. PlayerState/Pal ASC host, avatar rebind và teardown policy;
7. Blueprint/device policy;
8. persistence/network scope overlay;
9. static enforcement rules;
10. hai profile wrapper có thật sự cần Game Feature lifecycle hay bị loại.

Sau khi duyệt, thay đổi một mục trên là ADR mới. Task gameplay không được tự mở rộng Core vì implementation gặp bất tiện.
