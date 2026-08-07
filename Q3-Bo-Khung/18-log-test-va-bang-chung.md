# Chương 18 — Log, test và bằng chứng

“Con Pal của tôi tự nhiên chết.”

Đó là toàn bộ bug report. Không có mã entity, không biết cái chết xảy ra ở
server hay client, không biết trước đó Pal đang đói, cháy hay vừa trúng đòn.
Người chơi chỉ thấy kết quả cuối. Nếu kiến trúc đã tách Hunger, Health,
Combat, Companion và UI thành những owner độc lập, ta không thể mong họ chỉ
đúng file cần mở.

Với một project nhỏ, người làm có thể mở code, tìm những chỗ gán `Health`, đặt breakpoint rồi đoán. Với kiến trúc Paldark, hệ đói không được gọi thẳng vào hệ máu; nó gửi yêu cầu qua boundary. Một effect khác có thể cùng gửi yêu cầu. Client có thể chỉ phát intent, còn server mới là bên quyết định. Code đã được tách ra để nhiều agent không đụng nhau, nhưng chính sự tách đó làm mất con đường “find references” đơn giản.

Log là cái giá phải trả cho decoupling. Nó không phải tiện ích thêm vào sau khi feature chạy xong. Nếu L2 cắt các tham chiếu trực tiếp và L8 giao mỗi state cho một chủ ghi, L12 phải để lại dấu vết đủ rõ để đi từ câu nói của người chơi tới đúng owner, đúng request và đúng lần mutation. Không có log chuẩn, decoupling biến thành một hộp đen.

Chương này đi theo đúng hành trình điều tra ấy: trước hết xác định category và
hình dạng một dòng log, sau đó dựng state bằng command, ghi lại playtest, rồi
đòi bằng chứng mạnh dần cho từng vertical slice. Mục tiêu không phải tạo thật
nhiều dòng xanh. Mục tiêu là nối được điều người chơi làm, quyết định của
authority, mutation của owner và kết quả người chơi nhìn thấy.

## 18.1 — Category theo miền sở hữu

Khi nhận câu “tự nhiên chết”, việc đầu tiên không phải lọc `Warning`; severity
không cho biết ai sở hữu state. Ta cần một category dẫn tới đúng miền. Ta từng
lấy danh mục category của PaldarkLab làm hình mẫu trực tiếp cho PaldarkKit. Khi Movement chạy thật, code cho thấy một ranh giới quan trọng hơn: category dùng chung của Core và category của feature không nên có cùng chủ. PaldarkCore hiện công bố các category nền:

| Category | Miền theo dõi |
|---|---|
| `LogPaldark` | runtime/core chung và fallback |
| `LogPaldarkNet` | authority, connection và replication |
| `LogPaldarkGAS` | ability, attribute, effect và damage |
| `LogPaldarkWork` | Work và automation |
| `LogPaldarkPersistence` | lưu trữ và migration |

Movement tự khai báo `LogPaldarkMovement` trong `Movement/Public/MovementLog.h` và define nó ở `MovementModule.cpp`. Đây là quy ước mới cho mọi feature: category thuộc về feature thì feature tự sở hữu declaration và definition trong module của mình; không thêm một dòng vào `PaldarkCoreLog.h`. Ta từng tin rằng một catalog trung tâm sẽ tiện cho việc nhìn toàn bộ category, nhưng engine không đòi hỏi category feature phải nằm trong Core, còn L5 nói rõ một file trung tâm mà mọi agent đều sửa sẽ trở thành điểm va chạm. Catalog có thể được sinh hoặc kiểm bằng máy; source ownership không được tập trung lại.

Đây là cách chia theo miền sở hữu, không chia theo mức độ nghiêm trọng. `Warning` không phải một category riêng, bởi một cảnh báo về Movement vẫn cần được lọc cùng các dòng Movement khác để dựng lại state. Severity trả lời “điều này đáng lo đến đâu”; category trả lời “ai sở hữu và ai phải đọc tiếp”.

## 18.2 — Một dòng log phải nối được cả câu chuyện

Category đưa ta tới đúng vùng, nhưng chưa nối được bốn dòng của cùng một yêu
cầu nếu mỗi owner viết một câu tùy ý. Một dòng log dành cho phân tích máy cần
cố định trường, không phụ thuộc vào câu văn mà người viết tình cờ chọn. Đề xuất format text key-value:

```text
PD|ts=2025-08-02T14:03:11.482Z|session=QA-20250802-014|corr=HUNGER-0007|cat=LogPaldarkGAS|system=Health|requester=Hunger|target=Pal:Fox_014|field=Health|before=12.0|after=0.0|reason=HungerStarvation|authority=Server|result=Dead
```

Format trông dài vì mỗi trường đang loại bỏ một câu hỏi phải đoán khi điều tra.
Các trường tối thiểu và câu hỏi tương ứng là:

| Trường | Câu hỏi nó trả lời |
|---|---|
| `ts` | Việc xảy ra lúc nào, theo clock nào? |
| `session` | Nó thuộc phiên test hoặc phiên chơi nào? |
| `corr` | Dòng nào là các mắt xích của cùng một request? |
| `cat` | Nên lọc tiếp ở miền nào? |
| `system` | Owner state nào đã xử lý? |
| `requester` | Ai gửi yêu cầu, không nhất thiết là ai được quyền ghi? |
| `target` | State của actor/instance nào bị tác động? |
| `field` | Field nào đổi? |
| `before`, `after` | Giá trị trước và sau là gì? |
| `reason` | Vì sao mutation được chấp nhận? |
| `authority` | Client, listen server hay dedicated server? |
| `result` | Kết quả cuối: applied, rejected, dead, queued… |

Ví dụ một phiên “Pal chết vì đói” có thể tạo ra chuỗi sau:

```text
PD|ts=2025-08-02T14:03:10.900Z|session=QA-20250802-014|corr=HUNGER-0007|cat=LogPaldarkPal|system=Hunger|requester=Pal:Fox_014|target=Pal:Fox_014|field=Hunger|before=1.0|after=0.0|reason=Tick|authority=Server|result=Starving
PD|ts=2025-08-02T14:03:11.100Z|session=QA-20250802-014|corr=HUNGER-0007|cat=LogPaldarkGAS|system=Health|requester=Hunger|target=Pal:Fox_014|field=IncomingDamage|before=0.0|after=5.0|reason=HungerStarvation|authority=Server|result=Accepted
PD|ts=2025-08-02T14:03:11.101Z|session=QA-20250802-014|corr=HUNGER-0007|cat=LogPaldarkGAS|system=Health|requester=Hunger|target=Pal:Fox_014|field=Health|before=4.0|after=0.0|reason=IncomingDamage|authority=Server|result=Dead
PD|ts=2025-08-02T14:03:11.105Z|session=QA-20250802-014|corr=HUNGER-0007|cat=LogPaldarkPal|system=Companion|requester=Health|target=Pal:Fox_014|field=Activity|before=Work|after=Downed|reason=HealthReachedZero|authority=Server|result=StateChanged
```

Dòng thứ hai rất đáng giữ. Hunger không tự trừ `Health`; nó đề nghị `IncomingDamage`. Health là owner quyết định giáp, bất tử, kháng effect và con số cuối. Nếu bug xảy ra, chỉ cần lọc `corr=HUNGER-0007` là thấy cả request, quyết định và hậu quả.

## 18.3 — Console command là API test

Có log chuẩn vẫn chưa đủ nếu bug chỉ xuất hiện sau hai mươi phút chuẩn bị bằng
tay. Muốn tái hiện cùng state nhiều lần, feature cần một cửa test ổn định đi
qua contract thật. PaldarkLab đã chứng minh command có thể là API test chứ không chỉ là cheat. Các command đăng ký thật gồm:

- Core và input: `Paldark.HelloWorld`, `Paldark.Experience.Current`, `Paldark.Experience.Hello`, `Paldark.Experience.ListExtensions`, `Paldark.Input.ListBindings`.
- Pal và GAS: `Paldark.Pal.SpawnTestCompanion`, `Paldark.Pal.CurrentActivity`, `Paldark.Pal.SetActivity`, `Paldark.Pal.Ping`, `Paldark.Pal.SpawnFromDefinition`, `Paldark.Pal.DumpDefinitionRegistry`, `Paldark.Gas.DumpAttributes`, `Paldark.Gas.Damage`.
- Combat: `Paldark.Combat.SpawnDummy`, `Paldark.Combat.Fire`.
- Inventory: `Paldark.Inventory.List`, `Paldark.Inventory.Add`, `Paldark.Inventory.Remove`, `Paldark.Inventory.Drop`, `Paldark.Inventory.GiveAll`, `Paldark.Inventory.EquipBackpack`, `Paldark.Inventory.TestDeathDrop`, `Paldark.Inventory.DumpComposite`.
- Hub và economy: `Paldark.Hub.Stable.List`, `Paldark.Hub.Stable.Deposit`, `Paldark.Hub.Stable.Withdraw`, `Paldark.Hub.Stable.Heal`, `Paldark.Hub.Market.Catalog`, `Paldark.Hub.Market.Buy`, `Paldark.Hub.Market.Sell`, `Paldark.Hub.Market.Balance`.
- Save: `Paldark.Save.Save`, `Paldark.Save.Load`, `Paldark.Save.Dump`, `Paldark.Save.ClearSlot`, `Paldark.Save.ListSlots`, `Paldark.QA.WipeAllSlots`, `Paldark.QA.HubToRaidHandoff`.
- Backend/net: `Paldark.Backend.Login`, `Paldark.Backend.RequestHubFleet`, `Paldark.Backend.RequestRaidFleet`, `Paldark.Backend.Status`, `Paldark.Net.Host`, `Paldark.Net.Join`, `Paldark.Net.Disconnect`, `Paldark.Net.Status`, `Paldark.Net.HostHub`, `Paldark.Net.HostRaid`, `Paldark.Hub.List`, `Paldark.Hub.QueueRaid`, `Paldark.Hub.Status`.

Danh sách dài trên là bằng chứng về cách làm được, không phải yêu cầu Paldark phải có cheat cho mọi thứ. Từ đó, quy ước mới rút lại còn ba mặt mà mỗi feature phải cung cấp:

1. **Dựng trạng thái:** `Paldark.<Owner>.QA.Setup` hoặc command tương đương để tạo fixture.
2. **Quan sát trạng thái:** `Paldark.<Owner>.QA.Dump` hoặc `Paldark.<Owner>.Status` để in snapshot.
3. **Kích hoạt hành vi:** `Paldark.<Owner>.QA.Trigger` để đi qua public contract thật.

Ví dụ feature breeding phải có `Paldark.Breeding.QA.Setup`, `Paldark.Breeding.Status` và `Paldark.Breeding.QA.Start`. Command phải gọi subsystem/authority thật, không tự sửa private field để làm screenshot đẹp. Nếu command cần quyền QA, quyền đó phải được ghi trong declaration và log.

Nhưng “có console command” và “command line nào cũng chạy được command” không phải cùng một điều. Ta từng giả định `-ExecCmds` là đủ cho packaged headless test. Trong lifecycle packaged hiện tại, `-ExecCmds` chạy trước khi pawn và component Movement sẵn sàng, nên không tạo được bằng chứng ổn định cho state sau possession. Quyết định mới là mỗi feature phải có một cờ khởi động QA riêng khi cần kiểm tra lifecycle; Movement dùng `-PaldarkMovementQA`, sau khi component đã attach và input config đã nạp thì mới thực hiện dump, move và jump. Console command thật vẫn phải đăng ký để người điều tra dùng trong phiên đang chạy, nhưng không được coi nó là harness duy nhất.

## 18.4 — Biên bản playtest

Command làm cho state tái hiện được; biên bản làm cho lần tái hiện ấy có thể
được một người khác đọc lại. Một câu “tôi bấm rồi nhưng không chạy” không phải biên bản. Biên bản phải giữ được actor, input, state trước, kết quả mong đợi, kết quả thật và dòng log có thể truy ngược.

### Mẫu trống

Mẫu tối thiểu chỉ có một hàng, nhưng mỗi cột khóa một phần context không được
phép mất khi bàn giao:

| Bước | Người thực hiện | Tương tác với ai | Input/command | Kết quả mong đợi | Kết quả thật | Log/correlation |
|---|---|---|---|---|---|---|
| 1 | `<ai>` | `<actor/state>` | `<input hoặc command>` | `<điều kiện quan sát được>` | `<đã xảy ra>` | `<cat + corr>` |

### Biên bản mẫu — worker chết vì đói

Điền cùng mẫu cho câu bug ở đầu chương sẽ biến “tự nhiên” thành một chuỗi có
thời điểm, state và owner cụ thể:

| Bước | Người thực hiện | Tương tác với ai | Input/command | Kết quả mong đợi | Kết quả thật | Log/correlation |
|---|---|---|---|---|---|---|
| 1 | QA-02 | Pal `Fox_014` | `Paldark.Pal.SpawnFromDefinition Fox 0 0 100` | Pal xuất hiện và có instance id | Xuất hiện, id `Fox_014` | `LogPaldarkPal`, `corr=SETUP-002` |
| 2 | QA-02 | Worker subsystem | `Paldark.Work.QA.SetHunger Fox_014 1` | Hunger về 1, chưa mất HP | Hunger về 1 | `LogPaldarkPal`, `corr=HUNGER-0007` |
| 3 | QA-02 | Clock/worker | chờ 2 giây | Hunger giảm, log có tick | Hunger giảm từ 1 xuống 0 | `LogPaldarkPal`, `corr=HUNGER-0007` |
| 4 | QA-02 | Health owner | không có input thêm | Health giảm đúng damage starvation và Pal chuyển downed | Health từ 4 xuống 0, Pal chết | `LogPaldarkGAS`, `corr=HUNGER-0007` |
| 5 | QA-02 | Save owner | `Paldark.Save.Dump QA_002` | Snapshot ghi state chết đúng một lần | Snapshot có activity `Downed` | `LogPaldark`, `corr=SAVE-002` |

Nếu bước 4 không có dòng `IncomingDamage` nhưng có dòng `Health before/after`, đó là vi phạm L8 hoặc ít nhất là thiếu bằng chứng. Nếu có hai dòng health mutation cho cùng `corr`, kiểm tra duplicate tick hoặc hai owner cùng ghi. Nếu health đúng nhưng UI vẫn hiện sống, chuyển nghi ngờ sang `LogPaldarkUI` và `OnRep`/presentation boundary, không quay lại sửa hunger.

## 18.5 — Từ câu nói của người chơi tới vùng nghi ngờ

Đến đây ta đã có category, correlation, command và biên bản. Ghép bốn thứ lại,
quy trình điều tra có thể bắt đầu bằng state thay vì bắt đầu bằng file:

1. **Chuẩn hóa câu báo lỗi.** “Tự nhiên chết” được đổi thành target `Pal:Fox_014`, field `Health`, thời điểm, map, authority và session.
2. **Tra bảng owner L8.** `Health` chỉ có một owner. Hunger, burn, combat và UI là requester/observer, không phải nơi được phép ghi.
3. **Dựng correlation.** Chạy command setup, tái hiện bằng command trigger hoặc input thật, lấy `session` và `corr`.
4. **Lọc theo category.** Bắt đầu ở `LogPaldarkGAS` cho mutation health, quay sang `LogPaldarkPal` cho hunger/activity, `LogPaldarkNet` nếu client/server lệch, và `LogPaldarkUI` nếu chỉ phần nhìn sai.
5. **Đọc chuỗi trước–sau.** Tìm dòng request, dòng authority chấp nhận/từ chối, dòng mutation và dòng observer nhận thông báo. Thiếu mắt xích nào thì vùng nghi ngờ nằm ở boundary đó.
6. **Thu hẹp feature.** `reason=HungerStarvation` đưa nghi ngờ vào hunger; `reason=IncomingDamage` đưa việc tính damage về GAS/Health; `authority=Client` trong mutation là lỗi ownership/net; UI sai sau state đúng là lỗi presentation.
7. **Ghi lại bằng chứng.** Biên bản phải chứa command, log filter, correlation, commit và build; không chấp nhận “đã thử trên máy tôi” làm kết luận.

Bản đồ này làm cho decoupling có thể sống được. Không cần mở mọi plugin để đoán ai đã làm gì; chỉ cần biết state owner, đọc đúng category và nối các dòng có cùng correlation id. Nếu một feature chưa có command dựng/quan sát/kích hoạt hoặc mutation không có dòng chuẩn, feature đó chưa hoàn thành L12 dù gameplay nhìn có vẻ chạy.

## 18.6 — Harness bất đồng bộ và âm tính giả

Quy trình trên vẫn có thể kết luận sai nếu harness quan sát quá sớm. Từng tin là client không có request ngay sau map load là lỗi feature. Thực tế
cho thấy harness kết thúc quá sớm, khi actor còn đang replicate. Quyết định
mới: giữ client ít nhất 60 giây, server lâu hơn client, hoặc chờ tín hiệu log
thật; retry dùng looping timer và ghi `QA_PROBE`/`QA_ABORT` rõ ràng. Nghiệm
thu Inventory lấy correlation ID từ client rồi đối chiếu
`SERVER_RECEIVED` → `RESOURCE` → `INVENTORY_MUTATION` ở server và cùng ID
quay lại client. Không dùng request server-local thay cho client evidence.

## 18.7 — Log xanh không chứng minh game chơi được

Harness đã chờ đúng thời điểm vẫn có thể đo sai thứ. Dòng “ready” trả lời rằng
một nhánh code đã chạy; người chơi lại quan tâm nhân vật có hiện đúng, input có
đi qua thiết bị thật và kết quả có thay đổi trong thế giới hay không.

`PALDARK_STATE`, `ASSET_READY` và các dòng “component ready” chỉ chứng minh
đường khởi tạo đã chạy. Chúng không chứng minh người chơi nhìn thấy nhân vật
đúng tỉ lệ, camera không xuyên mesh, hay phím WASD làm vận tốc thay đổi. Một
Windows package đã có log readiness nhưng người test vẫn thấy mesh quá lớn và
nhân vật không di chuyển. Vì vậy nghiệm thu gameplay phải có bằng chứng hình
ảnh từ người test, kèm log runtime để nối nguyên nhân với kết quả.

Với Movement, khoảng cách giữa hai loại bằng chứng hiện ra trong một chuỗi
ngắn. Mapping phải tồn tại, action phải nhận axis thật, rồi velocity mới được
phép đổi. Chuỗi log tối thiểu là:

```text
PALDARK_MOVEMENT_MAPPING_ADDED
PALDARK_MOVEMENT_ACTION action=MoveForward axis=...
PALDARK_MOVEMENT_VELOCITY input_forward=... velocity=...
```

Nếu `axis != 0` nhưng vận tốc không đổi, test fail dù mọi log readiness đều
đạt. Với Presentation, phải đọc giá trị thực tế sau setup: world scale,
relative location/rotation, capsule radius/half-height, spring-arm length,
socket offset và khoảng cách camera tới mesh. Offscreen rendering không thay
thế được Windows visual playtest khi môi trường kiểm thử không có GPU.

Một harness gọi thẳng `AddMovementInput`, `QAApplyMove` hoặc hàm camera không
chứng minh input thật chạy. Bằng chứng input phải đi qua Enhanced Input theo
đúng chuỗi `mapping context added` → `action triggered` với axis khác 0 →
vận tốc ngang hoặc control rotation đổi. Nếu chỉ có log QA xanh mà thiếu chuỗi
này, kết quả là chưa được kiểm chứng. Đây là cùng loại lỗ hổng với trường hợp
nhân vật rơi tự do vẫn phát đủ log readiness nhưng chưa chứng minh được
playtest.

Một log “ready” tại thời điểm khởi tạo cũng không chứng minh object còn sống
khi người chơi bấm phím. Với object Enhanced Input được tạo runtime, package
phải tự kiểm tra lại `context_alive`, số mapping và `actions_alive` ở thời điểm
đã bind, trước khi xử lý input. Mỗi key đọc từ JSON phải được log với
`valid=true`; key invalid phải làm config fail rõ ràng, không được tạo mapping
im lặng rồi chờ một action không bao giờ trigger. Đây là bằng chứng chẩn đoán
gián tiếp, không thay thế Windows playtest bằng bàn phím và chuột thật.

Enhanced Input còn yêu cầu `DefaultPlayerInputClass` trỏ tới
`EnhancedPlayerInput`; `EnhancedInputComponent` đúng một mình là chưa đủ.
Phải log class runtime của `PlayerController->PlayerInput`, vì config sai tên
property có thể để runtime dùng `PlayerInput` mặc định dù mapping context và
binding đều báo thành công.

Với Movement, package phải ghi thêm `PALDARK_MOVEMENT_BINDINGS_READY` và
`PALDARK_MOVEMENT_POSSESSION_CHECK`; WASD phải tạo
`PALDARK_MOVEMENT_ACTION action=MoveForward|MoveRight` rồi
`PALDARK_MOVEMENT_VELOCITY` với `horizontal_speed > 0`. Chuột phải tạo
`action=LookYaw|LookPitch` và thay đổi `control_rotation`; không được thay
thế bằng việc set rotation trực tiếp trong harness. Máy không có GPU chỉ có
thể chứng minh chuỗi log, không thể thay cho người test xác nhận bằng mắt.

Một lỗi khác có thể để WASD và chuột cùng hoạt động nhưng độc lập: handler
movement dùng `GetActorForwardVector()` thay vì trục ngang suy ra từ
`Controller->GetControlRotation()`. Bằng chứng chẩn đoán phải log cùng một
input forward dưới các yaw `0`, `90`, `180`; vector input, acceleration và
velocity phải xoay theo yaw. Chỉ log “camera đã xoay” và “WASD đã có action”
chưa chứng minh hướng di chuyển đúng.

Ba cờ xoay cũng phải được đọc từ runtime: `bUseControllerRotationYaw=false`
trên character, `bOrientRotationToMovement=true` cùng rotation rate trên
`CharacterMovement`, và `bUsePawnControlRotation=true` trên spring arm.
Các giá trị này là data trong `Data/Movement.Input.json`, không hard-code
trong handler. Bài học là phải đo cả vector kết quả và các cờ cấu hình tại
runtime; nếu chỉ đo từng input riêng lẻ, lỗi “chuột xoay nhưng forward không
đổi” vẫn có thể lọt qua. Đây vẫn là bằng chứng gián tiếp trên máy không có
thiết bị thật, còn xác nhận cảm giác third-person thuộc về Windows playtest.

Vì vậy log xanh là bằng chứng cần, nhưng không phải bằng chứng đủ. Nó chứng
minh đường kỹ thuật; visual playtest trên môi trường có thiết bị thật mới xác
nhận cảm giác và presentation. Hai loại bằng chứng bổ sung nhau, không loại
trừ nhau.

## 18.8 — Cook root là một phần của bằng chứng

Đường input đúng trong một package thu hẹp vẫn chưa chứng minh bản người dùng
sẽ nhận có cùng nội dung. Một package được cook từ root thu hẹp tạm thời không tương đương với package
người dùng tạo từ manifest đầy đủ. Vì vậy `PalworldAsset` phải được kiểm tra
với root `/Game/PalworldAsset`, và log phải ghi chính xác mọi `-CookDir` đã
dùng. Khi điều tra crash, phải bisect từng nhánh con trước khi kết luận asset
hỏng; nếu commandlet chết thì lấy callstack từ `Saved/Crashes` hoặc stdout,
đồng thời kiểm tra `dmesg` để phân biệt OOM killer với lỗi asset/engine.

Nếu cùng một root rộng pass sau khi dọn cache/staging và còn đủ RAM/đĩa, kết
quả trước đó không được gọi là asset hỏng nếu chưa tái hiện được. Phải ghi
riêng trạng thái “không tái hiện” và các điều kiện tài nguyên của lần chạy.
Một lần `BUILD SUCCESSFUL` cũng chưa đủ: package đầy đủ phải khởi động
listen server và client, rồi đọc log component/runtime từ cả hai process.

## 18.9 — Combat/Health: chứng minh mutation, không chỉ hit

Các nguyên tắc trên trở nên cụ thể khi một hành vi đi qua hai owner. Với đòn
đánh, animation hit thuộc Combat chưa phải kết quả cuối; HP mutation thuộc
Health mới là state cần chứng minh. Combat và Health phải được đọc theo cùng một correlation id. Chuỗi tối thiểu
là `INPUT/ACTION` → `INTENT` → `VALIDATE` → `DAMAGE_REQUEST` →
`PALDARK_HEALTH_MUTATION` với `health_before`, `health_after`,
`applied_amount` → `RESULT` → client result `authority=false`. Một dòng
`PALDARK_COMBAT_HIT` không có dòng Health mutation tương ứng không phải bằng
chứng cứ target đã trúng đòn.

QA phải có ít nhất một rejection có `reason` cụ thể, ưu tiên cả
`Cooldown` và `OutOfRange`, đồng thời chứng minh Health tự ghi `bDead` hoặc
`bDowned` khi HP về zero. `Combat` không được là writer của HP; nếu diff hoặc
log cho thấy điều đó thì slice fail dù animation và feature state đều xanh.

Crafting bổ sung một yêu cầu tương tự: phải nối cùng correlation qua intent,
validate, input transaction, queue, từng mốc progress, output transaction và
snapshot replicate. Log `JobQueued` không chứng minh fiber/seal đã bị tiêu thụ
hay bandage đã vào túi; phải đọc số lượng trước/sau ở Inventory ở cả authority
và client. Hai nhánh tối thiểu là thành công và rejected với `reason` cụ thể.

## 18.10 — Capture/Creature: chứng minh RNG và owner boundary

Capture thêm ngẫu nhiên và một transaction tạo entity, nên một dòng “success”
càng không đủ để dựng lại quyết định. Capture QA phải chạy trên server với seed cố định, không dùng client RNG. Mỗi
attempt phải có một correlation id xuyên qua intent, HP snapshot, sphere
transaction, entity creation hoặc rejection và client replication. Dòng roll
phải có seed, roll, threshold, `rateCorrect`, HP current/max/ratio/factor và
sphere coefficient để QA tự tính lại `roll < threshold`.

Tối thiểu phải có full-HP failure và reduced-HP success. Failure phải giữ
target sống và áp policy consume sphere từ data; success phải có stable entity
id và dòng roster transfer của `LogPaldarkCreature`. `LogPaldarkCapture` không
được là category ghi HP hoặc inventory slot. Client result phải ghi
`authority=false`; readiness hoặc “capture accepted” không thay thế bằng chứng
transaction và replication.

## 18.11 — Companion: chứng minh entity không phải actor

Sau Capture, bằng chứng không dừng ở lúc actor xuất hiện. Companion phải chứng
minh stable entity vẫn tồn tại khi representation biến mất. Vì vậy Companion phải nối một correlation qua intent, resolve stable id, context
before/after, actor spawn/despawn và client replication. Mọi dòng target dùng
`target=Creature:<stable-id>`; actor name hoặc pointer chỉ được ghi như
metadata representation. Chuỗi QA bắt buộc là summon làm actor tồn tại,
huỷ actor mô phỏng unload nhưng status vẫn ghi `entity_missing=false`, summon
lại dựng actor mới cùng stable id, rồi recall trả context về `Party`.

Actor unavailable là trạng thái bình thường. Chỉ `entity missing` mới là lỗi.
Một dòng actor còn trong level không chứng minh lifecycle; phải có dòng
`PALDARK_COMPANION_ACTOR_UNAVAILABLE` và dòng summon thứ hai cùng stable id.
Nhánh rejected phải có `reason=NotInParty`, còn client result và context phải
ghi `authority=false`.

## 18.12 — Build: chứng minh gate, transaction và structure entity

Build ghép technology gate, vật liệu, không gian và entity creation vào cùng
một lần xác nhận. Để biết gate nào quyết định kết quả, Build QA phải chạy cùng một definition/transform qua nhiều trạng thái. Tối
thiểu cần thấy `TechnologyLocked`, mở technology bằng Progression, rồi
`InsufficientMaterials`; sau khi fixture materials được thêm, một vị trí không
có nền phải bị từ chối với `NoGround`, còn vị trí hợp lệ phải consume đúng cost
và tạo stable `Structure:<id>`. Correlation accepted phải nối validation,
material transaction, structure commit và
`Paldark.Build.Event.StructureReady`; client result/structure phải có
`authority=false`.

Không chấp nhận preview có entity id hoặc structure được spawn bởi client.
Nếu transaction vật liệu thất bại thì không được có structure; nếu creation
thất bại sau consume thì phải có refund evidence. Cost và technology gate phải
đọc từ JSON/Core contracts, không được biến thành state phụ trong Build.

Progression evidence phải thể hiện owner duy nhất: XP, level, technology point
và unlocked set đều có `before/after`, requester và correlation. Hai requester
cùng gửi một unlock chỉ được tạo một mutation. Build phải log query technology
trước khi accepted, không được ghi thay cho Progression.

## 18.13 — Work: chứng minh catch-up không nhân đôi

Work kéo cùng state qua hai nhịp thời gian: live tick và offline catch-up. Lỗi
nguy hiểm nhất không phải thiếu output mà là cùng một khoảng thời gian được
tính hai lần. Vì vậy mở listen server và client với `-PaldarkWorkQA`. Đối chiếu assignment, enqueue,
progress, Inventory transaction, Work finished và client `authority=false`.
Station phải có `slotCount=1`; worker thứ hai bị `SlotConflict`; worker đầu
tiên được log bằng stable id với `actor_available=false`. QA tua checkpoint để
mô phỏng offline trong process, không được gọi đó là unload thật.

Server log phải có `simulation=LiveTick`, `simulation=OfflineCatchUp` và
`simulation=Hybrid`. Hai output phải đúng số giây đã mô phỏng, không duplicate;
attempt sau khi hết input phải bị `reason=MissingInput`. Work không được ghi
quantity trực tiếp và không được thêm need feature trong slice này.

## 18.14 — Bổ sung sau Chương 31

Chương 31 mở rộng bài học entity–actor từ một companion sang dân số thế giới.
World QA phải phân biệt lifecycle của actor representation với lifecycle của
entity. Các dòng `UnloadedForRelevancy` không được đọc thành
`DestroyedByDeath`; sau unload phải có `Paldark.World.Status` cho thấy stable
entity vẫn còn. Spawn evidence phải có correlation xuyên từ reconcile đến row
selection và entity replication, cùng `seed`, `roll`, row, population
before/after và `authority`.

## 18.15 — Dungeon: unload boss không phải defeat

Dungeon ghép lifecycle actor, Health result và reward idempotency trong một
flow dài hơn. Dungeon QA phải dùng một correlation xuyên `enter → run → room → boss →
Health death result → completed → reward claim`. Trước death, ẩn/unload actor
boss phải ghi `completed=false`, `reason=ActorUnloadedWithoutHealthDeath` và
claim phải bị từ chối với `reason=RunNotCompleted`. Chỉ `FDamageResult` từ
Health với `dead=true` mới được complete run.

Gửi cùng `claim_id`/idempotency key trong reward log. Claim đầu phải đối chiếu
Inventory `before/after`; retry phải ghi `ClaimAlreadyProcessed` và không được
có thêm Inventory mutation. Advance sai thứ tự phải có `reason=RoomOrder`.
Client phải nhận trạng thái Dungeon và Health với `authority=false`; Linux
headless chỉ chứng minh log/network evidence, không phải visual dungeon pass.

## 18.16 — Chương 35: ba owner, không nửa transaction

Chương 35 là nơi mức độ bằng chứng phải được giữ đặc biệt chặt: ba plugin tồn
tại không có nghĩa cả ba gameplay flow đã tồn tại. Native QA hiện chỉ nghiệm thu Economy. Chạy packaged listen server/client với
`-Paldark35QA` và đối chiếu source sinh log tại
`EconomyFeatureSubsystem.cpp`: offer stock là member state, số dư đọc qua
`IPaldarkItemRead`, còn mutation đi qua `IPaldarkItemTransaction`. `before`
được đọc trước call và `after` đọc lại sau call. `InsufficientCurrency` chỉ
được log khi số dư thật nhỏ hơn giá.

Breeding và Condenser phải hiện `*_DEFERRED`; không được dùng các dòng đó làm
bằng chứng cho combo thiếu row, sacrifice list, duplicate id hoặc rollback.
Các yêu cầu này đang deferred vì chưa có state owner thật. Chưa có
persistence codec hoặc offline farm catch-up cho Chapter 35.

Từ câu “con Pal tự nhiên chết” ở đầu chương tới các flow dài như Dungeon và
Economy, nguyên tắc không đổi: bằng chứng phải đi qua đúng cửa mà gameplay thật
đi qua. Command giúp dựng state, correlation nối request với mutation, log chỉ
ra owner, còn playtest xác nhận thứ người chơi nhìn thấy. Nếu bỏ một mắt xích,
ta có thể có một dashboard xanh mà vẫn không trả lời được bug report ban đầu.

Chương 19 sẽ biến những yêu cầu này thành gate lặp lại được. CI không thể quyết
định game có vui hay không, nhưng nó có thể từ chối một feature không có owner,
không có correlation hoặc dùng readiness log để giả làm gameplay evidence.

---

**Bằng chứng cho chương này.** Các category `LogPaldark`, `LogPaldarkNet`, `LogPaldarkGAS`, `LogPaldarkWork` và `LogPaldarkPersistence` là OBSERVED trong `PaldarkCoreLog.h`; `LogPaldarkMovement` và việc feature tự define category trong module là OBSERVED từ Movement slice. Các command được liệt kê ở phần đầu là OBSERVED từ PaldarkLab; ba command Movement và cờ `-PaldarkMovementQA` là OBSERVED từ packaged QA. Việc `-ExecCmds` không cho lifecycle kiểm chứng ổn định ở packaged run là OBSERVED trong môi trường UE 5.6 này. Format `PD|...` và quy tắc ba command là thiết kế Paldark theo L9/L12 (INFERRED). Luồng owner/requester/observer dựa trên L8 và mô hình authority/GAS đã giải thích ở Quyển 2; Palworld runtime cụ thể chưa đủ evidence để khẳng định.
