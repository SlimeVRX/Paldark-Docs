# Chương 11 — Luật kiến trúc Paldark

Năm chương vừa rồi đi một vòng: dựng ra bảy va chạm, xem Lyra chữa được sáu, đo cái giá phải trả, học thêm từ UEFN, và xác nhận bằng một mẫu vật thật rằng mở rộng không cần sửa lõi là chuyện làm được.

Chương này viết ra luật. Sau đây là mười hai điều, mỗi điều kèm lý do và kèm câu trả lời cho hai câu hỏi: **nó chặn va chạm nào**, và **làm sao máy kiểm tra được**.

Câu hỏi thứ hai quan trọng ngang câu thứ nhất. Chương 9 đã nói: luật dựa vào ý chí thì sẽ bị vi phạm. Với một nghìn agent, một luật không kiểm được bằng máy thì chỉ là lời khuyên, và lời khuyên thì không giữ được kiến trúc.

## Nhóm A — Ranh giới

### L1. Một tính năng là một plugin, một plugin có đúng một chủ

Tính năng nào cũng nằm gọn trong `Plugins/Features/<TênTínhNăng>/`, có mã nguồn riêng, dữ liệu riêng, khai báo riêng. Một agent nhận một tính năng thì nhận cả thư mục đó, và **không được sửa gì ngoài thư mục của mình** ngoại trừ những trường hợp ở L8.

*Chặn:* va chạm 1 và 5 — không còn file chung để đụng.
*Kiểm bằng máy:* mỗi thay đổi chỉ được chạm một thư mục tính năng; script so danh sách file thay đổi với bảng phân công.

### L2. Không tính năng nào biết tên tính năng khác

Mã nguồn trong một plugin tính năng không được `#include` bất cứ thứ gì thuộc plugin tính năng khác. Muốn phối hợp thì có đúng hai đường: phát/nghe thông điệp trên một kênh có nhãn, hoặc dùng một interface được khai báo trong module lõi.

*Chặn:* va chạm 4 — sợi dây trực tiếp bị cắt tận gốc.
*Kiểm bằng máy:* quét toàn bộ chỉ thị include, chặn mọi đường dẫn trỏ sang thư mục tính năng khác. Repo đã có sẵn một script cùng tinh thần là `check_paldarkv2_headers.py`.

### L3. Lớp cơ sở bất động

Các lớp nền — nhân vật, sinh vật, người điều khiển, trạng thái game — nằm trong module lõi và **đóng băng**. Không tính năng nào được thêm biến hay hàm vào chúng. Muốn thêm hành vi thì viết component riêng rồi khai báo gắn từ bên ngoài.

*Chặn:* va chạm 3 — xóa hẳn ngã tư đông nhất của mọi project game.
*Kiểm bằng máy:* các file lõi nằm trong danh sách đóng băng; thay đổi vào chúng phải là một loại thay đổi riêng, có duyệt riêng.

### L4. Public tối thiểu

Mọi thứ không cố ý cho người khác dùng đều nằm trong `Private`. Phần `Public` của một tính năng chỉ chứa những gì thuộc hợp đồng của nó. Đây là cách gần nhất ta có với sự cô lập cứng của device trong UEFN: cái gì không nằm trong `Public` thì người khác **không include được**, chứ không phải "không nên include".

*Chặn:* va chạm 4, một lớp phòng thủ nữa.
*Kiểm bằng máy:* Unreal đã ép sẵn ở tầng biên dịch; script chỉ cần chặn việc lách bằng đường dẫn tương đối.

## Nhóm B — Mở rộng

### L5. Mở rộng bằng thêm file, không bằng sửa file

Đây là luật quan trọng nhất trong cả tài liệu, nên tôi phát biểu nó thành một câu kiểm tra: **nếu để thêm một thứ mới bạn phải mở một file có sẵn ra sửa, thiết kế đang sai.**

Cụ thể là cấm ba thứ:

- **Cấm enum tập trung.** Không có `enum EWorkKind`, `enum EItemType`, `enum EElement`. Mọi phân loại dùng tag, hoặc dùng một mẩu dữ liệu tự đăng ký.
- **Cấm danh sách tổng.** Không có file nào liệt kê "tất cả các vật phẩm trong game". Danh sách được quét lên lúc khởi động từ dữ liệu nằm rải trong các plugin.
- **Cấm `switch` theo loại.** Nếu code có `switch` trên loại vật phẩm, mỗi loại mới lại phải thêm một nhánh, và mọi agent lại đụng vào một hàm. Thay bằng cơ chế mảnh ở L6.

*Chặn:* va chạm 2.
*Kiểm bằng máy:* chặn khai báo enum trong module lõi vượt quá danh sách được phép; chặn `switch` trên các kiểu phân loại đã đăng ký.

### L6. Mọi thứ có nhiều biến thể đều theo mô hình định nghĩa – thực thể – mảnh

Lấy nguyên từ Chương 10 và áp rộng ra: vật phẩm, sinh vật, công trình, loại việc, hiệu ứng — tất cả đều có ba vai.

**Định nghĩa** là dữ liệu tĩnh mô tả một loại, không đổi lúc chạy, không cần đồng bộ mạng. **Thực thể** là một cá thể lúc chạy, có đổi, cần đồng bộ và cần lưu. **Mảnh** là một khía cạnh gắn thêm vào định nghĩa, và **ai cũng được định nghĩa loại mảnh mới**.

Nhờ vai mảnh mở, agent làm hệ nấu ăn thêm mảnh "nấu được" mà không hỏi ai, agent làm nhân giống thêm mảnh "dùng làm thức ăn nhân giống" mà không đụng gì. Đây là chỗ thay thế cho `switch` bị cấm ở L5: thay vì hỏi "vật phẩm này loại gì rồi rẽ nhánh", ta hỏi "vật phẩm này có mảnh nấu ăn không".

*Chặn:* va chạm 2 và 6.
*Kiểm bằng máy:* mỗi loại có nhiều biến thể phải có đủ ba lớp tương ứng; định nghĩa không được chứa trường chỉ dùng cho một biến thể.

### L7. Cấu hình là văn bản, không phải asset nhị phân

Đây là chỗ Paldark tách khỏi Lyra, và Chương 8 đã giải thích vì sao.

Mọi thứ mang tính cấu hình — định nghĩa vật phẩm, định nghĩa sinh vật, công thức chế tạo, bảng tương khắc, khai báo tính năng, khai báo gắn component — đều là **file văn bản** nằm trong thư mục của plugin, dạng JSON hoặc CSV. File `.uasset` chỉ dùng cho nội dung nghệ thuật thật sự: mesh, texture, âm thanh, animation.

Ba lý do, xếp theo mức quan trọng:

1. **Git merge được.** Hai agent sửa hai vật phẩm khác nhau trong cùng một bảng vẫn ghép được.
2. **Agent đọc được.** Không cần mở editor để biết một định nghĩa đang chứa gì.
3. **Máy kiểm tra được.** Script có thể quét toàn bộ cấu hình để tìm id trùng, tham chiếu gãy, trường thiếu — trước khi chạy game.

Điểm thứ ba đáng nhấn: nó biến cả một lớp lỗi vốn chỉ hiện ra lúc chạy — đúng nút thắt số 2 ở Chương 8 — thành lỗi báo ngay lúc kiểm tra.

*Chặn:* va chạm 5.
*Kiểm bằng máy:* chặn `.uasset` xuất hiện trong các thư mục dành cho cấu hình; kiểm lược đồ của mọi file cấu hình.

## Nhóm C — Quyền và danh mục

### L8. Một trạng thái có đúng một chủ ghi

Với mỗi mẩu trạng thái trong game, phải trả lời được: **ai là hệ thống duy nhất được phép thay đổi nó?** Mọi hệ thống khác chỉ được **gửi yêu cầu**, không được tự ghi.

Ví dụ máu: hệ đói không trừ máu, nó gửi một yêu cầu gây tổn thương. Hệ bỏng cũng vậy. Chủ của máu nhận yêu cầu, áp luật của mình — giáp, kháng hệ, bất tử tạm thời — rồi mới quyết định con số cuối. Đây đúng là nguyên tắc "người gây đề nghị, người nhận quyết định" đã thấy ở GAS.

Danh sách "trạng thái nào thuộc về ai" là một tài liệu bắt buộc, và Chương 12 sẽ dựng nó.

*Chặn:* va chạm 7.
*Kiểm bằng máy:* trường trạng thái để `private` với hàm ghi chỉ lộ trong `Private` của chủ; script đối chiếu bảng chủ sở hữu với nơi thật sự có lệnh ghi.

### L9. Mọi danh từ chung đều có tiền tố của chủ

Tag, kênh thông điệp, id dữ liệu, tên console command, danh mục log — tất cả đều mang tiền tố là tên tính năng sở hữu nó. Tính năng nhân giống dùng `Paldark.Breeding.*`, không dùng `Paldark.Egg`.

Nghe nhỏ nhặt, nhưng nó xóa hẳn một lớp va chạm: hai agent không bao giờ đặt trùng tên, vì không gian tên của họ không giao nhau. Và khi thấy một tag lạ trong log, biết ngay hỏi ai.

*Chặn:* va chạm 6.
*Kiểm bằng máy:* quét mọi khai báo tag/kênh/id, kiểm tiền tố khớp thư mục chứa nó.

### L10. Phụ thuộc phải khai báo ở đúng một chỗ, đọc được bằng máy

Học từ `@editable` của Verse. Mỗi tính năng có đúng một file khai báo, định dạng cố định, ghi rõ: nó cần những interface nào của lõi, nghe những kênh nào, phát những kênh nào, gắn component nào vào loại actor nào, đọc những bảng dữ liệu nào.

Cái được không phải là gọn gàng, mà là: **máy dựng lại được đồ thị phụ thuộc thật của cả project** và so với đồ thị được phép. Nếu phụ thuộc nằm rải trong thân hàm thì không script nào làm được điều đó.

*Chặn:* gián tiếp cả 4 và 6, bằng cách làm mọi thứ nhìn thấy được.
*Kiểm bằng máy:* đối chiếu file khai báo với những gì code thật sự dùng; lệch nhau thì báo lỗi.

## Nhóm D — Chất lượng và kiểm chứng

### L11. C++ tối đa, Blueprint chỉ ở tầng trình bày

Mọi logic — trạng thái, luật, tính toán, quyền, mạng, lưu trữ — nằm trong C++. Blueprint chỉ được dùng cho ba việc: kế thừa từ một lớp C++ để chỉnh thông số hiển thị, ghép hình ảnh và hiệu ứng, và bố cục giao diện.

Lý do không phải vì Blueprint dở, mà vì hai tính chất của nó không hợp với bài toán này: nó là file nhị phân không merge được, và agent không sinh ra được nó bằng cách viết văn bản. Mỗi mẩu logic đặt trong Blueprint là một mẩu mà agent không sửa được và hai người không cùng làm được.

Chỗ nào buộc phải làm bằng Blueprint thì tài liệu của tính năng đó phải có mục **hướng dẫn từng bước bằng lời**, đủ để một người mở editor lên làm theo mà không cần đoán.

*Kiểm bằng máy:* đếm nút trong Blueprint, cảnh báo khi vượt ngưỡng; chặn Blueprint chứa biến trạng thái được đồng bộ.

### L12. Mọi thay đổi trạng thái đều để lại một dòng log theo định dạng chuẩn

Mỗi lần một chủ sở hữu thay đổi trạng thái của mình, nó ghi một dòng: hệ thống nào, ai yêu cầu, tác động lên ai, giá trị trước và sau, nguyên nhân.

Luật này là cái giá phải trả cho L2. Khi các tính năng không còn gọi thẳng nhau, ta mất khả năng đọc code để biết ai gọi ai — nên phải mua lại khả năng đó ở dạng khác, là đọc log để biết thực tế điều gì đã xảy ra. Bỏ L12 đi thì L2 biến kiến trúc thành một hộp đen.

*Kiểm bằng máy:* mỗi hàm ghi trạng thái phải có một lệnh log trong cùng phạm vi.

## 11.1 — Bảng tra ngược: từ va chạm tới luật

| Va chạm ở Chương 6 | Luật chặn nó |
|---|---|
| 1. Cùng sửa file descriptor/build | L1 |
| 2. Cùng sửa một enum | L5, L6 |
| 3. Cùng thêm biến vào lớp cơ sở | L3 |
| 4. Gọi thẳng vào tính năng khác | L2, L4, L10 |
| 5. Cùng sửa asset nhị phân | L1, L7 |
| 6. Hai khái niệm trùng nhau | L6, L9, L10 |
| 7. Hai đường cùng ghi một trạng thái | L8 |

Bảy va chạm, đều có luật. Nhưng để ý cột bên phải: **va chạm 6 cần tới ba luật và vẫn chưa chắc chắn.** Vì như đã nói từ Chương 6, chống trùng khái niệm không phải vấn đề kỹ thuật thuần túy — nó cần một danh mục được duy trì. Đó là việc của chương sau.

## 11.2 — Ba điều Paldark làm khác Lyra, nói cho rõ

Để không ai hiểu nhầm rằng đây là bản sao Lyra:

**Cấu hình là văn bản chứ không phải asset (L7).** Lyra đặt Experience, PawnData, AbilitySet, Item Definition vào file nhị phân. Với studio thì hợp lý; với nghìn agent thì không dùng được. Đây là khác biệt lớn nhất.

**Cấm gọi thẳng, không chỉ khuyến khích tránh (L2).** Lyra có Gameplay Message như một lựa chọn. Paldark biến nó thành đường duy nhất, và có script chặn.

**Mọi luật đều phải có script kiểm (L1–L12).** Lyra có quy ước, tài liệu và ví dụ mẫu. Paldark coi bộ script kiểm tra là **một phần của kiến trúc**, không phải phụ kiện. Luật nào không viết được script kiểm thì phải sửa lại cho tới khi viết được, hoặc bỏ.

## 11.3 — Cái các luật này chưa giải quyết

Nói thẳng để không tự lừa mình:

- **Hai agent cùng cần một tính năng chưa ai làm.** Cả hai sẽ tự làm, ra hai bản. Luật không chặn được; cần danh mục và phân công (Chương 12).
- **Một tính năng cần đổi hợp đồng của lõi.** Sẽ có lúc xảy ra, và lúc đó nhiều tính năng bị ảnh hưởng cùng lúc. Cần một quy trình riêng, không phải một luật.
- **Chi phí lớp trung gian.** Định nghĩa – thực thể – mảnh cho mọi thứ nghĩa là nhiều file hơn hẳn cách viết thẳng. Mẫu vật ở Chương 10 tốn 149 file C++ cho riêng túi đồ. Ta chấp nhận cái giá này một cách có ý thức, không phải vì không biết.
- **Hiệu năng.** Tra mảnh, phát thông điệp, quét cấu hình đều tốn hơn gọi thẳng. Ở quy mô Palworld thì gần như chắc chắn không thành vấn đề, nhưng tôi không có số đo để khẳng định, nên ghi lại đây như một rủi ro chưa kiểm chứng.

## 11.4 — Quyết định thiết kế đã chốt

| Quyết định | Lý do |
|---|---|
| Chỉ dùng `FPaldarkEntityId`, bỏ `FCreatureInstanceId` và `FGuid` trần cho entity reference | Một wrapper duy nhất ngăn hàng nghìn agent hiểu khác nhau về loại ID; loại entity tra từ definition/context. |
| `Paldark.Core.<Tên>` ánh xạ thành `IPaldark<Tên>`/`UPaldark<Tên>`, không có hậu tố `Contract` | Tên logic và tên C++ có phép ánh xạ cơ học, còn implementation dùng tên `Subsystem` khác hẳn. |
| Interface đọc trả về snapshot struct | Một snapshot gom đúng dữ liệu cần đọc, tránh chuỗi tham số `out` và làm rõ đọc không phải mutation. |
| `FDamageResult` là struct riêng | L12 cần before/after và Capture cần biết health sau hit, nên result damage không thể núp trong result chung. |
| `EntityIdentity.Create` nhận `FPaldarkEntityCreateContext`, không nhận fragment override | Identity chỉ cấp ID; feature tạo entity mới là nơi sở hữu state/mảnh ban đầu. |
| Mount là interface, không phải channel; state change dùng `Paldark.Movement.Event.MountChanged` | Capability request và event quan sát là hai contract khác nhau, tránh một tên vừa là API vừa là message. |
| Tách `FPaldarkPersistenceResult` khỏi `FPaldarkMigrationResult` | Save/load báo kết quả lưu trữ; migrate báo chuyển schema, hai vòng đời và lỗi khác nhau. |
| Interface, event và result channel có namespace bắt buộc | Validator có thể phân loại contract bằng tên, không để request/event/result bị dùng lẫn. |

---

**Bằng chứng cho chương này.** Mười hai luật là thiết kế của tài liệu này (INFERRED), rút ra từ phân tích ở các chương 6–10. Cơ sở của từng luật đã được dẫn nguồn tại chương tương ứng: cơ chế Lyra ở Chương 7, số đo chi phí ở Chương 8, mô hình device/`@editable`/event của Verse ở Chương 9, và mô hình định nghĩa – thực thể – mảnh cùng con số 149 file C++ ở Chương 10. Sự tồn tại của `scripts/ci/check_paldarkv2_headers.py`, `check_paldarkv2_tags.py`, `validate_paldarklab.py` và `validate_paldarkv3.py` trong repo là OBSERVED, và Chương 19 sẽ đối chiếu từng luật với script tương ứng. Rủi ro hiệu năng nêu ở 11.3 chưa có số đo, ghi nhận là chưa kiểm chứng.
