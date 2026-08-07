# Chương 4 — Từ tính năng ra trạng thái

Một designer nói: “Tôi muốn có hệ thống thợ làm việc khi người chơi đi vắng.” Một programmer nghe thành: “Tạo một AI worker.” Cả hai đều đang nói về cùng một feature, nhưng hai câu ấy chưa đủ gần nhau để bắt đầu code. Câu thứ nhất mô tả lời hứa với người chơi; câu thứ hai mới chỉ chọn một loại class, chưa nói class đó phải giữ điều gì hay chịu trách nhiệm tới đâu.

Khoảng cách đó được lấp bằng bốn câu hỏi. Chúng không nhằm làm tài liệu nặng hơn. Ngược lại, chúng ngăn ta viết rất nhiều code cho một state mà chưa ai biết ai sở hữu.

1. **Ai giữ trạng thái?**
2. **Ai được phép sửa?**
3. **Ai cần biết khi nó đổi?**
4. **Cái gì phải sống sót qua lần thoát game?**

Bốn câu này đủ nhỏ để hỏi ngay khi một feature mới được đề xuất, nhưng đủ chặt để làm lộ những chỗ “nghe có vẻ đơn giản” mà thực ra đã cần authority, replication hoặc persistence. Năm ví dụ sau cố tình đi từ state nhẹ nhất đến state để lại hậu quả lâu dài, để thấy không phải câu trả lời nào cũng dẫn về server hay save.

## 4.1 — Ví dụ 1: camera — thuần client, không cần lưu

Bạn kéo chuột và camera quay quanh nhân vật. Người chơi khác có thể đang nhìn cùng một actor từ một góc hoàn toàn khác, nhưng máy bạn không cần biết góc nhìn của họ. Camera là ví dụ tốt để bắt đầu vì nó phá một ngộ nhận phổ biến: không phải state nào trong game nhiều người cũng cần đi qua server.

### Ai giữ trạng thái?

Local Player Controller hoặc camera manager giữ yaw, pitch, zoom và mode camera. Character có thể cung cấp transform tham chiếu, nhưng không nên trở thành owner của mọi biến góc nhìn. Nếu camera có spring arm, collision probe hoặc lag, đó là state phục vụ màn hình của một client.

### Ai được phép sửa?

Chỉ local input và camera code của client được sửa. Server không cần nhận từng mouse delta; client cũng không được dùng camera local để quyết định damage, hit hay vị trí authoritative. Đây là ranh giới quan trọng: camera có thể nhìn thấy mục tiêu, nhưng không vì thế mà được tự kết luận đạn đã trúng.

### Ai cần biết khi nó đổi?

HUD local, aim reticle và animation của local character có thể cần biết. Remote client không cần biết bạn đang zoom 2.5 hay 3.0 trừ khi thiết kế có một hiệu ứng nhìn thấy được. Không replicate state chỉ vì “đã có hệ thống replication”; replicate khi người khác cần cùng một sự thật.

### Có phải sống sót qua lần thoát game không?

Thông thường là không. Ta có thể lưu preference như sensitivity hoặc camera distance, nhưng đó là user setting chứ không phải world state. Nếu chưa có yêu cầu cụ thể, camera transform của phiên chơi nên bị bỏ khi thoát. Phân biệt được hai loại dữ liệu này là bước đầu để save không trở thành nơi chứa mọi thứ “phòng khi cần”.

Bảng chuyển đổi của camera:

| Câu hỏi | Trả lời mẫu |
|---|---|
| Ai giữ? | Local controller/camera manager. |
| Ai sửa? | Local input và camera code. |
| Ai biết? | Local HUD, local aim và các hệ thống presentation cần thiết. |
| Lưu gì? | Không lưu runtime camera; chỉ cân nhắc lưu preference. |
| Nếu sai owner? | Camera local bị đẩy lên server, tốn mạng và dễ bị dùng nhầm làm authority. |

## 4.2 — Ví dụ 2: trừ máu — server-authoritative mutation

Từ camera chuyển sang combat, ranh giới đổi hẳn. “Bấm nút đánh” là input; “máu giảm từ 100 xuống 76” là một kết quả gameplay. Hai việc xảy ra sát nhau trên màn hình nhưng không cùng authority. Client được phép gửi intent đánh; server mới quyết định hit hợp lệ và áp damage.

### Ai giữ trạng thái?

Health state thuộc về actor/ability system của thực thể chịu damage. Trong clean-room design, ta cần chọn rõ một owner: `HealthComponent` hoặc `AttributeSet` gắn với actor có authority. Client có bản sao replicated để hiển thị, nhưng bản sao đó không phải nơi quyết định kết quả.

### Ai được phép sửa?

Server hoặc authority của actor được sửa current health. Một client có thể gọi server RPC kiểu “tôi muốn thực hiện attack”, nhưng không được gửi “health mới là 76” rồi yêu cầu server tin. Server kiểm tra range, cooldown, target và damage calculation; sau đó mutation health diễn ra một lần.

### Ai cần biết khi nó đổi?

Owner client cần cập nhật thanh máu. Những client đang relevancy với actor cần nhận giá trị hoặc event để thấy hit reaction, death, floating number hoặc animation. Combat log và quest system có thể cần một event damage/death, nhưng không nên đọc trực tiếp từng field private của HealthComponent.

### Có phải sống sót qua lần thoát game không?

Máu hiện tại trong một trận thường không cần lưu. Nhưng nếu actor là creature persistent hoặc công trình persistent, câu trả lời phải được đưa ra riêng: lưu current health, lưu damage state, hay khởi tạo lại theo rule? Một property cần replication không vì thế mà tự động trở thành save field; hai cơ chế đang giải hai vấn đề khác nhau.

| Câu hỏi | Trả lời mẫu |
|---|---|
| Ai giữ? | Health owner trên actor, với server là nguồn sự thật. |
| Ai sửa? | Server sau khi validate attack và damage. |
| Ai biết? | Relevant clients, UI, reaction, death và các subscriber cần event. |
| Lưu gì? | Thường không lưu combat health; chỉ lưu nếu actor tồn tại qua session. |
| Failure case | Client gửi health giả, server từ chối và log lý do; không broadcast mutation giả. |

## 4.3 — Ví dụ 3: thợ làm việc khi người chơi vắng mặt

Ví dụ thứ ba đưa ta ra khỏi khoảnh khắc đang diễn ra trên màn hình. Nó làm lộ sự khác nhau giữa “đang chạy trong world” và “vẫn có ý nghĩa khi không ai nhìn”. Nếu người chơi đi khỏi base mà worker đứng yên, automation mất giá trị. Nếu server tắt mà game vẫn hứa công việc đã tiếp tục, ta cần một mô hình thời gian khác.

### Ai giữ trạng thái?

Base hoặc work assignment manager giữ `AssignedWorkerId`, `StationId`, `WorkKind`, `StartedAt`, `Progress` và output chưa chuyển vào storage. Worker actor có thể giữ trạng thái animation và navigation khi đang loaded, nhưng assignment bền vững không nên chỉ nằm trong actor tạm thời.

### Ai được phép sửa?

Server sửa assignment, bắt đầu việc, tiêu hao input và commit output. Một client chỉ gửi intent assign/recall. Scheduler server quyết định worker nào hợp lệ dựa trên work suitability, khoảng cách, station capacity và trạng thái sinh tồn.

### Ai cần biết khi nó đổi?

Owner base cần biết slot đã nhận worker; station UI cần biết progress và thiếu nguyên liệu; worker presentation cần biết state để phát animation. Log/telemetry cần ghi lý do scheduler không nhận việc. Khi người chơi quay về, UI phải đọc snapshot state chứ không tự đoán từ vị trí actor.

### Có phải sống sót qua lần thoát game không?

Nếu game hứa “vắng mặt vẫn sản xuất”, một thanh progress runtime là chưa đủ. Ta phải lưu đủ mốc thời gian và điều kiện để tính offline delta: assignment, recipe, input consumed, progress timestamp, output capacity và các blocker. `WorldTime` hay wall-clock cần một policy rõ; hiện evidence Palworld chưa cho con số scheduler/respawn cụ thể, nên đây là quyết định clean-room.

| Câu hỏi | Trả lời mẫu |
|---|---|
| Ai giữ? | Base/work assignment state; actor chỉ là runtime view. |
| Ai sửa? | Server scheduler và transaction của station. |
| Ai biết? | Base UI, worker UI, storage và log subscriber. |
| Lưu gì? | Assignment, timestamps, recipe/input/output và blocker cần thiết. |
| Failure case | Worker mất, station đầy hoặc thiếu input; state phải dừng có lý do, không tự tạo output. |

## 4.4 — Ví dụ 4: tiến trình cây công nghệ

Technology tree là ví dụ dễ đánh lừa mắt nhất: người chơi nhìn thấy một màn hình đầy node, nên ta dễ coi nó là bài toán UI. Nhưng UI chỉ là mặt ngoài. State thật là người chơi đã mở node nào, còn bao nhiêu point, node đó có prerequisite gì và unlock áp dụng cho recipe/structure nào.

### Ai giữ trạng thái?

Player progression owner giữ unlocked node IDs, points đã tiêu, level gate và có thể là version của progression schema. UI đọc snapshot. Technology DataTable/DataAsset giữ definition tĩnh: cost, prerequisite, required level, output unlock; nó không nên bị biến thành save state.

### Ai được phép sửa?

Server hoặc authority của profile xử lý unlock transaction: kiểm tra prerequisite, level và point; trừ point; ghi node unlocked; phát event. Client gửi request và hiển thị pending/error. Nếu unlock liên quan nhiều người trong co-op, owner của progression phải được xác định trước, không lấy “người đang mở UI” làm mặc định.

### Ai cần biết khi nó đổi?

Technology UI cần refresh. Craft menu, build placement, recipe filter và quest/progression tracker cần biết unlock mới. Thay vì mọi nơi gọi thẳng `IsUnlocked`, có thể dùng query service hoặc event có payload node ID; chọn cách nào cũng phải ghi vào contract để agent khác không tự tạo thêm một nguồn sự thật.

### Có phải sống sót qua lần thoát game không?

Có. Đây là state người chơi kỳ vọng còn nguyên sau lần đăng nhập. Save phải có node IDs hoặc stable IDs, không chỉ lưu index array; khi schema đổi cần version và migration. Whitepaper hiện xác nhận technology nodes 150+ và tier cost, nhưng không xác nhận save schema gốc. Vì vậy owner/migration dưới đây là yêu cầu clean-room, không phải claim về Palworld runtime. Chính chỗ này cho thấy dữ liệu tĩnh và state bền vững có thể cùng xuất hiện trên một màn hình nhưng tuyệt đối không nên bị trộn làm một.

| Câu hỏi | Trả lời mẫu |
|---|---|
| Ai giữ? | Player progression/save profile. |
| Ai sửa? | Server progression transaction. |
| Ai biết? | UI, crafting, building, quest và analytics cần unlock. |
| Lưu gì? | Stable node IDs, spent points, schema version. |
| Failure case | Thiếu prerequisite hoặc save cũ; rollback transaction hoặc chạy migration có log. |

## 4.5 — Ví dụ 5: capture result — state ngắn nhưng có hậu quả dài

Capture gom các loại state vừa đi qua vào cùng một khoảnh khắc. Một lần ném sphere có kết quả rất ngắn: success, fail count hoặc failed type. Nhưng nếu thành công, kết quả ấy tạo captured instance, thay đổi roster và có thể sinh ra worker/partner value về sau. Một event thoáng qua vì thế trở thành cánh cửa dẫn tới persistence.

Server giữ capture attempt và tính kết quả; client giữ animation, camera feedback và UI. Những client cần biết actor đã bị capture hoặc biến mất sẽ nhận event/replication phù hợp. Capture result có thể được bỏ ngay sau khi trình bày xong, trong khi captured instance và roster phải có khả năng sống sót qua lần thoát game. Header `FCaptureResult` có ba field được evidence register ghi nhận, còn toàn bộ owner/persistence pipeline chưa được xác minh từ source Palworld; đó là ranh giới phải ghi rõ trước khi tái tạo.

## Bảng trống cho agent điền

Sau năm ví dụ, bốn câu hỏi không còn là bài tập lý thuyết. Đừng bắt đầu implementation của một feature mới nếu câu trả lời vẫn là “chắc là”. Bảng này cố tình để trống; mỗi agent phải điền nó cùng với contract của feature.

| Feature | Ai giữ trạng thái? | Ai được phép sửa? | Ai cần biết khi đổi? | Cái gì sống sót qua thoát game? | Evidence / UNKNOWN |
|---|---|---|---|---|---|
| `<Tên tính năng>` | `<Actor / Component / PlayerState / Server service>` | `<Authority và mutation>` | `<UI / system / subscriber>` | `<Không / một phần / toàn bộ; stable IDs>` | `<Nguồn hoặc UNKNOWN>` |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

Sau khi điền xong, hãy thử bác bỏ chính bảng của mình. Tìm một trạng thái đang bị hai owner cùng giữ; nếu có, lỗi kiến trúc đã tồn tại trước cả lỗi code. Tìm tiếp một mutation mà client đang được phép tự quyết; đó là lỗi authority. Cuối cùng, tìm một field được lưu bằng array index trong khi dữ liệu có thể reorder; đó là lỗi save thường chỉ xuất hiện về sau, khi người viết feature ban đầu đã rời khỏi nhánh. Chương 5 sẽ gom các câu trả lời riêng lẻ này thành một bản đồ chung, để thấy hệ thống nào đang trở thành ngã tư của cả game.

---

**Bằng chứng cho chương này.** `FCaptureResult` ba field được ghi trong `99-Evidence-Register.md`; `EPalWorkSuitability` có 13 loại việc và `PalWildSpawnerDatabaseRow`/character row là các declaration đã extracted. Technology 150+ nodes, tier cost 1→10, player level 1–55+ và các giới hạn save/schema được ghi ở `C09-Progression.md` và Evidence Register. Owner, authority, replication và persistence trong các ví dụ là thiết kế clean-room/inferred; source Palworld hiện chưa đủ để khẳng định runtime owner cho từng mutation. Camera là ví dụ thuần client do yêu cầu thiết kế, không phải claim về Palworld gốc.
