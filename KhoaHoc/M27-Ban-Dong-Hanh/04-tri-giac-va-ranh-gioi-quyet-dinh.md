# Bài 04 — Pal thấy người chơi, và vì sao nó không được phép tự đánh

> Khoá 27 — Bạn đồng hành. Nguồn: `PalBehaviorAIController`, `PalBehaviorComponent::HandleSightPlayer`.

## Câu hỏi

Pal đã biết đi. Bây giờ cho nó **thấy**. Câu hỏi tưởng chừng hiển nhiên: thấy rồi thì làm gì?

Câu trả lời hiển nhiên — "thấy kẻ địch thì đánh" — là sai, và bài này giải thích vì sao nó sai theo cách phải mất vài tháng mới nhận ra nếu làm bừa.

## Tri giác là một hệ riêng, không phải một phép đo khoảng cách

Cám dỗ đầu tiên: mỗi chu kỳ quyết định, quét tất cả actor trong bán kính rồi lọc. Nó chạy, và nó sai ba chỗ:

- không có **góc nhìn** — Pal thấy xuyên qua gáy mình;
- không có **vật cản** — Pal thấy xuyên tường;
- không có **mất dấu** — người chơi nấp sau tảng đá thì lập tức biến mất khỏi nhận thức, thay vì "tôi vừa thấy nó ở đó".

Ba thứ đó chính là cái làm người chơi tin rằng sinh vật kia *đang nhận thức* chứ không phải *đang tra bảng*. Unreal đã giải sẵn bằng `UAIPerceptionComponent` + `UAISenseConfig_Sight`, với `LoseSightRadius` và thời gian ghi nhớ. Đây là chỗ dùng lại engine mà không phải nhượng bộ gì — khác hẳn quyết định từ chối Behavior Tree ở bài 02.

Tham số nằm trong JSON, vì chúng là **thiết kế cảm giác** chứ không phải hằng số kỹ thuật:

```json
"sightRadius": 1800.0,
"sightPeripheralVisionAngle": 70.0,
"sightLoseSightSeconds": 3.0
```

`sightLoseSightSeconds` là tham số thú vị nhất trong cả file. Đặt 0 thì Pal quên tức khắc và trông ngu ngốc. Đặt quá lớn thì không bao giờ trốn được và trông như gian lận. Con số đúng chỉ tìm được bằng cách chơi — và người chơi được không phải người viết dòng này.

## Ranh giới: thấy không phải là quyết định đánh

Đây là nội dung chính của bài.

Khi Pal thấy người chơi, `PalBehavior` chỉ làm đúng một việc:

```cpp
PublishMessage(TEXT("Paldark.PalBehavior.Event.SightPlayer"), Payload);
```

Nó **không** gây sát thương, không chọn kỹ năng, không quyết định có thù địch hay không.

Vì sao không cho nó đánh luôn — vài dòng là xong?

Vì lúc đó sẽ có **hai** đường sinh ra sát thương: một cho người chơi (qua `Combat`), một cho AI (trong `PalBehavior`). Ban đầu chúng giống nhau. Rồi `Combat` thêm miễn nhiễm nguyên tố — đường AI không có. `Combat` thêm cooldown — đường AI không có. Sáu tuần sau, câu hỏi "vì sao con Pal này bỏ qua giáp?" mất một buổi để trả lời, và câu trả lời là "vì nó đi đường khác".

Chương 25 đã đặt luật này: **bên gây gửi yêu cầu, bên nhận quyết định.** Một hệ AI vi phạm nó thì không phải vi phạm nhỏ — nó nhân đôi luật cốt lõi của game.

Nên ranh giới là: **AI sở hữu sự chú ý, Combat sở hữu bạo lực.** `PalBehavior` được phép nói "tôi thấy X"; ai đó khác — Combat, hoặc một feature hiếu chiến sau này — nghe và quyết định.

## Cái giá phải thừa nhận

Cách này có giá thật, không giấu:

- **Trễ.** Từ lúc thấy tới lúc đánh phải qua một vòng message. Với game hành động nhanh, đó có thể là vấn đề, và lúc đó sẽ phải đo thay vì tranh luận.
- **Khó lần vết.** "Vì sao con Pal này tấn công?" phải đọc hai feature thay vì một. Đây là cái giá cố hữu của kiến trúc có ranh giới, và là lý do mọi event đều mang `reason` cùng correlation id.

Đổi lại: thêm một loại hành vi hiếu chiến mới **không** phải sửa `PalBehavior`, và luật sát thương vẫn chỉ có một bản.

## Một chi tiết nhỏ về `LastDangerActor`

Actor được nhìn thấy gần nhất được ghi lại làm điểm tham chiếu để bỏ chạy. Đây là một lối tắt đáng chú ý: nó giả định **thứ ta thấy gần đây nhất là thứ nguy hiểm**.

Với một con Pal hoang gặp người chơi thì giả định đó đúng. Với một con Pal đồng hành đang bị quái tấn công từ phía sau thì nó **sai** — nó sẽ chạy khỏi chủ của mình thay vì khỏi con quái.

Ghi ra đây thay vì im lặng, vì đó là loại sai chỉ lộ ra khi có nguồn sát thương thật, và khi đó phải thay bằng "nguồn sát thương gần nhất" do Health/Combat cung cấp, không phải bằng thứ nhìn thấy.

## Tự kiểm

1. Vì sao `sightLoseSightSeconds` là tham số thiết kế chứ không phải tối ưu hiệu năng?
2. Nếu cho `PalBehavior` tự gây sát thương, tính năng nào sẽ hỏng **đầu tiên** khi Combat thêm luật mới? Trả lời bằng một ví dụ cụ thể.
3. `LastDangerActor` sai trong tình huống nào? Cần thứ gì để sửa đúng?
4. AI sở hữu "sự chú ý" nghĩa là gì? Nêu một thứ nó **được** quyết và một thứ nó **không** được quyết.

Bài kế tiếp: nối `PalBehavior` với `Work` — và vì sao "đã giao việc" không bao giờ được hiểu là "đã tới nơi".
