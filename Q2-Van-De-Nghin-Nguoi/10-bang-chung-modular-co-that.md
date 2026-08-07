# Chương 10 — Bằng chứng rằng modular có thật

Cho tới đây, chuỗi lập luận đã khá tròn: ta có va chạm, cơ chế chữa, chi phí và nguyên tắc ranh giới. Nhưng một kiến trúc hợp lý trên giấy vẫn có thể thất bại khi hệ thống đủ lớn. Câu hỏi cần trả lời trước khi viết luật là: **đã có ai làm được chưa?**

Cụ thể hơn: một nhóm không thuộc Epic có thể xây hệ thống lớn trên nền Lyra, để phần mở rộng nằm ngoài lõi, rồi tiếp tục dùng các contract công khai hay không? Đây mới là phép thử gần với Paldark. Nếu “modular” chỉ đúng khi chính đội tạo framework sử dụng nó, bằng chứng ấy chưa đủ cho bài toán nhiều bên độc lập.

May là repo này có sẵn một mẫu vật rất tốt để mổ.

## 10.1 — Mẫu vật

Mẫu vật nằm ngay trong repo: mã nguồn của plugin thương mại `InventoryExtendedForLyra`, do một bên thứ ba phát triển. Nó không chỉ thêm một loại item mà mở rộng Lyra bằng túi đồ nhiều kiểu, giáp, đồ tiêu thụ, phụ kiện vũ khí, chế tạo, xây dựng, rương đồ, bản đồ, đội nhóm và điểm hồi sinh.

Vài con số quan sát được:

- **149 file mã nguồn C++** trong module runtime của plugin
- **khoảng 3.841 file asset** trong phần nội dung của plugin
- Toàn bộ nằm trong `Plugins/GameFeatures/InventoryExtendedForLyra/`

Với quy mô ấy, đây không còn là ví dụ đồ chơi mà là một hệ thống ở mức sản phẩm thương mại.

Điểm quyết định không nằm ở số file mà ở vị trí của chúng: **phần mở rộng không nằm trong `LyraGame`.** Toàn bộ hệ thống quan sát được nằm gọn trong một plugin và gọi API Lyra từ bên ngoài.

## 10.2 — Họ mở rộng bằng cách nào

Khi bỏ quy mô sang một bên và nhìn vào cách plugin bám vào Lyra, ta thấy ba cơ chế quen thuộc từ Chương 7. Điều đáng chú ý là chúng không chỉ xuất hiện trong sample; chúng chịu được một hệ thống lớn hơn nhiều.

**Cách 1 — Thêm component mới, không sửa component cũ.**

Lyra có sẵn component quản lý túi đồ. Plugin không nhồi thêm trách nhiệm vào component đó mà đặt những component mới bên cạnh: quản lý túi đồ mở rộng, túi đồ theo ô đánh số, giáp, đồ tiêu thụ và phụ kiện vũ khí. Khi cần phối hợp với phần gốc, chúng tìm component Lyra qua API công khai rồi gọi.

**Cách 2 — Kế thừa những chỗ Lyra chừa sẵn để kế thừa.**

Plugin gọi vào các điểm mở của Lyra: cấp bộ ability cho hệ thống ability, dùng component mở rộng pawn, hỏi trình quản lý Experience, dùng định nghĩa và thực thể vật phẩm của Lyra. Nó không định nghĩa lại những khái niệm đó — nó đứng lên trên chúng.

**Cách 3 — và đây là cách quan trọng nhất — mở rộng bằng cách thêm mảnh dữ liệu.**

Lyra thiết kế vật phẩm theo kiểu: một định nghĩa vật phẩm mang theo **một danh sách các mảnh**, mỗi mảnh thêm một khía cạnh. Muốn vật phẩm có thể chế tạo được thì gắn thêm mảnh "chế tạo" mang theo thời gian chế tạo, số lượng nhận được và danh sách nguyên liệu. Muốn nó là giáp thì gắn mảnh "giáp". Muốn nó dựng được công trình thì gắn mảnh "xây dựng" trỏ tới loại công trình.

Hệ quả có thể kiểm tra bằng một thao tác rất cụ thể: **thêm một vật phẩm chế tạo được mới thì không sửa một dòng code nào.** Ta tạo định nghĩa mới, gắn mảnh chế tạo và điền thông số. Tài liệu của plugin nói thẳng điều này.

Đây chính là khuôn mẫu 3 ở Chương 6 — mở rộng bằng dữ liệu tự đăng ký — được đẩy tới mức triệt để. Và nó cho thấy tại sao khuôn mẫu đó lại đáng giá đến vậy: khi một hệ thống được thiết kế đúng theo hướng này, phần lớn công việc mở rộng chuyển từ "viết code" thành "thêm dữ liệu", và công việc thêm dữ liệu thì song song hóa được gần như vô hạn.

## 10.3 — Cấu trúc "định nghĩa – thực thể – mảnh"

Ba cơ chế trên cùng hội tụ vào một mô hình sẽ theo suốt phần còn lại của sách. Trước khi đi tiếp, cần tách rõ ba vai của nó; nếu không, “dữ liệu mở rộng” rất dễ bị hiểu thành một struct lớn hơn.

**Định nghĩa** là dữ liệu tĩnh mô tả một loại. “Rìu đá” là một định nghĩa: tên, hình, độ bền tối đa, sát thương. Chỉ có một bản trong game, không đổi lúc chạy; vì không đổi, nó **không cần đồng bộ qua mạng**.

**Thực thể** là một cá thể cụ thể lúc chạy. Cái rìu đá đang nằm trong túi bạn với độ bền còn 34 là một thực thể. Nó đổi liên tục, nên nó là thứ **cần đồng bộ qua mạng và cần lưu**.

**Mảnh** là một khía cạnh gắn thêm vào định nghĩa. Chế tạo được, mặc được, ăn được, dựng được — mỗi thứ là một mảnh.

Sức mạnh của mô hình nằm ở chỗ **tập loại mảnh là mở**. Một agent có thể định nghĩa mảnh “nấu được”; agent khác định nghĩa mảnh “dùng làm thức ăn nhân giống”. Cả hai thêm khả năng mới mà không sửa lớp định nghĩa hay thực thể, cũng không cần biết implementation của nhau.

So sánh với cách làm thông thường — một struct vật phẩm khổng lồ có sẵn mọi trường, mỗi tính năng thêm vài trường vào — thì khác biệt rất rõ. Cách thông thường biến định nghĩa vật phẩm thành ngã tư đông nhất trong project. Cách mảnh thì biến nó thành một danh sách mà ai cũng chỉ thêm phần tử của mình.

Trong chuỗi từ Chương 7 đến đây, đây là ý tưởng có sức lan rộng nhất. Paldark sẽ không giới hạn nó ở vật phẩm mà áp dụng cho những domain có nhiều biến thể như sinh vật, công trình, loại việc và hiệu ứng.

## 10.4 — Nhưng phải đọc bằng chứng cho đúng

Một mẫu vật lớn rất dễ khiến ta suy diễn quá xa. Vì vậy, trước khi kết luận, cần nói rõ bằng chứng **không** chứng minh những gì.

**Nó không chứng minh rằng người ta chưa bao giờ phải sửa Lyra.** Cái ta quan sát được là ảnh chụp mã nguồn ở một thời điểm, không phải toàn bộ lịch sử. Có thể trong quá trình làm họ đã phải chỉnh gì đó rồi bỏ đi. Kết luận đúng và đủ là: **ở trạng thái cuối, mọi phần mở rộng đều nằm trong plugin.**

**Nó không chứng minh rằng modular là miễn phí.** 149 file C++ cho một hệ thống túi đồ là con số lớn. Một phần số file chính là cái giá của khuôn mẫu: mỗi khái niệm cần định nghĩa, thực thể, mảnh và trình quản lý tương ứng. Một implementation nhanh và bẩn chắc chắn có thể dùng ít file hơn.

**Nó không chứng minh rằng người mới làm được ngay.** Người làm plugin này rõ ràng đã trả xong học phí Lyra rồi mới mở rộng được. Chương 8 đã đo học phí đó.

**Và nó là phần mềm thương mại có giấy phép.** Ta học cách làm, không chép mã nguồn.

## 10.5 — Kết luận: cái gì đã được chứng minh

Sau khi đã đặt giới hạn cho bằng chứng, ta có thể gom các Chương 7, 8 và 10 thành bốn kết luận có mức chắc chắn rõ ràng:

1. Có tồn tại một kiến trúc cho phép người ngoài mở rộng một game lớn mà **không sửa lõi**. Đây là sự thật quan sát được, không phải lý thuyết.
2. Cơ chế làm được điều đó gồm ba thứ: **đóng gói thành plugin**, **gắn hành vi bằng component từ bên ngoài**, và **mở rộng bằng cách thêm mảnh dữ liệu**.
3. Cái giá là **học phí ban đầu cao** và **nhiều lớp trung gian**.
4. Còn một chỗ chưa ai giải cho ta: cấu hình nằm trong file nhị phân, không hợp với quy mô nghìn agent.

Ba điểm đầu tạo nền mà Paldark có thể kế thừa. Điểm thứ tư đánh dấu phần thiết kế phải tự làm, thay vì giả định Lyra đã giải hộ.

Chương sau sẽ biến toàn bộ đường suy luận này thành luật: mỗi luật phải chỉ ra va chạm nó chặn và cách một cái máy có thể phát hiện vi phạm.

---

**Bằng chứng cho chương này.** Toàn bộ mô tả plugin `InventoryExtendedForLyra` là OBSERVED từ ảnh chụp mã nguồn trong `17.Hipernova-Lyra-Inventory/Source`: cấu trúc thư mục plugin, khai báo module runtime và các phụ thuộc, danh sách component và lớp mở rộng, các loại mảnh vật phẩm, và các lời gọi vào API Lyra. Hai con số 149 file C++ và khoảng 3.841 asset là đếm trực tiếp trên ảnh chụp đó. Khẳng định "thêm vật phẩm chế tạo được mà không sửa code" lấy từ tài liệu tổng hợp của khóa 17. Việc plugin chưa từng phải sửa Lyra trong suốt quá trình phát triển là UNKNOWN — không suy ra được từ ảnh chụp một thời điểm. Plugin là sản phẩm thương mại có giấy phép; tài liệu này chỉ phân tích cơ chế, không sao chép mã nguồn.
