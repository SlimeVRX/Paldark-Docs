# Chương 41 — Log kể lại hành trình người chơi và bàn giao test cho người thật

Log tốt không phải là nhiều dòng. Log tốt trả lời được:

> Player nào gửi intent gì, nhắm tới entity nào, owner nào chấp nhận/từ chối, state đổi từ revision nào sang revision nào, client nào đã nhìn thấy kết quả, và tất cả các dòng liên quan mang cùng một correlation ID hay không?

## 41.1 — Hai loại log, hai độc giả

| Stream | Độc giả | Mục đích |
|---|---|---|
| `Paldark.Story` | Người test/designer | Kể ngắn gọn player đã làm gì và kết quả nhìn thấy là gì. |
| `Paldark.Domain.*` | Programmer/agent | Chứng minh authorize/validate/commit/replicate/present và failure reason. |

`Paldark.Story` không thay authority evidence. `Paldark.Domain.*` không được spam mỗi tick để rồi không ai tìm được câu chuyện.

## 41.2 — Correlation xuyên suốt flow

Một thao tác bắt đầu ở input tạo `CorrelationId`. ID đó đi qua toàn bộ flow:

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

## 41.3 — Envelope tối thiểu

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

Ví dụ story line:

```text
Paldark.Story player=P01 action=Capture target=Creature:C104 result=Success corr=8F... visible="WorldRemoved,RosterAdded"
```

Ví dụ domain line:

```text
Paldark.Domain.Capture corr=8F... phase=committed command=CAP-772 source=Player:P01 target=Creature:C104 inventory_rev=41->42 roster_rev=8->9 result=Paldark.Capture.Success
```

## 41.4 — Log gì ở mỗi tầng

### Input/presentation

- semantic action, không chỉ phím vật lý;
- focused stable target + interaction kind;
- pending UI state và terminal result được trình bày;
- không tuyên bố authoritative commit.

### Command owner

- requester/subject/target;
- expected revision/idempotency key;
- validation rule đầu tiên thất bại;
- plan summary;
- before/after revision;
- typed result/reason.

### Transaction nhiều domain

- participant list;
- prepare outcome của từng participant;
- commit/compensation outcome;
- không log “success” trước khi mọi participant bắt buộc đã settle.

### Replication

- authoritative revision;
- client/owner scope;
- delta applied/rejected vì stale/gap;
- thời điểm UI read model đạt revision tương ứng.

### Persistence

- generation số nguyên, chunk owner ID, schema version, checksum;
- validation/migration/apply theo phase;
- pending relation count và resolution result;
- không log success nếu chỉ đưa relation vào danh sách pending.

## 41.5 — Không log gì

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

## 41.6 — Debug draw và on-screen aid

Với interaction, AI, build và capture, người test cần thấy spatial fact:

- focus ray và target kind;
- authority range/LOS;
- AI goal, path/arrival radius và reservation owner;
- build footprint, overlap/support/permission reason;
- capture projectile origin/target và server-accepted impact.

Debug draw là presentation của state debug; canonical result vẫn ở typed log. Tư duy channel/level/debug draw cũng phù hợp với [hướng dẫn debugging của Verse](https://dev.epicgames.com/documentation/fortnite/debugging-and-troubleshooting-in-verse?lang=en-US).

## 41.7 — Test card chuẩn

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

## 41.8 — Mẫu báo bug cho Soliz

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

## 41.9 — Acceptance cho từng loại thay đổi

| Thay đổi | Agent chứng minh | Soliz chứng minh |
|---|---|---|
| Contract/invariant | static audit + compile + typed failure example | quyết định thiết kế được duyệt |
| C++ gameplay | compile, normal path tồn tại, expected log | input/visual outcome và game feel |
| Blueprint/UI | C++ view-model/event contract + hướng dẫn | wiring/layout/animation chạy đúng |
| AI | state owner/reservation/path contract + debug fields | hành vi trông hợp lý, không stuck |
| Multiplayer | authority/revision/rejection contract | milestone listen/dedicated test khi được yêu cầu |
| Save | schema/migration/atomicity reasoning + compile/test nhỏ | milestone restart/load bằng game thật |

## 41.10 — Evidence ledger sau mỗi test

Mỗi human result cập nhật một record:

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
