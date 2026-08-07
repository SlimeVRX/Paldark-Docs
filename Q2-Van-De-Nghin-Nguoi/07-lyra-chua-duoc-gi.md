# Chương 7 — Lyra chữa được gì

Chương trước ta kết thúc bằng bảy va chạm và hai nguyên nhân gốc. Bây giờ mở Lyra ra.

Nhưng ta sẽ không học Lyra theo cách thông thường. Cách thông thường là đọc một danh sách: Lyra có Game Feature Plugin, có Experience, có Modular Gameplay, có GAS, có CommonUI, có Asset Manager, có Gameplay Message. Đọc xong danh sách đó, người mới thường có đúng một cảm giác: *nhiều quá, và không hiểu vì sao cần từng cái.*

Đó là lý do Lyra bị mang tiếng dốc. Không phải vì từng phần khó — mà vì nó được giới thiệu như một bộ sưu tập thay vì như một chuỗi câu trả lời.

Nên ta làm ngược. Với mỗi trụ của Lyra, hỏi đúng một câu: **nó đang chữa va chạm nào trong bảy va chạm ở Chương 6?** Cái nào không chữa va chạm nào thì ta ghi nhận là chi phí thuần túy, và Chương 8 sẽ tính sổ.

Nhắc lại bảy va chạm cho tiện tra:

| # | Va chạm |
|---|---|
| 1 | Nhiều agent cùng sửa file descriptor / build |
| 2 | Nhiều agent cùng sửa một enum |
| 3 | Nhiều agent cùng thêm biến vào lớp cơ sở |
| 4 | Tính năng gọi thẳng vào tính năng khác |
| 5 | Nhiều agent cùng sửa một asset nhị phân |
| 6 | Hai agent tạo hai khái niệm trùng nhau |
| 7 | Hai agent cùng ghi vào một trạng thái |

## 7.1 — Game Feature Plugin: dời ngã tư ra khỏi đường đi

**Vấn đề nó chữa: va chạm 1 và 5.**

Trong một project Unreal bình thường, mọi thứ nằm chung: code trong một module, asset trong một thư mục `Content`, module khai báo trong một file `.uproject`. Thêm tính năng nào cũng phải quay lại sửa mấy file trung tâm đó.

Game Feature Plugin đảo lại: **một tính năng là một plugin, có thư mục riêng, module riêng, thư mục Content riêng, và file mô tả riêng của chính nó.** Agent làm tính năng cung ngồi hẳn trong `Plugins/GameFeatures/Archery/`. Agent làm chuồng nuôi ngồi trong `Plugins/GameFeatures/BreedFarm/`. Hai người không có một file nào chung.

Điều này quan trọng hơn vẻ ngoài của nó. Nó không chỉ là "sắp xếp cho gọn". Nó chuyển việc khai báo tính năng từ **sửa một file chung** thành **thêm một file mới** — và đó chính là thao tác duy nhất mà Git xử lý được hoàn hảo khi nhiều người làm song song. Hai người thêm hai file khác nhau thì không bao giờ conflict, kể cả khi làm cùng lúc.

Có một điều kiện kèm theo mà tài liệu Lyra nhấn rất mạnh, và người học hay mắc: **plugin không được tham chiếu ngược ra asset của game gốc.** Chiều phụ thuộc chỉ có một: game gốc biết plugin, plugin không biết game gốc. Trong khóa 15, người dạy vấp đúng lỗi này khi để `B_Hero_Default` nằm ngoài plugin rồi phải chuyển nó vào trong. Ông giữ nguyên cái lỗi đó trong bài giảng thay vì cắt đi — cách dạy rất đúng, vì lỗi này ai cũng sẽ mắc một lần.

**Cái nó không chữa:** plugin vẫn phải khai báo dependency của mình, và hai plugin vẫn có thể phụ thuộc lẫn nhau. Va chạm 4 chưa được đụng tới.

## 7.2 — Experience: thay kế thừa bằng danh sách

**Vấn đề nó chữa: va chạm 3.**

Cách truyền thống để quyết định "màn chơi này có gì" là viết một lớp GameMode. Muốn chế độ khác thì kế thừa ra lớp GameMode khác. Vấn đề xuất hiện khi có mười chế độ và năm mươi tính năng: cây kế thừa phình ra, và mỗi tính năng mới lại phải chen vào một tầng nào đó của cây.

Lyra bỏ hẳn hướng đó. Một Experience là **một mẩu dữ liệu chứa danh sách**: dùng những plugin nào, pawn mặc định là gì, gắn thêm component nào vào ai. Không có kế thừa. Đổi chế độ chơi là đổi dữ liệu, không phải viết lớp mới.

Đây chính là khuôn mẫu 3 ở Chương 6 — mở rộng bằng dữ liệu — áp vào chỗ quan trọng nhất của game.

Với một nghìn agent, ý nghĩa của nó là: agent thêm tính năng **không cần biết game có bao nhiêu chế độ chơi**. Nó chỉ cần đóng gói tính năng thành plugin và khai báo cách gắn. Ai muốn dùng thì thêm tên plugin vào Experience của mình.

**Cái nó không chữa:** bản thân file Experience lại là một file dùng chung mới. Nếu năm mươi tính năng đều phải có tên trong một Experience duy nhất, ta vừa xóa một ngã tư và dựng lại một ngã tư khác. Lyra giảm nhẹ bằng Action Set — gom từng nhóm khai báo thành asset riêng — nhưng không xóa hẳn. Đây là điểm Paldark sẽ phải làm khác, và ta bàn ở Chương 11.

## 7.3 — Modular Gameplay: gắn hành vi từ bên ngoài

**Vấn đề nó chữa: va chạm 3, triệt để hơn.**

Đây là trụ mà tôi cho là quan trọng nhất trong toàn bộ Lyra, và cũng là trụ dễ giải thích nhất.

Câu hỏi: agent muốn cho sinh vật có chỉ số đói. Chỉ số đó phải sống ở đâu?

Bản năng nói: thêm vào lớp sinh vật. Nhưng lớp sinh vật là tài sản chung — mười agent cùng thêm thì mười người cùng sửa một file, và lớp đó phình lên thành nơi chứa mọi thứ.

Modular Gameplay trả lời: **viết hẳn một component riêng, rồi khai báo trong plugin của mình rằng "gắn component này vào loại actor kia".** Lớp sinh vật không đổi một dòng nào. Lúc chạy, hệ thống đọc khai báo và gắn component vào.

Hệ quả rất mạnh và đáng dừng lại một chút. Nó có nghĩa là **lớp cơ sở không còn là ngã tư nữa**. Trong project thường, lớp nhân vật là file bị sửa nhiều nhất; ở đây nó gần như không bao giờ bị sửa. Mười agent thêm mười hành vi thì có mười file mới và không có file nào bị đụng chung.

Cái giá: logic bị phân tán. Bạn không còn mở lớp nhân vật ra là thấy nó có gì. Muốn biết một nhân vật lúc chạy có những gì, phải đi ngược qua Experience và các plugin đang bật. Đây là đánh đổi thật, và với một người code thì nó là bước lùi. Với một nghìn agent thì nó là điều kiện sống còn.

## 7.4 — GAS: một cái khung chung cho mọi thứ "gây ảnh hưởng"

**Vấn đề nó chữa: va chạm 6 và 7.**

Đây là chỗ nhiều người thấy sợ nhất, nên tôi sẽ tiếp cận nó bằng đúng câu hỏi va chạm chứ không giảng GAS như một hệ thống.

Nhớ lại va chạm 7: agent làm hệ đói trừ máu, agent làm hiệu ứng bỏng cũng trừ máu, hai đường ghi độc lập vào cùng một biến, và không ai truy được nguyên nhân khi con vật chết.

Gốc của vấn đề là **máu đang là một biến ai cũng ghi được**. Chừng nào nó còn là một biến công khai, mọi luật lệ đều chỉ là lời hứa.

GAS chữa bằng cách làm ba việc:

- Chỉ số không còn là biến thường mà nằm trong một **AttributeSet**, và không ai được gán thẳng.
- Mọi thay đổi phải đi qua một **GameplayEffect** — một mẩu dữ liệu mang theo ngữ cảnh: ai gây, bằng cái gì, giá trị bao nhiêu, thuộc loại nào.
- Mọi hành động chủ động nằm trong một **GameplayAbility** với vòng đời chuẩn hóa: kích hoạt, chi phí, hồi chiêu, hủy.

Kết quả trực tiếp cho bài toán của ta: bây giờ hệ đói và hiệu ứng bỏng **không còn hai đường ghi nữa**, chúng có cùng một đường, và mỗi lần đi qua đường đó đều để lại dấu vết ghi được vào log. Câu hỏi "vì sao con vật chết" từ không trả lời được trở thành trả lời được bằng một dòng log.

Còn va chạm 6 — hai agent tạo hai khái niệm trùng nhau — được chữa một phần bởi **GameplayTag**. Tag là một danh từ chung có phân cấp, ví dụ `Damage.Element.Fire`. Khi cả hai agent đều buộc phải mô tả "sát thương hệ lửa" bằng đúng cái tag đó thay vì bằng struct tự nghĩ, khái niệm trùng lặp không sinh ra được. Tag chính là khuôn mẫu 1 ở Chương 6 — nói qua danh từ chung.

Tôi nói "một phần" vì tag chỉ chống trùng nếu có ai đó quản lý danh sách tag. Bản thân cơ chế tag không ngăn hai agent tạo hai tag gần giống nhau. Vấn đề quản lý danh mục là Chương 12.

Còn một chi tiết thiết kế của GAS rất đáng học, vì nó là câu trả lời cho một câu hỏi mà ta sẽ gặp lại nhiều lần. Khi nhiều thứ cùng tác động lên một con số cuối, ai là người quyết định con số đó? Cách của GAS là dùng một chỉ số trung gian không replicate: hiệu ứng không trừ thẳng máu, nó cộng vào một ô "sát thương đang tới"; hệ thống bên nhận mới đọc ô đó, tính giáp, tính chí mạng, tính kháng hệ, rồi mới trừ máu. Người gây sát thương **đề nghị**, người nhận **quyết định**. Với một nghìn agent, đây là nguyên tắc vàng: bên sở hữu trạng thái là bên duy nhất được quyết định trạng thái đó thay đổi thế nào.

## 7.5 — Gameplay Message: cắt sợi dây cuối cùng

**Vấn đề nó chữa: va chạm 4.**

Đây là trụ nhỏ nhất về mặt code và lớn nhất về mặt kiến trúc.

Tính năng "bảng xếp hạng hạ gục" cần biết khi nào có ai đó bị hạ. Cách thường: bảng xếp hạng `#include` header của hệ chiến đấu, đăng ký một delegate. Sợi dây được nối, và hai agent giờ ràng buộc nhau.

Gameplay Message thay bằng: hệ chiến đấu phát một thông điệp lên kênh mang nhãn `Gameplay.Elimination` kèm dữ liệu. Bảng xếp hạng đăng ký nghe kênh đó. **Hai bên không hề `#include` nhau.** Xóa tính năng bảng xếp hạng đi thì hệ chiến đấu không biết và không quan tâm.

Nếu bạn chỉ mang một thứ từ Lyra về, mang cái này. Nó là công cụ trực tiếp nhất để đưa số sợi dây giữa các tính năng từ `n×(n-1)/2` xuống gần bằng số kênh.

Cái giá cũng thật và cần nói rõ: bạn mất khả năng nhìn code mà truy ra ai gọi ai. Bấm "find references" không còn ra kết quả. Bù lại phải bằng hai thứ: danh mục kênh được ghi ở một chỗ (Chương 12), và log ghi lại mọi lần phát/nhận (Chương 18). Thiếu hai thứ đó thì decoupling biến thành không thể debug — và đây là chỗ nhiều project áp dụng pattern này rồi thất bại.

## 7.6 — Asset Manager và CommonUI

Hai trụ này tôi xếp riêng, vì thành thật mà nói **chúng không chữa va chạm nào cả**.

Asset Manager là cơ chế quét và nạp tài sản bất đồng bộ. Nó cần thiết cho một game lớn, nhưng nó là chi phí vận hành, không phải công cụ chống va chạm. Tệ hơn, nó là nguồn của một loại lỗi rất khó chịu với người mới: asset biên dịch xong, nằm đúng chỗ, mà hệ thống không thấy — vì kiểu asset chưa được đăng ký đường quét. Tài liệu khóa 15 phải ghi hẳn cách xử lý, kể cả mẹo khởi động lại editor.

CommonUI thì có chữa được một phần va chạm 5, ở chỗ nó cho phép widget của các tính năng khác nhau xin một "chỗ" trên HUD theo nhãn thay vì cùng sửa một asset HUD. Nhưng phần còn lại của CommonUI — hệ tầng, định tuyến input, ngăn xếp widget — là chi phí học tập thuần túy đối với bài toán của ta.

Tôi nêu thẳng điều này vì mục tiêu của tài liệu là hạ dốc học tập. Cách hạ dốc không phải là giấu độ phức tạp, mà là chỉ rõ chỗ nào đắt để ta chủ động chọn không dùng.

## 7.7 — Bảng tổng kết

| Trụ Lyra | Chữa va chạm | Cơ chế thật sự là gì | Có nên giữ cho Paldark |
|---|---|---|---|
| Game Feature Plugin | 1, 5 | Thêm file mới thay vì sửa file chung | Giữ, đây là nền |
| Experience | 3 | Danh sách bằng dữ liệu thay cho kế thừa | Giữ ý tưởng, phải sửa chỗ file dùng chung |
| Modular Gameplay | 3 | Gắn hành vi từ ngoài, lớp cơ sở bất động | Giữ, quan trọng nhất |
| GAS | 6, 7 | Một đường duy nhất để đổi trạng thái, có ngữ cảnh | Giữ, nhưng chỉ phần lõi |
| GameplayTag | 6 | Danh từ chung thay cho kiểu tự chế | Giữ, cần thêm cách quản danh mục |
| Gameplay Message | 4 | Nói qua kênh, không qua tên lớp | Giữ, dùng mạnh hơn cả Lyra |
| Asset Manager | không | Nạp tài sản bất đồng bộ | Cần, nhưng phải giấu bớt |
| CommonUI | 5 một phần | Widget xin chỗ theo nhãn | Chỉ lấy phần điểm cắm |

Nhìn cột thứ hai sẽ thấy điều đáng chú ý: **Lyra chữa được sáu trong bảy va chạm**, và trụ nào cũng quy về đúng ba khuôn mẫu ở Chương 6. Lyra không phải bảy phát minh rời rạc; nó là ba ý tưởng được áp vào bảy chỗ khác nhau. Hiểu như vậy thì Lyra bớt đáng sợ đi rất nhiều.

Va chạm còn lại — hai agent nghĩ ra hai khái niệm trùng nhau — Lyra không chữa, vì như đã nói ở Chương 6, đó không phải vấn đề code.

Chương sau ta tính tiền.

---

**Bằng chứng cho chương này.** Mô tả các trụ Lyra dựa trên khảo sát tài liệu khóa 14 (Exploring Lyra), 15 (Build an RPG using Lyra Framework) và 17 (Hipernova Lyra Inventory) trong repo. Chi tiết lỗi tham chiếu ngược khi `B_Hero_Default` nằm ngoài plugin, và việc phải đăng ký kiểu asset với Asset Manager kèm mẹo khởi động lại editor, là OBSERVED từ transcript khóa 15. Cơ chế chỉ số trung gian không replicate trong tính sát thương là OBSERVED từ khóa 11 (GAS Top-Down RPG), bài `13 - Damage/001 Meta Attributes`. Việc quy bảy trụ về ba khuôn mẫu là diễn giải của tài liệu này (INFERRED), không phải cách Epic trình bày.
