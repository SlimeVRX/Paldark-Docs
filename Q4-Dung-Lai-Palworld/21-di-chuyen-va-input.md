# Chương 21 — Di chuyển và input

Bạn đẩy cần tiến, nhân vật bước lên; xoay camera, cơ thể đổi hướng; giữ sprint, khoảng đất trước mặt ngắn lại. Những phản hồi ấy diễn ra quá tự nhiên nên người chơi chỉ chú ý khi chúng sai. Một nhịp input trễ, camera lệch khỏi hướng di chuyển hoặc sprint đổi tốc độ mà không cho thấy cái giá phải trả là đủ khiến cả thế giới bỗng nặng và xa lạ.

Vì vậy lát cắt đầu tiên của Quyển 4 không bắt đầu bằng một tính năng hào nhoáng. Nó bắt đầu bằng một cơ thể đáng tin cậy: nhìn đâu đi đó, nhảy khi cần và biết mình đang tiêu hao điều gì khi chạy. Sau chương này chưa có vật để nhặt hay kẻ địch để đánh, nhưng người chơi đã có thể bước vào thế giới. Quan trọng hơn với các chương sau, ta đã có vị trí, hướng nhìn và intent làm điểm xuất phát chung.

## 21.1 — Vì sao hệ thống này tồn tại

Di chuyển là cách người chơi đọc địa hình bằng chính cơ thể mình. Đi bộ tạo nhịp thăm dò; nhảy khiến một bậc đá thấp trở thành câu hỏi; sprint đổi stamina lấy thời gian; glide, bơi và mount mở những cách khác nhau để đi qua cùng một bản đồ. Vertical slice đầu tiên chưa cần trả lời hết mọi cách đi. Nó cần chứng minh điều căn bản hơn: input đi qua một boundary rõ ràng và movement state có đúng một owner.

Ranh giới ấy quan trọng vì phím bấm chỉ là một trong nhiều cách phát sinh ý định. Người chơi có thể đổi binding, gamepad có thể gửi axis khác, và một bot vẫn phải dùng được cùng movement interface. Nếu logic di chuyển biết trực tiếp phím nào đang được bấm, thay một mapping sẽ kéo theo thay gameplay. Nếu nó nhận intent, thiết bị có thể đổi mà luật di chuyển vẫn đứng yên.

## 21.2 — Nó chạm những gì trong catalog

- `F-001` — Đi bộ và chạy.
- `F-002` — Nhảy.
- `F-003` — Sprint.
- `F-004` — Leo trèo.
- `F-005` — Bơi.
- `F-006` — Lướt / glide.
- `F-007` — Cưỡi.

Danh sách này trải từ bước chân đầu tiên tới mount, nhưng evidence không đồng đều. Catalog đánh dấu leo, bơi và glide là `INFERRED`, còn `MountType` và taxonomy `Glider` chỉ là evidence về hình dạng. Vì vậy ta có thể chuẩn bị contract cho các mode đó mà chưa được phép điền hộ tốc độ, stamina cost hay điều kiện unlock. Những giá trị ấy phải nằm trong definition của feature hoặc feature companion tương ứng.

## 21.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Hướng nhìn và input axis hiện tại | `Movement` của local player | camera, animation presentation, movement component | `Paldark.Input.Intent.Move` hoặc `Look` từ client |
| Vị trí, vận tốc và movement mode | `Movement` trên authority | server, relevant clients, camera và interaction query | `Paldark.Movement.Request.Move`, `Jump`, `Sprint` |
| Stamina hiện tại | `Movement` | UI, sprint validator, animation | request movement hợp lệ; không cho UI ghi |
| Mode `Walk/Run/Sprint/Swim/Glide/Ride` | `Movement` | presentation, interaction, companion nếu mount | `Paldark.Movement.Request.SetMode` |
| Mount entity đang gắn | `Movement` không sở hữu Pal instance | companion/mount feature, server, relevant clients | interface lõi `Paldark.Core.Mount`; Movement phát `Paldark.Movement.Event.MountChanged` |
| Input binding và action tag | `Input` | local player, input debug command | cấu hình input text/asset theo policy, không phải gameplay state |

Bảng trên tách hai thứ người chơi cảm thấy như một hành động duy nhất. Khi bấm cưỡi, Companion phải quyết định Pal có capability hay không; Movement chỉ nhận kết quả, giữ mode và liên kết tạm thời tới stable instance id. `Movement` không sở hữu identity của Pal cưỡi. Ranh giới này giữ chương 21 không nuốt mất chương 27 chỉ vì cả hai cùng tham gia vào một khoảnh khắc gameplay.

## 21.4 — Hợp đồng dữ liệu

Khi ownership đã rõ, ta có thể tách “có khả năng làm gì” khỏi “đang làm gì”. Loại mảnh `Movement.Capable` chứa các mode và tuning mà một definition có thể cung cấp. Một creature có mảnh này không có nghĩa là nó đang cưỡi hay đang bơi; đó là dữ liệu tĩnh. Mode hiện tại là state của thực thể và do Movement làm chủ.

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

Đến đây contract nói điều ta muốn ổn định; code slice cho biết bước nào đã thật sự đi được. Ta từng tin rằng input có thể chờ Data Registry hoàn chỉnh cung cấp `InputProfileId`. Code thật của Movement cho thấy lát cắt đầu tiên cần một bước trung gian để chứng minh đường đi end-to-end: component đọc file text feature-owned `Data/Movement.Input.json`, parse các action và mapping, rồi tạo `UInputAction` cùng `UInputMappingContext` lúc runtime. Input không nằm hard-code trong pawn và mapping có thể thay đổi bằng dữ liệu, nên đã thoát khỏi cách PaldarkV3 tạo input object không có nguồn dữ liệu rõ ràng.

Nhưng đây chưa phải Data Registry đầy đủ như Chương 14 mô tả. File input được load trực tiếp bởi `UMovementFeatureComponent`; nó chưa đi qua một registry definition/fragment có schema đóng băng, owner index và lifecycle nạp chung. Quyết định mới là coi đây là trạng thái trung gian có chủ ý của vertical slice: giữ JSON text và đường copy packaging để kiểm chứng kiến trúc trước, đồng thời không gọi nó là registry hoàn chỉnh. Câu hỏi có nên nâng input profile thành definition/fragment trong Data Registry đã được ghi ở Phụ lục B.

## 21.5 — Giao diện lập trình

Từ góc nhìn caller, toàn bộ đường đi ấy phải thu lại thành một giao diện nhỏ. `UMovementRuntimeComponent` gắn vào lớp actor nền của player hoặc entity có movement. `UInputIntentComponent` đứng ở mép local, chuyển input thành intent; nó không được đi vòng qua authority bằng cách gọi thẳng setter state.

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

Hãy đặt đường chạy ấy vào multiplayer: client cần phản hồi ngay khi người chơi đẩy cần, nhưng không thể được quyền tuyên bố mình đã đứng ở đâu. Vì vậy client tự đọc input, đổi camera local và dự đoán presentation ngắn hạn. Server quyết định vị trí authoritative, mode hợp lệ, collision result, stamina mutation và quyền mount. Client không gửi “vị trí mới”; client gửi intent.

Vị trí, vận tốc, mode và stamina cần replicate theo relevancy. Camera boom, blend animation, hiệu ứng bụi và âm thanh bước chân chỉ là hình ảnh local hoặc presentation đọc replicated state. Input binding không cần replicate; server nhận action intent đã được kiểm tra.

Leo, bơi và glide là vùng `UNKNOWN` về runtime Palworld cụ thể. Trong Paldark, chúng vẫn phải đi qua cùng `RequestMode`, để thêm mode không cần sửa switch trung tâm. Nếu mount entity có stable id, chỉ id và mode cần nằm trong contract mạng; actor presentation có thể được dựng lại.

## 21.7 — Log, console command, và cách biết là chạy đúng

Người chơi chỉ cần thấy nhân vật chạy; chúng ta cần thấy cả con đường khiến nó chạy. Category của feature là `LogPaldarkMovement`, được khai báo trong `MovementLog.h` và define ở module Movement; không thêm vào `PaldarkCoreLog.h`. Mỗi accepted mode change và mỗi authority rejection phải có `PD|...` với `field=MovementMode`, `before`, `after`, `requester`, `target`, `reason` và `corr`.

Command:

- `Paldark.Movement.Dump` — đã hiện thực, in input config và state Movement hiện tại.
- `Paldark.Movement.QA.Move` — đã hiện thực, áp dụng một lần input tiến deterministic.
- `Paldark.Movement.QA.Jump` — đã hiện thực, áp dụng một lần yêu cầu nhảy.
- `-PaldarkMovementQA` — cờ packaged headless, chạy bộ kiểm chứng sau khi pawn được possess và component đã attach.
- `Paldark.Input.ListBindings` — command đã có thật trong PaldarkLab, không phải command của Movement slice.

Một phiên kiểm tối thiểu kể lại đúng một chuỗi hành động: setup player, dump status, cho nhân vật đi trong một giây, nhảy, sprint rồi dump lại. “Đi được” chưa đủ. Đúng nghĩa là client không tự đổi position, server có log accepted/rejected, mode đổi đúng, và camera/animation chỉ phản ứng sau snapshot hoặc prediction đã quy định.

## 21.8 — Player setup đã đối chiếu với PaldarkV2

Contract ở trên cho biết ai được làm gì; reference PaldarkV2 giúp cơ thể đầu tiên không xuất hiện với framing và hình học tùy tiện. PaldarkV2 là reference đã được package và debug thực tế. Các giá trị quan
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

Khi chuỗi input → intent → authority → movement snapshot đã đứng vững, người chơi có thể đi tới một vật trong thế giới. Chương tiếp theo bắt đầu đúng ở khoảng cách cuối cùng ấy: làm sao từ việc nhìn thấy một hòn đá, game xác định được người chơi đang chọn gì và có thật sự được phép nhặt nó hay không.

---

**Bằng chứng cho chương này.** `F-001` tới `F-007` là OBSERVED trong catalog Chương 3; `EPalItemTypeA` có taxonomy `Glider` và `MountType` có các giá trị `None`, `Ride`, `Fly`, `Swim` là EXTRACTED/REFERENCE từ whitepaper. `Paldark.Input.ListBindings` là command OBSERVED trong PaldarkLab. Việc Movement đọc `Data/Movement.Input.json`, tạo `UInputAction`/`UInputMappingContext` lúc runtime, attach qua manifest và đăng ký ba command QA là OBSERVED từ code/package UE 5.6. `Movement.Capable`, các channel mở rộng, owner table và Data Registry hoàn chỉnh vẫn là hợp đồng Paldark INFERRED; tốc độ, stamina cost, collision và runtime movement owner cụ thể của Palworld là UNKNOWN.
