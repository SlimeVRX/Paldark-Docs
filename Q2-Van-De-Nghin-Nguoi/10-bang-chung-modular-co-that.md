# Chương 10 — Bằng chứng rằng modular có thật

Chín chương vừa rồi toàn là lập luận. Lập luận nghe hay thì dễ, nhưng câu hỏi thật là: **đã có ai làm được chưa?**

Cụ thể hơn: đã có ai — không thuộc Epic, không được sửa mã nguồn Lyra — xây được một hệ thống lớn trên nền Lyra và hệ thống đó vẫn dùng lại được không? Vì đó chính xác là điều ta cần chứng minh. Nếu "modular" chỉ đúng trong nội bộ đội viết ra framework thì nó vô dụng với bài toán của ta.

May là repo này có sẵn một mẫu vật rất tốt để mổ.

## 10.1 — Mẫu vật

Trong repo có mã nguồn của một plugin tên `InventoryExtendedForLyra`, do một bên thứ ba làm và bán. Nó thêm vào Lyra: túi đồ nhiều kiểu, giáp, đồ tiêu thụ, phụ kiện vũ khí, chế tạo, xây dựng, rương đồ, bản đồ, đội nhóm, và điểm hồi sinh.

Vài con số quan sát được:

- **149 file mã nguồn C++** trong module runtime của plugin
- **khoảng 3.841 file asset** trong phần nội dung của plugin
- Toàn bộ nằm trong `Plugins/GameFeatures/InventoryExtendedForLyra/`

Đây không phải một ví dụ đồ chơi. Nó là một hệ thống quy mô sản phẩm thương mại.

Và điều quan trọng nhất: **nó không nằm trong `LyraGame`.** Toàn bộ phần mở rộng nằm gọn trong một plugin, gọi API của Lyra từ bên ngoài.

## 10.2 — Họ mở rộng bằng cách nào

Mổ ra thì thấy đúng ba cách, và cả ba đều là những cơ chế ta đã gặp ở Chương 7.

**Cách 1 — Thêm component mới, không sửa component cũ.**

Lyra có sẵn component quản lý túi đồ. Plugin không sửa nó, mà viết những component riêng đặt cạnh: quản lý túi đồ mở rộng, quản lý túi đồ theo ô đánh số, quản lý giáp, quản lý đồ tiêu thụ, quản lý phụ kiện vũ khí. Khi cần nói chuyện với phần Lyra gốc, chúng tìm component của Lyra qua API công khai rồi gọi.

**Cách 2 — Kế thừa những chỗ Lyra chừa sẵn để kế thừa.**

Plugin gọi vào các điểm mở của Lyra: cấp bộ ability cho hệ thống ability, dùng component mở rộng pawn, hỏi trình quản lý Experience, dùng định nghĩa và thực thể vật phẩm của Lyra. Nó không định nghĩa lại những khái niệm đó — nó đứng lên trên chúng.

**Cách 3 — và đây là cách quan trọng nhất — mở rộng bằng cách thêm mảnh dữ liệu.**

Lyra thiết kế vật phẩm theo kiểu: một định nghĩa vật phẩm mang theo **một danh sách các mảnh**, mỗi mảnh thêm một khía cạnh. Muốn vật phẩm có thể chế tạo được thì gắn thêm mảnh "chế tạo" mang theo thời gian chế tạo, số lượng nhận được và danh sách nguyên liệu. Muốn nó là giáp thì gắn mảnh "giáp". Muốn nó dựng được công trình thì gắn mảnh "xây dựng" trỏ tới loại công trình.

Hệ quả rất đáng chú ý: **thêm một vật phẩm chế tạo được mới thì không sửa một dòng code nào.** Chỉ tạo một định nghĩa mới, gắn mảnh chế tạo, điền thông số. Tài liệu của plugin nói thẳng điều này.

Đây chính là khuôn mẫu 3 ở Chương 6 — mở rộng bằng dữ liệu tự đăng ký — được đẩy tới mức triệt để. Và nó cho thấy tại sao khuôn mẫu đó lại đáng giá đến vậy: khi một hệ thống được thiết kế đúng theo hướng này, phần lớn công việc mở rộng chuyển từ "viết code" thành "thêm dữ liệu", và công việc thêm dữ liệu thì song song hóa được gần như vô hạn.

## 10.3 — Cấu trúc "định nghĩa – thực thể – mảnh"

Vì mô hình này sẽ theo ta suốt phần còn lại của tài liệu, tôi tách riêng ra nói cho kỹ. Nó chỉ có ba vai:

**Định nghĩa** là dữ liệu tĩnh, mô tả một loại. "Rìu đá" là một định nghĩa: tên, hình, độ bền tối đa, sát thương. Chỉ có một bản duy nhất trong cả game, không đổi lúc chạy, và vì không đổi nên **không cần đồng bộ qua mạng**.

**Thực thể** là một cá thể cụ thể lúc chạy. Cái rìu đá đang nằm trong túi bạn với độ bền còn 34 là một thực thể. Nó đổi liên tục, nên nó là thứ **cần đồng bộ qua mạng và cần lưu**.

**Mảnh** là một khía cạnh gắn thêm vào định nghĩa. Chế tạo được, mặc được, ăn được, dựng được — mỗi thứ là một mảnh.

Sức mạnh nằm ở chỗ **vai của mảnh là mở**. Ai cũng có thể định nghĩa một loại mảnh mới mà không cần xin phép ai, và không đụng vào định nghĩa hay thực thể. Agent làm hệ thống nấu ăn tạo mảnh "nấu được". Agent làm hệ thống nhân giống tạo mảnh "dùng làm thức ăn nhân giống". Hai agent không biết nhau và không cần biết nhau.

So sánh với cách làm thông thường — một struct vật phẩm khổng lồ có sẵn mọi trường, mỗi tính năng thêm vài trường vào — thì khác biệt rất rõ. Cách thông thường biến định nghĩa vật phẩm thành ngã tư đông nhất trong project. Cách mảnh thì biến nó thành một danh sách mà ai cũng chỉ thêm phần tử của mình.

Đây là ý tưởng tôi cho là đáng giá nhất trong toàn bộ Chương 7 đến Chương 10, và Paldark sẽ dùng nó không chỉ cho vật phẩm mà cho mọi thứ có nhiều biến thể: sinh vật, công trình, loại việc, hiệu ứng.

## 10.4 — Nhưng phải đọc bằng chứng cho đúng

Tôi không muốn chương này thành quảng cáo, nên nói rõ những gì bằng chứng **không** chứng minh.

**Nó không chứng minh rằng người ta chưa bao giờ phải sửa Lyra.** Cái ta quan sát được là ảnh chụp mã nguồn ở một thời điểm, không phải toàn bộ lịch sử. Có thể trong quá trình làm họ đã phải chỉnh gì đó rồi bỏ đi. Kết luận đúng và đủ là: **ở trạng thái cuối, mọi phần mở rộng đều nằm trong plugin.**

**Nó không chứng minh rằng modular là miễn phí.** 149 file C++ cho một hệ thống túi đồ là con số lớn. Một phần trong đó là cái giá của khuôn mẫu: mỗi khái niệm phải có đủ bộ định nghĩa, thực thể, mảnh, trình quản lý. Làm nhanh và bẩn thì ít file hơn nhiều.

**Nó không chứng minh rằng người mới làm được ngay.** Người làm plugin này rõ ràng đã trả xong học phí Lyra rồi mới mở rộng được. Chương 8 đã đo học phí đó.

**Và nó là phần mềm thương mại có giấy phép.** Ta học cách làm, không chép mã nguồn.

## 10.5 — Kết luận: cái gì đã được chứng minh

Gom lại ba chương 7, 8, 10 thì ta có thể phát biểu chắc chắn thế này:

1. Có tồn tại một kiến trúc cho phép người ngoài mở rộng một game lớn mà **không sửa lõi**. Đây là sự thật quan sát được, không phải lý thuyết.
2. Cơ chế làm được điều đó gồm ba thứ: **đóng gói thành plugin**, **gắn hành vi bằng component từ bên ngoài**, và **mở rộng bằng cách thêm mảnh dữ liệu**.
3. Cái giá là **học phí ban đầu cao** và **nhiều lớp trung gian**.
4. Còn một chỗ chưa ai giải cho ta: cấu hình nằm trong file nhị phân, không hợp với quy mô nghìn agent.

Điểm 1 đến 3 là nền của Paldark. Điểm 4 là chỗ Paldark phải tự đi.

Chương sau viết ra luật.

---

**Bằng chứng cho chương này.** Toàn bộ mô tả plugin `InventoryExtendedForLyra` là OBSERVED từ ảnh chụp mã nguồn trong `17.Hipernova-Lyra-Inventory/Source`: cấu trúc thư mục plugin, khai báo module runtime và các phụ thuộc, danh sách component và lớp mở rộng, các loại mảnh vật phẩm, và các lời gọi vào API Lyra. Hai con số 149 file C++ và khoảng 3.841 asset là đếm trực tiếp trên ảnh chụp đó. Khẳng định "thêm vật phẩm chế tạo được mà không sửa code" lấy từ tài liệu tổng hợp của khóa 17. Việc plugin chưa từng phải sửa Lyra trong suốt quá trình phát triển là UNKNOWN — không suy ra được từ ảnh chụp một thời điểm. Plugin là sản phẩm thương mại có giấy phép; tài liệu này chỉ phân tích cơ chế, không sao chép mã nguồn.
