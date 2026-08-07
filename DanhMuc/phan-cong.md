# Danh mục phân công sống

> **Trạng thái 2026-08-04:** inventory lịch sử, **không phải danh sách task đang được phép code**. ADR-001 đang `PROPOSED`; mọi cột người/agent để trống cho tới khi Soliz duyệt design gate. Claim package/listen cũ là evidence của snapshot cũ, không phải acceptance cho HEAD #178.

Một bảng phân công rất dễ bị đọc nhầm thành lời mời nhận việc: thấy ô trống, điền tên, rồi bắt đầu sửa code. Snapshot này không vận hành theo cách đó. Nó giữ lại bản đồ domain/feature đã xuất hiện ở Quyển 4 để ta không mất dấu chủ sở hữu state tại mốc 2026-08-04; nó không cấp quyền sửa bất kỳ file nào ở hiện tại.

Sau ADR-001, “system” cũng không còn mặc nhiên đồng nghĩa với một `GameFeature` plugin. Bản đồ tương lai phải tách domain owner, capability pack và Experience contribution. Vì thế task mới đi qua task packet và write-set ở [Chương 40](../Q6-Kien-Truc-VibeCoding/40-giao-thuc-vibecoding-da-agent.md), thay vì được tạo ra chỉ bằng việc điền tên vào một dòng.

Khi đọc bảng, hãy nhìn hai cột cuối trước. “Owner state chính” trả lời feature chịu trách nhiệm cho điều gì; “Contract/chunk chính” cho biết phần còn lại của hệ thống được phép chạm tới trách nhiệm ấy bằng đường nào. Hai cột người và agent để trống là một ranh giới có chủ ý của snapshot, không phải dữ liệu bị thiếu.

| Feature | Chương | Người | Agent | Owner state chính | Contract/chunk chính |
|---|---:|---|---|---|---|
| Movement/Input | 21 |  |  | input configuration readiness, forward/right axis, sprint held, QA move/jump state, movement mode/velocity contract | `Paldark.Movement`, `LogPaldarkMovement`, PR #132; native Game Features + ModularGameplay đã migrate; listen-server/client đã chứng minh, dedicated server còn UNKNOWN |
| PlayerPresentation | 21 |  |  | presentation asset readiness, mesh/animation instance readiness, locomotion read model qua `IPaldarkLocomotionState` | `Paldark.PlayerPresentation`, `LogPaldarkPlayerPresentation`, PR #133 (dự kiến); native Game Features + ModularGameplay đã migrate; `bClientComponent=true`, `bServerComponent=false`; listen-server/client đã chứng minh |
| Interaction/Harvest | 22 |  |  | client intent/input session; generic interactable contract; authority validation handoff; replicated resource event | `Paldark.Interaction`, `IPaldarkInteractable`, `LogPaldarkInteraction`; native Game Features + ModularGameplay đã migrate; listen-server/client đã chứng minh; dedicated server còn UNKNOWN; current Interaction slice |
| Inventory/Items | 23 |  |  | item entity, quantity, containers | `Paldark.Inventory`; Core interaction-event consumer; server-authoritative slots and stack limits; packaged listen-server/client evidence |
| Crafting | 24 |  |  | recipe registry, queue, job progress, craft result; không ghi quantity Inventory | `Paldark.Crafting`, `LogPaldarkCrafting`, `IPaldarkItemRead`, một server intent handler |
| Combat | 25 |  |  | attack intent, melee definition, cooldown and damage-request routing; never HP | `Paldark.Combat`, `UCombatIntentSubsystem`, `LogPaldarkCombat` |
| Creature | 26 |  |  | stable creature identity, pending creation, roster and replicated transfer | `Paldark.Creature`, `IPaldarkEntityIdentity`, `IPaldarkEntityTransfer`, `LogPaldarkCreature` |
| Capture | 26 |  |  | capture intent, deterministic attempt and result; never HP, inventory or roster | `Paldark.Capture`, `UCaptureIntentSubsystem`, `LogPaldarkCapture` |
| Companion | 27 |  |  | party list, active stable id, entity context (`Party`/`World`/`Storage`), summon/recall orchestration; actor handle may be empty | `Paldark.Companion`, `UCompanionIntentSubsystem`, `LogPaldarkCompanion` |
| Build | 28 |  |  | committed structure identity/transform/build state; preview chỉ là local/session state; query technology và transaction qua Core | `Paldark.Build`, `IPaldarkProgressionRead`, `IPaldarkItemTransaction`, `Paldark.Build.Event.StructureReady` |
| Work/Automation | 29 |  |  | assignment, slot ownership, queue, progress, checkpoint and offline reconcile; output quantity remains Inventory-owned; need systems intentionally deferred | `Work.Capable`, `Work.Station`, `Paldark.Work`, `LogPaldarkWork`; hybrid policy INFERRED |
| Progression/Technology | 28, 30 |  |  | Ch 28 tạo owner tối thiểu; Ch 30 sở hữu graph node, prerequisite, XP, level, technology points và unlocked set | `Paldark.Progression`, `Progression.Node`, `IPaldarkProgressionRead`, `IPaldarkProgressionRequest` |
| World/Spawner | 31 |  |  | server clock, weather, biome rows, seeded selection, population budget, respawn checkpoint; không sở hữu creature entity state | `Paldark.World`, `UWorldFeatureSubsystem`, `LogPaldarkWorld` |
| Dungeon/Boss | 32 |  |  | run, rooms, boss encounter, completion, idempotent reward claim và first-defeat flag; owner save codec không ghi HP hoặc quantity | `Paldark.Dungeon`, `UDungeonFeatureSubsystem`, `LogPaldarkDungeon` |
| Persistence | 33 |  |  | manifest, generations, migration order, checksum/recovery verification; không sở hữu gameplay fields | `Paldark.Persistence`, `UPaldarkSaveChunkRegistry`; owner codec serialize/deserialize/migrate |
| Multiplayer/Network | 34 |  |  | session, relevancy, replication bridge | `Paldark.Multiplayer` |
| Breeding | 35 |  |  | parent pairing, progress, combination; owner codec lưu farm/parents/progress/claimed, offline deferred | `Paldark.Breeding` |
| Condenser | 35 |  |  | sacrifice/condense transaction; owner codec lưu rank/target/sacrifice list | `Paldark.Condenser` |
| Economy/Merchant | 35 |  |  | offers, prices, stock, buy/sell | `Paldark.Economy` |
| Health/Attributes | 25–32 |  |  | HP mutation, damage resolution, death/downed; sole writer | `IPaldarkHealthRead`, `IPaldarkDamageReceiver`, `Paldark.Core.DamageRequest`, `FDamageResult`, `LogPaldarkHealth` |
| EntityIdentity | 14, 26, 35 |  |  | stable entity creation | `FPaldarkEntityId` |
| Guild/Permissions | 34–35 |  |  | shared ownership permission policy | `Paldark.Guild` |
| Breeding | 35 |  |  | parent pairing, progress, combination resolution, egg result; không trừ Inventory trực tiếp | `Paldark.Breeding`, `LogPaldarkBreeding` |
| Condenser | 35 |  |  | sacrifice transaction và rank; rollback khi Inventory contract fail | `Paldark.Condenser`, `LogPaldarkCondenser` |
| Economy/Merchant | 35 |  |  | offer, price, stock, buy/sell transaction; không ghi quantity trực tiếp | `Paldark.Economy`, `LogPaldarkEconomy` |

Điều quan trọng nhất bảng này giữ lại không phải tên plugin, mà là lời hứa ownership. Dù một domain sau đó được đóng gói lại thành capability hay được nhiều Experience cùng kích hoạt, state của nó vẫn phải có một nơi ra quyết định cuối cùng; mọi agent tham gia chỉ an toàn khi write-set của họ tôn trọng lời hứa đó.
