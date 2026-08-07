# Chương 12 — Danh mục khái niệm và danh mục quyền ghi

Buổi sáng, agent làm cung cần một cách mô tả sát thương có thuộc tính hệ. Nó tìm không thấy, nên tạo một kiểu mới. Buổi chiều, agent làm hiệu ứng bỏng gặp đúng nhu cầu ấy, tìm bằng một cái tên khác, cũng không thấy, rồi tạo thêm một kiểu nữa. Cả hai nhánh đều biên dịch. Chỉ đến lúc ghép lại, cả nhóm mới phát hiện mình có hai từ cho cùng một ý và hai đường dữ liệu không nói chuyện được với nhau.

Chương 11 đã đoán trước va chạm này, nhưng luật thôi chưa đủ. Va chạm số 6 — hai agent nghĩ ra hai khái niệm trùng nhau — cần tới ba luật mà vẫn chưa chắc chắn. Luật L8 cũng nói mỗi trạng thái có đúng một chủ ghi, nhưng chưa nói ai là chủ của cái gì. Một người mới vào dự án vẫn phải hỏi quanh, và với một nghìn người hay agent, “hỏi quanh” không còn là một cơ chế phối hợp.

Cả hai chỗ trống đều quy về cùng một nhu cầu: **phải có một nơi ghi lại những gì cả nhóm đã thống nhất.** Chương này dựng nơi đó bằng ba tài liệu sống: danh mục khái niệm, danh mục quyền ghi và bảng phân công.

Trước khi đi vào chi tiết, một lưu ý về bản chất. Mười hai luật ở Chương 11 là luật về *hình dạng* — code phải trông thế nào. Hai danh mục ở đây là *nội dung* — dự án này đang có những khái niệm gì, ai sở hữu cái gì. Luật thì viết một lần; danh mục thì sống và lớn lên theo dự án. Đây là hai loại tài liệu khác nhau và không nên trộn vào một chỗ.

## 12.1 — Vì sao hai agent lại nghĩ ra hai khái niệm trùng nhau

Đáng dừng lại một chút ở nguyên nhân, vì cách chữa phụ thuộc vào nó.

Agent làm cung cần mô tả "sát thương có thuộc tính hệ". Nó tìm trong lõi, không thấy có sẵn, nên tự tạo. Agent làm hiệu ứng bỏng cũng cần đúng thứ đó, cũng tìm, cũng không thấy — vì agent kia chưa xong, hoặc đã xong nhưng đặt trong `Private` của mình, hoặc đặt tên khác hẳn nên tìm không ra.

Ba nguyên nhân, ba cách chữa khác nhau:

- **Chưa ai làm** → cần biết ai đang làm gì, tức là bảng phân công.
- **Có rồi nhưng không dùng chung được** → cần luật: khái niệm dùng chung phải đặt trong lõi, không đặt trong `Private`.
- **Có rồi nhưng tìm không ra** → cần một danh mục tra cứu và một quy ước đặt tên.

Cả ba đều là vấn đề **thông tin**, không phải vấn đề code. Một agent không cố tình tạo trùng; nó tạo trùng vì không biết.

Nên nguyên tắc của chương này là: **trước khi tạo một khái niệm mới, agent phải tra danh mục; nếu đã có thì dùng lại; nếu chưa có thì thêm vào danh mục cùng lúc với việc tạo ra nó.** Danh mục không phải phần giấy tờ đi sau code. Nó là bước đầu tiên ngăn hai nhánh code hợp lệ riêng lẻ trở thành một hệ thống không thể ghép.

## 12.2 — Danh mục khái niệm

Danh mục khái niệm là một file văn bản duy nhất, liệt kê mọi danh từ mà nhiều hơn một tính năng có thể cần. Muốn biết một mục có đủ dùng hay chưa, hãy tưởng tượng một agent chưa từng đọc code của owner đang tra nó: agent ấy phải biết tên nào được phép viết, nghĩa chính xác là gì, nằm ở đâu và ranh giới với khái niệm gần nhất. Vì vậy mỗi mục ghi năm điều:

| Trường | Nghĩa |
|---|---|
| Tên | Tên chính thức, dùng nguyên văn trong code |
| Định nghĩa | Một hoặc hai câu, đủ để phân biệt với những khái niệm gần giống |
| Sống ở đâu | Lõi hay tính năng nào; nếu ở lõi thì file nào |
| Ai đang dùng | Danh sách tính năng phụ thuộc vào nó |
| Không phải là gì | Những khái niệm dễ nhầm với nó |

Trường cuối cùng nghe lạ nhưng theo tôi là trường có giá trị nhất. Phần lớn khái niệm trùng lặp không sinh ra vì thiếu định nghĩa, mà vì hai thứ **gần giống nhau mà khác nhau ở chi tiết quan trọng**. Ghi rõ "cái này không phải cái kia" thì lần sau người tra sẽ dừng đúng chỗ.

Vài mục mẫu để thấy hình dạng:

**`FDamageRequest`** — một yêu cầu gây tổn thương, mang theo bên gây, bên nhận, giá trị gốc và các nhãn mô tả loại. Sống ở lõi. Dùng bởi chiến đấu, hiệu ứng theo thời gian, môi trường, đói. *Không phải là* con số máu bị trừ đi — con số đó do bên nhận quyết định sau khi áp luật của mình.

**`FPaldarkEntityId`** — định danh bền vững dùng chung cho mọi thực thể Paldark, bọc một `FGuid` bên trong và sống sót qua lần thoát game. Sống ở lõi. Dùng bởi bắt giữ, đội hình, làm việc, nhân giống, cấu trúc, vật phẩm và lưu trữ; muốn biết nó là creature hay structure thì tra `DefinitionId`, không mã hóa loại vào C++ type. *Không phải là* con trỏ tới actor — actor có thể chưa được nạp mà thực thể vẫn tồn tại; và *không phải là* mã định nghĩa, mã định nghĩa mô tả "loại nào", ID này mô tả "thực thể nào".

**`FWorkKindTag`** — nhãn chỉ một loại việc mà sinh vật có thể làm. Sống ở lõi dưới dạng nhãn, không phải enum, theo luật L5. Dùng bởi làm việc, công trình, nhân giống. *Không phải là* mức độ thành thạo — mức độ là một con số gắn với cặp cá thể và loại việc.

Ba ví dụ này cũng cho thấy một điều: **những khái niệm cần vào danh mục hầu hết đều là những thứ đi xuyên qua nhiều tính năng.** Thứ nào chỉ một tính năng dùng thì để trong `Private` của nó và không cần khai báo với ai. Danh mục càng rõ ranh giới này, Core càng ít bị biến thành kho chứa mọi struct “có thể sẽ hữu ích”.

## 12.3 — Quy tắc đưa một khái niệm vào lõi

Nếu ai cũng được đẩy khái niệm của mình vào lõi thì lõi sẽ phình ra và biến thành ngã tư mới. Nên cần một ngưỡng.

Quy tắc ba lần: **một khái niệm chỉ vào lõi khi có ít nhất hai tính năng thật sự cần nó, và người thứ ba nhìn vào thấy nó có nghĩa mà không cần biết hai tính năng kia.**

Cho tới lúc đó, khái niệm sống trong `Private` của tính năng đầu tiên. Khi tính năng thứ hai cần, đó là lúc chuyển nó ra lõi — và việc chuyển này là một thay đổi riêng, có duyệt riêng, không lẫn với việc phát triển tính năng.

Ngưỡng này cố tình đặt hơi chặt. Lý do là chi phí không đối xứng: một khái niệm bị nhân đôi thì tốn công gộp lại sau; một khái niệm sai bị đưa vào lõi thì mọi người phải sống chung với nó, và sửa nó sau này là thay đổi ảnh hưởng tới tất cả. Sai theo hướng chậm thì rẻ hơn.

## 12.4 — Danh mục quyền ghi

Danh mục thứ nhất giúp hai người dùng cùng một danh từ. Nhưng dùng cùng từ vẫn chưa ngăn được họ cùng sửa một giá trị. Ta cần trả lời thêm câu hỏi khó hơn: khi hai hệ thống đều có lý do hợp lý để thay đổi một state, hệ thống nào được quyền quyết định cuối cùng? Đây là vai trò của danh mục thứ hai, và là chỗ luật L8 trở nên cụ thể.

Với mỗi mẩu trạng thái đáng kể trong game, ghi bốn điều:

| Trường | Nghĩa |
|---|---|
| Trạng thái | Tên mẩu trạng thái |
| Chủ | Hệ thống duy nhất được phép ghi |
| Ai được đọc | Ai đọc trực tiếp, ai chỉ nhận qua thông điệp |
| Đổi bằng cách nào | Tên loại yêu cầu mà người ngoài gửi tới |

Ví dụ, lấy đúng tình huống hai đường cùng trừ máu ở Chương 6:

| Trạng thái | Chủ | Ai được đọc | Đổi bằng cách nào |
|---|---|---|---|
| Máu hiện tại | Hệ chỉ số | Ai cũng đọc được qua truy vấn snapshot | Gửi `FDamageRequest` hoặc `FHealRequest` |
| Độ đói | Hệ nhu cầu | Hệ làm việc, giao diện | Gửi `FNourishRequest`; tự giảm theo thời gian do chủ tự làm |
| Cá thể đang làm việc gì | Hệ phân công | Giao diện, hệ AI | Gửi `FAssignWorkRequest` |
| Nút công nghệ đã mở | Hệ tiến trình | Chế tạo, xây dựng, giao diện | Gửi `FUnlockRequest` |
| Vị trí nhân vật | Hệ di chuyển | Rất nhiều bên đọc | Không ai ghi ngoài chủ |

Nhìn bảng này thì tình huống ở Chương 6 tự tan. Hệ đói không còn cách nào trừ máu ngoài việc gửi một yêu cầu tổn thương, và mọi yêu cầu đều đi qua đúng một cửa của hệ chỉ số. Cửa đó ghi log theo L12. Câu hỏi “vì sao con vật chết” không còn buộc ta tìm mọi chỗ có chữ `Health`; nó trở thành việc đọc mấy dòng log liền nhau từ requester tới owner.

Có một điều tinh tế đáng nói ở dòng "độ đói". Chủ của nó tự giảm giá trị theo thời gian — đó là **luật nội tại của chính hệ thống đó**, không phải người ngoài can thiệp. Phân biệt này quan trọng: chủ được tự do làm gì với trạng thái của mình; luật L8 chỉ cấm **người ngoài** ghi.

Đọc là quyền tự do: `HealthRead`, `ItemRead`, `ProgressionRead` và các query snapshot không cần authority hay correlation id. Chỉ request làm thay đổi state mới phải đi qua owner, bị authority kiểm tra và để lại log. Tách hai loại này giúp agent không biến một lần đọc UI thành một mutation trá hình.

## 12.5 — Bảng phân công

Ta đã biết dự án có những khái niệm gì và state thuộc về ai. Vẫn còn một khoảng thời gian nguy hiểm: hai agent có thể cùng chuẩn bị tạo một khái niệm chưa kịp xuất hiện trong hai danh mục kia. Danh mục thứ ba lấp khoảng trống đó. Nó ngắn nhất nhưng không thể thiếu: ai đang làm gì.

| Trường | Nghĩa |
|---|---|
| Tính năng | Tên, khớp với tên thư mục plugin |
| Chủ | Agent hoặc người đang làm |
| Trạng thái | Chưa bắt đầu / đang làm / xong / bị chặn |
| Khái niệm mới | Những khái niệm nó dự định đưa vào lõi |
| Chờ ai | Những tính năng nó phải đợi |

Cột "khái niệm mới" là cột chống trùng lặp hiệu quả nhất, vì nó bắt agent **công bố ý định trước khi viết**. Hai agent cùng định tạo khái niệm sát thương theo hệ sẽ thấy nhau ở đây, trước khi cả hai viết xong hai bản khác nhau.

Cột "chờ ai" thì làm lộ ra thứ tự công việc. Nếu một tính năng phải chờ ba tính năng khác, đó là dấu hiệu nó bị cắt sai — nên tách nhỏ hơn hoặc gộp lại.

## 12.6 — Ba danh mục này phải sống được

Danh mục viết ra thì dễ, giữ cho nó đúng mới khó. Tài liệu nào cũng bắt đầu chính xác và trôi dần khỏi thực tế; đến lúc người ta không còn tin nó, họ ngừng tra, và vòng lặp tạo trùng bắt đầu lại. Vì vậy mỗi danh mục phải có một cách giữ riêng, phù hợp với loại sự thật nó đang mô tả.

**Danh mục quyền ghi kiểm được bằng máy.** Script quét toàn bộ mã nguồn, tìm mọi chỗ ghi vào một trạng thái đã đăng ký, và đối chiếu với cột chủ. Ai ghi mà không phải chủ thì báo lỗi. Đây là danh mục có kỷ luật cao nhất trong ba cái.

**Danh mục khái niệm kiểm được một nửa.** Script kiểm được rằng mọi kiểu công khai trong lõi đều có mặt trong danh mục, và mọi mục trong danh mục đều trỏ tới file có thật. Nó **không** kiểm được rằng hai mục khác tên đang mô tả cùng một thứ — chỗ đó vẫn cần mắt người.

**Bảng phân công không kiểm được bằng máy**, vì nó nói về ý định chứ không về code. Nó chỉ đúng nếu mỗi agent cập nhật khi nhận việc và khi xong việc. Đây là mắt xích yếu nhất, và tôi không có cách nào làm nó chắc hơn ngoài việc để nó thật ngắn — càng ít cột thì càng nhiều khả năng được điền.

Nói ra điểm yếu này chứ không giấu đi, vì nếu bảng phân công không được duy trì thì chống trùng lặp sẽ chỉ dựa vào hai danh mục kia, và tỷ lệ trùng sẽ cao hơn.

## 12.7 — Vị trí file

Ba danh mục nằm ngoài mọi plugin, ở một chỗ cố định:

```text
DanhMuc/
  khai-niem.md
  quyen-ghi.md
  phan-cong.md
```

Đặt ở đây, không đặt trong lõi, vì chúng là tài liệu phối hợp chứ không phải mã nguồn. Và đây là ba file duy nhất trong toàn dự án mà **mọi agent đều được sửa** — nhưng chỉ được thêm dòng của mình, không sửa dòng của người khác. Đó là kiểu thay đổi mà Git xử lý được tốt: nhiều dòng độc lập có thể cùng lớn lên mà không buộc mọi người sửa một cấu trúc trung tâm.

---

## 12.8 — Quy ước hợp đồng lõi

Ba danh mục chỉ hữu ích nếu một cái tên trong tài liệu dẫn người đọc tới đúng thứ trong code. Vì vậy tên logic `Paldark.Core.<Tên>` ánh xạ sang C++ là `IPaldark<Tên>` và `UPaldark<Tên>`. Lớp hiện thực cụ thể phải có tên khác, theo dạng `UPaldark<Tên>Subsystem`; không dùng hậu tố `Contract` để né trùng tên.

Quy ước này tách “lời hứa” khỏi “người thực hiện lời hứa”. Agent cần đọc health không phải đoán nên tìm `HealthContract`, `HealthService` hay `HealthManager`; nó bắt đầu từ `Paldark.Core.HealthRead`, tìm đúng interface rồi mới để runtime resolve implementation. Interface đọc trả về một snapshot struct thay vì nhiều tham số `out`, và query đọc không cần authority/correlation. Authority và correlation chỉ xuất hiện khi ai đó muốn thay đổi state.

Đến đây ta đã có câu trả lời cho ba câu hỏi phối hợp: **ta đang nói về cùng một thứ không, ai được phép đổi nó, và ai đang làm phần việc ấy?** Chương kế tiếp sẽ lấy các câu trả lời này đặt vào một cấu trúc vật lý: module nào được biết module nào, và vì sao một feature phải luôn nằm ở lá của đồ thị phụ thuộc.

**Bằng chứng cho chương này.** Ba danh mục và các quy tắc kèm theo là thiết kế của tài liệu này (INFERRED), xuất phát từ phân tích va chạm ở Chương 6 và các luật L5, L6, L8, L9 ở Chương 11. Nguyên tắc "người gây đề nghị, người nhận quyết định" trong bảng quyền ghi lấy từ cơ chế chỉ số trung gian của GAS, OBSERVED tại khóa 11, bài `13 - Damage/001 Meta Attributes`. Các file sống trong `DanhMuc/` đã được dựng từ bảng mục 3 của Q4 Chương 21–35; chúng là catalog vận hành, còn các ví dụ lịch sử ở 12.2 và 12.4 vẫn là minh họa. Nhận định rằng bảng phân công là mắt xích yếu vì không kiểm được bằng máy là đánh giá của tài liệu này.
