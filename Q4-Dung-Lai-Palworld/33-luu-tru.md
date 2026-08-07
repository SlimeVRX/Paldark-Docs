# Chương 33 — Lưu trữ

Lưu trữ không bắt đầu bằng câu hỏi “thêm save vào hệ thống nào?”. Theo Chương 14, mỗi feature đã tự khai báo chunk của mình: Inventory có `Paldark.Inventory`, Work có `Paldark.Work`, Progression có `Paldark.Progression` và các hệ thống trước tự chịu trách nhiệm schema. Việc còn lại của chương này là làm cho những chunk độc lập đó cùng đi qua một vòng save/load đáng tin.

Nếu process chết sau khi ghi một nửa, người chơi không thể nhận một nửa inventory và một nửa progression. Nếu schema đổi mà không có migration, stable id và relation sẽ gãy. Persistence là orchestration và verification, không phải một struct tổng mới để mọi feature cùng sửa.

## 33.1 — Vì sao hệ thống này tồn tại

Người chơi muốn ngày hôm sau bước vào đúng thế giới của mình: Pal vẫn ở roster, item vẫn nằm trong container, worker vẫn được phân công, node vẫn mở và structure vẫn ở vị trí cũ. Cảm giác này không đến từ việc file có tồn tại; nó đến từ việc quan hệ giữa các entity được dựng lại đúng.

Chương 20 từng đặt Persistence ở cuối vì chunk ownership đã được thiết kế trước. Trong triển khai thực tế, Chương 33 được đưa lên trước 31/32: hiện đã có chín hệ thống stateful và việc tắt game làm mất toàn bộ state là rủi ro trực tiếp hơn world/dungeon. Thứ tự tài liệu đã được cập nhật để phản ánh thứ tự triển khai mới. Cần kiểm chứng giả định đó: **không cần sửa ngược các hệ thống 21–32 chỉ để thêm cơ chế container save** nếu các hệ thống thật sự giữ đúng contract `ChunkId`, `SchemaVersion`, stable id, migration và missing-chunk-valid. Nhưng vẫn phải sửa một hệ thống trước nếu API của nó đang lưu actor pointer, dùng id không ổn định hoặc không có transaction boundary. Đây là điều kiện, không phải lời hứa tự động.

## 33.2 — Nó chạm những gì trong catalog

- `F-125` — Stable instance ID.
- `F-126` — Save profile.
- `F-120` — Server authority, vì save owner không thể để client tự ghi sự thật.
- `F-122` — Replicated property, để phân biệt state mạng với state cần lưu.

Các feature khác không được “đẩy” state sang Persistence. Persistence đọc manifest/chunk contract, điều phối thứ tự và atomic commit; owner vẫn serialize/deserialize field của mình.

## 33.3 — Trạng thái và chủ sở hữu

| Trạng thái | Chủ | Ai đọc | Đổi bằng yêu cầu gì |
|---|---|---|---|
| Save session/profile identity | `Persistence` | save registry, server, QA | `Paldark.Persistence.Request.Open` |
| Chunk manifest/order | `Persistence` | loader, validator, migration | feature registration |
| Chunk payload/schema | feature sở hữu chunk | feature reader/writer, migration | owner codec request |
| Atomic save generation | `Persistence` | recovery, QA, server | `Paldark.Persistence.Request.Commit` |
| Migration result | chunk owner + Persistence coordinator | loader, log, QA | `Paldark.Persistence.Request.Migrate` |
| Entity relation resolution | entity/feature owner | all feature readers | stable id lookup |
| Last known good checkpoint | `Persistence` | recovery, UI, server | accepted atomic commit |

Persistence không ghi HP, inventory quantity, assignment hay unlocked set. Nó gọi owner codec và chỉ ghi generation mới sau khi mọi chunk bắt buộc đã serialize/validate.

## 33.4 — Hợp đồng dữ liệu

Hình dạng chunk vẫn là `FPaldarkSaveChunk` của Chương 14:

```cpp
USTRUCT()
struct FPaldarkSaveChunk
{
    GENERATED_BODY()

    UPROPERTY() FName ChunkId;
    UPROPERTY() int32 SchemaVersion = 1;
    UPROPERTY() TArray<uint8> Payload;
};
```

Container file là wrapper của Persistence, không thay hình dạng chunk:

```json
{
  "format": "Paldark.Save",
  "formatVersion": 1,
  "generation": 42,
  "chunks": [
    {
      "chunkId": "Paldark.Inventory",
      "schemaVersion": 1,
      "payloadFile": "chunks/Paldark.Inventory.bin"
    },
    {
      "chunkId": "Paldark.Progression",
      "schemaVersion": 1,
      "payloadFile": "chunks/Paldark.Progression.bin"
    }
  ]
}
```

JSON này chỉ là manifest minh họa; runtime hiện đã có manifest JSON, payload `.bin`, checksum MD5, payload length, generation directory và commit marker. Ghi atomic dùng temporary manifest rồi publish manifest cuối trước khi ghi marker. Nếu marker thiếu, loader chọn last known good generation. Không có bằng chứng Palworld dùng đúng layout này; đây là thiết kế Paldark.

## 33.5 — Giao diện lập trình

Component/subsystem là `UPaldarkPersistenceSubsystem`; feature chỉ đăng ký codec qua `UPaldarkSaveChunkRegistry` ở boundary Persistence/Core. Registry có `RegisterCodec`, `FindCodec` và enumeration ổn định theo `ChunkId`; Persistence gọi `Serialize`, `Deserialize` và `Migrate`, không đọc concrete feature component.

```cpp
UFUNCTION()
FPaldarkPersistenceResult RequestSave(FName ProfileId);

UFUNCTION()
FPaldarkPersistenceResult RequestLoad(FName ProfileId);

UFUNCTION()
FPaldarkMigrationResult RequestMigrate(FName ProfileId);

UFUNCTION()
FPaldarkSaveManifest ReadManifest(FName ProfileId) const;
```

Thân hàm:

```cpp
FPaldarkPersistenceResult UPaldarkPersistenceSubsystem::RequestLoad(
    FName ProfileId)
{
    // Select the last complete generation and validate its manifest.
    // Migrate each owner chunk before resolving cross-chunk relations.
    // Rebuild entities by stable id and publish load completion only when valid.
}
```

Thứ tự load:

1. Đọc manifest/generation và kiểm checksum, schema range, duplicate chunk id.
2. Chạy migration riêng từng chunk, không sửa payload gốc tại chỗ.
3. Nạp definitions/registries trước khi giải mã entity.
4. Dựng entity identity và state bền.
5. Nối relation bằng stable id; relation tới entity chưa relevant là pending, không phải failure.
6. Phát `Paldark.Persistence.Event.Loaded` sau validation.

Kênh phát:

- `Paldark.Persistence.Event.SaveStarted`
- `Paldark.Persistence.Event.SaveCommitted`
- `Paldark.Persistence.Event.Loaded`
- `Paldark.Persistence.Result.Rejected`

Kênh nghe:

- `Paldark.Core.Event.SaveDirty`
- `Paldark.Core.Event.EntityRegistryReady`
- owner save codecs của `Paldark.Inventory`, `Paldark.Work`, `Paldark.Progression`, `Paldark.Build`, `Paldark.Companion`, `Paldark.World`, `Paldark.Dungeon`, `Paldark.Breeding` và `Paldark.Condenser`.

Persistence không include concrete component của các feature; registry trả contract/codec. Feature owner tự di trú payload của mình.

## 33.6 — Quyền hạn và đồng bộ

Server hoặc single-player authority là nơi quyết định save generation và load result. Client có thể yêu cầu save hoặc hiển thị progress, nhưng không tự commit file authoritative. Trong multiplayer, save scope/profile phải phân biệt world, guild và player; schema guild cụ thể được chốt ở Chương 34.

Atomicity tối thiểu là write-ahead generation: ghi chunk tạm, flush/validate, ghi manifest tạm, rồi commit marker. Crash trước marker không được làm mất generation trước. Migration phải tạo generation mới hoặc bản tạm; không mutate file cũ rồi mới hy vọng chạy tiếp.

## 33.7 — Log, console command, và cách biết là chạy đúng

Dùng `LogPaldarkPersistence`. Mỗi save/load/migrate ghi profile, generation, chunk id, schema before/after, checksum, relation count và result. Khi load relation pending, log stable id và lý do; không gọi đó là “missing entity” nếu entity chỉ chưa relevant.

Command:

- `Paldark.Persistence.QA.Setup`
- `Paldark.Persistence.Status`
- `Paldark.Persistence.QA.Save`
- `Paldark.Persistence.QA.Load`
- `Paldark.Persistence.QA.Migrate`

Test vòng save–load:

1. Dựng inventory, party, work assignment, structure và unlocked node.
2. Ghi snapshot A và chụp canonical state theo stable id, không theo thứ tự array.
3. Thay đổi state, ghi snapshot B, rồi load A.
4. So sánh entity id, definition id, owner relation, quantity, assignment và unlocked set trước/sau.
5. Tạo relation tới entity chưa actor; load xong resolve actor muộn và kiểm relation vẫn đúng.
6. Cắt process trước commit marker; load phải quay về generation trước.

QA restart bắt buộc tách thành hai process: process thứ nhất dùng
`-PaldarkPersistenceSaveQA` để mutate state owner và commit generation, process
thứ hai dùng `-PaldarkPersistenceLoadQA` để load cùng profile và đọc lại state.
`Paldark.World` không lưu actor population/pointer; scheduler sẽ reconcile actor
runtime sau load. Chunk thiếu là `pending` hợp lệ; schema ngoài range bị reject
với `SchemaUnsupported`.

Đúng là state canonical bằng nhau, relation dựng lại qua id, chunk thiếu vẫn hợp lệ, migration idempotent và không có half-commit. Đây là phép chứng minh, không chỉ là “file load không crash”.

---

**Bằng chứng cho chương này.** `F-120`, `F-122`, `F-125`, `F-126` là mã catalog; `FPalInstanceID`/`FGuid` và chunk model là EXTRACTED/REFERENCE từ Chương 14, whitepaper và source dossier. Chunk names/owners là contract đã viết ở Chương 21–30. Atomic generation, migration order, checksum và canonical comparison là thiết kế Paldark INFERRED; save schema/runtime của Palworld đầy đủ là UNKNOWN.

## 33.8 — Kết quả kiểm chứng trên code 21–30

| Feature/state owner | Kết quả kiểm tra | Reverse fix cần cho Persistence? |
|---|---|---|
| Inventory | State contract có stable item/entity id và transaction boundary; Persistence không đọc quantity trực tiếp. | Không |
| Companion/Creature | Party và entity context dùng `FPaldarkEntityId`; actor handle có thể rỗng và không được dùng làm identity. | Không |
| Work | Assignment/worker dùng stable id; input/output đi qua `IPaldarkItemTransaction`; checkpoint có boundary. | Không |
| Build | Structure tạo stable id sau transaction; preview không phải entity. | Không |
| Progression | Unlocked set, XP, level và points do Progression sở hữu; chunk boundary không đẩy state vào Persistence. | Không |
| Movement/Presentation/Interaction/Crafting/Combat/Health/Capture | Không có con trỏ actor làm durable identity trong Persistence path; các state owner vẫn độc lập. | Không |

Kết luận hiện tại là **phải sửa ngược năm owner feature** để đưa state thật ra
qua codec: mỗi component đã thêm codec trong module của chính nó và đăng ký khi
feature active. Inventory serialize các slot thật; Companion serialize party,
active id và context; Work serialize station, worker, assignment, progress và
output; Build serialize structure id/owner/definition/transform; Progression
serialize unlocked targets, XP, level và technology points. Persistence chỉ
enumerates codec generic và gọi owner `Serialize`/`Deserialize`/`Migrate`.

Đây là phát hiện quan trọng của chương: giả định “chỉ cần bật container save”
không đúng với code 21–30. Những owner nào chưa có API read/apply phù hợp phải
thêm boundary có kiểm soát; không được để Persistence truy cập field riêng.

Atomic interruption test là **mô phỏng QA-only**: generation 2 được ghi nhưng
commit marker bị xóa trước load. Loader bỏ qua generation đó và quay về
generation 1. Checksum corruption và schema 99 tạo hai recovery reason riêng:
`ChecksumMismatch` và `SchemaUnsupported`. Save thiếu một chunk feature vẫn load
hợp lệ. Migration chạy hai lần cho cùng kết quả và không ghi đè source
generation.
