# Chương 23 — Vật phẩm và túi đồ

Nhặt được một thứ chỉ vui trong khoảnh khắc. Cảm giác giữ được nó, gộp nó với những thứ đã có, quyết định mang theo hay bỏ lại mới làm resource có trọng lượng. Túi đồ là nơi người chơi nhìn thấy hậu quả của các chuyến đi: còn chỗ không, còn nặng không, vật này dùng để làm gì, và có nên dành nó cho một công thức sau này không.

Chương này phải bám tuyệt đối mô hình của Chương 14. Một `definition` mô tả loại item; một `fragment` mở rộng definition; một `entity` là item instance cụ thể; bản lưu chỉ giữ state bền và quan hệ. Không tạo một mô hình “item config / slot object / saved item” khác tên để né mô hình đó.

## 23.1 — Vì sao hệ thống này tồn tại

Inventory biến thu thập thành lựa chọn. Stack giảm ma sát khi người chơi gom nguyên liệu; weight làm mỗi chuyến đi có giới hạn; capacity buộc người chơi quyết định thứ nào đáng giữ; category giúp UI và các hệ thống sau biết item là weapon, food hay material. Một item không chỉ là icon: nó là definition, instance và vị trí sở hữu.

Palworld source cho thấy hình dạng bảng item khá rộng: `FPalStaticItemDataStruct` có type, stack, weight, price và nhiều field equipment/effect; `EPalItemTypeA` có các nhánh như `Glider`, `Shield`, `Essential_PalGear`. Những declaration này cho biết cần nhiều chiều dữ liệu, không cho phép ta bịa ra giá trị cân bằng hay số slot gốc.

## 23.2 — Nó chạm những gì trong catalog

- `F-036` — Item definition.
- `F-037` — Item instance.
- `F-038` — Stack count.
- `F-039` — Weight.
- `F-040` — Capacity.
- `F-041` — Item category.
- `F-042` — Transfer giữa container.
- `F-048` — Output stack.
- `F-053` — Food output.
- `F-056` — Consumable use.

Vũ khí cũng là item theo catalog, nhưng combat không được include Inventory. Combat chỉ dùng interface lõi `Paldark.Core.ItemRead` hoặc nghe equipment event. Đây là điểm quan trọng: chương 23 sở hữu item/container state; chương 25 sở hữu damage request/health result.

## 23.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Item definition và fragment tĩnh | `Inventory` data registry | inventory, crafting, combat, UI | không đổi lúc chạy; thêm file definition |
| Item entity: instance id, definition id | `Inventory` | container, equipment, save, interaction | `Paldark.Inventory.Request.Create` |
| Quantity/stack count trong container | container owner của `Inventory` | UI, crafting, equipment, save | `Paldark.Inventory.Request.Add/Remove/Split` |
| Weight và capacity snapshot | `Inventory` | UI, pickup validator, movement nếu có rule | request transfer/add/remove được chấp nhận |
| Vị trí sở hữu item | `Inventory` | interaction, crafting, equipment, save | `Paldark.Inventory.Request.Transfer` |
| Equipped item context | `Inventory` equipment component | combat, input, UI | `Paldark.Inventory.Request.Equip` |
| Consumable effect result | feature sở hữu attribute/effect | UI, player/Pal state | `Paldark.Core.EffectRequest`, không cho Inventory ghi state khác |

Một stack có thể là biểu diễn container của nhiều entity giống nhau, hoặc một entity có quantity tùy chọn; contract phải chốt một cách. Ở giai đoạn này, `ItemEntity` giữ instance id và definition id, còn quantity là state của slot/container. Đây là một quyết định INFERRED cần giữ nhất quán khi save.

## 23.4 — Hợp đồng dữ liệu

Loại mảnh hệ thống định nghĩa là `Inventory.Item`. Definition không chứa quantity runtime. Fragment chứa type, stack limit, weight và category tĩnh.

```cpp
USTRUCT()
struct FInventoryItemFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName ItemType;
    UPROPERTY() FName Category;
    UPROPERTY() int32 MaxStackCount = 1;
    UPROPERTY() float Weight = 0.f;
    UPROPERTY() FName UseChannel;
};
```

File definition đã điền:

```json
{
  "id": "Inventory.Item.ResonanceSealT1",
  "schema": 1,
  "display": { "nameKey": "Inventory.Item.ResonanceSealT1.Name" },
  "fragments": [
    {
      "type": "Inventory.Item",
      "itemType": "Resource",
      "category": "Material",
      "maxStackCount": 99,
      "weight": 0.2,
      "useChannel": "Paldark.Inventory.Event.Consumed"
    }
  ]
}
```

Các số `99` và `0.2` là giá trị minh họa Paldark, không phải balance Palworld. Source chỉ chứng minh có field `MaxStackCount` và `Weight`; nếu chưa có bảng tuning của Paldark thì phải coi giá trị là INFERRED và thay bằng data đã được duyệt.

Entity và bản lưu giữ hình dạng Chương 14:

```cpp
USTRUCT()
struct FInventoryItemEntity
{
    GENERATED_BODY()

    UPROPERTY() FPaldarkEntityId InstanceId;
    UPROPERTY() FName DefinitionId;
    UPROPERTY() FPaldarkEntityId ContainerId;
    UPROPERTY() int32 Quantity = 1;
};
```

Đây là entity, không phải actor. Actor item rơi có thể biến mất sau khi transfer; entity vẫn sống trong container hoặc bản lưu.

Khối lưu của feature là `Paldark.Inventory`, `schema_version` bắt đầu ở `1`. Nó chứa item entity, definition id, quantity và container relation; thiếu khối là hợp lệ theo Chương 14 nếu người chơi chưa từng có inventory của feature này.

## 23.5 — Giao diện lập trình

Component chính là `UInventoryComponent`, gắn vào owner của container; equipment là component ngoài đọc cùng interface. Public API không trả pointer actor cho feature khác.

```cpp
UFUNCTION()
FInventoryResult RequestAdd(
    FPaldarkEntityId ContainerId, FName DefinitionId, int32 Quantity);

UFUNCTION()
FInventoryResult RequestRemove(
    FPaldarkEntityId ContainerId, FName DefinitionId, int32 Quantity);

UFUNCTION()
FInventoryResult RequestTransfer(
    FPaldarkEntityId SourceContainerId, FPaldarkEntityId TargetContainerId, FPaldarkEntityId ItemId);

UFUNCTION()
FInventorySnapshot ReadContainer(FPaldarkEntityId ContainerId) const;

UFUNCTION()
FInventoryResult RequestEquip(FPaldarkEntityId ContainerId, FPaldarkEntityId ItemId, FName SlotId);
```

Thân hàm:

```cpp
FInventoryResult UInventoryComponent::RequestTransfer(
    FPaldarkEntityId SourceContainerId,
    FPaldarkEntityId TargetContainerId,
    FPaldarkEntityId ItemId)
{
    // Validate requester, ownership, item location and capacity.
    // Commit one inventory transaction or reject it atomically.
    // Emit transfer result, mutation log and save-dirty notification.
}
```

Kênh phát:

- `Paldark.Inventory.Event.TransferAccepted`
- `Paldark.Inventory.Event.Changed`
- `Paldark.Inventory.Event.Consumed`
- `Paldark.Inventory.Result.Rejected`

Kênh nghe:

- `Paldark.Interaction.Event.PickupAccepted`
- `Paldark.Crafting.Event.OutputRequested`
- `Paldark.Combat.Event.EquipmentRequested`
- `Paldark.Core.EffectRequest`

Các channel là contract, không phải include. Combat muốn biết weapon đang equip thì gọi `Paldark.Core.ItemRead` hoặc nghe `Paldark.Inventory.Event.Changed`; nó không include `InventoryComponent.h`. Crafting đọc qua `Paldark.Core.ItemRead`, yêu cầu consume input qua `Paldark.Core.ItemTransaction`, không tự trừ quantity.

## 23.6 — Quyền hạn và đồng bộ

Server/container owner quyết định create, add, remove, split, transfer, equip và consume. Client có thể dự đoán mở UI, drag ghost và gửi intent; client không tự tạo item entity hoặc đổi quantity. Client liên quan nhận snapshot/delta container và result transaction.

Definition static không cần replicate nội dung; chỉ definition id và entity/quantity state cần đi qua mạng khi cần. Icon, tooltip, grid layout và âm thanh inventory là presentation. Nếu client thấy item đã mất trước khi server chấp nhận, UI phải rollback theo result.

Save chunk `Paldark.Inventory` giữ entity id, definition id, container relation và quantity bền. Không lưu widget state, hover slot hay actor pointer. Đây là áp dụng trực tiếp mô hình definition/entity/save chunk của Chương 14.

## 23.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkInventory`. Một transfer thành công phải có before/after quantity hoặc location, source/target container, requester, authority và `corr`. Nếu consume gọi effect khác, Inventory log `Consumed`, còn feature effect log mutation attribute bằng cùng correlation.

Command đã có thật:

- `Paldark.Inventory.List`
- `Paldark.Inventory.Add`
- `Paldark.Inventory.Remove`
- `Paldark.Inventory.Drop`
- `Paldark.Inventory.EquipBackpack`
- `Paldark.Inventory.DumpComposite`

Command QA đề xuất:

- `Paldark.Inventory.QA.Setup`
- `Paldark.Inventory.Status`
- `Paldark.Inventory.QA.Trigger`

Test tối thiểu: setup một container rỗng, add item, list snapshot, transfer sang container thứ hai, remove một quantity, dump composite. Đúng là quantity/weight/capacity thay đổi tại một owner, log có transaction correlation, load lại snapshot vẫn giữ entity id và relation.

---

**Bằng chứng cho chương này.** `F-036` tới `F-042`, `F-048`, `F-053`, `F-056` là mã thật trong catalog. `FPalStaticItemDataStruct`, `MaxStackCount`, `Weight`, `EPalItemTypeA`, `FPalInstanceID` và các taxonomy item là EXTRACTED/REFERENCE trong `C05-Inventory.md`; số `99` và `0.2` trong JSON là INFERRED minh họa, không phải số cân bằng gốc. Các command Inventory liệt kê là OBSERVED trong PaldarkLab. Mô hình definition–fragment–entity–save chunk, component, channels và authority là INFERRED clean-room bám Chương 14.

## 23.8 — Bằng chứng runtime

Từng tin là Interaction event chưa có consumer. Thực tế cho thấy Inventory
nghe event Core mà không include header Interaction. Correlation
`BE5D5BE0CB0544038AB4EC19EE4E6889` đi qua server `SERVER_RECEIVED`,
`RESOURCE`, `INVENTORY_MUTATION authority=true`, rồi quay lại client với
`INVENTORY_MUTATION authority=false` và `INVENTORY_DUMP`.

Quyết định mới: Interaction sở hữu resource node quantity; Inventory sở hữu
player item quantity duy nhất. Client không cộng item. JSON definition được
resolve qua registry, stack limit `2` được enforce ở Inventory. Đây là
packaged listen-server + separate client evidence, chưa phải dedicated-server
evidence.
