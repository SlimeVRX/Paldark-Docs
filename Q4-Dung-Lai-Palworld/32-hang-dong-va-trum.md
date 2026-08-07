# Chương 32 — Hang động và trùm

Một chuyến đi đáng nhớ thường có điểm hẹn: lối vào hang, chuỗi phòng, một trận trùm và phần thưởng đủ để người chơi muốn chuẩn bị lại lần sau. Hang động gom những hệ thống trước vào một hành trình có bắt đầu, áp lực tăng dần và kết thúc nhìn thấy được.

Dungeon không nên là một thế giới thứ hai tự định nghĩa lại combat, loot, progression hay spawn. Nó sở hữu run context và encounter flow; các mutation còn lại đi qua owner đã có. Nhờ vậy một dungeon mới chủ yếu là thêm data và room contract, không phải sửa core.

## 32.1 — Vì sao hệ thống này tồn tại

Overworld cho người chơi tự chọn hướng; dungeon tạo một lời hứa hẹp hơn. Người chơi bước qua entrance, đọc tier, đi qua room, giữ tài nguyên cho boss và nhận reward. Boss flag đổi nhịp presentation, còn reward biến chiến thắng thành tiến trình hoặc vật phẩm.

Catalog gọi boss tuning là REFERENCE/INFERRED vì chưa có declaration runtime đủ cụ thể. Paldark nên mô tả encounter bằng definition và event, không giấu multiplier trong một class boss dùng chung.

## 32.2 — Nó chạm những gì trong catalog

- `F-099` — Dungeon entrance.
- `F-100` — Dungeon tier.
- `F-101` — Encounter room.
- `F-102` — Boss flag.
- `F-103` — Boss tuning.
- `F-104` — Treasure reward.
- `F-105` — First-defeat reward.

Dungeon đọc creature/attack từ Combat, reward definition từ Inventory và unlock state từ Progression. Nó không ghi các state đó. `8-slot drop schema` là reference về hình dạng reward container, không phải yêu cầu mọi dungeon Paldark phải có đúng tám slot.

## 32.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Dungeon definition/tier | `Dungeon` data registry | entrance, room generator, UI | file definition |
| Active run context | `Dungeon` | room, boss, reward, save | `Paldark.Dungeon.Request.Enter` |
| Room progression | `Dungeon` | UI, spawn, encounter, save | `Paldark.Dungeon.Request.AdvanceRoom` |
| Boss encounter state | `Dungeon` encounter owner | UI, reward, log | `Paldark.Dungeon.Request.StartBoss` |
| Boss HP/death | Health owner của boss entity | Dungeon, combat, UI | `Paldark.Core.DamageRequest` |
| Reward definition/container | Inventory/reward owner | Dungeon, player, UI, save | `Paldark.Dungeon.Request.ClaimReward` |
| First-defeat flag | `Dungeon` | reward validator, UI, save | accepted completion request |

Dungeon giữ run/room state. Boss không bị xem là defeated chỉ vì actor unload; phải có health/death result. Reward không được cấp hai lần khi client retry claim.

## 32.4 — Hợp đồng dữ liệu

Mảnh là `Dungeon.Encounter`. Nó mô tả tier, room sequence, boss flag và reward profile; không chứa HP hiện tại hoặc inventory quantity.

```cpp
USTRUCT()
struct FDungeonEncounterFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName TierId;
    UPROPERTY() TArray<FName> RoomDefinitionIds;
    UPROPERTY() bool bBossEncounter = false;
    UPROPERTY() FName RewardProfileId;
};
```

Definition đã điền:

```json
{
  "id": "Dungeon.Encounter.ResonanceCavern",
  "schema": 1,
  "display": { "nameKey": "Dungeon.Encounter.ResonanceCavern.Name" },
  "fragments": [
    {
      "type": "Dungeon.Encounter",
      "tierId": "Dungeon.Tier.Two",
      "roomDefinitionIds": [
        "Dungeon.Room.Entry",
        "Dungeon.Room.ResonanceGuard",
        "Dungeon.Room.Boss"
      ],
      "bossEncounter": true,
      "rewardProfileId": "Dungeon.Reward.Resonance"
    }
  ]
}
```

Room count, tier name và reward profile là minh họa. Chunk `Paldark.Dungeon`, schema `1`, giữ active run, room index và claim/completion flags bền nếu design cho phép resume; không lưu actor pointer hay animation phase.

## 32.5 — Giao diện lập trình

Component là `UDungeonRunComponent` trên run owner và `UDungeonEntranceComponent` trên entrance. Dungeon gọi core contracts để spawn entity, đọc health result và tạo reward.

```cpp
UFUNCTION()
FDungeonResult RequestEnter(
    FPaldarkEntityId PlayerId, FName EncounterDefinitionId);

UFUNCTION()
FDungeonResult RequestAdvanceRoom(FPaldarkEntityId RunId);

UFUNCTION()
FDungeonResult RequestClaimReward(FPaldarkEntityId RunId);

UFUNCTION()
FDungeonSnapshot ReadRun(FPaldarkEntityId RunId) const;
```

Thân hàm:

```cpp
FDungeonResult UDungeonRunComponent::RequestClaimReward(FPaldarkEntityId RunId)
{
    // Verify completed run, reward claim state and requester authority.
    // Ask the reward/inventory owner to commit the output transaction.
    // Mark the claim atomically and publish the result.
}
```

Kênh phát:

- `Paldark.Dungeon.Event.AreaOpened`
- `Paldark.Dungeon.Event.RoomAdvanced`
- `Paldark.Dungeon.Event.BossStarted`
- `Paldark.Dungeon.Event.Completed`
- `Paldark.Dungeon.Event.RewardGranted`

Kênh nghe:

- `Paldark.World.Event.EntitySpawned`
- `Paldark.Core.Event.HealthChanged`
- `Paldark.Inventory.Event.Changed`
- `Paldark.Progression.Event.NodeUnlocked`

Dungeon không include World spawner, Combat, Inventory hay Progression. Nó nghe event và gọi interface; boss damage vẫn do Health owner quyết định, reward quantity vẫn do Inventory owner ghi.

## 32.6 — Quyền hạn và đồng bộ

Server quyết định entrance validity, run creation, room advance, encounter spawn, boss completion, first-defeat eligibility và reward claim. Client được hiển thị minimap, room presentation, boss bar prediction và camera; không tự complete run.

Run id, room index, boss result, completion flag và reward transaction result replicate cho client liên quan. Room mesh, fog, music, camera shake và boss intro là presentation. Nếu run resume được, save chunk là nguồn state; nếu không, missing chunk phải có policy rõ ràng.

## 32.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkDungeon`. Log entrance → run id → room → boss result → reward claim phải dùng cùng `corr`. Một reward log phải có claim id/idempotency key để retry không nhân đôi item.

Command:

- `Paldark.Dungeon.QA.Setup`
- `Paldark.Dungeon.Status`
- `Paldark.Dungeon.QA.Trigger`
- `Paldark.Combat.SpawnDummy` — fixture combat thật.
- `Paldark.Inventory.List` — đối chiếu reward.

Test đúng: vào encounter, advance room, hoàn tất boss bằng health result, claim reward hai lần và kiểm chỉ một transaction; reload run nếu persistence được bật; kiểm first-defeat chỉ đổi đúng owner.

---

## 32.8 — Slice đã triển khai và bằng chứng

Dungeon là native Game Feature `Paldark.Dungeon`, dùng `UDungeonFeatureSubsystem`
và một actor trạng thái replicated generic. Definition nằm trong
`Data/Dungeon.Encounters.json` với `Dungeon.Encounter.ResonanceCavern`,
`Dungeon.Tier.Two`, chuỗi ba room và reward
`Inventory.Item.ResonanceOre`. Dungeon không include World, Combat, Inventory,
Progression hoặc Health; nó tìm các capability Core trên actor runtime.

First-defeat/claim flag thuộc Dungeon. Lý do là flag này là eligibility của
encounter run và idempotency của reward claim, không phải technology node hay
unlocked set; Progression không nên nhận thêm mutable state chỉ để biết một
run đã trao reward hay chưa. Inventory vẫn là owner duy nhất của quantity và
Health là owner duy nhất của HP/death.

QA packaged chạy với `-PaldarkDungeonQA -PaldarkCombatQA` và nối cùng
correlation từ enter → room → boss → Health death result → completed → claim.
Các log server thực tế:

```text
PALDARK_DUNGEON_ENTER corr=18C99AC5759147FAAFA1937EDCCE06DA run=AEC840465459411F8A06AEA891514AEA ... room=0 authority=true
PALDARK_DUNGEON_ROOM_ADVANCED ... room_before=0 room_after=1 ... authority=true
PALDARK_DUNGEON_ROOM_ADVANCED ... room_before=1 room_after=2 definition=Dungeon.Room.Boss authority=true
PALDARK_DUNGEON_BOSS_STARTED ... actor_available=true authority=true
PALDARK_DUNGEON_BOSS_UNLOADED ... completed=false reason=ActorUnloadedWithoutHealthDeath authority=true
PALDARK_DUNGEON_STATUS ... phase=BossStarted completed=false reward_claimed=false authority=true
PALDARK_DUNGEON_REJECTED ... reason=RunNotCompleted ... authority=true
PALDARK_HEALTH_MUTATION ... before=100.0 after=0.0 dead=true authority=true
PALDARK_DUNGEON_DEATH_RESULT ... health_before=100.0 health_after=0.0 dead=true authority=true
PALDARK_DUNGEON_COMPLETED ... completed=true authority=true
PALDARK_INVENTORY_MUTATION ... before=0 added=1 after=1 result=accepted authority=true
PALDARK_DUNGEON_REWARD_GRANTED ... claim_id=FDFB40CB986A4BA1B199B70915CCF103 before=0 after=1 authority=true
PALDARK_DUNGEON_REJECTED ... reason=ClaimAlreadyProcessed ... first_claim_id=FDFB40CB986A4BA1B199B70915CCF103 authority=true
```

Nhánh advance sai thứ tự dùng `reason=RoomOrder`. Như vậy có ba rejection
reason độc lập: `RoomOrder`, `RunNotCompleted` và `ClaimAlreadyProcessed`.
Chỉ có một `PALDARK_INVENTORY_MUTATION` cho reward. Client nhận trạng thái
cuối qua `ADungeonRunStateActor`:

```text
PALDARK_DUNGEON_STATUS_REPLICATED ... phase=RewardClaimed completed=true reward_claimed=true reward_before=0 reward_after=1 authority=false
PALDARK_HEALTH_RESULT_REPLICATED ... before=100.0 after=0.0 dead=true authority=false
```

Dungeon có owner codec `Paldark.Dungeon`; codec lưu run context, room index,
completion flag và reward claim state. Actor boss và pointer runtime không
được lưu; reward claim state bắt buộc giữ lại để không mở lại duplicate claim.

**Bằng chứng cho chương này.** `F-099` tới `F-105`, `PalDungeonSpawnAreaData`, dungeon tier/room/reward references và 8-slot drop schema là EXTRACTED/REFERENCE theo catalog và whitepaper. Native feature, Core capability boundary, Health death gate, idempotent claim, first-defeat ownership, owner codec và packaged evidence là IMPLEMENTED/VERIFIED trong slice này. Actor resume không được giả nhận là persistence state.
