# Chương 26 — Bắt giữ

Một creature đang tấn công người chơi là một mối đe dọa. Sau một cú đánh vừa đủ, cùng creature đó có thể trở thành thứ người chơi mang về, đặt vào đội hoặc giao cho một công việc. Cảm giác của bắt giữ nằm ở cú chuyển này: không chỉ thắng trận, mà biến một cá thể ngoài thế giới thành “con của mình”.

Đây là hệ thống chạm nhiều boundary nhất trong các chương đầu. Nó đọc state của mục tiêu, dùng item từ inventory, tạo entity bền và đưa entity vào roster hoặc storage. Vì thế Capture không được include Combat, Health, Inventory hay Companion. Nó chỉ làm việc qua interface lõi và message contract.

## 26.1 — Vì sao hệ thống này tồn tại

Bắt giữ nối combat với collection. Người chơi làm yếu mục tiêu, chọn sphere phù hợp, ném vào đúng thời điểm và chờ một kết quả chưa chắc chắn. Thất bại không xóa target khỏi thế giới; thành công tạo ra một identity mới có thể được dùng ở các chương sau.

`CaptureRateCorrect` trong `PalCharacterParameterDatabaseRow.h` cho thấy hệ số điều chỉnh tỷ lệ bắt nằm ở tầng definition của loài. Nó chứng minh hình dạng input của bài toán, không chứng minh công thức Palworld gốc. Paldark phải giữ hệ số trong data, còn công thức và thứ tự modifier là contract cần kiểm chứng riêng.

## 26.2 — Nó chạm những gì trong catalog

- `F-015` — Ném sphere.
- `F-016` — Tỉ lệ bắt.
- `F-017` — Điều chỉnh theo HP.
- `F-018` — Điều chỉnh theo sphere.
- `F-019` — Capture thất bại.
- `F-020` — Kết quả capture.
- `F-021` — Tạo creature instance.

`F-017` cần đọc HP hiện tại nhưng không được đọc field private của Health. Capture gửi query tới `Paldark.Core.HealthRead`; Health owner trả `FPaldarkHealthSnapshot`. `F-021` cần entity identity nhưng không tự sinh ID tùy ý; nó gọi `Paldark.Core.EntityIdentity.Create` với `FPaldarkEntityCreateContext`. Item sphere được yêu cầu qua `Paldark.Core.ItemRead`/Inventory transaction, không include Inventory.

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

Capture không ghi HP, không tự trừ sphere trước khi authority chấp nhận, và không tự sở hữu roster. Một thất bại có thể vẫn tiêu item tùy policy; policy đó phải là data/contract, không được ẩn trong UI.

## 26.4 — Hợp đồng dữ liệu

Mảnh do Capture định nghĩa là `Capture.Modifier`. Nó chứa hệ số definition-level và policy sphere; không chứa HP hiện tại hay entity id.

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

Component là `UCaptureComponent`, gắn vào requester. Nó dùng ba interface lõi: `Paldark.Core.HealthRead`, `Paldark.Core.ItemRead`, `Paldark.Core.EntityIdentity`. Không có include sang Combat, Inventory, Companion hay Health.

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

Client tự ngắm, hiển thị sphere trajectory và preview probability nếu contract cho phép. Server quyết định target hợp lệ, HP snapshot dùng để resolve, sphere ownership, cooldown, probability result và entity creation. Client không được tự tạo creature entity hay tự chuyển item.

Kết quả capture, target state, sphere transaction và stable entity id replicate cho client liên quan. Preview arc, shake, sound và UI counter tạm thời chỉ là presentation. Definition và `CaptureRateCorrect` là static data, không cần gửi nguyên payload qua mạng.

Nếu thành công, thứ tự contract là: Capture accepted → Inventory remove → EntityIdentity create → entity/roster transfer. Nếu một bước sau thất bại, transaction phải trả result rõ ràng và không để creature nửa tạo nửa mất.

## 26.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkCapture`. Chuỗi log phải nối được query HP, authority decision, sphere transaction và entity creation bằng một `corr`. Health mutation trước đó có correlation khác hoặc cùng correlation tùy request chain, nhưng không được Capture ghi như thể nó sở hữu HP.

Command:

- `Paldark.Capture.QA.Setup`
- `Paldark.Capture.Status`
- `Paldark.Capture.QA.Trigger`
- `Paldark.Pal.SpawnFromDefinition` — command thật để tạo target fixture trong PaldarkLab.
- `Paldark.Inventory.List` — command thật để kiểm sphere/entity transfer.

Test đúng: setup target có definition và HP biết trước; status đọc `rateCorrect`/HP; trigger capture; lọc log thấy request → decision → item transaction → entity creation hoặc rejection. Thành công phải có stable instance id; thất bại phải giữ target theo policy và chỉ đổi inventory nếu policy nói vậy.

---

## 26.8 — Slice native đã triển khai

Slice native tách thành hai Game Features. `Creature` là owner của
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

**Bằng chứng cho chương này.** `F-015` tới `F-021`, `CaptureRateCorrect`, `FCaptureResult` ba field, `FailedCaptureType` và `FPalInstanceID` là mã/field được ghi trong catalog và whitepaper (EXTRACTED/REFERENCE). Công thức probability, transaction order runtime và owner Palworld cụ thể là UNKNOWN. `Paldark.Pal.SpawnFromDefinition` và `Paldark.Inventory.List` là command OBSERVED; fragment, interfaces, channels, save chunk và owner table là thiết kế Paldark INFERRED bám Chương 14 và L8.
