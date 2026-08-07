# Chương 2 — Palworld có gì vui?

Bạn bắt được một con Pal vào buổi sáng. Đến chiều, nó không còn là một cái tên vừa sáng lên trong danh sách: nó đang đập đá ở căn cứ, đứng cạnh bạn trong một trận đánh, hoặc nằm trong quả cầu chờ lần ra ngoài tiếp theo. Chính quãng đường từ “vừa tìm thấy” đến “đang làm thay đổi cách mình chơi” khiến Palworld khác một game sưu tầm thông thường. Niềm vui không dừng ở việc có thêm một con; nó nằm ở chỗ thứ vừa sở hữu lập tức mở ra một khả năng mới.

Vì vậy, sáu nguồn vui dưới đây không phải sáu ô độc lập trong một bảng tính. Chúng giống sáu lực kéo móc vào nhau: sưu tầm tạo nguyên liệu cho tự động hóa, tự động hóa nuôi tiến bộ, tiến bộ lại mở đường cho chuyến đi kế tiếp. Một lực kéo biến mất thì các phần còn lại vẫn có thể chạy trong chốc lát, nhưng vòng lặp dài sẽ dần mất lực.

## Sáu nguồn vui

### 2.1 — Sưu tầm: gặp một thứ chưa có và biến nó thành của mình

Sưu tầm luôn bắt đầu bằng một khoảng trống: roster còn thiếu một con, vùng đất còn một nơi chưa tới, bảng dữ liệu còn một row chưa trở thành thực thể trong tay người chơi. Khoảng trống ấy kéo họ ra ngoài. Nhưng phần thưởng không chỉ là một hình ảnh mới; mỗi Pal có stat, passive, kỹ năng partner và work suitability khác nhau. `DT_PalMonsterParameter` được tài liệu mô tả có **663+ entries**, còn header nhân vật có các field combat, capture, speed, hunger, breeding và work. Con số này cho thấy collection có chiều rộng để tạo lựa chọn, chứ không chỉ có số lượng để lấp đầy album. (REFERENCE; EXTRACTED).

Điểm vui nhất đến khi người chơi thôi hỏi “con nào tốt hơn” theo nghĩa chung chung và bắt đầu hỏi “con nào giải được việc mình đang thiếu”. Con này chạy nhanh, con kia có skill chiến đấu, con khác có cấp độ việc vừa khớp với dây chuyền trong base. Từ đó, collection không còn là một album đứng riêng; nó trở thành đầu vào cho mọi quyết định tiếp theo.

### 2.2 — Tự động hóa: thứ mình bắt được tiếp tục có ích khi mình không cầm tay điều khiển

Khi một Pal được đưa về base, ý nghĩa của việc sưu tầm đổi hẳn: sinh vật hoang vừa bắt được trở thành một năng lực lao động cụ thể. Header `EPalWorkSuitability` có **13 loại việc**; character data lại có các field suitability tương ứng. Hợp đồng dữ liệu ở đây rất rõ: Pal không chỉ có sức mạnh, nó còn có khả năng vận hành một căn cứ. (EXTRACTED).

Từ đó xuất hiện một cảm giác rất riêng: rời căn cứ khi công việc còn dang dở, rồi quay về thấy một phần đã được làm. Nhưng phần thưởng ấy chỉ có giá trị nếu hệ thống đôi khi không chạy. Hết nguyên liệu, công trình đầy, thợ không phù hợp hoặc nhu cầu sinh tồn tụt xuống thì dây chuyền phải chậm lại. Nếu mọi thứ luôn hoàn hảo, người chơi không còn quản lý; họ chỉ bật một công tắc rồi quên nó đi.

### 2.3 — Tiến bộ: output hôm nay mở một khả năng mới ngày mai

Output của hôm nay chỉ thật sự đáng giá khi nó làm thay đổi ngày mai. Vì thế, tiến bộ không thể chỉ là một thanh level. Tài liệu DataTable ghi technology có **150+ nodes**, tier đầu có cost khoảng 1 point còn tier cao có thể lên 10 point; player level được mô tả từ 1 đến 55+, Pal khoảng 50. Những con số này tạo ra nhiều nhịp: mở khóa sớm để phản hồi nhanh, đồng thời chừa khoảng trống cho mục tiêu dài. (REFERENCE).

Tiến bộ có ý nghĩa khi nó quay lại thế giới. Một recipe mới cho phép dùng tài nguyên cũ theo cách mới; một công trình mới làm base chứa được nhiều hơn; một kỹ năng mới biến encounter trước đây thành encounter có thể thử. Nếu unlock chỉ mở menu mà không thay đổi cách chơi, người chơi có lý do để bấm nhưng không có lý do để nhớ.

### 2.4 — Khan hiếm: quyết định phải có giá

Nhưng tiến bộ chỉ thành lựa chọn khi người chơi không thể lấy mọi thứ cùng lúc. Khan hiếm làm cho cái giá ấy trở nên thật. Capture có `CaptureRateCorrect`; loot có rate/min/max; item có stack và weight; build object có cost và HP. Tài liệu DataTable còn dùng ví dụ Wood HP 500 và Metal HP 5000 để minh họa khoảng cách vật liệu. Đây là các núm cân bằng, không phải những con số trang trí. (REFERENCE).

Khan hiếm không có nghĩa là bắt người chơi chờ vô hạn. Nó có nghĩa là người chơi phải chọn: dùng nguyên liệu cho vũ khí hay cho căn cứ, đem Pal này đi bắt hay để nó làm việc, mở technology này trước hay giữ điểm cho technology khác. Khi lựa chọn đó có thể đảo ngược bằng một chuyến đi hoặc một cách chơi khác, scarcity tạo chiến lược thay vì tạo bực bội.

### 2.5 — Sáng tạo: cùng một nguồn lực nhưng có nhiều đường giải

Khi nguồn lực đã có giá, câu hỏi kế tiếp là người chơi được giải bài toán bằng bao nhiêu cách. Sáng tạo xuất hiện khi hệ thống không ép một tài nguyên chỉ có một công dụng. Một Pal có thể là người chiến đấu, worker, partner hoặc nguyên liệu cho một tiến trình khác; một item có thể đi vào recipe, equipment, shop hoặc building. Đây là kết luận từ quan hệ giữa các data contract, không phải claim rằng mọi item trong game đều có đủ các đường dùng. (INFERRED).

Sáng tạo cũng cần giới hạn. Nếu mọi thứ làm được mọi thứ, lựa chọn trở thành nhiễu. Những field như work suitability, item type, cost, weight và technology requirement là cách dữ liệu vẽ ranh giới cho sáng tạo: người chơi được thử trong một không gian có hình dạng.

### 2.6 — Xã hội: những gì mình xây ra có người khác nhìn thấy và dùng được

Cuối cùng, những lựa chọn ấy đổi nghĩa khi có người khác cùng nhìn thấy và sử dụng kết quả. Co-op làm cho base, roster và công trình không còn là nhật ký cá nhân. Một dây chuyền tự động hóa có thể giúp cả nhóm; một người đi bắt, người khác chuẩn bị vật liệu; một công trình trở thành điểm hẹn. Các nguồn đã khảo sát chưa đủ để xác nhận schema guild, quyền owner hay quy tắc chia save, nên phần “xã hội” ở đây là giá trị thiết kế suy ra từ co-op context, không phải mô tả một permission system cụ thể. (UNKNOWN ở mức runtime contract; INFERRED ở mức cảm giác).

Điều cần giữ là xã hội không nhất thiết phải bắt đầu bằng chat hay guild. Chỉ cần output của một người trở thành input hữu ích cho người khác, game đã có một lý do để phối hợp.

## Vòng lặp khóa sáu nguồn vui vào nhau

Sáu nguồn vui chỉ thành một game khi chúng khóa được vào cùng một chuyến chơi. Người chơi đi xa để gặp một Pal chưa có. Combat và capture khiến việc bắt không chắc chắn; khi thành công, Pal trở thành một instance có thể đưa vào party hoặc base. Ở base, work suitability biến nó thành năng lực sản xuất. Sản xuất tạo item và recipe mới. Technology mở công cụ để đi xa hơn hoặc xây tốt hơn. Chuyến đi kế tiếp đưa người chơi tới encounter khó hơn, nơi một Pal mới lại có giá trị.

```mermaid
flowchart LR
    A["Đi xa / gặp encounter"] --> B["Đánh và bắt Pal"]
    B --> C["Party hoặc worker"]
    C --> D["Tạo resource và item"]
    D --> E["Mở technology / xây base"]
    E --> F["Đi xa hơn, gặp thử thách mạnh hơn"]
    F --> A
    C --> G["Phối hợp với người chơi khác"]
    G --> E
```

Điểm giữ sơ đồ này chuyển động là quan hệ nhân quả: output của một bước không chỉ là phần thưởng kết thúc bước đó, mà còn là năng lực để bắt đầu bước kế tiếp. Capture cho collection. Collection cho utility. Utility cho production. Production cho progression. Progression trả lại exploration. Vì vậy, “bắt thú”, “xây base” và “craft” không thể được thiết kế như ba feature độc lập rồi ghép lại ở cuối.

## Vòng lặp đứt ở đâu?

Một vòng lặp nhìn kín trên sơ đồ vẫn có thể gãy khi chơi. Có ít nhất năm mối nối dễ đứt, và mỗi mối nối làm hỏng một loại kỳ vọng khác nhau.

**Đứt ở capture.** Nếu capture gần như luôn thành công, Pal không còn là phần thưởng đáng giành. Nếu capture quá khó mà người chơi không có cách cải thiện xác suất, thất bại không tạo chiến lược mà chỉ tạo phí thời gian.

**Đứt ở utility.** Nếu Pal bắt xong chỉ nằm trong party, người chơi không có lý do sưu tầm những con không đánh mạnh. Work suitability, partner skill và breeding là các đường phụ giữ collection có giá trị.

**Đứt ở production.** Nếu worker làm mọi thứ tự động mà không có giới hạn, base mất bài toán quản lý. Nếu worker không bao giờ tạo đủ output để cảm thấy khác biệt, automation thành một animation đẹp.

**Đứt ở progression.** Nếu technology mở khóa quá chậm, đầu game không có phản hồi; nếu mở tất cả quá nhanh, chuyến đi sau không còn mục tiêu. Nguyên tắc “first impression numbers matter most” và “leave room for upward mobility” trong tài liệu DataTable là hai cách chống đứt ở hai đầu nhịp tiến bộ. (REFERENCE).

**Đứt ở xã hội.** Nếu output của người chơi không giúp được ai khác, co-op chỉ còn là nhiều người đứng trong cùng một map. Nếu quyền sở hữu và save không rõ, phối hợp biến thành rủi ro mất tài sản. Schema guild/save chi tiết chưa có trong evidence hiện tại; đây là khoảng cần thiết kế riêng, không được giả vờ là đã biết. (UNKNOWN).

## Chống đứt bằng cách nào?

Khi thấy một mối nối yếu, phản xạ dễ nhất là thêm phần thưởng. Nhưng cách chống đứt bền hơn là tạo nhiều đường nối giữa cùng hai trạng thái. Pal không chỉ dùng để đánh; nó còn làm việc. Resource không chỉ để craft; nó còn dùng cho building, shop hoặc tiến trình. Technology không chỉ mở recipe; nó còn thay đổi khả năng khám phá. Khi một đường bị nghẽn, người chơi vẫn còn một đường khác để tiến.

Nhưng nhiều đường nối không có nghĩa là bỏ qua thất bại. Hệ thống phải cho người chơi nhìn thấy nguyên nhân: thiếu nguyên liệu, thiếu cấp độ việc, công trình đầy, capture rate thấp, hoặc technology chưa mở. Nếu game chỉ nói “không thể”, vòng lặp vẫn đứt dù dữ liệu phía sau đầy đủ.

Cuối cùng, mỗi nguồn vui cần giữ nhịp phản hồi riêng của nó. Sưu tầm trả lời ngay bằng encounter và capture result. Automation trả lời chậm bằng output khi quay về. Progression trả lời bằng unlock. Scarcity trả lời bằng lựa chọn. Creativity trả lời bằng build. Social trả lời bằng output được người khác nhìn thấy. Trộn tất cả thành một thanh điểm sẽ làm mất hình dạng của từng cảm giác. Chương 3 sẽ giữ nguyên sáu nhịp ấy nhưng đổi góc nhìn: từ vòng lặp cảm xúc sang một catalog đủ cụ thể để biết từng tính năng đang phục vụ mắt xích nào.

---

**Bằng chứng cho chương này.** `DT_PalMonsterParameter` 663+ entries và 13 work suitability values là REFERENCE/EXTRACTED từ `Documents/Book/Palworld_Whitepaper/C01-Pal-Va-Stats.md` và source header. Technology 150+, tier cost 1→10, player level 1–55+ và Pal khoảng 50 lấy từ `C09-Progression.md` và `02.Palworld/Documents/11-Palworld DataTable Architecture/07-Progression and Special System Tables.txt`. Drop tám slot lấy từ `C12-Encounter-Dungeon-Boss.md`. WorkOutput 300s→60s, Wood 500/Metal 5000 và các nguyên tắc tuning lấy từ `C15-So-Hoc-Game-Design.md`. Vòng lặp và sáu nguồn vui là INFERRED; schema guild, permission và save co-op chi tiết vẫn UNKNOWN.
