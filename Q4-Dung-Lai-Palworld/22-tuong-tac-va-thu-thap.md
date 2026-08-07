# Chương 22 — Tương tác và thu thập

> Chương này được viết lại sau khi slice Interaction đã chạy thật trên UE 5.6.
> Các mục phía dưới giữ lại ý định thiết kế ban đầu, nhưng mọi quyết định
> runtime phải đọc theo phần “Từng tin là → Thực tế cho thấy → Quyết định mới”.

Một hòn đá chỉ trở thành tài nguyên khi người chơi có thể nhận ra nó, tới gần, làm một hành động và thấy thứ đó đi vào hành trình của mình. Cảm giác “tôi nhặt được thứ này” là điểm nối đầu tiên giữa thế giới và túi đồ; nếu tương tác không rõ, mọi hệ thống phía sau đều trở thành menu rời rạc.

Chương này không làm inventory thay chương 23. Nó làm phần trước inventory: chọn target, kiểm tra range/permission, và phát ra một yêu cầu thu thập hoặc tương tác. Kết quả thành công mới tạo item instance hoặc gửi transaction cho container owner.

## 22.1 — Vì sao hệ thống này tồn tại

Tương tác cho người chơi một ngôn ngữ đơn giản: nhìn vào vật thể, bấm nút, nhận phản hồi. Thu thập biến địa hình thành nguồn lực; inspect cho người chơi biết mình đang nhìn gì; interact với station mở đường sang crafting hoặc building mà không cho Interaction biết code của những hệ thống đó.

Điểm khó nằm ở chỗ target có thể là resource node, item rơi, station, chest hoặc actor khác. Hệ thống này cần một contract chung cho “có thể tương tác”, nhưng không được biến mọi actor thành một lớp khổng lồ. Component gắn ngoài và message giúp từng feature giữ phần state của mình.

## 22.2 — Nó chạm những gì trong catalog

- `F-008` — Sinh vật lang thang, ở mức chọn/nhận diện encounter.
- `F-036` — Item definition, khi thu thập cần biết loại item.
- `F-037` — Item instance, khi kết quả tạo ra một bản cụ thể.
- `F-042` — Transfer giữa container, khi pickup hoặc harvest chuyển ownership.
- `F-043` — Recipe definition, khi tương tác với station để mở recipe context.
- `F-063` — Commit structure, ở mặt tương tác với công trình đã tồn tại.

`F-008` chỉ được chạm ở phần target discovery; Interaction không sở hữu AI hay encounter state. Tương tự, nó không tự thêm item vào inventory bằng cách gọi `UInventoryComponent` của chương 23. Nó gửi request qua interface lõi hoặc channel đã công bố.

## 22.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Target đang được người chơi nhìn/chọn | `Interaction` local | UI prompt, camera, input | `Paldark.Interaction.Request.Focus` |
| Quyền tương tác và khoảng cách hợp lệ | target/resource feature trên authority | client prompt, server validator | `Paldark.Interaction.Request.Try` |
| Lượng resource còn lại trong node | feature sở hữu node/resource trên authority | interaction query, world spawn, loot | `Paldark.Interaction.Request.Harvest` |
| Item rơi đang tồn tại trong world | item/drop feature | interaction, relevancy, inventory | `Paldark.Interaction.Request.Pickup` |
| Transaction chuyển item | `Inventory` | UI, item drop, station | `Paldark.Inventory.Request.Transfer` |
| Context station đang mở | feature station tương ứng | UI và crafting | `Paldark.Interaction.Event.ContextOpened` |

Interaction chỉ làm chủ selection/prompt và kết quả validate của request tương tác. Nó không làm chủ số lượng resource, item instance hay container quantity. Đây là cách tránh việc một nút “E” trở thành quyền ghi của mọi hệ thống.

## 22.4 — Hợp đồng dữ liệu

Loại mảnh do hệ thống định nghĩa là `Interaction.Interactable`. Nó mô tả một definition có thể nhận loại tương tác nào, range và channel kết quả; nó không chứa state hiện tại của node hoặc item.

```cpp
USTRUCT()
struct FInteractableFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY()
    TArray<FName> InteractionKinds;

    UPROPERTY()
    float Range = 0.f;

    UPROPERTY()
    FName PromptKey;

    UPROPERTY()
    FName ResultChannel;
};
```

Ví dụ definition đã điền:

```json
{
  "id": "Interaction.Resource.ResonanceNode",
  "schema": 1,
  "display": { "nameKey": "Interaction.Resource.ResonanceNode.Name" },
  "fragments": [
    {
      "type": "Interaction.Interactable",
      "interactionKinds": ["Harvest"],
      "range": 220.0,
      "promptKey": "Interaction.Harvest",
      "resultChannel": "Paldark.Interaction.Event.HarvestAccepted"
    }
  ]
}
```

`220.0` ở đây là giá trị minh họa của Paldark, không phải giá trị Palworld gốc. Resource amount, respawn timer và drop table phải nằm trong fragment của feature resource/loot; Interaction chỉ đọc contract.

Interaction không khai báo khối lưu `Paldark.Interaction` cho selection/prompt vì đó là trạng thái phiên. Resource node, item entity và container relation được lưu bởi owner tương ứng; Interaction chỉ gửi request và dựng lại focused target.

## 22.5 — Giao diện lập trình

Component là `UInteractionComponent`, gắn vào player actor; target có thể cung cấp `IInteractableSource` qua component ngoài. Các feature khác không include Interaction để gọi class cụ thể.

```cpp
USTRUCT()
struct FInteractionQuery
{
    GENERATED_BODY()

    UPROPERTY() FPaldarkEntityId RequesterId;
    UPROPERTY() FPaldarkEntityId TargetId;
    UPROPERTY() FName Kind;
};

UFUNCTION()
FInteractionResult RequestFocus(const FInteractionQuery& Query);

UFUNCTION()
FInteractionResult RequestTry(const FInteractionQuery& Query);

UFUNCTION()
FInteractionSnapshot ReadFocusedTarget() const;
```

Thân hàm chỉ ghi contract:

```cpp
FInteractionResult UInteractionComponent::RequestTry(
    const FInteractionQuery& Query)
{
    // Resolve target through the core entity/query interface.
    // Validate range, kind, authority and target availability.
    // Publish the accepted request without writing another feature's state.
}
```

Kênh phát:

- `Paldark.Interaction.Event.FocusChanged`
- `Paldark.Interaction.Event.HarvestAccepted`
- `Paldark.Interaction.Event.PickupAccepted`
- `Paldark.Interaction.Result.Rejected`

Kênh nghe:

- `Paldark.Input.Intent.Interact`
- `Paldark.Inventory.Event.TransferAccepted`
- `Paldark.Build.Event.StructureReady`
- `Paldark.Pal.Event.InstanceAvailable`

`Paldark.Inventory.Event.TransferAccepted` và `Paldark.Pal.Event.InstanceAvailable` đã xuất hiện trong manifest Work ở Chương 16, nên chương này dùng lại đúng tên. Interaction không include Inventory, Work, Build hay Pal. Nó phát một request/result; owner của resource hoặc inventory mới quyết định mutation.

## 22.6 — Quyền hạn và đồng bộ

Client được tự raycast, chọn target gần nhất, hiển thị prompt và phát animation bắt đầu. Server quyết định target có tồn tại, requester có ở trong range, resource còn đủ, item drop còn thuộc quyền pickup và transaction có hợp lệ hay không.

Target id, accepted result và transaction result cần replicate cho client liên quan. Raycast local, outline, prompt và âm thanh “đang nhìn vào” chỉ là hình ảnh. Không replicate prompt như state gameplay. Nếu client dự đoán pickup, prediction phải bị server sửa lại bằng result, không được tự tạo item instance.

Resource node có thể được dựng lại khi actor unload; stable entity id và state bền thuộc owner resource. Cụ thể resource có respawn hay không chưa có evidence runtime Palworld, nên để UNKNOWN thay vì tự gán timer.

## 22.7 — Log, console command, và cách biết là chạy đúng

Category là `LogPaldarkInteraction`. Dòng log phải cho thấy `target`, `kind`, `range`, `authority`, `result` và correlation. Khi pickup thành công, Interaction log request và Inventory log transaction phải nối cùng `corr`; Interaction không tự log như thể nó đã ghi quantity.

Command:

- `Paldark.Interaction.QA.Setup` — tạo fixture player/target.
- `Paldark.Interaction.Status` — in focused target, range check và last result.
- `Paldark.Interaction.QA.Trigger` — gửi focus/try/harvest/pickup qua public interface.
- `Paldark.Inventory.List` — command thật để đối chiếu kết quả chuyển vào container.

Một test đúng phải có target ban đầu, input interact, một dòng authority accepted hoặc rejected, và nếu accepted thì có transaction Inventory cùng correlation. Nhặt một item mà chỉ UI đổi, không có item instance hoặc transfer log, là lỗi boundary chứ không phải test pass.

## 22.8 — Từng tin là → Thực tế cho thấy → Quyết định mới

### Từng tin là

Ta có thể mô tả Interaction bằng một `UInteractionComponent`, tự resolve
target qua query chung, rồi phát một result channel. Việc thu thập có thể
được mô tả cùng lúc với item instance, inventory transfer và các loại target
khác. Khi cần test, chỉ cần một fixture chung do Runtime dựng.

### Thực tế cho thấy

- Native composition không cần Interaction tự quét manifest runtime. Feature
  nằm dưới `Plugins/GameFeatures/Interaction/`, manifest JSON là input cho
  generator chung và artifact là `Content/Interaction.uasset`.
- Contract tối thiểu cần ổn định ở Core là
  `IPaldarkInteractable`, gồm prompt, kiểm tra `CanInteract` và
  `PerformInteraction`. Interaction không biết target là cây, quặng, rương,
  drop hay Pal.
- UE 5.6 không tự cung cấp mapping-context action phù hợp với schema JSON của
  Paldark. `UPaldarkInteractionInputAction` hiện vẫn thuộc feature vì nó đọc
  `Interaction.Input.json`; chưa có lý do nâng nó lên Runtime khi chưa có
  schema input chung cho nhiều feature.
- QA fixture phải do Interaction spawn. `PaldarkScenarioLoader` vẫn chỉ biết
  scenario Runtime chung và không biết Interaction.
- Client gửi intent qua RPC tới target được sở hữu bởi pawn của client. Target
  trên authority kiểm tra kind, range và remaining quantity, giảm quantity
  duy nhất trên server, rồi replicate `FPaldarkInteractionEvent` và
  `RemainingQuantity`. Interaction không tạo item instance và không giữ
  inventory quantity.
- Bằng chứng packaged thực tế là listen server + client join. Server ghi
  `net_mode=2`, `authority=true`, client ghi `net_mode=3`, `authority=false`;
  client gửi request, server ghi accepted, và client nhận remaining quantity
  mới cùng correlation. Đây chưa phải dedicated-server evidence vì UE
  distribution hiện tại không build được Server target.
- Activation là bất đồng bộ: test chờ `PALDARK_INTERACTION_COMPONENT_READY`
  và target/resource signals, không giả định component có trong cùng tick với
  feature transition.

### Quyết định mới

Interaction chỉ sở hữu input/session và phát intent/result theo contract Core.
Target/resource owner sở hữu state tài nguyên và quyết định mutation trên
authority. Inventory ở Chương 23 sẽ là consumer tiếp theo của event
`ResourceId + Quantity`; không dựng inventory tạm để hoàn tất slice này.

Danh sách QA tối thiểu phải chứng minh riêng:

1. client có component và gửi intent;
2. server nhận intent, kiểm tra authority/range/kind/availability;
3. server là phía duy nhất giảm resource;
4. event và resource state replicate về client;
5. listen-server limitation được ghi đúng, không gọi đó là dedicated proof.

---

**Bằng chứng cho chương này.** Các mã `F-008`, `F-036`, `F-037`, `F-042`, `F-043`, `F-063` là OBSERVED trong catalog Chương 3; `FPalStaticItemDataStruct`, `FPalInstanceID` và taxonomy inventory là EXTRACTED/REFERENCE từ whitepaper. `Paldark.Inventory.Event.TransferAccepted`, `Paldark.Build.Event.StructureReady` và `Paldark.Pal.Event.InstanceAvailable` được dùng lại từ manifest ví dụ ở Chương 16; command `Paldark.Inventory.List` là OBSERVED trong PaldarkLab. Fragment, component, channels, owner table và command Interaction là INFERRED; range, respawn và runtime interaction owner Palworld là UNKNOWN.

### Cập nhật sau runtime proof

Intent hiện đi qua `APaldarkBaseCharacter::SubmitIntent`, không đi qua
component RPC của Game Feature. Core dispatch tới một handler Interaction duy
nhất trên server; handler đo range từ pawn thật của requester, không tin vị
trí client gửi. Component Game Feature chỉ đọc input và gửi payload có
correlation ID.
