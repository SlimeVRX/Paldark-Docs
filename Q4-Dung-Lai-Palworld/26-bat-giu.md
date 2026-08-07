# Chương 26 — Bắt giữ

Vài giây trước, creature trước mặt còn lao vào người chơi. Sau một chuỗi đòn vừa đủ và một lần ném đúng lúc, cũng cá thể ấy có thể xuất hiện trong roster, được gọi ra chiến đấu hoặc giao việc ở căn cứ. Bắt giữ hấp dẫn ở cú đổi nghĩa đó: ta không chỉ loại bỏ một mối đe dọa, mà biến một sinh vật ngoài thế giới thành “con của mình”.

Khoảnh khắc ấy nhìn liền mạch, nhưng nó đi qua nhiều boundary nhất trong các chương đầu. Capture phải đọc state của mục tiêu, dùng item từ Inventory, tạo entity bền rồi đề nghị đưa entity vào roster hoặc storage. Chính vì chạm nhiều hệ thống, nó càng không được include Combat, Health, Inventory hay Companion. Mọi bước phải đi qua interface lõi và message contract để một thành công không trở thành bốn owner cùng sửa state.

## 26.1 — Vì sao hệ thống này tồn tại

Bắt giữ nối combat với collection bằng một khoảng chờ có rủi ro. Người chơi làm yếu mục tiêu, chọn sphere phù hợp, ném vào đúng thời điểm rồi chờ một kết quả chưa chắc chắn. Nếu thất bại, target không tự biến mất chỉ vì animation đã chạy. Nếu thành công, kết quả không thể dừng ở một dòng UI; nó phải tạo ra identity mới để các chương sau còn dùng được.

`CaptureRateCorrect` trong `PalCharacterParameterDatabaseRow.h` cho thấy hệ số điều chỉnh tỷ lệ bắt nằm ở tầng definition của loài. Nó chứng minh hình dạng input của bài toán, không chứng minh công thức Palworld gốc. Paldark phải giữ hệ số trong data, còn công thức và thứ tự modifier là contract cần kiểm chứng riêng.

## 26.2 — Nó chạm những gì trong catalog

- `F-015` — Ném sphere.
- `F-016` — Tỉ lệ bắt.
- `F-017` — Điều chỉnh theo HP.
- `F-018` — Điều chỉnh theo sphere.
- `F-019` — Capture thất bại.
- `F-020` — Kết quả capture.
- `F-021` — Tạo creature instance.

Chuỗi mã catalog cũng chính là chuỗi phụ thuộc của một lần thử. `F-017` cần HP hiện tại nhưng không được đọc field private của Health; Capture query `Paldark.Core.HealthRead` và nhận `FPaldarkHealthSnapshot`. `F-021` cần entity identity nhưng không tự sinh ID tùy ý; nó gọi `Paldark.Core.EntityIdentity.Create` với `FPaldarkEntityCreateContext`. Sphere đi qua `Paldark.Core.ItemRead`/Inventory transaction, không qua include Inventory.

## 26.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Capture definition và `rateCorrect` | `Capture` data registry | capture validator, UI, QA | thêm file definition; không đổi lúc chạy |
| HP snapshot của target | `Health/GAS` | capture query và UI | `Paldark.Core.HealthRead` |
| Capture attempt | `Capture` authority | UI, log, target observer | `Paldark.Capture.Request.Try` |
| Sphere item quantity | `Inventory` | Capture và UI | `Paldark.Inventory.Request.Remove` sau khi accepted |
| Capture result | `Capture` | UI, log, target/roster observer | authority resolve attempt |
| Creature entity mới | `Creature/Entity` owner | roster, storage, companion, save | `Paldark.Core.EntityIdentity.Create(FPaldarkEntityCreateContext)` và entity request |
| Roster/storage relation | party hoặc storage owner | companion, UI, save | `Paldark.Capture.Event.EntityCreated` rồi transfer request |

Đọc bảng theo thời gian sẽ thấy mỗi bước đổi owner: Health cung cấp snapshot, Capture resolve attempt, Inventory commit sphere, Entity tạo identity, rồi party/storage nhận relation. Capture không ghi HP, không tự trừ sphere trước khi authority chấp nhận và không tự sở hữu roster. Một thất bại có thể vẫn tiêu item tùy policy; policy ấy phải nằm trong data/contract, không được ẩn trong UI.

## 26.4 — Hợp đồng dữ liệu

Data của Capture chỉ nên trả lời mục tiêu này và sphere policy tác động thế nào lên phép thử. `Capture.Modifier` vì thế chứa hệ số definition-level cùng policy sphere; nó không chụp HP hiện tại hay entity id vào definition tĩnh.

```cpp
USTRUCT()
struct FCaptureModifierFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() float RateCorrect = 1.f;
    UPROPERTY() FName CapturePolicyId;
};
```

Definition đã điền:

```json
{
  "id": "Capture.Target.CuteFox",
  "schema": 1,
  "display": { "nameKey": "Capture.Target.CuteFox.Name" },
  "fragments": [
    {
      "type": "Capture.Modifier",
      "rateCorrect": 0.85,
      "capturePolicyId": "Capture.Policy.StandardSphere"
    }
  ]
}
```

`0.85` chỉ là giá trị minh họa Paldark, không phải số Palworld. Tên field `CaptureRateCorrect` là EXTRACTED; công thức từ field đó tới probability cuối là UNKNOWN.

Capture khai báo chunk `Paldark.Capture`, schema `1`, chỉ cho dữ liệu cần giữ như first-result/attempt history nếu product yêu cầu. Entity mới và roster relation vẫn do owner tương ứng ghi; không nhét toàn bộ creature vào chunk Capture.

## 26.5 — Giao diện lập trình

Từ phía requester, API phải giữ được toàn bộ chuỗi ấy trong một correlation mà không phơi implementation. `UCaptureComponent` dùng ba interface lõi: `Paldark.Core.HealthRead`, `Paldark.Core.ItemRead`, `Paldark.Core.EntityIdentity`. Không có include sang Combat, Inventory, Companion hay Health.

```cpp
UFUNCTION()
FCaptureResult RequestTry(
    FPaldarkEntityId RequesterId,
    FPaldarkEntityId TargetId,
    FPaldarkEntityId SphereItemId);

UFUNCTION()
FCaptureSnapshot ReadAttempt(FPaldarkEntityId TargetId) const;
```

Thân hàm chỉ ghi contract:

```cpp
FCaptureResult UCaptureComponent::RequestTry(
    FPaldarkEntityId RequesterId,
    FPaldarkEntityId TargetId,
    FPaldarkEntityId SphereItemId)
{
    // Query target health and definition through core interfaces.
    // Ask the authority to validate and resolve the capture attempt.
    // Create an entity only on success and publish the result.
}
```

Kênh phát:

- `Paldark.Capture.Event.AttemptResolved`
- `Paldark.Capture.Event.EntityCreated`
- `Paldark.Capture.Result.Rejected`

Kênh nghe:

- `Paldark.Combat.Event.HitResolved`
- `Paldark.Core.Event.HealthChanged`
- `Paldark.Inventory.Event.Changed`
- `Paldark.Core.Event.EntityTransferAccepted`

`Paldark.Combat.Event.HitResolved` chỉ là thông báo; Capture không include Combat. Nếu cần “mục tiêu vừa bị đánh”, Capture đọc health snapshot mới nhất hoặc gửi query, không đoán HP từ damage animation.

## 26.6 — Quyền hạn và đồng bộ

Người chơi cần thấy quỹ đạo và phản hồi ngay khi ném, nhưng không thể tự quyết rằng target đã thuộc về mình. Client tự ngắm, hiển thị sphere trajectory và preview probability nếu contract cho phép. Server quyết định target hợp lệ, HP snapshot dùng để resolve, sphere ownership, cooldown, probability result và entity creation. Client không tự tạo creature entity hay tự chuyển item.

Kết quả capture, target state, sphere transaction và stable entity id replicate cho client liên quan. Preview arc, shake, sound và UI counter tạm thời chỉ là presentation. Definition và `CaptureRateCorrect` là static data, không cần gửi nguyên payload qua mạng.

Nếu thành công, thứ tự contract là: Capture accepted → Inventory remove → EntityIdentity create → entity/roster transfer. Nếu một bước sau thất bại, transaction phải trả result rõ ràng và không để creature nửa tạo nửa mất.

## 26.7 — Log, console command, và cách biết là chạy đúng

Một animation rung rồi bật ra không đủ để giải thích vì sao lần bắt thất bại. `LogPaldarkCapture` phải nối được query HP, authority decision, sphere transaction và entity creation bằng một `corr`. Health mutation trước đó có correlation khác hoặc cùng correlation tùy request chain, nhưng Capture không được ghi như thể nó sở hữu HP.

Command:

- `Paldark.Capture.QA.Setup`
- `Paldark.Capture.Status`
- `Paldark.Capture.QA.Trigger`
- `Paldark.Pal.SpawnFromDefinition` — command thật để tạo target fixture trong PaldarkLab.
- `Paldark.Inventory.List` — command thật để kiểm sphere/entity transfer.

Test đúng bắt đầu bằng target có definition và HP biết trước; status phải đọc được `rateCorrect`/HP; sau trigger, log phải kể được request → decision → item transaction → entity creation hoặc rejection. Thành công phải kết thúc bằng stable instance id. Thất bại phải giữ target theo policy và chỉ đổi Inventory nếu policy nói vậy.

---

## 26.8 — Slice native đã triển khai

Phần contract trên cho ta biết thứ tự đúng; slice native dùng hai Game Features để chứng minh thứ tự ấy không chỉ nằm trên giấy. `Creature` là owner của
`FPaldarkEntityId`, pending creation, roster và replicated transfer.
`Capture` chỉ sở hữu intent, attempt và result; nó không ghi HP, quantity,
slot hay roster. Capture tìm capability bằng `IPaldarkHealthRead`,
`IPaldarkItemTransaction`, `IPaldarkEntityIdentity` và
`IPaldarkEntityTransfer`, không include implementation header của feature khác.

QA dùng RNG server-only và seed cố định: seed `17` cho full HP tạo
`roll≈0.064882`, threshold `0.05` nên thất bại; seed `23` sau khi target nhận
60 damage tạo `roll≈0.498554`, threshold `0.51` nên thành công. Công thức là:

```text
hp_ratio = current / maximum
hp_factor = 1 - hp_ratio
threshold = clamp(rateCorrect * hp_factor * sphereCoefficient, 0.05, 0.95)
```

Mỗi lần thử phải ghi `corr`, `seed`, `roll`, `threshold`, `rateCorrect`,
`hp_current`, `hp_max`, `hp_ratio`, `hp_factor` và `sphere_coefficient`; vì
vậy người đọc có thể tự tính lại quyết định `roll < threshold`. Policy
`Capture.Policy.StandardSphere` nằm trong `Capture.Targets.json` và đặt
`consumeSphereOnFailure=true`.

Luồng authority bắt buộc là:
`Capture accepted → Inventory remove sphere → EntityIdentity create → roster
transfer`. Entity creation hoặc transfer lỗi phải destroy pending entity,
refund sphere, log kết quả refund và ghi Error nếu refund cũng lỗi. Thất bại
roll giữ target sống; thành công trả stable instance id và log Creature ghi
roster transfer. Client chỉ nhận result/roster replicate với
`authority=false`.

QA fixture chỉ được bật bằng `-PaldarkCaptureQA`; sphere fixture được nạp qua
`IPaldarkItemTransaction`, không phải Inventory biết Capture. Khi test Windows
`.exe`, đối chiếu server/client theo correlation: HP snapshot, toàn bộ thành
phần threshold, sphere before/after, entity id, roster transfer, target còn
sống ở nhánh fail và `authority=false` ở client. Không chấp nhận readiness log
thay cho chuỗi transaction trên.

Một capture thành công mới chỉ tạo ra creature entity và relation. Để cá thể ấy trở thành người bạn thật sự có mặt bên người chơi, ta còn phải giải một bài toán khác: identity phải sống ngay cả khi actor representation chưa được spawn. Đó là điểm bắt đầu của Chương 27.

**Bằng chứng cho chương này.** `F-015` tới `F-021`, `CaptureRateCorrect`, `FCaptureResult` ba field, `FailedCaptureType` và `FPalInstanceID` là mã/field được ghi trong catalog và whitepaper (EXTRACTED/REFERENCE). Công thức probability, transaction order runtime và owner Palworld cụ thể là UNKNOWN. `Paldark.Pal.SpawnFromDefinition` và `Paldark.Inventory.List` là command OBSERVED; fragment, interfaces, channels, save chunk và owner table là thiết kế Paldark INFERRED bám Chương 14 và L8.
