# Bài 05 — "Đã giao việc" không bao giờ có nghĩa là "đã tới nơi"

> Khoá 27 — Bạn đồng hành, bài cuối. Nguồn: `WorkFeatureComponent`, PR #162.

## Câu hỏi

Pal đã biết đi ở bài 03 và biết thấy ở bài 04. Căn cứ cũng đã có trạm cùng state sản xuất từ Chương 29. Nhìn từ xa, ta chỉ còn một đường nối là có thể kết thúc khóa học.

Nhưng câu hỏi quyết định không phải “nối bằng API nào”. Nó là: **ai được coi là nguồn sự thật cho câu “con Pal này đang làm việc”?** Nếu chưa trả lời, một event đến sớm cũng đủ biến chuyển động trên màn hình thành state canonical sai.

## Vì sao câu hỏi đó khó

Có hai ứng viên, và cả hai đều có lý:

- `Work` sở hữu phân công. Nó biết Pal nào được gán vào trạm nào.
- `PalBehavior` sở hữu trạng thái hành vi. Nó biết Pal đang đi, đang đứng, hay đang bỏ chạy.

Nếu cả hai cùng tự tin trả lời, sẽ có lúc `Work` nói "đang sản xuất" trong khi `PalBehavior` nói "đang bỏ chạy". Cả hai đều không sai theo dữ liệu của mình. Người chơi thì thấy một con Pal chạy trốn mà quặng vẫn tăng đều.

Đây không phải bug hiếm. Đây là **hệ quả tất yếu** của việc hai hệ thống suy diễn về nhau thay vì trao đổi sự kiện.

## Chiều đồng bộ: chỉ một

```text
Work        sở hữu phân công + quyền được sản xuất
PalBehavior sở hữu di chuyển + trạng thái hành vi

Work → yêu cầu di chuyển   (IPaldarkBehaviorControl, Reason=Work)
Work ← sự kiện generic     (Arrived, StateChanged)
```

Một chiều điều khiển, một chiều sự kiện, không có chiều nào là suy diễn.

Điều then chốt: `Work` **không** đặt state của `PalBehavior`, và **không** cho rằng gửi lệnh thành công nghĩa là Pal đã tới. Nó chờ:

```text
Paldark.PalBehavior.Event.Arrived
```

Nghe thì hiển nhiên. Nhưng phiên bản "hiển nhiên" mà ai cũng viết đầu tiên là: giao việc xong, bật cờ `bIsWorking = true`, bắt đầu cộng output. Nó chạy, log đẹp, và **quãng đường Pal đi chỉ là hoạt hình trang trí**. Đó chính xác là thứ chương 36 đo được ở 19 feature: state đúng, không có gì thật xảy ra.

Nên tiêu chí nghiệm thu của cả slice nằm ở một chữ: output tăng **sau** khi tới nơi.

## Ba đường hỏng, và vì sao phải xử lý cả ba

### 1. Sự kiện `Arrived` đến hai lần

Message bus không hứa gửi đúng một lần, và một phân công có thể đã bị huỷ trước khi sự kiện tới. Nhận bừa thì sản xuất chạy hai lần — đúng loại lỗi mà chương 32 đã trả giá với việc nhận thưởng hai lần.

Nên arrival được kiểm bằng ba thứ cùng lúc: correlation id của phân công, đúng worker actor, và Pal thật sự trong bán kính trạm. Ba lần kiểm cho một sự kiện nghe có vẻ thừa; nó thừa cho tới lần đầu tiên không thừa.

### 2. Pal đang `Fleeing` lúc được giao việc

Luật ở bài 03: `Fleeing` từ chối mọi lệnh di chuyển từ ngoài. Nghĩa là `Work` sẽ nhận `false`.

Điều **không** được làm: coi như đã giao rồi chờ mãi. Căn cứ khi đó "đang chạy" mà không ra gì, và không có dòng log nào giải thích.

Điều đã làm: đọc `IPaldarkBehaviorRead` để biết *vì sao* bị từ chối, rồi từ chối phân công với `reason=Fleeing`. Retry hiện đặt `0` trong JSON — một quyết định có chủ ý, không phải giá trị bỏ quên: đợi Pal bình tĩnh rồi giao lại là hành vi hợp lý, nhưng nó cần một hàng đợi mà ta chưa có.

Đây là lần đầu một luật ưu tiên đặt ra ở feature này (bài 03) **sinh ra công việc thật** ở feature khác. Đó là dấu hiệu ranh giới đang hoạt động đúng: hợp đồng buộc bên kia phải xử lý trường hợp từ chối, thay vì cho phép nó giả vờ mọi thứ luôn thành công.

### 3. Pal rời trạm giữa chừng

Bị gọi về, bỏ chạy vì máu thấp, hoặc actor bị unload theo chương 31. Sản xuất phải dừng và phân công phải được xoá kèm lý do — nếu không, một con Pal đã biến mất vẫn tiếp tục đào quặng, và đó là bug người chơi phát hiện trước ta.

## Giới hạn còn để mở

`Build` chưa có actor riêng cho trạm, nên `Work` dùng transform lấy từ sự kiện `StructureReady` và gọi `RequestMoveToLocation` thay vì `RequestMoveToActor`. Vẫn đi qua contract generic, không tạo phụ thuộc chéo — nhưng trạm mà di chuyển được thì sai. Ghi ra đây vì một giới hạn được ghi rõ thì rẻ hơn nhiều một giả định ngầm.

## Nhìn lại cả khoá

Sáu bài, và cái xương sống không phải máy trạng thái mà là **ai được quyết cái gì**:

| Câu hỏi | Chủ sở hữu |
|---|---|
| Pal đang ở trạng thái nào | `PalBehavior` |
| Pal còn bao nhiêu máu | `Health` |
| Pal thuộc về ai | `Creature` / `Companion` |
| Pal được giao việc gì | `Work` |
| Pal có gây sát thương không | `Combat` |

Mỗi lần một hệ thống muốn biết điều nằm ngoài cột của nó, nó **hỏi qua hợp đồng** và phải chấp nhận khả năng không có câu trả lời. Mỗi lần nó muốn đổi điều nằm ngoài cột của nó, nó **gửi yêu cầu** và phải chấp nhận bị từ chối.

Ba bug ở bài 03 đều là một biến thể của việc quên mất điều thứ nhất. Ba đường hỏng ở bài này đều là biến thể của việc quên mất điều thứ hai.

## Tự kiểm

1. Vì sao không cho `Work` tự đặt state `Working` lên `PalBehavior`? Nêu một tình huống hỏng cụ thể.
2. Arrival đã kiểm correlation id rồi, vì sao còn kiểm bán kính trạm?
3. `retryCount = 0` khi Pal đang bỏ chạy có phải lựa chọn đúng không? Cần gì để đổi thành retry?
4. Nếu output tăng trong lúc Pal còn đang đi tới trạm, hỏng ở đâu? Có ít nhất hai chỗ có thể.
