# Chương 20 — Nền, và cách đọc Quyển 4

Ba quyển vừa rồi giống như lúc chúng ta đứng quanh một chiếc bàn, trải bản đồ game ra và thống nhất cách làm việc: game này vui ở đâu, vì sao codebase vỡ khi quá nhiều người cùng chạm vào, và bộ khung nào giữ các phần không giẫm lên nhau. Sang Quyển 4, chúng ta rời chiếc bàn đó. Việc còn lại là **dùng bộ khung ấy để dựng lại từng hệ thống của Palworld**, theo một thứ tự mà sau mỗi bước đều có thêm thứ chơi được.

Hãy hình dung buổi đầu tiên của dự án. Một agent muốn làm combat, một agent khác muốn làm inventory, người thứ ba đã nghĩ tới save. Nếu cả ba chỉ nhận tên hệ thống, họ sẽ tự lấp phần còn thiếu bằng ba cách khác nhau. Vì vậy mười lăm chương sau không chỉ liệt kê thứ cần code. Chúng cùng đi qua một khuôn hỏi–đáp, từ cảm giác người chơi tới state, authority, contract và bằng chứng chạy thật. Chương này giới thiệu khuôn đó, rồi dùng chính nó để xác định phần nền phải có trước khi mọi người tách ra làm việc.

## 20.1 — Khuôn của mỗi chương

Mỗi chương từ 21 tới 35 có bảy mục, luôn theo thứ tự này. Thứ tự ấy cố ý đi từ điều người chơi nhận ra tới điều codebase phải bảo đảm:

**1. Vì sao hệ thống này tồn tại.** Bắt đầu từ cảm giác của người chơi, không bắt đầu từ kỹ thuật. Nếu không viết được mục này thì hệ thống đó không đáng làm — và đây không phải câu nói cho đẹp, đã có vài mục trong catalog ở Chương 3 bị bỏ chính vì viết mục này ra thì thấy rỗng.

**2. Nó chạm những gì trong catalog.** Danh sách mã `F-xxx` mà chương này hiện thực. Đây là sợi dây nối ngược lên Quyển 1, để không có tính năng nào rơi giữa đường và không có code nào sinh ra mà không phục vụ tính năng nào.

**3. Trạng thái và chủ sở hữu.** Bảng: mẩu trạng thái nào, ai làm chủ, ai được đọc, người ngoài đổi nó bằng yêu cầu gì. Đây là dòng sẽ được thêm vào danh mục quyền ghi ở Chương 12.

**4. Hợp đồng dữ liệu.** Loại mảnh mà hệ thống này định nghĩa, hình dạng dữ liệu, ví dụ một file cấu hình đã điền. Theo đúng khuôn ở Chương 14.

**5. Giao diện lập trình.** Các component, hàm chính với đầu vào và đầu ra rõ ràng, kênh thông điệp phát ra và nghe vào. Thân hàm chỉ ghi việc cần làm, không viết chi tiết — theo đúng phạm vi giai đoạn này.

**6. Quyền hạn và đồng bộ.** Cái gì server quyết, cái gì client được tự làm, cái gì cần đồng bộ, cái gì chỉ là hình ảnh.

**7. Log, lệnh kiểm tra, và cách biết là chạy đúng.** Theo khuôn ở Chương 18: mỗi hệ thống phải có cách dựng trạng thái, cách quan sát trạng thái, và cách kích hoạt hành vi từ console.

Bảy mục này không phải một bản mẫu hành chính. Chúng là một đường suy luận. Cảm giác cho biết vì sao hệ thống đáng tồn tại; catalog giữ nó trong phạm vi đã hứa; ownership chỉ ra nơi sự thật nằm; data và API cho các feature khác một cách dùng mà không xâm nhập; authority ngăn hai máy tạo hai sự thật; còn log/test cho chúng ta biết tất cả những điều vừa nói có xảy ra thật hay không.

Nếu trả lời được cả bảy câu, một agent khác có thể đọc xong rồi bắt tay vào việc mà không cần đoán ý tác giả. Nếu bỏ một câu, chỗ trống đó không biến mất: nó chỉ được lấp bằng phỏng đoán trong code. Và mỗi lần hai agent lấp cùng một chỗ trống theo hai cách khác nhau, chúng ta lại có đúng kiểu codebase mà ba quyển đầu cố tránh.

## 20.2 — Thứ tự dựng, và vì sao là thứ tự đó

Mười lăm chương không xếp theo mức độ quan trọng, mà theo **thứ tự có thể chơi được**. Ta bắt đầu bằng một nhân vật đi được, rồi cho họ nhặt một thứ, giữ nó, biến nó thành thứ khác, dùng nó trong chiến đấu, và cứ thế mở dần vòng chơi. Nguyên tắc rất đơn giản: sau mỗi chương phải có thêm một thứ bấm được và nhìn thấy được.

Đây là cách thầy Ulibarri xếp bài trong các khóa của ông — không dạy hết lý thuyết rồi mới làm, mà mỗi phần kết thúc bằng một thứ chạy được, và phần sau dùng lại thứ đó. Ta mượn nguyên cách xếp này, vì với một nghìn agent nó còn có thêm một lợi ích: **mỗi chương là một mốc tích hợp**, chỗ để phát hiện các mảnh ghép có khớp không, thay vì để dồn tới cuối.

| Chương | Hệ thống | Sau chương này thì chơi được cái gì |
|---|---|---|
| 21 | Di chuyển và input | Đi lại được trong một bản đồ |
| 22 | Tương tác và thu thập | Nhặt được thứ gì đó |
| 23 | Vật phẩm và túi đồ | Giữ và quản lý được thứ nhặt được |
| 24 | Chế tạo | Biến vật phẩm thành vật phẩm khác |
| 25 | Chiến đấu | Đánh và bị đánh |
| 26 | Bắt giữ | Biến sinh vật thành tài sản |
| 27 | Bạn đồng hành | Sinh vật đi cùng và có ích |
| 28 | Xây dựng | Dựng công trình |
| 29 | Làm việc và tự động hóa | Sinh vật tự làm việc ở căn cứ |
| 30 | Tiến trình và công nghệ | Mở khóa thứ mới |
| 31 | Thế giới và sinh sản | Thế giới có nhịp và tự làm đầy lại |
| 32 | Hang động và trùm | Thử thách có kết thúc |
| 33 | Lưu trữ | Chơi tiếp được vào hôm sau |
| 34 | Nhiều người chơi | Chơi cùng nhau |
| 35 | Nhân giống và kinh tế | Vòng lặp dài hạn |

Nhìn riêng từng hàng, bảng trên có vẻ chỉ là một kế hoạch thi công. Nhìn theo cột cuối, nó là một chuỗi nhân–quả: mỗi năng lực mới tiêu thụ kết quả của năng lực trước và chuẩn bị đầu vào cho năng lực sau. Ba chỗ trong chuỗi này đáng giải thích, vì nếu không nói thì thứ tự sẽ có vẻ tùy tiện:

**Vì sao túi đồ trước chiến đấu.** Vì chiến đấu cần vũ khí, vũ khí là vật phẩm, và vật phẩm cần chỗ để chứa. Làm ngược lại thì chiến đấu phải tự dựng một cách giữ vũ khí tạm bợ, rồi bỏ đi khi túi đồ xong. Đây đúng là loại công việc phải làm lại mà ta đang muốn giảm.

**Vì sao bắt giữ sau chiến đấu.** Vì bắt giữ đọc máu hiện tại của mục tiêu để tính xác suất. Không có hệ chỉ số thì bắt giữ không có đầu vào.

**Vì sao lưu trữ đứng ở chương 33 chứ không phải chương 21.** Đây là chỗ dễ gây tranh cãi nhất. Lập luận ngược lại — làm lưu trữ sớm — nghe rất hợp lý: càng để muộn càng phải sửa nhiều hệ thống.

Tôi vẫn xếp nó ở 33, và lý do là: **luật ở Chương 14 đã làm cho lưu trữ không còn là việc phải sửa hệ thống khác.** Mỗi tính năng khai báo khối lưu riêng, có phiên bản riêng, thiếu khối là hợp lệ. Nên thêm lưu trữ cho một hệ thống chỉ là thêm một khối vào chính hệ thống đó. Nếu điều này hóa ra sai khi triển khai thật, thì đó là bằng chứng luật ở Chương 14 chưa đủ, và nên sửa luật chứ không nên đổi thứ tự chương.

Ghi lại đây như một giả định cần kiểm chứng.

## 20.3 — Nền là gì

Phần còn lại của chương này là hệ thống nền — thứ tồn tại trước mọi tính năng và không thuộc về tính năng nào. Nó chính là bốn module khung ở Chương 13.

Người chơi không bao giờ vui vì một registry được khởi tạo đúng hay vì hai plugin trao đổi qua message bus. Nhưng họ sẽ cảm nhận ngay hậu quả nếu những thứ đó sai: item vừa nhặt không được crafting nhận ra, Pal vừa bắt không xuất hiện trong party, hoặc save dựng lại một identity khác. Vì vậy nền không có mục “vì sao tồn tại” theo nghĩa một cảm giác riêng. Lý do của nó là **để mười lăm chương sau đều bắt đầu từ cùng một chỗ và ghép được vào cùng một trò chơi.**

### Nền phải cung cấp gì

Sáu thứ, và mỗi thứ đều đã được biện luận ở một chương trước:

| Thứ | Ở module nào | Vì sao cần | Chương biện luận |
|---|---|---|---|
| Kiểu định danh và các struct yêu cầu | Core | Để các tính năng nói về cùng một thứ mà không include nhau | 12, 14 |
| Khung thông điệp | Core | Đường giao tiếp duy nhất giữa các tính năng | 7, 11 |
| Khung đăng ký | Core | Để tự đăng ký mà không sửa file chung | 15 |
| Mô hình định nghĩa – mảnh – thực thể | Data | Mở rộng bằng thêm file | 14 |
| Lớp nền đóng băng và cỗ máy gắn component | Runtime | Để không ai phải sửa lớp cơ sở | 11 (L3) |
| Khung lưu trữ theo khối | Persistence | Để mỗi tính năng lưu phần của mình | 14 |

Không có gì trong bảng này là mới. Điều mới là nhìn sáu hàng ấy như một cửa hẹp mà cả dự án phải đi qua. Đây là **phần duy nhất trong cả dự án không song song hóa được**: nếu kiểu định danh, đường giao tiếp hay cách đăng ký còn đổi dưới chân, một nghìn agent chưa thật sự làm song song; họ chỉ đang tạo ra một nghìn nhánh sẽ phải ghép lại sau.

Điều đó làm nền trở thành đường găng. Nên nguyên tắc: **nền phải nhỏ nhất có thể mà vẫn đủ.** Mọi thứ có thể để lại cho tính năng thì để lại. Mỗi thứ thêm vào nền là một tuần cả nghìn người phải chờ, và là một thứ cả nghìn người phải sống chung sau đó.

### Bài kiểm tra để biết nền đã xong

Ta không thể tuyên bố nền xong chỉ vì bốn module compile. Bài kiểm tra có ý nghĩa hơn là thử đứng từ phía một feature hoàn toàn mới. Nền xong khi và chỉ khi feature đó làm được ba việc sau mà không sửa một dòng nào của bốn module khung:

1. Tạo một plugin tính năng rỗng, khai báo nó, và thấy nó được nạp.
2. Tính năng đó gắn được một component vào nhân vật, component đó đọc được một định nghĩa từ file văn bản của chính nó.
3. Tính năng đó phát một thông điệp, và một tính năng thứ hai — không hề biết tên tính năng thứ nhất — nghe được.

Ba việc này chính là ba khuôn mẫu ở Chương 6 được kiểm chứng bằng cách chạy thật. Nếu cả ba chạy, bộ khung đã chứng minh được đường đi tối thiểu từ data tới runtime rồi sang feature khác. Nếu một trong ba đòi phải sửa module khung, ta chưa xong; cho mọi người bắt đầu lúc đó chỉ biến một thay đổi nền thành hàng loạt sửa ngược.

Đây cũng sẽ là nội dung của lát cắt đầu tiên trong `PaldarkKit`.

## 20.4 — Điều cần nói trước khi vào mười lăm chương

Trước khi bước vào hệ thống đầu tiên, cần phân biệt thứ tự kể chuyện với thứ tự triển khai đã được bằng chứng thực tế điều chỉnh. Chương 33 — Lưu trữ được đọc
trước Chương 31 — Thế giới và Chương 32 — Hang động và trùm. Sau Chương 30 đã
có chín hệ thống giữ state; nếu đóng game trước khi có generation, codec và
recovery thì state mất sạch. Vì vậy bản đồ đọc hiện tại là `21–30 → 33 → 31–32
→ 34–35`. Đây là thay đổi thứ tự triển khai có chủ ý, không thay đổi
ownership: Persistence vẫn chỉ orchestration/verification, còn mỗi feature tự
sở hữu chunk và codec của mình.

Ngoài điều chỉnh ấy, có hai nguyên tắc đọc cần giữ trong suốt quyển này.

**Thứ nhất, các chương sau mô tả hợp đồng, không mô tả cách hiện thực.** Chúng nói hệ thống nhận gì, trả gì, làm chủ trạng thái nào, phát thông điệp nào. Chúng không nói thuật toán bên trong. Đó là chủ ý: hợp đồng là thứ phải thống nhất giữa nhiều người, thuật toán là việc riêng của người làm. Ép sẵn thuật toán vào tài liệu vừa thừa vừa làm mất quyền chọn của người triển khai.

**Thứ hai, số liệu Palworld được dùng để hiểu hình dạng, không để chép.** Khi một chương nhắc tới mười ba loại việc hay tám ô rơi đồ, đó là để thấy **hình dạng của bài toán** — bao nhiêu chiều, bao nhiêu nhánh, độ phức tạp cỡ nào. Giá trị cân bằng thật của Paldark sẽ do chính dự án chọn. Ta học cấu trúc, không sao chép nội dung.

Với nền và cách đọc đã rõ, ta có thể bắt đầu ở nơi người chơi bắt đầu: một cơ thể đứng trong thế giới, nhận input và phản hồi đủ đáng tin để mọi hành động sau đó có chỗ bám vào.

---

**Bằng chứng cho chương này.** Khuôn bảy mục và thứ tự mười lăm chương là thiết kế của tài liệu này (INFERRED), dựa trên bản đồ hệ thống ở Chương 5 và các luật ở Chương 11. Nguyên tắc xếp bài sao cho sau mỗi phần đều có thứ chạy được là OBSERVED từ cấu trúc các khóa của Stephen Ulibarri trong repo, rõ nhất ở khóa 11 với 33 phần được xếp theo năng lực tích lũy dần. Danh sách sáu thành phần của nền suy ra từ Chương 13 và 14. Giả định rằng đặt lưu trữ ở chương 33 không gây phải sửa lại các hệ thống trước là chưa kiểm chứng, đã ghi rõ trong mục 20.2 như một điểm cần xác nhận khi triển khai.
