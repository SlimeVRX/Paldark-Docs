# Chương 21 — Di chuyển và input

Người chơi bấm phím, nhân vật phải đi ngay. Không cần một hệ thống di chuyển phức tạp mới tạo được cảm giác này; chỉ cần input bị trễ, hướng camera sai hoặc sprint đổi tốc độ không rõ ràng là thế giới lập tức có cảm giác nặng nề. Hệ thống này tồn tại để người chơi có một cơ thể đáng tin cậy: nhìn đâu đi đó, nhảy khi cần, và biết mình đang tiêu hao điều gì khi chạy.

Đây là lát cắt đầu tiên của Quyển 4. Sau chương này, người chơi chưa có gì để nhặt hay đánh, nhưng đã có thể bước vào thế giới và kiểm tra cảm giác nền. Mọi hệ thống sau đều dựa vào vị trí, hướng nhìn và intent từ đây.

## 21.1 — Vì sao hệ thống này tồn tại

Di chuyển nối người chơi với địa hình. Đi bộ tạo nhịp thăm dò; nhảy làm vật cản thấp có ý nghĩa; sprint biến khoảng cách thành một quyết định; glide, bơi và mount mở các cách đọc khác nhau về cùng một bản đồ. Không phải tất cả đều phải có trong vertical slice đầu tiên. Điều phải có trước là input đi qua một boundary rõ ràng và movement state có một owner.

Input cũng cần được tách khỏi logic di chuyển. Một phím có thể đổi sau này, một thiết bị có thể gửi intent khác, và một bot có thể điều khiển cùng movement interface. Nếu code di chuyển biết trực tiếp phím nào được bấm, mỗi thay đổi mapping lại kéo theo thay đổi gameplay.

## 21.2 — Nó chạm những gì trong catalog

- `F-001` — Đi bộ và chạy.
- `F-002` — Nhảy.
- `F-003` — Sprint.
- `F-004` — Leo trèo.
- `F-005` — Bơi.
- `F-006` — Lướt / glide.
- `F-007` — Cưỡi.

Catalog đánh dấu leo, bơi và glide là `INFERRED`, còn `MountType` và taxonomy `Glider` là evidence về hình dạng. Vì vậy chương này định nghĩa contract cho các mode đó nhưng không tự đặt tốc độ, stamina cost hay điều kiện unlock. Những giá trị đó phải nằm trong definition của feature hoặc feature companion tương ứng.

## 21.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Hướng nhìn và input axis hiện tại | `Movement` của local player | camera, animation presentation, movement component | `Paldark.Input.Intent.Move` hoặc `Look` từ client |
| Vị trí, vận tốc và movement mode | `Movement` trên authority | server, relevant clients, camera và interaction query | `Paldark.Movement.Request.Move`, `Jump`, `Sprint` |
| Stamina hiện tại | `Movement` | UI, sprint validator, animation | request movement hợp lệ; không cho UI ghi |
| Mode `Walk/Run/Sprint/Swim/Glide/Ride` | `Movement` | presentation, interaction, companion nếu mount | `Paldark.Movement.Request.SetMode` |
| Mount entity đang gắn | `Movement` không sở hữu Pal instance | companion/mount feature, server, relevant clients | interface lõi `Paldark.Core.Mount`; Movement phát `Paldark.Movement.Event.MountChanged` |
| Input binding và action tag | `Input` | local player, input debug command | cấu hình input text/asset theo policy, không phải gameplay state |

`Movement` không sở hữu identity của Pal cưỡi. Nó chỉ giữ mode và liên kết tạm thời tới stable instance id; feature companion là nơi quyết định Pal nào có mount capability. Đây là ranh giới để chương 21 không nuốt mất chương 27 sau này.

## 21.4 — Hợp đồng dữ liệu

Loại mảnh của hệ thống là `Movement.Capable`, chứa các mode và tuning mà một definition có thể cung cấp. Một creature có `Movement.Capable` không có nghĩa là nó đang cưỡi hay đang bơi; đó là dữ liệu tĩnh. Trạng thái hiện tại thuộc thực thể và do Movement làm chủ.

```cpp
USTRUCT()
struct FMovementCapableFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY()
    TArray<FName> Modes;

    UPROPERTY()
    FName SpeedProfileId;

    UPROPERTY()
    FName InputProfileId;
};
```

Ví dụ definition đã điền:

```json
{
  "id": "Movement.Player.Basic",
  "schema": 1,
  "display": { "nameKey": "Movement.Player.Basic.Name" },
  "fragments": [
    {
      "type": "Movement.Capable",
      "modes": ["Walk", "Run", "Sprint", "Jump"],
      "speedProfileId": "Movement.Speed.Player",
      "inputProfileId": "Paldark.Input.Player"
    }
  ]
}
```

`modes` là hình dạng contract, không phải lời khẳng định Palworld gốc dùng đúng các tên này. `SpeedProfileId` và `InputProfileId` cho phép tuning nằm trong data; component không hard-code một bộ tốc độ cho mọi definition.

Movement không khai báo khối lưu `Paldark.Movement` cho vertical slice đầu tiên: vị trí và mode phiên được dựng lại từ world/entity state. Nếu sau này thiết kế yêu cầu lưu stamina hoặc mount relation, đó phải là một save chunk mới có owner và schema riêng; không nhét chúng vào khối lưu của Inventory hay Companion.

### Hợp đồng đã hiện thực trong Movement slice

Ta từng tin rằng phần input của chương này có thể được mô tả bằng một definition/fragment trừu tượng rồi chờ Data Registry hoàn chỉnh cung cấp `InputProfileId`. Code thật của Movement cho thấy lát cắt đầu tiên cần một bước trung gian để chứng minh được đường đi end-to-end: component đọc file text feature-owned `Data/Movement.Input.json`, parse các action và mapping, rồi tạo `UInputAction` cùng `UInputMappingContext` lúc runtime. Input không nằm hard-code trong pawn và mapping có thể thay đổi bằng dữ liệu, nên đã thoát khỏi cách PaldarkV3 tạo input object không có nguồn dữ liệu rõ ràng.

Nhưng đây chưa phải Data Registry đầy đủ như Chương 14 mô tả. File input được load trực tiếp bởi `UMovementFeatureComponent`; nó chưa đi qua một registry definition/fragment có schema đóng băng, owner index và lifecycle nạp chung. Quyết định mới là coi đây là trạng thái trung gian có chủ ý của vertical slice: giữ JSON text và đường copy packaging để kiểm chứng kiến trúc trước, đồng thời không gọi nó là registry hoàn chỉnh. Câu hỏi có nên nâng input profile thành definition/fragment trong Data Registry đã được ghi ở Phụ lục B.

## 21.5 — Giao diện lập trình

Component chính là `UMovementRuntimeComponent`, gắn vào lớp actor nền của player hoặc entity có movement. `UInputIntentComponent` chỉ chuyển input local thành intent; nó không được gọi thẳng setter state.

```cpp
USTRUCT()
struct FMovementIntent
{
    GENERATED_BODY()

    UPROPERTY() FVector2D MoveAxis;
    UPROPERTY() FVector2D LookAxis;
    UPROPERTY() bool bJumpPressed = false;
    UPROPERTY() bool bSprintHeld = false;
};

UFUNCTION()
FMovementResult RequestMove(const FMovementIntent& Intent);

UFUNCTION()
FMovementSnapshot ReadMovement() const;

UFUNCTION()
FMovementResult RequestMode(FName ModeId);
```

Các hàm trên nhận intent/snapshot và trả result có `Accepted`, `Reason`, `Mode` và `Authority`. Thân hàm ở giai đoạn này chỉ cần cam kết những việc phải làm:

```cpp
FMovementResult UMovementRuntimeComponent::RequestMove(
    const FMovementIntent& Intent)
{
    // Validate authority, input bounds and current movement mode.
    // Apply accepted movement request through the movement owner.
    // Emit a standard mutation log and return the result.
}
```

Kênh phát:

- `Paldark.Movement.Event.ModeChanged`
- `Paldark.Movement.Event.SnapshotChanged`
- `Paldark.Movement.Result.Rejected`

Kênh nghe:

- `Paldark.Input.Intent.Move`
- `Paldark.Input.Intent.Look`
- `Paldark.Input.Intent.Jump`
- `Paldark.Companion.Event.MountAccepted`

Không có include từ Movement sang Inventory, Combat hay Companion. Nếu sprint cần đọc stamina, stamina là state trong Movement. Nếu mount cần đổi movement mode, Companion phát `Paldark.Companion.Event.MountAccepted` hoặc gọi interface lõi mount; Movement không include class cụ thể của Companion.

## 21.6 — Quyền hạn và đồng bộ

Client tự đọc input, đổi camera local và dự đoán presentation ngắn hạn. Server quyết định vị trí authoritative, mode hợp lệ, collision result, stamina mutation và quyền mount. Client không được gửi “vị trí mới”; client gửi intent.

Vị trí, vận tốc, mode và stamina cần replicate theo relevancy. Camera boom, blend animation, hiệu ứng bụi và âm thanh bước chân chỉ là hình ảnh local hoặc presentation đọc replicated state. Input binding không cần replicate; server nhận action intent đã được kiểm tra.

Leo, bơi và glide là vùng `UNKNOWN` về runtime Palworld cụ thể. Trong Paldark, chúng vẫn phải đi qua cùng `RequestMode`, để thêm mode không cần sửa switch trung tâm. Nếu mount entity có stable id, chỉ id và mode cần nằm trong contract mạng; actor presentation có thể được dựng lại.

## 21.7 — Log, console command, và cách biết là chạy đúng

Category của feature là `LogPaldarkMovement`, được khai báo trong `MovementLog.h` và define ở module Movement; không thêm vào `PaldarkCoreLog.h`. Mỗi accepted mode change và mỗi authority rejection phải có `PD|...` với `field=MovementMode`, `before`, `after`, `requester`, `target`, `reason` và `corr`.

Command:

- `Paldark.Movement.Dump` — đã hiện thực, in input config và state Movement hiện tại.
- `Paldark.Movement.QA.Move` — đã hiện thực, áp dụng một lần input tiến deterministic.
- `Paldark.Movement.QA.Jump` — đã hiện thực, áp dụng một lần yêu cầu nhảy.
- `-PaldarkMovementQA` — cờ packaged headless, chạy bộ kiểm chứng sau khi pawn được possess và component đã attach.
- `Paldark.Input.ListBindings` — command đã có thật trong PaldarkLab, không phải command của Movement slice.

Một phiên kiểm tối thiểu: setup player, dump status, trigger move trong một giây, trigger jump, trigger sprint, dump lại. Đúng nghĩa là client không tự đổi position, server có log accepted/rejected, mode đổi đúng, và camera/animation chỉ phản ứng sau snapshot hoặc prediction đã quy định.

## 21.8 — Player setup đã đối chiếu với PaldarkV2

PaldarkV2 là reference đã được package và debug thực tế. Các giá trị quan
trọng được giữ trong PlayerPresentation data của PaldarkKit: body mesh scale
`0.01`, relative location `(0, 0, -90)`, relative rotation `(0, -90, 0)`,
capsule `radius=34`, `half-height=88`, spring arm `length=360`, target offset
`(0, 0, 65)`, socket offset `(0, 135, 15)` và
`bUsePawnControlRotation=true`. Rotation vận động dùng
`bUseControllerRotationYaw=false`, `bOrientRotationToMovement=true`, rate
`(0, 540, 0)`.

Runtime tạo camera boom/camera như capability chung của base character;
PlayerPresentation đọc JSON và áp dụng cách framing, mesh transform và
capsule geometry. Cách này không bê nguyên `APaldarkV2Character` vào Runtime:
Runtime giữ actor/camera capability ổn định, còn Presentation sở hữu quyết
định hình ảnh và các con số tuning.

Enhanced Input được tạo bằng `UEnhancedInputComponent` ổn định trên pawn.
Movement vẫn sở hữu action binding và mapping context, nhưng context phải được
add vào `UEnhancedInputLocalPlayerSubsystem` của `PlayerController` local với
priority `0`. `Movement.Input.json` là source text được đọc lúc runtime; log
phải chứng minh file loaded, mapping context added, action fired, axis khác
zero và velocity thay đổi.

Head mesh là component con của body mesh, dùng relative transform identity
(`location=(0,0,0)`, `rotation=(0,0,0)`, `scale=(1,1,1)`) và leader pose từ body;
đây là cùng cách PaldarkV2 dựng `HeadMesh`, không phải một actor độc lập hay
một vị trí hard-code trong C++. Spawn fixture ghi riêng `PlayerStart`, mặt sàn
và kích thước capsule để kiểm tra chân không lún sàn; vị trí spawn chỉ là điểm
khởi đầu cao hơn mặt sàn, sau đó collision đưa capsule về độ cao đứng hợp lệ.

---

**Bằng chứng cho chương này.** `F-001` tới `F-007` là OBSERVED trong catalog Chương 3; `EPalItemTypeA` có taxonomy `Glider` và `MountType` có các giá trị `None`, `Ride`, `Fly`, `Swim` là EXTRACTED/REFERENCE từ whitepaper. `Paldark.Input.ListBindings` là command OBSERVED trong PaldarkLab. Việc Movement đọc `Data/Movement.Input.json`, tạo `UInputAction`/`UInputMappingContext` lúc runtime, attach qua manifest và đăng ký ba command QA là OBSERVED từ code/package UE 5.6. `Movement.Capable`, các channel mở rộng, owner table và Data Registry hoàn chỉnh vẫn là hợp đồng Paldark INFERRED; tốc độ, stamina cost, collision và runtime movement owner cụ thể của Palworld là UNKNOWN.
