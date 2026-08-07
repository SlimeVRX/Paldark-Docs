# Chương 28 — Xây dựng

Người chơi dừng trước một khoảng đất trống và đã nhìn thấy căn cứ trong đầu: workbench ở đây, kho ở cạnh kia, lối đi quay về cổng. Hệ thống xây dựng phải đưa ý định ấy qua preview, xoay đặt, kiểm tra nền và vật liệu, rồi mới cho ghost trở thành một công trình thật. Cảm giác thỏa mãn nằm ở cú chuyển đó; cảm giác tin cậy nằm ở việc game giải thích được vì sao một vị trí bị từ chối.

Một lần đặt station chạm tới Inventory, Progression, collision và sau này là Work/Crafting, nhưng Build không vì thế sở hữu item quantity, technology unlock hay worker assignment. Nó query các owner đó và chỉ ghi structure state của mình. Khi station đã sẵn sàng, feature khác nhận message; Build không include implementation của họ.

## 28.1 — Vì sao hệ thống này tồn tại

Building đưa progression ra khỏi menu và đặt nó vào không gian. Preview cho phép thử mà chưa mất resource; grid/rotation giúp người chơi tổ chức layout; nền và overlap khiến địa hình tham gia vào quyết định; commit biến ý tưởng thành công trình có HP, owner và stable id.

Nếu UI tự trừ cost trước khi server chấp nhận, hoặc structure actor là identity duy nhất, multiplayer và save sẽ vỡ. Build cần tách preview phiên khỏi structure entity bền.

## 28.2 — Nó chạm những gì trong catalog

- `F-057` — Preview.
- `F-058` — Grid snap.
- `F-059` — Xoay công trình.
- `F-060` — Kiểm tra nền.
- `F-061` — Chồng lấn.
- `F-062` — Technology gate.
- `F-063` — Commit structure.

Các mã catalog đi theo đúng hành trình đặt một vật: preview → điều chỉnh → validate → gate → commit. `BuildObject HP` là evidence về shape của structure data; exact collision, grid size và authority runtime vẫn là `UNKNOWN/INFERRED`. Technology gate chỉ là query tới Progression, không phải quyền ghi của Build.

## 28.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Preview transform và rotation | `Build` local/session | UI, placement preview | `Paldark.Build.Request.Preview` |
| Placement validation result | `Build` authority query | UI, input, log | `Paldark.Build.Request.Validate` |
| Structure entity id/definition id | `Build` | Work, Crafting, Interaction, save | `Paldark.Build.Request.Commit` |
| Structure transform/owner | `Build` | relevancy, UI, Work, save | accepted commit/relocation request |
| Structure HP/damage state | Health owner của structure | Build, combat, UI | `Paldark.Core.DamageRequest` |
| Material quantity | `Inventory` | Build validator, UI | `Paldark.Inventory.Request.Remove` |
| Technology unlock | `Progression` | Build validator, UI | `Paldark.Core.ProgressionRead` |

Bảng phân biệt hai thứ trên màn hình trông gần giống nhau: ghost local và structure authoritative. Preview không phải entity bền, không có stable id và không đi vào save. Chỉ khi material, technology, support, overlap cùng authority checks đều trả kết quả, commit mới tạo structure thật.

## 28.4 — Hợp đồng dữ liệu

Data contract giữ toàn bộ điều kiện tĩnh ở phía definition. `Build.Structure` mô tả loại công trình cùng placement, cost và technology profile; transform runtime và HP hiện tại thuộc state owner khác.

```cpp
USTRUCT()
struct FBuildStructureFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName StructureKind;
    UPROPERTY() FName PlacementProfileId;
    UPROPERTY() FName CostProfileId;
    UPROPERTY() FName TechnologyGateId;
};
```

Definition đã điền:

```json
{
  "id": "Build.Structure.ResonanceWorkbench",
  "schema": 1,
  "display": { "nameKey": "Build.Structure.ResonanceWorkbench.Name" },
  "fragments": [
    {
      "type": "Build.Structure",
      "structureKind": "CraftingStation",
      "placementProfileId": "Build.Placement.GroundSmall",
      "costProfileId": "Build.Cost.ResonanceWorkbench",
      "technologyGateId": "Progression.Technology.ResonanceWorkbench"
    }
  ]
}
```

Cost, gate, placement và structure definition đều là data; `Build.Structure` không tham chiếu `Crafting.Recipe` hay `Work.Station`. Chunk `Paldark.Build`, schema `1`, giữ structure entity, transform, owner relation và trạng thái bền; preview không được đưa vào chunk.

## 28.5 — Giao diện lập trình

Khi người chơi nhấn xác nhận, requester cần gửi cùng definition và transform vừa preview, còn authority phải kiểm lại từ đầu. `UBuildComponent` nằm trên requester, `UBuildStructureComponent` nằm trên representation của structure; Build đọc item/progression qua core interfaces.

```cpp
UFUNCTION()
FBuildPreviewResult RequestPreview(
    FName DefinitionId, const FTransform& Transform);

UFUNCTION()
FBuildValidationResult RequestValidate(
    FName DefinitionId, const FTransform& Transform);

UFUNCTION()
FBuildResult RequestCommit(
    FPaldarkEntityId RequesterId, FName DefinitionId, const FTransform& Transform);

UFUNCTION()
FBuildSnapshot ReadStructure(FPaldarkEntityId StructureId) const;
```

Thân hàm:

```cpp
FBuildResult UBuildComponent::RequestCommit(
    FPaldarkEntityId RequesterId,
    FName DefinitionId,
    const FTransform& Transform)
{
    // Validate definition, technology, material, support and overlap.
    // Ask Inventory owner to commit the material transaction.
    // Create the structure entity and publish the accepted result.
}
```

Kênh phát:

- `Paldark.Build.Event.PreviewChanged`
- `Paldark.Build.Event.StructureReady`
- `Paldark.Build.Result.Rejected`

Kênh nghe:

- `Paldark.Input.Intent.Build`
- `Paldark.Inventory.Event.TransferAccepted`
- `Paldark.Core.Event.TechnologyUnlocked`
- `Paldark.Interaction.Event.ContextOpened`

`Paldark.Build.Event.StructureReady` đã được dùng trong manifest Work ở Chương 16. Work nghe event để nhận station, không include Build. Build không include Inventory; nó gọi `Paldark.Core.ItemRead`/transaction interface và chỉ phát kết quả.

## 28.6 — Quyền hạn và đồng bộ

Preview phải mượt theo từng cú xoay, nhưng commit không thể tin vào màu xanh mà client vừa vẽ. Client được tự dựng ghost, grid preview, rotation và material đỏ/xanh. Server quyết định definition, technology gate, cost, collision, support, owner và commit entity. Client không tự spawn structure thật.

Structure entity id, definition id, transform, owner và relevant HP replicate. Ghost, placement outline, sound và UI error là presentation. Save giữ entity/transform/owner; khi actor unload, structure vẫn được resolve từ entity id.

Health damage của structure đi qua `Paldark.Core.DamageRequest`; Build không ghi HP. Work/Crafting chỉ nhận structure-ready event và tự quyết state assignment/queue của mình.

## 28.7 — Log, console command, và cách biết là chạy đúng

Để giải thích “vì sao không đặt được”, log cần giữ reason mà không spam mỗi frame preview. `LogPaldarkBuild` chỉ ghi khi validation result đổi hoặc khi có commit request. Một commit thành công phải nối material transaction với structure creation bằng cùng `corr`.

Command:

- `Paldark.Build.QA.Setup`
- `Paldark.Build.Status`
- `Paldark.Build.QA.Trigger`
- `Paldark.Inventory.List` — đối chiếu vật liệu sau commit.

Test đúng đi qua cả hai màu của preview: setup player/material/technology, thử vị trí hợp lệ và không hợp lệ, kiểm status có reason; trigger commit; Inventory phải giảm đúng một transaction; structure nhận stable id; sau unload/reload, status vẫn giữ transform và owner.

## 28.8 — Slice đã triển khai và bằng chứng runtime

Contract này đã được ép qua một chuỗi rejection trước khi tới nhánh accepted. Slice native hiện gồm hai Game Feature: `Progression` tối thiểu sở hữu tập
technology đã mở, và `Build` sở hữu structure state. Build đọc
`IPaldarkProgressionRead`, `IPaldarkItemRead` và `IPaldarkItemTransaction` qua
generic interface lookup; không include implementation header của Inventory,
Progression, Crafting, Work hoặc Health. `Build.Structures.json` giữ definition,
gate, cost và placement data; component không hard-code số lượng vật liệu.

Server chạy đúng thứ tự `definition → technology gate → cost/material →
support/nền → overlap → Inventory transaction → structure entity`. QA với cùng
definition và transform hợp lệ ghi nhận:

- `technology_locked` → `reason=TechnologyLocked`;
- mở `Progression.Technology.ResonanceWorkbench` qua request interface;
- cùng request → `reason=InsufficientMaterials`;
- thêm fixture materials, vị trí `Z=-100` → `reason=NoGround`;
- cùng definition ở `(0,400,0)` → consume thành công, tạo
  `target=Structure:<stable-id>` và phát đúng
  `Paldark.Build.Event.StructureReady`.

Correlation của request accepted là
`BDF9748B6DDE4A2A95A3349B305C6F90`, nối validation, hai inventory consume,
structure commit và event ready. Client nhận structure/result với cùng id và
`authority=false`. Preview không được tạo trong QA và không có stable id;
chỉ structure commit mới được replicate/persist.

Một structure có identity mới chỉ là căn nhà đứng yên. Khi Work nghe `StructureReady`, công trình ấy bắt đầu nhận worker, input và progress. Chương 29 đi tiếp từ khoảnh khắc căn cứ không còn là bố cục, mà trở thành một hệ sản xuất có thể vận hành khi người chơi quay lưng đi.

---

**Bằng chứng cho chương này.** `F-057` tới `F-063` là mã thật trong catalog; `BuildObject` HP và technology/build tables là REFERENCE/EXTRACTED theo whitepaper. `Paldark.Build.Event.StructureReady` được dùng lại từ manifest Chương 16. Fragment, component, channels, save chunk và owner table là thiết kế Paldark INFERRED; collision/grid/structure runtime cụ thể là UNKNOWN.
