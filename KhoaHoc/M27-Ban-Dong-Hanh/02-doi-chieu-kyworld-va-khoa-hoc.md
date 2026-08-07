# Bài 02 — Behavior Tree hay máy trạng thái C++? Đối chiếu với KYWorld

> Khoá 27 — Bạn đồng hành. Bài này là bước "đối chiếu đáp án" trong lộ trình theo năng lực ở [Chương 37](../../Q5-Lo-Trinh/37-do-phuc-tap-va-lo-trinh.md#374--tám-năng-lực-nền-mở-khoá-15-hệ-thống).

## Câu hỏi

Bài 00 kết luận Pal cần tự ra quyết định. Bây giờ mới được phép hỏi: **cỗ máy ra quyết định đó nên có hình dạng gì?**

Thứ tự này quan trọng. Nếu hỏi ngược lại — "dùng Behavior Tree thế nào?" — thì ta đã chọn xong trước khi biết mình cần gì, và mọi thứ sau đó chỉ là hợp lý hoá.

## Đáp án của người đi trước

KYWorld đã tái tạo Palworld thành công, và họ chọn Behavior Tree:

- `02.Palworld/Source/Palworld_Base/Public/Character/Pal/PalCharacterBase.h` — Pal actor.
- `BaseAIController.h/.cpp` — controller C++.
- `Content/Blueprint/Character/Pal/BP_BaseAIController.uasset` cùng các Behavior Tree, Blackboard và EQS asset đi kèm.

Bài giảng tương ứng: `02.Palworld / 10-006 — Pal Character and AI Controller`. Khoá `11.Udemy-ue5-gas-top-down-rpg` mục 15 dạy đúng cùng khuôn: AIController → Blackboard → Behavior Tree → Service.

Nghĩa là **cả dự án tham chiếu lẫn giáo trình chuẩn đều nói Behavior Tree.** Đây là con đường mặc định của Unreal, và nó là con đường đúng cho hầu hết dự án.

## Vì sao Paldark vẫn không chọn nó ở bước này

Câu hỏi cần hỏi không phải "họ code gì" mà **"điều gì buộc họ chọn thế, và điều đó có đúng với ta không?"**

Điều buộc KYWorld chọn Behavior Tree: họ làm việc **trong Editor**. Với một người ngồi trước Editor, BT là lựa chọn rẻ nhất — kéo node, chạy thử, xem debugger tô sáng nhánh đang chạy. Chi phí tạo một BT gần bằng không, và lợi ích quan sát rất lớn.

Điều đó **không đúng** với Paldark ở thời điểm này. Behavior Tree, Blackboard và EQS đều là graph nằm trong `.uasset`. Đường sinh asset headless hiện tại chỉ dựng được `GameFeatureData` — một object phẳng vài trường. Dựng một BT graph bằng script là một dự án riêng: phải sinh node, nối cạnh, gán decorator, gán Blackboard key, và không có debugger nào để biết mình sinh sai chỗ nào.

Đặt lên bảng cân:

| | Behavior Tree | Máy trạng thái C++ |
|---|---|---|
| Chi phí dựng ở môi trường hiện tại | rất cao (phải sinh graph bằng script) | thấp |
| Quan sát được khi chạy | debugger BT trong Editor — thứ ta không có | log có cấu trúc — thứ ta đã có |
| Người thiết kế sửa được mà không cần lập trình viên | **có** | không |
| Số hành vi mà nó gánh nổi | hàng chục | khoảng năm tới bảy |

Dòng thứ ba là điểm yếu thật sự của lựa chọn này, và không được giấu: máy trạng thái C++ **khoá hành vi vào tay lập trình viên**. Với một game có hàng trăm loài Pal, mỗi loài một thói quen, đó là cái giá không trả nổi.

## Quyết định

**Chọn máy trạng thái C++ cho bước này, và coi nó là tạm thời.**

Ba lý do, theo thứ tự quan trọng:

1. Bốn hành vi đầu tiên (đứng yên, đi theo, tới mục tiêu, bỏ chạy) nằm gọn trong sức chứa của một máy trạng thái. Chưa cần tới sức mạnh của BT.
2. Thứ đang chặn bốn chương khác là **Pal biết đi**, không phải **Pal có kiến trúc AI đẹp**. Bỏ ba giờ dựng trình sinh BT graph là bỏ ba giờ không mở khoá được gì.
3. Ranh giới thiết kế — ai sở hữu ý định, ai chỉ được đọc — **không phụ thuộc vào lựa chọn này**. Đúng ranh giới thì sau này thay ruột bằng BT chỉ là thay một lớp.

Điều kiện để phải chuyển sang BT, ghi ra ngay bây giờ để lần sau không phải tranh luận:

- khi số hành vi vượt bảy, **hoặc**
- khi hành vi bắt đầu khác nhau theo loài Pal, **hoặc**
- khi có người không phải lập trình viên cần chỉnh hành vi.

Bất kỳ điều nào xảy ra thì máy trạng thái đã hết vai trò.

## Thứ vay được từ KYWorld dù không dùng BT

Bỏ BT không có nghĩa là bỏ mọi thứ họ đã giải:

- **Tách controller khỏi pawn.** `BaseAIController` giữ phần điều hướng và tri giác; pawn không tự tìm đường. Ta giữ nguyên cách chia này — nó không phải đặc thù của BT.
- **Tham số nằm trong data, không nằm trong code.** KYWorld để hằng số trong DataAsset/DataTable. Ta để trong `PalBehavior.Config.json`. Cùng một nguyên tắc.
- **Tri giác là một hệ riêng.** `UAIPerceptionComponent` với `UAISenseConfig_Sight` dùng được nguyên vẹn dù thứ đọc kết quả là BT hay máy trạng thái.

## Chỗ tài liệu của ta sai và phải sửa

Giáo trình ở [chương 38](../../Q5-Lo-Trinh/38-giao-trinh-15-khoa-hoc.md) viết bài 3 và bài 4 của khoá này theo hướng Blackboard + Behavior Tree, vì lúc soạn nó đã mặc định đi theo KYWorld mà chưa cân nhắc ràng buộc môi trường.

Đó là đúng thứ tài liệu-đi-trước-thực-tế mà chương 36 nói tới. Hai bài đó được viết lại thành máy trạng thái và điều hướng, còn Behavior Tree lùi về một bài riêng ở cuối khoá, dạy **khi nào phải chuyển** — chứ không phải chuyển thế nào.

## Bài này kết luận gì

Đáp án có sẵn của người đi trước là thứ để **đối chiếu**, không phải để chép. Chép Behavior Tree về sẽ có một hệ AI đúng chuẩn mà không ai trong dự án này chạy thử được. Đối chiếu rồi từ chối có lý do thì có một hệ AI kém sang hơn nhưng chạy được — và có một điều kiện rõ ràng để biết khi nào phải bỏ nó đi.

Bài kế tiếp: máy trạng thái đó gồm những trạng thái nào, và **ai được phép làm nó đổi trạng thái?**
