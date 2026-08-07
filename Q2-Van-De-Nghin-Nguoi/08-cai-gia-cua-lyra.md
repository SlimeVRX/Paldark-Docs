# Chương 8 — Lyra lấy của ta bao nhiêu

Sau Chương 7, quyết định có vẻ đã quá dễ: sáu trên bảy va chạm được chữa, và tất cả quy về ba khuôn mẫu dễ nhớ. Nếu chỉ nhìn cột lợi ích, câu trả lời sẽ là “dùng Lyra thôi, còn gì phải bàn”.

Nhưng hãy đặt một task rất nhỏ vào hệ thống ấy: thêm một thanh kiếm. Bốn tiếng sau, người làm có thể vẫn đang đọc về Asset Manager thay vì nhìn thấy thanh kiếm trong tay nhân vật. Chương này định lượng quãng đường đó, bởi một cảm giác “framework quá nặng” rất dễ tranh cãi, còn số điểm phải chạm thì có thể kiểm đếm.

Tôi đo bằng một câu hỏi rất cụ thể: **để thêm một thứ nhỏ nhất có thể vào game, phải chạm bao nhiêu thứ?**

## 8.1 — Đếm thật: thêm một món đồ vào game

Ta đi theo đúng chuỗi thao tác trong tài liệu khóa 15 khi thêm một thanh đại kiếm — một món đồ đơn giản có thể cầm được — và đếm từng điểm phải đi qua:

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

Kết quả là **mười ba bước, tám đến mười hai asset hoặc file, và ít nhất bảy khái niệm phải hiểu trước khi bắt đầu.**

Để so sánh: không dùng framework nào, một món đồ nhặt được cần một Actor, một mesh, một mảng trong túi đồ và một hàm nhặt. Khoảng ba thứ.

Với một ability mới thì con số tương tự: một ability thuần logic cần khoảng bảy đến chín loại asset và khái niệm; một ability có nút bấm riêng, có vũ khí, có animation thì khoảng mười bốn nhóm bước và chạm mười đến mười lăm file.

Con số này không chứng minh Lyra làm dở. Mỗi bước đều có lý do; đổi lại là replication đúng, equipment đúng, vòng đời đúng và khả năng bật tắt feature. Nhưng lợi ích không làm chi phí biến mất. Ta phải gọi đúng tên: **đó là một khoản trả trước, và nó không nhỏ.**

## 8.2 — Dốc thật sự nằm ở đâu

Nếu dừng ở con số mười ba, ta lại có thể chẩn đoán sai: Lyra khó vì có nhiều bước. Những bước cơ học có thể học thuộc sau vài lần. Độ dốc thật nằm ở chỗ người làm chưa biết vì sao bước này đứng trước bước kia.

Chỗ thật sự làm người ta tắc là: **ý nghĩa của mỗi file chỉ hiện ra sau khi đã ghép đủ chuỗi.**

Mở riêng một Experience asset, ta thấy một danh sách. Mở PawnData, ta thấy vài ô tham chiếu. Mở AbilitySet, ta thấy một mảng. Từng asset đều đơn giản đến mức tưởng như không có gì để học. Nhưng để trả lời “vì sao nhân vật của tôi có khẩu súng này?”, phải giữ cả chuỗi trong đầu: map trỏ tới Experience, Experience nạp plugin, plugin khai báo gắn component, PawnData trỏ tới AbilitySet, AbilitySet cấp ability.

Đây là kiểu khó khác hẳn với "hàm này làm gì". Nó là khó vì **phải giữ năm thứ trong đầu cùng lúc mới hiểu được một thứ**. Và đây cũng là lý do đọc tài liệu tham khảo của Lyra không giúp được nhiều — tài liệu tham khảo mô tả từng lớp một, đúng cái cách làm người đọc tắc.

Có bốn nút thắt cụ thể, xếp theo mức độ hay làm người ta bỏ cuộc:

**Nút 1 — chuỗi Experience.** Năm khái niệm phải nắm cùng lúc, như vừa nói.

**Nút 2 — lỗi đến muộn.** Bạn tạo một asset, biên dịch sạch, không có cảnh báo nào. Chạy lên thì hệ thống không thấy asset đó, vì kiểu asset chưa được khai báo trong đường quét của Asset Manager. Tài liệu khóa 15 phải ghi cả mẹo khởi động lại editor. Loại lỗi "im lặng lúc build, hỏng lúc chạy" này rất độc với người mới, vì không có gì chỉ cho họ chỗ sai.

**Nút 3 — thứ tự sẵn sàng.** Component được gắn lúc chạy và nạp bất đồng bộ. Nhân vật có thể đã được điều khiển trước khi túi đồ kịp tồn tại. Trong khóa 15 người dạy phải viết hẳn một đoạn chờ: kiểm tra Controller, rồi Inventory Manager, rồi QuickBar, rồi đợi sang tick sau mới thêm đồ. Nghĩa là người học không chỉ học API, mà phải học vòng đời — thứ khó dạy nhất.

**Nút 4 — chiều phụ thuộc.** Plugin không được trỏ ngược ra content gốc. Luật này đơn giản khi phát biểu, nhưng vi phạm nó thì mọi thứ vẫn chạy bình thường cho tới lúc tắt plugin đi và game vỡ.

Điểm chung của bốn nút là: **không cái nào khó vì bản thân một API; tất cả đều khó vì quan hệ.** Một trang reference cho từng class không tự ghép được chuỗi ấy. Người học cần thấy đường đi trước khi bị yêu cầu nhớ tên từng trạm.

## 8.3 — Vậy hạ dốc bằng cách nào

Khi đã gọi đúng tên độ dốc, ta mới có thể hỏi cách hạ nó: làm sao để người mới, hoặc một agent chưa từng thấy Lyra, đi hết chuỗi mà không bị nhấn chìm trong từng khái niệm riêng lẻ?

Tôi thấy ba cách, và Paldark sẽ dùng cả ba.

**Cách 1 — Dạy bằng một lát cắt xuyên suốt, không dạy bằng danh sách khái niệm.**

Thay vì giải thích Experience là gì rồi PawnData là gì rồi AbilitySet là gì, hãy đi một lần từ đầu đến cuối cho một thứ nhỏ nhất có thể: từ map, tới Experience, tới plugin, tới component, tới cái vật thể hiện ra trước mắt. Đúng một đường, không rẽ nhánh, không nhắc tới thứ gì không nằm trên đường đó.

Đi hết đường đó một lần, người học có một cái khung để treo những khái niệm còn lại lên. Đây chính là cách thầy Ulibarri mở đầu các khóa của mình: bài đầu tiên luôn vẽ bản đồ toàn tuyến, và mỗi phần kết thúc bằng câu “phần sau ta sẽ làm gì” để người học biết mình đang đứng ở đâu.

**Cách 2 — Giấu chi phí một lần, không bắt trả lại mỗi lần.**

Trong mười ba bước ở trên, sáu bước đầu là **hạ tầng chỉ dựng một lần cho cả project**; bảy bước sau mới thuộc task thêm món đồ. Khi hai loại việc bị kể trong cùng một chuỗi mà không phân biệt, người đọc dễ tưởng mỗi item mới đều phải trả lại toàn bộ mười ba bước.

Paldark tách hẳn: phần hạ tầng nằm trong bộ khung, viết một lần, không ai phải đụng lại. Phần thêm một món đồ phải rút xuống còn **một file dữ liệu mới**, không sửa file nào của ai. Nếu thêm một món đồ mà vẫn phải mở ba asset khác ra sửa, tức là bộ khung của ta chưa xong việc.

**Cách 3 — Chuyển lỗi từ lúc chạy về lúc kiểm tra.**

Nút 2 và nút 4 đều là lỗi im lặng: không ai báo gì cho tới khi chạy. Với con người thì khó chịu; với một nghìn agent thì không chấp nhận được, vì agent không có trực giác để đoán mình quên bước nào.

Cách chữa là cho script quét cây thư mục, đọc file khai báo và nói thẳng “plugin X đang trỏ ngược ra content gốc” hoặc “kiểu asset Y chưa được đăng ký”. Nói cách khác, chuyển lỗi chỉ xuất hiện ở vòng đời runtime thành lỗi có thể thấy ở bước kiểm tra. Repo này đã có sẵn hướng đó trong `scripts/ci/`, và Chương 19 sẽ mở rộng nó thành trọng tài đầy đủ.

## 8.4 — Cái Lyra không giải quyết, và nó nghiêm trọng hơn ta tưởng

Ba cách trên hạ được dốc học tập, nhưng chưa xử lý một khoản chi phí mà phép đếm bước không nhìn thấy. Đây là lý do Paldark không thể đơn giản kết thúc quyết định bằng hai chữ “dùng Lyra”.

**Tài sản nhị phân.**

Trong Lyra, nhiều cấu hình quan trọng là asset: Experience Definition, PawnData, AbilitySet, Item Definition, Input Config. Chúng đều là file `.uasset` — nhị phân, Git không merge được, không đọc được bằng mắt và không được sinh ra tự nhiên bằng cách viết một script văn bản.

Với một đội người thì chịu được: chia nhau ra, ai sửa cái nào thì báo. Với một nghìn agent thì đây là chỗ chết. Agent không mở được editor, không đọc được nội dung asset để biết mình sắp ghi đè cái gì, và hai agent cùng chạm một asset thì một người mất trắng.

Trong bảng ở Chương 7 tôi ghi Experience là "giữ ý tưởng, phải sửa chỗ file dùng chung" — đây chính là chỗ đó. Ý tưởng cấu hình bằng dữ liệu là đúng. Nhưng **dữ liệu phải ở dạng văn bản** thì mới hợp với cách làm việc song song quy mô lớn.

Đây là khác biệt lớn nhất giữa Paldark và Lyra, nhưng không phải một lời chê Lyra. Lyra phục vụ studio có editor, artist và quy trình review; Paldark đang tối ưu cho một tình huống phối hợp khác. Cùng một đánh đổi có thể hợp lý ở hệ này và trở thành điểm nghẽn ở hệ kia.

## 8.5 — Tóm lại chương này

- Thêm một món đồ theo đúng cách Lyra tốn **13 bước, 8–12 asset, ít nhất 7 khái niệm**. Đó là số đếm thật, không phải cảm giác.
- Dốc không nằm ở số bước, mà ở chỗ **ý nghĩa chỉ hiện ra khi ghép đủ chuỗi năm khái niệm**.
- Bốn nút thắt: chuỗi Experience, lỗi đến muộn từ Asset Manager, thứ tự sẵn sàng của component, chiều phụ thuộc của plugin.
- Hạ dốc bằng ba cách: **dạy bằng một lát cắt xuyên suốt**, **trả chi phí hạ tầng một lần thay vì mỗi lần**, **chuyển lỗi lúc chạy về lỗi lúc kiểm tra**.
- Khoản chi phí Lyra không tự giải quyết được cho bài toán của ta là **cấu hình nằm trong file nhị phân**. Paldark sẽ phải đổi chỗ này.

Khoản chi phí cuối cùng đưa ta sang một hệ khác của Epic. Chương sau nhìn vào UEFN, nơi bài toán không còn là một studio mở rộng game mẫu mà là rất nhiều người xa lạ cùng xây bên trong một thế giới chung.

---

**Bằng chứng cho chương này.** Chuỗi 13 bước thêm món đồ và các con số 7–9 / 14 bước cho ability là đếm từ transcript khóa 15 (Build an RPG using Lyra Framework) và đối chiếu khóa 17; đây là đếm thao tác trong tài liệu, không phải quy định của engine, nên con số sẽ khác tùy loại tính năng. Đoạn chờ sẵn sàng của Inventory Manager và QuickBar, việc phải đăng ký kiểu asset với Asset Manager kèm mẹo khởi động lại editor, và sự cố tham chiếu ngược của `B_Hero_Default` đều là OBSERVED từ transcript khóa 15. Việc `.uasset` là định dạng nhị phân không merge được là thuộc tính của Unreal Engine. Kết luận rằng cấu hình nhị phân là điểm chặn với quy mô nghìn agent là lập luận của tài liệu này (INFERRED); không có nguồn nào của Epic phát biểu điều đó.
