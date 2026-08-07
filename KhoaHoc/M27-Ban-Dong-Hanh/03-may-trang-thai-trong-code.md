# Bài 03 — Máy trạng thái trong code, và ba cái bẫy nó giăng ra

> Khoá 27 — Bạn đồng hành. Bài đầu tiên có code. Nguồn: `PaldarkKit/Plugins/GameFeatures/PalBehavior/`, PR #159.

## Từ bảng chuyển trạng thái tới code

Bài 01 để lại năm trạng thái và sáu chuyển. Chuyển chúng thành code là phần dễ. Phần khó — và là toàn bộ nội dung bài này — là ba cái bẫy mà bảng đó **không** nói cho bạn biết.

Hình dạng cuối cùng:

```text
UPaldarkBehaviorComponent   giữ state, ra quyết định, chỉ chạy trên authority
APalBehaviorAIController    điều hướng + tri giác, do component tự spawn và possess
PalBehavior.Config.json     mọi hằng số
```

Nhịp quyết định là một timer `0.3s`, không phải `TickComponent`. Nhịp *di chuyển* vẫn mượt mỗi frame: level có NavData thì AI Controller path-follow; level không có NavData thì `TickComponent` chỉ lái `CharacterMovement` theo target mà nhịp quyết định đã chọn. Tách hai nhịp giữ cho quyết định rẻ nhưng không biến việc thiếu navigation thành một Pal đứng bất động.

## Bẫy 1 — điều kiện vào trạng thái tự khoá chính nó

Đoạn code đầu tiên trông hoàn toàn hợp lý:

```cpp
if (ReadHealth(Health) && Fraction <= FleeThreshold && State != Fleeing)
{
    StartFlee();
    return;
}
if (bHasNavigationTarget)   // Fleeing có target, nên luôn rơi vào đây
{
    StartMoveToCurrentTarget();
    return;
}
```

Đọc lại lần hai: vế `State != Fleeing` khiến nhánh health **không bao giờ chạy lại** sau khi đã vào `Fleeing`. Và ngay dưới, `bHasNavigationTarget` vẫn `true` nên hàm thoát sớm. Kết quả: Pal chạy tới điểm bỏ trốn cũ **vĩnh viễn**, kể cả khi máu đã đầy.

Điều đáng chú ý: `State != Fleeing` được thêm vào vì một lý do đúng — để không gọi `StartFlee()` lặp lại mỗi chu kỳ. Nó chỉ sai vì lúc đó **chưa ai viết đường ra**.

Luật rút ra, đắt hơn cái bug: **viết điều kiện thoát cùng lúc với điều kiện vào.** Một trạng thái không có đường ra không phải là trạng thái, nó là một cái hố.

Và đường ra phải dùng ngưỡng khác đường vào:

```json
"fleeHealthFraction": 0.25,
"fleeRecoverHealthFraction": 0.60
```

Dùng chung một ngưỡng thì Pal sẽ rung ở đúng biên — cùng một lỗi hysteresis mà bài 01 đã cảnh báo cho `FollowOwner`, chỉ đổi chỗ. Một lỗi thiết kế đã hiểu rõ vẫn quay lại ở chỗ khác, đó là chuyện bình thường; cách phòng là mỗi lần thấy một ngưỡng thì hỏi ngay "ngưỡng ngược lại đâu?".

## Bẫy 2 — đường thoát phụ thuộc vào một feature khác

Bản sửa đầu tiên đặt đường ra `Fleeing` vào bên trong khối này:

```cpp
if (ReadHealth(Health) && Health.Maximum > 0.0f)
{
    // ... kiểm tra hồi máu, kiểm tra đã đủ xa
}
```

Vẫn kẹt. Nếu Health không đọc được — chủ sở hữu bị gỡ, component chưa gắn xong, entity id sai — thì toàn bộ khối bị bỏ qua và Pal lại ở trong hố.

Luật rút ra: **đường thoát khỏi một trạng thái không được phụ thuộc vào việc một feature khác trả lời.** Khoảng cách là thứ PalBehavior tự đo được, nên nó luôn là đường ra:

```cpp
// Health may be unreadable. Distance is the escape that never depends on
// another feature answering.
if (State == Fleeing && DistanceToDanger >= Config.FleeDistance) { ... }
```

Đây là hệ quả trực tiếp của kiến trúc feature: mỗi lần đọc qua contract là một lần **có thể không có câu trả lời**. Trong hệ thống một khối thì `GetHealth()` luôn trả về một số; trong hệ thống có ranh giới, nó trả về "không biết". Mọi logic đọc chéo feature phải trả lời được câu hỏi *nếu bên kia im lặng thì sao?*

## Bẫy 3 — cái sai chạy đúng vì may

`ReadHealth` ban đầu được gọi với một entity id rỗng. Nó **chạy** — vì Health tình cờ chỉ từ chối khi id hợp lệ mà khác id của nó:

```cpp
if (RequestedEntityId.Value.IsValid() && EntityId.Value.IsValid() &&
    RequestedEntityId.Value != EntityId.Value) { return false; }
```

Id rỗng lọt qua vế đầu. Nghĩa là tính năng chạy đúng nhờ một chi tiết cài đặt của **feature khác** — thứ có thể siết lại bất cứ lúc nào mà không ai coi đó là breaking change.

Đã thêm `IPaldarkEntityIdRead` để lấy id thật. Lý do không mở rộng `IPaldarkEntityIdentity` có sẵn: interface đó là hợp đồng **mutation** (`Create`/`Destroy`). Nhét một hàm đọc vào đó sẽ biến hợp đồng ghi thành API đọc, và ranh giới sẽ mờ dần theo từng lần "chỉ thêm một hàm nữa thôi".

Luật rút ra: **"nó chạy" không phải bằng chứng cho "nó đúng".** Với hệ thống có ranh giới, câu hỏi luôn là *nó chạy vì hợp đồng bảo đảm, hay vì cài đặt hiện tại của bên kia tình cờ dễ tính?*

## Ưu tiên là luật, không phải thứ tự viết `if`

`Fleeing` thắng mọi lệnh từ ngoài. Nhưng "thắng" không được là hệ quả của việc nó tình cờ nằm trên trong hàm — nó phải là một lời từ chối tường minh:

```cpp
if (State == Fleeing) {
    UE_LOG(..., TEXT("PALDARK_PALAI_REJECT operation=RequestMoveToActor reason=Fleeing ..."));
    return false;
}
```

Hai chi tiết nhỏ nhưng quan trọng:

- Trả `false`, không phải `void`. Bên gọi phải biết lệnh của mình **không** có tác dụng.
- Có log lý do. Im lặng nuốt lệnh là thứ sẽ tốn hàng giờ ở chương 29, khi Work giao việc cho một con Pal đang bỏ chạy và không hiểu vì sao nó không tới.

## Đường kích hoạt: phần dễ bị bỏ quên nhất

Đến đây máy trạng thái đã đúng. Nhưng vào game, Pal vẫn chỉ lang thang — vì **không ai gọi `SetFollowOwner`**.

Đó chính xác là thứ chương 36 đo được: state đúng, tầng L3 trống. Nên slice này chỉ được coi là xong khi có đủ:

- `Companion` gọi `SetFollowOwner` lúc summon và `ClearBehaviorTarget` lúc recall, qua `IPaldarkBehaviorControl` — nó vẫn không biết `PalBehavior` tồn tại;
- `Paldark.PalAI.SummonFollower` để thử mà không phải đi qua cả chuỗi bắt giữ;
- `Paldark.PalAI.Dump` in state, chủ, mục tiêu, khoảng cách — không có debugger Behavior Tree thì đây là thứ thay thế.

Lệnh `Dump` không phải tiện ích phụ. Nó là **giao diện chẩn đoán** của một hệ thống mà người viết code không chạy được, và là thứ người test gửi lại khi có gì đó sai.

## Tự kiểm

1. Vì sao `followStopDistance` và `followStartDistance` không được bằng nhau? Trả lời bằng hành vi người chơi nhìn thấy, không bằng thuật ngữ.
2. `Fleeing` có hai đường ra. Vì sao đường thứ hai không phải là dư thừa?
3. Nếu Health đổi cài đặt để từ chối entity id rỗng, code nào trong PalBehavior sẽ hỏng? Vì sao bây giờ thì không?
4. `MoveToTarget` và `Working` khác nhau ở quyết định hay ở dữ liệu? Câu trả lời của bạn có khớp với việc chúng là hai trạng thái riêng không?

Bài kế tiếp: tri giác — vì sao Pal thấy người chơi nhưng **không được phép** tự quyết định đánh.
