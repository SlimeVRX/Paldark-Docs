# Chương 23 — Vật phẩm và túi đồ

Sau vài phút nhặt đá và sợi, người chơi mở túi. Những vật vừa nằm rải rác ngoài thế giới giờ được xếp thành stack, chiếm chỗ, góp weight và bắt đầu cạnh tranh với nhau: mang thêm nguyên liệu hay chừa chỗ cho món chưa biết sẽ gặp? Khoảnh khắc nhặt chỉ kéo dài một nhịp; cảm giác sở hữu bắt đầu khi thứ vừa nhặt vẫn còn đó và buộc người chơi đưa ra lựa chọn.

Túi đồ vì thế là nơi các chuyến đi để lại dấu vết. Nó trả lời vật này là loại gì, đang ở đâu, có bao nhiêu và ai có quyền chuyển nó. Để những câu trả lời ấy không đổi hình dạng giữa runtime, save và UI, chương này bám tuyệt đối mô hình Chương 14: `definition` mô tả loại item, `fragment` mở rộng definition, `entity` là instance cụ thể, còn bản lưu chỉ giữ state bền và quan hệ. Ta không tạo thêm một mô hình “item config / slot object / saved item” chỉ để cùng một vật có ba identity khác nhau.

## 23.1 — Vì sao hệ thống này tồn tại

Inventory biến thu thập thành lựa chọn có hậu quả. Stack giảm ma sát khi gom nguyên liệu lặp lại; weight và capacity đặt giới hạn cho mỗi chuyến đi; category giúp UI cùng các hệ thống sau hiểu item đang đóng vai weapon, food hay material. Một item vì thế không chỉ là icon. Nó có loại, có instance và có một vị trí sở hữu mà mọi transaction phải tôn trọng.

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

Các mã trên cho thấy item sẽ đi xa hơn màn hình túi đồ: nó trở thành input của crafting, output của cooking, consumable và vũ khí. Nhưng dùng chung item không có nghĩa dùng chung quyền ghi. Vũ khí vẫn là item, còn Combat không được include Inventory; nó chỉ dùng `Paldark.Core.ItemRead` hoặc nghe equipment event. Chương 23 sở hữu item/container state, trong khi chương 25 sở hữu damage request/health result.

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

Kéo một stack từ rương sang backpack nhìn như di chuyển một ô, nhưng bảng buộc ta gọi đúng các state đang đổi: location, quantity, weight snapshot và có thể cả equipped context. Chỉ Inventory được commit chuỗi thay đổi ấy.

Một stack có thể biểu diễn nhiều entity giống nhau, hoặc một entity có quantity tùy chọn; contract phải chốt một cách. Ở giai đoạn này, `ItemEntity` giữ instance id và definition id, còn quantity là state của slot/container. Đây là quyết định `INFERRED`, và chính vì vậy nó phải được giữ nhất quán khi save thay vì để mỗi consumer tự diễn giải.

## 23.4 — Hợp đồng dữ liệu

Ranh giới giữa “loại vật” và “đống vật đang có” đi thẳng vào data contract. `Inventory.Item` chứa type, stack limit, weight và category tĩnh. Definition không chứa quantity runtime; nếu một designer đổi stack limit, họ đang đổi luật của loại item, không trực tiếp sửa stack đang nằm trong container.

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

Đây là entity, không phải actor. Actor item rơi có thể biến mất ngay sau transfer, nhưng thứ người chơi sở hữu không được biến mất cùng representation ấy; entity vẫn sống trong container hoặc bản lưu.

Khối lưu của feature là `Paldark.Inventory`, `schema_version` bắt đầu ở `1`. Nó chứa item entity, definition id, quantity và container relation; thiếu khối là hợp lệ theo Chương 14 nếu người chơi chưa từng có inventory của feature này.

## 23.5 — Giao diện lập trình

Từ phía feature khác, Inventory phải giống một quầy giao dịch có sổ cái: caller đưa request, owner kiểm toàn bộ điều kiện rồi commit một kết quả nguyên tử. `UInventoryComponent` gắn vào owner của container; equipment là component ngoài đọc cùng interface. Public API không trả pointer actor cho feature khác.

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

Trong UI, drag một item cần cảm giác tức thời; trong state, cùng item không thể vừa ở rương vừa ở backpack vì hai máy cùng tin prediction của mình. Server/container owner vì thế quyết định create, add, remove, split, transfer, equip và consume. Client có thể mở UI, kéo ghost và gửi intent; nó không tự tạo item entity hoặc đổi quantity. Client liên quan nhận snapshot/delta container cùng transaction result.

Definition static không cần replicate nội dung; chỉ definition id và entity/quantity state cần đi qua mạng khi cần. Icon, tooltip, grid layout và âm thanh inventory là presentation. Nếu client thấy item đã mất trước khi server chấp nhận, UI phải rollback theo result.

Save chunk `Paldark.Inventory` giữ entity id, definition id, container relation và quantity bền. Không lưu widget state, hover slot hay actor pointer. Đây là áp dụng trực tiếp mô hình definition/entity/save chunk của Chương 14.

## 23.7 — Log, console command, và cách biết là chạy đúng

Một animation item bay sang ô mới không chứng minh transaction đã xảy ra. Dùng `LogPaldarkInventory`: transfer thành công phải có before/after quantity hoặc location, source/target container, requester, authority và `corr`. Nếu consume gọi effect khác, Inventory log `Consumed`, còn feature effect log mutation attribute bằng cùng correlation.

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

Test tối thiểu kể lại vòng đời ngắn của một item: bắt đầu ở container rỗng, add item, đọc snapshot, transfer sang container thứ hai, remove một quantity rồi dump composite. Pass chỉ khi quantity/weight/capacity đổi tại một owner, log giữ cùng transaction correlation và snapshot sau load vẫn giữ entity id cùng relation.

---

**Bằng chứng cho chương này.** `F-036` tới `F-042`, `F-048`, `F-053`, `F-056` là mã thật trong catalog. `FPalStaticItemDataStruct`, `MaxStackCount`, `Weight`, `EPalItemTypeA`, `FPalInstanceID` và các taxonomy item là EXTRACTED/REFERENCE trong `C05-Inventory.md`; số `99` và `0.2` trong JSON là INFERRED minh họa, không phải số cân bằng gốc. Các command Inventory liệt kê là OBSERVED trong PaldarkLab. Mô hình definition–fragment–entity–save chunk, component, channels và authority là INFERRED clean-room bám Chương 14.

## 23.8 — Bằng chứng runtime

Contract chỉ có giá trị khi event từ chương trước thật sự chạm được đúng owner. Từng tin là Interaction event chưa có consumer. Thực tế cho thấy Inventory
nghe event Core mà không include header Interaction. Correlation
`BE5D5BE0CB0544038AB4EC19EE4E6889` đi qua server `SERVER_RECEIVED`,
`RESOURCE`, `INVENTORY_MUTATION authority=true`, rồi quay lại client với
`INVENTORY_MUTATION authority=false` và `INVENTORY_DUMP`.

Quyết định mới: Interaction sở hữu resource node quantity; Inventory sở hữu
player item quantity duy nhất. Client không cộng item. JSON definition được
resolve qua registry, stack limit `2` được enforce ở Inventory. Đây là
packaged listen-server + separate client evidence, chưa phải dedicated-server
evidence.

Tới đây, tài nguyên đã đi trọn đường từ một node trong thế giới vào một container có owner. Câu hỏi kế tiếp xuất hiện ngay trong túi đồ: những stack này có thể biến thành gì? Chương 24 dùng transaction vừa ổn định để làm recipe tiêu thụ input và tạo output mà không giành quyền ghi của Inventory.
