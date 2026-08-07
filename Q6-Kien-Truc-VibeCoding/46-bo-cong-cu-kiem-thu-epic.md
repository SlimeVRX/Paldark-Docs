# Chương 46 — Bộ công cụ kiểm thử Epic cho Paldark

Một phép tính direction sai như #156 không cần boot cả thế giới. Camera xuyên mesh ở #138 lại không thể được chứng minh chỉ bằng toán học. EXE tìm `.uproject` ở đường dẫn máy build chỉ lộ ra khi artifact được chuyển chỗ và khởi động như một process thật; còn ảnh PNG tồn tại vẫn chưa nói được HUD có đúng hay không. Bốn failure này đòi bốn loại môi trường và oracle khác nhau.

Nếu ép tất cả vào một autoplay khổng lồ, test sẽ chậm mà failure vẫn không chỉ ra lớp nào hỏng. May là Unreal Engine đã có sẵn phần lớn hạ tầng Paldark đang định tự viết: test registry, assertion, level fixture, process orchestration, screenshot baseline, image diff và report. Việc cần làm là đặt từng test case vào đúng lớp của Epic.

Từ nhu cầu ấy, kết luận kiến trúc là:

> Ba tầng thực thi chính là **Automation → Functional Test → Gauntlet**. **Screenshot Comparison** không phải một tầng orchestration độc lập; nó là visual oracle gắn vào Automation/Functional Test và có thể được Gauntlet chạy trong Editor hoặc packaged session. UE 5.6 còn có **Low-Level Tests/Catch2** nằm thấp hơn Automation, phù hợp nhất với logic C++ thuần.

```mermaid
flowchart LR
    LLT["Low-Level Tests / Catch2<br/>logic C++ thuần"]
    AUT["Automation Framework<br/>registry, assertions, specs, reports"]
    FUN["Functional Test<br/>actor + fixture trong level"]
    SCR["Screenshot Comparison<br/>ground truth + incoming + diff"]
    GAU["Gauntlet / UAT<br/>Editor, client, server, device, packaged build"]
    OUT["Machine-readable result<br/>log + JSON/HTML + images + crash artifacts"]

    LLT --> OUT
    AUT --> FUN
    SCR -. "visual oracle" .-> AUT
    SCR -. "visual oracle" .-> FUN
    GAU --> AUT
    GAU --> FUN
    GAU --> SCR
    AUT --> OUT
    FUN --> OUT
    GAU --> OUT
```

Sơ đồ không phải một pipeline bắt buộc chạy từ trái sang phải cho mọi test. Nó là bản đồ trách nhiệm: logic thuần ở dưới, world fixture ở giữa, process/session ở ngoài; Screenshot Comparison cung cấp oracle hình ảnh cho lớp cần rendering.

## 46.1 — Chọn công cụ bằng câu hỏi, không bằng tên feature

Cùng một feature Movement có thể cần test toán hướng, test possession trong world, input trong package và visual camera. Vì vậy điểm xuất phát phải là câu hỏi cần phán quyết, không phải tên feature:

| Câu hỏi cần trả lời | Công cụ chính |
|---|---|
| Một hàm toán học, transaction hoặc state transition đúng không? | Low-Level Test; hoặc Automation Test nhỏ nếu chưa có LLT target. |
| UObject, module, asset, Enhanced Input hoặc Game Feature nối đúng không? | Automation Test/Spec. |
| Gameplay trong một `UWorld` nhỏ có tạo đúng outcome không? | Functional Test trong test level. |
| Hình ảnh có khác baseline đã duyệt không? | Screenshot Comparison bên trong Automation/Functional Test. |
| Editor/package có boot, process có crash, nhiều client/server có phối hợp đúng không? | Gauntlet. |
| Cảm giác camera, animation hoặc art có đẹp không? | Human exploratory; screenshot chỉ phát hiện thay đổi, không tự định nghĩa “đẹp”. |

Bảng ngăn một công cụ bị kéo ra ngoài phạm vi quan sát của nó. Không dùng Gauntlet để kiểm một phép nhân vector. Không dùng screenshot để chứng minh inventory đã commit. Không dùng unit test để khẳng định packaged build nhận được MouseX. Mỗi lớp có oracle khác nhau, và closing test chỉ được thêm khi lớp thấp hơn không nhìn thấy rủi ro.

## 46.2 — Lớp 0: Low-Level Tests/Catch2

Hãy bắt đầu ở failure rẻ nhất: một hàm direction trả trục sai hoặc transaction rollback sai. Những câu hỏi này không cần actor hay map. Epic mô tả Low-Level Tests của UE 5.6 là framework nhẹ, theo module, dùng Catch2 và tiêu thụ ít tài nguyên compile/runtime hơn các framework khác. Nó hỗ trợ unit, integration, functional, smoke, end-to-end, performance và stress methodology, nhưng giá trị lớn nhất cho Paldark là các test thuần không cần boot một game world.

### Phù hợp với Paldark

Những case sau có input/output hoặc invariant đủ tách khỏi world:

- #156: `control yaw → forward/right basis`;
- Capture ballistic: nghiệm low arc, target ngoài envelope, gravity không hợp lệ;
- Capture state machine: failure luôn reset và chỉ có một terminal result;
- inventory/crafting transaction và rollback;
- save codec, versioning và migration;
- input config schema/parser nếu parser được tách khỏi component;
- stable ID, quantity, probability và work eligibility rules.

### Không phù hợp

Ngược lại, các failure sau phụ thuộc lifecycle, world hoặc rendering nên sẽ mất điều đang cần kiểm nếu ép xuống LLT:

- possession/local player subsystem;
- asset load và Game Feature activation phức tạp;
- physics/collision trong level thật;
- physical mouse/keyboard path;
- rendering và screenshot.

### Nhận xét cho PaldarkV5

Hai danh sách đặt ranh giới theo dependency của test, không theo độ “quan trọng” của bug. Các test donor V2/Lab hiện dùng `IMPLEMENT_SIMPLE_AUTOMATION_TEST`, nên cách nhanh nhất có thể là port chúng sang Automation trước. Khi V5 tách được logic thuần thành thư viện/module nhỏ, LLT mới đem lại cold-start và isolation tốt hơn. Không cần trì hoãn regression chỉ để đổi framework.

## 46.3 — Lớp 1: Automation Test Framework

Khi failure cần UObject, module hoặc asset registry nhưng chưa cần một level fixture đầy đủ, ta đi lên Automation Framework — registry và runner C++ engine-aware. Epic chia test thành Unit, Feature, Smoke, Content Stress và Screenshot Comparison. Một điểm dễ hiểu sai: **Smoke là cam kết về tốc độ**, không phải một kiểu assertion khác. Epic yêu cầu Smoke test hoàn tất trong khoảng một giây và chỉ gắn `SmokeFilter` cho unit test hoặc feature test thật nhanh.

Framework này dựa vào hệ thống Engine, nhưng không nằm trong reflection/UObject như Blueprint. Với unit test thuần tuyệt đối, Epic khuyên xem Low-Level Tests; với module, UObject, asset hoặc world seam, Automation phù hợp hơn.

### API đáng dùng

Các API trong bảng không phải nhiều con đường ngang nhau; chúng khác nhau chủ yếu ở cách khai báo case, fixture và context chạy:

| API/pattern | Khi dùng |
|---|---|
| `IMPLEMENT_SIMPLE_AUTOMATION_TEST` | Một test có một case hoặc tự parameterize trong `RunTest`. |
| `IMPLEMENT_COMPLEX_AUTOMATION_TEST` | Một test được discovery thành nhiều case/parameter. |
| `DEFINE_SPEC` / `BEGIN_DEFINE_SPEC` | BDD, fixture `BeforeEach/AfterEach`, latent/async và composition test dễ đọc. |
| `TestTrue`, `TestFalse`, `TestEqual`, `TestNotNull` | Oracle trực tiếp trong C++. |
| `EAutomationTestFlags` | Chỉ rõ Editor/Client/Server/Commandlet, RHI requirement và filter. |
| Automation Driver | Mô phỏng keyboard/mouse ở platform layer cho input/UI path. |

Bảng giúp chọn hình thức test; tên test lại giúp runner chọn đúng nhánh và người đọc thấy phạm vi. Tên nên tạo cây ổn định:

```text
Paldark.Micro.Movement.Config.ValidProduction
Paldark.Micro.Movement.Config.RejectUnknownInputProperty
Paldark.Feature.Movement.LookBinding
Paldark.Feature.Movement.ControlYaw
Paldark.Feature.Capture.FailureReset
Paldark.Smoke.Project.BootContracts
```

### Flags phải mang nghĩa thật

Tên cho biết test làm gì; flags phải nói thật test chạy được ở đâu và tốn loại tài nguyên nào:

- `SmokeFilter`: body cực nhanh, không load map nặng, không network, không screenshot;
- `ProductFilter`: test thuộc sản phẩm Paldark;
- `EditorContext`, `ClientContext`, `ServerContext`, `CommandletContext`: chỉ chạy nơi test thật sự hỗ trợ;
- `NonNullRHI`: bắt buộc với test cần rendering; không chạy `-NullRHI`;
- không gắn `RequiresUser` cho test muốn agent/CI tự chạy.

Nếu flags nói quá khả năng thật, runner sẽ tạo `NotRun` hoặc xanh trong một context không đại diện. Vì thế chúng là một phần của contract test, không phải metadata trang trí.

### Automation Spec cho “lắp lại feature”

Khi cần “lắp lại” một feature bằng nhiều case có cùng fixture, Spec phù hợp với composition test ở Chương 45:

```text
BeforeEach: dựng fixture sạch
It:       chạy đúng một transition hoặc một trace ngắn
AfterEach: dọn object/file/subsystem đã tạo
```

Ba lifecycle hook giữ setup và cleanup ở đúng chỗ, còn mỗi `It()` là một test riêng. Nếu Movement có bốn failure mode thì viết bốn `It()`, không gom thành một test “Movement works” dài và chỉ trả một chữ FAIL.

### Automation Driver cho #147/#154

Các test config và binding có thể xanh trong khi phím vật lý vẫn không đi qua mapping. Automation Driver thu hẹp khoảng trống ấy bằng cách mô phỏng key, mouse move, click, type, scroll và key hold/release ở platform layer. Đây là seam tốt hơn việc autoplay gọi thẳng `AddMovementInput` hoặc trigger action nội bộ.

Ứng dụng Paldark:

```text
hold W
→ Enhanced Input mapping nhận W
→ Move action có axis
→ pawn location đổi

move mouse X
→ LookYaw action trigger
→ control rotation đổi
```

Hai trace trên bắt đầu ở input gần người dùng hơn, nhưng Driver vẫn có giới hạn cần giữ rõ:

- Driver ban đầu tập trung mạnh vào desktop/Slate; scene actor interaction cần project adapter nếu muốn locator cấp actor;
- synchronous API không được block Game Thread; Epic khuyên ghép Driver với Automation Spec/async execution;
- khi Driver được enable, phần lớn input thật bị chặn và thay bằng simulated input;
- Editor test xanh chưa đóng package parity; packaged path phải chạy lại bằng Gauntlet `UE.TargetAutomation`.

Vì vậy Driver đóng physical-input seam trong context nó hỗ trợ; nó không tự biến một Editor test thành bằng chứng package parity.

### Chạy và xuất report

Một test chỉ tham gia vòng tự kiểm chứng khi agent gọi được bằng command và đọc được report. Epic hỗ trợ chạy từ Test Automation/Session Frontend hoặc command line. Thiết kế runner PowerShell của Paldark có thể gọi:

```powershell
$Project = "G:\Soliz-Devin-Palworld\PaldarkKit\PaldarkKit.uproject"
$Report = "G:\Soliz-Devin-Palworld\PaldarkKit\Saved\TestReports\Movement"

& "$UeRoot\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" `
  $Project `
  -unattended -nop4 -nosplash -NullRHI `
  '-ExecCmds=Automation RunTest Paldark.Micro.Movement;Quit' `
  "-ReportExportPath=$Report"
```

Command minh họa cách nối filter test với report path nhưng vẫn là PROPOSED; `$UeRoot` phải do runner resolve từ Engine Association/config. Wrapper phải kiểm **cả process status lẫn JSON report**. Không được coi exit code 0 là đủ nếu report có test `Fail/Error/NotRun`.

Với screenshot, bỏ `-NullRHI`, cố định RHI/resolution và dùng test có `NonNullRHI`.

## 46.4 — Lớp 2: Functional Test trong level

Một số failure chỉ tồn tại khi actor đứng trên sàn, collision chạy và nhiều component cùng tick. Lúc đó Automation thuần không còn đủ fixture. Functional Test dùng `AFunctionalTest` Actor đặt trong Level; test có thể viết bằng Blueprint hoặc subclass C++. Đây là lớp phù hợp khi outcome phụ thuộc `UWorld`, Actor, collision, movement component, navigation, animation, camera hoặc nhiều owner component cùng chạy.

### Lifecycle có sẵn giải quyết đúng lỗi chờ mù

| Lifecycle | Trách nhiệm |
|---|---|
| `PrepareTest` | Spawn fixture, bắt đầu stream/load/nav/connect và reset state. |
| `IsReady` | Được gọi mỗi frame; chỉ trả true khi precondition thật đã sẵn sàng. |
| `StartTest` / `OnTestStart` | Kích hoạt hành động đang nghiệm thu. |
| Assertions + `FinishTest` | So expected/actual và kết thúc bằng result rõ ràng. |
| `OnTestFinished` | Dọn state; `RegisterAutoDestroyActor` giúp dọn actor tự động. |

Lifecycle trong bảng biến “chờ đủ lâu” thành “chờ đúng điều kiện”. Nó trực tiếp thay các `sleep 5s` hoặc tick diagnostic. Ví dụ test Pal follow không bắt đầu tới khi pawn được possess, Pal spawn xong và Game Feature active; test Work không kết thúc tới khi output revision đổi hoặc timeout có reason.

### Test map phải nhỏ và chuyên biệt

Mỗi failure family nên có một level fixture đủ nhỏ để state ban đầu nhìn thấy được. Đề xuất:

```text
L_Test_Movement
  FT_MovementPossession
  FT_CrouchFloor
  FT_CameraCollision

L_Test_Interaction
  FT_PhysicalPickup

L_Test_Capture
  FT_ProjectileHit
  FT_FailureReset

L_Test_CompanionWork
  FT_SummonIdentity
  FT_NoNavFollow
  FT_AutoWork

L_Test_PlayerVisual
  FT_PlayerDefaultScreenshot
  FT_CrouchScreenshot
  FT_AimScreenshot
```

Cây map chia fixture theo nguồn nhiễu, không theo cấu trúc production content. Mỗi map chỉ chứa floor chuẩn, marker, light cố định, camera, một hoặc hai target và test actor cần thiết. Không dùng open world chính làm mặc định vì streaming, AI, thời tiết và content thừa làm test chậm/nhiễu.

### Bug Paldark phù hợp

Các bug sau đều cần ít nhất một actor/world invariant nhưng vẫn có thể tái hiện trong map chuyên biệt:

- #138: mesh/capsule/spring arm/camera collision;
- #139: head attachment và spawn-floor geometry;
- pawn được possess nhưng WASD không tạo movement;
- physical F → focus → pickup → inventory mutation;
- crouch trước/trong/sau vẫn chạm sàn;
- melee collision chọn đúng target;
- Capture projectile hit, failure reset và lần ném tiếp theo;
- summon/recall giữ stable entity ID;
- no-Nav follow;
- auto-work không cần G và output transaction đúng.

Danh sách trải từ geometry tới transaction, nhưng điểm chung là world nhỏ đã đủ; chưa có lý do trả chi phí packaged multi-process.

### Oracle nên ưu tiên

Có world không đồng nghĩa phải dùng mắt làm oracle. Functional Test vẫn ưu tiên state và invariant:

- actor/component transform;
- stable entity ID;
- inventory/work revision;
- collision query;
- target ID và damage count;
- event/correlation;
- timeout/precondition reason.

Các oracle trong danh sách nói được *vì sao* gameplay đúng. Screenshot chỉ bổ sung cho presentation. Một ảnh giống baseline không chứng minh transaction đúng; một transaction đúng cũng không chứng minh mesh không xuyên camera.

## 46.5 — Lớp 3: Gauntlet cho session và nhiều process

Editor test xanh vẫn không bắt được EXE trỏ về `.uproject` trên máy build, config bị cook sai hay request không đi qua client/server thật. Những failure ấy nằm ở biên process và artifact. Gauntlet là framework của AutomationTool để launch, theo dõi và thu kết quả của một Unreal session; session có thể gồm Editor, một client, nhiều client, server hoặc device khác nhau.

Để điều phối những topology ấy, Gauntlet cung cấp:

- abstraction cho build, device, app install và process;
- role Client/Server/Editor;
- timeout và session lifecycle;
- parse log/crash/assert/fatal;
- thu dữ liệu trong `Saved` từ device;
- chạy test tuần tự, song song hoặc phụ thuộc;
- `RunUnreal` làm entry point từ UAT.

Danh sách mô tả năng lực orchestration, không phải oracle gameplay. Gauntlet **không build game**; nó cần Editor build hoặc cooked/package build đã tồn tại. Nó cũng không tự định nghĩa gameplay đúng là gì; bên trong session vẫn cần Automation Test, Functional Test, Gauntlet Controller hoặc game command có oracle.

### Built-in flow Epic đã cung cấp

Epic đã đóng gói một số topology phổ biến thành các flow có sẵn:

| Gauntlet test | Công dụng |
|---|---|
| `UE.BootTest` / `UE.EditorBootTest` | Boot Client/Editor và phát hiện lỗi process cơ bản. |
| `UE.EditorAutomation` | Chạy Automation/Functional tests trong Editor. |
| `UE.TargetAutomation` | Chạy cùng test trên packaged Client. |
| `UE.Networking` | Điều phối networking test nếu map/controller được setup. |

Bảng cho thấy cùng test có thể được đưa từ Editor sang packaged Client mà không đổi câu hỏi cần phán quyết. Ví dụ chính thức cho phép:

```powershell
& "$UeRoot\Engine\Build\BatchFiles\RunUAT.bat" RunUnreal `
  -test=UE.EditorAutomation `
  -runtest=Paldark.Feature.Movement `
  -project="G:\Soliz-Devin-Palworld\PaldarkKit\PaldarkKit.uproject" `
  -build=editor
```

Với package:

```powershell
& "$UeRoot\Engine\Build\BatchFiles\RunUAT.bat" RunUnreal `
  -test=UE.TargetAutomation `
  -runtest=Paldark.Feature.Movement.PhysicalInput `
  -project="G:\Soliz-Devin-Palworld\PaldarkKit\PaldarkKit.uproject" `
  -build="<path-to-packaged-build>"
```

Hai command minh họa topology nhưng vẫn là PROPOSED cho Paldark; phải được thử với installed UE 5.6 và layout package thật trước khi đưa thành chuẩn.

### Custom Gauntlet Controller

Khi built-in flow chưa đủ biểu đạt state machine của một session, `UGauntletTestController` là C++ object chạy runtime phù hợp hơn. Nó có `OnInit`, map-change callbacks, `OnTick`, state-change callback và `EndTest(ExitCode)`. UAT nhận result từ controller và nâng nó thành result của test.

PR #184 có thể được tái cấu trúc theo hai cách:

1. Giữ autoplay state machine làm game-side driver, Gauntlet chỉ launch/monitor/collect.
2. Chuyển orchestration runtime sang một project `UGauntletTestController`, còn production owner vẫn cung cấp action/read seams.

Hai hướng khác nhau về vị trí orchestration nhưng giữ production seam giống nhau. Không cần rewrite ngay. Điều bắt buộc trước là sửa oracle và process-result policy; đổi class mà vẫn chỉ tìm log `PASS` không làm test đáng tin hơn.

### Bug Paldark cần Gauntlet

Gauntlet chỉ nên nhận những bug mà process, package hoặc topology là một phần của điều kiện tái hiện:

- EXE boot nhưng tìm `.uproject` ở absolute path máy build;
- #147/#154/#156 chỉ fail trong packaged input/config;
- cook root hoặc asset không vào package;
- client → server → đúng client replication;
- dedicated/listen server với hai client;
- save ở process A, restart và load ở process B;
- reconnect/migration;
- #184 Capture → Work vertical smoke;
- crash, hang, timeout và soak.

Danh sách này giải thích vì sao Gauntlet là closing layer chứ không phải test runner mặc định. Nó không nên chạy trên mọi edit; hãy chạy theo impact, main/nightly hoặc release, sau khi microtest đã chặn phần lớn lỗi ở các tầng thấp hơn.

## 46.6 — Screenshot Comparison: biến ảnh thành test thật

PR #184 đã tạo được PNG, nhưng Chương 44 cho thấy “có ảnh” chưa phải “hình đúng”. Screenshot Comparison của Epic lấp khoảng trống này bằng ba artifact có vai trò khác nhau:

```text
Ground Truth  — baseline đã được duyệt
Incoming      — ảnh của source/build đang test
Difference    — vùng/pixel khác nhau
```

Ba file cho biết đáp án, kết quả mới và vùng sai. Ảnh mới khác baseline ngoài tolerance sẽ làm test fail. Screenshot Comparison Browser trong Session Frontend cho phép xem lịch sử, blend ảnh và quyết định Add/Replace/Add As Alternative.

Oracle ấy có thể được gắn vào world fixture theo hai cách chính:

1. đặt `Functional Screenshot Test` hoặc `Functional UI Screenshot Test` Actor trong level;
2. chụp screenshot ở một checkpoint bên trong Functional Test đang chạy.

Cả hai cách đều yêu cầu checkpoint đã đạt state cần nghiệm thu trước khi ảnh được tạo.

### Paldark hiện có gì và thiếu gì?

`UPaldarkAutoplaySubsystem::RequestStepScreenshot` hiện chỉ gọi:

```cpp
FScreenshotRequest::RequestScreenshot(Filename, true, false);
```

`capture_screenshot.sh` chỉ tìm một PNG mới, kiểm header PNG rồi copy file. Vì vậy current harness mới chứng minh đúng một điều:

```text
“có một file ảnh được tạo”
```

Khoảng cách từ file ảnh tới visual oracle nằm trong những điều nó chưa chứng minh:

- ảnh đúng checkpoint;
- camera đúng pose;
- mesh đúng scale;
- head attach đúng;
- camera không xuyên mesh;
- HUD đúng;
- ảnh giống baseline;
- process không crash hoặc timeout;
- khác biệt nằm ở đâu.

Danh sách cho thấy script chưa biết checkpoint, baseline, process health hay nội dung ảnh. Đây là lý do ảnh vẫn phải gửi cho Soliz xem bằng mắt.

### Cấu hình để visual test ổn định

Pixel diff chỉ có ý nghĩa khi những khác biệt không thuộc requirement được khóa lại. Bảng sau ghép từng nguồn nhiễu với cách kiểm soát nó:

| Nguồn nhiễu | Cách khóa |
|---|---|
| Camera/framing | Camera actor, transform, FOV và aspect ratio cố định. |
| Resolution | Cố định `ResX/ResY`; không dùng kích thước cửa sổ ngẫu nhiên. |
| RHI/shader model | Cùng platform/RHI/shader model; baseline khác nhau khi cần. |
| Temporal noise | Dùng option tắt noisy rendering features khi test gameplay presentation. |
| AA/motion blur/SSR/exposure/contact shadow | Tắt theo Functional Screenshot settings nếu không phải đối tượng đang test. |
| Time/weather/light | Test level có light/time-of-day cố định. |
| Animation | Chờ đúng state/notify hoặc cố định pose/time; không chụp theo sleep mù. |
| Asset streaming | `IsReady` chỉ cho test start khi asset/mesh/material đã sẵn sàng. |
| UI | Cố định locale, DPI scale, resolution và data fixture. |
| Random gameplay | Seed, fake clock và entity IDs cố định. |

Các cặp trong bảng biến visual fixture thành một thí nghiệm có thể lặp lại. Epic cho phép tolerance Zero/Low/Medium/High/Custom, per-channel/brightness tolerance, maximum local/global error, ignore anti-aliasing và ignore colors. Tolerance phải được chọn theo loại ảnh, không tăng dần tới khi test xanh.

### Baseline governance

Một baseline là đáp án, nên quy trình đổi nó phải tách khỏi vòng sửa implementation:

1. Human duyệt baseline đầu tiên vì máy chưa biết hình nào là đúng về art/product.
2. Baseline được source-control cùng test metadata.
3. AI chạy lại, đọc PASS/FAIL và xem Incoming/Difference.
4. AI được sửa implementation và chạy lại.
5. AI **không tự Replace/Add Alternative** trong cùng thay đổi implementation.
6. Khi visual change có chủ ý, human hoặc reviewer riêng duyệt baseline mới.

Sáu bước cho agent quyền sửa và chạy lại nhưng không cho quyền tự hợp thức hóa ảnh mới. Đây là cách loại Soliz khỏi vòng lặp regression hằng ngày mà không giao quyền đổi “đáp án” cho agent.

### Visual suite đầu tiên cho Paldark

Với các bug đã biết, suite đầu tiên nên khóa những checkpoint có giá trị hồi quy rõ nhất:

| Test ID | Checkpoint cố định | Bắt bug |
|---|---|---|
| `VIS-PLAYER-DEFAULT` | Character idle, camera rear 3/4 | Mesh scale, attachment, material, silhouette. |
| `VIS-PLAYER-HEAD` | Camera close/side, pose cố định | #139 head attachment/leader pose. |
| `VIS-CAMERA-YAW-*` | Yaw/pitch presets quanh character | #138 camera xuyên mesh/framing regression. |
| `VIS-CROUCH-BEFORE/DURING/AFTER` | Ba state với cùng camera | Floating/capsule-presentation mismatch. |
| `VIS-PICKUP-FOCUS` | Pickup đang focus | Crosshair/prompt/readability. |
| `VIS-CAPTURE-AIM` | Aim active, target/reticle cố định | Actor-camera alignment và aiming presentation. |
| `VIS-CAPTURE-FAILURE-RESET` | Sau failed capture terminal | Pal không kẹt/shrink/origin. |
| `VIS-COMPANION-FOLLOW` | Formation marker cố định | Companion visible/orientation/offset. |
| `VIS-WORK-PRODUCED` | Output terminal | Station/Pal/output feedback. |

Bảng gắn mỗi ảnh với một bug hoặc presentation contract, không tạo gallery chung chung. Mỗi visual test vẫn nên có state assertion trước khi chụp. Nếu checkpoint `CaptureFailureReset` chưa đạt, test phải fail `PRECONDITION`, không chụp một ảnh sai state rồi báo pixel diff khó hiểu.

## 46.7 — Ma trận bug → công cụ Epic

Sau khi đi qua từng lớp, ta có thể quay lại lịch sử bug và chọn primary test rẻ nhất cùng closing test đủ mạnh. Cột human chỉ giữ phần máy chưa có oracle khách quan:

| Bug/rủi ro | Primary test | Closing test | Human còn cần? |
|---|---|---|---|
| #154 config typo | LLT/Automation schema test | Gauntlet TargetAutomation package | Không. |
| #156 actor forward thay control yaw | LLT property test | Functional movement + TargetAutomation | Chỉ đánh giá feel. |
| #147 thiếu Look action/binding | Automation config/binding + Driver | TargetAutomation mouse | Chỉ đánh giá sensitivity/feel. |
| #138 mesh/camera | Functional geometry/collision | Screenshot comparison nhiều pose | Duyệt baseline/feel ban đầu. |
| #139 head/spawn | Automation asset relation + Functional floor | Screenshot close/side | Duyệt visual ban đầu. |
| Crouch lơ lửng | Functional transform invariant | Screenshot three-state | Không nếu tolerance geometry rõ. |
| F không pickup | Functional + Automation Driver | TargetAutomation nếu package-only | Không. |
| Capture ballistic | LLT solver | Functional projectile hit | Visual polish riêng. |
| Capture kéo root về origin | Automation/Functional transform invariant | Failure-reset screenshot | Không. |
| Capture failure kẹt | Automation Spec state machine | Functional fail→success | Không. |
| Melee chọn sai target | Functional collision/damage | Screenshot/video chỉ để debug | Không. |
| Summon sai entity | Automation composition ID | Functional world/party toggle | Không. |
| Pal không follow khi no NavData | Functional no-nav map | Gauntlet soak nếu cần | Chỉ đánh giá naturalness. |
| Auto-work cần G | Functional fake-clock | #184 Gauntlet smoke | Chỉ đánh giá presentation. |
| Save/restart | LLT codec | Gauntlet hai process | Không. |
| Client path/replication | Automation owner contract | Gauntlet server + 2 client | Không cho correctness cơ bản. |
| Package descriptor/cook root | Static/package audit | Gauntlet BootTest/TargetAutomation | Không. |
| Full Capture → Work | Các test nhỏ ở dưới | Gauntlet vertical smoke | Human milestone để tìm bug mới. |

Ma trận cho thấy không bug nào cần bắt đầu bằng full autoplay. Primary test khóa nguyên nhân; closing test khóa môi trường nơi regression có thể lọt qua; human tìm điều mới hoặc đánh giá chất lượng chủ quan.

## 46.8 — Kiến trúc test plugin đề xuất

Ma trận chỉ khả thi khi test code có một nơi sở hữu riêng. PaldarkKit hiện chưa có C++ Automation Test, `AFunctionalTest`, Gauntlet Controller hay approved screenshot baseline. Chỉ có Markdown playtest và custom autoplay/screenshot scripts. Đề xuất thêm một project-owned test plugin để production features không phụ thuộc ngược vào test framework:

```text
PaldarkKit/
  Plugins/Tests/PaldarkTests/
    PaldarkTests.uplugin
    Source/
      PaldarkTests/                 # Automation specs + shared fixtures
      PaldarkTestRuntime/           # optional Gauntlet controllers in test builds
    Content/
      Maps/
        L_Test_Movement.umap
        L_Test_Interaction.umap
        L_Test_Capture.umap
        L_Test_CompanionWork.umap
        L_Test_PlayerVisual.umap
      Automation/                   # approved screenshot data managed by UE
  Build/Scripts/
    Paldark.Automation.cs           # custom Gauntlet nodes if required
  Scripts/test/
    run.ps1                         # one entry point for agents/users
  Saved/TestReports/                # generated, not source truth
```

Cây đề xuất giữ fixture/test module ngoài production owner, đồng thời để runner và map cùng một boundary. Module type và packaging rule phải được spike trên installed UE 5.6. Test code cần có trong Development test target/package mà `UE.TargetAutomation` chạy, nhưng không được vô tình ship trong production Shipping artifact.

### Một entry point, nhiều backend

Agent không nên phải nhớ backend trước khi biết test ID. Một entry point nhận layer hoặc ID rồi chọn công cụ phía sau:

```powershell
.\PaldarkKit\Scripts\test\run.ps1 -Id MOV-REG-156 -Layer Micro
.\PaldarkKit\Scripts\test\run.ps1 -Id PRS-REG-138-A -Layer Functional
.\PaldarkKit\Scripts\test\run.ps1 -Id VIS-PLAYER-DEFAULT -Layer Visual
.\PaldarkKit\Scripts\test\run.ps1 -Id NET-REG-CLIENTPATH -Layer Session
```

Runner chọn backend:

```text
Micro      → LLT hoặc UnrealEditor-Cmd Automation
Functional → UE.EditorAutomation / functional map
Visual     → non-null RHI + Screenshot Comparison
Session    → RunUAT RunUnreal / Gauntlet
```

Bảng ánh xạ giữ sự khác nhau ở tầng thực thi nhưng thống nhất contract kết quả. Mọi backend trả về một result schema chung để AI không phải học bốn kiểu log khác nhau.

## 46.9 — Thứ tự triển khai thực tế

Không thể dựng bốn backend cùng lúc rồi mới có test đầu tiên. Thứ tự dưới đây tạo giá trị kiểm chứng sau mỗi phase và chỉ đi lên khi lớp trước đã có runner/result ổn định.

### Phase 1 — Automation foundation

Phase đầu tạo entry point và port những regression có oracle rõ nhất:

1. Tạo test plugin/module và bật các built-in testing dependency cần thiết.
2. Tạo runner PowerShell, report JSON/HTML và strict exit policy.
3. Port ba regression Movement #147/#154/#156.
4. Port Ballistics và Save donor tests từ V2.

### Phase 2 — Tiny functional maps

Khi automation foundation chạy được, thêm world fixture đúng theo nhóm failure:

1. `L_Test_Movement` cho possession, crouch và camera collision.
2. `L_Test_Interaction` cho physical F.
3. `L_Test_Capture` cho hit/reset.
4. `L_Test_CompanionWork` cho identity, no-nav và auto-work.

### Phase 3 — Screenshot Comparison

Chỉ sau khi state checkpoint ổn định mới tạo visual baseline:

1. `L_Test_PlayerVisual` với fixed camera/light/resolution.
2. Tạo `VIS-PLAYER-DEFAULT`, `VIS-PLAYER-HEAD`, `VIS-CAMERA-*`.
3. Soliz duyệt baseline đầu tiên một lần.
4. Từ đó agent tự chạy Incoming/Difference và chỉ gửi failure evidence khi có regression.

### Phase 4 — Gauntlet

Cuối cùng, đưa cùng test ra process/package/topology thật:

1. BootTest cho relocated package.
2. `UE.TargetAutomation` cho physical W/mouse.
3. custom two-client session.
4. save/restart session.
5. chạy #184 như vertical smoke, không làm default test cho mọi commit.

Bốn phase đi từ oracle rẻ tới session đắt. Kết thúc mỗi phase, Paldark đã có thêm regression chạy được; không phải chờ toàn bộ “hệ thống test” hoàn tất mới thu giá trị.

## 46.10 — Quyết định

Các failure ở đầu chương giờ đã có nơi đứng, nhưng Epic không cung cấp một nút “AI tự test game”. Công cụ chỉ giảm mạnh việc Soliz phải test tay khi chúng được ghép đúng:

```text
logic oracle       → LLT/Automation
world oracle       → Functional Test
visual oracle      → Screenshot Comparison
process/session     → Gauntlet
subjective quality → Human
```

Năm dòng là năm loại phán quyết, không phải năm tên công cụ để dùng đồng loạt. Screenshot Comparison là thay đổi có tác động thấy ngay nhất cho tuần vừa qua: thay vì AI chụp ảnh rồi hỏi “anh thấy đúng chưa?”, Soliz duyệt ground truth một lần; những lần sau Engine tự tạo Incoming/Difference và trả PASS/FAIL. Nhưng để chẩn đoán đúng, visual diff phải đi cùng state assertion và test level tất định.

## 46.11 — Nguồn chính thức Epic

- [Low-Level Tests in Unreal Engine 5.6](https://dev.epicgames.com/documentation/en-us/unreal-engine/low-level-tests-in-unreal-engine?application_version=5.6)
- [Automation Test Framework](https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine?lang=en-US)
- [Automation Spec](https://dev.epicgames.com/documentation/unreal-engine/automation-spec-in-unreal-engine?lang=en-US)
- [Automation Driver](https://dev.epicgames.com/documentation/en-us/unreal-engine/automation-driver-in-unreal-engine)
- [Run Automation Tests](https://dev.epicgames.com/documentation/en-us/unreal-engine/run-automation-tests-in-unreal-engine)
- [Functional Testing in Unreal Engine 5.6](https://dev.epicgames.com/documentation/en-us/unreal-engine/functional-testing-in-unreal-engine?application_version=5.6)
- [Gauntlet Automation Framework Overview](https://dev.epicgames.com/documentation/unreal-engine/gauntlet-automation-framework-overview-in-unreal-engine?lang=en-US)
- [Run Gauntlet Tests in Unreal Engine 5.6](https://dev.epicgames.com/documentation/en-us/unreal-engine/running-gauntlet-tests-in-unreal-engine?application_version=5.6)
- [Gauntlet Controller in Unreal Engine 5.6](https://dev.epicgames.com/documentation/en-us/unreal-engine/gauntlet-controller-in-unreal-engine?application_version=5.6)
- [Screenshot Comparison Tool in Unreal Engine 5.6](https://dev.epicgames.com/documentation/en-us/unreal-engine/screenshot-comparison-tool-in-unreal-engine?application_version=5.6)

---

**Trạng thái bằng chứng.** Mô tả framework, lifecycle, screenshot workflow và Gauntlet built-in tests bám tài liệu Epic. Việc PaldarkKit hiện chỉ dùng `FScreenshotRequest`, chưa có comparison/Automation/Functional/Gauntlet test được quan sát trực tiếp từ checkout. Tên test, test maps, plugin layout, PowerShell commands và rollout phases là PROPOSED; cần spike bằng UE 5.6 local trước khi coi là command chuẩn.
