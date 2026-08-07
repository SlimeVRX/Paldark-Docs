# Chương 39 — ADR-001: Kiến trúc hội tụ cho VibeCoding đa tác nhân

> **Trạng thái:** `APPROVED` — Soliz duyệt ngày 2026-08-04 22:00 +07.
> **Decision owner:** Soliz.
> **Phạm vi:** kiến trúc đích và chiến lược hội tụ; không mass-refactor, không scaffold module trước nhu cầu gameplay.
> **Vertical spine đã duyệt:** Wild Pal → Capture → Roster/Summon → Work output.

Hai agent có thể cùng viết code “đúng”: một bên phát sự kiện Pal đã tới trạm, bên kia chờ sự kiện đó để bắt đầu sản xuất. Cả hai module đều compile. Nhưng nếu bên phát gọi cùng một dữ kiện là `TargetCorrelationId`/`NavigationTarget`, còn bên nhận đọc `CorrelationId`/`ArrivalLocation`, người chơi vẫn chỉ thấy Pal đứng cạnh trạm mà không làm gì. Repo có thêm code, còn game không có thêm một hành vi hoàn chỉnh.

ADR này ra đời từ kiểu đứt gãy đó. Câu hỏi của nó không phải “nên chia thêm bao nhiêu plugin?”, mà là: làm thế nào để một lần người chơi làm yếu Wild Pal có thể đi xuyên qua capture, roster, summon và work mà mỗi thay đổi trạng thái đều có đúng một chủ? Vertical spine ở đầu chương là thước đo cho mọi quyết định phía dưới.

## 39.1 — Câu hỏi first principles

Hãy bắt đầu ở màn hình, không bắt đầu trong Solution Explorer. Nếu khoảnh khắc đích là “con Pal vừa bị mình bắt giờ tự tạo ra quặng”, ta đi ngược từ cảm giác ấy về state, quyền ghi và bằng chứng. Mười câu hỏi sau là đường đi ngược đó:

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

Thứ tự các câu hỏi cũng quan trọng. Chọn module trước khi biết canonical state thường khiến ranh giới code quyết định ngược ranh giới gameplay. Đi từ câu 1 tới câu 10 buộc mỗi boundary phải giải thích được nó bảo vệ khoảnh khắc nào của người chơi, writer nào và failure nào.

## 39.2 — Bằng chứng buộc ta sửa kiến trúc hiện tại

Ta không cần đoán kiến trúc hiện tại có vấn đề hay không. Source cho thấy ba dấu hiệu cùng lúc: boundary trình bày lọt vào Core, contract của nhiều domain tụ vào file chung, và một bus raw cho phép hai phía bất đồng schema mà compiler vẫn im lặng. Bảng dưới đây ghi lại bằng chứng local và hệ quả trực tiếp, thay vì suy ra một topology lý tưởng từ tên thư mục.

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

Đây là lỗi kiến trúc chỉ lộ mặt như một lỗi gameplay. Nếu chỉ nhìn trạng thái build xanh, ta sẽ tối ưu sai thứ: tiếp tục thêm producer và consumer lên một đường truyền không có type contract. Vì vậy, hướng hội tụ phải cho phép sửa đúng seam đang chặn player loop mà không buộc project dừng lại để xây lại từ đầu.

## 39.3 — Quyết định hội tụ

Restart từ một kiến trúc sạch nghe hấp dẫn, nhưng nó bỏ lại những đường gameplay và integration mà Kit đã có. Giữ nguyên mọi thứ cũng không ổn, vì mỗi lát cắt mới lại đi qua các seam mơ hồ cũ. Paldark chọn chiến lược **strangler**: giữ shell đang chạy, bọc boundary cũ bằng contract mới, rồi thay implementation từng đoạn khi gameplay buộc phải đi qua đó.

1. Giữ **PaldarkKit** làm project shell: target, config, host, GameFeature activation và integration path hiện có.
2. Lấy **PaldarkV3 làm contract spine**: stable identity, single writer, typed result, idempotent command, transaction plan/commit, persistence participant và telemetry invariant.
3. Port implementation đã chứng minh từ **PaldarkLab/V2** ra sau API mới, từng vertical slice; không nhập topology/god class cũ.
4. Dùng **KYWorld** làm `REFERENCE` cho behavior, player flow, asset taxonomy và content composition; không coi binary Blueprint hoặc prototype architecture là source proof.
5. Dùng **13 khoá học** làm pattern library và lời giải thích “vì sao”; phân biệt `[C++]`, `[Asset]`, `[Doc]`, `[Inference]` theo [Phụ lục D](../PhuLuc/D-kiem-ke-13-khoa-hoc.md).
6. Không mass-refactor trước gameplay. Chỉ sửa boundary bị vertical slice kế tiếp buộc phải chứng minh.

Ma trận chọn donor theo từng hệ thống nằm ở [Phụ lục H](../PhuLuc/H-ma-tran-donor-paldark.md).

Hệ quả là không project donor nào trở thành “đáp án toàn bộ”. V3 cho invariant, Lab/V2 cho implementation đã chứng minh ở những mức khác nhau, KYWorld cho behavior và asset reference. Mỗi lần port phải nói rõ đang lấy điều gì, điều gì không lấy, và player outcome nào sẽ kiểm tra lựa chọn đó.

## 39.4 — Bốn khái niệm không được trộn

Một danh từ như “Health” có thể xuất hiện trong tên system, module, plugin hoặc màn hình cấu hình, nhưng bốn cái tên ấy trả lời bốn câu hỏi khác nhau. Trộn chúng khiến đội ngũ tạo activation lifecycle chỉ vì có một state owner, hoặc đẩy domain rule vào Experience chỉ vì Experience là nơi ghép game. Ta tách chúng bằng vai trò:

- **System/domain** trả lời: ai sở hữu state và luật?
- **Module** trả lời: dependency/compile boundary nào phải ổn định?
- **GameFeature plugin** trả lời: capability/content nào có lifecycle activate/deactivate độc lập?
- **Experience/Ruleset** trả lời: phiên chơi này compose những capability nào?

Luật mới đề xuất:

> Một capability có lifecycle độc lập có một GameFeature plugin và một owner rõ. Một hệ thống nền luôn hoạt động không bị ép thành GameFeature. Mỗi canonical state vẫn chỉ có một writer dù nhiều capability sử dụng nó.

`Health`, `HUD`, `Multiplayer` và `Persistence` không tự động là bốn GameFeature. Chúng lần lượt là gameplay authority, presentation, transport/cross-cutting concern và infrastructure.

Với cách phân biệt này, việc một capability được dùng ở nhiều nơi không tự động làm nó thành plugin độc lập. Ta chỉ trả chi phí activation, dependency bundle và save compatibility khi phiên chơi thật sự cần bật/tắt capability đó như một đơn vị.

Điều này phù hợp với Lyra: Experience chọn feature cần nạp, còn ShooterCore là một feature lớn chứa nhiều mechanic/UI/ability chứ không phải một plugin cho từng danh từ. Xem [Lyra Sample Game](https://dev.epicgames.com/documentation/unreal-engine/lyra-sample-game-in-unreal-engine?lang=en-US) và [Game Features and Modular Gameplay](https://dev.epicgames.com/documentation/unreal-engine/game-features-and-modular-gameplay-in-unreal-engine?lang=en-US).

## 39.5 — Topology logic đích

Sau khi biết loại boundary mình đang nói tới, ta mới vẽ topology đích. Tên dưới đây là **logical responsibility**, không phải lệnh tạo ngay chín module rỗng. Nếu vertical slice chưa cần một boundary vật lý riêng, responsibility vẫn có thể được giữ bằng API và write authority trong module hiện tại.

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

Đi theo spine đã duyệt, input của player đi vào gameplay contract, capture settlement chạm Inventory và Creature qua transaction, summon dựng world lease, Work tiêu thụ kết quả, còn UI chỉ kể lại. Bảng topology có ích khi nó giữ được hướng đi ấy; nó vô ích nếu chỉ đổi tên chín thư mục mà writer vẫn chồng lên nhau.

## 39.6 — Khi nào một capability được là GameFeature

GameFeature có giá trị khi một Experience có thể đưa cả capability vào hoặc lấy nó ra mà lifecycle vẫn có nghĩa. Nó không phải phần thưởng cho một hệ thống đủ lớn. Năm điều kiện dưới đây biến lựa chọn đó thành một phép kiểm thay vì sở thích đặt tên:

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

Vì vậy bốn pack trên chỉ là câu hỏi khảo sát. Chúng chưa phải roadmap tạo plugin, càng không phải bằng chứng rằng boundary activate/deactivate đã được chứng minh. Vertical slice phải tạo ra nhu cầu trước; topology mới theo sau nhu cầu đó.

## 39.7 — Command, query và event

Khi người chơi ném một Cầu Pal, ba loại giao tiếp rất dễ bị dồn vào một bus: yêu cầu thử bắt, câu hỏi về HP hiện tại và thông báo capture đã thành công. Nhưng chúng có quyền lực khác nhau. Command có thể dẫn tới mutation, query chỉ đọc, event chỉ kể việc đã commit. Nếu không tách ba vai trò này, một consumer có thể vô tình trở thành writer hoặc một event bị dùng như lời hứa rằng transaction sẽ hoàn tất.

### Command — yêu cầu đổi canonical state

- API public dùng typed `USTRUCT`; raw bytes chỉ tồn tại ở transport/serialization adapter.
- Envelope có `CommandId`, `CorrelationId`, issuer/subject stable ID, intent tag, expected revision và payload tối thiểu.
- Owner chạy `authorize → validate → plan → commit → publish`.
- Terminal result trả đúng một lần, có result tag và authoritative revision.
- Client không gửi final damage, capture success, output/cost hoặc ownership verdict.

Như vậy client được phép nói “tôi muốn ném vào mục tiêu này”, nhưng không được nói “tôi đã bắt thành công”. Chênh lệch ấy là nơi authority bảo vệ inventory, creature identity và kết quả mà mọi client sẽ cùng nhìn thấy.

GAS có activation/prediction lifecycle riêng, nhưng server vẫn quyết định cost, target, damage và result. GAS phù hợp ability/effect/attribute/tag/cue; inventory transfer, craft, build, work order và save vẫn là typed transaction. Xem [Gameplay Ability System](https://dev.epicgames.com/documentation/en-us/unreal-engine/understanding-the-unreal-engine-gameplay-ability-system).

### Query — chỉ đọc

- read-only interface, immutable snapshot/read model hoặc async data query;
- không trả mutable collection;
- không có side effect ẩn;
- UI chỉ query/read model rồi gửi intent.

Query tạo ra cửa sổ quan sát, không phải cửa hậu để đổi state. Nếu một hàm tên `Get...` có thể sửa collection hoặc kích hoạt load làm thay đổi domain, boundary đọc/ghi đã bị che đi và test không còn biết mutation bắt đầu ở đâu.

### Event — việc đã xảy ra

- typed, immutable và đặt tên quá khứ;
- dùng stable entity ID, không giữ `AActor*` qua lifecycle bền;
- publish sau commit;
- không dùng event làm callback đồng bộ để hoàn tất half-transaction;
- transient notification có thể đi qua Gameplay Message với typed payload + GameplayTag channel.

Event chỉ được phát sau commit để consumer không phải đoán liệu “đã xảy ra” thực ra mới là “đang thử”. Với transaction nhiều domain, nguyên tắc này ngăn HUD ăn mừng trước khi Inventory và Creature cùng settle.

Raw event bus hiện tại được giữ sau compatibility façade trong lúc chuyển đổi, nhưng **freeze việc mở rộng**. Mỗi vertical slice thay channel raw bằng typed contract trong chính phạm vi slice.

## 39.8 — Data, persistence, GAS và UI

Typed command không tự cứu được hệ thống nếu definition, save, ability và presentation lại cùng ghi vào một state. Bốn boundary dưới đây đứng quanh domain contract: Data trả lời “định nghĩa là gì”, Persistence trả lời “state nào sống qua phiên”, GAS xử lý ability lifecycle, còn UI biến kết quả thành thứ người chơi hiểu được.

### Data

Một loài Pal có thể được nhiều agent bổ sung dữ liệu, nhưng `DefinitionId` của nó phải giữ nguyên và runtime không được sửa ngược definition. Vì thế source of truth cần merge được bằng text, còn asset Unreal — nơi bắt buộc — là sản phẩm sinh ra có chủ composition rõ.

- Definition/config đa tác nhân dùng text có schema làm source of truth.
- Nơi Unreal bắt buộc asset, generator deterministic sinh `.uasset` phái sinh; một composition owner duy nhất quản lý artifact.
- Data Registry/Asset Manager phục vụ definition read-only; runtime mutable state đi vào entity/save. Xem [Data Registries](https://dev.epicgames.com/documentation/en-us/unreal-engine/data-registries-in-unreal-engine).
- Domain logic không hard-code asset path.

### Persistence

Save không được trở thành chủ của mọi gameplay state chỉ vì nó ghi state xuống đĩa. Domain vẫn định nghĩa snapshot và migration của mình; Persistence điều phối thời điểm, tính toàn vẹn và storage. Tách hai trách nhiệm này giúp thay adapter mà không thay luật Inventory hay Creature.

- Domain sở hữu snapshot DTO, version và migration của state mình.
- Persistence chỉ biết `snapshot participant`, không import concrete feature.
- Chunk có stable owner ID, schema version, checksum và numeric generation.
- Validate toàn bộ trước apply; commit manifest sau verify.
- Không event-source toàn game; chỉ journal/idempotency marker ở transaction cần thiết.

### GAS

GAS giải tốt ability, effect và prediction, nhưng không biến mọi thay đổi thành ability. Trong capture, GAS cung cấp health snapshot và các primitive chiến đấu; settlement vẫn phải bảo toàn transaction giữa vật phẩm, world actor và creature record.

- Health/attribute/status có một canonical authority trong AttributeSet.
- Player ASC trên PlayerState; active Pal ASC trên actor đang hoạt động và dehydrate về creature record.
- Dùng GAS cho ability, cost, cooldown, effect, tag, cue và prediction.
- Capture là domain transaction đọc authoritative Health/GAS snapshot rồi settlement Inventory + Creature; không phải ability tự ghi roster.

### UI/Blueprint

Người chơi không nhìn thấy canonical state; họ nhìn thấy widget, animation và VFX. Presentation vì thế là một phần bắt buộc của outcome, nhưng không được quyền viết lại verdict khi animation lỗi hoặc widget tải chậm.

- Loại `UMG` khỏi Core; UI ở client/presentation boundary.
- C++ sở hữu view model, binding, pending/reconcile và typed rejection.
- Blueprint chỉ layout, style, animation, VFX và asset assignment.
- Mọi phần Blueprint agent không tự làm được phải có hướng dẫn Editor từng bước và test card cho người dùng.
- Presentation fail không rollback gameplay đã commit.

## 39.9 — Experience/Ruleset composition

Đến đây ta đã có owner và contract, nhưng một map vẫn cần biết phiên chơi này phải nạp capability nào. Experience/Ruleset là composition root cho câu hỏi đó. Nó dựng đường vào thống nhất từ map tới trạng thái Ready, thay vì để từng GameMode tự tạo một phiên bản game khác nhau.

```text
Map/GameMode
  → Ruleset/Experience ID
  → async load definitions + required GameFeatures
  → activate components/input/UI/content contributions
  → replicate Ready
  → Pawn và domain init hoàn tất
```

Chỉ sau khi definitions và GameFeatures cần thiết đã load, input/UI/content contribution đã activate và trạng thái Ready được replicate, Pawn cùng domain mới được coi là khởi tạo xong. Nếu một Alpha GameMode đi đường tắt, mọi bằng chứng từ map đó không chứng minh normal path của sản phẩm.

Mọi playable map đi cùng một path; không tạo Alpha GameMode bypass Experience.

Để Experience không thành shared-file bottleneck:

- mỗi capability sở hữu một text composition fragment;
- feature agent không sửa main Experience;
- composition integrator là owner duy nhất ghép fragment và sinh asset;
- generated asset không phải source of truth;
- Experience không chứa domain logic.

## 39.10 — Chiến lược chuyển đổi không phá gameplay

Giả sử Work đang hỏng vì schema arrival lệch. Mass-move hai mươi mốt plugin không làm Pal tới trạm sớm hơn; nó chỉ mở thêm hàng trăm đường diff. Cách chuyển đổi an toàn là sửa seam nhỏ nhất đủ để mắt xích kế tiếp của player loop chạy qua, rồi dùng human gate xác nhận trước khi tháo adapter cũ.

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

Nhịp điệu là **façade → invariant → implementation → compile → human outcome**. Nếu một PR chỉ tạo thêm topology mà không khép được một đoạn hoặc mở khóa rõ đoạn sau, nó chưa trả được chi phí integration mà nó tạo ra.

## 39.11 — Phương án bị loại

Mỗi phương án dưới đây giải được một nỗi đau thật, nên chúng đều có sức hút. Chúng bị loại không phải vì vô dụng, mà vì đổi một loại rủi ro lấy một rủi ro lớn hơn đối với vertical spine đang cần khép:

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

Điểm chung của các phương án bị loại là tối ưu một công cụ hoặc một topology trước khi chứng minh player outcome. ADR-001 giữ những phần có ích của chúng ở đúng vai trò, nhưng không cho bất kỳ phần nào thay thế contract và human evidence.

## 39.12 — Bốn quyết định cần Soliz duyệt

Tại thời điểm design gate, bốn lựa chọn sau là những chỗ implementation không được tự quyết. Chúng xác định boundary, cách chuyển đổi và player loop đầu tiên; vì vậy Soliz phải duyệt trước khi đồng hồ sprint chuyển sang viết code:

1. `System ≠ GameFeature`; GameFeature chỉ dành cho capability có activation boundary thật.
2. Dùng topology/invariant V3 làm baseline, nhưng tạo module theo nhu cầu vertical slice, không scaffold trước.
3. Thay raw bus dần bằng typed command/query/event, từng slice; không big-bang.
4. Dùng vertical spine Wild Pal → capture → roster/summon → work output làm hướng triển khai đầu tiên sau design gate.

Soliz đã duyệt ADR-001 và cả bốn quyết định bằng chỉ thị `APPROVE ADR-001` ngày 2026-08-04. Checkpoint implementation đầu tiên là commit `61c3aaac`; trạng thái compile và human gate được ghi ở [Chương 43](43-human-gate-adr-001-capture-to-work.md). Approval kiến trúc không tự động đồng nghĩa `USER_VERIFIED` hoặc `PARITY_EVIDENCED`.

Đó là ranh giới cuối cùng của chương: ADR cho đội ngũ quyền triển khai một hướng, không cấp trước kết quả gameplay. Từ đây, giao thức đa tác nhân phải biến bốn quyết định thành write-set, gate và bằng chứng mà một người khác có thể kiểm lại.
