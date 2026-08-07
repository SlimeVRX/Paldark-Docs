# Chương 34 — Nhiều người chơi

Co-op chỉ vui khi hai người cùng nhìn thấy một thế giới có quy luật. Người A đặt structure, người B thấy nó; một Pal chết thì không thể chỉ chết trên máy của người A; hai người không được cùng tiêu một item mà server chấp nhận cả hai. Multiplayer vì vậy không phải một module đứng ngoài mọi feature. Quyền mạng là tính chất của từng state, đúng như danh mục quyền ghi ở Chương 12 và bản đồ module ở Chương 13.2.

Chương này dựng lớp điều phối: host/server authority, client intent, replication và relevancy. Nó không giành quyền ghi HP, inventory, work hay progression của các chương trước. Nó chỉ cung cấp đường truyền và policy để owner tương ứng thực thi.

## 34.1 — Vì sao hệ thống này tồn tại

Multiplayer biến thành quả cá nhân thành sự thật chung. Người chơi gửi ý định nhanh, server kiểm tra rồi trả result; người khác nhận delta vừa đủ để hiểu chuyện gì xảy ra. Khi thế giới lớn, không thể gửi mọi actor và mọi field cho mọi client, nên relevancy trở thành một phần của cảm giác: thấy đúng thứ đang liên quan, không thấy những thứ không cần.

Guild và quyền sở hữu chung là design Paldark, không phải evidence đã biết của Palworld. Chương 2 đã đánh dấu schema guild/permission Palworld là UNKNOWN; vì vậy không được viết như fact trích xuất.

## 34.2 — Nó chạm những gì trong catalog

- `F-120` — Server authority.
- `F-121` — Client intent.
- `F-122` — Replicated property.
- `F-123` — OnRep notification.
- `F-124` — Relevancy.
- `F-125` — Stable instance ID.

Các mã này không thay owner table của từng hệ thống. Combat vẫn sở hữu damage request, Inventory vẫn sở hữu quantity, Progression vẫn sở hữu unlock set. Multiplayer chỉ quyết định request đi đâu, snapshot/delta tới ai và session scope nào được phép.

## 34.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Session/player connection | `Multiplayer` session authority | server, client, relevancy | connect/disconnect handshake |
| Client intent envelope | client tạo, server validate | feature owner, log | `Paldark.Net.Request.Intent` |
| Feature gameplay state | feature owner theo Chương 12 | server, relevant clients | feature request trên authority |
| Replicated snapshot/delta | feature owner + net bridge | relevant clients | owner mutation/OnRep |
| Relevancy set | `Multiplayer`/world partition policy | replication bridge | `Paldark.Net.Request.Relevancy` |
| Player-owned entity relation | feature owner | player client, save | feature ownership request |
| Guild membership/permission | `Guild` owner (Paldark design) | authority, relevant members, save | `Paldark.Guild.Request.SetMemberRole` |
| Shared guild asset permission | Guild policy, asset owner ghi state | feature validator, members | scoped feature request |

Không có một “network state” tổng để mọi feature ghi. `Authority=Server` trong log nói nơi quyết định; nó không biến Net thành owner của HP hay item.

## 34.4 — Hợp đồng dữ liệu

Mảnh là `Multiplayer.Replicated`. Nó mô tả policy truyền của một definition/state; không chứa state gameplay thật.

```cpp
USTRUCT()
struct FMultiplayerReplicatedFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY() FName RelevancyPolicyId;
    UPROPERTY() FName ReplicationPolicyId;
    UPROPERTY() TArray<FName> OnRepChannels;
};
```

Definition đã điền:

```json
{
  "id": "Multiplayer.Policy.WorkStation",
  "schema": 1,
  "display": { "nameKey": "Multiplayer.Policy.WorkStation.Name" },
  "fragments": [
    {
      "type": "Multiplayer.Replicated",
      "relevancyPolicyId": "Multiplayer.Relevancy.Interest",
      "replicationPolicyId": "Multiplayer.Replication.Delta",
      "onRepChannels": [
        "Paldark.Work.Event.AssignmentChanged",
        "Paldark.Work.Event.Finished"
      ]
    }
  ]
}
```

Đây là policy minh họa; mỗi feature không bắt buộc dùng fragment này nếu core net contract đủ. Chunk `Paldark.Multiplayer`, schema `1`, giữ session-scoped metadata, ownership/guild relation theo design; không sao chép toàn bộ feature state đã thuộc chunk riêng.

## 34.5 — Giao diện lập trình

Component/subsystem là `UMultiplayerSessionSubsystem`. Feature owner đăng ký intent handler và replicated view; không include concrete component của nhau.

```cpp
UFUNCTION()
FNetResult SendIntent(const FNetIntentEnvelope& Intent);

UFUNCTION()
FNetResult SetRelevancy(
    FPaldarkEntityId EntityId, FName RelevancyPolicyId);

UFUNCTION()
FNetSnapshot ReadConnection(FPaldarkEntityId ConnectionId) const;

UFUNCTION()
FGuildResult RequestGuildRole(
    FPaldarkEntityId GuildId, FPaldarkEntityId MemberId, FName RoleId);
```

Thân hàm:

```cpp
FNetResult UMultiplayerSessionSubsystem::SendIntent(
    const FNetIntentEnvelope& Intent)
{
    // Authenticate connection and route the intent to its feature owner.
    // Let the feature authority validate and mutate its own state.
    // Replicate the result only to clients passing relevancy policy.
}
```

Kênh phát:

- `Paldark.Net.Event.Connected`
- `Paldark.Net.Event.Replicated`
- `Paldark.Net.Event.RelevancyChanged`
- `Paldark.Net.Result.Rejected`

Kênh nghe:

- `Paldark.Core.Authority`
- feature result channels như `Paldark.Inventory.Event.Changed`, `Paldark.Combat.Event.HitResolved`, `Paldark.Work.Event.Finished`
- `Paldark.World.Event.EntitySpawned`

Net không include Inventory/Combat/Work. Nó route envelope tới owner đã đăng ký. Guild cũng không được tự ghi structure/item; nó cung cấp permission query mà feature owner kiểm tra trước mutation.

## 34.6 — Quyền hạn và đồng bộ

Server/host authoritative cho state gameplay. Client tự đọc input, dựng prediction và gửi intent envelope có request id; server trả accepted/rejected/result. Client không được gửi “new HP=0” hay “inventory quantity=99” như một mutation đã tin cậy.

Replicate stable id, definition id và delta state tới connection liên quan. Actor transform/animation có thể dùng frequency khác với inventory transaction hoặc work completion. OnRep chỉ báo presentation/observer; không được dùng OnRep trên client để ghi ngược gameplay state.

Relevancy nên dựa trên interest volume, ownership, party/guild scope và explicit event relevance. Entity ngoài scope vẫn tồn tại server/save; client chỉ không nhận actor/payload lúc đó.

Guild/permission schema là thiết kế Paldark: guild có stable id, member ids, role definitions và permission tags; asset owner hỏi Guild trước khi mutation. Đây là `INFERRED`, không phải mô tả Palworld đã xác minh.

## 34.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkNet`. Mỗi intent log connection, requester, request id, target entity, routed owner, authority, result và relevancy decision. Dùng cùng `corr` với log feature mutation.

Command:

- `Paldark.Net.QA.Setup`
- `Paldark.Net.Status`
- `Paldark.Net.QA.TriggerIntent`
- `Paldark.Net.QA.SetRelevancy`
- `Paldark.Net.QA.DumpConnections`

Test hai client: A gửi build/attack/transfer intent, B chỉ nhận khi relevant; gửi cùng request id hai lần và kiểm idempotent result; disconnect/reconnect rồi kiểm stable id và authoritative state; thử member không có permission và kiểm request bị reject trước mutation. Đúng là client prediction không tạo sự thật thứ hai.

---

**Bằng chứng cho chương này.** `F-120` tới `F-125` là catalog; `BreedProgressTime`, `TargetBreedItemIds`, OnRep declaration và `FPalInstanceID` là evidence về replication/stable identity trong source/whitepaper. Host/client envelope, relevancy policy, guild schema, role/permission tags và chunk `Paldark.Multiplayer` là thiết kế Paldark INFERRED. Schema guild/permission Palworld là UNKNOWN như đã ghi ở Chương 2.

## 34.8 — Trạng thái triển khai và giới hạn bằng chứng

Native feature hiện có `Multiplayer` với `UMultiplayerSessionSubsystem` và
replicated view actor dùng `FPaldarkEntityId`. Net chỉ nhận `Channel` và
bytes qua intent bus; nó không include hoặc biết implementation của
Inventory, Combat, Work, Build, World, Dungeon, Creature hay Health. Gameplay
owner phải xử lý mutation của mình; các mutation counter trong QA chỉ là
fixture đo idempotency, không phải network state tổng.

QA bắt buộc là listen server + hai client, với ba `-AbsLog` tuyệt đối. Relevancy
được kiểm bằng hai actor `OwnerOnly`: server ghi cả nhánh relevant/irrelevant
và `entity_exists_server=true`, client chỉ nhận actor thuộc connection của
mình. Actor global giữ stable ID để kiểm disconnect/reconnect; actor không
nhận do ngoài scope không được suy ra là entity đã bị destroy.

Guild/role/permission vẫn là `INFERRED` Paldark design, chưa phải fact
Palworld đã xác minh. Guild production và permission rejection chưa được
đưa vào slice này; không được đọc sự vắng mặt đó thành bằng chứng Guild đã
được triển khai.

## 34.9 — Bằng chứng packaged của slice hiện tại

Packaged listen server + client A + client B đã chạy với ba log tuyệt đối:

```text
/tmp/paldark_net_server_final.log
/tmp/paldark_net_clientA_final.log
/tmp/paldark_net_clientB_final.log
```

Server ghi cùng correlation `784AADFF8C6544E7BB620FCED0AD3578` cho intent,
owner decision và state status. Relevancy evidence ghi:

```text
scope=ClientA relevant=clientA irrelevant=clientB entity_exists_server=true
scope=ClientB relevant=clientB irrelevant=clientA entity_exists_server=true
```

Client A chỉ nhận entity scope `ClientA`; client B chỉ nhận entity scope
`ClientB`, cả hai với `authority=false`. Request ID lặp lại tạo
`owner_mutations=1`, lần sau bị `DuplicateRequestId`. Payload
`quantity=99;hp=0` bị `ClientMutationPayloadBeforeOwner`; payload
`permission=denied` bị `PermissionDeniedBeforeOwner`. Không có owner mutation
cho hai nhánh từ chối.

Client A được ngắt rồi kết nối lại. Log reconnect ghi stable entity
`016AE014123456789ABCDEF012345678`, value `0`, còn server status giữ
`owner_mutations=1`, chứng minh authoritative state không đổi. Đây là
headless network evidence; visual Windows pass vẫn cần kiểm bằng mắt.

Package đầy đủ với content root `PalworldAsset` rộng làm UE 5.6 cook
segfault; đã cô lập rằng root `PlayerPresentation` và path con
`PalworldAsset/Character/Player` cook được. Evidence trên dùng package
manifest-driven với root `PlayerPresentation` tạm thời thu hẹp, không giả
nhận là đã giải quyết lỗi asset root rộng.
