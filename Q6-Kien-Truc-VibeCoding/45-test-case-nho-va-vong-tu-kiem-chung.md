# Chương 45 — Test case nhỏ và vòng tự kiểm chứng của AI

Mục tiêu thực tế của Paldark không phải là “xây CI/CD thật lớn” trước. Mục tiêu là:

> Sau mỗi thay đổi, AI có một phép kiểm tra nhỏ, nhanh, có kết quả đúng/sai rõ ràng để tự chạy, tự đọc failure và tự sửa; chỉ chuyển cho người khi kết quả mang tính cảm nhận hoặc đòi hỏi một flow dài mà máy chưa quan sát đáng tin cậy.

Tên đúng của bài toán này là **testability + automated verification + regression testing**. CI chỉ là máy tự gọi các phép kiểm tra đó khi source thay đổi. CD là bước đóng gói/phát hành artifact đã qua gate; CD không tự biết WASD, Capture hay Work có đúng hay không.

Chương 44 vẫn đúng cho kiến trúc pipeline tổng thể và kiểm toán PR #184. Chương này thu hẹp vào việc quan trọng hơn cho công việc hằng ngày: viết test case nhỏ, phân rã feature, lắp lại feature bằng một composition test ngắn và đóng vòng tự kiểm chứng cho AI.

Các framework cụ thể có sẵn trong Unreal Engine 5.6 và cách chọn Automation, Functional Test, Gauntlet hay Screenshot Comparison được phân tích ở [Chương 46](46-bo-cong-cu-kiem-thu-epic.md).

## 45.1 — Gọi đúng tên vấn đề

| Khái niệm | Vai trò trong Paldark |
|---|---|
| Testability | Source cho phép test dựng state, kích hoạt hành động và đọc outcome mà không cần người chơi thao tác dài. |
| Test case | Một tình huống nhỏ với `Given → When → Then`, một oracle và một failure mode chính. |
| Regression test | Test tái hiện một bug lịch sử; phải đỏ trên revision còn lỗi và xanh trên revision đã sửa. |
| Automated verification | AI hoặc script tự chạy test, đọc pass/fail và lặp lại tới khi đạt exit criteria. |
| Eval | Bài đánh giá năng lực agent trên một task có verifier; test case của game có thể là một phần của eval. |
| Test harness | Công cụ dựng fixture, điều khiển Unreal và thu kết quả. |
| CI | Tự chọn và chạy các test khi có commit/PR, lưu artifact và chặn merge khi required test fail. |
| CD | Version, ký, lưu provenance và phát hành đúng artifact đã qua gate. |

Vì vậy thứ tự đầu tư đúng là:

```text
oracle nhỏ, rõ
→ test chạy được bằng một lệnh
→ AI tự lặp tới PASS
→ gom test thành regression suite
→ sau đó mới để CI gọi suite
```

Không cần chờ có GitHub Actions, build farm hay autoplay toàn game mới bắt đầu. Một test local 50 ms bắt đúng typo #154 có giá trị hơn một flow năm phút đi hết game nhưng không biết input chết ở phase nào.

## 45.2 — Bài nói của Boris Cherny thực sự gợi ý điều gì?

Transcript “What Makes Opus 5 Different” do Soliz cung cấp có bốn ý liên quan trực tiếp:

1. Khoảng `03:24–06:19`: đội Claude Code xóa hơn 80% system prompt vì nhiều dòng cũ chỉ bù cho hành vi của model trước. Họ dùng ablation: xóa, đo tác động, chỉ đưa lại những gì chứng minh được là hữu ích.
2. Khoảng `09:30–10:25`: eval được giữ và bổ sung dựa trên nơi model thật sự thất bại; khi eval bão hòa hoặc không còn phân biệt được chất lượng, nó cũng phải được thay.
3. Khoảng `15:18–17:25`: prompt nên nêu task, guardrail và exit criteria ở mức cao. Việc rewrite Bun có thể tự chạy vì Bun và Node đã có test suite đủ mạnh để phán quyết implementation mới đúng hay sai.
4. Khoảng `20:21–23:53`: verification được xem là yếu tố then chốt. Ví dụ Electron → Swift có runner, screenshot và phép so sánh; model có thể tiếp tục sửa vì nó tự nhìn thấy khoảng cách tới kết quả cần đạt.

Tài liệu chính thức của Anthropic cũng diễn đạt cùng nguyên lý: nếu agent không có test, build, fixture diff hoặc screenshot để kiểm tra, người dùng sẽ trở thành vòng lặp verification; khi có tín hiệu pass/fail, agent có thể chạy, đọc kết quả và lặp tới khi đạt. Tài liệu còn khuyến nghị ưu tiên chạy test đơn lẻ thay vì cả suite để tiết kiệm thời gian, giữ instruction file ngắn, dùng hook cho hành động bắt buộc và dùng verifier ở context mới để thử bác bỏ kết quả.

Điều cần học **không phải** là “prompt càng ngắn càng tốt” một cách máy móc. Kết luận áp dụng cho Paldark là:

```text
Prompt giữ mục tiêu + giới hạn + exit criteria.
Test/fixture giữ chi tiết đúng-sai.
Runner tạo tín hiệu máy đọc được.
Lịch sử bug quyết định test nào cần tồn tại.
```

Prompt dài không thể thay một oracle. Ngược lại, khi repository đã chứa test và command chuẩn, prompt có thể rất ngắn mà agent vẫn làm đúng.

## 45.3 — Một test nhỏ phải nhỏ đến mức nào?

Quy tắc mặc định là **một hành động, một outcome chính, một failure mode**.

Test nhỏ tốt:

- dựng fixture trực tiếp thay vì chơi qua mười bước không liên quan;
- gọi đúng production seam của hành động đang nghiệm thu;
- đọc state/event/return value thay vì tìm một dòng log “ready”;
- có expected độc lập với implementation;
- fail ở phase đầu tiên sai và nói rõ expected/actual;
- chạy lặp lại cùng seed/clock thì cho cùng kết quả;
- dọn state sau test;
- có budget thời gian và timeout cụ thể.

Test nhỏ không đồng nghĩa với test hời hợt. Nó chỉ cắt bỏ những phần không cần cho bug đang bảo vệ.

### Budget đề xuất

Các số dưới đây là mục tiêu thiết kế, không phải số đo hiện tại của PaldarkKit. Cần tách thời gian của test body khỏi thời gian cold-start Unreal.

| Lớp | Test body mục tiêu | Ví dụ | Nhịp chạy |
|---|---:|---|---|
| M0 — Static/schema | `< 50 ms` | JSON key, manifest, mapping conflict, dependency rule | Mỗi lần sửa file liên quan. |
| M1 — Pure/low-level | `< 100 ms/case` | direction math, ballistics, transaction, state transition | Mỗi lần sửa + targeted batch. |
| M2 — Component/engine | `< 1 s/case` | UInputAction lifetime, possession, capsule/mesh relation | Mỗi PR bị ảnh hưởng; gom case để trả cold-start một lần. |
| M3 — Tiny functional map | `2–15 s/case` | F pickup, capture failure reset, Pal follow không NavData | Targeted PR/main. |
| M4 — Packaged/network/visual | `30 s–vài phút` | physical W/mouse, two-client, cook, screenshot diff | Chỉ khi impact yêu cầu; main/nightly/release. |
| H — Human | Không đặt budget máy | feel, fun, readability, animation/art approval, exploratory | Milestone hoặc khi oracle máy chưa đủ. |

Nếu một test M1 phải boot Unreal riêng 60 giây, runner phải gom nhiều case M1 trong một process. Không được biến mọi phép kiểm tra thành autoplay packaged build.

## 45.4 — Phân rã rồi “lắp lại” feature

Ý tưởng tháo chiếc xe rồi lắp lại là đúng, nhưng nên thực hiện hai lần:

1. **Trước hoặc trong khi code:** vẽ state/transition để implementation không bỏ seam.
2. **Sau khi code:** backfill test từ từng transition, rồi chạy một composition test để xác nhận thứ tự lắp.

Feature được biểu diễn thành chuỗi observable, không chỉ bằng tên lớn như “Movement”:

```text
config hợp lệ
→ object/action được tạo
→ context được cài
→ binding sẵn sàng
→ pawn được possess/local-control
→ input tạo semantic action
→ rule tính direction
→ movement owner nhận request
→ velocity/location đổi
→ camera/presentation phản ánh state
```

Mỗi mũi tên có một microtest. Sau đó chỉ cần **một composition test ngắn** xác nhận các seam nối đúng và đúng thứ tự. Composition test này không phải full E2E và không cần người đi bộ, nhặt đồ, đánh Pal rồi làm việc.

### Ví dụ Movement

| Test | Chỉ kiểm điều gì? |
|---|---|
| `MOV-CONFIG-LOOK` | Config khai báo `LookYaw`, `LookPitch`, `MouseX`, `MouseY`. |
| `MOV-BIND-LOOK` | Hai action Look được bind đúng trigger khi local pawn sẵn sàng. |
| `MOV-DIR-YAW` | Forward/right được tính từ control yaw, không từ actor yaw. |
| `MOV-OWNER-APPLY` | Request direction khác zero làm movement owner nhận đúng vector. |
| `MOV-ASSEMBLY-TRACE` | Trace xuất hiện theo thứ tự `Config → Context → Bind → Possess → Action → Direction → Apply`. |

Nếu `MOV-DIR-YAW` fail, AI sửa hàm direction mà không cần package game. Nếu microtest đều xanh nhưng `MOV-ASSEMBLY-TRACE` fail ở `Context → Bind`, AI biết lỗi nằm ở integration seam. Chỉ khi các test đó xanh mới cần chạy một packaged physical-input test để đóng rủi ro Editor/package parity.

### Ví dụ Capture

```text
Idle
→ AimReady
→ ThrowCommitted
→ ProjectileHit
→ CaptureRollSettled
→ Success hoặc Failure
→ Reset/ReadyForNextThrow
```

Microtest bảo vệ từng rule: không có nghiệm ballistic thì không consume Cầu; pull chỉ đổi local visual transform; mỗi request chỉ có một terminal result; failure phục hồi target; success thêm đúng entity vào roster. Composition test chỉ xác nhận trace và invariant của chuỗi này bằng seed/clock cố định. Nó không cần chạy tiếp Summon và Work.

### Ví dụ Work

```text
Eligible → Assigned → Arrived → Consumed → Produced → Completed/Follow
```

Test lắp lại phải chứng minh consume xảy ra trước produce, chỉ produce một lần, và Pal rời phạm vi thì quay về Follow. Clock có thể tăng tốc; không cần người chờ thời gian thật.

## 45.5 — Mẫu test case tối thiểu

Một card dùng cho đa số microtest chỉ cần bảy trường:

```yaml
id: INPUT-REG-154-CONFIG-KEY
prevents: "PAL-PR154-INPUT-001"
level: M0
given: "DefaultInput.ini fixture dùng key DefaultInputPlayerInputClass"
when: "validate InputSettings keys"
then: "FAIL reason=unknown_property path=DefaultInputPlayerInputClass"
never: "im lặng bỏ qua rồi boot bằng PlayerInput mặc định"
budget_ms: 50
runner: "python3 PaldarkKit/Scripts/test/run.py --id INPUT-REG-154-CONFIG-KEY"
```

Test production config dùng card cùng loại nhưng expected là PASS và resolved class phải là `/Script/EnhancedInput.EnhancedPlayerInput`.

Một pure test cho #156 có thể còn ngắn hơn:

```yaml
id: MOV-REG-156-CONTROL-YAW
given: "actor_yaw=0; control_yaw in [0, 90, 180, -90]"
when: "calculate forward movement basis"
then: "forward quay đúng cùng control_yaw"
never: "forward luôn là actor +X"
level: M1
```

Runner M0 hiện có là `PaldarkKit/Scripts/test/run.py`, với wrapper
`PaldarkKit/Scripts/test/run.sh` cho Linux/CI và
`PaldarkKit/Scripts/test/run.ps1` cho Windows. Mỗi card chạy hai nửa:
`expect_pass` trên production và `expect_fail` trên fixture cố tình mang lỗi.
Nửa `expect_fail` phải đỏ đúng `reason`; nếu fixture không đỏ thì cả test là
`INVALID`, không phải PASS. Automation Test C++ và các mức M1/M2 vẫn là thiết
kế cho các PR sau.

## 45.6 — Bug lịch sử nào chuyển được thành test nhỏ?

Kết luận ngắn: **mọi bug đã liệt kê dưới đây đều có ít nhất một phần có thể tự động hóa**. Không phải bug nào cũng đóng hoàn toàn bằng unit test; một số cần thêm tiny runtime hoặc packaged test. Human chỉ còn cần cho chất lượng chủ quan và exploratory, không cần lặp lại toàn bộ thao tác cơ học sau mỗi commit.

### Nhóm A — Chuyển ngay thành test rất nhỏ

| Bug lịch sử | Test nhỏ nhất bắt đúng nguyên nhân | Lớp | Nguồn |
|---|---|---|---|
| Không có action Look, chuột không xoay camera | Parse production JSON và assert action/mapping `LookYaw/LookPitch ↔ MouseX/MouseY`; component test assert binding tồn tại. | M0 + M2 | PR #147, `b9826a95`. |
| Một chữ sai làm Enhanced Input chết | Validator từ chối `DefaultInputPlayerInputClass`, chấp nhận `DefaultPlayerInputClass`; resolved runtime class đúng. | M0 | PR #154, `18349d0a`. |
| W dùng actor forward thay vì camera | Property test yaw `0/90/180/-90`; vector forward quay theo control yaw. | M1 | PR #156, `b50ce6c8`. |
| Hai context cùng chiếm phím C | Static resolver phát hiện conflict hoặc chứng minh chỉ một intent đủ condition/priority. | M0 | Audit sau PR #157. |
| Capture ballistics rơi ngắn | Solver test near/far/below/unreachable; nghiệm đạt target trong tolerance, unreachable bị từ chối trước consume. | M1 | `574b83c7`. |
| Capture kéo actor root về origin | Trong pull step, actor root transform bất biến; chỉ mesh local transform đổi. | M1/M2 | `574b83c7`. |
| Capture thất bại làm lần sau kẹt | State-machine test seed fail rồi seed success; failure luôn về Ready và dọn presentation/projectile. | M1 | `574b83c7`. |
| Diagnostic log chạy mỗi tick | Idle fixture trong một cửa sổ thời gian không phát diagnostic định kỳ; command dump phát đúng một snapshot. | M1/M2 | Feedback Movement sau #154. |
| Harness kết luận trước replication | Fake completion đến trễ; runner phải chờ correlation/revision hoặc timeout thành FAIL, không dùng sleep mù. | M1 của harness | Chương 18.6. |
| Save schema/migration sai | Encode/decode normalized state; old schema migrate idempotent; future schema bị từ chối rõ. | M1 | PR #148/#155. |

### Nhóm B — Tiny engine/component test, vẫn không cần người chơi

| Bug lịch sử | Test nhỏ nhất bắt đúng nguyên nhân | Lớp | Nguồn |
|---|---|---|---|
| Mesh player quá lớn, camera xuyên mesh | Spawn một character; assert bounds/capsule/scale/spring-arm contract; sweep camera ở vài yaw/pitch chuẩn. | M2; thêm visual M4 nếu cần | PR #138, `98334389`, `de9ce23d`. |
| Head/leader-pose sai, spawn lún | Assert parent/leader-pose/bone relation; sau settle, feet và capsule có floor distance trong tolerance. | M2/M3 | PR #139, `bad5b2c8`. |
| Action có trigger nhưng pawn không đi | Possess local pawn, phát semantic Move một frame; movement owner nhận non-zero input và location/velocity đổi. | M2/M3 | PR #138/#147. |
| QA pickup được nhưng F thật không được | Tiny map một pickup; physical/driver F đi qua focus và Interact; inventory revision tăng đúng một, actor consumed đúng reason. | M3 | Chương 18/43. |
| Crouch/stand làm player lơ lửng | Đo feet-floor distance trước, trong và sau crouch; capsule transition không nâng root sai. | M2/M3 | `486631cc`. |
| Melee chọn sai target hoặc damage sai frame | Đặt hai target ở edge collision; đúng entity nhận đúng một damage tại contact event. | M3 | `574b83c7`. |
| Summon/recall sai Pal hoặc mất roster | Capture entity X; toggle world/party/world vẫn cùng stable ID X; roster count bất biến. | M2/M3 composition | Chương 43.4. |
| Pal đứng yên khi không có NavData | Map nhỏ không NavData; sau vài tick formation error phải giảm, far catch-up phải kích hoạt. | M3 | `50acd945`. |
| Pal phải nhấn G mới làm việc | Summon trong bán kính, không gửi G; trace `Assigned → Arrived → Consumed → Produced`; rời phạm vi quay Follow. | M3 với fake clock | `486631cc`, `50acd945`. |

### Nhóm C — Tự động được nhưng chậm, chỉ chạy theo impact

| Bug/rủi ro | Test đóng rủi ro | Khi chạy |
|---|---|---|
| #147/#154/#156 chỉ hỏng trong package | Relocate Win64 artifact, boot, gửi W/mouse qua player path thật; assert action, control rotation và movement delta. | Khi đổi Input/config/cook/package; main/release. |
| Cook root hẹp làm package giả xanh | Clean cook từ manifest đầy đủ, boot artifact và xác nhận feature assets resolve. | Khi đổi manifest/assets/package. |
| EXE tìm `.uproject` ở absolute path máy build | Copy artifact sang thư mục tạm khác drive/path rồi launch; không được mở descriptor ở source path. | Package/release test. |
| Persistence thiếu state sau restart | Process A save, thoát sạch; process B load; normalized snapshot bằng expected. | Main/nightly. |
| Request client bị QA server-local che | Hai process; correlation bắt đầu ở client, commit ở server và presentation trở về đúng client. | Main/nightly/network changes. |
| Camera/HUD/mesh visual regression | Screenshot có camera pose, resolution và fixture cố định; image diff có tolerance và metadata. | Visual-impact PR/nightly. |

### Nhóm D — Vẫn cần người

- movement/camera có “đã tay” hay gây chóng mặt không;
- animation có tự nhiên, foot sliding có khó chịu không;
- HUD có dễ đọc, tutorial có dễ hiểu không;
- art direction, framing và cảm xúc của Capture/Combat;
- exploit mới, đường đi lạ và hành vi mà test suite chưa nghĩ tới;
- flow dài chỉ ở milestone để tìm bug mới, không phải để xác nhận lại mọi regression cũ.

Khi human tìm thấy bug mới, bug đó phải được phân rã xuống test tự động nhỏ nhất có thể. Chỉ phần thật sự chủ quan mới tiếp tục nằm ở human gate.

## 45.7 — Không bắt đầu từ số 0: dùng test của V1/V2 làm donor

PaldarkKit hiện không có `IMPLEMENT_*_AUTOMATION_TEST` trong source, nhưng các đời trước đã có nhiều test phù hợp để port contract sang V5:

| Donor hiện có | Giá trị có thể tái sử dụng |
|---|---|
| [`PaldarkInputAuthoringTests.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkLab/Source/PaldarkLabEditor/Private/Tests/PaldarkInputAuthoringTests.cpp) | Đã kiểm W/S/A/D tồn tại, modifier đúng loại/thứ tự và ownership đúng; là tiền thân tốt cho #147/#154. |
| [`PaldarkV2T8InputRoutingTests.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV2/Source/PaldarkV2/Private/Tests/PaldarkV2T8InputRoutingTests.cpp) | Kiểm declared tags, authored action và press/release routing; có thể port ý tưởng sang semantic input contract. |
| [`PaldarkV2T8BallisticsTests.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV2/Source/PaldarkV2/Private/Tests/PaldarkV2T8BallisticsTests.cpp) | Đã có near/below/out-of-envelope/no-gravity cases; dùng làm donor trực tiếp cho Capture ballistic regression. |
| [`PaldarkInventoryTransactionTests.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkLab/Source/PaldarkLab/Private/Tests/PaldarkInventoryTransactionTests.cpp) | Kiểm stack overflow, all-or-nothing remove, craft commit và rollback; tránh lặp lại transaction bug. |
| [`PaldarkV2T8SaveSchemaTests.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV2/Source/PaldarkV2/Private/Tests/PaldarkV2T8SaveSchemaTests.cpp) | Save/load state, migrate schema cũ và từ chối schema tương lai. |
| [`PaldarkV2T8CharacterSeamTests.cpp`](https://github.com/SlimeVRX/Soliz-Devin-PaldarkKit/blob/main/PaldarkV2/Source/PaldarkV2/Private/Tests/PaldarkV2T8CharacterSeamTests.cpp) | Kiểm façade ủy quyền đúng owner component và event chỉ phát một lần. |

Không copy implementation V1/V2 một cách mù quáng. Cần port **fixture, invariant và failure case** sang interface/owner của V5. Mục tiêu là tái dùng tri thức kiểm thử, không buộc V5 có cấu trúc source giống phiên bản cũ.

## 45.8 — Vòng tự kiểm chứng để AI không phải gọi người test

AI chỉ có thể tự kiểm chứng khi repository cung cấp đủ bốn thứ:

1. **Control:** dựng fixture và kích hoạt đúng production seam.
2. **Observe:** đọc state/event/snapshot cần nghiệm thu.
3. **Oracle:** expected cụ thể, độc lập với code đang test.
4. **Runner:** một command trả exit code và result có cấu trúc.

Vòng làm việc chuẩn:

```text
requirement hoặc bug
→ chọn test ID bị ảnh hưởng
→ tạo/chạy test tái hiện và chứng minh RED
→ sửa implementation nhỏ nhất
→ chạy targeted microtests
→ chạy một composition test của feature
→ verifier context mới thử tìm gap correctness
→ nộp command + result + evidence
```

### Exit criteria cho AI

AI chỉ được kết luận xong khi:

- test mới đỏ trên buggy revision hoặc fixture mô phỏng đúng bug;
- test mới và targeted regression xanh trên source sửa;
- composition trace của feature đúng thứ tự;
- process exit code bằng 0, không crash/ensure mới;
- không nới expected, tolerance, seed hoặc thêm fallback để làm test xanh;
- báo command đã chạy và artifact/result, không chỉ nói “đã test”.

Nếu không có oracle chạy được, AI phải nói rõ `NOT_VERIFIABLE` và phần thiếu là gì. Đây mới là trường hợp cần Soliz test. Việc thiếu test không được ngụy trang thành “có vẻ đã đúng”.

### Tách người viết khỏi người chấm

Deterministic test là trọng tài chính. Một agent/verifier context mới có thể review diff để tìm requirement bị bỏ sót, nhưng không được dùng nhận xét LLM thay cho assertion. Với regression quan trọng:

- agent implementation không được đồng thời âm thầm đổi expected/golden;
- thay đổi test oracle cần diff/review riêng;
- reviewer chỉ báo gap ảnh hưởng correctness/requirement, không ép over-engineering;
- một test retry xanh không xóa lần fail đầu; flaky phải được ghi riêng.

## 45.9 — Prompt ngắn dùng cho feature mới

Khi repository đã có runner và registry, prompt không cần kể lại toàn bộ lịch sử Paldark:

```text
Mục tiêu: triển khai <requirement ID>.
Giữ nguyên: <owner/authority/public contract>.

Trước khi sửa, tìm regression liên quan và viết test nhỏ nhất tái hiện failure mode mới.
Sau khi sửa, chạy targeted microtests và một feature composition test.
Không nới oracle, đổi golden/seed hoặc dùng QA shortcut cho hành động đang nghiệm thu.
Chỉ dừng khi các test pass và gửi lại command cùng evidence; nếu không thể kiểm chứng, báo chính xác oracle/runner còn thiếu.
```

Chi tiết key, expected value, transition và fixture nằm trong test case, không nằm trong một prompt khổng lồ. Instruction chung chỉ nên giữ command khó đoán, kiến trúc owner/authority, quy tắc không đi tắt và exit criteria.

## 45.10 — Việc nên triển khai trước, chưa cần CI/CD lớn

### P0 — Đã triển khai đường chạy local một lệnh

Wrapper PowerShell cho môi trường Windows:

```powershell
.\PaldarkKit\Scripts\test\run.ps1
.\PaldarkKit\Scripts\test\run.ps1 -Id INPUT-REG-154-CONFIG-KEY
.\PaldarkKit\Scripts\test\run.ps1 -Feature Movement -Level M0
.\PaldarkKit\Scripts\test\run.ps1 -Changed
.\PaldarkKit\Scripts\test\run_ue.ps1 -Build
```

Linux/CI dùng command tương đương:

```bash
bash PaldarkKit/Scripts/test/run.sh
python3 PaldarkKit/Scripts/test/run.py --feature World --level M0
python3 PaldarkKit/Scripts/test/run.py --changed
```

Runner trả exit code chuẩn, in bảng ngắn gọn, và ghi JSON gồm
`test_id`, `result`, `phase`, `expected`, `actual`, `duration_ms`, `commit` và
artifact path dưới `PaldarkKit/Saved/Tests/` (có thể đổi bằng `--artifact`).
Các card tự mô tả validator, input production, fixture, expected reason và
watched paths trong `PaldarkKit/Tests/m0-regressions.json`; thêm regression
M0 mới chỉ cần thêm card và fixture. Hiện có 12 card M0, mỗi card đều có
production xanh và poison fixture đỏ đúng reason. Ngoài sáu lỗi ban đầu, suite
đã chặn QA bịa state, policy shadow-variable khác nhau giữa MSVC/Clang, phạm vi
PlayerPresentation, path/link sai casing và installed-engine artifact bị mất.
Runner còn đối chiếu coverage giữa corpus với cả registry M0 và UE; thêm bug mà
không map test sẽ trả `INVALID`.

### P1 — Đã triển khai regression headless-state cho corpus V4

Module test-only `PaldarkTests` có 8 UE Automation Test dưới filter
`Paldark.Regression`: AI fallback/consumer, Pal world bounds, normal world
startup, QA không bịa Work state, autoplay focus, mesh presentation topology và
HUD display name. Chạy trên Windows bằng `run_ue.ps1`; `-Build` build editor
trước khi test, còn lần lặp sau có thể bỏ cờ này. Registry máy đọc được nằm tại
`PaldarkKit/Tests/ue-regressions.json`; ma trận đầy đủ 17 bug nằm tại
`PaldarkKit/Tests/AUTOMATED-REGRESSIONS.md`.

### Backlog ngoài corpus 17 hiện tại

1. `MOV-REG-156-CONTROL-YAW` — pure direction property test.
2. `MOV-REG-147-LOOK-AUTHORING` — action/mapping/binding test.
3. `CAP-REG-BALLISTIC` — port donor V2 ballistics.
4. `CAP-REG-RESET` — failure → ready → next success.
5. `MOV-REG-CROUCH-FLOOR` — capsule/feet invariant.

`MOV-REG-154-CONFIG-KEY` trong danh sách gốc đã được triển khai dưới tên
`INPUT-REG-154-CONFIG-KEY`. Năm regression ở backlog này vẫn là thiết kế bổ
sung, không thuộc 17 record hiện tại và không được ghi là đã chạy.

### P2 — Thêm composition test theo feature

Mỗi feature chỉ cần một hoặc vài trace ngắn, không cần một autoplay toàn game:

- Movement: config → bind → action → direction → apply;
- Interaction: focus → request → owner mutation → consume;
- Capture: aim → throw → hit → result → reset;
- Companion: roster → summon/recall stable identity;
- Work: eligible → assign → arrive → consume → produce.

### P3 — Chỉ sau đó mới nối CI

CI chọn test theo file/feature bị ảnh hưởng, chạy microtests trước, rồi chỉ mở rộng sang tiny map/package/network khi impact graph yêu cầu. Full #184 autoplay là smoke test định kỳ và bằng chứng vertical integration; nó không thay microtest và không phải test mặc định cho mọi commit.

## 45.11 — Quyết định áp dụng cho PaldarkV5

Nếu làm lại PaldarkV5, definition of done cho mỗi feature phải là:

1. feature được phân rã thành state/transition và invariant;
2. mỗi rule quan trọng có microtest;
3. bug lịch sử liên quan có red/green regression;
4. có ít nhất một composition test chứng minh thứ tự lắp;
5. agent chạy được các test bằng một command và đọc được failure;
6. chỉ giữ human gate cho phần chủ quan hoặc flow chưa có oracle máy đáng tin cậy.

Mấu chốt không phải để AI “tự chơi giỏi như người”. Mấu chốt là biến phần lớn correctness thành các câu hỏi nhỏ mà máy có thể trả lời chắc chắn. Khi đó Soliz không còn phải là người bấm lại WASD, F, E, RMB + LMB sau mọi commit. Soliz tập trung vào cảm giác chơi, khám phá bug mới và quyết định chuẩn sản phẩm; mỗi bug đã tìm ra trở thành một test để không phải kiểm lại bằng tay lần nữa.

## 45.12 — Nguồn đối chiếu

- Transcript “What Makes Opus 5 Different” do Soliz cung cấp, đặc biệt các mốc `03:24–10:25`, `15:18–17:25`, `20:21–23:53` và `30:40–31:06`.
- [Anthropic — Claude Code best practices: Give Claude a way to verify its work](https://code.claude.com/docs/en/best-practices)
- [Anthropic — Enabling Claude Code to work more autonomously](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)
- [Epic — Low-Level Tests in Unreal Engine](https://dev.epicgames.com/documentation/unreal-engine/low-level-tests-in-unreal-engine?lang=en-US)
- [Epic — Automation Test Framework](https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine?lang=en-US)
- [Epic — Functional Testing](https://dev.epicgames.com/documentation/unreal-engine/functional-testing-in-unreal-engine?lang=en-US)

---

**Trạng thái bằng chứng.** Nhận định về bài nói bám transcript do người dùng cung cấp và tài liệu chính thức của Anthropic. Lịch sử bug/commit và donor tests được quan sát trực tiếp từ checkout hiện tại. Runner M0, năm card M0, budget và red/green fixture evidence đã triển khai; Automation Test C++ và các mức M1/M2/P1 trở lên vẫn là PROPOSED.
