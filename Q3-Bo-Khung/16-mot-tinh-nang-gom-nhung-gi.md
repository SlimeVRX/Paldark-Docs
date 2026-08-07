# Chương 16 — Một tính năng gồm những gì

Agent nhận một task không nên bắt đầu bằng việc mở lớp nhân vật chung. Việc đầu tiên là mở thư mục feature của mình, đọc khai báo, tra danh mục khái niệm và biết chính xác những file nào mình được tạo. Nếu không có hình dạng chuẩn, mỗi agent sẽ hiểu “một tính năng” là một class, một Blueprint, một thư mục Content hoặc một commit khác nhau.

Chương này đưa ra một gói tối thiểu có thể giao cho một agent. Gói đó không phải nghi lễ để làm tài liệu dày hơn. Mỗi file có một vai: public contract để người khác include, private implementation để owner giữ quyền ghi, data để registry quét, docs để agent khác dùng, test để CI chạy.

## 16.1 — Cây thư mục chuẩn

Ví dụ dưới đây dùng feature `Work`, nhưng mọi feature đều giữ cùng hình dạng:

```text
Plugins/GameFeatures/Work/
├── Work.uplugin
├── Source/
│   └── Work/
│       ├── Work.Build.cs
│       ├── Public/
│       │   ├── WorkFeature.h
│       │   ├── WorkTypes.h
│       │   ├── WorkMessages.h
│       │   └── WorkSaveChunk.h
│       └── Private/
│           ├── WorkFeature.cpp
│           ├── WorkMessages.cpp
│           ├── WorkSaveChunk.cpp
│           ├── WorkFragmentRegistration.cpp
│           ├── WorkComponent.cpp
│           ├── WorkSubsystem.cpp
│           └── WorkConsoleCommands.cpp
├── Feature/
│   └── Work.feature.json
├── Data/
│   ├── Definitions/
│   │   └── WorkStation.Basic.json
│   ├── Fragments/
│   │   └── Work.Capable.schema.json
│   └── Messages/
│       └── Work.Finished.schema.json
├── Content/
│   ├── Presentation/
│   └── Audio/
├── Docs/
│   ├── README.md
│   ├── Blueprint-Steps.md
│   └── Ownership.md
└── Tests/
    ├── WorkRegistryTests.py
    ├── WorkTransactionTests.py
    └── WorkPlaytest.md
```

| File/thư mục | Mỗi thứ chứa gì |
|---|---|
| `Work.uplugin` | Tên plugin, module, loading phase và dependency của Game Feature |
| `Work.Build.cs` | Module dependency tối thiểu; không kéo plugin feature khác vào |
| `Public/WorkFeature.h` | Interface lõi mà feature công bố; không chứa concrete class ngoài contract |
| `Public/WorkTypes.h` | Struct/message type cần feature khác đọc |
| `Public/WorkMessages.h` | Tên channel và payload contract, không chứa scheduler implementation |
| `Public/WorkSaveChunk.h` | Hình dạng chunk/version interface; codec nằm ở Private |
| `Private/*.cpp` | Component, subsystem, validation, registration, command và mọi mutation của Work |
| `Feature/Work.feature.json` | Manifest text nguồn mô tả owner, state, gameplay data và composition; generator dùng nó để tạo `GameFeatureData.uasset` |
| `Data/Definitions` | Định nghĩa tĩnh; file văn bản được scan theo Chương 14 |
| `Data/Fragments` | Schema hoặc metadata cho loại fragment do Work sở hữu |
| `Content/` | Mesh, animation, VFX, audio và Blueprint presentation nếu feature thật sự cần |
| `Docs/README.md` | Mục tiêu, public contract và cách chạy vertical slice |
| `Docs/Blueprint-Steps.md` | Hướng dẫn editor từng bước theo L11, nếu có Blueprint |
| `Docs/Ownership.md` | Bảng L8: state nào Work làm chủ, requester/observer nào được dùng |
| `Tests/` | Test engine-independent, test transaction và playtest record |

`Public/` chỉ là hợp đồng. Nếu một file public cần include `WorkComponent.h` để người khác gọi implementation cụ thể, ranh giới đang sai. Người dùng Work nên thấy interface, message, definition id và save chunk contract; họ không nên thấy queue nội bộ hoặc pointer tới actor.

### Một lưu ý không được bỏ qua khi package

Ta từng coi `Data/` và `Feature/` là những thư mục mà Unreal tự mang theo cùng plugin. Runtime packaged đã bác bỏ giả định đó: JSON trong `Data/` và manifest `Feature/*.feature.json` không tự được cook như asset. Với Movement đã migrate, packaging script copy tường minh dữ liệu dưới `Plugins/GameFeatures/`, còn `Content/Movement.uasset` là composition artifact được cook. Vì vậy cây thư mục chuẩn trên là cây nguồn, và packaging phải kiểm tra source text, generated artifact cùng file xuất hiện đúng trong archive.

Quyết định mới là packaging script chung phải có bước copy tường minh cho dữ
liệu text mà runtime đọc, còn generator phải đọc manifest text và sinh
`GameFeatureData.uasset`. Với mọi manifest dưới `Plugins/GameFeatures/*/Feature/`,
script quét `content_roots`, chuyển mỗi root `/Game/...` thành một `-CookDir=...`
và chỉ cook đúng các cây content feature yêu cầu; không dùng `-CookAll`. Script
vẫn copy generic mọi file `Data/` và manifest vào archive. Checklist phải kiểm
source text, generated artifact, các `-CookDir` và file đã xuất hiện đúng trong
archive.

## 16.2 — File khai báo tính năng

`Feature/Work.feature.json` là file có tên cố định. Đây là hiện thực của L10 và là nơi máy dựng đồ thị phụ thuộc. Không được thay bằng README, không được chia thành năm file riêng khiến validator phải đoán.

Một file đã điền cho tính năng làm việc/phân công worker:

```json
{
  "schema": 1,
  "feature": {
    "id": "Paldark.Work",
    "owner": "Work",
    "module": "Work"
  },
  "core_interfaces": [
    "Paldark.Core.DefinitionRegistry",
    "Paldark.Core.EntityIdentity",
    "Paldark.Core.Authority",
    "Paldark.Core.MessageBus",
    "Paldark.Core.SaveRegistry"
  ],
  "listens": [
    "Paldark.Inventory.Event.TransferAccepted",
    "Paldark.Build.Event.StructureReady",
    "Paldark.Pal.Event.InstanceAvailable"
  ],
  "emits": [
    "Paldark.Work.Event.AssignmentChanged",
    "Paldark.Work.Event.Finished",
    "Paldark.Work.Result.Fail"
  ],
  "fragments": [
    "Work.Capable",
    "Work.Station"
  ],
  "owns_state": [
    "Paldark.Work.Assignment",
    "Paldark.Work.Queue",
    "Paldark.Work.Progress",
    "Paldark.Work.OfflineOutput"
  ],
  "components": [
    {
      "class": "UWorkStationComponent",
      "attach_to": "APaldarkStructure",
      "reason": "station accepts worker assignments"
    },
    {
      "class": "UWorkRuntimeComponent",
      "attach_to": "APaldarkPalCharacter",
      "reason": "Pal exposes work activity without changing base class"
    }
  ],
  "save_chunks": [
    {
      "id": "Paldark.Work",
      "schema_version": 1,
      "codec": "FWorkSaveChunkCodec"
    }
  ],
  "console_commands": [
    "Paldark.Work.QA.Setup",
    "Paldark.Work.Status",
    "Paldark.Work.QA.Assign",
    "Paldark.Work.QA.Trigger"
  ],
  "data_root": "Data/",
  "composition": {
    "generator": "Scripts/generate_game_feature_data.py",
    "artifact": "Content/Work.uasset"
  }
}
```

Mỗi trường có một lý do tồn tại và một phép kiểm tương ứng:

| Trường | Vì sao cần | Máy kiểm gì |
|---|---|---|
| `schema` | Manifest cũng cần version khi format đổi | Chỉ nhận schema đã biết, bắt migration nếu đổi |
| `feature.id`, `owner`, `module` | Xác định owner và namespace L9 | Id khớp thư mục/plugin/module, không trùng |
| `core_interfaces` | Cho biết feature được phép dùng gì của lõi | Mọi include/message use phải nằm trong allow-list |
| `listens` | Phụ thuộc ngầm phải nhìn thấy trước | Channel có tồn tại và dependency direction có hợp lệ |
| `emits` | Feature công bố API event nào | Không phát channel chưa khai báo; prefix khớp owner |
| `fragments` | Khai báo các loại mảnh feature định nghĩa | Registry có factory/schema tương ứng |
| `owns_state` | Hiện thực L8, tránh hai feature cùng ghi | Owner index không có state trùng |
| `components` | Nói rõ hành vi gắn từ ngoài vào actor nào | Class tồn tại, parent đúng, attach target nằm allow-list |
| `save_chunks` | Hiện thực Chương 14, mỗi tính năng có chunk riêng | `id`, version, codec đăng ký và migration có mặt |
| `console_commands` | Test không phải việc tùy chọn | Có setup, status/dump và trigger; prefix hợp lệ |
| `data_root` | Gameplay registry biết quét ở đâu | Thư mục tồn tại, mọi file đúng schema và là text |
| `content_roots` | Nói rõ các cây asset `/Game/...` mà feature cần khi package | Mỗi root hợp lệ được ánh xạ thành `-CookDir`; không cook thiếu hoặc cook toàn project |
| `composition` | Nói rõ artifact native được sinh từ manifest | Generator chạy headless, artifact là sản phẩm phái sinh và không drift |

### Quy ước ánh xạ contract

Tên logic `Paldark.<Owner>.<Name>` là interface và ánh xạ sang `IPaldark<Name>`/`UPaldark<Name>`. Lớp hiện thực cụ thể dùng tên khác, dạng `UPaldark<Name>Subsystem`; không dùng hậu tố `Contract`. Kênh sự kiện luôn có dạng `Paldark.<Owner>.Event.<Name>`, kênh kết quả có dạng `Paldark.<Owner>.Result.<Name>`. Manifest phải phân biệt interface trong `core_interfaces` với channel trong `listens` và `emits`; không đưa một channel vào danh sách interface chỉ vì nó có chữ `Request`.

Có thể thêm trường `blueprints` hoặc `content_root` khi cần presentation, nhưng không dùng manifest để giấu state. Nếu Work có Blueprint, manifest chỉ nói Blueprint nào là presentation và parent C++ nào; logic vẫn nằm trong module.

## 16.3 — Đi hết một task nhỏ

Giả sử task là: “Cho phép một Pal có `Work.Mining = 2` được gán vào một station khai khoáng, có command để dựng fixture và log khi assignment đổi.” Agent đi theo thứ tự sau:

1. **Tra danh mục.** Tìm `FWorkKindTag`, `FPaldarkFragment`, `FPaldarkEntityId`, owner của assignment và channel liên quan trong Chương 12. Nếu `Work.Capable` chưa có, ghi mục mới vào danh mục trước khi code.
2. **Tạo thư mục plugin.** Tạo plugin dưới `Plugins/GameFeatures/` với
   `Work.uplugin`, module, `Public/`, `Private/`, `Feature/`, `Data/`, `Docs/`
   và `Tests/`. Không sửa `.uproject` trung tâm nếu project policy đã load
   built-in Game Features.
3. **Viết manifest.** Điền `Work.feature.json` với interface, channel,
   fragment, state owner, composition, save chunk, command và data root.
4. **Sinh composition.** Chạy generator Python bằng `UnrealEditor-Cmd
   -run=pythonscript`; kiểm tra `GameFeatureData.uasset`, action class,
   `PrimaryAssetTypesToScan` và Asset Manager rule.
5. **Viết component.** Tạo `UWorkStationComponent` và
   `UWorkRuntimeComponent` trong C++. Component được action native gắn; actor
   phải opt-in `AddReceiver`.
6. **Đăng ký mảnh.** Tạo `FWorkCapableFragment` và
   `WorkFragmentRegistration.cpp`, đăng ký `Work.Capable` bằng registry ở
   Chương 15.
7. **Viết dữ liệu.** Tạo definition JSON cho một Pal hoặc fixture có fragment
   `Work.Capable`, và JSON cho station. Validator phải đọc được trước khi
   chạy game.
8. **Viết command.** Tạo `Paldark.Work.QA.Setup`, `Paldark.Work.Status` và
   `Paldark.Work.QA.Assign`. Command gọi subsystem/authority thật, không set
   private field từ ngoài.
9. **Viết log.** Khi assignment thành công hoặc bị từ chối, ghi `owner`,
   `requester`, `target`, `field`, `before`, `after`, `reason` và `corr` theo
   format L12.
10. **Viết test engine-independent.** Kiểm fragment lookup, suitability level,
    duplicate assignment, missing station và manifest/registry consistency.
11. **Viết playtest.** Chạy command setup, assign, status; ghi
    expected/actual/log correlation vào `Tests/WorkPlaytest.md`.
12. **Test multiplayer thật.** Chạy packaged listen server và cho client join,
    kiểm actor receiver, component ở client/server theo cờ của từng feature,
    input và deactivate cleanup.
    Không gọi đây là dedicated-server test nếu binary là listen server. UE 5.6
    engine distribution hiện tại không build được `TargetType.Server`, nên
    dedicated-server evidence vẫn là UNKNOWN cho đến khi có server target hợp lệ.
13. **Tự kiểm tra boundary.** Không có include sang feature khác, không sửa lớp
    cơ sở, không có Blueprint gameplay logic, không ghi state ngoài owner.
14. **Gửi review.** Kèm manifest text, generator output, artifact hash,
    command output, server/client log và những điểm UNKNOWN.

Thứ tự này cố ý đi từ thông tin tới code. Nếu viết component trước rồi mới phát hiện assignment đã có owner khác, agent sẽ phải di chuyển state giữa các module — chính là loại thay đổi làm nhiều agent cùng dừng lại.

## 16.4 — Checklist trước khi coi là xong

- [ ] `Work.uplugin` khai báo đúng module và loading phase.
- [ ] `Work.Build.cs` chỉ phụ thuộc core/interface cần thiết, không include feature khác.
- [ ] `Feature/Work.feature.json` tồn tại đúng tên, parse được và generator đọc được.
- [ ] `feature.id`, `owner`, module và mọi id dữ liệu có prefix `Paldark.Work`.
- [ ] `core_interfaces`, `listens`, `emits` đều trỏ tới contract đã tồn tại hoặc được ghi UNKNOWN.
- [ ] Mỗi state trong `owns_state` có đúng một owner trong danh mục quyền ghi.
- [ ] Mỗi component có lớp C++ parent/target rõ và không sửa lớp cơ sở.
- [ ] Mọi loại mảnh trong `fragments` có factory/schema/registration.
- [ ] Mọi definition JSON chỉ dùng fragment đã đăng ký và id không trùng.
- [ ] Save chunk có id, schema version, codec, deserialize và migration.
- [ ] Feature có command để dựng state, quan sát state và kích hoạt hành vi.
- [ ] Mutation state có log theo L12 với correlation id.
- [ ] Test bắt được assignment duplicate, missing reference, authority sai và save round-trip.
- [ ] Blueprint, nếu có, chỉ kế thừa C++ và làm presentation theo Chương 17.
- [ ] `Docs/Blueprint-Steps.md` tồn tại nếu agent phải mở editor.
- [ ] Không có gameplay config trong `.uasset`; `.uasset` chỉ là composition artifact.
- [ ] Manifest text và generated `GameFeatureData.uasset` không drift.
- [ ] Listen server + client join đã chứng minh component, input và cleanup
      theo đúng `bClientComponent`/`bServerComponent` của feature.
- [ ] PlayerPresentation đã chứng minh component ở client (`net_mode=3`), mesh/
      AnimBP load và `reason=core_interface`; trên listen server component có
      mặt vì listen server cũng là client.
- [ ] Dedicated server chỉ đánh dấu hoàn thành khi engine build được Server target
      và log chứng minh net mode dedicated.
- [ ] `git diff --name-only` chỉ chứa file thuộc plugin Work hoặc exception đã được duyệt.

Checklist này là điểm giao giữa agent và CI. Một agent có thể hoàn thành code mà quên manifest; với Paldark, như vậy chưa phải hoàn thành feature.

---

**Bằng chứng cho chương này.** Cây plugin, manifest text, gameplay data,
generator và checklist là thiết kế Paldark (INFERRED). Game Features,
`GameFeatureData`, plugin discovery, Asset Manager, net-mode filtering,
receiver lifecycle và component request là OBSERVED từ source UE 5.6; xem
Chương 15b. Việc Unreal 5.6 không tự cook JSON `Data/` và manifest cũ là
OBSERVED từ Movement package. Quyết định coi manifest text là source of truth
và `.uasset` là artifact phái sinh là quyết định Paldark, chưa phải native
engine behavior. Tên lớp trong ví dụ vẫn là hợp đồng phác thảo
(UNKNOWN/INFERRED).

Interaction là feature thứ ba dùng cùng đường sinh artifact và là bằng chứng
thực nghiệm rằng generator không biết tên feature. Manifest
`Interaction.feature.json` sinh `Interaction.uasset`; JSON input/resource vẫn
được copy riêng vào package. Runtime QA chứng minh client gửi intent, server
authority giảm resource, rồi replicated event và quantity về client. Fixture
được spawn trong Interaction, không nằm trong Runtime scenario loader. Vì
engine distribution chưa build được Server target, checklist chỉ đóng ở mức
listen-server/client join, không ghi dedicated-server proof.
