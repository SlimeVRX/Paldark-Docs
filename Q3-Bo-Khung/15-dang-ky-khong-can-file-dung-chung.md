# Chương 15 — Đăng ký không cần file dùng chung

> **Đính chính quan trọng.** Chương này được viết trước khi ta có Unreal
> Engine chạy được trong môi trường. Ta đã mô tả một registry tự viết như
> thể đó là nền tảng composition. Sau khi đọc source UE 5.6, phần gắn
> component và lifecycle actor phải chuyển sang Game Features +
> ModularGameplay. Xem [Chương 15b](15b-game-features-va-modular-gameplay.md).
>
> Bài học là: trước khi tự dựng một cơ chế nền tảng, phải kiểm tra engine đã
> giải quyết nó chưa. Những registry text dưới đây vẫn hữu ích cho danh mục
> contract và gameplay data do Paldark sở hữu; chúng không còn là lý do để
> giữ `PaldarkComponentHost` làm composition runtime.

Trong một project nhỏ, cách đăng ký dễ nghĩ nhất là có một hàm trung tâm:

```cpp
void RegisterEverything()
{
    RegisterWorkFragments();
    RegisterBreedingFragments();
    RegisterCaptureChannels();
    RegisterInventorySaveChunks();
}
```

Mỗi khi thêm tính năng, agent phải mở hàm này ra thêm một dòng. Agent thứ hai cũng làm đúng việc đó. Ta vừa dựng lại va chạm 1 và 2 dưới một cái tên mới: một file khởi tạo trung tâm, một thứ tự gọi trung tâm, và một danh sách trung tâm mà mọi người phải nhớ cập nhật. Tách plugin ra không giúp gì nếu tất cả plugin vẫn phải chen vào cùng một hàm.

Chương 14 đã giải quyết đăng ký **dữ liệu gameplay** bằng text. Chương này
giải quyết phần contract, loại mảnh, kênh thông điệp, nhãn, console command
và khối lưu mà không cần agent sửa file của người khác. Composition actor/
component không còn nằm trong registry tự viết; nó dùng Game Features native,
với manifest text làm nguồn cho artifact `GameFeatureData.uasset`.

## 15.1 — Tự đăng ký tại nơi khai báo

Ý tưởng là mỗi file `.cpp` mang theo một đối tượng đăng ký của chính nó. Khi module được nạp, đối tượng đó đưa một hàm hoặc một mô tả vào bảng đăng ký. Không có hàm tổng để mọi tính năng phải gọi tên nhau.

Một registry đúng phải là **hàm trả về tham chiếu tới biến tĩnh cục bộ**, không phải một biến global khởi tạo sẵn. Cách này tránh được một phần vấn đề thứ tự khởi tạo giữa các translation unit: bảng chỉ được tạo khi lần đầu có code hỏi đến nó.

### Đăng ký một loại mảnh

Tên mô hình vẫn là của Chương 14: mảnh mới kế thừa `FPaldarkFragment`; định nghĩa dữ liệu chỉ chứa tên loại mảnh và payload phù hợp.

```cpp
// WorkCapableFragment.h — Public của plugin Work
USTRUCT()
struct FWorkCapableFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    UPROPERTY()
    TMap<FGameplayTag, int32> Levels;
};
```

```cpp
// WorkCapableFragmentRegistration.cpp — Private của plugin Work
namespace
{
    FPaldarkFragmentTypeRegistration MakeRegistration()
    {
        FPaldarkFragmentTypeRegistration Entry;
        Entry.TypeId = TEXT("Work.Capable");
        Entry.Construct = []() -> TUniquePtr<FPaldarkFragment>
        {
            return MakeUnique<FWorkCapableFragment>();
        };
        Entry.Owner = TEXT("Work");
        return Entry;
    }

    const bool GRegistered =
        FPaldarkFragmentRegistry::Get().Add(MakeRegistration());
}
```

`GRegistered` không phải một danh sách tổng. Nó nằm trong file của Work, và
file đó tự chịu trách nhiệm gọi `Add`. Plugin khác chỉ đọc `Work.Capable`; nó
không sửa struct hoặc registration của Work. Đây là pattern registry cho
contract của Paldark, không phải lý do để tự thay thế `UGameFrameworkComponentManager`.

### Đăng ký một kênh thông điệp

Kênh là một danh từ chung, nên tên phải theo L9. Tính năng làm việc không phát kênh chung như `WorkFinished`; nó phát `Paldark.Work.Event.Finished`.

```cpp
// WorkMessageRegistration.cpp
namespace
{
    const bool GRegistered =
        FPaldarkMessageRegistry::Get().AddChannel(
            TEXT("Paldark.Work.Event.Finished"),
            sizeof(FWorkFinishedMessage),
            TEXT("Work"));
}
```

Phần payload cũng có hợp đồng rõ ràng:

```cpp
USTRUCT()
struct FWorkFinishedMessage
{
    GENERATED_BODY()

    UPROPERTY()
    FPaldarkEntityId WorkerId;

    UPROPERTY()
    FPaldarkEntityId StationId;

    UPROPERTY()
    FName OutputDefinitionId;
};
```

Subscriber không cần include `WorkSubsystem.h`. Nó đăng ký nghe chuỗi `Paldark.Work.Event.Finished`, kiểm payload schema rồi xử lý phần của mình. Nếu bảng tin nhắn không tìm thấy channel, đó là lỗi khởi động, không phải một `nullptr` âm thầm ở giữa trận chơi.

### Đăng ký một khối lưu

Khối lưu bám đúng Chương 14: mỗi tính năng có khối riêng, có id và version riêng; thiếu khối là hợp lệ.

```cpp
// WorkSaveChunkRegistration.cpp
namespace
{
    const bool GRegistered =
        FPaldarkSaveChunkRegistry::Get().Add(
            FPaldarkSaveChunkRegistration{
                .ChunkId = TEXT("Paldark.Work"),
                .SchemaVersion = 1,
                .Owner = TEXT("Work"),
                .Serialize = &FWorkSaveChunkCodec::Serialize,
                .Deserialize = &FWorkSaveChunkCodec::Deserialize,
                .Migrate = &FWorkSaveChunkCodec::Migrate
            });
}
```

`Serialize`, `Deserialize` và `Migrate` là hàm của Work. Không có `PaldarkSaveGame.cpp` phải biết Work có bao nhiêu field. Save coordinator chỉ lặp qua registry, ghi từng chunk có mặt và giao payload về đúng owner khi đọc.

## 15.2 — Những cái bẫy thật

Tự đăng ký làm mất file dùng chung, nhưng nó không làm mất mọi vấn đề. Bẫy đầu tiên là thứ tự khởi tạo tĩnh giữa các translation unit không được đảm bảo. Nếu file A khởi tạo trước file B và A gọi thẳng vào một global registry của B, kết quả phụ thuộc linker. Vì vậy registry phải dùng dạng:

```cpp
FPaldarkFragmentRegistry& FPaldarkFragmentRegistry::Get()
{
    static FPaldarkFragmentRegistry Instance;
    return Instance;
}
```

Đối tượng `Instance` chỉ tồn tại khi `Get()` được gọi. Hàm `Add` cũng phải kiểm trùng `TypeId`, owner và schema ngay lúc đăng ký, để lỗi xuất hiện ở startup thay vì khi một JSON nào đó tình cờ dùng loại mảnh.

Bẫy thứ hai là linker có thể loại bỏ object file hoặc object tĩnh trong static library nếu không có symbol nào được tham chiếu tới nó. Khi đó code đăng ký đúng, compile đúng, nhưng registry không có entry. Đây là lý do feature plugin nên là module được Unreal nạp rõ ràng, không phải một thư viện tĩnh bị link tùy cơ hội. Nếu vẫn phải dùng static library, cần force-link function hoặc một object registration section mà build system biết phải giữ.

Bẫy thứ ba là khó gỡ lỗi. Một dòng `GRegistered` không cho biết registration thất bại vì duplicate id, module chưa load, object bị strip hay constructor ném lỗi. Registry phải ghi log khởi động có `owner`, `id`, `module`, `schema` và `result`, đồng thời cung cấp command dump:

```text
Paldark.Registry.Dump fragments
Paldark.Registry.Dump channels
Paldark.Registry.Dump save
```

Nếu một entry bị thiếu, người điều tra cần biết bảng đã thấy bao nhiêu item, module nào đã load và item nào bị từ chối. “Tự đăng ký” không được biến thành “tự biến mất”.

## 15.3 — Tự đăng ký hay quét reflection lúc chạy?

Unreal có một đường khác: định nghĩa lớp con của một lớp cơ sở bằng `UCLASS`, rồi dùng reflection để duyệt các lớp đã được đăng ký trong `UClass` system. Ví dụ, mọi loại fragment có thể là một `UObject` subclass; registry khởi động gọi `GetDerivedClasses(UPaldarkFragmentObject::StaticClass(), Classes)` rồi dựng metadata từ từng lớp.

Hai cách có trade-off khác nhau:

| Tiêu chí | Static self-registration | Reflection scan |
|---|---|---|
| Chi phí startup | Gần như chỉ là gọi `Add` cho từng module | Phải duyệt class tree, đọc metadata và có thể load class |
| Chi phí runtime | Tra bảng đã dựng | Cũng có thể tra bảng sau khi scan xong |
| Bắt lỗi thiếu registration | Khó hơn; có thể bị linker strip | Tốt hơn nếu class đã nằm trong Unreal reflection |
| Phụ thuộc Unreal | Thấp; hợp với registry code/data validator | Cao; cần engine và UObject lifecycle |
| Hỗ trợ payload data | Tự chọn constructor/codec dễ hơn | Cần quy ước UPROPERTY/instancing |
| Nguy cơ thứ tự khởi tạo | Có, phải dùng function-local static | Engine quản lý phần class registration |
| Chạy ngoài engine | Tốt, phù hợp CI đọc registry contract | Gần như không, nếu cần UObject reflection |

Không có câu trả lời “reflection luôn an toàn hơn”. Với loại mảnh và save chunk, Paldark cần một registry có thể kiểm ngoài engine, nên static registration cộng với một bước validate manifest phù hợp hơn. Với các lớp cần Unreal metadata, editor discovery, asset class hoặc factory do engine quản lý, reflection scan đáng dùng hơn vì nó giảm nguy cơ object bị linker bỏ.

Movement đã cho ta một trường hợp cụ thể hơn, không còn là ví dụ giả định.
Đây là bằng chứng của implementation chuyển tiếp, không phải cơ chế composition
đích. `UPaldarkComponentHost` hiện quét:

```text
Plugins/Features/*/Feature/*.feature.json
```

Từ mỗi manifest, host đọc `components[].class` và `components[].attach_to`. Tên trong manifest là tên C++ quen thuộc, nên host bỏ tiền tố đầu `U`, `A` hoặc `I` để ra tên mà Unreal reflection đăng ký; sau đó gọi `FindFirstObject` để phân giải `UClass`. Host kiểm tra class component là `UActorComponent`, kiểm tra actor đích `IsA(attach_to)`, rồi tạo component bằng `NewObject` với tên khai báo trong manifest và gọi `AddInstanceComponent` cùng `RegisterComponent`. Chỉ sau toàn bộ các bước đó component mới được coi là đã gắn.

Ta từng tin rằng manifest là đường composition đủ tốt: packaged log ghi nhận
host quét hai manifest và gắn `UMovementFeatureComponent` với
`reason=manifest:...`, trong khi `PaldarkRuntime` không include tên class
Movement. Nhưng điều tra UE 5.6 cho thấy ta đã dừng ở happy path standalone:
native đã có net-mode filtering, receiver lifecycle, request ownership và
Asset Registry. Vì vậy quyết định mới không phải tiếp tục mở rộng
`PaldarkComponentHost`; quyết định là chuyển composition actor/component sang
Game Features + ModularGameplay theo Chương 15b. Manifest text hiện tại sẽ là
input cho generator `GameFeatureData`, còn host cũ chỉ tồn tại trong giai đoạn
chuyển tiếp và phải được xoá sau nghiệm thu dedicated server + client join.

Đề xuất còn giữ giá trị cho contract Paldark: dùng hai tầng
**source registration** là hợp đồng nhẹ, không phụ thuộc engine; **reflection**
là lớp bổ sung cho những thứ thật sự là `UObject`. Nhưng không dùng reflection
để tự thay thế một cơ chế native đã có. Không dùng reflection để che việc một
tính năng không khai báo owner, id hoặc schema. Và không dùng static registration
trong static library mà không có test xác nhận entry thực sự xuất hiện.

## 15.4 — Tên interface và tên kênh không trộn lẫn

Paldark dùng một quy tắc duy nhất để máy và người đọc phân biệt contract gọi trực tiếp với thông điệp bất đồng bộ:

- Interface: `Paldark.<Chủ>.<Tên>`, ví dụ `Paldark.Core.HealthRead`.
- Kênh sự kiện: `Paldark.<Chủ>.Event.<Tên>`.
- Kênh kết quả: `Paldark.<Chủ>.Result.<Tên>`.

Không có ngoại lệ. `Paldark.Core.DamageRequest` nếu là interface thì được ánh xạ sang `IPaldarkDamageRequest`/`UPaldarkDamageRequest`; nếu là event thì phải đổi thành `Paldark.Core.Event.DamageRequest`. `HealthChanged`, `SaveDirty`, `EntityRegistryReady`, `TechnologyUnlocked` và `EntityTransferAccepted` đều là event, nên phải dùng tiền tố `Event`. `Mount` là interface, không phải channel; sự kiện đổi trạng thái cưỡi là `Paldark.Movement.Event.MountChanged`.

Quy tắc này cho phép validator nhìn một string và biết phải tìm interface hay message registry, đồng thời ngăn một agent đăng ký channel rồi dùng nó như API đồng bộ.

## 15.5 — GameplayTag không còn là file ngã tư

GameplayTag thường bị đặt trong một `.ini` dùng chung. Mỗi agent thêm một tag vào cùng section, và dù Git có thể ghép hai dòng, file đó vẫn là danh mục chung mà mọi tính năng phải chạm. Đó là va chạm 1 dưới dạng mới.

Paldark nên khai báo tag native trong module sở hữu:

```cpp
// WorkTags.h — Public của Work
UE_DECLARE_GAMEPLAY_TAG_EXTERN(TAG_Paldark_Work_Kind_Mining);
UE_DECLARE_GAMEPLAY_TAG_EXTERN(TAG_Paldark_Work_Event_Finished);

// WorkTags.cpp — Private của Work
UE_DEFINE_GAMEPLAY_TAG(
    TAG_Paldark_Work_Kind_Mining,
    "Paldark.Work.Kind.Mining");
UE_DEFINE_GAMEPLAY_TAG(
    TAG_Paldark_Work_Event_Finished,
    "Paldark.Work.Event.Finished");
```

Prefix phải khớp owner: `Paldark.Work.*`, `Paldark.Breeding.*`, `Paldark.Capture.*`. Không dùng `Paldark.Mining` nếu mining là một loại việc thuộc Work. Script kiểm tag phải đối chiếu macro declaration/definition, string prefix và thư mục plugin chứa file. `DefaultGameplayTags.ini` có thể còn cần cho engine hoặc tooling, nhưng nó không được là nơi duy nhất mà feature phải sửa để tồn tại.

## 15.6 — Bảng đăng ký và cách máy kiểm

| Thứ cần đăng ký | Cơ chế | Cách kiểm bằng máy |
|---|---|---|
| Loại mảnh | `FPaldarkFragmentRegistry::Get().Add(...)` trong `.cpp` của owner | Quét `TypeId`, owner, struct factory; bắt trùng id và entry không có owner |
| Kênh thông điệp | `FPaldarkMessageRegistry::Get().AddChannel(...)` | Kiểm prefix L9, payload size/schema và subscriber/channel không mồ côi |
| GameplayTag | `UE_DEFINE_GAMEPLAY_TAG` trong module owner | Đối chiếu declaration–definition, string prefix và tag trùng |
| Console command | `FAutoConsoleCommand...` trong module owner | Quét literal command, kiểm prefix và yêu cầu mỗi feature có setup/status/trigger |
| Khối lưu | `FPaldarkSaveChunkRegistry::Get().Add(...)` | Kiểm chunk id, version, codec đủ hàm, migration tăng version |
| Lớp reflection | `UCLASS` kế thừa base registry class; component manifest dùng `FindFirstObject` theo tên reflected | Commandlet/runtime duyệt class, kiểm owner metadata, duplicate id và `attach_to` |
| Dữ liệu định nghĩa | File `Data/**/*.json`/`csv` của plugin | Schema validator, mã duy nhất, mảnh đã đăng ký, tham chiếu không gãy |

Đăng ký không file chung chỉ có giá trị khi registry là một phần của contract. Mỗi entry phải có id ổn định, owner, schema/version và log kết quả. Nếu không, ta chỉ đổi một file tổng thành một lỗi phân tán khó tìm hơn.

---

**Bằng chứng cho chương này.** Cách tách đăng ký khỏi file trung tâm là thiết kế Paldark theo L1, L2, L5, L9 và mô hình bảng đăng ký ở Chương 14 (INFERRED). Các macro `UE_DECLARE_GAMEPLAY_TAG_EXTERN`/`UE_DEFINE_GAMEPLAY_TAG`, `FAutoConsoleCommandWithWorldAndArgs` và cơ chế Unreal reflection là API Unreal đã dùng trong source PaldarkLab (OBSERVED); registry fragment/channel/save trong ví dụ là phác thảo Paldark, chưa phải module đã tồn tại. Rủi ro static initialization và linker stripping là rủi ro C++/linker thực tế; lựa chọn hai tầng static registration + reflection là đề xuất kiến trúc, chưa có benchmark trong repo (UNKNOWN).
