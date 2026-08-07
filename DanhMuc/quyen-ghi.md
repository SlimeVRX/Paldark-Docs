# Danh mục quyền ghi sống

Nguồn là toàn bộ bảng mục 3 của chương 21–35. “Đổi bằng yêu cầu gì” là đường mutation; đọc snapshot không trao quyền ghi. Bảng ownership là kiến trúc; native QA status phải đối chiếu source và không được suy ra chỉ từ tên plugin.

| Chương | Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|---|
| 21 | Hướng nhìn và input axis hiện tại | Movement local player | camera, animation | `Paldark.Input.Intent.Move/Look` |
| 21 | Vị trí, vận tốc, movement mode | Movement authority | server, clients, camera | `Paldark.Movement.Request.Move/Jump/Sprint` |
| 21 | Stamina | Movement | UI, validator, animation | movement request hợp lệ |
| 21 | Walk/Run/Sprint/Swim/Glide/Ride | Movement | presentation, Interaction, Companion | `Paldark.Movement.Request.SetMode` |
| 21 | Mount entity đang gắn | Companion relation; Movement chỉ phản ánh mode | Companion, server, clients | `IPaldarkMount::RequestMount`; `Paldark.Movement.Event.MountChanged` |
| 21 | Input binding/action tag | Input | local player, debug | text/asset config |
| 21 | Input configuration loaded/readiness | Movement feature component | console QA, player controller | `Data/Movement.Input.json` load và Enhanced Input setup |
| 21 | Forward/right input axis hiện tại | Movement feature component | movement component, dump command | Enhanced Input action value hoặc `Paldark.Movement.QA.Move` |
| 21 | Sprint held | Movement feature component | movement presentation, dump command | Enhanced Input sprint start/complete |
| 21 | QA move/jump state mutation | Movement feature component | headless QA, log reader | `Paldark.Movement.QA.Move` / `Paldark.Movement.QA.Jump` |
| 21 | Presentation asset readiness | PlayerPresentation | animation instance, QA log reader | generated composition artifact and soft-reference load |
| 21 | Animation-instance presentation properties | PlayerPresentation | animation graph, QA log reader | read-only locomotion snapshot through `IPaldarkLocomotionState` |
| 22 | Target nhìn/chọn | Interaction local | UI, camera, input | `Paldark.Interaction.Request.Focus` |
| 22 | Intent tương tác và phiên input | Interaction client | target/resource authority, UI | `Paldark.Interaction.Request.Try` |
| 22 | Quyền và khoảng cách tương tác | target/resource authority | Interaction prompt, validator | `Paldark.Interaction.Request.Try` |
| 22 | Resource node còn lại | resource feature authority | Interaction, World, loot | `Paldark.Interaction.Request.Harvest` |
| 22 | Item drop trong world | item/drop feature | Interaction, relevancy, Inventory | `Paldark.Interaction.Request.Pickup` |
| 22 | Transaction chuyển item | Inventory | UI, drop, station | `Paldark.Inventory.Request.Transfer` |
| 22 | Context station mở | station feature | UI, Crafting | `Paldark.Interaction.Event.ContextOpened` |
| 23 | Item definition/fragment | Inventory data registry | Inventory, Crafting, Combat, UI | file definition |
| 23 | Item entity | Inventory | container, equipment, save | `Paldark.Inventory.Request.Create` |
| 23 | Quantity/stack | Inventory container | UI, Crafting, Equipment, save | Add/Remove/Split |
| 23 | Weight/capacity | Inventory | UI, pickup, Movement | accepted transfer |
| 23 | Vị trí sở hữu item | Inventory | Interaction, Crafting, Equipment | `Transfer` |
| 23 | Equipped item | Inventory equipment | Combat, Input, UI | `Equip` |
| 23 | Consumable effect result | Attribute/effect feature | UI, player/Pal | `Paldark.Core.EffectRequest` |
| 24 | Recipe definition/fragment | Crafting data | UI, station, technology | file definition |
| 24 | Unlock/station eligibility | Crafting query + Progression | UI, validator | Unlock/query |
| 24 | Station queue | Crafting station | UI, Work, save | Enqueue/Cancel |
| 24 | Job progress | Crafting | UI, save, output | server clock/tick |
| 24 | Input consumption | Inventory | Crafting, UI, save | `IPaldarkItemTransaction::ConsumeItems` atomically với correlation |
| 24 | Output item/quantity | Inventory | UI, Interaction, Crafting | `IPaldarkItemTransaction::AddItems` sau output request |
| 24 | Failure reason | Crafting result | UI, log, QA | rejected craft result |
| 25 | Attack intent/cooldown | Combat | input, animation, validator | `Paldark.Combat.Intent.Attack` |
| 25 | Weapon/effect definition | Inventory/Data read contract | Combat, UI | definition file |
| 25 | Damage request | Combat creates request | Health, log, UI | `Paldark.Core.DamageRequest` |
| 25 | HP/attribute | Health only | Combat, UI, observers | `IPaldarkDamageReceiver::ApplyDamage` |
| 25 | Element/status result | attribute/status owner | Combat, UI, AI | effect request/result |
| 25 | Death/knockdown | Health only | Companion, Capture, UI | `FDamageResult` threshold |
| 25 | Projectile/hit result | Combat authority | clients, presentation | Fire/server resolution |
| 26 | Capture attempt | Capture | UI, log, save policy | `Paldark.Capture.Request.Try` |
| 26 | HP snapshot target | Health | Capture, UI | `Paldark.Core.HealthRead` |
| 26 | New creature entity identity | Creature/EntityIdentity owner | Capture, roster, storage, save | `IPaldarkEntityIdentity::Create/Destroy` |
| 26 | Creature roster membership | Creature | Capture result, clients, save | `IPaldarkEntityTransfer::TransferEntity` |
| 26 | Sphere transaction | Inventory | Capture, UI | inventory transfer |
| 27 | Party membership, active companion, entity context | Companion | UI, save, summon, actor bridge | `Paldark.Input.Intent.Companion` |
| 27 | Actor representation handle | Companion actor bridge | presentation, movement, observers | summon/recall request; handle may be empty |
| 27 | Summoned actor relation | Companion | Movement, Combat, presentation | summon/recall request |
| 27 | Partner skill cooldown | Companion | UI, Combat | skill request |
| 27 | Mount relation | Companion | Movement, server, clients | `IPaldarkMount::RequestMount` |
| 28 | Preview build session | Build local/authority | UI, placement validator | preview request |
| 28 | Structure identity/transform | Build | World, Work, save | commit structure request |
| 28 | Structure HP | Health owner | Build, Combat, UI | `DamageRequest` |
| 28 | Technology unlock check | Progression | Build validator | `ProgressionRead` |
| 29 | Work assignment | Work | station, UI, save | `Paldark.Work.Request.Assign` |
| 29 | Work queue/progress | Work | UI, save, offline reconciler | Enqueue/Reconcile |
| 29 | Offline output pending | Work + Inventory transaction | UI, save | finished/reconcile |
| 29 | Station assignment slot, queue, progress, checkpoint/last simulation time | Work | Build event, Companion/Capture entity context, UI, save | `Work.Capable`, `Work.Station`, `Paldark.Work.Event.*` |
| 28, 30 | Unlocked technology/node set | Progression only; Ch 28 tạo owner tối thiểu, Ch 30 mở rộng graph/prerequisite/point | Crafting, Build, Combat, UI | `IPaldarkProgressionRequest::Unlock` |
| 30 | XP, level, technology points/reason | Progression | UI, save, feature requesters | `IPaldarkProgressionRequest::AddExperience` |
| 31 | World time | World clock | spawner, weather, UI, owner save codec | server tick |
| 31 | Weather/temperature | World environment | spawner, creature, player, owner save codec | SetWeather |
| 31 | Biome/spawn rows | World data registry | scheduler, QA | data load |
| 31 | Population budget | World spawner authority | scheduler, relevancy | ReconcilePopulation |
| 31 | Spawn/despawn lifecycle and population policy | World | Combat, Capture, EntityIdentity, relevancy | Reconcile/Spawn/Despawn |
| 32 | Dungeon run/rooms | Dungeon | UI, boss, reward, owner save codec | Enter/AdvanceRoom |
| 32 | Boss HP/death | Health owner | Dungeon, Combat, UI | DamageRequest |
| 32 | Reward claim | Inventory/reward owner | Dungeon, UI, owner save codec | ClaimReward |
| 32 | First-defeat flag | Dungeon; Progression chỉ sở hữu technology/unlocked set | reward validator, UI | completion request |
| 33 | Manifest/order/generation | Persistence | loader, validator, migration | Open/Commit |
| 33 | Chunk payload/schema | feature chunk owner | codec, migration | owner codec đăng ký qua `UPaldarkSaveChunkRegistry` |
| 33 | Relation resolution | entity/feature owner | all readers | stable ID lookup |
| 34 | Session/connection | Multiplayer | server, client, relevancy | handshake |
| 34 | Feature gameplay state | owning feature | server, clients | feature request authority |
| 34 | Replicated delta | owner + net bridge | relevant clients | owner mutation |
| 34 | Relevancy set | Multiplayer/world policy | replication bridge | Relevancy request |
| 34 | Guild membership/permission | Guild design owner | authority, members, save | SetMemberRole |
| 35 | Parent/farm assignment | Breeding | UI, scheduler, owner save codec | AssignParents |
| 35 | Breeding progress | Breeding | UI, owner save codec, server | Reconcile |
| 35 | Combination lookup | Breeding data | resolver, UI, QA | definition data |
| 35 | Egg/child result | Breeding + EntityIdentity | Inventory, Companion, save | ClaimResult |
| 35 | Condenser sacrifice transaction | Condenser | UI, entity, owner save codec | Condense |
| 35 | Currency/item quantity | Inventory | Economy, Breeding, Condenser | Inventory transaction |
| 35 | Offer/price/stock | Economy merchant | UI, server, save | Refresh |
| 35 | Buy/sell result | Economy transaction | Inventory, UI, log | Buy/Sell |

| 35 | Parent pairing/progress/combination result | Breeding | Core EntityIdentity/event consumers | AssignParents/Reconcile/ClaimResult |
| 35 | Sacrifice transaction/rank | Condenser | Inventory/entity transaction contracts | Condense |
| 35 | Offer/price/stock/buy-sell transaction | Economy | Inventory transaction contract, UI | Refresh/Buy/Sell |

## Audit

Không phát hiện cùng một state có hai owner khác nhau trong các bảng hiện tại. Các ranh giới có chủ ý được ghi rõ: HP thuộc Health, quantity thuộc Inventory, unlocked-node set thuộc Progression, entity identity thuộc EntityIdentity, còn Persistence chỉ điều phối chunk.

| 22–23 | Interaction resource quantity | Interaction authority | Inventory event consumer | `Paldark.Interaction.Event.HarvestAccepted` |
| 23 | Player inventory slots/item quantity | Inventory authority | Interaction, UI, future features | `Paldark.Inventory` |
| 22–23 | Generic actor intent routing | Core transport; feature handler owns decision | Runtime actor submits only | `Paldark.Interaction.Intent.Harvest` |
| 34 | Session metadata, connection coordination, relevancy policy, opaque intent transport | Multiplayer/Net | Feature owner validates and mutates gameplay state | `Paldark.Net.Request.Intent`, `Paldark.Net.Event.Replicated` |
| 34 | HP, item quantity, work/build/world/dungeon state | Owning feature | Multiplayer transports only | No aggregate network state |
| 34 | Session metadata, connection coordination, relevancy policy, opaque intent transport | Multiplayer/Net | Feature owner validates and mutates gameplay state | `Paldark.Net.Request.Intent`, `Paldark.Net.Event.Replicated` |
| 34 | HP, item quantity, work/build/world/dungeon state | Owning feature | Multiplayer transports only | No aggregate network state |

| 33 | Codec registry, generation checkpoint, manifest/recovery orchestration | Persistence | feature owner codecs, loader, QA | `UPaldarkSaveChunkRegistry`, atomic generation, commit marker |
