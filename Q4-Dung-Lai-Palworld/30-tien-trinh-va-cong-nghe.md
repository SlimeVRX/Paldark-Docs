# Chương 30 — Tiến trình và công nghệ

Người chơi trở về sau một chuyến đi, nhận level mới và mở được workbench hôm qua còn khóa. Cùng đống resource cũ bỗng có thêm ý nghĩa vì một recipe mới xuất hiện. Tiến trình hay không nằm ở con số tăng, mà ở việc thế giới cho người chơi thêm lựa chọn mà trước đó họ chưa có.

Vì kết quả của progression xuất hiện ở khắp nơi, feature nào cũng có lý do để muốn ghi vào nó: Crafting muốn tự mở recipe, Build muốn mở structure, Combat muốn mở skill. Đó chính là nguy hiểm. Nếu mỗi hệ thống tự thêm node khi thấy mình cần, cùng một technology state có nhiều chủ ghi, thứ tự request làm kết quả thay đổi và save không còn biết ai chịu trách nhiệm. L8 ở đây phải rất cụ thể: Progression làm chủ tập node đã mở; hệ khác chỉ query hoặc gửi request.

## 30.1 — Vì sao hệ thống này tồn tại

Progression biến hành động lặp lại thành một hướng đi có thể dự tính. EXP, level, status point và technology point cho người chơi lựa chọn; prerequisite cùng cost khiến unlock có trọng lượng; recipe, structure, equipment và station là nơi lựa chọn ấy hiện ra trong gameplay.

Catalog ghi nhận 150+ technology nodes và tier cost như hình dạng reference. Paldark không nên hard-code con số đó vào logic. Điều cần giữ là graph data, một owner cho unlock state và các query ổn định để feature khác biết mình có được phép làm gì.

## 30.2 — Nó chạm những gì trong catalog

- `F-078` — EXP gain.
- `F-079` — EXP curve.
- `F-080` — Level up.
- `F-081` — Level gate.
- `F-082` — Status point.
- `F-083` — Phân bổ status.
- `F-084` — Stat scaling.
- `F-085` — Technology node.
- `F-086` — Prerequisite.
- `F-087` — Technology cost.
- `F-088` — Unlock recipe.
- `F-089` — Unlock structure.
- `F-090` — Unlock equipment.
- `F-091` — Unlock station.

Danh sách catalog đi từ nguyên nhân — EXP gain — qua quyết định — spend point/unlock — tới hậu quả nhìn thấy ở bốn feature khác. Mạch ấy không thay đổi owner: Progression sở hữu unlock, point và level state. Crafting/Build/Combat chỉ đọc query. Một feature có thể phát `Paldark.Progression.Request.XP`, nhưng threshold và mutation vẫn do Progression quyết định.

## 30.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Player XP và level | `Progression` | UI, stat, gate, save | `Paldark.Progression.Request.AddXP` |
| Technology points | `Progression` | technology UI, unlock validator | `Paldark.Progression.Request.SpendPoint` |
| Tập technology node đã mở | `Progression` | Crafting, Build, Combat, Work, UI | `Paldark.Progression.Request.Unlock` |
| Prerequisite graph definition | `Progression` data registry | UI và validator | thêm file definition, không đổi runtime |
| Status points đã nhận/chưa dùng | `Progression` | stat allocator, UI, save | `Paldark.Progression.Request.Add/SpendStatus` |
| Player stat result | stat/attribute owner | combat, movement, UI | `Paldark.Core.AttributeRequest` |
| Recipe/structure/equipment availability | feature tương ứng đọc query | UI, server validator | không tự ghi; `Paldark.Core.ProgressionRead` |

Bảng làm rõ sự khác nhau giữa “nơi kết quả được dùng” và “nơi kết quả được ghi”. Crafting không thêm `Crafting.Recipe.X` vào unlocked set, Build không thêm `Build.Structure.X`, Combat không mở skill bằng cách tự đổi array. Tất cả gửi request tới Progression; đây là ranh giới L8 quan trọng nhất của chương.

## 30.4 — Hợp đồng dữ liệu

Một technology graph là dữ liệu tĩnh; việc player đã đi qua node nào mới là state. `Progression.Node` mô tả node, prerequisite, cost và target. Unlocked set thuộc entity/player và được lưu trong chunk `Paldark.Progression`, schema `1`.

```cpp
USTRUCT()
struct FProgressionNodeFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName NodeKind;
    UPROPERTY() TArray<FName> PrerequisiteIds;
    UPROPERTY() int32 PointCost = 0;
    UPROPERTY() FName UnlockTargetId;
};
```

Definition đã điền:

```json
{
  "id": "Progression.Technology.ResonanceWorkbench",
  "schema": 1,
  "display": { "nameKey": "Progression.Technology.ResonanceWorkbench.Name" },
  "fragments": [
    {
      "type": "Progression.Node",
      "nodeKind": "Technology",
      "prerequisiteIds": [],
      "pointCost": 2,
      "unlockTargetId": "Build.Structure.ResonanceWorkbench"
    }
  ]
}
```

`pointCost=2` là minh họa Paldark, không phải giá trị Palworld. Catalog có 150+ nodes và reference tier cost, nhưng không cung cấp một bảng balance mà Paldark được phép chép. `PrerequisiteIds` tham chiếu definition id text; validator bắt id gãy trước khi chạy.

## 30.5 — Giao diện lập trình

Khi một feature cần biết “được phép chưa?”, nó phải nhận một câu trả lời ổn định chứ không lục mảng state. `UProgressionComponent` nằm trên player progression owner. Feature khác dùng `Paldark.Core.ProgressionRead` hoặc request interface; không include `ProgressionComponent.h`.

```cpp
UFUNCTION()
FProgressionResult RequestAddXP(
    FPaldarkEntityId PlayerId, int32 Amount, FName ReasonId);

UFUNCTION()
FProgressionResult RequestUnlock(
    FPaldarkEntityId PlayerId, FName NodeId);

UFUNCTION()
FProgressionQueryResult QueryUnlocked(
    FPaldarkEntityId PlayerId, FName TargetId) const;

UFUNCTION()
FProgressionSnapshot ReadProgression(FPaldarkEntityId PlayerId) const;
```

Thân hàm:

```cpp
FProgressionResult UProgressionComponent::RequestUnlock(
    FPaldarkEntityId PlayerId,
    FName NodeId)
{
    // Validate authority, prerequisites and available points.
    // Mutate the unlocked-node set owned by Progression.
    // Publish the unlock result and standard mutation log.
}
```

Kênh phát:

- `Paldark.Progression.Event.LevelChanged`
- `Paldark.Progression.Event.NodeUnlocked`
- `Paldark.Progression.Event.StatusChanged`
- `Paldark.Progression.Result.Rejected`

Kênh nghe:

- `Paldark.Combat.Event.HitResolved`
- `Paldark.Crafting.Event.OutputCreated`
- `Paldark.Capture.Event.EntityCreated`
- `Paldark.Core.ProgressionRequest`

Combat, Crafting và Capture có thể phát request/reason, nhưng không include Progression. Build/Crafting query `Paldark.Core.ProgressionRead` khi validate; nếu cần UI refresh, nghe `Paldark.Progression.Event.NodeUnlocked`.

## 30.6 — Quyền hạn và đồng bộ

UI technology tree có thể cho người chơi thử chọn ngay, nhưng node chỉ sáng thật sau quyết định authority. Server quyết định XP accepted, level threshold, point spend, prerequisite, unlock mutation và stat result. Client hiển thị graph, preview node rồi gửi intent; nó không tự mở recipe, structure hay skill.

Unlocked node set, level, available points và relevant stat result replicate. Technology definition graph, names và icons là static data. UI tree, highlight, toast và animation là presentation.

Save chunk `Paldark.Progression` giữ level, points, unlocked node ids và status allocations bền. Không lưu widget selection hoặc graph layout. Khi Crafting/Build hỏi một target, Progression trả query result; feature nhận `false` là một kết quả hợp lệ, không được tự “fallback unlock”.

## 30.7 — Log, console command, và cách biết là chạy đúng

Một toast “Technology unlocked” không đủ để biết owner nào đã thay đổi state. `LogPaldarkProgression` ghi mỗi XP mutation, level change, spend và unlock với requester, target player, node/field, before/after, reason cùng `corr`. Log `Build accepted` không được đồng thời ghi `Technology unlocked`; Build cần node thì phải có dòng query/read trước đó.

Command:

- `Paldark.Progression.QA.Setup`
- `Paldark.Progression.Status`
- `Paldark.Progression.QA.Trigger`
- `Paldark.Experience.Current` — command thật để quan sát experience.
- `Paldark.Experience.ListExtensions` — command thật để quan sát extension registry.

Test đúng bắt đầu bằng một node còn khóa: setup player có point, đọc status, thử unlock thiếu prerequisite để nhận rejection; sau khi dựng prerequisite, unlock phải chỉ tạo mutation ở Progression; `Paldark.Crafting`/`Paldark.Build` query thấy target available và save giữ node qua reload. Cuối cùng phải cho hai feature cùng gửi request để chứng minh vẫn chỉ có một mutation owner.

## 30.8 — Progression mở rộng sau khi ra đời sớm vì Build

Thứ tự xây dựng thực tế đã đặt câu hỏi ownership này sớm hơn câu chuyện. Theo thứ tự tài liệu, Progression là Chương 30; nhưng Chương 28 cần một owner
thật cho technology gate. Vì vậy branch Build giới thiệu `Progression` ở dạng
tối thiểu: chỉ có tập technology đã mở, query `IPaldarkProgressionRead`, và
đường `IPaldarkProgressionRequest::Unlock` dành cho QA. Chương này mở rộng
chính feature đó với graph node, prerequisite, technology point, XP và level;
không tạo owner thứ hai.

Đây là một ghi chú có chủ ý về việc code đi trước thứ tự tài liệu, không phải
đổi owner: Build chỉ query gate, còn Progression là bên duy nhất ghi unlocked
set. Build/Crafting/Combat chỉ query hoặc gửi request qua Core; query trả
`false` là kết quả hợp lệ và không có fallback unlock. Validator bắt
prerequisite id gãy trước runtime. QA chứng minh bốn reason từ chối riêng,
XP do Combat gửi nhưng Progression tự quyết threshold, và hai requester cùng
gửi unlock request cho workbench nhưng chỉ một mutation được ghi. Build ghi
`PALDARK_BUILD_TECHNOLOGY_READ` trước khi accepted, không ghi technology unlock.

Sau chín hệ thống, người chơi đã có một vòng từ khám phá tới căn cứ rồi quay lại unlock. Nhưng vòng ấy vẫn diễn ra trong một sân khấu tĩnh nếu ngày đêm, thời tiết và population không tự thay đổi. Chương 31 đưa nhịp thời gian và sinh sản vào thế giới — đồng thời buộc ta phân biệt entity tồn tại với actor đang relevant thêm một lần nữa.

---

**Bằng chứng cho chương này.** `F-078` tới `F-091`, technology 150+ nodes và tier cost reference là mã/số liệu trong catalog/whitepaper (REFERENCE); player level 1–55+ là REFERENCE, không phải balance Paldark. `Paldark.Experience.Current` và `Paldark.Experience.ListExtensions` là command OBSERVED trong PaldarkLab. `Progression.Node`, `Paldark.Progression.*`, component, JSON, chunk và owner table là thiết kế Paldark INFERRED. Quy tắc Progression là owner duy nhất của unlocked set là áp dụng L8; runtime Palworld persistence/authority cụ thể chưa có đủ evidence và được giữ UNKNOWN.
