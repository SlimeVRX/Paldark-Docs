# Chương 9 — UEFN dạy thêm gì

Lyra được thiết kế cho một studio: một đội biết nhau, dùng chung editor, có quy trình review, và số người đủ ít để còn nói chuyện được với nhau.

UEFN thì khác hẳn. Nó được thiết kế cho hàng trăm nghìn người xa lạ cùng xây các thế giới bên trong một game duy nhất, phần lớn không phải lập trình viên chuyên nghiệp, và không ai trong số họ đọc tài liệu kiến trúc của người khác.

Nghe qua thì đó là một bài toán khác. Nhưng nhìn kỹ, nó **gần với bài toán của ta hơn Lyra**. Một nghìn agent cũng là những người xa lạ với nhau, cũng không đọc code của nhau, cũng chỉ biết những gì được ghi thành hợp đồng. Nên đáng xem Epic đã giải nó thế nào.

## 9.1 — Device: đơn vị công việc có ranh giới cứng

Trong UEFN, thứ bạn viết không phải là "một lớp trong project", mà là **một device**. Device là một khối tự chứa: có trạng thái riêng, có hàm riêng, có vòng đời riêng, và bạn đặt nó vào thế giới như đặt một món đồ vật.

Điểm đáng học nằm ở chỗ ranh giới không phải là quy ước mà là **hình dạng của công cụ**. Trong Unreal thường, không có gì ngăn bạn `#include` header của người khác — chỉ có lời khuyên. Trong UEFN, device khác đơn giản là **không có mặt** trong tầm với của bạn trừ khi ai đó chủ động nối chúng lại.

Đây là một tư tưởng thiết kế rất mạnh và tôi muốn bạn để ý: **luật nào dựa vào ý chí con người thì sẽ bị vi phạm; luật nào dựa vào việc "không làm được" thì không.** Với một nghìn agent, khác biệt này quyết định thành bại. Agent không cố tình vi phạm luật, nhưng nó cũng không có trực giác để biết mình đang vi phạm. Cách duy nhất chắc chắn là làm cho việc sai trở nên bất khả thi hoặc bị máy chặn ngay.

Ta sẽ không có được sự cô lập cứng như UEFN, vì C++ cho phép include gần như mọi thứ. Nhưng ta có thể tiến gần bằng hai việc: đặt mọi thứ không định cho người khác dùng vào thư mục `Private` để không include được, và viết script kiểm tra chặn những include vượt biên. Repo này đã có sẵn một script đúng tinh thần đó là `check_paldarkv2_headers.py`.

## 9.2 — `@editable`: khai báo cái mình cần, không tự đi tìm

Đây là chi tiết tôi thích nhất ở Verse.

Khi một device cần dùng một device khác, nó không đi tìm. Nó **khai báo một ô trống** bằng từ khóa `@editable`, kiểu như "tôi cần một cái bục teleport, ai đó điền vào giúp". Người dựng màn chơi mở editor lên và kéo device cụ thể vào ô đó.

So sánh với cách thường làm trong Unreal: đi tìm actor trong world bằng cách quét theo lớp, hoặc giữ một con trỏ tới một singleton. Cả hai cách đều tạo ra sự phụ thuộc ngầm — code chạy được hay không tùy thuộc vào thứ nó không kiểm soát, và bạn chỉ biết là hỏng khi chạy.

Cách của Verse biến quan hệ phụ thuộc thành **một phần của khai báo, nhìn thấy được từ bên ngoài**. Muốn biết một device cần gì, đọc danh sách `@editable` của nó là đủ, không cần đọc thân hàm.

Với một nghìn agent, tính chất này còn quan trọng hơn ở chỗ khác: nó cho phép **kiểm tra được bằng máy**. Nếu mọi phụ thuộc đều phải khai báo tại một chỗ cố định, một script có thể đọc toàn bộ project và dựng ra đồ thị phụ thuộc thật — rồi so với đồ thị được phép. Nếu phụ thuộc nằm rải rác trong thân hàm dưới dạng lệnh đi tìm, không script nào dựng lại được đồ thị đó.

Bài học mang về: **mọi thứ một tính năng cần từ bên ngoài phải được khai báo ở một chỗ duy nhất, có định dạng cố định, đọc được bằng máy.** Đây sẽ là một trong những luật cứng của Paldark ở Chương 11.

## 9.3 — Event: cách hai device nói chuyện

Verse cho device công bố event, và device khác đăng ký nghe. Người viết device nghe không cần biết device phát được hiện thực thế nào — chỉ cần biết tên event và dữ liệu nó mang theo.

Về bản chất đây là cùng một khuôn mẫu với Gameplay Message ở Chương 7, nên tôi không lặp lại. Nhưng có một khác biệt về mức độ đáng ghi nhận: trong Lyra, message là **một lựa chọn trong nhiều lựa chọn** — bạn hoàn toàn có thể gọi thẳng nếu muốn. Trong UEFN, với những device không được nối trực tiếp, event gần như là **cách duy nhất**.

Và ở đây tôi phải nói rõ một điều mà khảo sát tài liệu không xác nhận được. UEFN có nhiều người cùng làm, có event, có device cô lập — nhưng **tài liệu tôi đọc được không mô tả cơ chế nào ngăn hai người cùng sửa một thứ**. Không thấy nói về khóa asset, không thấy nói về giải quyết xung đột khi hai người chỉnh cùng lúc. Nên tôi không kết luận rằng UEFN đã giải xong bài toán làm việc song song. Cái nó chứng minh được là hẹp hơn nhưng vẫn có giá trị: **chia thế giới thành các khối cô lập giao tiếp qua event thì giảm được phần lớn nhu cầu phải sửa chung.** Phần "nếu vẫn phải sửa chung thì sao" thì ta tự lo.

## 9.4 — Persistence: chỉ lưu cái là sự thật, không lưu cái là hình ảnh

Verse có một quy tắc rất gọn về lưu trữ: chỉ những kiểu được đánh dấu là lưu được mới lưu, dữ liệu người chơi giữ trong một bảng tra theo người chơi, và giao diện thì **không lưu** — nó được dựng lại từ dữ liệu mỗi lần cần.

Quy tắc "không lưu giao diện" nghe hiển nhiên nhưng bị vi phạm liên tục trong các project thật. Người ta lưu cả trạng thái widget, lưu vị trí cuộn của danh sách, lưu cả những thứ chỉ có ý nghĩa với phiên chơi hiện tại. Rồi khi đổi giao diện, file lưu cũ vỡ.

Cái ta mang về không phải chi tiết kỹ thuật của Verse, mà là **ranh giới**: trong mỗi hệ thống, phải tách rõ đâu là sự thật cần sống sót qua lần thoát game, và đâu là thứ dựng lại được. Chương 4 đã đặt câu hỏi này cho từng tính năng; đến Chương 14 nó sẽ thành một luật của bộ khung.

Verse còn có một chi tiết nhỏ mà tôi thấy thú vị: giới hạn tối đa hai bảng lưu trữ cho một game. Một giới hạn cứng, nghe rất khó chịu, nhưng nó buộc người viết phải nghĩ nghiêm túc về cái gì đáng lưu. Ràng buộc đôi khi là công cụ thiết kế tốt hơn tự do.

## 9.5 — Ba điều mang về từ UEFN

| Điều học được | Vì sao quan trọng với một nghìn agent | Paldark sẽ làm gì |
|---|---|---|
| Ranh giới do công cụ ép, không do lời khuyên | Agent không có trực giác để tự giữ luật | `Private` cho mọi thứ nội bộ, cộng script chặn include vượt biên |
| Phụ thuộc phải khai báo ở một chỗ cố định | Máy mới dựng được đồ thị phụ thuộc để kiểm tra | Mỗi tính năng có đúng một file khai báo, định dạng văn bản cố định |
| Chỉ lưu sự thật, không lưu hình ảnh | Tránh vỡ file lưu khi giao diện đổi | Tách rõ dữ liệu bền và trạng thái phiên trong từng hệ thống |

Và một điều **không** học được: UEFN không cho ta lời giải cho tình huống hai người buộc phải sửa cùng một thứ. Chỗ đó ta phải tự thiết kế, và nó là nội dung chính của Chương 12.

Chương sau xem một bằng chứng thực tế: một nhóm bên ngoài Epic đã xây một hệ thống rất lớn trên nền Lyra mà không sửa một dòng nào của Lyra. Đó là bằng chứng gần nhất với điều ta đang muốn chứng minh.

---

**Bằng chứng cho chương này.** Mô tả device, `@editable`, event subscription và persistence trong Verse là OBSERVED từ khảo sát tài liệu khóa 16 (UEFN/Verse Programming) trong repo, bao gồm chi tiết giới hạn hai bảng lưu trữ. Việc UEFN có hay không cơ chế khóa khi nhiều người cùng sửa một asset là UNKNOWN — tài liệu đã khảo sát không đề cập, và tài liệu này không kết luận thay. Việc quy `@editable` thành nguyên tắc "khai báo phụ thuộc ở một chỗ đọc được bằng máy" là diễn giải của tài liệu này (INFERRED). Sự tồn tại của `scripts/ci/check_paldarkv2_headers.py` trong repo là OBSERVED.
