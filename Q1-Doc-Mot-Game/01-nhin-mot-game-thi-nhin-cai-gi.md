# Chương 1 — Nhìn một game thì nhìn cái gì trước?

Bạn mở Palworld lên lần đầu. Nhân vật rơi xuống một bãi cỏ, xung quanh là mấy con thú nhỏ đang đi lang thang. Bạn nhặt vài cành cây, đấm một tảng đá, ném quả cầu bắt được một con, rồi thấy nó lẽo đẽo chạy theo mình. Không có khoảnh khắc nào tự tuyên bố rằng “game bắt đầu từ đây”, vậy mà ba mươi phút sau bạn vẫn còn ngồi đó.

Câu hỏi đầu tiên của người làm game không phải "họ code cái này thế nào", mà là: **ba mươi phút đó, cái gì đã giữ bạn lại?**

Nếu trả lời được câu đó, bạn biết mình phải xây gì. Nếu không trả lời được, bạn sẽ đi chép từng tính năng một, chép xong thì có một cái vỏ giống hệt mà chơi vào thấy nhạt — và bạn sẽ không hiểu vì sao nhạt.

## Đi ngược từ cảm giác, không đi xuôi từ tính năng

Cách sai — và cũng là cách tự nhiên nhất trong lần đầu — là mở game ra, ghi một danh sách: có inventory, có crafting, có bắt thú, có xây nhà, có combat. Sau đó ta code từ trên xuống như đang hoàn thành một bảng việc. Vấn đề là danh sách tính năng **không nói cho bạn biết cái nào quan trọng**. Trên giấy, “có inventory” và “con thú chạy theo mình” trông ngang nhau. Nhưng bỏ inventory đi, game vẫn còn chơi được; bỏ con thú chạy theo mình đi, Palworld không còn là Palworld.

Cách đúng là đi ngược. Bắt đầu từ khoảnh khắc bạn thấy vui, rồi hỏi ngược lên: khoảnh khắc đó được tạo ra bởi cái gì?

Hãy thử đi ngược ngay từ ví dụ trên. Khoảnh khắc vui là **con thú vừa đánh nhau với mình xong giờ đi theo mình**. Vì sao nó vui? Vì một sự chuyển đổi trạng thái rất mạnh vừa xảy ra: thứ vừa nãy còn là mối đe dọa, bây giờ đã thành tài sản của mình. Đó là cảm giác “chiếm hữu”. Từ đây câu hỏi mới chuyển sang kỹ thuật: để cảm giác ấy tồn tại, hệ thống bắt buộc phải làm được gì?

- Con thú phải **từng nguy hiểm thật** — nếu nó vô hại thì bắt được chẳng sướng. Cần một hệ chiến đấu đủ có răng.
- Việc bắt phải **có thể trượt** — nếu bắt là chắc chắn thành công thì không có cảm giác được thưởng. Cần xác suất, và xác suất phải người chơi tác động được (đánh cho nó yếu đi thì dễ bắt hơn).
- Sau khi bắt, nó phải **còn đó** — không biến thành một dòng chữ trong túi đồ. Cần một thực thể sống, có tên, có chỉ số, tồn tại qua các phiên chơi.
- Và nó phải **làm được việc gì đó** — nếu bắt xong để đấy thì cảm giác chiếm hữu tắt sau năm phút. Cần một chỗ để con thú đó có ích: đánh nhau cùng mình, hoặc làm việc cho mình.

Bốn gạch đầu dòng ấy nhìn giống một danh sách tính năng, nhưng bản chất khác hẳn. Chúng là **những điều bắt buộc phải đúng để cảm giác kia tồn tại**; vì vậy, chúng mới là yêu cầu thật. Đặc biệt, dòng cuối — “nó phải làm được việc gì đó” — kéo cả nửa còn lại của Palworld vào cuộc: base building và automation. Hai phần ấy không phải những món đồ rời được gắn thêm cho nhiều nội dung. Chúng là **hệ quả bắt buộc** của quyết định cho người chơi bắt thú.

Đây là điều mà một danh sách tính năng không bao giờ nói cho bạn biết.

## Ba tầng câu hỏi

Cho gọn, tôi dùng ba tầng này mỗi khi nhìn một game mới. Bạn sẽ thấy nó lặp lại suốt cả bộ tài liệu này.

**Tầng 1 — Cảm giác.** Người chơi thấy gì? Không phải “người chơi làm gì”, mà là “người chơi *thấy thế nào*”. Sướng, tiếc, hồi hộp, tự hào, ngứa tay muốn thử lại. Ở tầng này chưa có chữ nào là kỹ thuật.

**Tầng 2 — Điều kiện.** Để cảm giác đó xảy ra, điều gì bắt buộc phải đúng? Muốn có cảm giác “suýt chết”, máu phải nhìn thấy được và phải có lúc xuống thấp thật. Muốn có cảm giác “của mình”, vật phải bền vững qua thời gian. Chưa có class hay component ở đây, nhưng ràng buộc kỹ thuật đã bắt đầu hiện hình.

**Tầng 3 — Hệ thống.** Ai giữ trạng thái đó? Ai được phép thay đổi nó? Khi nó đổi thì ai cần biết, và phần nào phải được lưu? Chỉ đến tầng này `AttributeSet`, `SaveGame`, replication hay DataTable mới xuất hiện.

Cái bẫy lớn nhất là nhảy thẳng vào tầng 3. Nó dễ chịu hơn nhiều: ở đó có API, sơ đồ và câu trả lời đúng/sai rõ ràng, còn tầng 1 thì mơ hồ. Nhưng nếu nhảy cóc, bạn có thể xây một hệ thống chạy rất tốt mà không phục vụ cảm giác nào cả. Không thiếu những inventory system được viết đẹp trong các game mà người chơi chẳng có lý do để mở túi đồ.

## Thử ngay: một khoảnh khắc, ba tầng

Lấy một khoảnh khắc khác trong Palworld: **bạn đi vắng, quay về base thì thấy đống quặng đã được đào sẵn**.

| Tầng | Câu hỏi | Trả lời |
|---|---|---|
| Cảm giác | Người chơi thấy gì? | Thấy mình có "nhân viên". Thời gian mình không chơi cũng sinh ra giá trị. Hơi giống cảm giác về nhà thấy nhà đã dọn xong. |
| Điều kiện | Điều gì bắt buộc đúng? | Công việc phải chạy khi người chơi không nhìn. Kết quả phải tích lũy được và nhìn thấy được. Phải có lúc nó *không* chạy (thú đói, hết chỗ chứa) — nếu không thì không còn gì để quản lý. |
| Hệ thống | Cần gì? | Một khái niệm "loại việc" và "năng lực làm việc" theo từng con thú; công trình có chỗ nhận thợ; một bộ điều phối gán thợ vào việc; chỉ số đói/tinh thần giảm theo thời gian; kho chứa có giới hạn. |

Hãy dừng ở dòng in nghiêng của tầng điều kiện: *phải có lúc nó không chạy*. Đây là loại phát hiện chỉ xuất hiện khi ta chịu đi qua tầng 2. Nhảy thẳng xuống tầng 3, bạn rất dễ code một hệ automation hoàn hảo, không bao giờ hỏng, rồi vô tình giết chết chính trò chơi quản lý mình muốn tạo. Cảm giác “về nhà thấy nhà dọn xong” chỉ có ý nghĩa khi vẫn tồn tại khả năng “về nhà thấy nhà bừa bộn”.

## Vì sao phần này đứng đầu tài liệu

Toàn bộ phần còn lại của bộ tài liệu này đi theo đúng ba tầng đó, theo đúng thứ tự đó:

- Chương 2–3 mở rộng tầng 1 và 2 cho **toàn bộ** Palworld — nhận diện vòng lặp vui và catalog tính năng kèm cảm giác mà nó phục vụ.
- Chương 4–5 đi xuống tầng 3 — biến catalog thành trạng thái, chủ sở hữu và bản đồ hệ thống.
- Quyển 2 trở đi mới bàn tới kiến trúc code, và bàn cũng bằng cách hỏi "vì sao" y hệt: vì sao Lyra tách plugin, vì sao có Experience thay cho GameMode.

Nếu chỉ mang theo một phương pháp từ cả bộ sách, hãy mang theo đường đi ngược này. Kiến trúc thay đổi theo engine và theo năm; cách lần từ cảm giác về điều kiện rồi mới tới hệ thống vẫn dùng được với bất kỳ game nào bạn gặp. Chương 2 sẽ bắt đầu cuộc đi ngược ấy ở quy mô lớn hơn: thay vì một khoảnh khắc, chúng ta nhìn toàn bộ những nguồn vui giữ vòng lặp Palworld chuyển động.

---

**Bằng chứng cho chương này.** Đây là chương về phương pháp tư duy, không đưa ra claim nào về số liệu Palworld, nên không có nhãn `EXTRACTED`. Các ví dụ về bắt thú và automation ở trên là mô tả trải nghiệm chơi ở mức phổ quát; số liệu thật của từng hệ thống (công thức bắt, chỉ số làm việc, tốc độ giảm đói) nằm ở Chương 2–3 và đều có nhãn nguồn riêng.
