# Chương 8 — Lyra lấy của ta bao nhiêu

Chương trước Lyra trông rất tốt: sáu trên bảy va chạm được chữa, và tất cả quy về ba khuôn mẫu. Nếu dừng ở đó, kết luận sẽ là "dùng Lyra thôi, còn gì phải bàn".

Nhưng ai đã thử đưa Lyra vào một project thật đều biết cảm giác của tuần đầu tiên: bạn muốn thêm một thanh kiếm, và bốn tiếng sau bạn vẫn đang đọc tài liệu về Asset Manager. Chương này định lượng cái cảm giác đó, vì cảm giác thì cãi nhau được, còn con số thì không.

Tôi đo bằng một câu hỏi rất cụ thể: **để thêm một thứ nhỏ nhất có thể vào game, phải chạm bao nhiêu thứ?**

## 8.1 — Đếm thật: thêm một món đồ vào game

Đây là chuỗi thao tác thật, đếm từ tài liệu khóa 15 khi thêm một thanh đại kiếm — món đồ đơn giản nhất có thể cầm được:

1. Có sẵn Inventory Manager Component trên Controller
2. Có sẵn QuickBar Component trên Controller
3. Có sẵn Equipment Manager Component trên Character
4. Khai báo ba component đó trong một Game Feature action
5. Đăng ký kiểu Experience Action Set với Asset Manager
6. Tạo Action Set và đưa vào Experience Definition
7. Tạo Item Definition cho món đồ
8. Gắn equipment definition, icon, mesh, các fragment cần thiết
9. Chờ Controller, Inventory Manager và QuickBar sẵn sàng
10. Gọi thêm item để tạo Item Instance
11. Đưa instance vào một ô QuickBar và chọn ô đang hoạt động
12. Nếu asset nằm sai biên plugin thì chuyển vào trong plugin và biên dịch lại Blueprint cha/con
13. Chạy thử và kiểm tra asset registry, tay cầm, equipment

**Mười ba bước. Tám đến mười hai asset hoặc file. Ít nhất bảy khái niệm phải hiểu trước khi bắt đầu.**

Để so sánh: không dùng framework nào, một món đồ nhặt được cần một Actor, một mesh, một mảng trong túi đồ và một hàm nhặt. Khoảng ba thứ.

Với một ability mới thì con số tương tự: một ability thuần logic cần khoảng bảy đến chín loại asset và khái niệm; một ability có nút bấm riêng, có vũ khí, có animation thì khoảng mười bốn nhóm bước và chạm mười đến mười lăm file.

Đây không phải Lyra làm dở. Mỗi bước trong mười ba bước kia đều có lý do, và đổi lại bạn nhận được replication đúng, equipment đúng, vòng đời đúng, và khả năng bật tắt tính năng. Nhưng phải gọi đúng tên: **đó là chi phí trả trước, và nó không nhỏ.**

## 8.2 — Dốc thật sự nằm ở đâu

Nếu chỉ nhìn con số mười ba, ta dễ kết luận sai rằng Lyra khó vì nhiều bước. Không phải. Mười ba bước cơ học thì làm vài lần là thuộc.

Chỗ thật sự làm người ta tắc là: **ý nghĩa của mỗi file chỉ hiện ra sau khi đã ghép đủ chuỗi.**

Mở riêng một Experience asset ra xem, bạn thấy một danh sách. Mở riêng một PawnData, bạn thấy vài ô tham chiếu. Mở riêng một AbilitySet, bạn thấy một mảng. Từng cái đều đơn giản đến mức không có gì để hiểu. Nhưng câu hỏi "vì sao nhân vật của tôi có khẩu súng này" thì cần đi qua cả năm cái cùng lúc: map trỏ tới Experience, Experience nạp plugin, plugin khai báo gắn component, PawnData trỏ tới AbilitySet, AbilitySet cấp ability.

Đây là kiểu khó khác hẳn với "hàm này làm gì". Nó là khó vì **phải giữ năm thứ trong đầu cùng lúc mới hiểu được một thứ**. Và đây cũng là lý do đọc tài liệu tham khảo của Lyra không giúp được nhiều — tài liệu tham khảo mô tả từng lớp một, đúng cái cách làm người đọc tắc.

Có bốn nút thắt cụ thể, xếp theo mức độ hay làm người ta bỏ cuộc:

**Nút 1 — chuỗi Experience.** Năm khái niệm phải nắm cùng lúc, như vừa nói.

**Nút 2 — lỗi đến muộn.** Bạn tạo một asset, biên dịch sạch, không có cảnh báo nào. Chạy lên thì hệ thống không thấy asset đó, vì kiểu asset chưa được khai báo trong đường quét của Asset Manager. Tài liệu khóa 15 phải ghi cả mẹo khởi động lại editor. Loại lỗi "im lặng lúc build, hỏng lúc chạy" này rất độc với người mới, vì không có gì chỉ cho họ chỗ sai.

**Nút 3 — thứ tự sẵn sàng.** Component được gắn lúc chạy và nạp bất đồng bộ. Nhân vật có thể đã được điều khiển trước khi túi đồ kịp tồn tại. Trong khóa 15 người dạy phải viết hẳn một đoạn chờ: kiểm tra Controller, rồi Inventory Manager, rồi QuickBar, rồi đợi sang tick sau mới thêm đồ. Nghĩa là người học không chỉ học API, mà phải học vòng đời — thứ khó dạy nhất.

**Nút 4 — chiều phụ thuộc.** Plugin không được trỏ ngược ra content gốc. Luật này đơn giản khi phát biểu, nhưng vi phạm nó thì mọi thứ vẫn chạy bình thường cho tới lúc tắt plugin đi và game vỡ.

Điểm chung của bốn nút: **không cái nào là kiến thức, tất cả đều là quan hệ.** Cái đó không đọc mà biết, phải có người vẽ ra.

## 8.3 — Vậy hạ dốc bằng cách nào

Đến đây câu hỏi của bạn ở đầu project mới có chỗ để trả lời: làm sao để người mới, hoặc một agent chưa từng thấy Lyra, không bị chết chìm?

Tôi thấy ba cách, và Paldark sẽ dùng cả ba.

**Cách 1 — Dạy bằng một lát cắt xuyên suốt, không dạy bằng danh sách khái niệm.**

Thay vì giải thích Experience là gì rồi PawnData là gì rồi AbilitySet là gì, hãy đi một lần từ đầu đến cuối cho một thứ nhỏ nhất có thể: từ map, tới Experience, tới plugin, tới component, tới cái vật thể hiện ra trước mắt. Đúng một đường, không rẽ nhánh, không nhắc tới thứ gì không nằm trên đường đó.

Người học đi hết đường đó một lần sẽ có cái khung để treo mọi khái niệm còn lại lên. Đây chính là cách thầy Ulibarri mở đầu các khóa của mình: bài đầu tiên luôn là bản đồ toàn tuyến, và mỗi phần kết thúc bằng câu "phần sau ta sẽ làm gì" để người học biết mình đang ở đâu.

**Cách 2 — Giấu chi phí một lần, không bắt trả lại mỗi lần.**

Trong mười ba bước ở trên, sáu bước đầu là **dựng hạ tầng, chỉ làm một lần cho cả project**. Bảy bước sau mới là thêm một món đồ. Vấn đề của tài liệu Lyra là nó trộn hai loại đó vào nhau, khiến người đọc tưởng lần nào cũng phải làm mười ba bước.

Paldark tách hẳn: phần hạ tầng nằm trong bộ khung, viết một lần, không ai phải đụng lại. Phần thêm một món đồ phải rút xuống còn **một file dữ liệu mới**, không sửa file nào của ai. Nếu thêm một món đồ mà vẫn phải mở ba asset khác ra sửa, tức là bộ khung của ta chưa xong việc.

**Cách 3 — Chuyển lỗi từ lúc chạy về lúc kiểm tra.**

Nút 2 và nút 4 đều là lỗi im lặng: không ai báo gì cho tới khi chạy. Với con người thì khó chịu; với một nghìn agent thì không chấp nhận được, vì agent không có trực giác để đoán mình quên bước nào.

Cách chữa là viết script kiểm tra: quét cây thư mục, đọc file khai báo, và nói thẳng "plugin X đang trỏ ngược ra content gốc" hoặc "kiểu asset Y chưa được đăng ký". Chuyển lỗi vòng đời thành lỗi cú pháp. Repo này đã có sẵn hướng đó trong `scripts/ci/`, và Chương 19 sẽ mở rộng nó thành trọng tài đầy đủ.

## 8.4 — Cái Lyra không giải quyết, và nó nghiêm trọng hơn ta tưởng

Còn một khoản chi phí nữa mà đếm bước không ra, và nó là lý do Paldark không thể chỉ đơn giản là "dùng Lyra".

**Tài sản nhị phân.**

Trong Lyra, rất nhiều thứ quan trọng là asset: Experience Definition, PawnData, AbilitySet, Item Definition, Input Config. Tất cả đều là file `.uasset` — nhị phân, Git không merge được, không đọc được bằng mắt, không sinh ra được bằng script một cách tự nhiên.

Với một đội người thì chịu được: chia nhau ra, ai sửa cái nào thì báo. Với một nghìn agent thì đây là chỗ chết. Agent không mở được editor, không đọc được nội dung asset để biết mình sắp ghi đè cái gì, và hai agent cùng chạm một asset thì một người mất trắng.

Trong bảng ở Chương 7 tôi ghi Experience là "giữ ý tưởng, phải sửa chỗ file dùng chung" — đây chính là chỗ đó. Ý tưởng cấu hình bằng dữ liệu là đúng. Nhưng **dữ liệu phải ở dạng văn bản** thì mới hợp với cách làm việc song song quy mô lớn.

Đây là điểm khác biệt lớn nhất giữa Paldark và Lyra, và nó không phải chê Lyra. Lyra được thiết kế cho một studio với editor, artist và quy trình review. Ta đang thiết kế cho một tình huống khác hẳn, nên có quyền chọn khác.

## 8.5 — Tóm lại chương này

- Thêm một món đồ theo đúng cách Lyra tốn **13 bước, 8–12 asset, ít nhất 7 khái niệm**. Đó là số đếm thật, không phải cảm giác.
- Dốc không nằm ở số bước, mà ở chỗ **ý nghĩa chỉ hiện ra khi ghép đủ chuỗi năm khái niệm**.
- Bốn nút thắt: chuỗi Experience, lỗi đến muộn từ Asset Manager, thứ tự sẵn sàng của component, chiều phụ thuộc của plugin.
- Hạ dốc bằng ba cách: **dạy bằng một lát cắt xuyên suốt**, **trả chi phí hạ tầng một lần thay vì mỗi lần**, **chuyển lỗi lúc chạy về lỗi lúc kiểm tra**.
- Khoản chi phí Lyra không tự giải quyết được cho bài toán của ta là **cấu hình nằm trong file nhị phân**. Paldark sẽ phải đổi chỗ này.

Chương sau xem UEFN — nơi Epic giải đúng bài toán nhiều người cùng xây một thế giới, bằng một bộ công cụ khác hẳn.

---

**Bằng chứng cho chương này.** Chuỗi 13 bước thêm món đồ và các con số 7–9 / 14 bước cho ability là đếm từ transcript khóa 15 (Build an RPG using Lyra Framework) và đối chiếu khóa 17; đây là đếm thao tác trong tài liệu, không phải quy định của engine, nên con số sẽ khác tùy loại tính năng. Đoạn chờ sẵn sàng của Inventory Manager và QuickBar, việc phải đăng ký kiểu asset với Asset Manager kèm mẹo khởi động lại editor, và sự cố tham chiếu ngược của `B_Hero_Default` đều là OBSERVED từ transcript khóa 15. Việc `.uasset` là định dạng nhị phân không merge được là thuộc tính của Unreal Engine. Kết luận rằng cấu hình nhị phân là điểm chặn với quy mô nghìn agent là lập luận của tài liệu này (INFERRED); không có nguồn nào của Epic phát biểu điều đó.
