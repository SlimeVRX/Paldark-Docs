# Phụ lục D — Kiểm kê 13 khoá học và sức nặng của từng loại bằng chứng

Phụ lục này trả lời một câu hỏi hẹp nhưng rất quan trọng: **ta thực sự có thể học và tái sử dụng điều gì từ từng khoá, và điều gì chỉ mới được mô tả?** Nó không thay thế [bản đồ tài liệu](ban-do-tai-lieu.md) hay [giáo trình 15 hệ thống](../Q5-Lo-Trinh/38-giao-trinh-15-khoa-hoc.md). Nó đặt độ tin cậy lên từng nguồn để AI agent không biến tên bài học hoặc sự tồn tại của một Blueprint thành bằng chứng rằng logic đã được đọc và hiểu.

## D.1 — Bốn nhãn bằng chứng

| Nhãn | Ta được phép kết luận | Ta không được phép kết luận |
|---|---|---|
| `[C++]` | File source local đọc được và chứa implementation liên quan. | Implementation đó đã được tích hợp hoặc chạy đúng trong Paldark. |
| `[Asset]` | `.uasset`/`.umap` tồn tại và taxonomy/tên asset có thể dùng làm bản đồ khảo sát. | Graph Blueprint bên trong làm gì nếu chưa export/inspect bằng Editor. |
| `[Doc]` | Bài giảng hoặc Knowledge mô tả một kỹ thuật/quy trình. | Repo local có source chứng minh kỹ thuật đó. |
| `[Inference]` | Đây là lựa chọn thiết kế Paldark suy ra sau khi so sánh nguồn. | Palworld, Lyra hoặc khoá học đã chọn đúng y hệt. |

Một claim có thể mang nhiều nhãn, nhưng không được tự nâng từ `[Doc]` hoặc `[Asset]` thành `[C++]`.

## D.2 — Tình trạng 13 khoá

| Khoá | Source local | Vai trò tốt nhất | Cảnh báo |
|---|---|---|---|
| 02 — KYWorld Palworld | Có | Scope, flow, taxonomy asset, Enhanced Input/GAS/equipment shell | Gameplay riêng của Palworld chủ yếu là Blueprint binary; không có graph export. |
| 05 — GAS Crash Course | Có | ASC, AttributeSet, ability/effect/tag/cue, projectile và melee cơ bản | Mẫu nhỏ; chưa phải kiến trúc game dài hạn. |
| 07 — Multiplayer Crash Course | Có | Authority, replication, RPC, framework, travel | Nền mạng; không phải gameplay Palworld. |
| 08 — Dedicated Server/AWS | Có | Server target, lobby/match/cloud lifecycle | Defer khỏi sprint gameplay hiện tại. |
| 09 — Inventory System | Có | Fast Array, item manifest/fragment, spatial grid/stack, server action, equipment | Nguồn workflow spatial-inventory mạnh nhất cho ch.23; course 17 mạnh hơn ở integration/kiến trúc Lyra item. |
| 10 — Multiplayer Shooter | Có | Combat/network/weapon/lag compensation/team | `course.yaml` không mirror đầy đủ lịch sử lesson; dùng source HEAD làm proof. |
| 11 — GAS Top-down RPG | Có | Combat, AI, progression, world save, checkpoint/spawn/loot | Nguồn rộng; cần tách pattern generic khỏi thiết kế riêng của Aura. |
| 12 — Pro Unreal Coding | **Không** | Toán, camera, physics và coding pattern; AI chủ yếu là vehicle spline/steering | Chỉ `[Doc]`; không phải Pal companion/work AI proof. |
| 13 — GAS/AWS Multiplayer | Có | GAS mạng, AI/spawner, upgrade/shop/inventory/lobby | Rộng, nhưng không phải một thiết kế transaction/persistence Palworld hoàn chỉnh. |
| 14 — Exploring Lyra | **Không** | Experience, Game Feature, PawnData, Gameplay Message | Chỉ `[Doc]`; nhiều path trong YAML bị cắt. |
| 15 — RPG using Lyra | **Không** | Cách ghép một RPG Experience, locomotion, inventory, StateTree, boss | Chỉ `[Doc]`. |
| 16 — UEFN/Verse | **Không** | Interface, module, event, scope, UI và persistence concept | Không được coi Verse lesson là C++ implementation proof. |
| 17 — Hipernova Lyra Inventory | Có | Lyra source + interaction/inventory/craft fragments/Fast Array; building chỉ có fragment tham chiếu actor class | Nguồn C++ mạnh nhất cho item/equipment/interaction runtime trong Lyra, không phải ranking kiến trúc chung hay full building system; kiểm tra license trước tái sử dụng. |

Kết quả kiểm kê: **9/13 khoá có Source submodule; 12, 14, 15, 16 là doc-only.** Danh sách submodule trong `.gitmodules` là bằng chứng vật lý cho ranh giới này.

## D.2a — Lớp `Knowledge/` đã dùng để định tuyến

Mỗi khoá có một bản synthesized HTML. Khoá 05 có thêm `Knowledge/01-Introduction/04-Character Classes.md`. Knowledge giúp tìm concept/lesson nhanh; claim implementation vẫn phải quay lại `Documents`, `course.yaml` và Source.

| Khoá | Knowledge synthesis | Dùng để định tuyến tới |
|---|---|---|
| 02 | `Knowledge/Course-02-Palworld-KYWorld-Synthesized.html` | Palworld-like loop, asset taxonomy, C++ shell và khoảng Blueprint cần inspect |
| 05 | `Knowledge/Course-05-GAS-Crash-Course-Synthesized.html` | ASC→Attribute→Ability/Effect→cost/cooldown→target/damage |
| 07 | `Knowledge/Course-07-UE5-Multiplayer-Crash-Course-Synthesized.html` | authority/replication/RPC/framework/travel |
| 08 | `Knowledge/Course-08-Dedicated-Servers-AWS-GameLift-Synthesized.html` | server/lobby/match/cloud lifecycle, để defer đúng chỗ |
| 09 | `Knowledge/Course-09-Inventory-Systems-Synthesized.html` | spatial grid/stack, Fast Array, manifest/fragment, pickup/move/drop/consume và equipment; không có shop/shared-container transaction proof |
| 10 | `Knowledge/Course-10-UE5-Multiplayer-Shooter-Synthesized.html` | weapon/combat/lag compensation/team/match flow |
| 11 | `Knowledge/Course-11-GAS-Top-Down-RPG-Synthesized.html` | GAS combat, AI, progression, save/checkpoint/spawn/loot |
| 12 | `Knowledge/Course-12-Pro-UE-Game-Coding-Synthesized.html` | math/physics/camera/coding patterns; AI chủ yếu vehicle spline/steering, không phải Pal AI; doc-only |
| 13 | `Knowledge/Course-13-GAS-AWS-Dedicated-Servers-Synthesized.html` | networked GAS, AI/spawner, upgrade/shop/inventory/session |
| 14 | `Knowledge/Course-14-Exploring-Lyra-Synthesized.html` | Experience/GameFeature/PawnData/message architecture; doc-only |
| 15 | `Knowledge/Course-15-Build-RPG-Using-Lyra-Synthesized.html` | RPG Experience, locomotion, inventory và StateTree; boss nằm ở Documents chứ không có trong Knowledge synthesis; doc-only |
| 16 | `Knowledge/Course-16-UEFN-Verse-Programming-Synthesized.html` | interface/module/event/scope/UI/persistence concepts; doc-only |
| 17 | `Knowledge/Course-17-Lyra-Inventory-Extended-Synthesized.html` | interaction/inventory/craft fragments, `BuildingActorClass` fragment và Lyra integration; không có placement system |

Knowledge synthesis không được dẫn một mình cho claim “class X làm Y”. Nó là index để tìm bài/file chứng minh ở tầng thấp hơn. Code block nằm trong Knowledge là ví dụ sư phạm; compile proof phải quay lại lesson commit/source.

## D.3 — Các bất thường phải được giữ trong hồ sơ

1. **Khoá 10:** `course.yaml` chứa 197 SHA dạng hash nhưng clone local chỉ xác minh được 6. Source cuối ở HEAD `88f0f15` vẫn đọc được, nên được dùng làm file-level proof; không được tuyên bố đã tái dựng diff của từng bài.
2. **Khoá 14:** 57/94 trường `document:` bị cắt. Khi dẫn nguồn phải dùng tên file thật trong `Documents/`, không dùng path bị cắt từ YAML.
3. **KYWorld:** `course.yaml` neo `3d5a7dc`; clone hiện ở `a6eab166`. Phần sau mốc neo thêm hàng nghìn binary asset nhưng không đổi C++/config, nên C++ proof tại mốc neo còn hợp lệ; asset inventory phải ghi rõ snapshot đang khảo sát.
4. **Khoá 05:** 59/59 lesson SHA có hash đều tồn tại. Nên dẫn lesson SHA thay vì chỉ dẫn snapshot tổng.
5. **Khoá 02 và 17:** các bài cùng trỏ một snapshot. Đây là source-path proof, không phải lịch sử triển khai theo bài.

## D.4 — Trình tự học theo từng hệ thống Paldark

Trình tự dưới đây là **đường đọc**, không phải thứ tự copy code. Bài đầu cho khái niệm; bài sau cho implementation; KYWorld ở cuối để đối chiếu cảm giác/scope sau khi đã tự phân rã.

| Ch. | Hệ thống | Trình tự nguồn | Phần chưa được nguồn giải quyết |
|---:|---|---|---|
| 21 | Di chuyển/input | 14/15 `[Doc]` Experience + Enhanced Input → 02 `[C++]` `BaseInputComponent`, `DataAsset_InputConfig` → 07/13 `[C++]` authority | Stamina, climb, swim, glide, mount và cảm giác điều khiển. |
| 22 | Tương tác/thu thập | 14/15 `[Doc]` interaction/message → 17 `[C++]` interaction → 09 `[C++]` pickup/server action → 02 `[Asset]` `GA_Interact` | Generic focus/query, resource node lifecycle, tranh chấp nhiều người. |
| 23 | Inventory | 09 `[C++]` Fast Array/manifest/fragment → 17 `[C++]` Lyra inventory/equipment → 02 `[Asset]` UI/container taxonomy | Atomic multi-container transaction, weight, Pal/container ownership, UI cụ thể. |
| 24 | Crafting | 17 `[C++]` craft fragments → 09 `[C++]` authoritative inventory mutation/spatial-packing primitives → 02 `[Asset]` workbench/craft table | Không có atomic rollback/cross-container transaction proof; còn thiếu queue, reservation, cancel, worker contribution và persistence. |
| 25 | Combat | 05 `[C++]` GAS nền → 11 `[C++]` damage/effect → 10/13 `[C++]` mạng/weapon → 02 `[C++/Asset]` target feel | Bộ nguyên tố/status/weapon đầy đủ, hit reaction, tuning và content. |
| 26 | Capture | 05 `[C++]` projectile/targeting → 11 `[C++]` effect/health primitive → 02 `[Asset]` Sphere/Encounter | Công thức thật, state timeline, authority, settlement exactly-once. |
| 27 | Companion | 11/13 `[C++]` AI → 15 `[Doc]` StateTree → 02 `[C++/Asset]` Pal/AI shell | Party UI, skill/mount, behavior mode, persistence roster và multiplayer ownership. |
| 28 | Xây dựng | 17 `[C++]` chỉ có fragment tham chiếu `BuildingActorClass` → 02 `[Asset]` build taxonomy | Chưa có placement/build-system proof; thiếu preview/snap/support/terrain/overlap, repair/demolish/refund và base permission. |
| 29 | Work/automation | 11/13 `[C++]` AI primitive → 15 `[Doc]` StateTree → 02 `[Doc/Asset]` work taxonomy | Scheduler/reservation, hauling, priority, needs, stuck recovery, offline simulation. |
| 30 | Progression/technology | 11 `[C++]` XP/level/save → 13 `[C++]` upgrade/stats → 15 `[Doc]` RPG Experience | Full technology graph, unlock cost, rewards, UI và content data. |
| 31 | World/life | 11/13 `[C++]` spawner → 17 `[C++]` map/spawner pieces → 02 `[Doc/Asset]` spawn taxonomy | Biome ecology, day/night, weather, temperature, raid, crime/faction, population budget. |
| 32 | Dungeon/boss | 11 `[C++]` entrance/spawn/loot → 15 `[Doc]` boss/Experience → 07 `[C++]` travel | Seeded room graph, run lifecycle/resume, boss phases, reward claim, co-op transition. |
| 33 | Persistence | 11 `[C++]` SaveGame/world save → V3 local architecture `[C++]` transaction/invariant reference | Authoritative persistent world, player/world split, schema migration, atomic recovery. |
| 34 | Multiplayer | 07 `[C++]` nền → 10/13 `[C++]` production patterns → 08 `[C++]` server/cloud **sau** gameplay | Reconnect, guild/permission, persistent world, dedicated acceptance. |
| 35 | Breeding/economy | 13 `[C++]` chỉ hỗ trợ shop/economy primitive → 02 `[Doc/Asset]` item/price taxonomy | Không có breeding/genetics/incubation coverage trong cả 13 Knowledge synthesis; breeding matrix, condenser transaction và economy policy là evidence gap trực tiếp. |

## D.5 — Nguồn ưu tiên theo mục đích

Không có một ranking chung cho mọi bài toán:

| Chủ đề | Nguồn ưu tiên |
|---|---|
| Scope/game feel Palworld | 02, luôn ghi `[C++]`, `[Asset]` hay `[Doc]` |
| Lyra composition/GameFeature/Experience | Epic official → 14/15 `[Doc]` → 17 source để đối chiếu implementation |
| Item/inventory/equipment runtime | 17 (Lyra architecture/integration) + 09 (spatial workflow/Fast Array) |
| GAS/combat | 05 (primitive) → 11 (RPG depth) → 13/10 (network/weapon) |
| Networking/authority | 07 (nền) → 13/10 (GAS/combat/session); 08 chỉ ở server/cloud milestone |
| AI/spawn/save primitive | 11 → 13 → 15 `[Doc]`; Work scheduler/offline vẫn phải first-principles |

**Không dùng trong critical path 12 giờ:** 08, trừ khi một quyết định gameplay thực sự bị server lifecycle chặn. Cloud, matchmaking và deployment không làm vertical loop hiện tại chơi được hơn.

## D.6 — Input cần người dùng cung cấp

Những nguồn còn thiếu không thể được bù bằng cách đoán. Gói hỗ trợ có giá trị nhất từ người dùng là:

1. Export Blueprint graphs của `InventorySystem`, `PalDataComponent`, `GA_Pal_Encounter`, `BP_PalSphere`, `BP_CraftMaster`, `BP_BuildPartMaster`, `SpawnManager` từ KYWorld.
2. Video một lượt chơi có timestamp cho capture, build snapping, worker assignment/hauling, breeding/incubation và dungeon reset.
3. Export DataTable từ **một phiên bản Palworld đã chốt** cho technology, build/work suitability, spawner/dungeon và breeding/economy.
4. Với mỗi video: input đã bấm, state nhìn thấy trước/sau, trường hợp thất bại, và điều gì phải còn đúng sau save/load.

Output mong đợi từ việc khảo sát này là một bảng state transition có nguồn, không phải một danh sách “giống Palworld”.
