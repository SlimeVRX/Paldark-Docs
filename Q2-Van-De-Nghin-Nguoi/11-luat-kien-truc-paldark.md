# Chương 11 — Luật kiến trúc Paldark

Năm chương vừa rồi là một đường suy luận, không phải chuyến tham quan framework. Ta bắt đầu từ bảy va chạm, xem Lyra chữa được sáu, đo cái giá phải trả, học cách UEFN ép ranh giới bằng công cụ, rồi kiểm tra một mẫu vật thật cho thấy phần mở rộng có thể nằm ngoài lõi.

Đến đây mới đủ cơ sở để viết luật. Mười hai điều dưới đây không xuất hiện vì chúng “nghe sạch”, mà vì mỗi điều phải trả lời được hai câu hỏi: **nó chặn va chạm nào**, và **làm sao máy kiểm tra được**.

Câu hỏi thứ hai quan trọng ngang câu thứ nhất. Chương 9 đã cho thấy luật chỉ dựa vào ý chí sẽ sớm bị vi phạm. Ở quy mô một nghìn agent, một điều không kiểm được bằng máy vẫn chỉ là lời khuyên; lời khuyên có thể hướng dẫn người cẩn thận, nhưng không đủ sức giữ kiến trúc trước hàng nghìn thay đổi độc lập.

## Nhóm A — Ranh giới

### L1. Một tính năng là một plugin, một plugin có đúng một chủ

Luật đầu tiên biến ownership thành một ranh giới nhìn thấy trên cây thư mục. Mỗi tính năng nằm gọn trong `Plugins/Features/<TênTínhNăng>/`, với mã nguồn, dữ liệu và khai báo riêng. Một agent nhận tính năng thì nhận cả thư mục đó, và **không được sửa gì ngoài thư mục của mình** ngoại trừ những trường hợp ở L8.

*Chặn:* va chạm 1 và 5 — không còn file chung để đụng.
*Kiểm bằng máy:* mỗi thay đổi chỉ được chạm một thư mục tính năng; script so danh sách file thay đổi với bảng phân công.

### L2. Không tính năng nào biết tên tính năng khác

Có thư mục riêng nhưng vẫn include chéo thì ranh giới chỉ là hình thức. Vì vậy mã nguồn trong một plugin tính năng không được `#include` bất cứ thứ gì thuộc plugin tính năng khác. Muốn phối hợp thì có đúng hai đường: phát/nghe thông điệp trên một kênh có nhãn, hoặc dùng một interface được khai báo trong module lõi.

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

Nhóm A bảo vệ ranh giới của thứ đã có. Nhóm B hỏi một feature mới đi vào project bằng cách nào mà không phá ranh giới ấy. Luật quan trọng nhất được phát biểu thành một phép thử: **nếu để thêm một thứ mới bạn phải mở một file có sẵn ra sửa, thiết kế đang sai.**

Cụ thể là cấm ba thứ:

- **Cấm enum tập trung.** Không có `enum EWorkKind`, `enum EItemType`, `enum EElement`. Mọi phân loại dùng tag, hoặc dùng một mẩu dữ liệu tự đăng ký.
- **Cấm danh sách tổng.** Không có file nào liệt kê "tất cả các vật phẩm trong game". Danh sách được quét lên lúc khởi động từ dữ liệu nằm rải trong các plugin.
- **Cấm `switch` theo loại.** Nếu code có `switch` trên loại vật phẩm, mỗi loại mới lại phải thêm một nhánh, và mọi agent lại đụng vào một hàm. Thay bằng cơ chế mảnh ở L6.

*Chặn:* va chạm 2.
*Kiểm bằng máy:* chặn khai báo enum trong module lõi vượt quá danh sách được phép; chặn `switch` trên các kiểu phân loại đã đăng ký.

### L6. Mọi thứ có nhiều biến thể đều theo mô hình định nghĩa – thực thể – mảnh

Lấy nguyên từ Chương 10 và áp rộng ra: vật phẩm, sinh vật, công trình, loại việc, hiệu ứng — tất cả đều có ba vai.

**Định nghĩa** là dữ liệu tĩnh mô tả một loại, không đổi lúc chạy, không cần đồng bộ mạng. **Thực thể** là một cá thể lúc chạy, có đổi, cần đồng bộ và cần lưu. **Mảnh** là một khía cạnh gắn thêm vào định nghĩa, và **ai cũng được định nghĩa loại mảnh mới**.

Nhờ vai mảnh mở, agent làm hệ nấu ăn thêm mảnh “nấu được” mà không hỏi ai; agent làm nhân giống thêm mảnh “dùng làm thức ăn nhân giống” mà không sửa phần của bên kia. Đây là chỗ thay thế cho `switch` bị cấm ở L5: thay vì hỏi “vật phẩm này thuộc loại gì rồi rẽ nhánh”, ta hỏi “vật phẩm này có mảnh nấu ăn không?”

*Chặn:* va chạm 2 và 6.
*Kiểm bằng máy:* mỗi loại có nhiều biến thể phải có đủ ba lớp tương ứng; định nghĩa không được chứa trường chỉ dùng cho một biến thể.

### L7. Cấu hình là văn bản, không phải asset nhị phân

Hai luật trước nói dữ liệu phải mở rộng bằng cách thêm. L7 đặt thêm một điều kiện để việc “thêm” đó thật sự phù hợp với agent và Git. Đây là chỗ Paldark tách khỏi Lyra, với lý do đã được đo ở Chương 8.

Mọi thứ mang tính cấu hình — định nghĩa vật phẩm, định nghĩa sinh vật, công thức chế tạo, bảng tương khắc, khai báo tính năng, khai báo gắn component — đều là **file văn bản** nằm trong thư mục của plugin, dạng JSON hoặc CSV. File `.uasset` chỉ dùng cho nội dung nghệ thuật thật sự: mesh, texture, âm thanh, animation.

Ba lý do, xếp theo mức quan trọng:

1. **Git merge được.** Hai agent sửa hai vật phẩm khác nhau trong cùng một bảng vẫn ghép được.
2. **Agent đọc được.** Không cần mở editor để biết một định nghĩa đang chứa gì.
3. **Máy kiểm tra được.** Script có thể quét toàn bộ cấu hình để tìm id trùng, tham chiếu gãy, trường thiếu — trước khi chạy game.

Điểm thứ ba khép lại quan hệ nhân–quả của luật: một file đọc được bằng máy cho phép đẩy cả lớp lỗi vốn chỉ xuất hiện lúc chạy — đúng nút thắt số 2 ở Chương 8 — về bước kiểm tra sớm hơn.

*Chặn:* va chạm 5.
*Kiểm bằng máy:* chặn `.uasset` xuất hiện trong các thư mục dành cho cấu hình; kiểm lược đồ của mọi file cấu hình.

## Nhóm C — Quyền và danh mục

### L8. Một trạng thái có đúng một chủ ghi

Ranh giới file vẫn chưa đủ nếu hai feature cùng sửa được một state runtime. Vì vậy, với mỗi mẩu trạng thái trong game, phải trả lời được: **ai là hệ thống duy nhất được phép thay đổi nó?** Mọi hệ thống khác chỉ được **gửi yêu cầu**, không được tự ghi.

Ví dụ máu: hệ đói không trừ máu, nó gửi một yêu cầu gây tổn thương. Hệ bỏng cũng vậy. Chủ của máu nhận yêu cầu, áp luật của mình — giáp, kháng hệ, bất tử tạm thời — rồi mới quyết định con số cuối. Đây đúng là nguyên tắc "người gây đề nghị, người nhận quyết định" đã thấy ở GAS.

Danh sách "trạng thái nào thuộc về ai" là một tài liệu bắt buộc, và Chương 12 sẽ dựng nó.

*Chặn:* va chạm 7.
*Kiểm bằng máy:* trường trạng thái để `private` với hàm ghi chỉ lộ trong `Private` của chủ; script đối chiếu bảng chủ sở hữu với nơi thật sự có lệnh ghi.

### L9. Mọi danh từ chung đều có tiền tố của chủ

Tag, kênh thông điệp, id dữ liệu, tên console command, danh mục log — tất cả đều mang tiền tố là tên tính năng sở hữu nó. Tính năng nhân giống dùng `Paldark.Breeding.*`, không dùng `Paldark.Egg`.

Tiền tố nghe như một quy ước đặt tên nhỏ, nhưng nó xóa hẳn một lớp va chạm: hai agent không đặt trùng vì không gian tên không giao nhau. Đồng thời, một tag lạ xuất hiện trong log đã mang sẵn manh mối về owner cần tìm.

*Chặn:* va chạm 6.
*Kiểm bằng máy:* quét mọi khai báo tag/kênh/id, kiểm tiền tố khớp thư mục chứa nó.

### L10. Phụ thuộc phải khai báo ở đúng một chỗ, đọc được bằng máy

L9 cho biết một danh từ thuộc về ai; L10 cho biết feature đang phụ thuộc vào những danh từ nào. Học từ `@editable` của Verse, mỗi tính năng có đúng một file khai báo với định dạng cố định, ghi rõ: nó cần interface lõi nào, nghe và phát kênh nào, gắn component nào vào loại actor nào, đọc bảng dữ liệu nào.

Giá trị chính không phải vẻ gọn gàng của manifest. Giá trị là **máy dựng lại được đồ thị phụ thuộc thật của cả project** rồi so với đồ thị được phép. Khi dependency nằm rải trong thân hàm, không một script đơn giản nào có thể chứng minh đồ thị khai báo khớp với đồ thị thực.

*Chặn:* gián tiếp cả 4 và 6, bằng cách làm mọi thứ nhìn thấy được.
*Kiểm bằng máy:* đối chiếu file khai báo với những gì code thật sự dùng; lệch nhau thì báo lỗi.

## Nhóm D — Chất lượng và kiểm chứng

### L11. C++ tối đa, Blueprint chỉ ở tầng trình bày

Mọi logic — trạng thái, luật, tính toán, quyền, mạng, lưu trữ — nằm trong C++. Blueprint chỉ được dùng cho ba việc: kế thừa từ một lớp C++ để chỉnh thông số hiển thị, ghép hình ảnh và hiệu ứng, và bố cục giao diện.

Lý do không phải là Blueprint dở. Hai tính chất của nó chỉ không hợp với bài toán đang giải: file nhị phân không merge được, và agent không thể sinh ra nó bằng cách viết văn bản. Mỗi phần logic đặt trong Blueprint trở thành phần mà agent không sửa trực tiếp được và hai người không thể cùng chỉnh một cách an toàn.

Chỗ nào buộc phải làm bằng Blueprint thì tài liệu của tính năng đó phải có mục **hướng dẫn từng bước bằng lời**, đủ để một người mở editor lên làm theo mà không cần đoán.

*Kiểm bằng máy:* đếm nút trong Blueprint, cảnh báo khi vượt ngưỡng; chặn Blueprint chứa biến trạng thái được đồng bộ.

### L12. Mọi thay đổi trạng thái đều để lại một dòng log theo định dạng chuẩn

Mỗi lần một chủ sở hữu thay đổi trạng thái của mình, nó ghi một dòng: hệ thống nào, ai yêu cầu, tác động lên ai, giá trị trước và sau, nguyên nhân.

L12 là khoản đối ứng bắt buộc của L2. Khi feature không còn gọi thẳng nhau, ta mất một phần khả năng đọc code để biết ai gọi ai. Khả năng ấy phải được mua lại dưới dạng quan sát runtime: log cho biết thực tế điều gì đã xảy ra, do ai yêu cầu và state đã đổi ra sao. Bỏ L12 đi, L2 dễ biến một kiến trúc decoupled thành một hộp đen.

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

Bảng tra ngược cho thấy cả bảy va chạm đều có ít nhất một hàng rào. Nhưng cột bên phải cũng phơi ra điểm yếu: **va chạm 6 cần tới ba luật mà vẫn chưa chắc chắn.** Chống trùng khái niệm không phải bài toán kỹ thuật thuần túy; nó cần một danh mục được duy trì và một quy trình phân công. Đó là việc của chương sau.

## 11.2 — Ba điều Paldark làm khác Lyra, nói cho rõ

Đến đây cần đặt Paldark cạnh nguồn cảm hứng để thấy những chỗ đã chủ động đổi, tránh hiểu bộ luật như một bản sao Lyra:

**Cấu hình là văn bản chứ không phải asset (L7).** Lyra đặt Experience, PawnData, AbilitySet, Item Definition vào file nhị phân. Với studio thì hợp lý; với nghìn agent thì không dùng được. Đây là khác biệt lớn nhất.

**Cấm gọi thẳng, không chỉ khuyến khích tránh (L2).** Lyra có Gameplay Message như một lựa chọn. Paldark biến nó thành đường duy nhất, và có script chặn.

**Mọi luật đều phải có script kiểm (L1–L12).** Lyra có quy ước, tài liệu và ví dụ mẫu. Paldark coi bộ script kiểm tra là **một phần của kiến trúc**, không phải phụ kiện. Luật nào không viết được script kiểm thì phải sửa lại cho tới khi viết được, hoặc bỏ.

## 11.3 — Cái các luật này chưa giải quyết

Mười hai luật thu hẹp đáng kể không gian lỗi, nhưng không khép kín mọi tình huống. Những giới hạn sau cần được giữ lại như các khoản nợ đã biết, thay vì bị che bởi một bảng luật trông hoàn chỉnh:

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

Các quyết định trong bảng là chỗ bộ luật đi từ nguyên tắc sang contract có thể dùng. Chúng không xóa nhu cầu của danh mục; ngược lại, càng nhiều tên có ánh xạ cơ học thì danh mục càng cần trở thành nguồn tra cứu chung. Chương 12 sẽ dựng chính nguồn tra cứu đó, bắt đầu từ khái niệm và quyền ghi.

---

**Bằng chứng cho chương này.** Mười hai luật là thiết kế của tài liệu này (INFERRED), rút ra từ phân tích ở các chương 6–10. Cơ sở của từng luật đã được dẫn nguồn tại chương tương ứng: cơ chế Lyra ở Chương 7, số đo chi phí ở Chương 8, mô hình device/`@editable`/event của Verse ở Chương 9, và mô hình định nghĩa – thực thể – mảnh cùng con số 149 file C++ ở Chương 10. Sự tồn tại của `scripts/ci/check_paldarkv2_headers.py`, `check_paldarkv2_tags.py`, `validate_paldarklab.py` và `validate_paldarkv3.py` trong repo là OBSERVED, và Chương 19 sẽ đối chiếu từng luật với script tương ứng. Rủi ro hiệu năng nêu ở 11.3 chưa có số đo, ghi nhận là chưa kiểm chứng.
