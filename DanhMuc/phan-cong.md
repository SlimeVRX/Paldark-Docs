# Danh mục phân công sống

> **Trạng thái 2026-08-04:** inventory lịch sử, **không phải danh sách task đang được phép code**. ADR-001 đang `PROPOSED`; mọi cột người/agent để trống cho tới khi Soliz duyệt design gate. Claim package/listen cũ là evidence của snapshot cũ, không phải acceptance cho HEAD #178.

Bảng này liệt kê domain/feature đã xuất hiện ở Quyển 4 để không mất dấu owner state. Sau ADR-001, “system” không mặc nhiên tương đương “GameFeature plugin”; bảng sẽ được tách thành domain owner, capability pack và Experience contribution. Task mới phải dùng task packet/write-set ở [Chương 40](../Q6-Kien-Truc-VibeCoding/40-giao-thuc-vibecoding-da-agent.md), không tự nhận việc chỉ bằng cách điền tên vào một dòng.

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
