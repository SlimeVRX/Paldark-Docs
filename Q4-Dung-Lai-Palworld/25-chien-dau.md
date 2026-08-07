# Chương 25 — Chiến đấu

Chiến đấu là lúc hệ thống phải trả lời một câu rất cụ thể: đòn này có thực sự làm mục tiêu mất máu không? Người chơi có thể bấm attack ở client, nhìn thấy animation và nghe tiếng va chạm, nhưng những thứ đó chưa phải sự thật. Sự thật là bên nhận đã xét yêu cầu, áp luật của nó, rồi công bố kết quả.

Đây là chương thể hiện rõ nhất mô hình ở Chương 12 mục 12.4: **bên gây gửi yêu cầu, bên nhận quyết định**. Attacker không được tự trừ HP của target. Combat điều phối request và đọc result; health/attribute owner mới có quyền ghi state nhận damage.

## 25.1 — Vì sao hệ thống này tồn tại

Combat cho exploration một rủi ro có thể đọc được. Cận chiến đổi khoảng cách lấy damage; tầm xa đổi resource và aim lấy an toàn; elemental damage và skill identity làm cho việc chọn weapon hoặc Pal có lý do. Khi target chết hoặc bị knockdown, người chơi thấy hành động vừa làm đã tạo hậu quả.

Nếu client tự quyết hit, hai người chơi có thể thấy hai sự thật. Nếu combat include thẳng Inventory để lấy weapon, hoặc include Pal để đọc skill, feature sẽ kéo mọi hệ thống vào cùng một điểm. Combat cần một request contract, một result contract và một owner duy nhất cho mỗi state.

## 25.2 — Nó chạm những gì trong catalog

- `F-009` — Sinh vật thù địch.
- `F-010` — Cấp độ encounter.
- `F-011` — Hệ nguyên tố.
- `F-012` — Stat sinh vật.
- `F-014` — Kỹ năng chủ động.
- `F-022` — Đánh cận chiến.
- `F-023` — Đánh tầm xa.
- `F-024` — Projectile.
- `F-025` — Né tránh.
- `F-026` — Damage nguyên tố.
- `F-027` — Critical hit.
- `F-028` — Death và knockdown.

`EPalWeaponType` có 21 giá trị gồm `MAX`, là evidence về số chiều weapon taxonomy, không phải danh sách attack implementation Paldark. `EnemyReceiveDamageRate`, `EnemyInflictDamageRate` và các field stat cho thấy tuning có nhiều lớp; không dùng chúng để tự bịa công thức cuối.

## 25.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Attack intent và cooldown request | `Combat` của attacker | input, animation, server validator | `Paldark.Combat.Request.Attack` |
| Weapon/effect definition tĩnh | `Inventory`/data registry, đọc qua core interface | Combat, UI, presentation | definition file, không đổi lúc chạy |
| Damage request | `Combat` tạo, không phải HP state | health owner, log, UI hit feedback | `Paldark.Core.DamageRequest` |
| HP/attribute của bên nhận | `Health/GAS` owner của target | combat, UI, death/knockdown observer | `Paldark.Core.DamageRequest` được accept |
| Element/status result | owner attribute/status tương ứng | combat, UI, AI, log | effect request/result qua core contract |
| Death/knockdown state | `Health` owner | companion, capture, UI, replication | health result đạt threshold |
| Projectile entity và hit result | `Combat` authority | relevant clients, presentation | `Paldark.Combat.Request.Fire` / server resolution |

Combat không được ghi `Health`, không được tự sở hữu weapon inventory và không được tự chuyển target sang dead. Nó gửi damage request; bên nhận quyết định damage cuối. Đây là L8 được viết thành API thay vì chỉ là câu trong tài liệu.

## 25.4 — Hợp đồng dữ liệu

Loại mảnh là `Combat.Attack`. Nó mô tả attack definition: kind, power reference, element, range profile và result channel. Không chứa HP hiện tại, ammo quantity hay target death state.

```cpp
USTRUCT()
struct FCombatAttackFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName AttackKind;
    UPROPERTY() FName PowerProfileId;
    UPROPERTY() FName ElementId;
    UPROPERTY() FName RangeProfileId;
    UPROPERTY() FGameplayTag DamageTag;
};
```

File definition đã điền:

```json
{
  "id": "Combat.Attack.ResonanceShot",
  "schema": 1,
  "display": { "nameKey": "Combat.Attack.ResonanceShot.Name" },
  "fragments": [
    {
      "type": "Combat.Attack",
      "attackKind": "Projectile",
      "powerProfileId": "Combat.Power.ResonanceShot",
      "elementId": "Combat.Element.Neutral",
      "rangeProfileId": "Combat.Range.Medium",
      "damageTag": "Paldark.Combat.Damage.Direct"
    }
  ]
}
```

`PowerProfileId` là data lookup, không phải một con số hard-code trong attack component. `Combat.Element.Neutral`, range và damage tag là namespace Paldark minh họa; balance, critical chance và projectile speed chưa có giá trị source đủ để điền, nên không giả vờ có.

Kết quả damage là contract riêng, không dùng result chung:

```cpp
USTRUCT(BlueprintType)
struct FDamageResult
{
    GENERATED_BODY()

    UPROPERTY() FPaldarkEntityId TargetId;
    UPROPERTY() float AppliedAmount = 0.f;
    UPROPERTY() float HealthBefore = 0.f;
    UPROPERTY() float HealthAfter = 0.f;
    UPROPERTY() bool bDead = false;
    UPROPERTY() bool bDowned = false;
    UPROPERTY() FGuid CorrelationId;
};
```

Combat gửi `FDamageRequest`; Health/attribute owner quyết định có áp dụng và áp bao nhiêu, rồi trả `FDamageResult`. Capture đọc `HealthAfter`/`bDowned`, còn L12 dùng before/after để log mutation.

Combat không khai báo khối lưu `Paldark.Combat` cho attack intent, projectile phiên hay cooldown ngắn. HP, death và entity state bền thuộc owner Health/entity; nếu sau này cần lưu ammo hoặc weapon durability thì Inventory khai báo state/khối của mình, Combat chỉ đọc qua contract.

## Trạng thái triển khai — Health + Combat

Slice đầu tiên cố ý hẹp: một đòn melee, một target dummy do scenario/QA spawn,
không projectile, critical, GAS hay station/framework mở rộng. `Health` là
owner duy nhất của HP, death và knockdown. `Combat` chỉ sở hữu attack intent,
cooldown và attack definition; nó không include hoặc gọi implementation header
của Health/Inventory và không ghi HP.

Luồng runtime là:

```text
input → APaldarkBaseCharacter::SubmitIntent
→ Paldark.Combat.Intent.Attack
→ một UCombatIntentSubsystem phía server
→ validate definition/cooldown/range/target
→ IPaldarkDamageReceiver::ApplyDamage(FDamageRequest)
→ UHealthFeatureComponent quyết định và mutate HP
→ FDamageResult replicate về Combat/Health client
```

Core giữ `IPaldarkHealthRead` chỉ-đọc và `IPaldarkDamageReceiver` riêng cho
đường ghi damage. `FDamageRequest` và `FDamageResult` dùng cùng `FGuid`
correlation id, với target, amount, HP trước/sau, dead và downed. Damage result
notification đi qua Core event bus generic; Core không biết tên Combat hay
Health.

Data source:

- `Combat.Attacks.json`: `Combat.Attack.ResonanceStrike`, kind `Melee`,
  power profile `Combat.Power.ResonanceStrike`, neutral element, range `300`,
  power `40`, cooldown `1s`.
- `Combat.Input.json`: action `Attack`, phím `C`.
- `Health.Attributes.json`: maximum health của target.

Target `APaldarkQATargetActor` là fixture QA tùy chọn, chỉ được scenario spawn
khi chạy với cờ `-PaldarkCombatQA`; nó không xuất hiện trong các fixture
Movement/Crafting thông thường. Combat không nhận diện target bằng tag QA:
mọi actor trong tầm, khác attacker, có component implement
`IPaldarkDamageReceiver` đều là ứng viên; actor gần attacker nhất được chọn.
Health Game Feature gắn component bằng generated `Health.uasset`, còn Combat
tương tự dùng generated `Combat.uasset` để compose component/input action.

Nghiệm thu không chấp nhận dòng Combat `hit` đơn độc. Với cùng correlation id
phải thấy intent, validation, damage request, Health mutation có HP
before/after, Combat result và client replication `authority=false`. QA cũng
phát sinh cooldown và out-of-range rejection; HP về zero phải do Health ghi
death/knockdown.

## 25.5 — Giao diện lập trình

Component là `UCombatComponent`, gắn ngoài vào actor có thể gây damage hoặc nhận combat intent. Health component thuộc core/GAS owner; item/equipment được đọc qua `Paldark.Core.ItemRead`. Combat không include module Inventory, Pal hay Movement.

```cpp
UFUNCTION()
FCombatResult RequestAttack(
    FPaldarkEntityId AttackerId, FPaldarkEntityId TargetId, FName AttackDefinitionId);

UFUNCTION()
FCombatResult RequestFire(
    FPaldarkEntityId AttackerId, FPaldarkEntityId WeaponItemId, const FAttackAim& Aim);

UFUNCTION()
FCombatSnapshot ReadCombat(FPaldarkEntityId ActorId) const;
```

Thân hàm chỉ mô tả boundary:

```cpp
FCombatResult UCombatComponent::RequestAttack(
    FPaldarkEntityId AttackerId,
    FPaldarkEntityId TargetId,
    FName AttackDefinitionId)
{
    // Validate attacker intent, authority, cooldown and attack definition.
    // Build an FPaldark DamageRequest for the receiving owner; return FDamageResult with before/after HP.
    // Publish accepted/rejected result; do not write target health here.
}
```

Kênh phát:

- `Paldark.Combat.Event.AttackAccepted`
- `Paldark.Combat.Event.ProjectileCreated`
- `Paldark.Combat.Event.HitResolved`
- `Paldark.Combat.Result.Rejected`

Kênh nghe:

- `Paldark.Input.Intent.Attack`
- `Paldark.Inventory.Event.Changed`
- `Paldark.Core.Result.DamageResult`
- `Paldark.Movement.Event.ModeChanged`

Đây là chỗ L2 dễ bị vi phạm nhất. Combat không include `InventoryComponent.h` để hỏi weapon, không include `PalComponent.h` để hỏi skill, và không include `MovementComponent.h` để tự khóa sprint. Nó dùng `Paldark.Core.ItemRead`, message channels và core damage interface. Inventory phát equipment change; Health phát damage result; Movement phát mode change. Nếu một dependency không có contract, phải bổ sung interface lõi hoặc channel trước, không include tạm một class.

## 25.6 — Quyền hạn và đồng bộ

Client tự đọc input, aim camera, chạy animation prediction, muzzle flash và hit marker tạm thời. Server quyết định attack permission, cooldown, target relevancy, projectile simulation hoặc hit validation, damage request acceptance và result. Health owner trên authority quyết định HP, resist, status, knockdown/death.

Damage result, HP/attribute delta, death/knockdown state và relevant projectile result cần replicate. Animation, camera shake, sound và local crosshair chỉ là presentation; hit marker cuối phải dựa trên result authority, không chỉ dựa trên trace client.

Nếu dùng GAS, Combat phát request qua core/GAS contract và đọc `DamageResult`; nếu không dùng GAS, contract `Paldark.Core.DamageRequest` vẫn phải giữ nguyên ownership. Đây là cách giữ public boundary ổn định dù implementation thay đổi.

## 25.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkCombat` cho intent, validation, projectile và hit resolution; `LogPaldarkGAS` hoặc category của health owner cho damage/HP mutation. Hai category phải dùng cùng `corr`. Một dòng Combat không được giả vờ rằng HP đã giảm; nó ghi `DamageRequest=Sent` hoặc `HitResolved`. Health owner ghi before/after HP.

Command đã có thật:

- `Paldark.Combat.SpawnDummy`
- `Paldark.Combat.Fire`
- `Paldark.Gas.Damage`
- `Paldark.Gas.DumpAttributes`

Command QA đề xuất:

- `Paldark.Combat.QA.Setup`
- `Paldark.Combat.Status`
- `Paldark.Combat.QA.Trigger`

Test tối thiểu: setup attacker/target, dump attribute trước, trigger attack, lọc `corr`, kiểm request → authority decision → damage result → HP mutation → death/knockdown observer. Nếu `LogPaldarkCombat` có “hit” nhưng không có `LogPaldarkGAS`/health mutation, đó có thể là miss, rejection hoặc bug boundary; không được kết luận target đã mất máu chỉ từ animation.

---

**Bằng chứng cho chương này.** `F-009` tới `F-014` và `F-022` tới `F-028` là mã thật trong catalog. `EPalWeaponType` có 21 giá trị gồm `MAX`; `MagazineSize`, `Durability`, `SneakAttackRate`, `bSleepWeapon`, `EnemyReceiveDamageRate` và các field damage là EXTRACTED/REFERENCE từ `C03-Combat.md`; công thức và authority runtime cụ thể được ghi rõ là REFERENCE/INFERRED. Các command Combat/GAS liệt kê là OBSERVED trong PaldarkLab. `Combat.Attack`, `Paldark.Core.DamageRequest`, component, channels và owner table là thiết kế Paldark INFERRED, bám mô hình bên gây gửi yêu cầu/bên nhận quyết định ở Chương 12.4.
