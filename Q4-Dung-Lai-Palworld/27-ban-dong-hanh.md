# Chương 27 — Bạn đồng hành

Một Pal trong hộp chỉ là một phần của bộ sưu tập. Khi người chơi chọn nó, gọi nó ra, thấy nó chạy bên cạnh và dùng được partner skill hoặc mount, cá thể đó trở thành một người bạn có mặt trong chuyến đi. Cảm giác này phụ thuộc vào một ranh giới dễ bị hiểu sai: Pal entity phải tồn tại ngay cả khi actor của nó chưa tồn tại trong world.

Chương 14 đã nói rõ: thực thể không phải actor. Pal trong party có thể đang ở storage, ở vùng chưa nạp hoặc chỉ nằm trong save. Mọi tham chiếu phải đi qua `FPaldarkEntityId`; không giữ con trỏ actor làm identity.

## 27.1 — Vì sao hệ thống này tồn tại

Companion nối collection với hành động. Party là quyết định chuẩn bị; summon biến entity thành actor; recall trả actor về context sở hữu; partner skill tạo identity; mount làm Pal thay đổi cách người chơi đi qua bản đồ.

Hệ này không sở hữu creature definition, combat health hay inventory item. Nó điều phối context của entity và actor representation. Nếu actor bị destroy vì relevancy hoặc unload, companion phải có thể dựng lại actor từ stable id mà không làm mất Pal.

## 27.2 — Nó chạm những gì trong catalog

- `F-029` — Roster party.
- `F-030` — Active companion.
- `F-031` — Summon companion.
- `F-032` — Recall companion.
- `F-033` — Partner skill.
- `F-034` — Buff equip.
- `F-035` — Mount mặt đất.
- `F-007` — Cưỡi, ở phần chuyển mode sang Movement.

`MountType` có `None`, `Ride`, `Fly`, `Swim` là evidence về taxonomy. Nó không nói party slot count hay lifecycle actor, nên các phần đó là contract Paldark INFERRED.

## 27.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Party member list | `Companion` | UI, summon, save, progression | `Paldark.Companion.Request.SetParty` |
| Active companion id | `Companion` | input, presentation, summon | `Paldark.Companion.Request.SetActive` |
| Entity context `Party/World/Storage` | `Companion` | entity manager, save, UI | `Paldark.Companion.Request.Summon/Recall` |
| Actor representation handle | entity/actor bridge | presentation, movement, AI observer | `Paldark.Core.ActorResolve` |
| Partner skill availability/cooldown | `Companion` hoặc skill owner | input, UI, combat/interaction observer | `Paldark.Companion.Request.ActivateSkill` |
| Mount relation và movement mode request | Companion yêu cầu, Movement ghi mode | Movement, UI, server, presentation | `Paldark.Companion.Event.MountAccepted` |
| Pal health/attribute | Health owner của Pal entity | companion, combat, capture, UI | `Paldark.Core.DamageRequest`/health contract |

Companion làm chủ stable relation, không làm chủ HP. Actor handle có thể rỗng khi chưa nạp; đó là trạng thái bình thường, không phải lỗi.

## 27.4 — Hợp đồng dữ liệu

Mảnh hệ thống định nghĩa là `Companion.Partner`. Nó mô tả partner skill và mount capability tĩnh; không chứa active entity id hay actor pointer.

```cpp
USTRUCT()
struct FCompanionPartnerFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName PartnerSkillId;
    UPROPERTY() FName MountTypeId;
    UPROPERTY() FName BuffProfileId;
};
```

Definition đã điền:

```json
{
  "id": "Companion.Partner.CuteFox",
  "schema": 1,
  "display": { "nameKey": "Companion.Partner.CuteFox.Name" },
  "fragments": [
    {
      "type": "Companion.Partner",
      "partnerSkillId": "Companion.Skill.Scout",
      "mountTypeId": "Ride",
      "buffProfileId": "Companion.Buff.Scout"
    }
  ]
}
```

`Ride` minh họa một capability của Paldark, còn mapping cụ thể từ species tới mount trong Palworld là REFERENCE/UNKNOWN. Chunk `Paldark.Companion`, schema `1`, giữ party list, active id và entity context; không lưu actor pointer, animation hay camera state.

## 27.5 — Giao diện lập trình

Component là `UCompanionComponent`, còn `UCompanionActorBridge` dựng/dỡ actor representation. API nhận stable id, không nhận pointer actor từ feature bên ngoài.

```cpp
UFUNCTION()
FCompanionResult RequestSummon(FPaldarkEntityId InstanceId);

UFUNCTION()
FCompanionResult RequestRecall(FPaldarkEntityId InstanceId);

UFUNCTION()
FCompanionResult RequestActivateSkill(
    FPaldarkEntityId InstanceId, FName SkillId);

UFUNCTION()
FCompanionSnapshot ReadParty() const;
```

Thân hàm:

```cpp
FCompanionResult UCompanionComponent::RequestSummon(
    FPaldarkEntityId InstanceId)
{
    // Resolve the entity and verify party/context ownership.
    // Create or reuse an actor representation when relevancy allows.
    // Publish the context and actor-availability result.
}
```

Kênh phát:

- `Paldark.Companion.Event.InstanceAvailable`
- `Paldark.Companion.Event.Summoned`
- `Paldark.Companion.Event.Recalled`
- `Paldark.Companion.Event.MountAccepted`
- `Paldark.Companion.Result.Rejected`

Kênh nghe:

- `Paldark.Capture.Event.EntityCreated`
- `Paldark.Movement.Event.ModeChanged`
- `Paldark.Core.Event.HealthChanged`
- `Paldark.Input.Intent.Companion`

Companion không include Capture, Movement hay Health. Capture phát entity created; Companion nhận stable id và đưa vào roster theo policy. Khi mount được chấp nhận, Companion phát event để Movement đổi mode qua interface/channel; nó không gọi class Movement cụ thể.

## 27.6 — Quyền hạn và đồng bộ

Server quyết định party ownership, summon/recall context, skill eligibility, mount eligibility và actor spawn. Client được tự đổi UI selection, preview skill và animation request; client không tự đổi party relation hay tạo Pal entity.

Party list, active id, context, relevant actor transform và skill result replicate. Actor mesh, animation, VFX, camera attachment và local audio là presentation. Khi Pal không relevant, actor có thể biến mất; stable entity vẫn được giữ và khi cần bridge dựng actor mới.

Mount mode cần đồng bộ qua Movement authority. Companion chỉ cung cấp capability và request; Movement quyết định movement state. Đây là cách tránh hai owner cùng ghi một mode.

## 27.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkCompanion`. Log phải dùng `target=Creature:<stable-id>`, không dùng actor pointer làm identity. Summon/recall cần ghi context before/after; actor unavailable phải phân biệt với entity missing.

Command:

- `Paldark.Companion.QA.Setup`
- `Paldark.Companion.Status`
- `Paldark.Companion.QA.Trigger`
- `Paldark.Pal.SpawnTestCompanion` — command thật để tạo fixture companion.
- `Paldark.Pal.CurrentActivity` — command thật để quan sát activity.

Test đúng: tạo entity, add party, set active, summon, destroy/unload actor representation, status vẫn thấy entity, summon lại dựng actor mới, recall trả context về party/storage. Mọi bước phải nối bằng stable id và correlation; không chấp nhận test chỉ kiểm actor còn trong level.

## 27.8 — Slice native đã triển khai

`Companion` là native Game Feature độc lập với `Creature` và `Capture`.
`UCompanionIntentSubsystem` là server-side handler duy nhất; component trên
player chỉ nhận snapshot replicate và gửi intent. Capture phát
`Paldark.Capture.Event.EntityCreated` qua Core message bus, Companion nhận
stable `FPaldarkEntityId` và thêm vào party. Không có header implementation của
Capture, Creature, Health hoặc Movement trong Companion.

Actor representation là `ACompanionActorBridge`, không phải identity. State
giữ stable id, context và `bActorAvailable`; actor pointer/handle có thể rỗng.
QA dùng `-PaldarkCompanionQA` để dựng chuỗi:

```text
rejected summon (NotInParty)
summon: Party -> World, actor_available=true
simulated unload: actor_available=false, entity_missing=false
summon lại: cùng Creature:<stable-id>, actor mới
recall: World -> Party, actor_available=false
```

Partner definition nằm trong `Companion/Data/Companion.Partners.json`.
Companion không ghi HP, creature definition, inventory hoặc movement mode.

---

**Bằng chứng cho chương này.** `F-007`, `F-029` tới `F-035`, `MountType` và `DT_PartnerSkillData` là mã/field được catalog và whitepaper ghi nhận (EXTRACTED/REFERENCE). Ranh giới entity–actor, stable id và actor có thể vắng mặt là contract Chương 14. `Paldark.Pal.SpawnTestCompanion` và `Paldark.Pal.CurrentActivity` là command OBSERVED. Fragment, component, channels, chunk và lifecycle actor là thiết kế Paldark INFERRED; party slot count và runtime summon behavior Palworld là UNKNOWN.
