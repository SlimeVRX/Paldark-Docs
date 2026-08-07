# Chương 30 — Tiến trình và công nghệ

Tiến trình là cảm giác một chuyến đi có ý nghĩa sau khi người chơi quay về. Hôm nay chưa craft được station, ngày mai đã mở được; một node mới làm resource cũ có giá trị khác; một level mới mở ra lựa chọn chứ không chỉ tăng con số. Vì vậy ai cũng muốn ghi vào tiến trình: Crafting muốn tự mở recipe, Building muốn tự mở structure, Combat muốn tự mở skill.

Đó chính là nguy hiểm. Nếu mỗi hệ thống tự thêm node khi thấy mình cần, L8 không còn nghĩa gì: cùng một technology state có nhiều chủ ghi, thứ tự request tạo ra kết quả khác nhau, và save không biết ai chịu trách nhiệm. Progression phải làm chủ tập node đã mở; hệ khác chỉ hỏi.

## 30.1 — Vì sao hệ thống này tồn tại

Progression biến hành động thành hướng đi. EXP, level, status point và technology point cho người chơi lựa chọn; prerequisite và cost khiến unlock có trọng lượng; recipe, structure, equipment và station là những nơi kết quả được nhìn thấy.

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

Progression sở hữu unlock state và point/level state. Crafting/building/combat đọc query. Một feature có thể phát `Paldark.Progression.Request.XP`, nhưng chỉ Progression quyết định threshold và mutation.

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

Đặc biệt, Crafting không được thêm `Crafting.Recipe.X` vào unlocked set, Build không được thêm `Build.Structure.X`, Combat không được mở skill bằng cách tự đổi array. Tất cả gửi request tới Progression; đây là ranh giới L8 quan trọng nhất của chương.

## 30.4 — Hợp đồng dữ liệu

Mảnh do Progression định nghĩa là `Progression.Node`. Nó mô tả một node tĩnh, còn unlocked set là state của entity/player và được lưu trong chunk `Paldark.Progression`, schema `1`.

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

Component là `UProgressionComponent` trên player progression owner. Các feature khác dùng `Paldark.Core.ProgressionRead` hoặc request interface; không include `ProgressionComponent.h`.

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

Server quyết định XP accepted, level threshold, point spend, prerequisite, unlock mutation và stat result. Client được hiển thị graph, preview node và gửi intent; client không tự mở recipe/structure/skill.

Unlocked node set, level, available points và relevant stat result replicate. Technology definition graph, names và icons là static data. UI tree, highlight, toast và animation là presentation.

Save chunk `Paldark.Progression` giữ level, points, unlocked node ids và status allocations bền. Không lưu widget selection hoặc graph layout. Khi Crafting/Build hỏi một target, Progression trả query result; feature nhận `false` là một kết quả hợp lệ, không được tự “fallback unlock”.

## 30.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkProgression`. Mỗi XP mutation, level change, spend và unlock phải có requester, target player, node/field, before/after, reason và `corr`. Một log `Build accepted` không được đồng thời ghi `Technology unlocked`; nếu Build cần node, nó phải có dòng query/read trước đó.

Command:

- `Paldark.Progression.QA.Setup`
- `Paldark.Progression.Status`
- `Paldark.Progression.QA.Trigger`
- `Paldark.Experience.Current` — command thật để quan sát experience.
- `Paldark.Experience.ListExtensions` — command thật để quan sát extension registry.

Test đúng: setup player với point; status thấy node locked; trigger unlock thiếu prerequisite nhận rejection; setup prerequisite rồi unlock, chỉ Progression ghi node; `Paldark.Crafting`/`Paldark.Build` query thấy target available; save snapshot giữ node sau reload. Test phải bắt trường hợp hai feature cùng gửi unlock request và chỉ có một mutation owner.

## 30.8 — Progression mở rộng sau khi ra đời sớm vì Build

Theo thứ tự tài liệu, Progression là Chương 30; nhưng Chương 28 cần một owner
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

---

**Bằng chứng cho chương này.** `F-078` tới `F-091`, technology 150+ nodes và tier cost reference là mã/số liệu trong catalog/whitepaper (REFERENCE); player level 1–55+ là REFERENCE, không phải balance Paldark. `Paldark.Experience.Current` và `Paldark.Experience.ListExtensions` là command OBSERVED trong PaldarkLab. `Progression.Node`, `Paldark.Progression.*`, component, JSON, chunk và owner table là thiết kế Paldark INFERRED. Quy tắc Progression là owner duy nhất của unlocked set là áp dụng L8; runtime Palworld persistence/authority cụ thể chưa có đủ evidence và được giữ UNKNOWN.
