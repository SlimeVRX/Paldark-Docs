# Chương 15b — Composition native: Game Features và Modular Gameplay

Progression là một ngoại lệ có chủ ý về thứ tự chương: Build cần technology
owner ở Chương 28 nên tạo feature tối thiểu trước Chương 30. Slice Chương 30
mở rộng chính feature đó; không tạo owner thứ hai và không chuyển quyền ghi
sang Build hoặc Crafting.

## 15b.1 — Ta đã sai ở đâu

Các Chương 15 và 16 trước đây được viết khi ta chưa có Unreal Engine chạy
được trong môi trường này. Ta đã tự dựng một cơ chế manifest: quét
`Feature/*.feature.json`, tìm class bằng tên string, rồi tự `NewObject` và
`RegisterComponent`. Cơ chế đó chạy được trên happy path standalone, nên ta
đã nói quá lời rằng kiến trúc đã được chứng minh.

Engine source cho thấy Unreal đã có cơ chế chính thức giải đúng bài toán này:
Game Features gọi Modular Gameplay, cụ thể là
`UGameFeatureAction_AddComponents` gọi
`UGameFrameworkComponentManager`. Bài học đắt nhất ở đây là:

> **Trước khi tự thiết kế một cơ chế nền tảng, phải kiểm tra engine đã giải
> quyết bài toán đó chưa.**

Đây là một điều chỉnh tài liệu và hướng kiến trúc. Sau đó Movement và
PlayerPresentation đã được migrate thật và chạy packaged listen-server/client.
Vì vậy chương này vừa là quyết định kiến trúc, vừa là bản ghi những chỗ thực
nghiệm buộc ta phải làm rõ lại.

## 15b.2 — Vấn đề trước, cơ chế sau

Một feature cần nói rằng “khi feature này active, hãy thêm component X vào
actor loại Y”. Nếu mỗi feature tự quét file, tự tìm class, tự theo dõi actor
đã spawn và tự dọn component, thì mỗi feature đang phải viết lại cùng một
runtime infrastructure. Càng nhiều feature, càng nhiều biến thể của cùng một
lifecycle.

Game Features tách hai việc:

1. `GameFeatureData` mô tả đồ thị composition và các action;
2. Modular Gameplay giữ lifecycle của actor/component.

`UGameFeatureAction_AddComponents` lấy `UGameFrameworkComponentManager` từ
`UGameInstanceSubsystem`, lọc request theo net mode, rồi gọi
`AddComponentRequest` với `TSoftClassPtr<AActor>` và
`TSoftClassPtr<UActorComponent>` — không phải tên class string tự strip tiền tố:

```text
GameFeatureAction_AddComponents.cpp:106-143
GameFeatureAction_AddComponents.h:31-49
```

Trên server/client, action chọn request bằng:

```cpp
const bool bIsServer = NetMode != NM_Client;
const bool bIsClient = NetMode != NM_DedicatedServer;

const bool bShouldAddRequest =
    (bIsServer && Entry.bServerComponent) ||
    (bIsClient && Entry.bClientComponent);
```

Nguồn:

```text
GameFeatureAction_AddComponents.cpp:115-124
```

Khi request được thêm, manager tạo component cho actor initialized đang có
trong world (`GameFrameworkComponentManager.cpp:246-303`) và xử lý actor
đăng ký receiver về sau (`GameFrameworkComponentManager.cpp:171-202`).
Actor không tự động tham gia một cách thần kỳ: actor phải gọi
`AddReceiver`/`RemoveReceiver`. Điều kiện này được ghi thẳng trong comment
của manager:

```text
GameFrameworkComponentManager.h:80-92
```

Khi feature deactivate, action giải phóng `FComponentRequestHandle`; destructor
của handle gọi remove request (`GameFrameworkComponentManager.cpp:19-33`).
Các request trùng actor class/component class được reference-count, nên một
feature không thể vô tình gỡ component mà feature khác vẫn đang yêu cầu.

Bản thân component creation cũng có policy native: kiểm tra `AddUnique`,
`AddIfNotChild`, tên object, root attachment, rồi `NewObject` và
`RegisterComponent`. Với component replicated, manager chỉ tạo trên authority:

```cpp
if (!ComponentClass->GetDefaultObject<UActorComponent>()->GetIsReplicated() ||
    ActorInstance->GetLocalRole() == ROLE_Authority)
```

Nguồn đầy đủ:

```text
GameFrameworkComponentManager.cpp:479-556
```

Đây là lý do chuyển sang native không phải vì “native luôn đúng”, mà vì ta
không có lý do chính đáng để tự viết lại net-mode selection, receiver
lifecycle, request ownership và removal semantics.

## 15b.3 — Discovery không còn là filesystem scan runtime

Project policy tìm enabled plugin qua `IPluginManager`, chuyển descriptor
thành Game Feature plugin URL, rồi đưa plugin vào
`UGameFeaturesSubsystem`:

```text
GameFeaturesProjectPolicies.cpp:11-27
GameFeaturesProjectPolicies.cpp:71-88
```

UE 5.6 mặc định chỉ công nhận plugin nằm dưới project:

```text
Plugins/GameFeatures/
```

Nguồn kiểm tra path:

```text
GameFeaturesSubsystemSettings.cpp:19-55
```

Khi plugin được mount trong packaged flow, state machine nạp asset registry
đã cook của plugin từ `AssetRegistry.bin` hoặc registry project fallback:

```text
GameFeaturePluginStateMachine.cpp:2585-2616
```

`GameFeatureData` là `UPrimaryDataAsset`, chứa mảng instanced
`UGameFeatureAction` và metadata `PrimaryAssetTypesToScan`:

```text
GameFeatureData.h:18-26
GameFeatureData.h:108-114
```

Khi registering, subsystem đăng ký chính `GameFeatureData` vào Asset Manager,
đổi path scan theo mounted plugin path, rồi scan các primary asset type được
khai báo:

```text
GameFeaturesSubsystem.cpp:527-544
GameFeaturesSubsystem.cpp:569-623
```

Rule global cho primary asset type `GameFeatureData` là bắt buộc để subsystem
hoạt động. Khi thiếu rule, source phát lỗi:

```text
Asset manager settings do not include a rule for assets of type GameFeatureData,
which is required for game feature plugins to function
```

Nguồn:

```text
GameFeaturesSubsystem.cpp:527-544
```

`PrimaryAssetTypesToScan` trong từng `GameFeatureData` là danh sách asset type
phụ cần scan; nó không thay thế rule global cho chính `GameFeatureData`.

## 15b.4 — Vòng đời và những điều không được giả định

Các target state công khai là `Installed`, `Registered`, `Loaded`, `Active`;
state machine nội bộ có thêm mounting, registering, loading, activating,
dependency và error states.

- `Installed` là plugin đã có thể được mount/install.
- `Registered` là `GameFeatureData` đã được load và đăng ký với Asset Manager.
- `Loaded` là primary assets/bundles cần thiết đã preload.
- `Active` là sau khi dependency hoàn tất và các action nhận
  `OnGameFeatureActivating`.

Các điểm source:

```text
GameFeaturePluginStateMachine.cpp:2027-2041
GameFeaturePluginStateMachine.cpp:3234-3344
GameFeaturePluginStateMachine.cpp:3430-3521
GameFeaturePluginStateMachine.cpp:3763-3810
GameFeaturePluginStateMachine.cpp:3833-3845
```

Activation có async streamable handles, plugin mount, dependency và completion
delegate. Vì vậy code không được giả định rằng gọi activation xong thì
component đã tồn tại ngay trong cùng tick.

Game bình thường không cần Lyra để dùng cơ chế này. Default project policy
gọi `LoadBuiltInGameFeaturePlugins`; game-specific code cũng có thể gọi
`LoadAndActivateGameFeaturePlugin` hoặc native console commands:

```text
GameFeaturesProjectPolicies.cpp:11-27
GameFeaturesSubsystem.cpp:1485-1497
GameFeaturesSubsystem.cpp:386-414
```

Native cũng không giải quyết mọi thứ. Ba giới hạn phải ghi ngay cạnh lời hứa:

1. actor vẫn phải `AddReceiver` để opt-in;
2. activation là bất đồng bộ;
3. source của Game Features không tự chứng minh replication contract của từng
   component cụ thể — actor replication, ownership và behavior của component
   vẫn phải test.

## 15b.5 — Ba lớp: engine, quy ước Paldark, pattern chung

| Điều | Loại | Bằng chứng hoặc quyết định |
|---|---|---|
| `GameFeatureData` là primary data asset chứa instanced actions | Cơ chế Unreal | `GameFeatureData.h:18-26`, `GameFeatureData.h:108-114` |
| `AddComponentRequest`, receiver lifecycle, request handle và reference count | Cơ chế Unreal | `GameFrameworkComponentManager.h:80-92`, `GameFrameworkComponentManager.cpp:19-33`, `171-202`, `479-556` |
| `bClientComponent`, `bServerComponent`, net-mode filtering | Cơ chế Unreal | `GameFeatureAction_AddComponents.cpp:20-24`, `115-137` |
| Plugin nằm dưới `Plugins/GameFeatures/` | Convention native UE 5.6 | `GameFeaturesSubsystemSettings.cpp:19-55`, `GameFeaturePluginTemplate.cpp:31-40` |
| Gameplay definitions/tunables/input/drop table là text | Quy ước Paldark, bảo vệ L7 | Quyết định kiến trúc này |
| Composition graph dùng `GameFeatureData.uasset` | Quy ước Paldark trên cơ chế Unreal | Quyết định kiến trúc này |
| Manifest text là nguồn sự thật; Python sinh `.uasset` | Quy ước Paldark/build pipeline | Kết quả headless test ở 15b.6 |
| Plugin manifest, IoC, owner tự đăng ký | Pattern chung ngành | Pattern, không phải bằng chứng rằng UE tự đọc manifest Paldark |
| Native thiếu Enhanced Input Mapping Context action | Giới hạn inventory UE 5.6 đã khảo sát | Không tìm thấy action native tương ứng; sẽ viết custom action |

Bảng này ngăn một lỗi cũ: không gọi một quy ước của Paldark là “cơ chế
Unreal”, và cũng không gọi một pattern chung là feature native đã được chứng
minh.

## 15b.6 — L7 được làm rõ, không bị xoá

L7 ban đầu viết “cấu hình là text, không phải `.uasset`”. Câu đó bảo vệ đúng
một nhu cầu: agent phải viết thứ đọc được, diff được và review được bằng text.
Nó không cần biến thành lệnh cấm `.uasset` một cách giáo điều.

L7 mới có hai tầng:

1. **Dữ liệu gameplay** — definition, tunable, input mapping, drop table và
   dữ liệu tương tự vẫn là text.
2. **Đồ thị composition** — component nào gắn vào actor nào, registry source
   nào được nạp, action nào được activate dùng `GameFeatureData.uasset`.

Agent vẫn chỉ viết manifest text của feature. Script Python headless đọc
manifest đó, tạo/cập nhật `GameFeatureData` và các action, lưu `.uasset` như
artifact build. `.uasset` không phải nguồn sự thật; CI phải sinh lại và đối
chiếu artifact với source text.

Đây là trade-off được ghi thẳng: pipeline thêm một bước build, và việc
generate phải deterministic đủ để CI phát hiện drift. Đổi lại runtime dùng
composition native thay vì một host tự viết.

Thực nghiệm đã chạy bằng `UnrealEditor-Cmd -run=pythonscript` trên project tạm
đã bật GameFeatures và PythonScriptPlugin. Python nhìn thấy:

```text
unreal.GameFeatureData
unreal.DataAssetFactory
unreal.AssetToolsHelpers
```

Script tạo và save thành công:

```text
/Game/Temp/GFD_Headless.GFD_Headless
CREATE=<Object ... Class 'GameFeatureData'>
SAVE=True
```

Artifact thực tế:

```text
/tmp/PaldarkGF/Content/Temp/GFD_Headless.uasset
```

Lần đầu cố tình thiếu Asset Manager rule và engine phát đúng lỗi
`Asset manager settings do not include a rule for assets of type
GameFeatureData`. Sau khi thêm rule `GameFeatureData` vào
`AssetManagerSettings`, commandlet kết thúc `EXIT_CODE=0`. Kết quả này chứng
minh tạo asset headless khả thi. Khi migrate Movement, ta đã viết generator
thật ở `PaldarkKit/Scripts/generate_game_feature_data.py`; nó đọc manifest,
tạo native `GameFeatureAction_AddComponents` và custom input action, rồi kiểm
tra semantic composition hai lần. Không dùng SHA256 thô của `.uasset` làm
tiêu chí vì Unreal ghi metadata/package bytes khác nhau giữa hai lần save;
tiêu chí deterministic là semantic composition ổn định.

Native 5.6 không có action generic tự đọc JSON gameplay data. Các action dùng
soft class/object references, Data Registry, DataTable, CurveTable,
ExternalDataLayer hoặc CheatManagerExtension. Vì vậy dữ liệu gameplay tiếp tục
ở text; nếu cần input mapping native composition, ta sẽ tự viết
`UGameFeatureAction` cho Enhanced Input — đây là trường hợp đúng để tự viết:
native thiếu, không phải native đã có mà ta chưa khảo sát.

## 15b.7 — Điều thực tế buộc phải chốt lại

### Receiver không thuộc feature

Ta từng nói native receiver lifecycle sẽ xử lý actor có trước và actor spawn
sau, nhưng câu đó dễ bị hiểu thành actor tự được đăng ký. Thực tế cho thấy
`UGameFrameworkComponentManager` chỉ xử lý actor đã opt-in. Vì vậy
`APaldarkBaseCharacter` gọi `AddReceiver` trong `BeginPlay` và `RemoveReceiver`
trong `EndPlay`. Hai lời gọi này nằm ở Runtime, không nằm trong Movement, vì
mọi Game Feature có thể cần gắn component vào base character. Feature chỉ
khai báo component/action; nó không sở hữu opt-in lifecycle của actor chung.

### Input action hiện thuộc feature

UE 5.6 không có native `UGameFeatureAction` generic cho việc đọc cấu hình
Enhanced Input và quản lý mapping context theo schema text của Paldark. Ta đã
viết `UPaldarkMovementInputAction` trong module Movement, vì nó hiểu
`Movement.Input.json`, chỉ có một feature tiêu thụ schema này, và chưa có
contract input-config ổn định cho mọi feature.

Chỉ nâng action lên Runtime khi có ít nhất hai feature dùng cùng
schema/semantics, lifecycle mapping context đã thành contract ổn định, và
action generic không biết tên/path hay state riêng của Movement. Khi chưa đạt
ba điều kiện đó, đặt action ở feature là đúng ownership, tránh tạo shared shim
không có owner thật.

### Dedicated server là UNKNOWN, không được nói quá

Ta đã chứng minh packaged server process mở cổng, client join, và cả hai phía
đều có Movement component: server log có `net_mode=2`, client log có
`net_mode=3`. Đây là listen-server evidence, không phải dedicated-server
evidence. Khi thử tạo `TargetType.Server`, UE 5.6 engine distribution hiện tại
trả về:

```text
Server targets are not currently supported from this engine distribution.
```

Dedicated-server evidence chỉ được đóng khi có engine distribution hỗ trợ
server target hoặc một server binary hợp lệ.

## 15b.8 — Bảng chuyển đổi

| Hiện tại | Đích chuyển đổi |
|---|---|
| `Plugins/Features/<Feature>/` | `Plugins/GameFeatures/<Feature>/` |
| `Feature/*.feature.json` tự scan runtime | Manifest text dùng làm input cho generator |
| `PaldarkComponentHost` tự `FindFirstObject`/`NewObject` | `GameFeatureAction_AddComponents` + ModularGameplay |
| `PostLogin` là điểm attach chính | receiver lifecycle của `UGameFrameworkComponentManager` |
| JSON gameplay data | Giữ nguyên text |
| Composition text | Sinh `GameFeatureData.uasset` phái sinh |
| Input mapping runtime custom | Custom `UGameFeatureAction` cho Enhanced Input vì UE 5.6 không có action native |

Không được đổi layout bằng project policy để giữ `Plugins/Features` chỉ vì
chi phí trước mắt nhỏ. Convention native rẻ bây giờ; một policy tương thích
riêng sẽ đắt về sau cho mọi agent, mọi tool và mọi packaged build.

## 15b.9 — Kế hoạch và tiêu chí nghiệm thu

Kế hoạch chuyển đổi:

1. Thêm generator Python headless, input là manifest text của feature.
2. Tạo `GameFeatureData.uasset` và action composition trong
   `Plugins/GameFeatures/`.
3. Viết custom input action cho Enhanced Input, vẫn đọc gameplay input
   definition từ text.
4. Cho actor/runtime gọi `AddReceiver` khi sẵn sàng và `RemoveReceiver` khi
   rời lifecycle.
5. Migrate Movement trước, rồi PlayerPresentation; không sửa GameMode để
   thêm từng feature. Cả hai feature hiện đã dùng native composition; Runtime
   giữ receiver opt-in chung, còn mỗi feature sở hữu manifest và component của
   mình.
6. Xoá custom manifest attachment chỉ sau khi native path có bằng chứng tương
   đương hoặc mạnh hơn.

Nghiệm thu không còn là standalone happy path. Tối thiểu phải có:

- packaged listen server/client join; dedicated server chỉ khi có Server target
  được engine hỗ trợ;
- client join thành công;
- server và client đều có component đúng theo cờ client/server;
- input hoạt động trên client;
- replicated component chỉ được tạo theo role gate phù hợp;
- actor có trước activation và actor spawn sau activation đều nhận component;
- deactivate gỡ component, không để instance mồ côi;
- log structured theo feature và có correlation;
- generator có thể chạy lại từ manifest text, artifact không drift;
- mọi failure của `GameFeatureData`, class reference và Asset Manager đều là
  failure quan sát được, không phải parse im lặng.

Với Movement và PlayerPresentation, composition native đã được chứng minh ở
mức packaged listen-server/client. PlayerPresentation dùng
`bClientComponent=true`, `bServerComponent=false`: server listen vẫn có
component vì listen server vừa là server vừa là client, còn client join có
component ở `net_mode=3`. Dedicated server vẫn không được suy diễn từ bằng
chứng cứ này.

Thực nghiệm với feature thứ hai cũng cho thấy generator đã generic thật:
manifest chọn feature directory, artifact, module/class và danh sách action;
không còn hằng số Movement trong đường sinh `GameFeatureData`. Cùng script đã
sinh được cả `Movement.uasset` lẫn `PlayerPresentation.uasset`, rồi chạy
semantic deterministic verification cho từng manifest.

Slice Interaction xác nhận thêm hai điểm. Cùng generator tiếp tục sinh được
`Interaction.uasset` từ manifest mới, không cần nhánh đặc biệt cho resource
fixture hay input action. Composition vẫn dùng `GameFeatureAction_AddComponents`;
QA target nằm trong module feature và được spawn sau khi component báo ready,
không được đưa vào `PaldarkScenarioLoader`.

Quyền client/server cũng không phải cờ trang trí. Interaction dùng component
cho cả hai role vì client cần input/session còn server cần nhận intent; target
replicated được server sở hữu theo pawn để RPC có owning connection. Client chỉ
gửi intent, target authority mới kiểm tra range/kind/availability và giảm
resource. Bằng chứng packaged ghi `authority=true` ở server và
`authority=false` ở client, kèm event/resource state cùng correlation. Đây
vẫn là listen-server/client evidence; engine distribution hiện tại không build
được dedicated Server target.

## 15b.10 — Hai giới hạn RPC và lifecycle cần ghi nhớ

Từng tin là component được `GameFeatureAction_AddComponents` gắn vào pawn có
thể là đích RPC như component khai báo sẵn nếu pawn có owning connection.
Thực tế cho thấy server tạo `InteractionFeatureComponent`, còn client tạo
`InteractionFeatureComponent_2147482384`; Unreal không luôn phân giải được
sub-object RPC khi tên/identity lệch. Component Game Feature thêm động vì vậy
không phải đích RPC đáng tin.

Một component trên mỗi pawn cũng không được tự subscribe intent channel toàn
cục. N pawn tạo N handler và có thể duplicate mutation. Quyết định mới là
RPC intent nằm trên `APaldarkBaseCharacter::SubmitIntent`; Core chỉ chuyển
`(Requester, Channel, Payload)`, còn mỗi feature có một handler server-side
duy nhất trong subsystem thuộc feature. Component pawn chỉ đọc input, dựng
payload và gửi intent.

Tick của component thêm động cũng không phải tín hiệu harness đủ tin cậy.
QA dùng looping timer, hỏi lại `IsLocallyControlled()` ở mỗi probe, retry actor
replicate bất đồng bộ và ghi Error khi timeout hoặc owner invalid.
## 15b.11 — Hai feature cho một quyền hạn liên quan

Chapter 25 xác nhận một nguyên tắc composition quan trọng: một feature có thể
gửi request nhưng không được trở thành owner của state mà request tác động.
Combat được compose vào player và đăng ký một server-side intent subsystem;
Health được compose vào target dummy và là writer duy nhất của HP/death/downed.
Combat tìm `IPaldarkDamageReceiver` generically trên actor, không phụ thuộc
module implementation của Health. Runtime scenario/QA spawn dummy, không phải
Combat. `FDamageResult` và Core event bus chỉ là contract/thông báo generic;
Game Feature manifest mới chứa wiring cụ thể.

## 15b.12 — Interface là đường gọi, message là đường thông báo

Crafting xác nhận ranh giới này bằng một vertical slice khác: Core cung cấp
`Paldark.Core.ItemRead` cho đọc quantity và `Paldark.Core.ItemTransaction` cho
consume nguyên tử/add output có correlation id. Inventory implement cả hai và
là owner duy nhất của slot, stack và quantity; Crafting không include header
Inventory và chỉ tìm component theo từng interface. Core message bus chỉ phát các thông báo owner-prefixed
như `JobQueued`, `ProgressChanged`, `OutputCreated` và `Rejected`, không chứa
kiểu Crafting hay biết feature cụ thể. Nhờ vậy một feature mới có thể gọi
container mà không tạo coupling ngược vào plugin Inventory.

## 15b.13 — Entity owner tách khỏi capture request

Chapter 26 mở rộng nguyên tắc hai feature: `Capture` sở hữu attempt/result,
nhưng `Creature` sở hữu stable entity identity và roster. Capture chỉ resolve
Core interfaces rồi đi qua transaction `Inventory → EntityIdentity → roster`;
không tự tạo actor, ghi HP, quantity hoặc roster. `IPaldarkEntityIdentity`
có `Create` và `Destroy` để rollback pending entity khi transfer thất bại.

Khi kết quả có ngẫu nhiên, RNG phải nằm trong server-side intent subsystem.
Seed, roll, threshold và mọi thành phần threshold là bằng chứng bắt buộc,
không được để client quyết định hoặc log một probability không thể tái tính.

## 15b.14 — Entity sống độc lập với actor

Chapter 27 thêm một ranh giới bắt buộc: `FPaldarkEntityId` là identity của
creature, còn actor chỉ là representation có thể xuất hiện hoặc vắng mặt.
Companion nghe `Paldark.Capture.Event.EntityCreated` qua Core message bus để
đưa stable id vào party; nó không include Capture hoặc Creature. Summon đổi
context `Party → World` và dựng một actor bridge mới, nhưng huỷ actor vì
unload/relevancy chỉ làm handle thành rỗng, không xoá entity. Summon lại dùng
cùng stable id để dựng actor khác; recall trả context về `Party`. Movement
nhận mount request qua contract/event và vẫn là owner của movement mode.

## 15b.15 — Preview không phải entity, technology có owner riêng

Chapter 28 xác nhận preview xây dựng là state local/session, không có
`FPaldarkEntityId`, không vào save và không được client spawn thành structure
thật. Chỉ sau khi server đi hết validation và Inventory transaction thành công,
Build mới tạo structure id, owner relation, transform và phát
`Paldark.Build.Event.StructureReady`.

Technology gate không thuộc Build. Vì Progression chưa có ở thời điểm triển
khai Chương 28, một Progression slice tối thiểu được compose sớm để sở hữu
unlocked technology set; Build chỉ query Core interface. Đây là ví dụ code
đi trước thứ tự tài liệu mà không phá vỡ ownership boundary.

## 15b.16 — Work hybrid và stable worker identity

Chapter 29 tiếp tục composition bằng một native Work Game Feature. Work nghe
`Paldark.Build.Event.StructureReady` qua Core message bus, dùng lại
`Work.Capable`/`Work.Station`, và lưu worker bằng `FPaldarkEntityId` thay vì
actor pointer. Inventory vẫn là owner duy nhất của quantity: Work chỉ gọi
`IPaldarkItemTransaction` cho input/output. Hybrid offline policy là
**INFERRED**; log bắt buộc phân biệt `LiveTick`, `OfflineCatchUp` và `Hybrid`.

## 15b.17 — Persistence registry không tạo owner thứ hai

Chapter 33 được triển khai trước 31/32 vì chín hệ thống đã có state cần bảo
toàn. Native Persistence module chỉ cung cấp `UPaldarkSaveChunkRegistry` và
`IPaldarkSaveChunkCodec`: owner đăng ký codec theo `ChunkId`, còn Persistence
điều phối generation, checksum, migration, recovery và relation resolution.
Persistence không include concrete header của Inventory, Companion, Work, Build
hoặc Progression và không ghi quantity, assignment, structure hay unlocked set.
Missing chunk là hợp lệ; relation tới entity chưa relevant là pending theo
stable id.

## 15b.18 — Dungeon chỉ điều phối run, không nhận ownership thay

Chapter 32 thêm Dungeon như một Game Feature native. Dungeon giữ run context,
room index, boss encounter phase, completion và claim/idempotency flag; Health
vẫn là writer của HP/death, còn Inventory là writer của reward quantity. Vì
first-defeat là eligibility của encounter claim chứ không phải technology,
Dungeon là owner duy nhất của flag này; Progression không bị mở rộng thêm
state ngoài unlocked set.

Bằng chứng packaged nối cùng correlation từ enter tới room advance, boss
start, Health death result, completion và reward. Actor boss bị hidden/unload
trước death chỉ tạo `completed=false`; chỉ `dead=true` từ Health mới mở claim.
Retry claim dùng `claim_id`/idempotency key và bị `ClaimAlreadyProcessed`, với
đúng một Inventory transaction. Dungeon không include implementation header
của World, Combat, Inventory, Progression hoặc Health.

## 15b.19 — Breeding, Condenser và Economy

Chapter 35 tiếp tục tách ownership thành ba Game Feature native, không dùng
một bảng state kinh tế chung. Native slice hiện chỉ thực sự nghiệm thu Economy:
offer/price/stock là state của Economy, còn quantity đọc và ghi qua Core
Inventory contracts. Breeding và Condenser vẫn là plugin riêng nhưng QA
`*_DEFERRED`; chưa được nhận là có parent/progress/combination hoặc
sacrifice/rank state thật. Không include Inventory implementation header hay
ghi quantity trực tiếp. Breeding cũng không include Companion để tạo actor.
