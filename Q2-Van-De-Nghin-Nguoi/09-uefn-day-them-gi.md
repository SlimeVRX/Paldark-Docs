# Chương 9 — UEFN dạy thêm gì

::: warning Corpus V4 — hai chi tiết đã lỗi thời
Chương này giữ nguyên như synthesis lịch sử từ Course 16. Ở UEFN 42.00, revision control tích hợp đã được tài liệu hóa dưới tên **Lore** với checkout/conflict workflow; persistence hiện cho phép tối đa bốn persistent player weak maps, không phải hai. Xem phân tích kiến trúc hiện hành tại [V5.9 — Kiến trúc UEFN và bài học cho PaldarkV5](/V5/09-uefn-architecture-and-paldarkv5).
:::

Lyra cho ta một câu trả lời mạnh, nhưng câu trả lời ấy sinh ra trong bối cảnh studio: một đội biết nhau, dùng chung editor, có quy trình review và vẫn đủ ít người để nói chuyện trực tiếp khi một contract đổi.

UEFN bắt đầu từ một bối cảnh khác hẳn. Hàng trăm nghìn người xa lạ cùng xây các thế giới bên trong một game duy nhất; phần lớn không phải lập trình viên chuyên nghiệp, và không thể giả định rằng họ sẽ đọc tài liệu kiến trúc của nhau trước khi làm.

Thoạt nhìn, đây có vẻ là một sản phẩm khác. Nhưng xét ở góc phối hợp, nó **gần với bài toán của ta hơn Lyra**: một nghìn agent cũng không có ký ức chung, không đọc hết code của nhau và chỉ có thể dựa vào những gì được ghi thành hợp đồng. Vì thế điều đáng học ở UEFN không phải công cụ dựng đảo, mà là cách công cụ định hình ranh giới.

## 9.1 — Device: đơn vị công việc có ranh giới cứng

Trong UEFN, đơn vị người làm cầm trên tay không phải “một lớp đâu đó trong project”, mà là **một device**. Device là một khối tự chứa: có trạng thái, hàm và vòng đời riêng, rồi được đặt vào thế giới như một vật thể có ranh giới nhìn thấy được.

Điểm đáng học là ranh giới này không chỉ nằm trong tài liệu; nó là **hình dạng của công cụ**. Trong Unreal thông thường, không có gì ngăn bạn `#include` header của người khác ngoài một lời khuyên. Trong UEFN, device khác đơn giản **không có mặt** trong tầm với cho tới khi có một kết nối được chủ động tạo ra.

Đây là một tư tưởng thiết kế rất mạnh và tôi muốn bạn để ý: **luật nào dựa vào ý chí con người thì sẽ bị vi phạm; luật nào dựa vào việc "không làm được" thì không.** Với một nghìn agent, khác biệt này quyết định thành bại. Agent không cố tình vi phạm luật, nhưng nó cũng không có trực giác để biết mình đang vi phạm. Cách duy nhất chắc chắn là làm cho việc sai trở nên bất khả thi hoặc bị máy chặn ngay.

C++ không cho Paldark mức cô lập cứng như vậy vì gần như mọi header đều có thể bị include nếu đường dẫn cho phép. Ta chỉ có thể tiến gần bằng hai lớp: đưa mọi thứ không chủ ý chia sẻ vào `Private`, rồi dùng script chặn include vượt biên. Repo này đã có `check_paldarkv2_headers.py` theo đúng tinh thần biến một lời khuyên thành một điều máy có thể bắt lỗi.

## 9.2 — `@editable`: khai báo cái mình cần, không tự đi tìm

Ranh giới cứng ngăn một device tự tiện vươn sang phần bên kia. Nhưng nó vẫn có lúc cần thứ ở bên ngoài. Cách Verse biểu đạt nhu cầu ấy bằng một dependency khai báo là chi tiết đáng mang về nhất.

Khi một device cần dùng một device khác, nó không đi tìm. Nó **khai báo một ô trống** bằng từ khóa `@editable`, kiểu như "tôi cần một cái bục teleport, ai đó điền vào giúp". Người dựng màn chơi mở editor lên và kéo device cụ thể vào ô đó.

So sánh với cách thường làm trong Unreal: đi tìm actor trong world bằng cách quét theo lớp, hoặc giữ một con trỏ tới một singleton. Cả hai cách đều tạo ra sự phụ thuộc ngầm — code chạy được hay không tùy thuộc vào thứ nó không kiểm soát, và bạn chỉ biết là hỏng khi chạy.

Cách của Verse đưa quan hệ phụ thuộc ra khỏi thân hàm và biến nó thành **một phần của khai báo nhìn thấy từ bên ngoài**. Muốn biết một device cần gì, đọc danh sách `@editable` là đủ; ta không phải lần qua logic để tìm những lệnh tự đi kiếm dependency.

Với một nghìn agent, tính chất này còn quan trọng hơn ở chỗ khác: nó cho phép **kiểm tra được bằng máy**. Nếu mọi phụ thuộc đều phải khai báo tại một chỗ cố định, một script có thể đọc toàn bộ project và dựng ra đồ thị phụ thuộc thật — rồi so với đồ thị được phép. Nếu phụ thuộc nằm rải rác trong thân hàm dưới dạng lệnh đi tìm, không script nào dựng lại được đồ thị đó.

Bài học mang về vì vậy không phải cú pháp riêng của Verse, mà là nguyên tắc: **mọi thứ một tính năng cần từ bên ngoài phải được khai báo ở một chỗ duy nhất, có định dạng cố định và đọc được bằng máy.** Chương 11 sẽ biến nguyên tắc này thành một luật cứng của Paldark.

## 9.3 — Event: cách hai device nói chuyện

Khai báo dependency cho biết hai device được nối với nhau; event cho biết chúng phối hợp mà không chia sẻ implementation ra sao. Một device công bố event, device khác đăng ký nghe. Bên nghe chỉ cần tên event và dữ liệu đi kèm, không cần biết bên phát được hiện thực thế nào.

Về bản chất đây là cùng một khuôn mẫu với Gameplay Message ở Chương 7, nên tôi không lặp lại. Nhưng có một khác biệt về mức độ đáng ghi nhận: trong Lyra, message là **một lựa chọn trong nhiều lựa chọn** — bạn hoàn toàn có thể gọi thẳng nếu muốn. Trong UEFN, với những device không được nối trực tiếp, event gần như là **cách duy nhất**.

Ở đây cần giữ đúng biên của bằng chứng. UEFN có nhiều người cùng làm, có event và có device cô lập, nhưng **tài liệu đã khảo sát không mô tả cơ chế nào ngăn hai người cùng sửa một thứ**. Không có mô tả về khóa asset hay cách giải xung đột khi hai người chỉnh đồng thời, nên ta không kết luận rằng UEFN đã giải toàn bộ bài toán song song. Điều nó chứng minh hẹp hơn nhưng vẫn hữu ích: **chia thế giới thành các khối cô lập giao tiếp qua event làm giảm phần lớn nhu cầu sửa chung.** Khi một thứ vẫn buộc phải dùng chung, Paldark cần lời giải riêng.

## 9.4 — Persistence: chỉ lưu cái là sự thật, không lưu cái là hình ảnh

Ranh giới của UEFN không chỉ áp vào giao tiếp mà còn áp vào thời gian. Verse có một quy tắc lưu trữ gọn: chỉ kiểu được đánh dấu là lưu được mới được lưu; dữ liệu người chơi nằm trong một bảng tra theo người chơi; giao diện thì **không lưu**, mà được dựng lại từ dữ liệu mỗi lần cần.

Quy tắc "không lưu giao diện" nghe hiển nhiên nhưng bị vi phạm liên tục trong các project thật. Người ta lưu cả trạng thái widget, lưu vị trí cuộn của danh sách, lưu cả những thứ chỉ có ý nghĩa với phiên chơi hiện tại. Rồi khi đổi giao diện, file lưu cũ vỡ.

Điều mang về không phải chi tiết kỹ thuật riêng của Verse mà là **ranh giới**: mỗi hệ thống phải tách rõ đâu là sự thật cần sống sót qua lần thoát game và đâu là hình ảnh có thể dựng lại. Chương 4 đã hỏi điều này ở từng feature; đến Chương 14, nó sẽ trở thành một contract dữ liệu của bộ khung.

Verse còn có một chi tiết nhỏ mà tôi thấy thú vị: giới hạn tối đa hai bảng lưu trữ cho một game. Một giới hạn cứng, nghe rất khó chịu, nhưng nó buộc người viết phải nghĩ nghiêm túc về cái gì đáng lưu. Ràng buộc đôi khi là công cụ thiết kế tốt hơn tự do.

## 9.5 — Ba điều mang về từ UEFN

| Điều học được | Vì sao quan trọng với một nghìn agent | Paldark sẽ làm gì |
|---|---|---|
| Ranh giới do công cụ ép, không do lời khuyên | Agent không có trực giác để tự giữ luật | `Private` cho mọi thứ nội bộ, cộng script chặn include vượt biên |
| Phụ thuộc phải khai báo ở một chỗ cố định | Máy mới dựng được đồ thị phụ thuộc để kiểm tra | Mỗi tính năng có đúng một file khai báo, định dạng văn bản cố định |
| Chỉ lưu sự thật, không lưu hình ảnh | Tránh vỡ file lưu khi giao diện đổi | Tách rõ dữ liệu bền và trạng thái phiên trong từng hệ thống |

Ba bài học trong bảng đều xoay quanh một ý: đưa quan hệ và ranh giới ra nơi máy nhìn thấy được. Nhưng vẫn có một điều **không** học được: UEFN không cho ta lời giải đã được xác nhận cho tình huống hai người buộc phải sửa cùng một thứ. Chỗ đó phải được thiết kế riêng và sẽ là nội dung chính của Chương 12.

Trước khi viết luật, ta còn cần biết những nguyên tắc modular này có sống được ngoài ví dụ của Epic hay không. Chương sau mổ một hệ thống lớn do bên thứ ba xây trên Lyra mà phần mở rộng cuối cùng nằm ngoài lõi Lyra — bằng chứng gần nhất với điều Paldark muốn đạt tới.

---

**Bằng chứng cho chương này.** Mô tả device, `@editable`, event subscription và persistence trong Verse là OBSERVED từ khảo sát tài liệu khóa 16 (UEFN/Verse Programming) trong repo, bao gồm chi tiết giới hạn hai bảng lưu trữ. Việc UEFN có hay không cơ chế khóa khi nhiều người cùng sửa một asset là UNKNOWN — tài liệu đã khảo sát không đề cập, và tài liệu này không kết luận thay. Việc quy `@editable` thành nguyên tắc "khai báo phụ thuộc ở một chỗ đọc được bằng máy" là diễn giải của tài liệu này (INFERRED). Sự tồn tại của `scripts/ci/check_paldarkv2_headers.py` trong repo là OBSERVED.
