# Chương 24 — Chế tạo

Trong túi đã có vài stack nguyên liệu, nhưng bản thân chúng chưa nói người chơi đang tiến về đâu. Một recipe xuất hiện và bỗng mọi thứ có hướng: còn thiếu ba sợi, cần một station, phải đợi hai giây, rồi món đồ mong muốn sẽ thành hình. Cảm giác chính không nằm ở nút “Craft”. Nó nằm ở việc nhìn thấy một kết quả phía trước và tự nối được con đường để tới đó.

Crafting đứng sau Inventory vì con đường ấy bắt đầu và kết thúc bằng item transaction. Recipe có thể đọc item definition, nhưng chỉ Inventory owner được tiêu input và thêm output. Crafting vì thế không include Inventory; nó dùng interface lõi và channel. Khi output là một vũ khí, item mới đi vào inventory, còn Combat không cần biết recipe nào đã tạo ra nó.

## 24.1 — Vì sao hệ thống này tồn tại

Recipe biến resource thành một kế hoạch có thể đọc. Material requirement đặt mục tiêu ngắn hạn; station requirement khiến công trình có chức năng; queue/progress cho người chơi thời gian rời đi làm việc khác; output stack nối thành quả về lại inventory. Một recipe tốt không chỉ bật hoặc tắt nút. Nó cho người chơi biết còn thiếu gì và vì sao chưa thể bắt đầu.

Catalog có nhiều dòng nấu ăn và effect, nhưng chương này chỉ làm lõi craft transaction. Cooking, fuel và buff có thể là feature mở rộng dùng lại `Crafting.Recipe` và `Paldark.Crafting.Event.OutputCreated`, không được tạo một hệ recipe thứ hai.

## 24.2 — Nó chạm những gì trong catalog

- `F-043` — Recipe definition.
- `F-044` — Material requirement.
- `F-045` — Station requirement.
- `F-046` — Craft queue.
- `F-047` — Craft progress.
- `F-048` — Output stack.
- `F-049` — Craft failure reason.
- `F-050` — Cook recipe, ở mức recipe pipeline có thể mở rộng.
- `F-053` — Food output, khi recipe tạo item food.

Danh sách kết thúc ở food output, nhưng lõi của chương chỉ là craft transaction. `F-051` nhiên liệu và `F-054`/`F-055` effect chưa thuộc lõi này. Chúng có thể nghe output hoặc consume event về sau, song state effect vẫn phải do owner khác ghi. Cách cắt ấy cho phép ta chứng minh recipe pipeline trước khi mang cả cooking và buff vào cùng một slice.

## 24.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Recipe definition và fragment tĩnh | `Crafting` data registry | UI, station, technology, validator | thêm/sửa file definition ngoài runtime |
| Recipe unlock và station eligibility | `Crafting` hoặc core progression contract | UI, server craft validator | `Paldark.Crafting.Request.Unlock` / query technology |
| Queue của station | `Crafting` station owner | UI, worker/presentation, save | `Paldark.Crafting.Request.Enqueue` / `Cancel` |
| Progress của job | `Crafting` | UI, save, output handler | server clock/tick của job hợp lệ |
| Input consumption | `Inventory` owner | Crafting, UI, save | `IPaldarkItemTransaction::ConsumeItems` với correlation id |
| Output item entity/quantity | `Inventory` owner | UI, interaction, next recipe | `IPaldarkItemTransaction::AddItems` sau output event |
| Failure reason | `Crafting` result, không phải state bền | UI, log, QA | kết quả của request craft bị từ chối |

Một job craft đi qua hai owner: Crafting giữ lời hứa “job này đang chờ và đã đi tới đâu”, Inventory giữ sự thật “input đã bị lấy và output đã được thêm chưa”. Slice này tiêu thụ input ngay lúc enqueue vì Inventory chưa có reservation API. Crafting đọc qua `IPaldarkItemRead` và ghi qua `IPaldarkItemTransaction`; nó không tự sửa slot. Nếu cả hai cùng giảm input, một request sẽ bị trừ hai lần. Nếu output bị từ chối vì `Capacity`, Crafting yêu cầu Inventory hoàn trả toàn bộ input bằng `AddItems`; nếu hoàn trả cũng thất bại, Crafting ghi `Error` với cả correlation và lý do của hai transaction.

## 24.4 — Hợp đồng dữ liệu

Khi quyền ghi đã tách, recipe có thể trở lại đúng vai trò của data: mô tả điều kiện và kết quả, không giữ một job đang chạy. `Crafting.Recipe` tham chiếu mỗi input bằng item definition id text; output cũng là definition id để registry và validator bắt được reference gãy trước runtime.

```cpp
USTRUCT()
struct FCraftingRecipeFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() TArray<FName> InputDefinitionIds;
    UPROPERTY() TArray<int32> InputQuantities;
    UPROPERTY() FName OutputDefinitionId;
    UPROPERTY() int32 OutputQuantity = 1;
    UPROPERTY() FName StationKind;
    UPROPERTY() float DurationSeconds = 0.f;
};
```

File definition đã điền:

```json
{
  "id": "Crafting.Recipe.ResonanceBandage",
  "schema": 1,
  "display": { "nameKey": "Crafting.Recipe.ResonanceBandage.Name" },
  "fragments": [
    {
      "type": "Crafting.Recipe",
      "inputs": [
        {
          "definitionId": "Inventory.Item.ResonanceFiber",
          "quantity": 3
        },
        {
          "definitionId": "Inventory.Item.ResonanceSealT1",
          "quantity": 1
        }
      ],
      "output": {
        "definitionId": "Inventory.Item.ResonanceBandage",
        "quantity": 1
      },
      "stationKind": "Crafting.Hand",
      "durationSeconds": 2.0
    }
  ]
}
```

Các item id trong ví dụ là definition id Paldark, không phải claim về Palworld. `durationSeconds` là tuning minh họa. Không được hard-code input/output vào `CraftingComponent`; đổi recipe phải thêm hoặc sửa data theo policy, không sửa switch trung tâm.

Feature khai báo khối lưu `Paldark.Crafting`, `schema_version` `1`, cho queue và progress bền nếu sản phẩm yêu cầu job kéo dài qua lần thoát. Nếu vertical slice chỉ craft đồng bộ trong một phiên, chunk có thể vắng mặt; reader vẫn phải coi thiếu chunk là hợp lệ.

## 24.5 — Giao diện lập trình

Từ phía người chơi, enqueue chỉ là một lần bấm; bên trong, nó phải đi qua definition, station, gate và một transaction input nguyên tử. `UCraftingComponent` phục vụ requester, `UCraftingStationComponent` phục vụ station. Crafting chỉ dùng `Paldark.Core.ItemRead`, `Paldark.Core.ItemTransaction`, `Paldark.Core.Authority` và MessageBus; không include `InventoryFeatureComponent.h`, `TechnologyComponent.h` hay `WorkComponent.h`. `ItemRead` chỉ truy vấn, còn `ItemTransaction` consume nguyên tử danh sách input và add nguyên tử output/hoàn trả, tất cả mang correlation id.

```cpp
UFUNCTION()
FCraftingResult RequestEnqueue(
    FPaldarkEntityId RequesterId, FPaldarkEntityId StationId, FName RecipeId, int32 Quantity);

UFUNCTION()
FCraftingSnapshot ReadQueue(FPaldarkEntityId StationId) const;

UFUNCTION()
FCraftingResult RequestCancel(FPaldarkEntityId StationId, FPaldarkEntityId JobId);

UFUNCTION()
FCraftingResult ValidateRecipe(
    FPaldarkEntityId RequesterId, FPaldarkEntityId StationId, FName RecipeId) const;
```

Thân hàm:

```cpp
FCraftingResult UCraftingComponent::RequestEnqueue(
    FPaldarkEntityId RequesterId,
    FPaldarkEntityId StationId,
    FName RecipeId,
    int32 Quantity)
{
    // Resolve recipe and station through core contracts.
    // Ask Inventory owner to reserve required input.
    // Add an accepted job to the Crafting owner and publish the result.
}
```

Kênh phát:

- `Paldark.Crafting.Event.JobQueued`
- `Paldark.Crafting.Event.ProgressChanged`
- `Paldark.Crafting.Event.OutputCreated`
- `Paldark.Crafting.Result.Rejected`

Kênh nghe:

- `Paldark.Inventory.Event.TransferAccepted`
- `Paldark.Inventory.Event.Changed`
- `Paldark.Core.Event.TechnologyUnlocked`
- `Paldark.Interaction.Event.ContextOpened`

Kênh `Paldark.Inventory.Event.Changed` là contract đã dùng trong Chương 23. Crafting nghe event để refresh UI/query, nhưng transaction consume phải là request tới Inventory owner. Không có include giữa hai feature; interface lõi là đường gọi, message là đường thông báo.

## 24.6 — Quyền hạn và đồng bộ

Một client có thể vẽ timer chạy ngay để UI mượt, nhưng timer ấy không được tự biến thành item. Server quyết định recipe tồn tại, station đúng loại, technology/permission, input đủ và queue còn chỗ. Server giữ reservation, progress, completion và output request. Client chỉ hiển thị recipe preview, timer dự đoán và failure tooltip; nó không tự trừ input hoặc tạo output.

Queue entry, progress và accepted/rejected result replicate cho client liên quan. Recipe definition và icon là static data/presentation. Khi job hoàn tất, Crafting yêu cầu Inventory owner atomically add output hoặc trả failure `Capacity`/`Transaction`, rồi Crafting ghi job result phù hợp. Message bus chỉ là đường thông báo (`JobQueued`, `ProgressChanged`, `OutputCreated`, `Rejected`); interface lõi mới là đường gọi mutation.

Offline progress chưa thuộc chương này; nếu sau này worker hoặc station chạy khi người chơi vắng mặt, đó là state/persistence contract mới, không được âm thầm tính ở UI client.

## 24.7 — Log, console command, và cách biết là chạy đúng

Muốn biết một món đồ vì sao chưa xuất hiện, ta cần lần theo job chứ không nhìn nút craft. Category là `LogPaldarkCrafting`. Một job phải để lại các dòng nối được: request validate, input reservation, queue accepted, progress/output và transaction result. `corr` duy nhất cho một lần enqueue; `job` và `station` là target rõ ràng.

Command:

- `Paldark.Crafting.QA.Setup` — tạo station, recipe và fixture inventory.
- `Paldark.Crafting.Status` — in recipe registry, queue, progress và last result.
- `Paldark.Crafting.QA.Trigger` — enqueue/cancel/complete qua public API.
- `Paldark.Inventory.List` — đối chiếu input/output container.

Test đúng đi cả nhánh thất bại lẫn thành công: setup để status thấy recipe; trigger khi thiếu input phải nhận failure có reason; thêm input rồi trigger lại để queue tăng; đọc progress khi job đang chạy; complete phải tạo output qua Inventory transaction. Chỉ nhìn UI recipe mà không kiểm quantity và correlation log chưa chứng minh được craft.

### 24.8 — Slice đã triển khai

Đường đi ấy đã được thu hẹp thành một tình huống đủ nhỏ để kiểm chứng. Vertical slice dùng `Crafting.Recipe.ResonanceBandage`, station
`Crafting.Hand`, thời lượng `2.0` giây và dữ liệu JSON trong
`Plugins/GameFeatures/Crafting/Data/Crafting.Recipes.json`. Component trên pawn
đọc phím `C` từ `Crafting.Input.json`, gửi
`Paldark.Crafting.Intent.Enqueue` qua `APaldarkBaseCharacter`, còn
`UCraftingIntentSubsystem` là handler server duy nhất của feature. Subsystem
duyệt component theo `Paldark.Core.ItemRead` và `Paldark.Core.ItemTransaction`; nó
không biết tên class Inventory. Fixture QA cũng do Crafting nạp qua
`ItemTransaction::AddItems`, nên Inventory không cần đọc cờ hay tên của feature
Crafting.

Trong packaged listen-server/client evidence, một correlation duy nhất đã nối:

```text
client intent
-> server validate
-> fiber 3 -> 0, seal 1 -> 0
-> job queued, progress 0.000 ... 1.000
-> bandage 0 -> 1
-> client owner state authority=false
```

Request thứ hai sau khi job đầu hoàn tất bị từ chối với
`reason=InsufficientQuantity`. Inventory log trước/sau là bằng chứng quantity
thật, không dùng dòng `accepted` đơn độc. Inventory `max_slots` được nâng từ
`2` lên `3` và thêm `ResonanceFiber`/`ResonanceBandage` vì fixture craft cần
giữ đủ input và output; đây là thay đổi data của feature Inventory, không phải
thay đổi logic hay chuyển quyền sở hữu quantity sang Crafting.

Sau chương này, người chơi không chỉ giữ tài nguyên mà đã biến chúng thành công cụ. Công cụ chỉ có trọng lượng khi thế giới có thứ buộc ta phải dùng nó; vì vậy chương tiếp theo đặt output ấy vào combat, nơi animation và âm thanh phải được phân biệt rõ với sự thật rằng một target đã thật sự mất HP.

---

**Bằng chứng cho chương này.** Các mã `F-043` tới `F-050` và `F-053` là mã thật trong catalog; recipe/station/build tables là REFERENCE từ whitepaper, còn queue/progress là INFERRED. `Paldark.Inventory.Event.Changed` và các command Inventory được dùng theo contract Chương 23/PaldarkLab. `Crafting.Recipe`, component, channels, JSON, owner table và authority là thiết kế Paldark INFERRED; duration, input quantity và station behavior cụ thể là tuning minh họa, không phải số Palworld gốc.
