---
title: Paldark V5.9 — Kiến trúc UEFN và bài học cho PaldarkV5
description: Giải phẫu UEFN từ first principles, các hệ thống cấu thành, ý định thiết kế của Epic và bài học có thể chuyển sang PaldarkV5.
---

# V5.9 — Kiến trúc UEFN và bài học cho PaldarkV5

> **Trạng thái:** RESEARCH BASELINE — dùng để thảo luận và chốt thiết kế, chưa phải lệnh triển khai code.
>
> **Evidence snapshot:** UEFN/Fortnite 42.00, build 56878558, quan sát ngày 22/08/2026. PaldarkV5 vẫn là Unreal Engine 5.8.1 project.
>
> **Ranh giới quan trọng:** tài liệu này phân tích **UEFN**. MCP chỉ được dùng như dụng cụ đọc Editor; nó không phải một hệ thống kiến trúc của game và không phải chủ đề của tài liệu.

## 0. Mục tiêu, phương pháp và hợp đồng bằng chứng

### 0.1. Tài liệu này phải trả lời điều gì?

Sau khi đọc xong, người đọc phải có thể:

1. Mô tả UEFN như một platform hoàn chỉnh, không rút gọn nó thành “Unreal Editor có Verse”.
2. Phân biệt Editor, Fortnite runtime, Epic services và Creator Portal; biết nơi nào sở hữu state nào.
3. Giải thích vai trò và quan hệ giữa project/content, world authoring, Island Settings, devices, Verse, Scene Graph, gameplay framework, UI, AI, items, abilities, networking, persistence, validation, performance, collaboration và publishing.
4. Suy ra có căn cứ những bài toán Epic muốn giải và những đánh đổi họ chấp nhận.
5. Chọn rõ phần nào PaldarkV5 nên **Adopt**, **Adapt**, **Keep** hoặc **Reject** mà không sao chép máy móc một platform Fortnite.

Đây không phải:

- hướng dẫn dùng MCP;
- giáo trình cú pháp Verse;
- lời khẳng định rằng UEFN là framework phù hợp nguyên xi cho game native C++;
- kế hoạch convert Blueprint;
- tài liệu marketing chỉ liệt kê tính năng.

“Toàn diện” ở đây nghĩa là toàn diện ở **cấp kiến trúc và họ hệ thống**: đủ để thấy boundary, owner, flow và trade-off của UEFN. Nó không phải catalogue của hàng trăm device, hàng nghìn class hay mọi property trong Details panel.

### 0.2. Học cách trình bày từ tài liệu Lyra, nhưng sửa điểm yếu

Tài liệu Lyra mẫu dùng nhịp rất dễ học:

~~~text
mind map → block diagram → problem/solution
→ subsystem → flow → integration
→ worked example → benefits/trade-offs → conclusion
~~~

Bản UEFN này giữ progressive disclosure và diagram-first, nhưng bổ sung những thứ tài liệu mẫu còn thiếu:

- version/build cụ thể;
- nguồn chính thức;
- ranh giới hệ thống và owner của state;
- happy path **và** failure/recovery path;
- nhãn phân biệt fact, quan sát và suy luận;
- mức trưởng thành Stable/Beta/Experimental/Roadmap;
- bài học Paldark không bị trình bày như sự thật của Epic.

### 0.3. Nhãn bằng chứng

| Nhãn | Nghĩa | Có được dùng để chốt Paldark ngay không? |
|---|---|---|
| **EPIC-FACT** | Epic mô tả công khai trong tài liệu hoặc API hiện hành | Có, trong đúng version và boundary |
| **OBSERVED-42** | Quan sát trực tiếp từ UEFN 42.00 đang chạy hoặc file cài đặt | Có, nhưng chỉ là snapshot của build này |
| **INFERENCE** | Suy luận kiến trúc hợp lý từ nhiều fact/observation | Chỉ sau review |
| **ROADMAP** | Epic công bố hướng đi tương lai | Không dùng như capability hiện có |
| **PALDARK-PROPOSAL** | Đề xuất áp dụng cho V5 | Cần ADR/human approval |
| **UNKNOWN** | Chưa đủ evidence hoặc phụ thuộc test runtime | Không được lấp bằng phỏng đoán |

Một câu không có nhãn vẫn phải đọc theo ngữ cảnh gần nhất. Những con số snapshot không được suy rộng thành API guarantee.

### 0.4. Ma trận version

| Đối tượng | Version/snapshot | Vai trò |
|---|---|---|
| Local UEFN | Fortnite Release 42.00, CL 56878558 | Evidence trực tiếp |
| Project UEFNPaldark | compatibility 42.00; Scene Graph/Verse/Python/toolsets enabled | Lab quan sát |
| Epic documentation | kiểm tra ngày 22/08/2026 | Nguồn product/API |
| Course 16 | 6 phần, 18 bài, 11 giờ 24 phút | Giáo trình Verse nhập môn, không phải architecture source |
| PaldarkV5 | Unreal Engine 5.8.1 | Target độc lập với UEFN runtime |
| UE6 | roadmap công bố 22/06/2026 | Hướng tham khảo, không phải baseline |

## 1. UEFN trong một câu

**UEFN là một authoring environment dựa trên Unreal Engine, nhưng target của nó là Fortnite như một live, hosted, cross-platform runtime có policy và service boundary do Epic kiểm soát.**

Câu này quan trọng hơn mọi danh sách feature. Unreal Editor truyền thống thường trao cho studio quyền sửa engine, viết native C++, quyết định server, build và distribution. UEFN trao cho creator rất nhiều công cụ authoring của Unreal, nhưng extension đi qua API được cho phép, content validation, cook service, Fortnite server/client và publishing policy.

Do đó UEFN không phải một lớp duy nhất:

1. **Product shell:** project browser, team, Creator Portal, publishing.
2. **Unreal authoring:** viewport, World Partition, assets, materials, animation, Niagara, audio, UMG.
3. **Gameplay assembly:** Island Settings, Creative devices, direct event binding.
4. **Programmability:** Verse, generated API digests, editable references.
5. **Composition model mới:** Scene Graph entity/component/prefab.
6. **Fortnite gameplay platform:** players, agents, characters, teams, rounds, items, inventory, abilities, AI, camera và UI.
7. **Operational plane:** validation, Content Service, cook, dedicated session, memory calculation, moderation và release.

UEFN vì vậy gần với một **constrained game-development platform** hơn là một sample framework như Lyra.

## 2. Mind map: toàn bộ “cơ thể” UEFN

~~~mermaid
mindmap
  root((UEFN))
    Product boundary
      Project and team
      Fortnite runtime
      Creator Portal
      Publishing and moderation
    Authoring
      Content Browser
      World and actors
      World Partition and HLOD
      Landscape and modeling
      Materials and textures
      Animation and cinematics
      Niagara and audio
      UMG
    Gameplay composition
      Island Settings
      Creative devices
      Events and functions
      Editable references
      Gameplay tags
    Programming
      Verse modules
      Type and effect system
      Failure contexts
      Concurrency
      Generated digests
    Scene Graph
      Entities
      Components
      Hierarchy
      Prefabs
      Lifecycle
    Fortnite domains
      Players teams rounds
      Input and cameras
      AI and NPC
      Items and inventory
      Abilities and effects
      UI and HUD
      Progression persistence
    Operations
      Validation and fix-up
      Content Service and cook
      Dedicated play session
      Live edit and profiling
      Memory budget
      Lore version control
~~~

Ba tầng trừu tượng để đọc sơ đồ:

- **Tầng triết lý:** constrained extensibility, composition, machine-readable contracts, multiplayer/runtime truth, validation before distribution.
- **Tầng hệ thống:** các nhánh trong mind map.
- **Tầng cơ chế:** asset, device property, Verse effect, component lifecycle, cook job, private version.

Nếu nhảy thẳng xuống Verse syntax hoặc một device cụ thể, ta sẽ thấy “cây” nhưng không thấy “rừng”.

## 3. First principles: vì sao Epic phải tạo UEFN?

### 3.1. Bài toán không phải chỉ là “làm editor dễ hơn”

Epic cần thỏa đồng thời nhiều lực kéo vốn mâu thuẫn:

| Lực kéo | Nếu chỉ dùng Unreal Editor truyền thống | Câu trả lời UEFN |
|---|---|---|
| Creator không chuyên code phải lắp được gameplay | C++/Blueprint và packaging có learning curve lớn | Device có option, event và function nhìn thấy được |
| Creator chuyên nghiệp cần logic tùy biến | Device cố định sớm chạm trần | Verse và API Fortnite |
| Một island phải chạy trên toàn bộ Fortnite platforms | Creator có thể dùng asset/API không tương thích | Allowlist, validation, cook và memory gate |
| Gameplay phải test trong runtime thật | PIE không tái tạo đầy đủ hosted Fortnite | Content Service + dedicated session + Fortnite client |
| Nhiều người phải cộng tác trên binary assets | Merge file nhị phân khó và dễ mất việc | OFPA + Lore checkout/revision |
| Epic phải nâng Fortnite liên tục | Public project có thể phụ thuộc implementation nội bộ | Stable public API, generated digests, reference validation |
| Content phải tái sử dụng ở quy mô lớn | Actor class tree và copy asset tạo coupling | Entity/component/prefab và shared content boundary |
| Distribution phải an toàn cho hệ sinh thái | “Build được” chưa đủ điều kiện phát hành | Private version, policy check, moderation, Creator Portal |

### 3.2. Luận điểm trung tâm: tự do trong một hành lang có kiểm soát

**INFERENCE:** ý định xuyên suốt của UEFN là tăng độ tự do authoring mà không trao quyền phá vỡ platform chung.

Creator được tự do về:

- world layout và art direction;
- cấu hình game rules;
- kết hợp capability có sẵn;
- logic Verse trong API surface;
- UI, sequence, material, VFX, audio và custom content được phép.

Epic giữ quyền kiểm soát về:

- public/native runtime surface;
- asset/property/reference nào được chấp nhận;
- cook và dedicated runtime;
- memory/platform constraints;
- publishing, moderation và economy.

Đây không phải hạn chế tình cờ. Nó là điều kiện để hàng triệu experience cùng sống trên một live game đa nền tảng.

### 3.3. Ý định dài hạn, nhưng không nhầm roadmap với hiện tại

Epic gọi Scene Graph là foundational layer hướng tới editor/runtime view thống nhất. Trong công bố [The road to Unreal Engine 6](https://www.unrealengine.com/news/the-road-to-ue-6), Epic nói UE6 sẽ hội tụ hai nhánh UE5 và UEFN, đồng thời nhấn mạnh UEFN là môi trường live nơi programming model mới được battle-test.

Đọc đúng:

- **ROADMAP:** Scene Graph/Verse và model mới ảnh hưởng tương lai Unreal.
- **EPIC-FACT hiện tại:** Actors, devices và Scene Graph đang cùng tồn tại; nhiều Scene Graph/gameplay capability còn Beta hoặc Experimental.
- **Không được suy ra:** PaldarkV5 trên UE5.8.1 phải tự viết Scene Graph clone, hoặc chờ UE6 mới được thiết kế.

## 4. Context diagram: bốn ranh giới thường bị trộn

~~~mermaid
flowchart LR
    subgraph PC[Máy creator]
        Editor[UEFN Editor]
        Project[Project assets and Verse]
        LoreClient[Lore client]
        Editor <--> Project
        Editor <--> LoreClient
    end

    subgraph Epic[Epic services]
        LoreRepo[Lore repository]
        Validate[Validation]
        Content[Content Service and cook]
        Publish[Creator Portal and moderation]
        LoreClient <--> LoreRepo
        Project --> Validate --> Content
    end

    subgraph Runtime[Playtest runtime]
        Server[Fortnite dedicated server]
        Client[Fortnite client]
        Content --> Server
        Content --> Client
        Server <--> Client
    end

    Content --> Private[Private version]
    Private --> Publish --> Release[Published island]
~~~

**Legend:** mũi tên một chiều là artifact/control flow; mũi tên hai chiều là synchronization hoặc runtime protocol. Nó không biểu thị ownership.

### 4.1. Authority matrix

| State/artifact | Authoritative owner | Consumer | Sai lầm phổ biến |
|---|---|---|---|
| Local unsaved edit | UEFN process | creator | tưởng đã thành shared revision |
| Checked-in project revision | Lore repository khi Lore được bật | team/editor | dùng thêm một VCS trên cùng write-set mà không chốt owner |
| Verse source và project asset | project revision | compiler/cook | sửa generated digest |
| Public Fortnite API surface | Epic release | Verse/compiler | dựa vào internal asset hoặc implementation |
| Cooked playtest content | Content Service job/version | server/client | tưởng Save/Compile tương đương runtime deploy |
| Match gameplay state | dedicated server/runtime systems | clients/UI | để widget hoặc editor state làm owner |
| Persistent player data | persistence service theo Verse schema | island runtime | thay schema mà không backward compatibility |
| Publish metadata/release | Creator Portal | Discover/players | tưởng private version đã là public release |

### 4.2. End-to-end lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> Authoring
    Authoring --> LocalValidation
    LocalValidation --> Authoring: lỗi asset/property/reference
    LocalValidation --> UploadCook: hợp lệ
    UploadCook --> Authoring: cook/service lỗi
    UploadCook --> SessionReady
    SessionReady --> Playtest
    Playtest --> Authoring: sửa tiếp
    Playtest --> PrivateVersion: behavior và budget đạt
    PrivateVersion --> PublishReview
    PublishReview --> Authoring: policy/persistence/memory fail
    PublishReview --> Released
    Released --> Authoring: iteration kế tiếp
~~~

Thiết kế này biến “shipping” thành một chuỗi state có gate, không phải một nút Build.

## 5. Project và content model

### 5.1. Project UEFN thực tế gồm những gì?

Một project UEFN tối thiểu có:

- descriptor project và compatibility metadata;
- một project mount/path riêng;
- Game Feature Data làm entry asset;
- một World/map mặc định;
- Island Settings/Experience Settings trong world;
- external actor packages khi dùng OFPA;
- HLOD layer và World Partition metadata;
- Verse source nếu creator thêm logic;
- generated digest phản chiếu API và asset được phép.

**OBSERVED-42 — UEFNPaldark hiện tại:**

| Artifact | Quan sát |
|---|---|
| Project descriptor | compatibility 42.00; Scene Graph, Python và toolsets được bật |
| GameFeatureData | class FortGameFeatureData; PrimaryAssetName UEFNPaldark |
| Default map | /UEFNPaldark/UEFNPaldark |
| Map registry tags | partitioned, actor folders, external actors; streaming đang disabled |
| HLOD | project có DefaultHLODLayer, phụ thuộc Fortnite HLOD material |
| Project assets | 4 registry entries ở root: GameFeatureData, World, HLOD layer, generated Verse digest |
| Project Verse digest | mới có header; chưa có project asset được phản chiếu |

Điều này cho thấy project UEFN không chỉ là thư mục script. Nó là một gói content/game feature được gắn vào Fortnite.

### 5.2. Content Browser là graph asset, không chỉ là ổ đĩa

Asset trong Unreal có:

- class/type;
- object path ổn định trong content namespace;
- registry tags và metadata;
- dependency/referencer edges;
- cooked representation;
- policy về asset nào được public/reference.

World của lab phụ thuộc map assets, day-sequence actor, Fortnite Creative GameMode, HLOD layer và external actor packages. GameFeatureData phụ thuộc default map. Đây là dependency graph máy có thể đọc, không chỉ quan hệ “file nằm cạnh file”.

**Design intent:** content identity và dependency phải tồn tại độc lập với việc creator mở asset bằng UI. Nhờ vậy validation, cook, memory analysis và tooling có thể làm việc trước hoặc ngoài runtime.

### 5.3. Asset reflection: biến binary content thành typed code surface

[Asset Reflection](https://dev.epicgames.com/documentation/fortnite/exposing-assets-with-asset-reflection-to-verse-in-unreal-editor-for-fortnite) sinh Assets.digest.verse để asset đủ điều kiện trở thành Verse identifier. Folder trở thành module; asset name phải tuân quy tắc identifier; digest là generated output, không phải file để sửa tay.

Luồng:

~~~text
uasset đã save + loại asset được hỗ trợ
→ asset registry/reflection
→ generated Verse declaration
→ compiler kiểm tra tên và type
→ Verse dùng asset qua public symbol
~~~

Ý định thiết kế không chỉ là “cho Verse thấy texture”. Epic tạo một **compiler-visible bridge** giữa content authoring và programming.

### 5.4. Bài học cho PaldarkV5

**PALDARK-PROPOSAL:**

- Mỗi gameplay capability phải có content identity ổn định, owner và dependency manifest.
- Blueprint binary cần một digest/generated evidence packet để C++ và con người đọc được; không biến converter output thành source of truth.
- Asset path/reference là một phần của parity contract. C++ compile xanh nhưng mất reference vẫn là thất bại.
- Không copy mô hình GameFeatureData của Fortnite nguyên xi; dùng Unreal Primary Assets/Game Features khi chúng giải đúng bài toán activation và ownership của Paldark.

### 5.5. Content provenance: project, Fortnite và Fab không có cùng quyền

UEFN phân biệt:

- **Project Content:** creator sở hữu/chỉnh được trong boundary project.
- **Fortnite/Epic Content:** curated, nhiều asset read-only và chỉ public subset được reference.
- **Fab content:** có thể được dùng dưới dạng referenced hoặc đưa thành modifiable asset tùy workflow/license/type.
- **Imported source:** phải chuyển thành Unreal asset rồi qua validation/cook.

Design intent là giữ provenance và quyền sử dụng đi cùng content. “Nhìn thấy trong Content Browser” không đồng nghĩa “có thể sửa, reflect vào Verse hoặc publish”.

### 5.6. Project-open cũng là controlled pipeline

**OBSERVED-42:** log mở UEFNPaldark cho thấy chuỗi:

~~~text
set editor permissions
→ gather referenced content
→ validate descriptors
→ sync project/module với Content Service
→ connect revision repository
→ assign Verse paths và feature set
→ install/load project Game Feature
→ gather/build/link Verse/VNI packages
→ generate digests
→ load World Partition map
→ request project-size limits
~~~

**INFERENCE:** ngay cả “mở project” cũng xác lập identity, policy, contract và service state; UEFN không đợi nút Publish mới bắt đầu governance.

## 6. World authoring: từ level tới world có thể stream

### 6.1. Các thành phần

| Thành phần | Trách nhiệm |
|---|---|
| World/Level | container không gian và entry point của island |
| Actor | object model truyền thống của Unreal, vẫn dùng rộng trong UEFN |
| OFPA/External Actors | tách actor trong world thành package riêng để giảm xung đột |
| World Partition | chia world thành grid/cell |
| Streaming source | quyết định cell nào cần load quanh người chơi |
| HLOD | thay nhóm actor xa bằng representation đơn giản hơn |
| Data Layers | nhóm actor theo authoring/runtime scenario |
| Landscape/modeling | tạo địa hình và geometry |
| Environment/lighting | time of day, atmosphere, post process và world look |

[Streaming and HLODs](https://dev.epicgames.com/documentation/fortnite/streaming-and-hlods-in-unreal-editor-for-fortnite) mô tả World Partition, streaming và HLOD như nền cho island lớn, đồng thời cảnh báo cell size/loading range phải phù hợp content thay vì chỉnh tùy tiện.

### 6.2. Vì sao Epic giữ Actor/World Partition song song Scene Graph?

Scene Graph chưa thay thế toàn bộ Unreal world stack. Landscape, world settings, many devices, sequence actors, Fortnite systems và editor tooling vẫn dựa trên Actor/UObject.

**INFERENCE:** Epic đang dùng chiến lược bridge-and-converge:

1. giữ authoring stack đã trưởng thành;
2. đưa entity/component/prefab vào như model mới;
3. cho hai hệ thống cùng tồn tại;
4. mở rộng public bridge qua Verse và generated API;
5. chỉ deprecate model cũ khi model mới đủ trưởng thành.

Đây là bài học migration quan trọng hơn bản thân Scene Graph: không phá hệ sinh thái content để đạt “kiến trúc sạch” ngay lập tức.

### 6.3. Evidence từ map trống

**OBSERVED-42:** map UEFNPaldark hiện có 24 actor descriptors, gồm:

- Island/Experience Settings;
- hai Creative Player Spawner props và hai Fortnite player-start actors;
- WorldDataLayers, WorldPartitionMiniMap và LevelBounds;
- bốn grid-plane actors;
- day-sequence actor;
- SimulationEntity;
- engine/runtime managers.

Không có Data Layer project nào và chưa có Scene Graph entity do creator đặt. “Project trống” vẫn được platform bootstrap bằng nhiều actor/system.

### 6.4. Failure paths

- Streaming tắt hoặc cell/HLOD sai có thể làm memory/performance lệch mục tiêu.
- HLOD không thay runtime profiling; nó chỉ thay representation theo khoảng cách.
- OFPA giảm write collision ở cấp package nhưng không tự giải semantic conflict.
- Data Layer dùng sai owner có thể khiến gameplay actor load/unload ngoài dự kiến.
- Một world chạy trong editor chưa chứng minh dedicated session có đúng content version.

### 6.5. Bài học cho PaldarkV5

- Giữ map, asset path, authored environment và animation content khi refactor gameplay authority.
- Tách world organization khỏi capability ownership.
- Dùng World Partition/HLOD theo evidence của map và target hardware, không như architecture fashion.
- Migration phải cho Blueprint actor, native component và adapter cùng tồn tại theo wave; không yêu cầu “đổi toàn bộ object model” trước khi có parity.

## 7. Island Settings và gameplay lifecycle cấp cao

### 7.1. Island Settings là gì?

[Island Settings](https://dev.epicgames.com/documentation/fortnite/island-settings-in-uefn-and-fortnite-creative) định nghĩa luật experience ở mức toàn cục: mode, rounds, teams, spawn, player/world/UI rules và permissions. Nó không thay thế mọi gameplay system; nó là cấu hình gốc để Fortnite khởi tạo session.

Những khái niệm lifecycle chính:

- **island/experience:** content và rule set được phát hành;
- **session:** một runtime deployment/playtest;
- **game:** một lượt game trong session;
- **round:** phân đoạn cạnh tranh/lặp;
- **playspace:** tập player/agent và rule context;
- **team/class:** phân nhóm ảnh hưởng spawn, friendly rules và loadout;
- **agent/player/fort_character:** các identity/runtime view khác nhau, không được dùng thay nhau tùy tiện.

### 7.2. Luồng bootstrap khái niệm

~~~mermaid
sequenceDiagram
    participant Content as Cooked experience
    participant Server as Fortnite server
    participant Rules as Island settings/runtime managers
    participant Player as Player/agent
    participant Device as Devices/Verse/Scene Graph

    Content->>Server: load project feature and map
    Server->>Rules: initialize island, teams, rounds, spawn rules
    Rules->>Player: admit and assign runtime identity
    Rules->>Device: begin experience/session lifecycle
    Device->>Player: grant capability, UI or objective
    Player->>Server: gameplay input/action
    Server->>Rules: authoritative result
    Rules-->>Device: events/state changes
~~~

Đây là conceptual flow; tên callback cụ thể phụ thuộc API/device/component.

### 7.3. Ý định thiết kế

Epic đặt “mode knobs” mà designer có thể sửa ngoài code, còn behavior chi tiết đi qua device hoặc Verse. Điều đó:

- giảm số script chỉ dùng để đặt default;
- tạo schema mà editor, validation và documentation cùng hiểu;
- giữ rule nền tương thích Fortnite;
- cho template/island variation mà không fork runtime.

### 7.4. Bài học cho PaldarkV5

Paldark cần một **experience definition** hoặc startup manifest rõ, nhưng không nên để một god-object thay GameMode:

- mode/session rules là data;
- authoritative lifecycle nằm ở GameMode/GameState/subsystems phù hợp;
- player identity và pawn/avatar là hai khái niệm;
- feature activation có receipt và cleanup;
- frontend → customization → main world phải là state machine quan sát được.

## 8. Creative devices: capability có thể lắp ráp

### 8.1. Device giải bài toán gì?

Epic gọi devices là core building blocks của game mechanics. Một device thường đóng gói:

- một capability đã có native implementation;
- editable options trong Details panel;
- events phát ra;
- functions nhận vào;
- enable/disable/reset lifecycle;
- team/class/player filters;
- Fortnite-aware presentation hoặc authority.

Ví dụ: Player Spawner, Trigger, Timer, Score Manager, Item Granter, HUD Message, Camera, NPC Spawner, Conversation, Save Point.

**OBSERVED-42:** UEFN hiện tại liệt kê 383 device assets qua public editor surface; 377 nằm trong nhóm content/legacy capability và 6 là Verse/internal device classes. Con số này là inventory snapshot, không phải cam kết API.

### 8.2. Direct Event Binding

[Direct Event Binding](https://dev.epicgames.com/documentation/fortnite/direct-event-binding-in-unreal-editor-for-fortnite) nối event của device A với function của device B bằng identity trực tiếp, thay cho channel number dùng chung.

~~~text
PlayerSpawner.OnPlayerSpawned
    → ItemGranter.GrantItem
    → HUDMessage.Show
~~~

Design improvement so với channel bus:

- dependency nhìn thấy theo device/function;
- không cần quản lý global channel namespace;
- copy một cụm device có thể giữ local relationships;
- API surface được mô tả bằng events/functions thay vì string protocol mơ hồ.

Nhưng direct binding không tự tạo kiến trúc tốt. Một island vẫn có thể thành spaghetti nếu hàng trăm device gọi chéo, tên kém, state owner không rõ và event graph không được kiểm kê.

### 8.3. Editable reference là authoring-time dependency injection

Verse-authored device có thể expose reference/config để designer gán trong editor. Tư duy cốt lõi:

~~~text
code định nghĩa contract và behavior
editor gắn implementation/asset/config cụ thể
compiler + validation kiểm tra type/reference
runtime dùng binding đã cook
~~~

Đây là dependency injection ở authoring time, nhưng không nên hiểu thành một DI container tổng quát.

### 8.4. Device và Scene Graph chưa phải một model duy nhất

Epic ghi rõ Creative devices và Scene Graph components/entities có thể cùng ở một island nhưng không tương thích trực tiếp; custom Verse thường phải làm bridge. Đây là evidence rằng UEFN hiện là kiến trúc chuyển tiếp:

~~~mermaid
flowchart LR
    D[Creative Device world] -->|event/API| V[Verse bridge]
    V -->|entity/component calls| S[Scene Graph world]
    S -->|state/event| V
    V -->|device function| D
~~~

### 8.5. Failure paths và trade-offs

- hidden defaults/contextual options làm behavior khó đoán nếu không capture config;
- binding phụ thuộc identity/name có thể khó đọc khi naming kém;
- device state và Verse state có thể cạnh tranh làm owner;
- input/device round-trip phụ thuộc server latency;
- capability đóng gói giúp nhanh nhưng giới hạn extension sâu;
- Actor/device/Scene Graph bridge tạo thêm lifecycle seam.

### 8.6. Bài học cho PaldarkV5

**Adopt:** capability nhỏ, typed config, event/function contract, explicit dependency.

**Adapt:** mỗi native gameplay feature nên có façade designer-facing bằng BlueprintCallable/events/data assets, nhưng C++/server giữ authority.

**Reject:** “mỗi chức năng = một Actor device đặt trong map” như default architecture. Paldark cần subsystem/component/service owner phù hợp lifetime.

**Gate:** một capability chỉ hoàn tất khi biết input, output, owner, lifecycle, failure reason, cleanup và human scenario; không chỉ vì API gọi được.

## 9. Verse: programming model an toàn trên platform sống

### 9.1. Vai trò thật của Verse

Verse không thay toàn bộ native Fortnite implementation. Nó là ngôn ngữ và contract layer để creator:

- định nghĩa custom device/component;
- gọi public Fortnite/Unreal/Verse APIs;
- phối hợp event, player, entity và asset;
- biểu diễn logic bất đồng bộ;
- lưu state theo schema được phép;
- compile trước khi content được deploy.

Nhiều API Verse có specifier **native**: declaration nằm trong Verse nhưng implementation do C++ cung cấp. Vì vậy kiến trúc thực là:

~~~text
creator Verse
→ generated/public API contract
→ native Fortnite/Unreal implementation
→ validated hosted runtime
~~~

### 9.2. Module và digest là hàng rào kiến trúc

**OBSERVED-42:** ba digest nền hiện lộ 66 public module declarations, phân thành:

- **/Verse.org:** language/runtime primitives, Simulation, SceneGraph, Tags, Concurrency, SpatialMath, Assets, Input, UI;
- **/UnrealEngine.com:** engine-facing types như Assets, UI, Diagnostics, Itemization, Abilities, Conversations, Progression;
- **/Fortnite.com:** Devices, Characters, Teams, Playspaces, Game, AI, Items, Itemization, Abilities, UI, Cameras, Vehicles, Weapons.

Project digest được sinh riêng. Sự phân tầng namespace cho thấy Epic không đưa toàn bộ Fortnite internals thành một global API; creator import contract theo domain.

### 9.3. Type và effect: signature nói cả “làm gì” lẫn “được phép làm gì”

Verse signature có thể diễn đạt:

- input/output type;
- accessibility như public/internal/private;
- có thể fail hay không;
- có mutation có thể rollback hay không;
- có suspend hay không;
- implementation native hay Verse.

Ví dụ khái niệm:

~~~text
FindItem(Id:item_id)<transacts><decides>:item
WaitForReady()<suspends>:void
~~~

Đây là pseudocode, không phải code copy từ project.

**Design intent:** side effect và failure không bị giấu hoàn toàn trong body. Caller phải biết operation có thể fail/suspend và đặt nó trong context hợp lệ. Compiler trở thành một phần của architecture governance.

### 9.4. Failure context và speculative execution

[Speculative execution](https://dev.epicgames.com/documentation/fortnite/speculative-execution) cho phép thử một chuỗi failable expressions trong failure context. Nếu context thành công, effect có thể được commit; nếu fail, phần effect thuộc transaction có thể rollback.

Không nên biến điều này thành khẩu hiệu “mọi Verse transaction đều atomic”:

- API có **no_rollback** không thể tùy ý hoàn tác;
- native implementation có boundary riêng;
- network, audio, VFX hoặc external action không mặc nhiên reversible;
- compiler effect là contract cần đọc theo từng call.

Điểm kiến trúc đáng học là **failure là nhánh bình thường**, không phải chỉ exception hiếm.

### 9.5. Structured concurrency là quản lý lifetime

Verse đặt concurrency vào ngôn ngữ với async expressions và **suspends**. Scene Graph còn mô tả task trong component simulation có thể tự bị cancel khi component disposed hoặc game kết thúc.

Điều này giải ba bài toán:

1. diễn đạt timing/gameplay sequence rõ hơn timer rời rạc;
2. gắn công việc bất đồng bộ với owner lifetime;
3. giảm callback chain không biết ai cleanup.

Nhưng **spawn-and-forget** vẫn có thể tạo race hoặc behavior khó hủy nếu dùng sai construct. Structured syntax không tự thay thế design về cancellation, idempotency và authority.

### 9.6. Verse không giải quyết thay domain design

Một function typed tốt vẫn có thể:

- chọn sai state owner;
- subscribe trùng;
- xử lý player leave sai;
- gọi device và component theo thứ tự sai;
- tạo UI per-player nhưng giữ model global;
- mutate inventory trước khi validation hoàn tất.

Language safety giảm một lớp lỗi; nó không chứng minh gameplay parity.

### 9.7. Bài học cho PaldarkV5

Paldark không cần bắt chước cú pháp Verse. Cần chuyển các ý tưởng thành contract C++:

| Ý tưởng Verse | Cách Adapt trong Paldark |
|---|---|
| type/effect-visible API | typed request/result, const-correctness, authority annotations/conventions |
| failable expression | result chứa status/reason, không trả bool mơ hồ |
| transaction/rollback | Validate → Plan → Commit; compensation chỉ khi thật sự cần |
| structured concurrency | owner-scoped async task/timer/delegate handle |
| module namespace | module/plugin boundary và minimal public header |
| generated digest | machine-readable Blueprint/asset/capability manifest |

Mục tiêu không phải làm “Verse bằng C++”, mà là làm side effect, failure và lifetime khó bị giấu.

## 10. Scene Graph: entity, component, hierarchy và prefab

### 10.1. Bài toán gốc

Actor subclass tree rất mạnh nhưng dễ dẫn tới:

- class kết hợp nhiều trách nhiệm;
- copy/duplicate object thay vì reuse một definition;
- khác biệt giữa editor representation và runtime representation;
- khó đóng gói một object phức hợp có nhiều phần/lifetime;
- inheritance sâu để tạo variation.

Scene Graph trả lời bằng composition:

~~~text
entity = identity + vị trí trong hierarchy
component = một capability/data concern tập trung
parent-child = transform + lifetime relationship
prefab = reusable authored hierarchy
Verse component = custom behavior
~~~

[Epic mô tả Scene Graph](https://dev.epicgames.com/documentation/fortnite/getting-started-in-scene-graph-in-fortnite) là Verse-native system nhằm thống nhất khả năng nhìn và sửa scene ở editor/runtime, đồng thời reuse object qua prefab.

### 10.2. Entity không phải Actor đổi tên

Actor và entity là hai object models cùng tồn tại. Entity:

- có hierarchy tự nhiên;
- nhận behavior/data từ component;
- có thể được sinh từ prefab;
- được Verse truy cập/chỉnh ở runtime;
- có lifetime liên hệ với ancestor.

Actor:

- vẫn là nền của World, Landscape, nhiều device, sequence và hệ thống Unreal trưởng thành;
- dùng UObject reflection/component model truyền thống;
- có replication/tick/editor tooling riêng.

**Sai lầm:** nhìn chữ component rồi kết luận Scene Graph tương đương ActorComponent. Chúng có ý tưởng composition chung nhưng contract, lifecycle và runtime khác.

### 10.3. Component tập trung và quy tắc composition

[Components](https://dev.epicgames.com/documentation/fortnite/components-in-unreal-editor-for-fortnite) cung cấp data/behavior cho entity. Một entity chỉ chứa một component của cùng class/subclass family; khi cần lặp capability, creator thường thêm child entity.

**OBSERVED-42:** editor surface hiện lộ 1.482 entity classes và 170 component classes. Taxonomy thực tế gồm:

| Nhóm | Ví dụ component được quan sát |
|---|---|
| Core | transform, replication, content scope, icon, rarity, stackable |
| Render/presentation | mesh, decal, text display, light, particle, sound, presentation |
| Physics/world | rigid body, physics scene/replication, keyframed movement, streaming, navigation |
| UI/camera | widget/container/grid, viewport root, local HUD, perspective/orthographic camera, camera director |
| AI/NPC | target, decision, awareness, action, behavior, wildlife, sidekick |
| Interaction | interactable, offer, dynamic volume, conversation, persona |
| Item/inventory | item, inventory, loot, pickup, hotbars, ammo, currencies, resources |
| Ability/weapon | ability effect, projectile, trace weapon, weapon mesh |
| Vehicle | engine, wheel, suspension, transmission, aerofoil, thruster |

Các con số này chứng minh breadth của model trong build 42.00; không chứng minh mọi class đều public, stable hoặc publishable.

### 10.4. Hierarchy biểu diễn transform và ownership

Ancestor kiểm soát lifetime descendants: destroy/remove ancestor thì children đi cùng. Local transform mặc định tương đối với parent/origin. Điều này biến Outliner hierarchy thành semantic structure, không chỉ folder để nhìn gọn.

Lợi ích:

- object phức hợp có một root rõ;
- cleanup có thể đi theo tree;
- prefab instance mang nguyên cấu trúc;
- relative transforms và pivot dễ tái sử dụng;
- child capability có owner cụ thể.

Rủi ro:

- hierarchy quá sâu làm dependency ngầm;
- dùng parent chỉ để “xếp folder” có thể vô tình gắn lifetime;
- one-component-per-family có thể ép thêm entity trung gian;
- cross-tree reference vẫn cần identity/tag/API rõ.

### 10.5. Component lifecycle

[Custom Verse component](https://dev.epicgames.com/documentation/fortnite/creating-your-own-component-using-verse-in-unreal-editor-for-fortnite) đi qua các trạng thái:

~~~text
Initialized
→ AddedToScene
→ BeginSimulation
→ EndSimulation
→ RemovingFromScene
→ Uninitializing
~~~

Simulation task có cancellation semantics gắn với dispose/game end. Đây là một thiết kế rất có giá trị: setup, simulation và cleanup là các pha chính thức thay vì convention rời rạc.

### 10.6. Prefab là authored reusable object

Prefab đóng gói entity hierarchy và component values. Instance nhận thay đổi từ definition nhưng vẫn có override. Prefab class được phản chiếu vào Assets.digest.verse để spawn bằng code.

Design intent:

- variation không nhất thiết cần subclass;
- artist/designer author một object hoàn chỉnh;
- code thấy object qua typed asset class;
- sửa definition có thể propagate nhiều instances;
- sharing boundary rõ hơn copy-paste.

### 10.7. Maturity gate

Scene Graph được Epic ghi **Beta**; một số workflow/prefab/itemization vẫn được gắn **Experimental** và có cảnh báo backward compatibility/publishing. Vì vậy:

- học design intent: có;
- làm lab: có;
- coi API hiện tại là ổn định lâu dài: không;
- đưa project production phụ thuộc sâu mà chưa có publish test: không.

### 10.8. Bài học cho PaldarkV5

**Adopt:** composition, lifecycle rõ, prefab/data-driven variation, owner-scoped cleanup.

**Adapt:** Unreal Actor + ActorComponent + UObject/DataAsset + Game Feature hiện hữu đã đủ để áp dụng phần lớn nguyên lý; chưa có evidence cần tự xây ECS/Scene Graph.

**Keep:** authored Blueprint classes/assets như presentation/composition layer khi chúng giữ polish; chuyển authority có kiểm soát sang native seam.

**Reject:** rewrite toàn bộ Actor hierarchy chỉ để giống roadmap UE6. Đây là architecture change ngoài mục tiêu parity và tăng unknown.

### 10.9. Gameplay Tags: semantic query, không phải object identity

Verse tags có thể đánh dấu device/entity rồi tìm theo hierarchy ở runtime. Tag giúp code phụ thuộc vào semantic role thay vì hard reference từng instance:

~~~text
Find descendants tagged Interactable.Chest
→ lọc capability/type
→ thực hiện operation
~~~

Nhưng tag không tự bảo đảm uniqueness, authority hay lifetime. **OBSERVED-42:** local registry có 70.746 tag strings từ toàn Fortnite; breadth đó càng cho thấy phải có namespace/owner.

**Paldark:** dùng Gameplay Tags cho taxonomy/state/capability query; dùng stable ID/reference cho identity; cấm tag string tự phát không đăng ký owner.

## 11. Players, teams, input và camera

### 11.1. Identity layers

UEFN/Fortnite API phân biệt:

- **player:** người chơi tham gia playspace;
- **agent:** thực thể có thể hành động, gồm player hoặc NPC trong nhiều API;
- **fort_character:** avatar/character hiện thân trong world;
- **team/class:** gameplay grouping;
- **playspace:** context chứa players/teams và lifecycle.

Ý nghĩa thiết kế: account/player identity, controller-like actor và physical avatar không phải một object. Respawn có thể thay avatar mà không thay player progression/team/UI context.

### 11.2. Input

Input có thể đến từ:

- Fortnite default control;
- Input Trigger/device abstraction;
- Verse Input APIs/mapping context;
- UI action/button;
- camera/control devices.

Input device round-trip có thể chịu network latency; vì vậy không phải mọi input abstraction phù hợp combat phản xạ nhanh. Platform phân biệt “nhận intent” và “xử lý authority”.

### 11.3. Camera

UEFN cung cấp default Fortnite camera, fixed point/fixed angle/third-person control devices, cinematic camera/Sequencer và Scene Graph camera components. Camera system thường dùng priority/activation thay vì một caller tùy ý chiếm camera mãi.

### 11.4. Bài học cho PaldarkV5

- Player identity, PlayerState/profile, Controller, Pawn và camera mode phải có contract riêng.
- Customization/session transition không được lưu state chỉ trên pawn tạm thời.
- Input mapping là intent layer; server/native gameplay owner quyết định kết quả.
- Camera nên dùng stack/mode với activation token và cleanup, tránh nhiều feature gọi SetViewTarget tranh nhau.

### 11.5. Capability interfaces quanh character

Public fort_character surface compose các concerns như positional, healthful, damageable, healable, shieldable, action instigator và action causer. Damage result còn tách target, amount, instigator và source.

Design intent: character, vehicle, prop hoặc device có thể tham gia một protocol mà không cần chung concrete inheritance tree.

**Paldark:** interaction target, damageable, inventory carrier, rideable và capturable nên là capability contracts; Player/Pal/structure chỉ implement phần cần thiết.

## 12. AI và NPC: data definition + spawn + behavior + navigation

### 12.1. Các lớp hệ thống

[AI and NPCs](https://dev.epicgames.com/documentation/fortnite/ai-and-npcs-in-unreal-editor-for-fortnite) cho thấy workflow không phải một “AI device” duy nhất:

1. **NPC Character Definition:** data mô tả type, appearance và attributes.
2. **NPC Spawner device:** lifecycle/spawn placement và game integration.
3. **NPC behavior:** logic mặc định hoặc custom Verse behavior.
4. **Navigation:** navmesh, modifier/avoidance và world constraints.
5. **Awareness/target/decision/actions:** các capability AI.
6. **Animation/weapon/conversation/persona:** presentation và interaction domain nối vào NPC.

**OBSERVED-42:** component registry có các nhóm target, decision, guard awareness/actions, NPC awareness/actions/behavior, wildlife, sidekick, bot actions và animation. Điều này cho thấy AI được phân rã thành capability, dù public maturity khác nhau.

### 12.2. Ý định thiết kế

Epic tách:

- “NPC này là ai” khỏi “spawn lúc nào”;
- “cảm nhận/ra quyết định” khỏi “thực hiện action”;
- behavior khỏi authored appearance;
- navigation/world constraint khỏi domain goal;
- native Fortnite behavior khỏi custom extension.

Nhờ vậy creator có đường nhanh bằng preset/device và đường sâu hơn bằng custom behavior.

### 12.3. Failure paths

- spawn thành công không đồng nghĩa nav/path hợp lệ;
- NPC leave/despawn cần hủy behavior task/subscription;
- target bị destroy hoặc rời playspace là branch bình thường;
- custom behavior có thể tranh state với native behavior;
- animation/weapon feedback có thể trễ so với authoritative decision.

### 12.4. Bài học cho PaldarkV5

Pal runtime nên tách tối thiểu:

- Pal identity/definition;
- spawned avatar;
- AI controller/brain;
- perception/target;
- action request và committed action;
- authored BT/EQS/animation assets;
- capture/party/PalBox storage identity;
- riding/flying possession mode.

Không convert Pal Blueprint theo file. Convert theo vertical behavior slice có scenario: spawn → acquire target → act → lose target/despawn → cleanup.

### 12.5. Conversation, persona và social behavior

UEFN còn nối NPC với Conversation device/components, contextual reactions và Persona capabilities. Chúng bổ sung một tầng khác với combat AI:

- dialogue graph/content;
- participant identity;
- trigger/choice/result;
- presentation/UI/voice;
- optional personality/service-backed behavior.

Bài học là không nhét dialogue, relationship và combat decision vào cùng “AI brain”. Paldark chỉ nên lấy separation này khi feature thực sự có requirement; Persona/LLM service là Fortnite-specific và không phải dependency đề xuất.

## 13. Items, inventory, abilities và combat

Đây là phần đặc biệt liên quan Paldark, nhưng phải phân biệt capability hiện hành với Experimental surface.

### 13.1. Item là entity có capability, không chỉ row data

[Custom Items and Inventory](https://dev.epicgames.com/documentation/fortnite/custom-items-and-inventory-overview-in-fortnite) mô tả:

- entity có item_component được xem là item;
- icon/description/rarity/stackable/equip capability được thêm bằng component;
- inventory_component biến entity thành container;
- item được đưa vào inventory trở thành child trong hierarchy;
- Fortnite inventory có các specialized subinventory như weapon hotbar, ammo, currencies, resources.

Điều này phân biệt:

- **definition/prefab:** item có thể được tạo thành gì;
- **instance/entity:** item cụ thể trong runtime;
- **container/owner:** inventory nào giữ item;
- **presentation metadata:** icon/name/rarity;
- **stack semantics:** compatibility, split/merge;
- **equipment/ability:** capability khi dùng.

### 13.2. Inventory root và subinventory

[Inventory Component](https://dev.epicgames.com/documentation/en-us/fortnite/inventory-component-in-fortnite) dùng một root entry point và các subinventory có rule riêng. AddItemDistribute có thể tìm container đủ điều kiện thay vì caller biết layout nội bộ.

Design intent:

- consumer gọi façade ổn định;
- container tự enforce capacity/filter;
- inventory tree biểu diễn ownership;
- rule có thể mở rộng bằng component/event;
- Fortnite HUD chỉ tự hiểu configuration chuẩn; custom inventory cần UI riêng.

### 13.3. Ability tách definition, activation context, effect và lifetime

[Ability System](https://dev.epicgames.com/documentation/fortnite/ability-system-in-unreal-editor-for-fortnite) mô tả bốn phần:

1. **Ability:** requirements và activation contract.
2. **Context:** data riêng của một activation.
3. **Effect:** gameplay entity được tạo.
4. **Effect Component:** behavior và lifetime của effect.

Lifecycle bắt đầu bằng CanUse/validation trước khi Use/activation đi tiếp. Timeline/effect points tách các effect như damage, sound, particles, animation, heal, projectile hoặc status effect.

Đây không phải Lyra GAS, nhưng cùng chạm một first principle: **activation request, committed cost/state, runtime effect và presentation không nên là một hàm khổng lồ.**

### 13.4. Trade-offs và maturity

- Custom items/inventory/ability surface đang Beta/Experimental theo từng trang/feature flag.
- Public API có thể đổi; một số project dùng Itemization chưa publish được.
- Component composition có thể tạo graph khó hiểu nếu không có canonical definition/instance identity.
- Scene event filter rất mạnh nhưng có thể giấu transaction path.
- Fortnite inventory semantics không khớp slot counts và Palworld-specific behavior.

### 13.5. Bài học cho PaldarkV5

**Adopt nguyên lý, không copy API:**

- definition ID tách instance ID;
- inventory owner là authority, UI không mutate trực tiếp;
- operation là transaction: validate → plan exact delta → commit → emit result;
- capacity/slot/filter nằm trong domain;
- equip là state transition có receipt/rollback;
- ability request tách committed cost/cooldown và effect lifetime;
- damage đã commit không bị “undo” chỉ vì montage/VFX bị cancel;
- stack split/merge/transfer phải có invariants và retry/idempotency tests.

UEFN cho thấy architecture direction tốt; KYWorld gold behavior vẫn quyết định slot count, timing, failure và presentation của Paldark.

## 14. UI: presentation authoring và runtime authority được nối bằng contract

### 14.1. Ba đường UI cùng tồn tại

[UEFN In-Game UI](https://dev.epicgames.com/documentation/fortnite/ingame-user-interfaces-in-unreal-editor-for-fortnite) hiện có:

1. **UI devices:** HUD Message, Pop-up Dialog, Map Controller, Conversation và các capability đóng gói.
2. **Verse UI:** code tạo widget tree và xử lý per-player logic.
3. **UMG + Verse Fields/Viewmodel:** UMG author layout/style/animation; Verse cập nhật data và nhận event qua reflected binding.

Custom UI được gắn theo từng player. Một widget nhìn giống nhau không có nghĩa state của nó được share.

### 14.2. Data flow đúng

~~~mermaid
flowchart LR
    Runtime[Authoritative gameplay state] --> VM[Player-facing view data]
    VM --> Bind[Verse field/view binding]
    Bind --> UMG[UMG presentation]
    UMG --> Intent[User intent event]
    Intent --> Runtime
    Runtime --> Result[Accepted/rejected result]
    Result --> VM
~~~

Widget không sở hữu inventory, health, quest hoặc purchase. Nó render view data và phát intent.

### 14.3. Vì sao UMG và Verse không loại trừ nhau?

UMG mạnh ở:

- hierarchy/layout;
- style/material;
- animation;
- responsive anchors;
- designer workflow.

Verse mạnh ở:

- per-player runtime state;
- event subscription;
- platform API;
- dynamic creation;
- gameplay decisions.

Verse Fields/MVVM là bridge để giữ mỗi bên ở đúng sở trường. **OBSERVED-42:** UEFN hiện có tool surfaces riêng cho UMG, Verse Fields, Widget Animation và MVVM bindings, cho thấy UI pipeline được thiết kế như nhiều lớp chứ không phải một widget graph duy nhất.

### 14.4. Failure paths

- giữ authoritative data trong widget khiến respawn/recreate UI mất state;
- subscription không cleanup làm duplicate click/update;
- global UI model làm player A thấy state player B;
- animation completion bị coi là gameplay completion;
- binding conversion sai type làm UI im lặng hoặc stale;
- default Fortnite HUD và custom HUD có thể chồng nhau.

### 14.5. Bài học cho PaldarkV5

- Giữ UMG layout, material, animation và asset path đã polish.
- Native ViewModel/presenter đọc state owner và phát immutable/typed view data.
- UI gửi command; domain trả result/reason; toast 2 giây là presentation của result, không phải transaction timer.
- Mỗi screen có lifetime scope để bind/unbind.
- Human A/B gate phải kiểm timing, focus, controller navigation, animation và feedback, không chỉ screenshot.

## 15. Presentation stack và physical simulation gateways

### 15.1. UEFN tái dùng Unreal authoring thay vì viết lại mọi thứ

UEFN mở có chọn lọc các hệ thống trưởng thành:

- Static/Skeletal Mesh và import pipeline;
- Material/Material Instance/texture;
- Niagara particle systems;
- sound/audio devices và components;
- Control Rig, IK Retargeting và animation sequence;
- Sequencer/Level Sequence;
- camera rigs, post process và lighting;
- Landscape/modeling tools.

[Animation and Cinematics](https://dev.epicgames.com/documentation/fortnite/animation-and-cinematics-in-unreal-editor-for-fortnite) cho thấy authored sequence được kích hoạt trong gameplay qua Cinematic Sequence Device hoặc Scene Graph/Verse surface. Đây là một seam rõ:

~~~text
author timeline/content trong tool chuyên dụng
→ lưu thành asset
→ gameplay trigger qua capability contract
→ runtime phát/stop theo lifecycle
~~~

### 15.2. Ý định thiết kế

- Không bắt gameplay programmer tái tạo animation/VFX/audio bằng code.
- Không để content timeline tự quyết gameplay authority.
- Dùng asset identity để reuse/cook/validate.
- Nối tool chuyên ngành vào runtime bằng device/component/API hẹp.

### 15.3. Bài học cho PaldarkV5

Blueprint-to-C++ refactor không được “native hóa” mọi thứ:

- AnimBP, montage, notify, curve, sequence, Niagara, material và sound tiếp tục là authored assets nếu đó là format phù hợp.
- C++ quyết định **khi nào/yêu cầu gì**; asset quyết định **trình bày thế nào**.
- Notify chỉ nên commit gameplay nếu contract và authority yêu cầu; nếu không, notify phát presentation cue.
- Parity evidence phải gồm timing, socket, blend, camera, audio attenuation, material state và cleanup.

### 15.4. Physics không phải một animation effect

Physics trong UEFN có Island Settings/feature maturity riêng, rigid-body/scene/replication components và movement gateways. Sequencer hoặc keyframed visual motion không mặc nhiên thay collision/authority của physics.

**Design intent:** creator chọn đúng simulation gateway cho outcome cần tương tác, trong khi platform giữ budget và networking boundary. Một moving platform “trông như di chuyển” và một object có physical interaction là hai contract khác.

**Paldark:** build placement, projectile, riding/flying và ragdoll phải ghi rõ authority/collision/replication; montage, timeline hoặc transform animation không được làm bằng chứng gameplay hit/movement đã đúng.

### 15.5. Vehicles là composition nhiều capability

**OBSERVED-42:** Scene Graph surface có engine, clutch, transmission, wheel, suspension, aerofoil, thruster, input và modular-vehicle components. Điều này cho thấy vehicle không được xem như một movement function duy nhất.

**Paldark:** riding/flying Pal cần tách seat/occupant, input routing, locomotion mode, camera, physics, stamina/ability, mount lifecycle và network authority. Không đặt tất cả vào PlayerCharacter Blueprint.

## 16. Persistence và progression: schema sống lâu hơn một session

### 16.1. Các lifetime khác nhau

UEFN không dùng một “SaveGame global” cho mọi thứ:

| Lifetime | Ví dụ | Cơ chế |
|---|---|---|
| Task/frame | animation wait, interaction attempt | local state/async scope |
| Round | score/order trong một round | round/session runtime |
| Session | state dùng trong play session | session-scoped weak map/runtime manager |
| Player xuyên session | profile, stat, unlock | player weak_map hoặc persistence capability |
| Device-managed | switch/tracker/timer/save point | persistence devices |
| Published schema | shape của persistent record | backward-compatibility contract |

[Persistable Data in Verse](https://dev.epicgames.com/documentation/fortnite/using-persistable-data-in-verse) mô tả dữ liệu per-player được load khi player join và chỉ truy cập khi player còn trong session. Load fail có thể chặn player join để tránh overwrite dữ liệu cũ.

### 16.2. Persistence là API compatibility, không phải chi tiết serialization

Khi một island đã publish, schema mới phải đọc được data cũ. Publish pipeline còn có persistence backward-compatibility check. Điều đó kéo migration lên thành trách nhiệm thiết kế:

~~~text
stable player identity
→ versioned record
→ default cho field mới
→ migration/compatibility rules
→ load failure policy
→ publish gate
~~~

### 16.3. Progression khác persistence

Persistence trả lời “data sống bao lâu và load/save thế nào”. Progression trả lời:

- mục tiêu nào đã đạt;
- reward/unlock nào được grant;
- rule nào tính tiến độ;
- quest/activity nào đang active;
- data nào thuộc player, team hay island.

**OBSERVED-42:** public module/component surface có Progression, Quest Manager/Participant/Granter và verb/reaction capabilities. Điều này cho thấy Epic tách storage primitive khỏi domain semantics.

### 16.4. Failure paths

- lưu record quá rộng làm migration khó;
- đổi type/xóa field phá compatibility;
- player rời session giữa async save;
- retry grant gây duplicate reward;
- UI hiển thị optimistic progression nhưng server reject;
- save authority bị trộn với runtime Actor instance.

### 16.5. Bài học cho PaldarkV5

- Tách profile, party/PalBox, inventory, world/base và transient combat state.
- Mỗi persistent aggregate có stable ID, schema version, default, migration và compatibility test.
- Không serialize raw Actor/Widget/Blueprint graph.
- Reward/capture/craft grant phải idempotent hoặc có operation ID/receipt.
- Save success không được suy ra từ việc UI đã phát toast.

## 17. Runtime session, multiplayer và authority

### 17.1. UEFN test trong Fortnite, không chỉ trong editor

UEFN không dùng gameplay Blueprint/PIE như một full UE project. Iteration đi qua:

~~~text
local authoring
→ validation
→ module upload/cook
→ Fortnite dedicated server
→ Fortnite client
→ playtest observation
~~~

[Session Inspector](https://dev.epicgames.com/documentation/fortnite/uefn-session-inspector) hiển thị trạng thái Content Service jobs, dependencies, server/client readiness và wall time. Điều đáng học không phải panel UI, mà là việc Epic làm deployment pipeline **quan sát được**.

### 17.2. Các đường iteration

- **Live Edit:** áp dụng transaction/editor change được hỗ trợ vào session.
- **Push Verse Only:** build/push logic Verse phù hợp.
- **Push Changes:** đưa content/module changes cần cook.
- **Full launch/recook:** khi dependency hoặc session state đòi hỏi.

Chúng khác nhau về cost và độ đầy đủ. Fast path không được dùng để chứng minh điều chỉ full cook mới phát hiện.

### 17.3. Authority cần diễn đạt thận trọng

**EPIC-FACT:** playtest dùng Fortnite server/client; playspace/team/player state do runtime Fortnite cung cấp; một số input device chịu RTT.

**INFERENCE:** platform gameplay có server-authoritative boundary.

**Không được tự suy ra:** chi tiết replication/RPC/rollback của Verse giống Unreal C++ project. Creator không được điều khiển raw replication theo cùng surface.

### 17.4. Runtime scope

**OBSERVED-42:** generated API thể hiện hierarchy khái niệm:

~~~text
simulation entity
└─ playspace
   ├─ round manager
   ├─ players/agents
   ├─ teams
   └─ gameplay services
~~~

Round callback/task có lifetime gắn với round. Player và AI có thể cùng đi qua agent ở contract chung, nhưng human player vẫn là identity riêng.

### 17.5. Failure paths phải test

- player join sau khi game bắt đầu;
- player leave trong coroutine/interaction;
- respawn thay fort_character;
- disconnect/reconnect;
- hai clients gửi intent cạnh tranh;
- stale client UI;
- duplicate/replayed command;
- live edit session dùng content version khác local disk;
- server ready nhưng client chưa load xong.

### 17.6. Bài học cho PaldarkV5

Mọi capability có network relevance phải có dedicated/listen scenario tương ứng:

- source of truth ở server/native owner;
- client prediction/presentation được tách;
- join-in-progress state reconstruction;
- idempotency/retry;
- late binding khi pawn/asset chưa sẵn;
- logs chứa player/session/operation identity;
- runtime test là gate, editor observation chỉ là evidence phụ.

## 18. Validation và trust boundary

### 18.1. Vì sao UEFN cần validation sâu?

UEFN project chạy trên hạ tầng và clients của Epic. Creator content không thể được tin như Fortnite source nội bộ. [Validation and Fix-Up](https://dev.epicgames.com/documentation/fortnite/validation-and-fixup-tool-in-unreal-editor-for-fortnite) kiểm:

- allowed type/asset;
- property được phép sửa;
- reference chỉ tới public/stable content;
- texture/platform constraints;
- cookability;
- memory;
- compatibility với implementation Fortnite.

Validation chạy trước upload và lại trên Epic servers. Rule có thể đổi theo release vì platform thay đổi.

### 18.2. Public API không bằng “mọi thứ cài trên máy”

Local installation chứa rất nhiều internal Blueprint, asset và native class. Creator chỉ được reference bề mặt đã publish/allow.

**OBSERVED-42:**

- Valkyrie policy có 26.389 UGC Blueprint allowlist entries và 1.516 class entries;
- asset API tách public assets khỏi epic-internal assets;
- trust tiers gồm general UGC, Early Access, Epic Developer và Partner;
- generated Verse declarations phân biệt public, native, epic_internal, available và deprecated.

Ý nghĩa:

~~~text
implementation có tồn tại
≠ creator được gọi
≠ contract ổn định
≠ project được publish
~~~

### 18.3. Validation là policy as data

**OBSERVED-42:** editor đăng ký 120 validator được quan sát (116 native, 3 Blueprint, 1 custom), bao phủ reference, Game Feature, Blueprint compile/variables, Verse properties, Entity Prefab, persistence, widgets, gameplay tags, world limits, World Partition/HLOD, input, texture/material/mesh và experimental settings.

Con số là build snapshot. Bài học là architecture rules được encode thành executable checks thay vì checklist truyền miệng.

### 18.4. Security/design intent

**INFERENCE:** Epic dùng bốn lớp phòng thủ:

1. **Narrow authoring surface:** không gameplay C++/arbitrary reflection.
2. **Typed public contracts:** Verse modules/digests.
3. **Static policy:** allowlist, property/reference validation.
4. **Hosted processing/runtime:** server validation, cook và Fortnite session.

Không lớp nào một mình đủ.

### 18.5. Bài học cho PaldarkV5

Paldark không cần sandbox creator giống Fortnite, nhưng cần internal trust boundaries:

- plugin/module nào được phụ thuộc module nào;
- asset path nào là public contract;
- Blueprint nào còn giữ authority;
- dynamic load nào được phép;
- persistent schema nào compatible;
- lifecycle handle nào chưa cleanup;
- capability nào thiếu evidence/human gate.

Mỗi rule quan trọng nên có validator/report, không chỉ ghi trong document.

## 19. Memory, streaming và performance

### 19.1. Hai loại bằng chứng không thay nhau

[Memory Management](https://dev.epicgames.com/documentation/fortnite/memory-management-in-unreal-editor-for-fortnite) phân biệt:

- **cook-time memory calculation:** deterministic cho cùng island version, build và device; dùng làm baseline/publish gate;
- **runtime profiling:** đo behavior động, spawn, logic và hotspot khi play.

~~~text
Cook budget trả lời: content nền có vừa không?
Runtime profile trả lời: experience vận hành có ổn không?
~~~

Một kết quả tốt không suy ra kết quả kia.

### 19.2. World Partition/HLOD chỉ là một phần

Performance UEFN còn chịu:

- actor/entity/device count;
- tick/update frequency;
- Niagara/VFX overdraw;
- material complexity/draw calls;
- texture residency;
- audio voice count;
- AI/navigation;
- runtime spawned entities/items;
- UI update frequency;
- network traffic.

### 19.3. Design intent

Epic buộc creator nghĩ cross-platform từ đầu vì cùng release phải phục vụ PC, console, mobile và nhiều client profile. Memory gate là product constraint được đưa vào authoring loop.

### 19.4. Bài học cho PaldarkV5

Mỗi feature dossier nên khai báo:

- hard/soft asset dependencies;
- resident versus streamed;
- spawn/concurrency limits;
- tick/timer/delegate policy;
- pool/lifetime;
- network relevance;
- baseline scenario và stress scenario;
- metric before/after.

Performance không nên đợi W10 mới “polish”; W10 chỉ đóng freeze và regression toàn hệ thống.

## 20. Collaboration và revision ownership

### 20.1. Vì sao binary assets làm collaboration thành vấn đề kiến trúc?

Hai lập trình viên có thể merge text bằng line diff. Hai designer sửa cùng một world/widget/Blueprint binary thường cần checkout, asset-aware diff hoặc chọn một version.

UEFN trả lời bằng:

- OFPA cho world actor packages;
- Lore revision repository;
- auto checkout/lock;
- auto revert khi edit asset người khác đang giữ;
- sync/check-in/history/revert/conflict UI;
- status ngay trong Outliner/Content Browser.

[Lore](https://dev.epicgames.com/documentation/fortnite/lore-version-control-in-unreal-editor-for-fortnite) được Epic mô tả như source of truth của project revision. Epic cảnh báo không bật nhiều VCS trên cùng project location/write-set.

### 20.2. Ý định thiết kế

- ownership hiện ra tại nơi author asset;
- conflict được ngăn trước khi nhiều giờ làm việc bị mất;
- revision gắn description;
- binary state có history/revert;
- collaboration là default template concern, không retrofit muộn.

### 20.3. Trade-offs

- locking giảm conflict nhưng cũng chặn song song;
- một asset quá lớn trở thành bottleneck;
- check-in không thay code review/behavior review;
- Lore không tự hiểu semantic parity;
- external source media vẫn cần policy riêng.

### 20.4. Bài học cho PaldarkV5

Paldark tiếp tục dùng Git/LFS, nhưng cần:

- một source of truth duy nhất cho mỗi write-set;
- capability/asset ownership ledger;
- không cho hai wave sửa cùng Blueprint/package;
- split map/content khi hợp lý;
- candidate commit nhỏ, rollback được;
- không trộn engine migration, architecture refactor và gameplay conversion trong cùng change;
- derived extraction/build output không commit như authored source trừ khi policy nói rõ.

## 21. Publishing và distribution là một system

### 21.1. Flow phát hành

[Publishing Projects](https://dev.epicgames.com/documentation/fortnite/publishing-projects-in-unreal-editor-for-fortnite) tách UEFN khỏi Creator Portal:

~~~text
launch/cook session
→ memory calculation
→ private version
→ playtest/review
→ Creator Portal metadata
→ rating, attribution, media
→ moderation
→ visibility/release
~~~

UEFN không publish thẳng. “Có private version” chưa phải “đã public”.

### 21.2. Ý định thiết kế

Epic coi release là tổ hợp:

- technical correctness;
- platform performance;
- data compatibility;
- legal/attribution;
- audience rating;
- safety/moderation;
- product metadata và discoverability.

Một executable chạy được không phải toàn bộ product.

### 21.3. Bài học cho PaldarkV5

Release candidate phải là artifact định danh được, đi qua:

- source tag/commit;
- content/reference validation;
- compile/cook/package;
- runtime smoke;
- parity suite;
- performance budget;
- save migration check;
- known deviation register;
- human sign-off;
- rollback drill.

Đó là phiên bản Paldark của “private version → publish”, không phải copy Creator Portal.

### 21.4. Ecosystem và economy cũng tác động architecture

Creator Portal, matchmaking, Discover, engagement/economy và in-island transaction APIs biến một island thành sản phẩm trong ecosystem, không chỉ executable. Điều đó giải thích vì sao identity, moderation, persistence, localization, UI input và backward compatibility được platform coi trọng.

Paldark không sao chép Fortnite economy. Bài học chuyển được là: product requirement ngoài combat — account, entitlement, localization, save compatibility và release policy — phải xuất hiện trong architecture sớm nếu nằm trong scope.

## 22. Kiến trúc hybrid: Blueprint, Actor, Device và Scene Graph cùng tồn tại

Đây là kết luận quan trọng nhất từ archaeology trực tiếp.

### 22.1. Creator không có gameplay Blueprint, nhưng Fortnite vẫn dùng Blueprint

[UEFN vs UE](https://dev.epicgames.com/documentation/en-us/fortnite/uefn-vs-ue-in-unreal-editor-for-fortnite) nói gameplay Blueprint visual scripting không mở cho creator. Điều đó **không** có nghĩa runtime UEFN “không có Blueprint”.

**OBSERVED-42:**

- blank project dùng BP_Creative_Player_Spawner_Prop_C;
- Island Settings là Device_ExperienceSettings_V2_UEFN_C;
- allowlist chứa hàng chục nghìn Blueprint-generated classes;
- Epic implementation là hỗn hợp C++, Blueprint và Fortnite systems.

Mô hình đúng:

~~~text
Epic implementation
  C++ + Blueprint + engine/Fortnite systems

Creator surface
  curated asset/device
  + typed properties/events
  + Verse
  + Scene Graph
  + validation
~~~

### 22.2. Creator project là một Game Feature Plugin được quản trị

**OBSERVED-42:** UEFNPaldark.uplugin cho phép content và Verse, được explicitly loaded, không built-in auto-activate; GameFeatureData là FortGameFeatureData. Editor/Valkyrie install rồi load project như một Game Feature Plugin.

Điều đó giải thích nhiều thứ:

- project có module identity;
- Fortnite là host;
- activation/load do platform điều phối;
- dependency và content path có boundary;
- creator không sở hữu full game executable.

### 22.3. Typed bridges nối các object model

Generated API có bridge khái niệm giữa:

- Creative device/object và simulation entity;
- fort_character và entity;
- entity và playspace;
- asset/prefab và generated Verse class.

**INFERENCE:** Epic đang migration bằng coexistence + adapters, không bằng big-bang rewrite.

### 22.4. Bài học trực tiếp cho Blueprint-to-C++ Paldark

Đừng đặt mục tiêu “xóa Blueprint”. Đặt mục tiêu:

1. xác định state/behavior authority;
2. tạo native contract ở seam;
3. giữ Blueprint asset làm composition/presentation khi phù hợp;
4. adapter giữ asset path và authored references;
5. chuyển từng behavior slice;
6. A/B parity;
7. chỉ loại legacy authority khi không còn consumer.

UEFN là bằng chứng thực tế rằng một platform rất lớn có thể tiến hóa object/programming model trong nhiều thế hệ mà vẫn chạy hệ thống cũ.

## 23. Các flow liên hệ toàn hệ thống

### 23.1. Content-to-runtime

~~~text
Import/Create Asset
→ Project Content và registry dependency
→ Save + asset reflection/digest
→ Device/Component/Prefab reference
→ Validation
→ Upload/Cook
→ Dedicated Session
→ Runtime/memory/multiplayer observation
→ Private Version
→ Moderation/Publish
~~~

### 23.2. Device gameplay

~~~text
Player/world event
→ Direct Binding hoặc Verse subscription
→ Device function/Verse orchestration
→ Fortnite authoritative runtime state
→ result event
→ UI/audio/VFX presentation
~~~

### 23.3. Scene Graph object

~~~text
Authored assets
→ focused components
→ entity hierarchy
→ prefab definition
→ shared instances + overrides
→ lifecycle/streaming
→ runtime query/spawn/change
~~~

### 23.4. Persistent action

~~~text
Intent
→ validate identity/rule/capacity
→ commit authoritative change
→ issue receipt/result
→ update presentation
→ persist versioned record
→ compatibility/publish gate
~~~

### 23.5. Integration matrix

| Consumer | Provider | Contract | Owner | Typical failure |
|---|---|---|---|---|
| Verse logic | Device | event/function + editable ref | device/runtime | disabled, missing binding, player invalid |
| Verse | Asset | generated digest symbol | project content | unsaved/unsupported/name collision |
| Scene Graph component | Entity hierarchy | parent/component/lifecycle | ancestor/entity | disposed, wrong phase, duplicate family |
| UI | Runtime state | per-player view data/binding | gameplay owner | stale player/widget recreated |
| Ability | Inventory/resource | validation/context/result | server/domain | cost/cooldown/target invalid |
| AI behavior | NPC/navigation | capability interfaces | NPC/playspace | target gone, nav fail, despawn |
| Cook | Project graph | allowed references/schema | Epic service | illegal asset/property/dependency |
| Publish | Private version | memory/policy/schema evidence | Creator Portal | moderation, compatibility, budget |

UEFN không phải tập các subsystem độc lập. Giá trị nằm ở contract giữa chúng.

## 24. Ý định thiết kế của Epic — synthesis có căn cứ

Phần này là **INFERENCE**, không phải trích nguyên văn một manifesto của Epic. Mỗi nguyên tắc được suy ra từ nhiều hệ thống độc lập.

### 24.1. Professional authoring, constrained execution

**Evidence:** UEFN giữ viewport/content/material/animation/UMG của Unreal nhưng không mở gameplay C++/Blueprint; project qua public API, validation và hosted runtime.

**Intent suy ra:** creator dùng công cụ cấp studio trong một execution boundary đủ an toàn cho live platform.

**Paldark:** tách authored content freedom khỏi quyền mutate authoritative state.

### 24.2. Progressive disclosure

~~~text
Island defaults
→ configurable device
→ direct binding
→ Verse orchestration
→ custom component/prefab
~~~

Người mới có playable result sớm; người có kỹ năng sâu dần không bị khóa ở preset.

**Paldark:** một capability nên có default hợp lý, designer surface, native extension seam và deep diagnostics; không buộc mọi người chạm class internals.

### 24.3. Composition trước inheritance sâu

**Evidence:** device capability façade, Scene Graph focused component, prefab instance/override, fort_character capability interfaces.

**Paldark:** Actor/Component/DataAsset/interface có thể đạt mục tiêu này mà chưa cần object model mới.

### 24.4. Definition, instance, context và presentation là các identity khác nhau

**Evidence:** NPC Character Definition khác Spawner/instance/behavior; prefab khác instance; ability khác activation context/effect; item definition khác entity/inventory; UMG khác per-player state.

**Paldark:** đây là nguyên tắc bắt buộc cho Pal, item, action và UI.

### 24.5. Dependency phải nhìn thấy được

**Evidence:** direct event binding, editable reference, asset registry edges, module imports, digests, plugin dependency, allowlist.

**Paldark:** cấm string path/event name rải rác làm core contract; generated manifest phải liệt kê dependency và consumer.

### 24.6. Content-code bridge phải được sinh bằng máy

**Evidence:** Verse/Unreal/Fortnite digests và Assets.digest.verse.

**Paldark:** Blueprint evidence digest phải deterministic, versioned và read-only; LLM đọc digest nhưng không làm authority.

### 24.7. Lifecycle là một phần của API

**Evidence:** device enable/disable, Scene Graph component phases, hierarchy-owned lifetime, round/session scope, cancel semantics.

**Paldark:** activation receipt, delegate/timer/task owner và deactivation cleanup phải bắt buộc.

### 24.8. Failure là normal control flow

**Evidence:** Verse decides/failure context, item/inventory validation, ability CanUse, validation/cook/publish gates.

**Paldark:** domain operation trả exact failure reason; invalid/retry không mutate.

### 24.9. Runtime thật là truth

**Evidence:** dedicated session, Fortnite client, Session Inspector, multiplayer preview và cook pipeline.

**Paldark:** compile/editor simulation không thay packaged/dedicated parity.

### 24.10. Governance by construction

**Evidence:** public/internal surface, allowlist, validator, memory gate, schema compatibility, moderation.

**Paldark:** architecture rules phải có executable check và release evidence.

### 24.11. Collaboration phải được thiết kế từ template

**Evidence:** blank project đã có OFPA, partition metadata và Lore; binary ownership hiện ngay trong editor.

**Paldark:** chốt file/asset owner, LFS và wave boundary trước khi bulk conversion.

### 24.12. Evolution qua bridge, không qua hard break

**Evidence:** Actor/Blueprint Device và Scene Graph cùng tồn tại; API bridge; Epic roadmap nói đưa existing projects theo con đường chuyển đổi quản lý được.

**Paldark:** native seam + adapter + parity + gradual authority transfer là chiến lược mặc định.

## 25. Trade-offs, maturity và những giới hạn thật

Một architecture review khách quan phải nói cả giá phải trả.

### 25.1. Trade-offs nền tảng

| Lợi ích UEFN | Giá phải trả |
|---|---|
| Fortnite runtime, matchmaking, distribution có sẵn | không sở hữu engine/runtime/networking surface |
| Device cho playable result rất nhanh | hidden defaults và event graph có thể phình |
| Verse public API typed | không truy cập arbitrary native/reflection |
| Hosted validation/cook | phụ thuộc service, iteration có latency |
| Cross-platform target mặc định | asset/memory/property bị giới hạn |
| Scene Graph composition/prefab | coexistence complexity, API còn đổi |
| Lore asset-aware workflow | locking và source-of-truth constraint |
| Creator Portal distribution | policy/moderation ngoài technical build |

### 25.2. Ma trận maturity snapshot 42.00

| Hệ thống | Mức nên ghi | Hệ quả quyết định |
|---|---|---|
| Core Creative Devices | nền chính; từng device có trạng thái riêng | dùng được nhưng vẫn capture version/default |
| Verse language/runtime | production creator surface, phát triển liên tục | pin release/API |
| Scene Graph core | Beta | học/ship có thận trọng và recovery |
| Custom Items/Inventories | Beta + Experimental capability | không lấy API shape làm stable target |
| Ability System | Experimental trong 42.00 | chỉ dùng làm design evidence/lab |
| Physics | Beta | test platform/device cụ thể |
| NPC Character Definition | Early Access | không coi schema ổn định |
| NPC Spawner | Beta | có runtime gate |
| Camera/movement APIs | feature-specific Beta/Experimental | đọc banner theo đúng page/release |
| Lore | integrated production workflow | vẫn cần team policy |

Nếu docs banner và release notes xung đột, ghi cả hai, ưu tiên release hiện hành và mở UNKNOWN thay vì chọn câu thuận tiện.

### 25.3. Những failure mode kiến trúc

1. **Device spaghetti:** event/function edge nhiều nhưng không có owner.
2. **Hybrid lifecycle race:** device bắt đầu trước/sau Scene Graph component khác dự kiến.
3. **Generated-name fragility:** move/rename asset làm digest symbol đổi.
4. **Service/version mismatch:** local edit, cooked module và client không cùng revision.
5. **Sandbox false confidence:** asset thấy trong install nhưng không public/reference được.
6. **Beta churn:** prefab/component/schema thay đổi giữa release.
7. **Lock contention:** binary asset quá lớn làm team không song song được.
8. **Static-budget blind spot:** cook memory xanh nhưng runtime spawn/VFX/AI quá tải.
9. **Persistence lockout:** schema không compatible làm player không join.
10. **Presentation authority leak:** UI/notify/sequence quyết định gameplay outcome.

## 26. UEFN và Lyra: cùng học được, nhưng không cùng cấp độ

| Trục | Lyra | UEFN |
|---|---|---|
| Bản chất | sample game/framework architecture trên UE | hosted creator platform chạy trong Fortnite |
| Quyền developer | C++/Blueprint/source project rộng | creator surface bị quản trị |
| Modularity | Game Features, Experience, Modular Gameplay | creator Game Feature module + devices/Verse/Scene Graph |
| Gameplay model | Unreal Actor/Component, GAS, Enhanced Input | Fortnite capabilities, devices, Verse, hybrid Scene Graph |
| Runtime | studio tự build/deploy | Epic service + Fortnite server/client |
| Distribution | ngoài phạm vi Lyra | Creator Portal/moderation/Discover là core |
| Validation | engine/project conventions và tests | enforced allowlist/property/reference/cook/memory |
| Mục tiêu học | cấu trúc một game multiplayer modular | cấu trúc một ecosystem creator an toàn, có thể vận hành |

Hai nguồn bổ sung nhau:

- Lyra dạy cách tổ chức native multiplayer game và feature activation.
- UEFN dạy cách thiết kế public capability surface, generated contract, controlled composition, validation và live operational loop.

Không dùng UEFN để “chứng minh Lyra sai” hoặc ngược lại. Chúng giải hai bài toán có giao nhau nhưng boundary khác.

## 27. Ma trận Adopt / Adapt / Keep / Reject cho PaldarkV5

### 27.1. Adopt — lấy nguyên lý

| Bài học | Quyết định Paldark đề xuất |
|---|---|
| Capability có config/command/query/event/lifecycle | chuẩn hóa native capability contract |
| Definition khác instance/context | bắt buộc cho Pal, item, ability/action, building |
| Generated digest | sinh Blueprint/asset/capability evidence manifest |
| Owner-scoped lifecycle | activation receipt + cleanup ledger |
| Validate trước commit | transaction API cho inventory/craft/build/capture |
| Runtime truth | packaged/dedicated/human parity gates |
| Versioned persistence | schema + migration + compatibility suite |
| Architecture validation | static dependency/reference/owner checks |

### 27.2. Adapt — chuyển ý tưởng sang Unreal 5.8.1

| UEFN mechanism | Paldark adaptation |
|---|---|
| Scene Graph component | ActorComponent/UObject service/interface nhỏ |
| Prefab | Blueprint class/DataAsset/PrimaryAsset/composition asset |
| Verse editable | UPROPERTY/data asset/config có typed validation |
| Verse effect/failure | typed result + Validate/Plan/Commit |
| Device direct binding | delegate/message contract có owner và manifest |
| Assets.digest | Asset Registry + BPScaffold/graph evidence digest |
| Content Service/private version | CI cook/package + candidate artifact/tag |
| Memory/publish gate | performance/reference/parity release gate |

### 27.3. Keep — không convert chỉ vì có thể

- Map, landscape, World Partition/HLOD setup.
- Blueprint class dùng để author composition và defaults.
- AnimBP, montage, notify, Control Rig/sequence.
- UMG widget tree, animation, material và style.
- Niagara, audio, material/texture/mesh.
- DataTable/DataAsset khi chúng là authored definitions phù hợp.
- BT/EQS và AI authored assets nếu runtime contract vẫn đúng.

### 27.4. Reject — không sao chép

- Verse runtime/language clone.
- Scene Graph/ECS tự viết khi chưa có requirement.
- Mỗi mechanic là một level Actor/device.
- Global event bus không owner/lifetime.
- Fortnite-specific playspace/island/publishing model.
- Lore trên cùng write-set với Git/LFS.
- API Experimental làm foundation không có adapter.
- “Xóa hết Blueprint” như metric thành công.

## 28. Target architecture PaldarkV5 rút ra từ UEFN

Đây là **PALDARK-PROPOSAL**, cần được chốt bằng ADR trước code.

~~~mermaid
flowchart TB
    Gold[Immutable KYWorld reference and behavior atlas]
    Evidence[Generated Blueprint and asset evidence]
    Contracts[Paldark Core contracts and typed results]
    Domains[Native domain capability owners]
    Adapters[Blueprint and asset adapters]
    Presentation[UMG AnimBP VFX Audio authored presentation]
    Runtime[UE 5.8.1 server and clients]
    Gates[Static runtime human parity gates]

    Gold --> Evidence
    Evidence --> Contracts
    Contracts --> Domains
    Domains <--> Adapters
    Adapters --> Presentation
    Domains --> Runtime
    Presentation --> Runtime
    Runtime --> Gates
    Gates -->|failure| Evidence
~~~

### 28.1. Layer responsibilities

| Layer | Sở hữu gì | Không được sở hữu |
|---|---|---|
| Gold reference | behavior thực tế, assets và config gốc | candidate changes |
| Evidence plane | manifest, graph, defaults, references, scenarios | gameplay authority |
| Core contracts | identity, tags, requests/results, lifecycle vocabulary | feature implementation |
| Domain owners | canonical state và transactions | UMG presentation details |
| Adapters | nối legacy Blueprint/assets vào contract | canonical duplicated state |
| Presentation | layout, animation, audio/VFX feedback | inventory/combat/save outcome |
| Runtime | authoritative session/network state | assumptions từ editor |
| Gates | proof, deviations, rollback | feature behavior |

### 28.2. Capability anatomy bắt buộc

Mỗi capability cần:

~~~text
Identity
Definition/configuration
Owner and authority
Commands
Queries
Events
Lifecycle
Failure reasons
Persistence/network policy
Presentation receipts
Validation
Human scenarios
Rollback seam
~~~

### 28.3. Dependency direction

~~~text
Paldark Core
   ↑
Domain capability modules
   ↑
UE adapters and authored Blueprint façades
   ↑
UI/presentation/content
~~~

Cross-domain mutation phải đi qua contract. UI hoặc Blueprint consumer không include/cast vào concrete private owner chỉ để lấy state.

### 28.4. Migration state machine

~~~mermaid
stateDiagram-v2
    [*] --> Observed
    Observed --> Characterized: behavior and evidence complete
    Characterized --> Seamed: native contract plus adapter
    Seamed --> Shadowed: native path runs without authority
    Shadowed --> Authoritative: parity approved
    Authoritative --> LegacyRemoved: no consumer and rollback window closed
    Characterized --> Observed: missing evidence
    Shadowed --> Seamed: mismatch
    Authoritative --> Seamed: rollback
~~~

Không wave nào được nhảy từ “đã export graph” sang “LegacyRemoved”.

## 29. Các quyết định phải chốt trước implementation

Tài liệu này hỗ trợ quyết định; nó không tự chốt thay owner.

### 29.1. Đề nghị duyệt V5-ADR-013

> **UEFN Reference Boundary:** UEFN là reference architecture và experimental lab. PaldarkV5 áp dụng nguyên lý có evidence, không phụ thuộc UEFN/Verse runtime. Tool nghiên cứu không ảnh hưởng target architecture.

### 29.2. ADR tiếp theo cần có

| ADR | Câu hỏi phải chốt |
|---|---|
| Composition model | ActorComponent/UObject/DataAsset/Game Feature dùng ở trường hợp nào? |
| Authority model | server, PlayerState, component, subsystem hay aggregate nào sở hữu mỗi domain state? |
| UI boundary | ViewModel/result/event contract chuẩn là gì? |
| Transaction model | Validate/Plan/Commit/Receipt và idempotency dùng thế nào? |
| Async lifecycle | task/timer/delegate handle được scope/cancel ra sao? |
| Asset contract | hard/soft/reference policy và generated digest schema |
| Persistence | aggregate, version, migration và rollback |
| Feature activation | dependency DAG, receipt và deactivation guarantee |
| Validation | rule nào phải tự động fail CI/editor |
| Release evidence | artifact/tag, parity suite, human sign-off và deviation policy |

### 29.3. Human gate cho chính tài liệu kiến trúc

Trước khi dùng document làm foundation:

1. Owner đọc được mind map và tự kể lại bốn boundaries.
2. Chỉ ra được ít nhất ba chỗ UEFN hybrid thay vì “Scene Graph thay tất cả”.
3. Review ma trận Adopt/Adapt/Keep/Reject.
4. Không còn câu nào biến ROADMAP/Beta thành fact production.
5. Mỗi PALDARK-PROPOSAL được chuyển thành ADR, UNKNOWN hoặc bị reject.
6. Course/roadmap implementation chỉ được cập nhật sau quyết định.

## 30. Lộ trình học UEFN như một architecture course

Mỗi module dùng cùng grammar: **problem → boundary → components → owner → flow → failure → lab → Paldark inference**.

| Module | Nội dung | Lab quan sát | Exit evidence |
|---|---|---|---|
| U0 | Product boundary và four-plane model | mở project, phân biệt local/revision/session/release | authority matrix tự giải thích được |
| U1 | Project/Game Feature/content graph | xem GameFeatureData, map, HLOD, dependencies | project context diagram |
| U2 | World/Actor/WP/OFPA | kiểm actor descriptors, partition, HLOD/Data Layer | world ownership map |
| U3 | Island Settings/device | tạo rule + hai device direct binding | binding inventory + failure test |
| U4 | Verse programming model | typed editable, failable function, scoped async | compile + cancellation evidence |
| U5 | Scene Graph | entity/component/prefab/lifecycle | prefab instance + cleanup observation |
| U6 | Player/input/camera/UI | per-player UI và camera policy | two-player visibility/ownership test |
| U7 | AI/NPC | definition, spawner, behavior, nav failure | spawn/despawn/target-loss trace |
| U8 | Item/inventory/ability | definition-instance-context-effect | rejected transaction leaves no mutation |
| U9 | Presentation | sequence/VFX/audio activation | gameplay state independent from playback |
| U10 | Persistence | versioned player record | reload + incompatible schema test plan |
| U11 | Session/network | push path, JIP, leave/retry | dedicated multi-client record |
| U12 | Validation/performance/publish | illegal ref, cook budget, private version | full gate report |
| U13 | Architecture transfer | map evidence to Paldark ADRs | reviewed Adopt/Adapt/Keep/Reject |

### 30.1. Course 16 nằm ở đâu?

Local Course 16 có 6 phần/18 bài:

- Verse fundamentals;
- device editables/optionals;
- Fortnite APIs/interfaces;
- một Oneshot exercise;
- Verse UI và persistence;
- Gun Game capstone.

Chính course overview nói khóa học **không** bao phủ in-depth UEFN design. Vì vậy:

- dùng Course 16 cho U3, U4, một phần U6/U10;
- không dùng nó làm source cho Scene Graph, Game Feature project model, World Partition, trust boundary, item/ability mới, Lore, Content Service hay publishing architecture;
- mọi syntax/API cũ phải kiểm với release 42.00.

Đây không phải phê bình khóa học; nó đang làm đúng vai trò Verse beginner course. Sai lầm trước đây là yêu cầu một course ngôn ngữ trả lời câu hỏi architecture platform.

## 31. Evidence trực tiếp từ UEFNPaldark 42.00

### 31.1. Snapshot định lượng

| Surface | Quan sát | Cách đọc đúng |
|---|---:|---|
| Root project assets | 4 | project mới, không đại diện platform breadth |
| Actor descriptors trong map | 24 | gồm bootstrap/runtime/editor actors |
| External actor packages | 10 | authored blank-map packages |
| Data Layers project | 0 | feature có sẵn nhưng lab chưa dùng |
| Scene Graph entities đặt bởi creator | 0 | enabled không có nghĩa đã authored |
| Device assets editor catalog | 383 | content placement surface |
| Verse-exposed device classes | 141 | code API surface, không cùng định nghĩa với 383 |
| Device listenable fields | 415 | occurrence/API snapshot |
| Enable/Disable pairs | 112/112 | pattern capability, không phải mọi device |
| Entity classes visible | 1.482 | gồm public/internal/templated classes |
| Component classes visible | 170 | maturity và publishability khác nhau |
| Registered gameplay tags | 70.746 | Fortnite registry breadth, không phải tất cả project-owned/public |
| Public module declarations | 66 | trong ba built-in digest roots |
| UGC Blueprint allowlist | 26.389 | Epic curated runtime surface |
| Validators observed | 120 | build-specific registry |

Các con số khác nhau không “mâu thuẫn” nếu chúng đo các tập khác nhau. Document luôn ghi definition của count.

### 31.2. Local evidence paths

- E:/Buckminsterfullerene02/Soliz-Devin-Palworld/UEFNPaldark/UEFNPaldark.uefnproject
- E:/Buckminsterfullerene02/Soliz-Devin-Palworld/UEFNPaldark/UEFNPaldark.uplugin
- E:/Buckminsterfullerene02/Soliz-Devin-Palworld/UEFNPaldark/Content/GameFeatureData.uasset
- E:/Fortnite/FortniteGame/Plugins/VerseDevices/ScriptTemplates/DeviceTemplate.verse
- E:/Fortnite/FortniteGame/Plugins/ValkyrieFortnite/ValkyrieSentryManifest.json
- E:/Fortnite/FortniteGame/Plugins/ValkyrieFortnite/ValkyriePluginAPI.json
- C:/Users/soliz/AppData/Local/UnrealEditorFortnite/Saved/VerseProject/UEFNPaldark/Digests/
- C:/Users/soliz/AppData/Local/UnrealEditorFortnite/Saved/Logs/UnrealEditorFortnite.log

Đây là machine-local snapshot, không phải portable source link. Khi release đổi, rerun inventory và ghi delta.

### 31.3. Research method — chỉ là phương tiện

Việc khảo sát dùng bốn nguồn:

1. tài liệu chính thức Epic;
2. project/install manifests và generated digests;
3. asset registry, class/component/device inventories và editor log;
4. các read-only editor queries để xác nhận world/project state.

MCP chỉ giúp gọi một số read-only query có schema vào UEFN đang chạy. Nó không có chương kiến trúc riêng, không tham gia runtime target và không chứng minh design intent một mình.

## 32. Claim ledger và nguồn chính thức

### 32.1. Product và editor boundary

- [UEFN vs UE](https://dev.epicgames.com/documentation/en-us/fortnite/uefn-vs-ue-in-unreal-editor-for-fortnite)
- [UEFN User Interface Reference](https://dev.epicgames.com/documentation/en-us/fortnite/user-interface-reference-for-unreal-editor-for-fortnite)
- [The road to Unreal Engine 6](https://www.unrealengine.com/news/the-road-to-ue-6)

### 32.2. Project, content và world

- [Starting and Organizing a Project](https://dev.epicgames.com/documentation/fortnite/starting-and-organizing-a-project-in-fortnite)
- [Asset Reflection](https://dev.epicgames.com/documentation/fortnite/exposing-assets-with-asset-reflection-to-verse-in-unreal-editor-for-fortnite)
- [Streaming and HLODs](https://dev.epicgames.com/documentation/fortnite/streaming-and-hlods-in-unreal-editor-for-fortnite)
- [Island Settings](https://dev.epicgames.com/documentation/fortnite/island-settings-in-uefn-and-fortnite-creative)

### 32.3. Gameplay composition và programming

- [Getting Started with Devices](https://dev.epicgames.com/documentation/fortnite/getting-started-with-devices-in-fortnite)
- [Direct Event Binding](https://dev.epicgames.com/documentation/fortnite/direct-event-binding-in-unreal-editor-for-fortnite)
- [Book of Verse](https://dev.epicgames.com/documentation/fortnite/verse-language-book-of-verse-reference)
- [Speculative Execution](https://dev.epicgames.com/documentation/fortnite/speculative-execution)

### 32.4. Scene Graph và gameplay domains

- [Getting Started in Scene Graph](https://dev.epicgames.com/documentation/fortnite/getting-started-in-scene-graph-in-fortnite)
- [Working with Entities and Components](https://dev.epicgames.com/documentation/fortnite/working-with-entities-and-components-in-unreal-editor-for-fortnite)
- [Creating a Verse Component](https://dev.epicgames.com/documentation/fortnite/creating-your-own-component-using-verse-in-unreal-editor-for-fortnite)
- [Custom Items and Inventory](https://dev.epicgames.com/documentation/fortnite/custom-items-and-inventory-overview-in-fortnite)
- [Ability System](https://dev.epicgames.com/documentation/fortnite/ability-system-in-unreal-editor-for-fortnite)
- [AI and NPCs](https://dev.epicgames.com/documentation/fortnite/ai-and-npcs-in-unreal-editor-for-fortnite)

### 32.5. UI, runtime và operations

- [In-Game User Interfaces](https://dev.epicgames.com/documentation/fortnite/ingame-user-interfaces-in-unreal-editor-for-fortnite)
- [Session Inspector](https://dev.epicgames.com/documentation/fortnite/uefn-session-inspector)
- [Using Persistable Data](https://dev.epicgames.com/documentation/fortnite/using-persistable-data-in-verse)
- [Validation and Fix-Up](https://dev.epicgames.com/documentation/fortnite/validation-and-fixup-tool-in-unreal-editor-for-fortnite)
- [Memory Management](https://dev.epicgames.com/documentation/fortnite/memory-management-in-unreal-editor-for-fortnite)
- [Lore Version Control](https://dev.epicgames.com/documentation/fortnite/lore-version-control-in-unreal-editor-for-fortnite)
- [Publishing Projects](https://dev.epicgames.com/documentation/fortnite/publishing-projects-in-unreal-editor-for-fortnite)

## 33. Kết luận

UEFN không dạy PaldarkV5 rằng “hãy dùng Verse” hay “hãy thay Actor bằng Scene Graph”. Bài học sâu hơn là:

> Một hệ thống lớn có thể mở rộng nhanh mà vẫn kiểm soát được nếu capability có public contract nhỏ, content được phản chiếu thành dữ liệu máy đọc được, state owner và lifecycle rõ, model cũ/mới nối qua adapter, và mọi thay đổi đi qua validation cùng runtime evidence.

Đối với PaldarkV5, kết luận thiết kế là:

1. giữ KYWorld làm gold reference bất biến;
2. biến Blueprint/content thành evidence có cấu trúc;
3. chốt native contracts và authority trước implementation;
4. chuyển behavior theo vertical slice qua adapter;
5. giữ authored presentation/polish;
6. chứng minh parity trong runtime thật;
7. chỉ loại legacy sau khi dependency, lifecycle và rollback đều đóng.

Đó là cách áp dụng tinh thần UEFN mà không biến Paldark thành một bản sao Fortnite.
