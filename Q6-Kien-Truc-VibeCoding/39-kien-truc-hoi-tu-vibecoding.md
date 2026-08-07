# Chương 39 — ADR-001: Kiến trúc hội tụ cho VibeCoding đa tác nhân

> **Trạng thái:** `APPROVED` — Soliz duyệt ngày 2026-08-04 22:00 +07.
> **Decision owner:** Soliz.
> **Phạm vi:** kiến trúc đích và chiến lược hội tụ; không mass-refactor, không scaffold module trước nhu cầu gameplay.
> **Vertical spine đã duyệt:** Wild Pal → Capture → Roster/Summon → Work output.

## 39.1 — Câu hỏi first principles

Trước khi nói tới module hoặc class, architecture phải trả lời được chuỗi này:

1. Người chơi sẽ **cảm thấy hoặc làm được gì** mà hôm qua chưa làm được?
2. Cảm giác đó đòi hỏi **canonical state** nào tồn tại?
3. Ai là **writer duy nhất** của mỗi state?
4. Mutation nào phải **atomic/idempotent**?
5. Client gửi **intent** gì; server tự tính **verdict** gì?
6. Hệ thống khác cần **query** gì và chỉ cần được **notify** điều gì đã xảy ra?
7. State nào là definition read-only; state nào là instance mutable; state nào phải save?
8. Người chơi nhìn thấy kết quả qua UI/animation/VFX nào?
9. Log nào nối được input → validate → commit → replication → presentation?
10. Vì sao capability này cần một GameFeature lifecycle độc lập, thay vì chỉ là code trong domain owner?

Nếu chưa trả lời được 1–9, tạo thêm plugin chỉ tạo thêm folder. Nếu câu 10 không có đáp án, không tạo GameFeature.

## 39.2 — Bằng chứng buộc ta sửa kiến trúc hiện tại

| Nhận định | Bằng chứng local | Hệ quả |
|---|---|---|
| Plugin đang bị đồng nhất với tên hệ thống | #157 có 19 và HEAD có 21 thư mục dưới `PaldarkKit/Plugins/GameFeatures/` | Số plugin lớn không đồng nghĩa modular; nhiều plugin không có lifecycle độc lập. |
| Core chứa presentation | [PaldarkCore.Build.cs](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Source/PaldarkCore/PaldarkCore.Build.cs) phụ thuộc `UMG`; [PaldarkWorldLabelWidget.h](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Source/PaldarkCore/Public/PaldarkWorldLabelWidget.h) là `UUserWidget` | Core không còn headless/stable. |
| Core là ngã tư contract | [PaldarkCoreContracts.h](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Source/PaldarkCore/Public/PaldarkCoreContracts.h) và [PaldarkCoreTypes.h](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Source/PaldarkCore/Public/PaldarkCoreTypes.h) trộn interface/type của nhiều domain | Agent nào thêm domain cũng sửa file chung; conflict và coupling tăng. |
| Bus không giữ type contract | [PaldarkCoreEventBus.h](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkKit/Source/PaldarkCore/Public/PaldarkCoreEventBus.h) phát `AActor* + FName + TArray<uint8>` toàn cục | Mutation route bằng convention; compile không bắt producer/consumer lệch schema. |
| Gameplay phụ thuộc storage implementation | `PaldarkRuntime.Build.cs` và nhiều feature `Build.cs` phụ thuộc trực tiếp `PaldarkPersistence` | Domain và storage adapter bị ghép; player scope/fixture khó thay. |
| V3 đã có invariant tốt hơn | [Kiến trúc V3](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV3/Docs/PALDARK_V3_Technical_Architecture_VI.md) | Không cần nghĩ lại command/transaction/persistence invariant từ số 0. |
| Lab/V2 có donor khác nhau | [Audit PaldarkLab vs V2](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkLab/Docs/PALDARK_PaldarkLab_vs_PaldarkV2_Source_Code_Audit_VI.md) | Lab cho breadth/playable code; V2 cho failure-path/transaction; không nhập nguyên khối bên nào. |

Static audit HEAD còn cho ví dụ trực tiếp: PalBehavior phát `TargetCorrelationId`/`NavigationTarget`, Work đọc `CorrelationId`/`ArrivalLocation`. Raw payload cho phép hai bên cùng compile nhưng không tích hợp.

## 39.3 — Quyết định hội tụ

Paldark dùng chiến lược **strangler**, không restart:

1. Giữ **PaldarkKit** làm project shell: target, config, host, GameFeature activation và integration path hiện có.
2. Lấy **PaldarkV3 làm contract spine**: stable identity, single writer, typed result, idempotent command, transaction plan/commit, persistence participant và telemetry invariant.
3. Port implementation đã chứng minh từ **PaldarkLab/V2** ra sau API mới, từng vertical slice; không nhập topology/god class cũ.
4. Dùng **KYWorld** làm `REFERENCE` cho behavior, player flow, asset taxonomy và content composition; không coi binary Blueprint hoặc prototype architecture là source proof.
5. Dùng **13 khoá học** làm pattern library và lời giải thích “vì sao”; phân biệt `[C++]`, `[Asset]`, `[Doc]`, `[Inference]` theo [Phụ lục D](../PhuLuc/D-kiem-ke-13-khoa-hoc.md).
6. Không mass-refactor trước gameplay. Chỉ sửa boundary bị vertical slice kế tiếp buộc phải chứng minh.

Ma trận chọn donor theo từng hệ thống nằm ở [Phụ lục H](../PhuLuc/H-ma-tran-donor-paldark.md).

## 39.4 — Bốn khái niệm không được trộn

- **System/domain** trả lời: ai sở hữu state và luật?
- **Module** trả lời: dependency/compile boundary nào phải ổn định?
- **GameFeature plugin** trả lời: capability/content nào có lifecycle activate/deactivate độc lập?
- **Experience/Ruleset** trả lời: phiên chơi này compose những capability nào?

Luật mới đề xuất:

> Một capability có lifecycle độc lập có một GameFeature plugin và một owner rõ. Một hệ thống nền luôn hoạt động không bị ép thành GameFeature. Mỗi canonical state vẫn chỉ có một writer dù nhiều capability sử dụng nó.

`Health`, `HUD`, `Multiplayer` và `Persistence` không tự động là bốn GameFeature. Chúng lần lượt là gameplay authority, presentation, transport/cross-cutting concern và infrastructure.

Điều này phù hợp với Lyra: Experience chọn feature cần nạp, còn ShooterCore là một feature lớn chứa nhiều mechanic/UI/ability chứ không phải một plugin cho từng danh từ. Xem [Lyra Sample Game](https://dev.epicgames.com/documentation/unreal-engine/lyra-sample-game-in-unreal-engine?lang=en-US) và [Game Features and Modular Gameplay](https://dev.epicgames.com/documentation/unreal-engine/game-features-and-modular-gameplay-in-unreal-engine?lang=en-US).

## 39.5 — Topology logic đích

Tên dưới đây là **logical responsibility**, không phải lệnh tạo ngay chín module rỗng.

| Boundary | Sở hữu | Không được sở hữu |
|---|---|---|
| `PaldarkCore` | Entity/command/correlation ID, typed result base, lifecycle handle, telemetry primitive | UMG, gameplay actor, domain DTO cụ thể, save implementation |
| `PaldarkData` | Definition/fragment framework, registry, validation, preload policy | Mutable runtime state |
| `PaldarkGameplay` | GAS, Health/Damage, Interaction, Item/Inventory/Equipment/Crafting primitives | World policy, UI, session |
| `PaldarkSimulation` | Creature record/lease, Pal activity coordinator, Companion/Work/Breeding simulation | UI, online transport, map streaming |
| `PaldarkWorld` | Structure/base registry, placement, ecology, clock, dungeon/encounter state | Player input, UI, session |
| `PaldarkOnline` | Session, connection identity, reconnect, rate limit, replication diagnostics | Gameplay verdict |
| `PaldarkPersistence` | Snapshot coordinator, schema/migration/checksum/storage adapter | Inventory/Creature/World rules |
| `PaldarkGame` | Composition root, Experience/Ruleset lifecycle, cross-domain orchestration | Thuật toán đã có domain owner |
| `PaldarkUI` | View model, HUD/screen, pending/rejection feedback | Authoritative mutation |

Dependency có hướng: Core ở đáy; UI/Editor/Test không nằm dưới runtime domain. Domain API mặc định nằm trong thư mục public của owner. Chỉ tách API-only module khi có vòng dependency hoặc lifecycle boundary thật; không tạo module rỗng để trông modular.

## 39.6 — Khi nào một capability được là GameFeature

Giữ/tạo GameFeature chỉ khi capability có:

1. content/lifecycle độc lập;
2. activation/deactivation tạo khác biệt runtime thật;
3. dependency bundle và presentation contribution rõ;
4. ít nhất hai Experience/configuration dùng khác nhau, hoặc cần phân phối độc lập;
5. acceptance cho activate, deactivate, reconnect và save compatibility.

Nếu không đạt, capability là component/service trong domain module.

Các pack ứng viên để khảo sát, **chưa chốt tên**:

- `WildCreatureLoop`: encounter, combat contribution, capture, roster/summon, HUD liên quan;
- `BaseAutomationLoop`: build, storage/craft contribution, worker assignment, production UI;
- `DungeonExpedition`: encounter composition, boss, reward/progression contribution;
- `BreedingEconomy`: farm, breeding, condenser, merchant contribution.

Một plugin được chứa nhiều system nội bộ nếu chúng có cùng lifecycle và tạo một player-visible loop. State owner bên trong vẫn tách rõ.

## 39.7 — Command, query và event

### Command — yêu cầu đổi canonical state

- API public dùng typed `USTRUCT`; raw bytes chỉ tồn tại ở transport/serialization adapter.
- Envelope có `CommandId`, `CorrelationId`, issuer/subject stable ID, intent tag, expected revision và payload tối thiểu.
- Owner chạy `authorize → validate → plan → commit → publish`.
- Terminal result trả đúng một lần, có result tag và authoritative revision.
- Client không gửi final damage, capture success, output/cost hoặc ownership verdict.

GAS có activation/prediction lifecycle riêng, nhưng server vẫn quyết định cost, target, damage và result. GAS phù hợp ability/effect/attribute/tag/cue; inventory transfer, craft, build, work order và save vẫn là typed transaction. Xem [Gameplay Ability System](https://dev.epicgames.com/documentation/en-us/unreal-engine/understanding-the-unreal-engine-gameplay-ability-system).

### Query — chỉ đọc

- read-only interface, immutable snapshot/read model hoặc async data query;
- không trả mutable collection;
- không có side effect ẩn;
- UI chỉ query/read model rồi gửi intent.

### Event — việc đã xảy ra

- typed, immutable và đặt tên quá khứ;
- dùng stable entity ID, không giữ `AActor*` qua lifecycle bền;
- publish sau commit;
- không dùng event làm callback đồng bộ để hoàn tất half-transaction;
- transient notification có thể đi qua Gameplay Message với typed payload + GameplayTag channel.

Raw event bus hiện tại được giữ sau compatibility façade trong lúc chuyển đổi, nhưng **freeze việc mở rộng**. Mỗi vertical slice thay channel raw bằng typed contract trong chính phạm vi slice.

## 39.8 — Data, persistence, GAS và UI

### Data

- Definition/config đa tác nhân dùng text có schema làm source of truth.
- Nơi Unreal bắt buộc asset, generator deterministic sinh `.uasset` phái sinh; một composition owner duy nhất quản lý artifact.
- Data Registry/Asset Manager phục vụ definition read-only; runtime mutable state đi vào entity/save. Xem [Data Registries](https://dev.epicgames.com/documentation/en-us/unreal-engine/data-registries-in-unreal-engine).
- Domain logic không hard-code asset path.

### Persistence

- Domain sở hữu snapshot DTO, version và migration của state mình.
- Persistence chỉ biết `snapshot participant`, không import concrete feature.
- Chunk có stable owner ID, schema version, checksum và numeric generation.
- Validate toàn bộ trước apply; commit manifest sau verify.
- Không event-source toàn game; chỉ journal/idempotency marker ở transaction cần thiết.

### GAS

- Health/attribute/status có một canonical authority trong AttributeSet.
- Player ASC trên PlayerState; active Pal ASC trên actor đang hoạt động và dehydrate về creature record.
- Dùng GAS cho ability, cost, cooldown, effect, tag, cue và prediction.
- Capture là domain transaction đọc authoritative Health/GAS snapshot rồi settlement Inventory + Creature; không phải ability tự ghi roster.

### UI/Blueprint

- Loại `UMG` khỏi Core; UI ở client/presentation boundary.
- C++ sở hữu view model, binding, pending/reconcile và typed rejection.
- Blueprint chỉ layout, style, animation, VFX và asset assignment.
- Mọi phần Blueprint agent không tự làm được phải có hướng dẫn Editor từng bước và test card cho người dùng.
- Presentation fail không rollback gameplay đã commit.

## 39.9 — Experience/Ruleset composition

```text
Map/GameMode
  → Ruleset/Experience ID
  → async load definitions + required GameFeatures
  → activate components/input/UI/content contributions
  → replicate Ready
  → Pawn và domain init hoàn tất
```

Mọi playable map đi cùng một path; không tạo Alpha GameMode bypass Experience.

Để Experience không thành shared-file bottleneck:

- mỗi capability sở hữu một text composition fragment;
- feature agent không sửa main Experience;
- composition integrator là owner duy nhất ghép fragment và sinh asset;
- generated asset không phải source of truth;
- Experience không chứa domain logic.

## 39.10 — Chiến lược chuyển đổi không phá gameplay

1. Freeze plugin mới và raw event channel mới.
2. Không mass-move 19/21 plugin hiện tại.
3. Chọn một vertical slice; đặt typed façade trước implementation cũ.
4. Port đúng invariant/contract cần thiết từ V3.
5. Chọn implementation tốt nhất từ Lab/V2, đặt sau façade và compile.
6. Dùng KYWorld/course để chốt behavior và human test card.
7. Khi slice qua human gate, loại adapter/dependency cũ **chỉ trong slice đó**.
8. Lặp lại theo player loop.

Vertical spine đích đầu tiên:

```text
Wild Pal nhìn thấy được
→ damage authoritative
→ ném capture device
→ consume/refund item + capture verdict
→ remove/disable đúng world Pal
→ transfer đúng creature stable ID vào roster
→ summon/recall
→ assign tới station
→ Pal đến nơi và output xuất hiện
→ HUD/log kể cùng một câu chuyện
```

Không cố hoàn tất spine này trong một PR. Mỗi PR khép một đoạn có output người chơi hoặc một invariant bắt buộc cho đoạn kế tiếp.

## 39.11 — Phương án bị loại

- **Restart từ V3:** mất integration/gameplay đang có trong Kit.
- **Nhập nguyên Lab:** breadth tốt nhưng monolithic, Experience bypass và authority chồng lấn.
- **Nhập nguyên V2:** failure invariant tốt nhưng thiếu breadth/network/world.
- **Copy KYWorld 1:1:** phần Palworld-specific chủ yếu là Blueprint binary chưa đọc được; prototype không chứng minh authority/save/network production.
- **Một system = một GameFeature:** nhầm state boundary với activation boundary.
- **Một runtime monolith:** tạo ngã tư include/build/ownership.
- **Raw global bus cho mọi việc:** mất type safety và che mutation path.
- **GAS cho mọi transaction:** build/work/inventory/save không phải ability lifecycle.
- **Blueprint-first:** binary conflict, agent không merge an toàn.
- **Cấm Blueprint tuyệt đối:** không thực tế cho layout/animation/VFX/content.
- **Cook/package/CI mỗi PR:** không phù hợp compiler-gated sprint hiện tại.
- **Refactor toàn bộ trước gameplay:** lặp lại chính sai lầm của #135–#157.

## 39.12 — Bốn quyết định cần Soliz duyệt

1. `System ≠ GameFeature`; GameFeature chỉ dành cho capability có activation boundary thật.
2. Dùng topology/invariant V3 làm baseline, nhưng tạo module theo nhu cầu vertical slice, không scaffold trước.
3. Thay raw bus dần bằng typed command/query/event, từng slice; không big-bang.
4. Dùng vertical spine Wild Pal → capture → roster/summon → work output làm hướng triển khai đầu tiên sau design gate.

Soliz đã duyệt ADR-001 và cả bốn quyết định bằng chỉ thị `APPROVE ADR-001` ngày 2026-08-04. Checkpoint implementation đầu tiên là commit `61c3aaac`; trạng thái compile và human gate được ghi ở [Chương 43](43-human-gate-adr-001-capture-to-work.md). Approval kiến trúc không tự động đồng nghĩa `USER_VERIFIED` hoặc `PARITY_EVIDENCED`.
