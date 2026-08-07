# Chương 6 — Vì sao codebase vỡ ra khi đông người cùng code

Cho tới hết Quyển 1, chúng ta đã biết Palworld gồm những gì và mỗi hệ thống giữ trạng thái nào. Bình thường bước tiếp theo sẽ là mở editor lên và bắt đầu code. Nhưng project này có một ràng buộc mà hầu hết tài liệu thiết kế game không có: **không phải một người code, mà rất nhiều agent cùng code song song.**

Ràng buộc đó thay đổi hoàn toàn bài toán kiến trúc. Và trước khi bàn Lyra hay bất cứ framework nào, ta phải hiểu chính xác cái gì hỏng khi đông người. Nếu không hiểu, ta sẽ bê nguyên Lyra về, chịu toàn bộ chi phí của nó, mà vẫn vỡ.

Chương này chỉ làm một việc: mổ xẻ nguyên nhân. Chương 7 mới xem Lyra chữa được bao nhiêu phần trong số đó.

## 6.1 — Thí nghiệm tưởng tượng: mười agent, một tuần

Giả sử ta giao mười công việc song song, mỗi agent một việc, đều thuộc Palworld:

| Agent | Việc |
|---|---|
| A1 | Thêm hệ thống đói cho sinh vật |
| A2 | Thêm loại việc "tưới cây" cho thợ |
| A3 | Thêm vũ khí cung |
| A4 | Thêm ô trang bị lưng (đeo dù lượn) |
| A5 | Thêm hầm ngục băng |
| A6 | Thêm màn hình cây công nghệ |
| A7 | Thêm hiệu ứng bỏng do hệ lửa |
| A8 | Thêm chuồng nuôi và trứng |
| A9 | Thêm cửa hàng NPC |
| A10 | Thêm chỉ số thể lực khi leo trèo |

Mười việc này nghe rất độc lập. Trên thực tế, nếu codebase tổ chức theo kiểu thông thường, cuối tuần ta sẽ nhận về mười nhánh không ghép được. Hãy xem chúng đâm vào nhau ở đâu.

**Va chạm 1 — `.uproject` và các file build.** A3 cần module vũ khí, A6 cần module UI. Cả hai cùng sửa danh sách module trong descriptor và cùng thêm dependency vào `Build.cs`. Hai dòng thêm vào cùng một mảng JSON, cùng vị trí. Git báo conflict. Đây là conflict *cơ học*, dễ sửa, nhưng nó xảy ra với **mọi** agent thêm module — tần suất cao.

**Va chạm 2 — enum dùng chung.** A2 thêm `Watering` vào `EWorkKind`. A8 thêm `Breeding`. Cả hai sửa cùng một enum, trong cùng một file. Ghép lại thì có thể tự merge được, nhưng nếu ai đó lỡ chèn giá trị vào giữa thay vì cuối, mọi dữ liệu đã lưu theo chỉ số enum sẽ lệch — và không có lỗi biên dịch nào báo cho bạn biết. Đây là conflict *ngữ nghĩa*, nguy hiểm hơn nhiều.

**Va chạm 3 — lớp cơ sở phình ra.** A1 muốn sinh vật có chỉ số đói, A10 muốn nhân vật có thể lực, A7 muốn cả hai chịu được hiệu ứng bỏng. Cách nhanh nhất với từng agent là mở lớp nhân vật cơ sở ra và thêm biến. Mười agent làm vậy thì lớp cơ sở có thêm mười biến, mười `#include`, và mọi agent đều đã sửa cùng một file. File đó trở thành nút thắt cổ chai: **ai cũng phải đi qua, nên ai cũng đụng nhau.**

**Va chạm 4 — tham chiếu trực tiếp giữa các tính năng.** A9 làm cửa hàng, cần biết người chơi có bao nhiêu tiền, nên `#include` header túi đồ. A4 làm ô trang bị, cũng `#include` header túi đồ. Bây giờ tính năng túi đồ có hai người phụ thuộc vào nó. Nếu chủ của túi đồ đổi chữ ký một hàm, hai tính năng kia gãy. Nhân lên với hàng trăm tính năng, ta có một đồ thị phụ thuộc mà **không ai nhìn thấy toàn cảnh**, và mỗi thay đổi nhỏ đều có bán kính ảnh hưởng không đoán trước được.

**Va chạm 5 — tài sản nhị phân.** A6 làm màn hình cây công nghệ bằng Blueprint widget. A4 cũng sửa HUD để hiện ô trang bị mới. Cả hai đụng file `.uasset` của HUD. File `.uasset` là nhị phân — Git **không merge được**. Một trong hai người phải làm lại từ đầu. Không có công cụ nào cứu được; đây là mất trắng công sức.

**Va chạm 6 — trùng khái niệm.** A3 làm cung nên tạo một struct mô tả "sát thương theo hệ". A7 làm hiệu ứng bỏng nên cũng tạo một struct mô tả "sát thương theo hệ". Hai struct tên khác nhau, nội dung gần giống nhau, không tương thích. Không có conflict nào trong Git cả — code ghép vào vẫn biên dịch ngon lành. Nhưng codebase giờ có hai chân lý cho cùng một khái niệm, và ba tháng sau sẽ có người sửa một cái mà quên cái kia.

**Va chạm 7 — cùng ghi vào một trạng thái.** A1 cho chỉ số đói giảm dần rồi trừ máu khi đói lả. A7 cho hiệu ứng bỏng trừ máu theo thời gian. Hai agent, hai đường ghi khác nhau vào cùng một biến máu, không ai biết ai. Kết quả: có lúc con vật chết mà không rõ do đâu, và log của cả hai đều nói "tôi không làm gì sai".

Bảy va chạm này không phải bảy vấn đề rời rạc. Nhìn kỹ thì chúng quy về **hai nguyên nhân gốc**.

## 6.2 — Hai nguyên nhân gốc

**Nguyên nhân thứ nhất: file dùng chung có thể sửa.**

Va chạm 1, 2, 3, 5 đều cùng một dạng — tồn tại một file mà nhiều tính năng đều phải sửa để hoàn thành việc của mình. Descriptor project, enum tập trung, lớp cơ sở, asset HUD, file `.ini` khai báo tag, bảng dữ liệu nhị phân: tất cả đều là "ngã tư".

Ở đây có một quy luật rất máy móc: **xác suất đụng độ tỉ lệ với số agent nhân với số ngã tư mà mỗi agent phải đi qua.** Muốn giảm đụng độ, chỉ có hai cách — giảm số agent (không phải thứ ta muốn), hoặc giảm số ngã tư. Toàn bộ Quyển 3 của tài liệu này thực chất là danh sách các thủ thuật để xóa từng ngã tư một.

**Nguyên nhân thứ hai: tham chiếu trực tiếp giữa hai tính năng.**

Va chạm 4, 6, 7 là dạng này. Khi tính năng A gọi thẳng vào tính năng B, ta tạo ra một sợi dây. Sợi dây đó buộc hai agent phải hiểu nhau, phải đồng bộ thời điểm, và phải cùng biết một chi tiết triển khai. Với hai tính năng thì không sao. Với `n` tính năng thì số sợi dây tối đa là `n×(n-1)/2` — với 50 tính năng là 1.225 sợi dây tiềm năng.

Con số đó là lý do vì sao "cứ code rồi tính sau" hoạt động tốt với một người và sụp đổ với một trăm người. Một người giữ được cả đồ thị trong đầu. Một trăm người thì không ai giữ nổi, kể cả khi mỗi người đều giỏi.

> **Ghi nhớ.** Kẻ thù của làm việc song song không phải là code dở. Kẻ thù là **file dùng chung** và **tham chiếu trực tiếp**. Mọi luật kiến trúc trong tài liệu này đều sinh ra từ việc tiêu diệt hai thứ đó.

## 6.3 — Vì sao "chia module cho gọn" không đủ

Phản xạ đầu tiên của hầu hết chúng ta là: chia code thành nhiều module, mỗi người một module, thế là xong.

Chia module giải quyết được nguyên nhân thứ nhất một phần — mỗi agent có thư mục riêng, không đụng file của nhau. Nhưng nó **không giải quyết được nguyên nhân thứ hai chút nào**. Module A vẫn có thể `#include` header của module B, chỉ cần khai báo dependency trong `Build.cs`. Thậm chí việc chia module còn tạo thêm một ngã tư mới: file khai báo dependency.

Có một cái bẫy tinh vi hơn. Khi bạn chia module rồi cho phép chúng phụ thuộc lẫn nhau, bạn không hề giảm độ rối — bạn chỉ **làm cho nó trông có tổ chức hơn**. Đồ thị phụ thuộc vẫn nguyên đó, chỉ là giờ nó nằm ở tầng module thay vì tầng file, và mỗi cạnh giờ nặng hơn vì kéo theo cả thời gian biên dịch.

Vậy nên câu hỏi đúng không phải "chia module thế nào" mà là: **hai tính năng cần phối hợp với nhau thì làm sao phối hợp mà không cần biết nhau?**

Đó chính xác là câu hỏi mà Lyra và UEFN trả lời, và là nội dung của hai chương tiếp theo.

## 6.4 — Ba cách để hai tính năng nói chuyện mà không cần biết nhau

Trước khi sang Lyra, tôi muốn bạn nắm ba khuôn mẫu này ở dạng thuần túy, không dính engine. Nhận ra chúng rồi thì phần lớn Lyra sẽ tự sáng ra, vì Lyra chỉ là ba khuôn mẫu này được đóng gói kỹ.

**Khuôn mẫu 1 — Nói qua một danh từ chung, không qua một cái tên cụ thể.**

Thay vì "gọi hàm `UInventoryComponent::AddItem`", ta nói "phát đi một sự kiện mang nhãn `Item.Acquired`". Bên nào quan tâm thì tự đăng ký nghe. Người phát không biết ai nghe; người nghe không biết ai phát. Sợi dây trực tiếp biến mất, thay bằng một **danh từ chung** mà cả hai cùng hiểu.

Cái giá phải trả: bạn mất khả năng nhìn code mà biết ai gọi ai. Đổi lại bạn được quyền thêm người nghe mới mà không sửa dòng nào ở phía người phát. Với một trăm agent, đây là đánh đổi rất đáng.

**Khuôn mẫu 2 — Gắn thêm hành vi từ bên ngoài, thay vì sửa lớp cơ sở.**

Thay vì mở lớp nhân vật ra thêm biến "độ đói", ta viết một component "độ đói" hoàn toàn riêng, rồi **gắn nó vào nhân vật lúc chạy**, bằng cấu hình chứ không bằng code trong lớp nhân vật. Lớp cơ sở không đổi một dòng. Mười agent thêm mười thứ khác nhau thì có mười file mới và không có file nào bị sửa chung.

Đây là cách xóa ngã tư "lớp cơ sở" — cái ngã tư đông đúc nhất trong mọi project game.

**Khuôn mẫu 3 — Mở rộng bằng cách thêm dữ liệu, không phải thêm nhánh code.**

Thay vì `enum EWorkKind` mà ai cũng phải sửa, ta để mỗi loại việc là **một mẩu dữ liệu tự đăng ký**: một tag, hoặc một data asset nằm trong thư mục của chính agent đó, được hệ thống quét lên lúc khởi động. Thêm loại việc mới = thêm một file mới. Không sửa file nào của ai.

Cùng nguyên tắc đó áp cho: danh sách vật phẩm, danh sách công thức chế tạo, danh sách kỹ năng, bảng tương khắc hệ. Mọi chỗ mà bạn định viết `switch` hoặc `enum`, hãy hỏi: cái này có thể là dữ liệu tự đăng ký được không?

## 6.5 — Kiểm tra lại bằng chính mười việc ban đầu

Áp ba khuôn mẫu vào bảng ở đầu chương:

| Va chạm | Khuôn mẫu chữa | Sau khi chữa thì agent làm gì |
|---|---|---|
| Sửa `EWorkKind` | 3 | A2 thêm một data asset "tưới cây" trong thư mục của mình |
| Thêm biến vào lớp nhân vật | 2 | A1 viết component đói riêng, khai báo gắn vào sinh vật bằng cấu hình |
| Cửa hàng `#include` túi đồ | 1 | A9 hỏi số dư bằng một truy vấn có nhãn, không gọi thẳng lớp túi đồ |
| Hai người sửa HUD | 2 + 3 | Mỗi người khai báo widget của mình xin một "chỗ" trên HUD theo nhãn |
| Hai struct sát thương trùng nhau | — | *Không khuôn mẫu nào chữa được* |
| Hai đường cùng trừ máu | — | *Không khuôn mẫu nào chữa được* |

Hai dòng cuối rất quan trọng, nên tôi để nguyên chứ không giấu đi.

Ba khuôn mẫu kỹ thuật xử lý được va chạm *cơ học*. Chúng **không** xử lý được va chạm *ngữ nghĩa*: hai agent nghĩ ra hai khái niệm trùng nhau, hoặc hai agent cùng cho mình quyền thay đổi một trạng thái. Không có mẹo lập trình nào ngăn được điều đó, vì về bản chất đây không phải vấn đề code — đây là vấn đề **thỏa thuận**.

Thỏa thuận thì cần hai thứ: một nơi ghi thỏa thuận (danh mục khái niệm và danh mục quyền ghi — Chương 12), và một cái máy kiểm tra xem có ai vi phạm không (Chương 19). Con người thì đọc tài liệu rồi quên; máy thì không. Đây cũng là lý do vì sao tài liệu này coi bộ script kiểm tra trong `scripts/ci/` là một phần của kiến trúc chứ không phải phụ kiện.

## 6.6 — Tóm lại chương này

- Đông người code không hỏng vì trình độ, mà hỏng vì **chi phí phối hợp**.
- Chi phí phối hợp đến từ **file dùng chung** và **tham chiếu trực tiếp**.
- Chia module chỉ chữa được vế đầu, và chữa không triệt để.
- Có ba khuôn mẫu chữa vế sau: **nói qua nhãn chung**, **gắn hành vi từ ngoài vào**, **mở rộng bằng dữ liệu tự đăng ký**.
- Ba khuôn mẫu đó không chữa được va chạm ngữ nghĩa; phần đó cần danh mục thỏa thuận và một cái máy canh gác.

Chương sau ta sẽ mở Lyra ra và soi từng trụ của nó — nhưng không học Lyra như học một framework. Ta sẽ hỏi đúng một câu với từng trụ: *cái này đang chữa va chạm nào trong bảy va chạm ở trên, và nó lấy của ta bao nhiêu tiền?*

---

**Bằng chứng cho chương này.** Mười đầu việc và bảy va chạm là ví dụ dựng để minh họa, không phải trích từ lịch sử commit của repo (INFERRED). Các cơ chế được nhắc tới ở 6.4 đều có bản triển khai thật trong Lyra và sẽ được dẫn nguồn cụ thể ở Chương 7. Việc `.uasset` là định dạng nhị phân không merge được là thuộc tính của Unreal Engine, không phải quan sát riêng của project này. Sự tồn tại của bộ script kiểm tra tại `scripts/ci/` là quan sát trực tiếp trên repo (OBSERVED).
