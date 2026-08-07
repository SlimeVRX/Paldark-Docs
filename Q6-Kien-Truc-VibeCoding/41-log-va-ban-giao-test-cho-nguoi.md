# Chương 41 — Log kể lại hành trình người chơi và bàn giao test cho người thật

Người test nói: “Pal tới trạm rồi nhưng không có Ore.” Trong log có thể có hàng nghìn dòng về movement, timer, inventory và widget; từng subsystem đều tự báo mình đang chạy. Nếu không có một sợi chỉ nối lần bấm của player với station, transaction và kết quả trên HUD, số lượng dòng chỉ làm failure khó nhìn hơn.

Log tốt không phải là nhiều dòng. Log tốt trả lời được:

> Player nào gửi intent gì, nhắm tới entity nào, owner nào chấp nhận/từ chối, state đổi từ revision nào sang revision nào, client nào đã nhìn thấy kết quả, và tất cả các dòng liên quan mang cùng một correlation ID hay không?

## 41.1 — Hai loại log, hai độc giả

Cùng một lần capture thành công, designer muốn biết “Pal đã biến khỏi world và vào roster chưa?”, còn programmer cần biết owner nào validate, revision nào đổi và client nào đã present. Ép cả hai câu chuyện vào một stream sẽ tạo hoặc một bản kể quá kỹ thuật, hoặc một bằng chứng authority quá mơ hồ. Vì vậy Paldark tách hai lớp đọc:

| Stream | Độc giả | Mục đích |
|---|---|---|
| `Paldark.Story` | Người test/designer | Kể ngắn gọn player đã làm gì và kết quả nhìn thấy là gì. |
| `Paldark.Domain.*` | Programmer/agent | Chứng minh authorize/validate/commit/replicate/present và failure reason. |

`Paldark.Story` không thay authority evidence. `Paldark.Domain.*` không được spam mỗi tick để rồi không ai tìm được câu chuyện.

Hai stream phải gặp nhau ở cùng player, target và correlation. Story là mục lục giúp người test tìm đúng hành vi; domain log là hồ sơ để agent chứng minh mutation. Nếu hai phía kể hai target khác nhau, chính sự lệch đó đã là bằng chứng integration có vấn đề.

## 41.2 — Correlation xuyên suốt flow

Một thao tác bắt đầu ở input tạo `CorrelationId`. Hãy coi nó như số hồ sơ của ý định người chơi: dù request đi qua client, server, domain owner, replication và widget, số hồ sơ không đổi. ID đó đi qua toàn bộ flow:

```text
INPUT
→ INTENT_SENT
→ AUTHORIZED
→ VALIDATED hoặc REJECTED
→ PLANNED
→ COMMITTED
→ EVENT_PUBLISHED
→ REPLICATED
→ PRESENTED
```

Nếu một phase tạo ID mới, trace bị đứt. Sub-command có thể có `ParentCorrelationId`, nhưng không thay ID gốc.

Nhờ vậy câu hỏi “Ore không xuất hiện ở đâu?” trở thành phép tìm phase cuối cùng của cùng một hồ sơ. Nếu có `COMMITTED` nhưng không có `REPLICATED`, ta không quay lại sửa AI; nếu đã `REPLICATED` mà thiếu `PRESENTED`, canonical state có thể đúng và lỗi nằm ở read model hoặc UI.

## 41.3 — Envelope tối thiểu

Correlation chỉ nối được flow khi mỗi dòng còn cho biết ai, ở build nào, đang nói về owner và revision nào. Envelope tối thiểu dưới đây giữ những trường dùng chung ổn định; payload riêng của Capture hay Work được đặt ngoài nó theo schema của domain.

```text
ts=<ISO-8601>
build=<commit/build-id>
session=<id>
experience=<id>
player=<stable-player-id>
corr=<guid>
parent_corr=<optional-guid>
command=<stable-command-id>
domain=<owner>
operation=<tag>
phase=<input|validated|rejected|committed|replicated|presented>
source=<stable-entity-id>
target=<stable-entity-id>
authority=<server|client-local>
net_role=<role>
before_rev=<n>
after_rev=<n>
result=<tag>
reason=<tag>
```

Payload gameplay chi tiết nằm ở field có schema/version theo domain. Không dump pointer, raw bytes hoặc toàn bộ object.

Stable ID và revision khiến log vẫn có nghĩa sau khi actor bị destroy hoặc representation được recall. Pointer có thể hữu ích trong một phiên debug cục bộ, nhưng không thể là identity để đối chiếu một creature record qua world, roster và save.

Ví dụ story line:

```text
Paldark.Story player=P01 action=Capture target=Creature:C104 result=Success corr=8F... visible="WorldRemoved,RosterAdded"
```

Ví dụ domain line:

```text
Paldark.Domain.Capture corr=8F... phase=committed command=CAP-772 source=Player:P01 target=Creature:C104 inventory_rev=41->42 roster_rev=8->9 result=Paldark.Capture.Success
```

Hai dòng ví dụ kể cùng một việc ở hai độ phóng đại. Story xác nhận kết quả nhìn thấy; domain line chứng minh Inventory và Roster đã chuyển revision trong phase commit. Khi handoff cho người test, ta đưa story và correlation trước, rồi chỉ mở phần domain liên quan nếu kết quả sai.

## 41.4 — Log gì ở mỗi tầng

Mỗi tầng chỉ được phát biểu điều nó biết chắc. Input biết semantic intent đã phát; owner biết verdict và mutation; replication biết client nhận revision nào; UI biết điều gì đã được trình bày. Nếu một tầng nói thay tầng sau, log sẽ báo success trước khi outcome tồn tại.

### Input/presentation

Ở đầu và cuối flow, log phục vụ hai câu hỏi: người chơi đã yêu cầu điều gì, và màn hình cuối cùng đã cho họ thấy điều gì. Nó không được tự suy ra server đã commit chỉ vì animation bắt đầu.

- semantic action, không chỉ phím vật lý;
- focused stable target + interaction kind;
- pending UI state và terminal result được trình bày;
- không tuyên bố authoritative commit.

### Command owner

Owner là nơi lời yêu cầu trở thành verdict. Vì vậy đây là tầng phải ghi failure đầu tiên, plan và cặp revision đủ để phân biệt retry idempotent với mutation mới.

- requester/subject/target;
- expected revision/idempotency key;
- validation rule đầu tiên thất bại;
- plan summary;
- before/after revision;
- typed result/reason.

### Transaction nhiều domain

Capture settlement hay Work output có thể chạm nhiều state owner. Một dòng “success” sớm sẽ che half-commit; log phải giữ các participant trong cùng hồ sơ cho tới khi tất cả phần bắt buộc đã settle hoặc compensation hoàn tất.

- participant list;
- prepare outcome của từng participant;
- commit/compensation outcome;
- không log “success” trước khi mọi participant bắt buộc đã settle.

### Replication

Commit trên server chưa phải kết quả ở client. Replication log đặt authoritative revision cạnh revision mà read model đã áp dụng, nhờ đó stale delta và presentation trễ không bị quy nhầm cho domain owner.

- authoritative revision;
- client/owner scope;
- delta applied/rejected vì stale/gap;
- thời điểm UI read model đạt revision tương ứng.

### Persistence

Save là flow kéo dài qua phiên chơi, nên identity, generation, schema và checksum phải thay vai trò của actor pointer. Một relation đang chờ resolve là trạng thái trung gian, không phải load success.

- generation số nguyên, chunk owner ID, schema version, checksum;
- validation/migration/apply theo phase;
- pending relation count và resolution result;
- không log success nếu chỉ đưa relation vào danh sách pending.

Tổng thể, mỗi tầng để lại đúng một đoạn bằng chứng và không chiếm quyền kết luận của tầng khác. Cách này làm log ngắn hơn nhưng mạnh hơn: một khoảng trống trong chuỗi phase có ý nghĩa chẩn đoán rõ.

## 41.5 — Không log gì

Log có chi phí đọc, lưu và đôi khi cả rủi ro lộ dữ liệu. Những dòng không giúp phân biệt hai trạng thái hoặc không thể nối với một hành vi nên bị loại trước khi ta nghĩ tới tăng level hay thêm category:

- dòng mỗi tick chỉ để nói actor còn sống;
- giá trị pointer/address làm identity;
- raw `TArray<uint8>`;
- bí mật/session credential;
- toàn inventory/world snapshot ở log normal;
- cùng một state dưới nhiều category mà không có canonical owner;
- QA tự set state rồi log như thể player path đã đạt tới state đó.

Log level:

- `Display`: story và terminal command result quan trọng;
- `Verbose`: phase/replication chi tiết bật theo correlation;
- `Warning`: rejection bất thường/recoverable inconsistency;
- `Error`: invariant vi phạm, half-commit, schema không đọc được;
- `Fatal`: chỉ khi tiếp tục sẽ làm hỏng state không thể khôi phục.

Level nói mức độ và nhu cầu chú ý, không thay phase hay result. Một rejection hợp lệ vì out-of-range có thể là terminal result ở `Display`/`Verbose`; chỉ khi rejection biểu hiện inconsistency bất thường mới cần `Warning`. Nếu mọi failure đều là `Error`, người đọc sẽ sớm học cách bỏ qua chính tín hiệu cần thiết.

## 41.6 — Debug draw và on-screen aid

Một số failure không thể hiểu chỉ bằng text. Pal có thể nhận đúng station nhưng arrival radius nằm lệch; Cầu Pal có thể được server chấp nhận ở điểm khác tâm ngắm. Với interaction, AI, build và capture, người test cần thấy spatial fact:

- focus ray và target kind;
- authority range/LOS;
- AI goal, path/arrival radius và reservation owner;
- build footprint, overlap/support/permission reason;
- capture projectile origin/target và server-accepted impact.

Debug draw là presentation của state debug; canonical result vẫn ở typed log. Tư duy channel/level/debug draw cũng phù hợp với [hướng dẫn debugging của Verse](https://dev.epicgames.com/documentation/fortnite/debugging-and-troubleshooting-in-verse?lang=en-US).

Đường vẽ giúp trả lời “ở đâu”, còn typed log trả lời “ai quyết định và state đã đổi chưa”. Chỉ khi dùng cả hai đúng vai trò, agent mới tránh sửa thuật toán authority vì một lỗi hình học — hoặc ngược lại.

## 41.7 — Test card chuẩn

Test card là thời điểm trách nhiệm chuyển từ agent sang người thật. Agent phải thu nhỏ một behavior thành precondition, thao tác, kết quả nhìn thấy và gói bằng chứng đủ để chẩn đoán. Người test không phải tự phát minh quy trình hay đoán log category.

```yaml
test_id: HT-WORK-ARRIVAL-001
build: <commit>
map: <map/experience>
preconditions:
  - "Có một Pal trong roster"
  - "Có station rỗng, inventory đủ input"
steps:
  - "Summon Pal"
  - "Nhìn station và bấm <semantic action> một lần"
  - "Không bấm thêm trong 10 giây"
expected_visible:
  - "Pal đi tới đúng station"
  - "Trạng thái đổi sang Working sau khi vào arrival radius"
  - "Output xuất hiện đúng một lần"
expected_logs:
  - "một corr duy nhất từ Assign tới OutputCommitted"
  - "TargetCorrelationId/schema version khớp producer-consumer"
return_to_agent:
  - "PASS/FAIL"
  - "video từ 2 giây trước input tới output/failure"
  - "mọi dòng chứa corr"
  - "dòng cuối đúng trước khi hành vi sai"
```

Card này cố ý yêu cầu “không bấm thêm trong 10 giây”: một thao tác thừa có thể tạo correlation thứ hai và làm mất failure gốc. Nó cũng tách `expected_visible` khỏi `expected_logs`, vì hình ảnh đúng không tự chứng minh commit đúng, và log đúng không tự chứng minh người chơi đã thấy output.

## 41.8 — Mẫu báo bug cho Soliz

Khi test FAIL, báo cáo tốt nhất không phải báo cáo dài nhất. Nó giữ nguyên đường biên của card, chỉ thêm bước cuối còn đúng và quan sát đầu tiên bị sai. Mẫu sau đủ để agent tìm lại đúng build, đúng Experience và đúng correlation:

```text
Build/commit:
Map/Experience:
Test card:
PASS hay FAIL:
Bước cuối còn đúng:
Input tiếp theo gây sai:
Điều nhìn thấy:
Điều mong đợi:
CorrelationId:
Dòng log cuối:
Video/ảnh:
Có tái hiện lần 2 không:
```

Với dữ liệu này, agent có thể khoanh lỗi vào input, contract, owner, replication hay presentation mà không cần đoán từ câu “Pal không làm việc”.

Video và log là bằng chứng hỗ trợ, không phải bài tập bắt buộc nếu symptom đã đủ rõ theo contract của gate. Agent phải xin đúng phần còn thiếu, thay vì trả lại cả danh sách chẩn đoán kỹ thuật cho người vừa chơi game.

## 41.9 — Acceptance cho từng loại thay đổi

Không phải thay đổi nào cũng cần cùng một human gate. Contract cần quyết định thiết kế; AI cần cảm giác chuyển động; save cần một lần restart ở milestone. Bảng dưới chia bằng chứng theo thứ mỗi bên có khả năng quan sát tốt nhất:

| Thay đổi | Agent chứng minh | Soliz chứng minh |
|---|---|---|
| Contract/invariant | static audit + compile + typed failure example | quyết định thiết kế được duyệt |
| C++ gameplay | compile, normal path tồn tại, expected log | input/visual outcome và game feel |
| Blueprint/UI | C++ view-model/event contract + hướng dẫn | wiring/layout/animation chạy đúng |
| AI | state owner/reservation/path contract + debug fields | hành vi trông hợp lý, không stuck |
| Multiplayer | authority/revision/rejection contract | milestone listen/dedicated test khi được yêu cầu |
| Save | schema/migration/atomicity reasoning + compile/test nhỏ | milestone restart/load bằng game thật |

Sự phân công này không hạ tiêu chuẩn. Nó ngăn hai kiểu bằng chứng giả: bắt Soliz chứng minh điều compiler đã có thể bắt, hoặc để agent tuyên bố camera, animation và game feel đúng chỉ từ source. Khi scope thay đổi, test card cũng phải đổi để hỏi đúng rủi ro mới.

## 41.10 — Evidence ledger sau mỗi test

Một test card không kết thúc ở tin nhắn “PASS”. Kết quả phải được gắn trở lại claim mà nó nâng cấp hoặc bác bỏ, cùng build và evidence cụ thể. Mỗi human result cập nhật một record:

```text
Claim: Work arrival starts production
Status: USER_VERIFIED | FAILED | UNKNOWN
Build: <commit>
TestCard: HT-WORK-ARRIVAL-001
Evidence: <log/video path>
Observed: <one sentence>
Next decision: <fix/accept/request more input>
```

Không sửa phần trăm tiến độ chỉ vì code thêm. Chỉ tăng `Playable` khi normal path qua human gate; chỉ tăng `Parity` khi behavior có nguồn đối chiếu với phiên bản mục tiêu.

Ledger biến feedback của người chơi thành lịch sử quyết định có thể kiểm lại. Nó cũng bảo vệ tài liệu khỏi đi trước sản phẩm: claim chưa có test vẫn là `UNKNOWN`, failure vẫn được giữ lại cùng build đã thấy nó, và một lần sửa source chỉ đổi trạng thái sau khi đúng gate chạy lại. Chương sau áp dụng nguyên tắc ấy vào một sprint có đồng hồ thật; Chương 43 cho thấy lúc gói handoff được đưa tới người test.
