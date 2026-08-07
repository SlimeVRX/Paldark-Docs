# Chương 7 — Lyra chữa được gì

Chương trước kết thúc ở một câu hỏi chưa có lời giải cụ thể: làm sao xóa file dùng chung và cắt tham chiếu trực tiếp mà game vẫn phối hợp được? Bây giờ ta mở Lyra ra, không phải để lấy nguyên một framework, mà để xem nó đã trả lời câu hỏi ấy ở những chỗ nào.

Nhưng ta sẽ không học Lyra theo cách thông thường. Cách thông thường là đọc một danh sách: Lyra có Game Feature Plugin, có Experience, có Modular Gameplay, có GAS, có CommonUI, có Asset Manager, có Gameplay Message. Đọc xong danh sách đó, người mới thường có đúng một cảm giác: *nhiều quá, và không hiểu vì sao cần từng cái.*

Đó là lý do Lyra thường bị xem là dốc. Từng phần riêng lẻ chưa chắc đã khó; cái khó là chúng thường được giới thiệu như một bộ sưu tập tên gọi thay vì như một chuỗi câu trả lời có nguyên nhân.

Ta sẽ đi theo chiều ngược lại. Với mỗi trụ của Lyra, câu hỏi đầu tiên là: **nó đang chữa va chạm nào trong bảy va chạm ở Chương 6?** Nếu một trụ không chữa va chạm nào, ta vẫn ghi nhận công dụng của nó, nhưng không dùng công dụng ấy để che đi chi phí. Chương 8 sẽ tính phần chi phí đó.

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

Hãy quay lại cảnh hai agent cùng thêm module ở Chương 6. Trong một project Unreal bình thường, code nằm trong một module, asset nằm dưới một thư mục `Content`, còn module được khai báo trong một file `.uproject`. Feature mới vì thế luôn phải quay lại vài file trung tâm.

Game Feature Plugin đảo lại: **một tính năng là một plugin, có thư mục riêng, module riêng, thư mục Content riêng, và file mô tả riêng của chính nó.** Agent làm tính năng cung ngồi hẳn trong `Plugins/GameFeatures/Archery/`. Agent làm chuồng nuôi ngồi trong `Plugins/GameFeatures/BreedFarm/`. Hai người không có một file nào chung.

Sự thay đổi này sâu hơn chuyện “sắp xếp cho gọn”. Nó chuyển thao tác khai báo feature từ **sửa một file chung** thành **thêm một file mới**. Git xử lý trường hợp nhiều người thêm những file khác nhau tốt hơn hẳn trường hợp họ cùng chạm vào một điểm trung tâm, nên ranh giới plugin trực tiếp làm giảm xác suất conflict.

Có một điều kiện kèm theo mà tài liệu Lyra nhấn rất mạnh, và người học hay mắc: **plugin không được tham chiếu ngược ra asset của game gốc.** Chiều phụ thuộc chỉ có một: game gốc biết plugin, plugin không biết game gốc. Trong khóa 15, người dạy vấp đúng lỗi này khi để `B_Hero_Default` nằm ngoài plugin rồi phải chuyển nó vào trong. Ông giữ nguyên cái lỗi đó trong bài giảng thay vì cắt đi — cách dạy rất đúng, vì lỗi này ai cũng sẽ mắc một lần.

**Cái nó không chữa:** plugin vẫn phải khai báo dependency của mình, và hai plugin vẫn có thể phụ thuộc lẫn nhau. Va chạm 4 chưa được đụng tới.

## 7.2 — Experience: thay kế thừa bằng danh sách

**Vấn đề nó chữa: va chạm 3.**

Plugin cô lập được nội dung, nhưng game vẫn cần trả lời “màn chơi này bật những gì?”. Cách truyền thống là viết một lớp GameMode rồi kế thừa khi cần chế độ khác. Khi có mười chế độ và năm mươi tính năng, cây kế thừa phình ra; mỗi feature mới lại phải tìm một tầng để chen vào.

Lyra bỏ hẳn hướng đó. Một Experience là **một mẩu dữ liệu chứa danh sách**: dùng những plugin nào, pawn mặc định là gì, gắn thêm component nào vào ai. Không có kế thừa. Đổi chế độ chơi là đổi dữ liệu, không phải viết lớp mới.

Đây chính là khuôn mẫu 3 ở Chương 6 — mở rộng bằng dữ liệu — áp vào chỗ quan trọng nhất của game.

Ở quy mô một nghìn agent, lợi ích không nằm ở chuyện asset ngắn hơn class. Agent thêm tính năng **không cần biết game có bao nhiêu chế độ chơi**; nó chỉ đóng gói feature và khai báo cách gắn. Experience chịu trách nhiệm composition, còn feature không phải tự lần theo toàn bộ cây chế độ.

**Cái nó không chữa:** bản thân file Experience lại là một file dùng chung mới. Nếu năm mươi tính năng đều phải có tên trong một Experience duy nhất, ta vừa xóa một ngã tư và dựng lại một ngã tư khác. Lyra giảm nhẹ bằng Action Set — gom từng nhóm khai báo thành asset riêng — nhưng không xóa hẳn. Đây là điểm Paldark sẽ phải làm khác, và ta bàn ở Chương 11.

## 7.3 — Modular Gameplay: gắn hành vi từ bên ngoài

**Vấn đề nó chữa: va chạm 3, triệt để hơn.**

Experience chọn *cái gì* được bật; Modular Gameplay giải câu hỏi khó hơn: thứ đã bật đi vào actor bằng cách nào mà không sửa lớp cơ sở? Đây là trụ quan trọng nhất đối với bài toán của tài liệu, và cũng là trụ dễ thấy quan hệ nhân–quả nhất.

Câu hỏi: agent muốn cho sinh vật có chỉ số đói. Chỉ số đó phải sống ở đâu?

Bản năng nói: thêm vào lớp sinh vật. Nhưng lớp sinh vật là tài sản chung — mười agent cùng thêm thì mười người cùng sửa một file, và lớp đó phình lên thành nơi chứa mọi thứ.

Modular Gameplay trả lời: **viết hẳn một component riêng, rồi khai báo trong plugin của mình rằng "gắn component này vào loại actor kia".** Lớp sinh vật không đổi một dòng nào. Lúc chạy, hệ thống đọc khai báo và gắn component vào.

Hãy dừng ở hệ quả của phép gắn này: **lớp cơ sở không còn là ngã tư nữa**. Trong project thông thường, lớp nhân vật thường là file bị sửa nhiều nhất; ở đây nó gần như không đổi. Mười agent thêm mười hành vi sẽ tạo ra mười phần mở rộng riêng thay vì mười diff chồng lên cùng một class.

Cái giá: logic bị phân tán. Bạn không còn mở lớp nhân vật ra là thấy nó có gì. Muốn biết một nhân vật lúc chạy có những gì, phải đi ngược qua Experience và các plugin đang bật. Đây là đánh đổi thật, và với một người code thì nó là bước lùi. Với một nghìn agent thì nó là điều kiện sống còn.

## 7.4 — GAS: một cái khung chung cho mọi thứ "gây ảnh hưởng"

**Vấn đề nó chữa: va chạm 6 và 7.**

Khi hành vi đã được gắn tách rời, một vấn đề khác hiện ra: nhiều hành vi vẫn có thể cùng muốn đổi một trạng thái. Đây là lúc GAS xuất hiện. Thay vì giảng toàn bộ hệ thống, ta tiếp tục bám vào đúng va chạm cần chữa.

Nhớ lại va chạm 7: agent làm hệ đói trừ máu, agent làm hiệu ứng bỏng cũng trừ máu, hai đường ghi độc lập vào cùng một biến, và không ai truy được nguyên nhân khi con vật chết.

Gốc của vấn đề là **máu đang là một biến ai cũng ghi được**. Chừng nào nó còn là một biến công khai, mọi luật lệ đều chỉ là lời hứa.

GAS chữa bằng cách làm ba việc:

- Chỉ số không còn là biến thường mà nằm trong một **AttributeSet**, và không ai được gán thẳng.
- Mọi thay đổi phải đi qua một **GameplayEffect** — một mẩu dữ liệu mang theo ngữ cảnh: ai gây, bằng cái gì, giá trị bao nhiêu, thuộc loại nào.
- Mọi hành động chủ động nằm trong một **GameplayAbility** với vòng đời chuẩn hóa: kích hoạt, chi phí, hồi chiêu, hủy.

Kết quả trực tiếp là hệ đói và hiệu ứng bỏng **không còn hai đường ghi độc lập**. Chúng đi qua cùng một cơ chế, mang theo ngữ cảnh, và mỗi lần thay đổi đều có thể để lại dấu vết trong log. Câu hỏi “vì sao con vật chết?” từ chỗ phải đoán trở thành câu hỏi có dữ liệu để trả lời.

Còn va chạm 6 — hai agent tạo hai khái niệm trùng nhau — được chữa một phần bởi **GameplayTag**. Tag là một danh từ chung có phân cấp, ví dụ `Damage.Element.Fire`. Khi cả hai agent đều buộc phải mô tả "sát thương hệ lửa" bằng đúng cái tag đó thay vì bằng struct tự nghĩ, khái niệm trùng lặp không sinh ra được. Tag chính là khuôn mẫu 1 ở Chương 6 — nói qua danh từ chung.

Tôi nói "một phần" vì tag chỉ chống trùng nếu có ai đó quản lý danh sách tag. Bản thân cơ chế tag không ngăn hai agent tạo hai tag gần giống nhau. Vấn đề quản lý danh mục là Chương 12.

Còn một chi tiết thiết kế của GAS rất đáng học, vì nó là câu trả lời cho một câu hỏi mà ta sẽ gặp lại nhiều lần. Khi nhiều thứ cùng tác động lên một con số cuối, ai là người quyết định con số đó? Cách của GAS là dùng một chỉ số trung gian không replicate: hiệu ứng không trừ thẳng máu, nó cộng vào một ô "sát thương đang tới"; hệ thống bên nhận mới đọc ô đó, tính giáp, tính chí mạng, tính kháng hệ, rồi mới trừ máu. Người gây sát thương **đề nghị**, người nhận **quyết định**. Với một nghìn agent, đây là nguyên tắc vàng: bên sở hữu trạng thái là bên duy nhất được quyết định trạng thái đó thay đổi thế nào.

## 7.5 — Gameplay Message: cắt sợi dây cuối cùng

**Vấn đề nó chữa: va chạm 4.**

Đây là trụ nhỏ nhất về mặt code và lớn nhất về mặt kiến trúc.

GAS chuẩn hóa đường mutation, nhưng feature quan sát kết quả vẫn có thể nối dây trực tiếp. Chẳng hạn, bảng xếp hạng hạ gục cần biết khi nào có ai đó bị hạ. Cách thường là `#include` header của hệ chiến đấu rồi đăng ký một delegate; ngay khoảnh khắc ấy, hai agent đã bị ràng buộc với nhau.

Gameplay Message thay bằng: hệ chiến đấu phát một thông điệp lên kênh mang nhãn `Gameplay.Elimination` kèm dữ liệu. Bảng xếp hạng đăng ký nghe kênh đó. **Hai bên không hề `#include` nhau.** Xóa tính năng bảng xếp hạng đi thì hệ chiến đấu không biết và không quan tâm.

Nếu bạn chỉ mang một thứ từ Lyra về, mang cái này. Nó là công cụ trực tiếp nhất để đưa số sợi dây giữa các tính năng từ `n×(n-1)/2` xuống gần bằng số kênh.

Cái giá của việc cắt dây cũng rất thật: nhìn code không còn đủ để truy ra ai gọi ai, và “find references” không còn kể toàn bộ câu chuyện. Khả năng quan sát phải được mua lại bằng hai thứ: danh mục kênh ở một chỗ (Chương 12) và log cho mọi lần phát/nhận (Chương 18). Thiếu chúng, decoupling dễ biến thành một hệ thống không thể debug.

## 7.6 — Asset Manager và CommonUI

Đến đây sáu va chạm đã có câu trả lời tương đối rõ. Hai trụ còn lại cần được đặt riêng vì, xét đúng theo thước đo của chương này, **chúng không chữa va chạm nào cả**.

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

Nhìn cột thứ hai, ta thấy một kết quả rõ hơn mọi danh sách tính năng: **Lyra chữa được sáu trong bảy va chạm**, và các trụ đều quy về ba khuôn mẫu ở Chương 6. Lyra không còn là bảy phát minh rời rạc; nó là vài ý tưởng nhất quán được áp vào nhiều điểm của project. Khi quan hệ ấy hiện ra, độ dốc khái niệm giảm đi đáng kể.

Va chạm còn lại — hai agent nghĩ ra hai khái niệm trùng nhau — Lyra không chữa, vì như đã nói ở Chương 6, đó không phải vấn đề code.

Nhưng biết thứ gì có ích chưa đủ để quyết định dùng nó. Mỗi lớp trung gian, asset và vòng đời đều có giá. Chương sau sẽ tính khoản giá ấy bằng một thao tác nhỏ nhất có thể: thêm một món đồ vào game.

---

**Bằng chứng cho chương này.** Mô tả các trụ Lyra dựa trên khảo sát tài liệu khóa 14 (Exploring Lyra), 15 (Build an RPG using Lyra Framework) và 17 (Hipernova Lyra Inventory) trong repo. Chi tiết lỗi tham chiếu ngược khi `B_Hero_Default` nằm ngoài plugin, và việc phải đăng ký kiểu asset với Asset Manager kèm mẹo khởi động lại editor, là OBSERVED từ transcript khóa 15. Cơ chế chỉ số trung gian không replicate trong tính sát thương là OBSERVED từ khóa 11 (GAS Top-Down RPG), bài `13 - Damage/001 Meta Attributes`. Việc quy bảy trụ về ba khuôn mẫu là diễn giải của tài liệu này (INFERRED), không phải cách Epic trình bày.
