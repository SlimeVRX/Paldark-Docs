# Chương 42 — Sprint 12 giờ sau design gate

> **Bắt đầu:** 2026-08-04 22:00 +07
> **Deadline cố định:** 2026-08-05 10:00 +07
> **Trạng thái:** `COMPILED_AWAITING_HUMAN_GATE`
> **Gate kỹ thuật của agent:** C++/UHT/link compile; không cook/package/multiplayer runtime trừ khi Soliz đổi scope.
> **Code checkpoint:** `61c3aaac` — full `PaldarkKitEditor Win64 Development` succeeded; human gate ở [Chương 43](43-human-gate-adr-001-capture-to-work.md).

Đây là **ảnh chụp kế hoạch và trạng thái tại thời điểm sprint**, không phải bảng trạng thái hiện hành được viết lại sau mỗi kết quả. Dòng `COMPILED_AWAITING_HUMAN_GATE` ghi đúng khoảnh khắc checkpoint kỹ thuật đã xanh nhưng người chơi chưa trả gate; Chương 43 giữ kết quả gameplay đến sau, trong đó ADR-001 đạt `USER_VERIFIED`. Giữ hai mốc riêng giúp lịch sử không biến compile thành bằng chứng hồi tố cho gameplay.

Sprint không reset đồng hồ khi PR merge hoặc khi chờ feedback. Nếu thời gian duyệt kéo dài, scope bị cắt từ dưới lên; deadline không dời.

## 42.1 — North-star outcome

Mười hai giờ rất dễ bị chia thành mười hai task “hợp lý”: thêm plugin, dựng subsystem, tạo command QA, viết validator. Nhưng người chơi không cảm nhận số task; họ chỉ cảm nhận độ dài của chuỗi hành động không bị đứt. North star của sprint vì thế được viết như những gì xảy ra liên tiếp trên màn hình:

```text
Wild Pal xuất hiện
→ player làm yếu Pal
→ ném Sphere
→ server quyết định capture
→ Sphere settle đúng
→ đúng Pal rời world
→ đúng creature vào roster
→ summon
→ giao station
→ Pal đến nơi
→ output xuất hiện
```

Đây là một spine, không phải lời hứa hoàn thành toàn bộ Palworld trong 12 giờ. Giá trị của sprint là **khép càng nhiều mắt xích liên tiếp càng tốt**, không tạo thêm 15 scaffold rời.

Mỗi mũi tên là một seam phải có owner và bằng chứng. Nếu capture chỉ thêm roster record nhưng summon chưa đọc đúng stable ID, spine dừng tại đó và phải được báo đúng như vậy. Không có số lượng code ở mắt xích sau nào được phép che khoảng đứt ở mắt xích trước.

## 42.2 — Thứ tự ưu tiên nếu ADR-001 được duyệt

Các mức P0–P4 không xếp theo độ hấp dẫn của feature. Chúng xếp theo quan hệ mở khóa: contract phải cho hai phía nói cùng ngôn ngữ trước khi capture settle; capture phải tạo creature identity trước khi summon; summon phải đưa Pal vào world trước khi Work có một worker thật. Đi sai thứ tự sẽ tạo demo cục bộ nhưng không kéo dài normal path.

### P0 — Repair contract đang chặn integration

**Outcome:** normal input chọn đúng target/kind; producer/consumer Work dùng một typed/versioned arrival schema; host/client input ownership có một rule.

Vì sao trước: HEAD đã có code hai phía nhưng chúng nói hai ngôn ngữ. Sửa schema mở lại Interaction, Work và log trace; thêm feature mới trước đó chỉ chồng lên blocker.

Không làm: big-bang event-bus rewrite. Chỉ đặt typed façade cho fields vertical spine cần.

### P1 — Capture settlement authoritative

**Outcome:** client chỉ gửi intent/aim; server lấy seed, damage/health snapshot và target; Sphere consume có refund/compensation; success remove/disable đúng actor và thêm đúng stable creature ID exactly-once.

Vì sao: đây là khoảnh khắc đặc trưng nhất của Palworld và là nơi hiện có lỗ authority/transaction rõ nhất.

Nguồn: course 05/11 cho GAS/projectile/health primitive; V2/V3 cho plan/commit/idempotency; KYWorld cho flow/presentation reference, không cho transaction proof.

### P2 — Roster/summon/world identity

**Outcome:** captured creature record sống độc lập actor; summon/recall dùng cùng stable ID; world lease không nhân đôi; roster có persistence participant theo player scope.

Vì sao: capture không có giá trị nếu kết quả chỉ là log hoặc actor rỗng.

### P3 — Work arrival và một output nhìn thấy

**Outcome:** assign một summoned Pal tới một station, reservation hợp lệ, PalBehavior báo arrival bằng typed event, Work bắt đầu timer và commit một output đúng một lần.

Vì sao: nó trả lời “bắt Pal để làm gì?” và buộc AI + Inventory + Work tích hợp thật.

### P4 — HUD/story feedback

**Outcome:** pending/rejection/success của capture, roster và work xuất hiện qua C++ view model + presentation hiện có; cùng `CorrelationId` với domain log.

Vì sao: logic đúng nhưng người chơi không thấy thì chưa phải gameplay. Nếu Blueprint wiring cần Editor, agent viết hướng dẫn và Soliz thực hiện.

P4 đứng cuối thứ tự triển khai, nhưng không phải phần trang trí có thể bỏ. Nó là mắt xích biến domain result thành player outcome và là nơi Human Gate đọc được hệ thống mà không mở log. Nếu thời gian hết trước P4, sprint phải nói rõ đoạn nào mới chỉ `COMPILED` thay vì gọi toàn spine là playable.

## 42.3 — Timebox dự kiến

Các mốc chỉ có hiệu lực sau khi Soliz duyệt bốn quyết định ở Chương 39. Thời gian còn lại thật được ghi ở commit/PR, không lấy nguyên các con số mẫu.

Bảng thời gian là một phép cắt scope từ deadline đi ngược, không phải cam kết rằng mọi hàng sau đó đã xảy ra đúng giờ. Mỗi cửa sổ có một bằng chứng kết thúc; nếu bằng chứng chưa có khi cửa sổ khép, phần việc sau phải thu hẹp chứ không được coi hàng trước là hoàn thành theo lịch.

| Cửa sổ từ deadline | Việc | Bằng chứng kết thúc |
|---|---|---|
| T-12h → T-11h | Audit + ADR + source map + design review | tài liệu 36–42; Soliz approve/reject rõ từng quyết định |
| T-11h → T-9h30 | P0 contract repair | compile; normal path static audit; test card interaction/work |
| T-9h30 → T-6h30 | P1 capture settlement | compile; typed result; idempotency/refund invariant; test card |
| T-6h30 → T-4h30 | P2 roster/summon | compile; stable ID/lease/persistence contract; test card |
| T-4h30 → T-2h30 | P3 work output | compile; typed arrival; transaction log; test card |
| T-2h30 → T-1h | P4 feedback/integration | compile; C++ view model; Blueprint steps nếu cần |
| T-1h → T-0 | Soliz chạy test card; agent sửa compile-scoped bug | human evidence ledger + decision cho sprint sau |

Nếu thời gian còn dưới 6h khi design gate mở, ưu tiên P0→P1. Nếu dưới 3h, chỉ làm P0 hoặc một invariant P1 trọn vẹn; không mở P2/P3 dang dở.

Nguyên tắc cắt từ dưới lên bảo toàn một đoạn có nghĩa. Một capture settlement exactly-once đã compile và có test card có giá trị hơn ba subsystem P1–P3 cùng mở nhưng chưa system nào giao được terminal result cho system kế tiếp.

## 42.4 — Những việc bị loại khỏi sprint

Danh sách loại trừ là phần bảo vệ north star trước những công việc có ích nhưng sai thời điểm. Mỗi mục dưới đây có thể thuộc roadmap dài hạn; trong cửa sổ mười hai giờ này, nó không trực tiếp mở một seam của Capture → Roster/Summon → Work:

- mở feature/plugin mới;
- full Combat migration sang GAS nếu nó làm capture settlement không kịp khép; thay vào đó contract phải không chặn migration tiếp theo;
- Build, Dungeon, Breeding/Economy content expansion;
- cloud/AWS/GameLift, matchmaking, dedicated acceptance;
- cook/package mỗi PR;
- multiplayer runtime testing;
- sửa validator PaldarkV3 đỏ từ base nếu không chặn compile;
- data entry hàng loạt, format/restructure docs không liên quan;
- mass-move 21 plugin theo architecture proposed;
- viết test harness QA tự set state thay normal path.

“Bị loại khỏi sprint” không có nghĩa bị loại khỏi sản phẩm. Chúng bị hoãn vì không tăng độ dài vertical spine trong deadline hiện tại.

Nếu một mục bất ngờ trở thành blocker thật — chẳng hạn mount rule làm normal path không load asset — scope phải được đổi công khai kèm lý do và bằng chứng. Nó không được lặng lẽ quay lại chỉ vì một agent quen chạy quy trình đó ở mọi PR.

## 42.5 — PR dự kiến và countdown

Các tên dưới đây là kế hoạch chia lát cắt ở đầu sprint, không phải danh sách xác nhận năm PR đã được tạo hoặc merge. Tên chỉ là contract đầu ra; số giờ phải được tính lại lúc tạo PR.

```text
PR-A: Typed interaction and arrival contract + <remaining>
PR-B: Authoritative capture settlement + <remaining>
PR-C: Stable roster and summon lease + <remaining>
PR-D: Pal work arrival to visible output + <remaining>
PR-E: Player feedback and human-test handoff + <remaining>
```

Footer:

```text
Countdown: T-<hh>h<mm>m | deadline 2026-08-05 10:00 +07
```

Không tạo cả năm PR nếu PR trước chưa đạt compile và không còn là dependency sạch cho PR sau.

Vì thế lịch sử sprint phải phân biệt “PR dự kiến” với checkpoint có hash thật. Trong chương này, `61c3aaac` là checkpoint compile được ghi nhận; kết quả người chơi được ghi riêng ở Chương 43. Countdown chỉ mô tả áp lực thời gian tại lúc tạo thay đổi, không nâng nhãn evidence của thay đổi đó.

## 42.6 — Soliz là cánh tay nối dài ở đâu

Agent có thể đọc source, sửa C++ và chạy compiler, nhưng không nên giả vờ đã cảm nhận camera, input hay animation chỉ từ code. Soliz nối dài quy trình đúng tại ba chỗ mà mắt người hoặc Unreal Editor đang giữ dữ kiện: duyệt boundary, chạy test card và thao tác Blueprint khi source không đủ.

### Ngay tại design gate

Trả lời `APPROVE` hoặc sửa bốn quyết định:

1. system không đồng nghĩa GameFeature;
2. V3 invariant là baseline, không scaffold topology;
3. raw bus được thay dần bằng typed contract theo slice;
4. vertical spine capture→roster→work là hướng đầu tiên.

### Khi có test card

- checkout/build commit được chỉ định;
- thực hiện đúng input, không thêm bước tự cứu;
- trả `PASS/FAIL`, video và mọi dòng có `CorrelationId`;
- mô tả game feel riêng sau câu trả lời kỹ thuật.

### Khi Blueprint chặn agent

Agent phải đưa:

- asset/class cần tạo hoặc mở;
- parent C++ class;
- từng property/event binding;
- tên/path asset;
- expected screen result và log;
- cách undo nếu sai.

Soliz thao tác Editor rồi trả ảnh/video. Agent không được thay việc đó bằng suy đoán rằng Blueprint đã đúng.

Handoff tốt làm phần việc của Soliz ngắn và quyết định được: một lựa chọn tại design gate, một chuỗi input tại human gate, hoặc một thay đổi asset có path/property cụ thể. Nếu yêu cầu biến thành “hãy mở project và tìm xem có gì sai”, agent chưa hoàn thành phần chẩn đoán thuộc trách nhiệm của mình.

## 42.7 — Điều kiện dừng

Deadline không có nghĩa phải tiếp tục mở task cho tới phút cuối. Khi dependency không khép, một quyết định mới chưa được duyệt hoặc dữ kiện binary thật sự thiếu, hành động đúng là dừng mở scope và bảo toàn bằng chứng của đoạn đã làm được:

Sprint dừng mở scope khi:

- deadline tới;
- compile bị chặn bởi môi trường ngoài scope và ba đường khắc phục an toàn đã thử;
- design cần một quyết định mới từ Soliz;
- source Palworld/KYWorld cần Blueprint graph hoặc data chưa có;
- PR hiện tại chưa khép invariant nhưng task tiếp theo chỉ tạo thêm state rời.

Kết thúc sprint phải có: đoạn spine dài nhất đạt `COMPILED`, đoạn nào đạt `USER_VERIFIED`, bug nào còn có correlation/evidence, và quyết định tiếp theo. Không dùng số PR làm KPI.

Ở ảnh chụp này, checkpoint đã đạt `COMPILED` và đang chờ Human Gate. Lịch sử không dừng ở đây: Chương 43 ghi cách gate được chạy, kết quả `1/1 USER_VERIFIED` và những regression animation/input vẫn cần retest riêng. Hai chương cạnh nhau cho thấy đúng mục đích của evidence ledger — trạng thái tiến lên bằng quan sát mới, nhưng mốc cũ không bị viết lại như thể nó đã biết trước kết quả.
