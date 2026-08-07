# Chương 17 — Blueprint được làm gì

Một agent nhận việc “thêm animation cho Pal” có thể mở editor, kéo vài asset vào một Blueprint rồi giao kết quả. Một agent khác nhận việc “thêm trạng thái đói” cũng có thể làm một việc trông tương tự: mở Blueprint nhân vật, thêm một biến, nối một vài node, rồi thấy mọi thứ chạy trong PIE.

Hai việc đó nhìn giống nhau ở màn hình editor nhưng không giống nhau về kiến trúc. Animation là phần trình bày. Đói là state, có luật giảm theo thời gian, có quyền ghi, có thể ảnh hưởng năng suất hoặc máu, có thể phải replicate và có thể phải save. Nếu để cả hai vào Blueprint, project mất khả năng phân biệt phần nào là luật của game và phần nào chỉ là cách trình bày luật đó.

Vấn đề còn nặng hơn khi có một nghìn agent. Blueprint là asset nhị phân: Git không merge được hai người cùng sửa một file. Agent không thể tạo một Blueprint bằng cách gửi patch text như với `.h`, `.cpp`, JSON hay CSV. Reviewer cũng không thể đọc diff để biết một nhánh quyết định đã đổi từ “trừ 10” sang “trừ 100”. Không phải Blueprint dở. Nó chỉ là một công cụ không phù hợp để làm nơi chứa phần logic cần được nhiều người tạo, review và kiểm tra tự động.

Đó là lý do L11 không nói “cấm Blueprint”. L11 nói phải đặt đúng ranh giới.

## 17.1 — Ranh giới giữa C++ và Blueprint

Bảng dưới đây là hợp đồng làm việc, không phải sở thích style. Nếu một việc ảnh hưởng đến state mà nhiều hệ thống khác cần nhìn thấy, nó thuộc C++. Nếu một việc chỉ thay đổi cách người chơi nhìn hoặc nghe state đó, Blueprint có thể làm.

| Việc | Nơi thực hiện | Vì sao |
|---|---|---|
| Khai báo state runtime: health, hunger, inventory, progress, owner | C++ | Có type, owner và nơi ghi rõ để L8 kiểm tra |
| Luật tính toán và validation | C++ | Reviewer đọc được diff; test gọi được trực tiếp |
| Quyền ghi và server authority | C++ | Không để client tự quyết state |
| Replication, `OnRep`, RPC và relevancy | C++ | Đây là contract mạng, không phải dây nối trình bày |
| Save/load và migration | C++ | Cần schema, version và round-trip có thể tự động hóa |
| Đăng ký dữ liệu, tag, channel, command | C++ hoặc file text | Máy quét được; không giấu danh mục trong asset nhị phân |
| Kế thừa lớp C++ để chỉnh thông số hiển thị | Blueprint | Ví dụ chọn mesh, animation class, material, âm thanh |
| Ghép mesh, material, VFX, âm thanh | Blueprint | Đây là composition của presentation asset |
| Animation Blueprint | Animation Blueprint | Nó đọc state đã có, không sở hữu luật state |
| Bố cục widget và binding hiển thị | Widget Blueprint | UI quyết định trình bày, không quyết định kết quả gameplay |
| Một đoạn glue rất nhỏ chỉ chuyển event thành presentation | Vùng xám | Chỉ được giữ nếu không tạo hoặc sửa gameplay state |

“Vùng xám” không có nghĩa là agent được tự chọn. Nó phải trả lời ba câu hỏi trước khi dùng Blueprint:

1. Node này có ghi một biến mà hệ thống khác xem là sự thật không?
2. Nếu xóa Blueprint, luật gameplay có thay đổi không?
3. Một test headless có gọi và kiểm tra đoạn này mà không cần mở editor không?

Nếu câu trả lời cho một trong hai câu đầu là “có”, đưa phần quyết định về C++. Blueprint chỉ giữ phần gọi, hiển thị hoặc chọn asset. Nếu câu thứ ba là “không”, đó là dấu hiệu logic đang bị giấu sai chỗ.

## 17.2 — Ba quy tắc không thương lượng

Mọi Blueprint gameplay đều phải kế thừa từ một lớp C++ đã tồn tại. `BP_PaldarkPlayer` có thể kế thừa `APaldarkPlayerCharacter`; `BP_PaldarkPal` có thể kế thừa `APaldarkPalCharacter`; widget có thể kế thừa `UPaldarkStatusWidget`. Không tạo một Blueprint “tự do” rồi dùng nó như lớp cơ sở mới cho cả project.

Blueprint không được khai báo biến replicated. Nếu một giá trị cần đi qua mạng, nó phải xuất hiện trong property hoặc component C++ có owner rõ ràng. Blueprint có thể đọc giá trị đó để hiện thanh máu, nhưng không được biến thanh máu thành nơi quyết định máu.

Blueprint cũng không được chứa nhánh quyết định trạng thái game. Một node `Branch` để chọn VFX khi `HealthPercent < 0.25` là presentation. Một node `Branch` để quyết định `Health = 0` là gameplay logic và phải ở C++. Ranh giới nằm ở tác động, không nằm ở việc node trông đơn giản hay phức tạp.

## 17.3 — Mẫu hướng dẫn Blueprint từng bước

Có những việc thật sự nên làm trong editor. Chọn skeletal mesh, gán Animation Blueprint hoặc bố trí widget không phải việc nên biến thành hàng trăm dòng C++. Nhưng nếu tài liệu chỉ viết “tạo một Blueprint rồi gán mesh”, agent kế tiếp vẫn phải đoán tên asset, parent class, panel và kết quả mong đợi.

Mỗi tính năng có thao tác Blueprint bắt buộc phải dùng mẫu sau:

| Mục | Nội dung bắt buộc |
|---|---|
| Tiền đề | Module, lớp C++ cha, asset và map cần có trước khi mở editor |
| Bước 1, 2, 3… | Tên chính xác của asset, menu, panel, node và property |
| Kết quả mong đợi | Điều gì phải xuất hiện hoặc thay đổi sau từng nhóm bước |
| Cách kiểm tra | Preview, Details panel, compile result, log hoặc console command dùng để xác nhận |
| Ranh giới | Blueprint được phép chỉnh gì và tuyệt đối không được thêm gì |
| Lỗi thường gặp | Parent sai, asset ngoài plugin, chưa compile, hoặc biến logic bị tạo nhầm trong Blueprint |

### Ví dụ hoàn chỉnh — tạo Blueprint nhân vật từ lớp C++

**Tiền đề.** Module `PaldarkLab` đã compile và có lớp `APaldarkPlayerCharacter`. Asset mesh `SKM_Manny_Simple` tồn tại trong project. `ABP_PaldarkPlayer` là Animation Blueprint hợp lệ, đọc movement state từ character nhưng không tự ghi health hoặc movement speed. Người thực hiện đang ở Content Browser trong thư mục `Paldark/Presentation/Player`.

**Bước 1 — tạo lớp con đúng parent.**

1. Trong Content Browser, mở thư mục `Paldark/Presentation/Player`.
2. Chọn **Add (+) → Blueprint Class**.
3. Trong cửa sổ **Pick Parent Class**, chọn **All Classes**.
4. Tìm chính xác `PaldarkPlayerCharacter`, chọn lớp C++ đó và bấm **Select**.
5. Đặt tên asset là `BP_PaldarkPlayerPresentation`.

Kết quả mong đợi: mở **Class Settings** sẽ thấy `Parent Class: PaldarkPlayerCharacter`. Nếu parent là `Character`, `Pawn` hoặc một Blueprint khác, dừng lại và xóa asset sai; không tiếp tục gán presentation lên lớp sai.

**Bước 2 — gán mesh.**

1. Mở `BP_PaldarkPlayerPresentation`.
2. Trong **Components**, chọn component mesh kế thừa từ lớp C++.
3. Trong **Details → Mesh**, gán `SKM_Manny_Simple`.
4. Kiểm tra **Animation Mode** là `Use Animation Blueprint`.
5. Ở **Anim Class**, chọn `ABP_PaldarkPlayer`.

Kết quả mong đợi: viewport Blueprint hiển thị mannequin và preview animation. Không tạo biến `Health`, `MaxWalkSpeed`, `OwnerPlayerId` hoặc bất kỳ property replicated nào trong **My Blueprint → Variables**. Các giá trị đó thuộc lớp C++ hoặc component C++.

**Bước 3 — compile và kiểm tra asset.**

1. Bấm **Compile** trên thanh công cụ Blueprint.
2. Mở **Class Settings** và xác nhận parent vẫn là `PaldarkPlayerCharacter`.
3. Bấm **Save**.
4. Chạy PIE, dùng `Paldark.Input.ListBindings` để xác nhận input vẫn do hệ C++/input layer cung cấp.
5. Mở Output Log và kiểm tra không có lỗi load `SKM_Manny_Simple` hoặc `ABP_PaldarkPlayer`.

Kết quả mong đợi: nhân vật xuất hiện với mesh và animation đúng, input và state cũ vẫn chạy, còn Blueprint chỉ chứa lựa chọn presentation. Nếu muốn đổi tốc độ chạy, không thêm node `Set Max Walk Speed` vào Blueprint; sửa contract movement trong C++ và để Blueprint chỉ chọn asset hiển thị nếu cần.

**Cách kiểm tra bằng máy.** Script có thể đọc asset registry hoặc export metadata để kiểm ba điều: parent class của Blueprint có nằm trong allow-list lớp C++ không; Blueprint có property replication hoặc biến mang tên state bị cấm không; số node executable có vượt ngưỡng không. Với project thực tế, kiểm tra asset nhị phân vẫn cần một bước Unreal/Python hoặc commandlet; không nên giả vờ rằng `grep` đọc được nội dung `.uasset`.

## 17.4 — Máy kiểm tra L11

L11 cần ba lớp kiểm, vì một lớp chỉ bắt được một phần vi phạm:

| Kiểm tra | Quy tắc đề xuất | Kết quả |
|---|---|---|
| Parent audit | Mọi Blueprint gameplay phải có parent nằm trong danh sách C++ được phép | Blueprint không có lớp cha C++ bị fail |
| Replication audit | Không cho Blueprint khai báo replicated variable hoặc property state | State không bị giấu trong asset nhị phân |
| Node budget | Cảnh báo từ 25 node executable, fail từ 50; widget/animation có allow-list riêng | Logic lớn không thể trốn vào Blueprint |
| Presentation allow-list | Mesh, material, animation class, audio, Niagara và widget layout được phép; mutation/state node bị hạn chế | Blueprint giữ đúng tầng |
| Asset boundary | Blueprint trong plugin chỉ tham chiếu asset nằm trong dependency được khai báo | Không tạo tham chiếu ngược ra game/plugin khác |

Ngưỡng node không phải chân lý về độ phức tạp. Một node `Set Health` đã sai dù chỉ có một node; một animation graph có thể cần nhiều node hơn 50. Vì vậy node budget là tín hiệu để review, còn audit property, parent và loại node mới là hàng rào. Với Animation Blueprint và Widget Blueprint, validator cần allow-list riêng thay vì áp cùng một con số mù.

Khi một agent gửi feature, review không nên hỏi “Blueprint có đẹp không?”. Câu hỏi phải là: state nằm ở đâu, ai ghi, Blueprint đang đọc gì, và nếu xóa toàn bộ asset presentation thì test C++ có còn chứng minh được luật hay không. Đó là cách biến L11 từ khẩu hiệu thành ranh giới có thể làm việc.

---

**Bằng chứng cho chương này.** L11 và các ranh giới C++/Blueprint là thiết kế kiến trúc Paldark (INFERRED), được rút ra từ Chương 11 và các va chạm file nhị phân ở Chương 6. Việc PaldarkLab hiện có Blueprint cho AI, animation, build definition và UI trong `PaldarkLab/Content/Paldark/` là OBSERVED; tài liệu này không biến sự tồn tại của các asset đó thành bằng chứng rằng runtime logic nên nằm trong Blueprint. Các category, command và lớp C++ được nhắc trong ví dụ dựa trên source PaldarkLab hiện có. Ngưỡng 25/50 node là đề xuất kiểm soát (INFERRED), chưa phải ngưỡng đã được đo trên toàn repo.
