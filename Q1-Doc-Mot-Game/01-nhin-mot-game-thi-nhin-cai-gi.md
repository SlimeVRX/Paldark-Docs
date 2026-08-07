# Chương 1 — Nhìn một game thì nhìn cái gì trước?

Bạn mở Palworld lên lần đầu. Nhân vật rơi xuống một bãi cỏ, xung quanh có mấy con thú nhỏ đang đi lang thang. Bạn nhặt vài cành cây, đấm một tảng đá, ném quả cầu bắt được một con, rồi thấy nó lẽo đẽo chạy theo mình. Ba mươi phút sau bạn vẫn còn ngồi đó.

Câu hỏi đầu tiên của người làm game không phải "họ code cái này thế nào", mà là: **ba mươi phút đó, cái gì đã giữ bạn lại?**

Nếu trả lời được câu đó, bạn biết mình phải xây gì. Nếu không trả lời được, bạn sẽ đi chép từng tính năng một, chép xong thì có một cái vỏ giống hệt mà chơi vào thấy nhạt — và bạn sẽ không hiểu vì sao nhạt.

## Đi ngược từ cảm giác, không đi xuôi từ tính năng

Cách sai — mà hầu hết chúng ta đều làm lần đầu — là mở game ra, ghi lại danh sách: có inventory, có crafting, có bắt thú, có xây nhà, có combat. Rồi ngồi code từ trên xuống. Vấn đề của cách này là danh sách tính năng **không nói cho bạn biết cái nào quan trọng**. Trong danh sách đó, "có inventory" và "con thú chạy theo mình" nằm cùng một dòng, trông ngang nhau. Nhưng bỏ inventory đi game vẫn chơi được; bỏ con thú chạy theo mình đi thì Palworld không còn là Palworld.

Cách đúng là đi ngược. Bắt đầu từ khoảnh khắc bạn thấy vui, rồi hỏi ngược lên: khoảnh khắc đó được tạo ra bởi cái gì?

Thử với chính ví dụ ở trên. Khoảnh khắc vui là **con thú vừa đánh nhau với mình xong giờ đi theo mình**. Hỏi tiếp: vì sao nó vui? Vì có một sự chuyển đổi trạng thái rất mạnh — thứ vừa nãy là mối đe dọa giờ thành tài sản của mình. Cảm giác "chiếm hữu". Hỏi tiếp: để có cảm giác chiếm hữu đó thì hệ thống phải làm được gì?

- Con thú phải **từng nguy hiểm thật** — nếu nó vô hại thì bắt được chẳng sướng. Cần một hệ chiến đấu đủ có răng.
- Việc bắt phải **có thể trượt** — nếu bắt là chắc chắn thành công thì không có cảm giác được thưởng. Cần xác suất, và xác suất phải người chơi tác động được (đánh cho nó yếu đi thì dễ bắt hơn).
- Sau khi bắt, nó phải **còn đó** — không biến thành một dòng chữ trong túi đồ. Cần một thực thể sống, có tên, có chỉ số, tồn tại qua các phiên chơi.
- Và nó phải **làm được việc gì đó** — nếu bắt xong để đấy thì cảm giác chiếm hữu tắt sau năm phút. Cần một chỗ để con thú đó có ích: đánh nhau cùng mình, hoặc làm việc cho mình.

Bốn gạch đầu dòng vừa rồi không phải là danh sách tính năng chép từ game. Nó là **những gì bắt buộc phải có để cảm giác kia tồn tại**. Đó mới là yêu cầu thật. Và bạn thấy ngay: cái gạch đầu dòng cuối cùng — "nó phải làm được việc gì đó" — chính là thứ kéo cả nửa còn lại của Palworld vào cuộc, tức là base building và automation. Chúng không phải hai tính năng rời nhau được gắn vào cùng một game. Chúng là **hệ quả bắt buộc** của việc bạn cho người chơi bắt thú.

Đây là điều mà một danh sách tính năng không bao giờ nói cho bạn biết.

## Ba tầng câu hỏi

Cho gọn, tôi dùng ba tầng này mỗi khi nhìn một game mới. Bạn sẽ thấy nó lặp lại suốt cả bộ tài liệu này.

**Tầng 1 — Cảm giác.** Người chơi thấy gì? Không phải "người chơi làm gì", mà "người chơi *thấy* gì". Sướng, tiếc, hồi hộp, tự hào, ngứa tay muốn thử lại. Tầng này không có chữ nào là kỹ thuật.

**Tầng 2 — Điều kiện.** Để cảm giác đó xảy ra thì điều gì bắt buộc phải đúng? Ví dụ: để có cảm giác "suýt chết", máu phải nhìn thấy được, và phải có lúc nó xuống thấp thật. Để có cảm giác "của mình", vật phải bền vững qua thời gian. Tầng này vẫn chưa có class, chưa có component, nhưng đã là ràng buộc kỹ thuật.

**Tầng 3 — Hệ thống.** Ai giữ trạng thái đó? Ai được phép thay đổi nó? Thay đổi rồi thì ai cần biết? Lưu ở đâu? Tầng này mới là nơi xuất hiện `AttributeSet`, `SaveGame`, replication, DataTable.

Cái bẫy lớn nhất trong nghề là nhảy thẳng vào tầng 3. Nó dễ chịu hơn nhiều — tầng 3 có câu trả lời đúng/sai rõ ràng, còn tầng 1 thì mơ hồ. Nhưng nhảy cóc thì bạn sẽ xây một hệ thống chạy tốt mà không phục vụ cảm giác nào cả. Tôi đã thấy quá nhiều inventory system viết rất đẹp trong những game mà chẳng ai buồn mở túi đồ ra.

## Thử ngay: một khoảnh khắc, ba tầng

Lấy một khoảnh khắc khác trong Palworld: **bạn đi vắng, quay về base thì thấy đống quặng đã được đào sẵn**.

| Tầng | Câu hỏi | Trả lời |
|---|---|---|
| Cảm giác | Người chơi thấy gì? | Thấy mình có "nhân viên". Thời gian mình không chơi cũng sinh ra giá trị. Hơi giống cảm giác về nhà thấy nhà đã dọn xong. |
| Điều kiện | Điều gì bắt buộc đúng? | Công việc phải chạy khi người chơi không nhìn. Kết quả phải tích lũy được và nhìn thấy được. Phải có lúc nó *không* chạy (thú đói, hết chỗ chứa) — nếu không thì không còn gì để quản lý. |
| Hệ thống | Cần gì? | Một khái niệm "loại việc" và "năng lực làm việc" theo từng con thú; công trình có chỗ nhận thợ; một bộ điều phối gán thợ vào việc; chỉ số đói/tinh thần giảm theo thời gian; kho chứa có giới hạn. |

Để ý dòng in nghiêng ở tầng điều kiện: *phải có lúc nó không chạy*. Đây là loại phát hiện mà chỉ đi qua tầng 2 mới có được. Nếu nhảy thẳng xuống tầng 3, bạn sẽ code một hệ automation hoàn hảo, không bao giờ hỏng, và vô tình giết chết chính cái trò chơi quản lý mà bạn đang cố tạo ra. Cảm giác "về nhà thấy nhà dọn xong" chỉ tồn tại nếu có khả năng "về nhà thấy nhà bừa bộn".

## Vì sao phần này đứng đầu tài liệu

Toàn bộ phần còn lại của bộ tài liệu này đi theo đúng ba tầng đó, theo đúng thứ tự đó:

- Chương 2–3 mở rộng tầng 1 và 2 cho **toàn bộ** Palworld — nhận diện vòng lặp vui và catalog tính năng kèm cảm giác mà nó phục vụ.
- Chương 4–5 đi xuống tầng 3 — biến catalog thành trạng thái, chủ sở hữu và bản đồ hệ thống.
- Quyển 2 trở đi mới bàn tới kiến trúc code, và bàn cũng bằng cách hỏi "vì sao" y hệt: vì sao Lyra tách plugin, vì sao có Experience thay cho GameMode.

Nếu bạn chỉ đọc một phần trong cả bộ này, đọc phần này. Kiến trúc thì mỗi engine mỗi khác và vài năm lại đổi; còn cách đi từ cảm giác ngược về hệ thống thì dùng được với bất kỳ game nào bạn nhìn thấy sau này.

---

**Bằng chứng cho chương này.** Đây là chương về phương pháp tư duy, không đưa ra claim nào về số liệu Palworld, nên không có nhãn `EXTRACTED`. Các ví dụ về bắt thú và automation ở trên là mô tả trải nghiệm chơi ở mức phổ quát; số liệu thật của từng hệ thống (công thức bắt, chỉ số làm việc, tốc độ giảm đói) nằm ở Chương 2–3 và đều có nhãn nguồn riêng.
