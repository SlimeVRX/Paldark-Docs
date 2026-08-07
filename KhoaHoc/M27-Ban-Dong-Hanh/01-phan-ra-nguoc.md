# Bài 01 — Từ "nó sống" ra đúng năm trạng thái

> Khoá 27 — Bạn đồng hành. Bài này vẫn chưa mở IDE.

## Câu hỏi

Bài 00 kết luận Pal phải có ý định của riêng nó. Nhưng ý định ấy gồm những quyết định nào? Nếu không chốt được một tập hữu hạn từ điều người chơi có thể phân biệt, máy trạng thái sẽ phình ra theo từng tình huống mới và cuối cùng chỉ còn là chuỗi `if` không ai dám sửa.

## Cách tìm trạng thái: hỏi ngược từ điều người chơi nhìn thấy

Không liệt kê trạng thái từ trí tưởng tượng. Liệt kê những gì người chơi **nhìn thấy Pal đang làm**, rồi gộp những cái không phân biệt được:

| Người chơi thấy | Có phải trạng thái riêng? |
|---|---|
| Pal đứng yên nhìn quanh | có — không có mục tiêu nào |
| Pal đi lững thững vài bước rồi dừng | không — vẫn là "không có mục tiêu", chỉ khác biểu hiện |
| Pal chạy về phía tôi | có — mục tiêu là chủ |
| Pal chạy về phía cái cây | có — mục tiêu là một điểm được giao |
| Pal chạy tới bàn chế tạo | không — vẫn là "tới một điểm được giao", chỉ khác điểm |
| Pal đứng cạnh cây và vung rìu | có — đã tới nơi, đang làm |
| Pal chạy ngược hướng khỏi con quái | có — mục tiêu là *tránh xa*, không phải *tới gần* |
| Pal chạy trốn khi máu thấp | không — cùng là "tránh xa", chỉ khác nguyên nhân |

Gộp lại còn **năm**:

```text
Idle          không có mục tiêu
FollowOwner   mục tiêu là chủ, đích di chuyển
MoveToTarget  mục tiêu là một điểm/actor được giao từ ngoài
Working       đã tới nơi, đang thực hiện
Fleeing       mục tiêu là tránh xa một nguồn
```

Điều đáng chú ý ở bảng trên: hai dòng bị gộp lại đều bị gộp vì **cùng một lý do** — chúng khác nhau ở *dữ liệu*, không khác nhau ở *quyết định*. "Chạy tới cây" và "chạy tới bàn chế tạo" là cùng một trạng thái với hai giá trị mục tiêu khác nhau.

Đó là luật để dùng lại về sau: **hai tình huống chỉ là hai trạng thái khi cỗ máy phải quyết định khác nhau, không phải khi dữ liệu khác nhau.** Bỏ qua luật này là cách một máy trạng thái phình lên hai mươi nhánh.

## Ai được phép làm nó đổi trạng thái?

Đây mới là phần khó, và là chỗ ranh giới quyền sở hữu ở bài 00 phát huy tác dụng.

| Chuyển | Kích hoạt bởi | Nguồn dữ liệu |
|---|---|---|
| `Idle → FollowOwner` | khoảng cách tới chủ vượt `Max` | Companion (chủ là ai) + vị trí |
| `FollowOwner → Idle` | đã vào trong `Min` | vị trí |
| `* → MoveToTarget` | **yêu cầu từ ngoài** | Work, hoặc lệnh người chơi |
| `MoveToTarget → Working` | đã tới trong bán kính chấp nhận | điều hướng |
| `* → Fleeing` | HP xuống dưới ngưỡng | Health (chỉ đọc) |
| `Fleeing → Idle` | đã đủ xa, hoặc HP hồi trên ngưỡng | Health + vị trí |

Ba nhận xét quan trọng hơn bản thân cái bảng:

1. **Không có chuyển nào do client kích hoạt.** Toàn bộ máy chạy trên authority. Client chỉ *nhìn thấy* kết quả. Nếu để client tự chuyển trạng thái cho mượt thì hai bên sẽ lệch, và bug sẽ chỉ xuất hiện khi có người thứ hai.
2. **`Fleeing` thắng mọi trạng thái khác.** Ưu tiên phải là một luật tường minh, không phải hệ quả của thứ tự viết `if`. Thứ tự trong code là một tai nạn; ưu tiên là một quyết định thiết kế.
3. **`MoveToTarget` không do PalBehavior tự nghĩ ra.** Nó luôn đến từ ngoài qua hợp đồng generic. PalBehavior không biết "công việc" là gì, không biết "cái cây" là gì — nó chỉ biết một vị trí và một ngưỡng chấp nhận. Đó là điều cho phép chương 29 dùng lại nó mà không sửa một dòng nào ở đây.

## Vì sao không tick mỗi frame

Cám dỗ: đặt tất cả vào `TickComponent` cho đơn giản.

Đếm thử. Một căn cứ có 20 Pal. Mỗi frame, mỗi con đo khoảng cách tới chủ, đọc HP, kiểm tra tri giác, hỏi trạng thái điều hướng. Ở 60 fps là 1200 lượt đánh giá mỗi giây — để phục vụ những quyết định mà thực tế chỉ đổi vài giây một lần.

Nhịp ra quyết định nên khớp với **tốc độ mà quyết định thật sự thay đổi**, không khớp với tốc độ vẽ hình. Một chu kỳ 0.2–0.5 giây là đủ: chậm hơn phản xạ người chơi có thể nhận ra, nhanh hơn mọi thứ trong danh sách chuyển trạng thái ở trên.

Phần *di chuyển* vẫn mượt mỗi frame — đó là việc của hệ điều hướng, không phải của cỗ máy quyết định. Tách hai nhịp này ra là điều làm cho AI vừa rẻ vừa trông mượt.

## Điều gì phải là dữ liệu, không phải code

Mọi con số vừa xuất hiện đều là thứ sẽ bị chỉnh đi chỉnh lại khi chơi thử: `Min`, `Max`, chu kỳ quyết định, ngưỡng HP, bán kính và góc nhìn, thời gian mất dấu, bán kính chấp nhận.

Không con số nào trong đó được nằm trong C++. Chúng nằm trong `PalBehavior.Config.json`. Lý do không phải là "cho sạch đẹp": người duy nhất có thể cân bằng những con số này là người **chơi thử được** — và trong dự án này, đó không phải tôi.

## Bằng chứng phải trông thế nào

Vì không có debugger Behavior Tree, mỗi lần đổi trạng thái phải để lại một dòng đọc được:

```text
PALDARK_PALAI_STATE entity=Pal:<id> before=Idle after=FollowOwner
reason=OwnerTooFar distance=612.4 threshold_max=500.0 authority=true
```

Yêu cầu tối thiểu: có `before`, có `after`, có **lý do**, và có con số đã tạo ra lý do đó. Thiếu `reason` thì không phân biệt được "AI quyết định đúng" với "AI vừa may mắn"; thiếu con số thì không biết nên chỉnh tham số nào.

## Bài này kết luận gì

Năm trạng thái, sáu chuyển, một luật ưu tiên, một nhịp quyết định tách khỏi nhịp vẽ hình, và mọi hằng số nằm ngoài code.

Toàn bộ những điều trên được quyết định **trước khi biết sẽ dùng Behavior Tree hay máy trạng thái**. Đó là kiểm chứng cho thấy chúng là thiết kế chứ không phải hệ quả của công cụ — và cũng là lý do bài 02 có thể từ chối Behavior Tree mà không phải thiết kế lại gì.
