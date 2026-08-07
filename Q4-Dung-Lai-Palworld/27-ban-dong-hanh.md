# Chương 27 — Bạn đồng hành

Một Pal nằm trong roster vẫn mới chỉ là một mục trong bộ sưu tập. Người chơi chọn nó, gọi nó ra, thấy nó chạy theo, dùng partner skill hoặc chở mình qua địa hình — lúc ấy cá thể đó mới trở thành bạn đồng hành có mặt trong chuyến đi. Nhưng chính sự “có mặt” này dễ đánh lừa implementation: actor trước mắt chỉ là representation, không phải identity của Pal.

Chương 14 đã đặt ranh giới: thực thể không phải actor. Pal trong party có thể đang ở storage, ở vùng chưa nạp hoặc chỉ tồn tại trong save; những lúc đó nó vẫn là cùng một cá thể. Vì vậy mọi tham chiếu phải đi qua `FPaldarkEntityId`. Nếu giữ con trỏ actor làm identity, một lần unload vì relevancy cũng đủ biến người bạn thành “mất tích”.

## 27.1 — Vì sao hệ thống này tồn tại

Companion nối collection với hành động qua một chuỗi chuyển context. Chọn party là quyết định chuẩn bị; summon cho entity một actor representation trong world; recall dỡ representation và trả entity về context sở hữu; partner skill tạo bản sắc; mount thay đổi cách người chơi đi qua bản đồ.

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

Catalog cho thấy một companion có nhiều vai trò hơn “đi theo”. `MountType` có `None`, `Ride`, `Fly`, `Swim` là evidence về taxonomy, nhưng không nói party slot count hay lifecycle actor. Những phần đó vẫn là contract Paldark `INFERRED`, không được biến thành fact Palworld chỉ vì chúng cần cho implementation.

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

Bảng tách một Pal thành ba lớp dễ bị trộn: stable relation của Companion, actor representation của bridge và HP của Health owner. Companion chỉ làm chủ lớp đầu. Actor handle có thể rỗng khi chưa nạp; đó là trạng thái bình thường, không phải lỗi. Còn HP không chuyển owner chỉ vì Pal đang được summon.

## 27.4 — Hợp đồng dữ liệu

Data partner chỉ cần nói cá thể thuộc definition này có capability gì. `Companion.Partner` mô tả partner skill và mount capability tĩnh; active entity id cùng actor pointer đều là state runtime và không được chui vào fragment.

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

Khi người chơi bấm summon, public API phải bắt đầu từ thứ luôn tồn tại: stable id. `UCompanionComponent` giữ relation và intent, còn `UCompanionActorBridge` dựng/dỡ actor representation. API không nhận pointer actor từ feature bên ngoài.

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

Client có thể đổi lựa chọn trên UI ngay, nhưng “Pal này đang ở World hay Party” phải là một sự thật chung. Server quyết định party ownership, summon/recall context, skill eligibility, mount eligibility và actor spawn. Client được preview skill cùng animation request; nó không tự đổi party relation hay tạo Pal entity.

Party list, active id, context, relevant actor transform và skill result replicate. Actor mesh, animation, VFX, camera attachment và local audio là presentation. Khi Pal không relevant, actor có thể biến mất; stable entity vẫn được giữ và khi cần bridge dựng actor mới.

Mount mode cần đồng bộ qua Movement authority. Companion chỉ cung cấp capability và request; Movement quyết định movement state. Đây là cách tránh hai owner cùng ghi một mode.

## 27.7 — Log, console command, và cách biết là chạy đúng

Phép thử quan trọng nhất không phải actor có xuất hiện lần đầu, mà là identity có sống qua lúc actor biến mất hay không. `LogPaldarkCompanion` phải dùng `target=Creature:<stable-id>`, không dùng actor pointer làm identity. Summon/recall ghi context before/after; `actor unavailable` phải được phân biệt rõ với `entity missing`.

Command:

- `Paldark.Companion.QA.Setup`
- `Paldark.Companion.Status`
- `Paldark.Companion.QA.Trigger`
- `Paldark.Pal.SpawnTestCompanion` — command thật để tạo fixture companion.
- `Paldark.Pal.CurrentActivity` — command thật để quan sát activity.

Test đúng cố ý đi qua khoảnh khắc representation biến mất: tạo entity, add party, set active, summon, destroy/unload actor, kiểm status vẫn thấy entity, summon lại để dựng actor mới, rồi recall về party/storage. Mọi bước phải nối bằng stable id và correlation; chỉ kiểm actor còn trong level sẽ bỏ qua chính ranh giới mà chương này cần chứng minh.

## 27.8 — Slice native đã triển khai

Contract ấy đã được đưa vào một slice cố ý tách representation khỏi identity. `Companion` là native Game Feature độc lập với `Creature` và `Capture`.
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

Khi companion đã có thể theo người chơi mà không đánh mất identity, collection đã bước ra khỏi roster. Bước kế tiếp là cho người chơi tạo một nơi để cả người lẫn Pal quay về: từ khoảng đất trống dựng nên structure có stable id, cost và owner rõ ràng.

---

**Bằng chứng cho chương này.** `F-007`, `F-029` tới `F-035`, `MountType` và `DT_PartnerSkillData` là mã/field được catalog và whitepaper ghi nhận (EXTRACTED/REFERENCE). Ranh giới entity–actor, stable id và actor có thể vắng mặt là contract Chương 14. `Paldark.Pal.SpawnTestCompanion` và `Paldark.Pal.CurrentActivity` là command OBSERVED. Fragment, component, channels, chunk và lifecycle actor là thiết kế Paldark INFERRED; party slot count và runtime summon behavior Palworld là UNKNOWN.
