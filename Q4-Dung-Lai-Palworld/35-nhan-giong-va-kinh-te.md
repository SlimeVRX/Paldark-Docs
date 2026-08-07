# Chương 35 — Nhân giống, cô đặc và kinh tế

Đến cuối một vòng chơi dài, câu hỏi của người chơi thay đổi. Họ không còn chỉ hỏi “mình có gì?”, mà bắt đầu hỏi “cặp nào nên được giữ làm parent, bản sao nào có thể hy sinh, output nào nên bán và mình đang tiết kiệm cho điều gì?”. Creature dư thừa có giá trị mới, một cặp parent trở thành kế hoạch, còn merchant biến scarcity thành lựa chọn.

Breeding, Condenser và Economy gặp nhau trong cùng cảm giác đầu tư dài hạn, nhưng không vì thế trở thành một owner. Breeding làm chủ farm/job cùng child result; Condenser làm chủ transaction sacrifice/rank; Economy làm chủ offer/price/stock. Cả ba dùng Inventory và Progression qua contract, không sửa state của nhau chỉ vì cùng xuất hiện trên một màn hình quản lý.

## 35.1 — Vì sao hệ thống này tồn tại

Breeding cho collection một hướng đi khác Capture: đầu tư parent, item, thời gian và combination để chờ child. Condenser khiến bản sao dư thừa có giá trị tăng dần thay vì trở thành rác. Economy mở đường ra cho resource, rồi dùng price và stock đưa scarcity trở lại thành quyết định mua/bán.

`FPalBreedingItemEffectData` có bảy field, `UPalMapObjectBreedFarmModel` có progress, required time, egg capacity và target item ids, còn `FPalCombiUniqueDatabaseRow` ánh xạ parent attributes tới child id. Chúng chứng minh hình dạng bài toán. Bảng combination đầy đủ, trait inheritance và mutation rate vẫn UNKNOWN.

## 35.2 — Nó chạm những gì trong catalog

- `F-106` — Currency item.
- `F-107` — Shop offer.
- `F-108` — Giá mua.
- `F-109` — Giá bán.
- `F-110` — Mua bằng item.
- `F-111` — Stock limit.
- `F-112` — Shop refresh.
- `F-113` — Breeding farm.
- `F-114` — Parent selection.
- `F-115` — Breeding progress.
- `F-116` — Egg result.
- `F-117` — Combination lookup.
- `F-118` — Trait inheritance.
- `F-119` — Condenser rank.

Catalog đặt shop, breeding và condenser cạnh nhau vì chúng tạo vòng dài hạn, không phải vì chúng dùng chung state. Currency/item quantity vẫn thuộc Inventory; unlocked access vẫn thuộc Progression; mỗi feature chỉ quyết định kết quả trong miền của mình.

## 35.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Parent selection và farm assignment | `Breeding` | UI, farm scheduler, save | `Paldark.Breeding.Request.AssignParents` |
| Breeding progress/timer | `Breeding` | UI, save, server | `Paldark.Breeding.Request.Reconcile` |
| Combination lookup | `Breeding` data registry | resolver, UI, QA | definition data |
| Egg/child result | `Breeding` result owner + EntityIdentity | Inventory, Companion, save | `Paldark.Breeding.Request.ClaimResult` |
| Condenser rank/sacrifice transaction | `Condenser` | UI, entity, save | `Paldark.Condenser.Request.Condense` |
| Currency/item quantity | Inventory owner | shop, breeding, condenser, UI | Inventory transaction |
| Shop offer/price/stock | `Economy` merchant owner | UI, server, save | `Paldark.Economy.Request.Refresh` |
| Purchase/sale result | `Economy` transaction owner | Inventory, UI, log | `Paldark.Economy.Request.Buy/Sell` |
| Player/guild market permission | Guild/Economy policy | merchant validator, UI | permission query |

Bảng cho thấy mỗi thao tác đều có một điểm không thể hoàn tác nửa chừng. Breeding không tự trừ feed item; Condenser không tự xóa entity ngoài transaction; Shop không ghi Inventory quantity trực tiếp. Mọi kết quả liên miền phải là request/response có correlation để failure không để lại child, rank hoặc stock ở trạng thái nửa commit.

## 35.4 — Hợp đồng dữ liệu

Data cũng đi theo ranh giới owner. `Breeding.Farm` mô tả requirement và result lookup; parent runtime id cùng progress hiện tại là state. Condenser và Economy có definition riêng, tránh nhét ba miền vào một fragment chỉ vì UI có thể đặt chúng gần nhau.

```cpp
USTRUCT()
struct FBreedingFarmFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName FarmKind;
    UPROPERTY() FName CombinationTableId;
    UPROPERTY() FName RequiredItemProfileId;
    UPROPERTY() FName ResultProfileId;
};
```

Definition đã điền:

```json
{
  "id": "Breeding.Farm.ResonanceNursery",
  "schema": 1,
  "display": { "nameKey": "Breeding.Farm.ResonanceNursery.Name" },
  "fragments": [
    {
      "type": "Breeding.Farm",
      "farmKind": "Pairing",
      "combinationTableId": "Breeding.Combination.Resonance",
      "requiredItemProfileId": "Breeding.ItemEffect.Standard",
      "resultProfileId": "Breeding.Result.Egg"
    }
  ]
}
```

`FPalBreedingItemEffectData` và `FPalCombiUniqueDatabaseRow` là evidence cho item effect/combo lookup; JSON trên chỉ là Paldark contract, không phải bảng combo đầy đủ. Chunk `Paldark.Breeding`, schema `1`, giữ parent stable ids, farm assignment, progress checkpoint và result claim state.

Condenser dùng `Condenser.Rank` cho rank definition; Economy dùng `Economy.Offer` cho price/stock definition. Cả hai chỉ là owner-prefixed data contract, không được ghi parent state trong Breeding chunk.

## 35.5 — Giao diện lập trình

Ở runtime, ba miền có ba component và ba transaction flow. `UBreedingFarmComponent`, `UCondenserComponent` và `UEconomyMerchantComponent` giao tiếp qua core Inventory/Entity/Guild interfaces thay vì gọi implementation của nhau.

```cpp
UFUNCTION()
FBreedingResult RequestAssignParents(
    FPaldarkEntityId FarmId, FPaldarkEntityId ParentA,
    FPaldarkEntityId ParentB);

UFUNCTION()
FBreedingResult RequestReconcile(FPaldarkEntityId FarmId);

UFUNCTION()
FCondenserResult RequestCondense(
    FPaldarkEntityId TargetId,
    const TArray<FPaldarkEntityId>& SacrificeIds);

UFUNCTION()
FEconomyResult RequestBuy(
    FPaldarkEntityId MerchantId, FName OfferId, int32 Quantity);
```

Thân hàm:

```cpp
FBreedingResult UBreedingFarmComponent::RequestReconcile(FPaldarkEntityId FarmId)
{
    // Validate parent identities, item requirements and elapsed farm time.
    // Resolve the configured combination table without inventing missing rows.
    // Publish progress/result and request entity or inventory output creation.
}
```

Kênh phát:

- `Paldark.Breeding.Event.ProgressChanged`
- `Paldark.Breeding.Event.ResultReady`
- `Paldark.Condenser.Event.RankChanged`
- `Paldark.Economy.Event.OfferChanged`
- `Paldark.Economy.Event.TransactionCompleted`

Kênh nghe:

- `Paldark.Inventory.Event.Changed`
- `Paldark.Companion.Event.InstanceAvailable`
- `Paldark.Progression.Event.NodeUnlocked`
- `Paldark.Guild.Event.PermissionChanged`

Breeding không include Companion để tạo Pal actor; nó tạo entity/result qua `Paldark.Core.EntityIdentity`, sau đó phát event. Condenser và Economy gọi Inventory transaction, không include `InventoryComponent.h`. Guild chỉ trả permission query; Economy vẫn ghi offer/transaction của mình.

## 35.6 — Quyền hạn và đồng bộ

Các màn hình chọn parent, sacrifice hay offer đều có thể preview ngay, nhưng kết quả cuối phải đi qua authority. Server quyết định parent ownership, combination result, progress, item consumption, egg/child identity, sacrifice list, rank mutation, offer price/stock và buy/sell transaction. Client chọn, xem trước rồi gửi intent; nó không tự kết luận mutation.

Breeding progress, result id, condenser rank, offer snapshot và transaction result replicate tới client liên quan. Static combination/offer definitions đọc từ registry. Farm mesh, incubating VFX, merchant animation và UI countdown là presentation.

Nếu farm chạy offline, dùng checkpoint/last simulation time như Work; chính sách tick hay catch-up chưa chốt. Nếu combo không có row, resolver phải trả `UNKNOWN_COMBINATION`/reject, không tự bịa child.

## 35.7 — Log, console command, và cách biết là chạy đúng

Vì các vòng này dài và có sacrifice, log phải cho phép truy lại chính xác thứ gì đã bị tiêu và thứ gì được tạo. Dùng `LogPaldarkBreeding`, `LogPaldarkCondenser` và `LogPaldarkEconomy`; mỗi transaction ghi stable ids, item/entity before/after, offer/rank, authority cùng `corr`. Parent selection log không được giả vờ child đã tồn tại.

Command:

- `Paldark.Breeding.QA.Setup`
- `Paldark.Breeding.Status`
- `Paldark.Breeding.QA.Trigger`
- `Paldark.Condenser.QA.Setup`
- `Paldark.Economy.QA.Setup`
- `Paldark.Economy.Status`

Test đúng đi qua các nhánh dễ mất tài sản nhất: assign parent và item, reconcile farm rồi claim đúng một lần; thử combo thiếu row; condense với duplicate id hoặc target nằm trong sacrifice list; mua/bán và đối chiếu Inventory delta; refresh offer rồi kiểm stock/price owner. Không được có duplicate child, mất item nửa transaction hay rank tăng trước khi sacrifice commit.

---

**Bằng chứng cho chương này.** `F-106` tới `F-119`, `FPalBreedingItemEffectData`, `UPalMapObjectBreedFarmModel` với progress/time/egg capacity/target item ids và `FPalCombiUniqueDatabaseRow` là EXTRACTED/REFERENCE. Bảng combination đầy đủ, mutation rate, inheritance table và merchant runtime ownership là UNKNOWN. Fragment, channels, chunks, transaction boundaries và owner table là thiết kế Paldark bám L8, Chương 14 và Inventory contracts.

## 35.8 — Native slice và giới hạn bằng chứng

Implementation giữ đúng phép tách đã đặt ở đầu chương. Chương 35 vẫn có ba Game Feature độc lập: `Breeding`, `Condenser` và
`Economy`, không có aggregate state chung. Economy đã được nghiệm thu ở #152.
Breeding và Condenser nay có QA state trong subsystem, nhưng chưa có offline
catch-up. Breeding và Condenser đã có owner codec schema 1: Breeding lưu farm,
parent A/B, progress và claimed; Condenser lưu target, rank và sacrifice list.
Offline catch-up vẫn deferred.

Condenser giữ `Rank`, `SacrificeIds` và `TargetId` trong
`CondenserFeatureSubsystem`. Sacrifice IDs được tạo/tiêu thụ qua
`IPaldarkEntityIdentity`; duplicate và target-overlap được kiểm tra trên các
list state thật. Flow rollback tăng rank trước, gọi bước EntityIdentity fail,
đọc lại rank/list và khôi phục state trước khi ghi log.

Breeding giữ farm id, parent A/B, progress, combination result và claim flag
trong `BreedingFeatureSubsystem`. Combination rows được đọc từ
`Breeding.Combinations.json`; missing lookup không tạo child. Feed được trừ
qua `IPaldarkItemTransaction`, progress được tăng trong `Reconcile`, và child
được tạo qua `IPaldarkEntityIdentity`. Claim lần hai chỉ đọc claim flag đã
được set và bị chặn.

Mỗi dòng log evidence phải đối chiếu với code sinh log trong:

- `Plugins/GameFeatures/Breeding/Source/Breeding/Private/BreedingFeatureSubsystem.cpp`;
- `Plugins/GameFeatures/Condenser/Source/Condenser/Private/CondenserFeatureSubsystem.cpp`;
- `Plugins/GameFeatures/Economy/Source/Economy/Private/EconomyFeatureSubsystem.cpp`.

Không có numeric state nào được gọi là evidence nếu không truy được về member
state hoặc Core owner API. Các feature không include Inventory, Companion,
Progression, Creature, Guild hoặc Economy implementation headers.

Đến đây vòng chơi đã đi từ bước chân đầu tiên tới những quyết định kéo dài qua nhiều phiên và nhiều người chơi. Điều giữ mười lăm hệ thống thành một cuốn sách — cũng là điều giữ chúng thành một game — không phải chúng dùng cùng class, mà là mỗi cảm giác đều được lần ngược tới đúng state, đúng owner, đúng contract và một chuỗi bằng chứng có thể kiểm lại.
