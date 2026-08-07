# Chương 14 — Hợp đồng dữ liệu

Chương này là chương kỹ thuật nhất của Quyển 3, và cũng là chương mà một agent sẽ mở ra nhiều lần nhất khi viết code. Nó trả lời: dữ liệu trong Paldark có hình dạng gì.

Bốn khái niệm, đi theo đúng thứ tự vòng đời của một mẩu dữ liệu:

**Định nghĩa** → **Bảng đăng ký** → **Thực thể** → **Bản lưu**

Định nghĩa là "loại này là gì", viết bằng tay dưới dạng văn bản. Bảng đăng ký là toàn bộ định nghĩa được gom lại lúc khởi động. Thực thể là một cá thể cụ thể sinh ra lúc chơi. Bản lưu là phần của thực thể sống sót qua lần thoát game.

Hiểu bốn cái này và hiểu ranh giới giữa chúng thì phần lớn quyết định thiết kế sau này tự có câu trả lời.

## 14.1 — Định nghĩa

Định nghĩa là dữ liệu tĩnh mô tả một loại. Nó có ba tính chất, và cả ba đều là hệ quả trực tiếp của việc nó không đổi lúc chạy:

- **Không cần đồng bộ qua mạng.** Client và server đọc cùng một file nên đã giống nhau sẵn. Chỉ cần gửi mã định danh, không gửi nội dung.
- **Chia sẻ được giữa mọi thực thể.** Một nghìn con cùng loài dùng chung một định nghĩa.
- **Kiểm tra được trước khi chạy.** Vì là văn bản, script đọc được toàn bộ và bắt lỗi ngay.

Theo luật L7, định nghĩa là **file văn bản**. Đây là hình dạng của nó:

```json
{
  "id": "Creature.Fluffbeast",
  "schema": 1,
  "display": { "nameKey": "Creature.Fluffbeast.Name" },
  "fragments": [
    {
      "type": "Work.Capable",
      "levels": { "Work.Mining": 2, "Work.Transport": 1 }
    },
    {
      "type": "Combat.Stats",
      "health": 120, "attackMelee": 70, "attackRanged": 50, "defense": 80
    },
    {
      "type": "Capture.Modifier",
      "rateCorrect": 1.0
    }
  ]
}
```

Chú ý: **định nghĩa gần như không có trường cố định.** Chỉ có `id`, `schema`, và một danh sách mảnh. Mọi thứ khác nằm trong mảnh.

Đây chính là chỗ luật L5 được hiện thực. Nếu định nghĩa có sẵn các trường máu, tấn công, tốc độ làm việc, thì agent làm hệ nhân giống muốn thêm một trường sẽ phải sửa file định nghĩa dùng chung, và mọi định nghĩa đã có phải cập nhật theo. Với mô hình mảnh, agent đó chỉ cần định nghĩa loại mảnh `Breeding.Compatible` trong plugin của mình, và gắn nó vào những định nghĩa cần thiết. Không ai khác bị ảnh hưởng.

### Mã định danh

Mã có dạng `<Miền>.<Tên>`, ví dụ `Creature.Fluffbeast`, `Item.StoneAxe`, `Work.Mining`. Miền phải khớp tiền tố của tính năng sở hữu, theo luật L9.

Ba tính chất bắt buộc của mã: **duy nhất toàn cục**, **là văn bản chứ không phải số**, và **không bao giờ đổi sau khi đã có bản lưu chứa nó**.

Điều thứ hai đáng giải thích, vì dùng số thì nhanh hơn. Nhưng mã số cần một nơi cấp phát — và nơi cấp phát đó là một file dùng chung mà mọi agent phải sửa, đúng va chạm số 2. Mã văn bản có tiền tố thì mỗi agent tự cấp trong không gian của mình, không cần hỏi ai. Chi phí là vài byte và một lần tra bảng băm lúc nạp; đổi lại là xóa hẳn một điểm nghẽn.

Điều thứ ba là ràng buộc nặng nhất trong chương này: **mã là mãi mãi.** Đổi tên `Item.StoneAxe` thành `Item.Axe.Stone` sẽ làm hỏng mọi file lưu đang trỏ tới nó. Nếu buộc phải đổi thì phải viết một bước di trú, chứ không được sửa lặng lẽ.

## 14.2 — Mảnh

Một loại mảnh gồm hai phần: một tên, và một cấu trúc dữ liệu.

```cpp
// Trong plugin của tính năng làm việc
USTRUCT()
struct FWorkCapableFragment : public FPaldarkFragment
{
    GENERATED_BODY()

    // Mức độ thành thạo theo từng loại việc. Khóa là nhãn loại việc.
    UPROPERTY()
    TMap<FGameplayTag, int32> Levels;
};
```

Người dùng mảnh không hỏi "định nghĩa này loại gì", mà hỏi "định nghĩa này có mảnh nào tôi quan tâm không":

```cpp
// Trả về con trỏ tới mảnh nếu định nghĩa có mang mảnh loại này, ngược lại trả nullptr.
// Không bao giờ trả về mảnh mặc định — không có mảnh là một câu trả lời hợp lệ và có nghĩa.
const FWorkCapableFragment* Frag = Definition.FindFragment<FWorkCapableFragment>();
if (Frag == nullptr)
{
    // Sinh vật này không làm việc được. Đây không phải lỗi.
    return;
}
```

Ba luật của mảnh:

1. **Một loại mảnh có đúng một chủ**, là tính năng định nghĩa ra nó. Người khác đọc được, không sửa được cấu trúc của nó.
2. **Mảnh không tham chiếu mảnh khác.** Muốn phối hợp thì đọc cả hai ở tầng trên.
3. **Không có mảnh là hợp lệ.** Không được có mảnh nào bắt buộc mọi định nghĩa phải mang. Có mảnh bắt buộc nghĩa là ta vừa tạo lại một trường cố định, và luật L5 lại bị vi phạm.

## 14.3 — Bảng đăng ký

Bảng đăng ký là kết quả của việc quét toàn bộ dự án lúc khởi động.

Quy trình bốn bước:

1. **Quét.** Duyệt mọi `Plugins/Features/*/Data/**/*.json`.
2. **Phân giải.** Đọc từng file, dựng đối tượng định nghĩa; với mỗi mảnh, tra tên loại mảnh trong bảng loại đã đăng ký để biết cần dựng struct nào.
3. **Kiểm.** Mã trùng thì báo lỗi. Loại mảnh không ai đăng ký thì báo lỗi. Tham chiếu tới mã không tồn tại thì báo lỗi.
4. **Đóng băng.** Sau khi nạp xong, bảng chỉ đọc cho tới hết phiên.

Điểm mấu chốt nằm ở chỗ **không có file nào liệt kê danh sách định nghĩa**. Thêm một sinh vật mới là thêm một file vào thư mục của một plugin. Không sửa gì, không đăng ký với ai. Đây là cách một nghìn agent thêm nội dung mà không bao giờ chạm nhau — và đây cũng là câu trả lời trực tiếp cho câu hỏi lớn nhất mà bạn đặt ra ở đầu dự án.

Bước 3 đáng nhấn thêm một lần nữa. Nó chạy được **cả ngoài game**, chỉ cần một script đọc file. Nghĩa là cả một họ lỗi — trùng mã, mảnh lạ, tham chiếu gãy — bị bắt lúc kiểm tra thay vì lúc chạy. Đây đúng là nút thắt số 2 ở Chương 8 mà ta hứa sẽ tháo.

### Điều chỉnh sau khi chạy vertical slice đầu tiên

Điều ta từng tin là: chỉ cần đặt JSON dưới `Plugins/Features/*/Data/` thì Unreal sẽ mang chúng theo khi cook, và runtime có thể coi thư mục đó như một phần tự nhiên của package. Engine 5.6 cho thấy điều đó không đúng. JSON không phải package asset mà cooker tự thu thập; cả `Data/` lẫn `Feature/*.feature.json` đều có thể vắng mặt trong bản staged nếu script không chủ động sao chép.

Quyết định mới là tách rõ hai việc. Validator vẫn quét text trong source tree để kiểm schema trước khi chạy, còn script packaging phải copy tường minh các file runtime cần dùng: dữ liệu input của feature và mọi manifest dưới `Plugins/Features/*/Feature/*.feature.json`. Vì vậy, thêm một feature không chỉ là thêm file JSON; agent phải thêm đường copy hoặc dùng cơ chế packaging chung đã có, rồi kiểm tra archive thật sự chứa file. Đây là giới hạn của pipeline Unreal đã được kiểm chứng.

Điều này không còn có nghĩa là mọi thứ liên quan đến composition phải là
JSON. Sau khi đọc source UE 5.6, L7 được làm rõ thành hai tầng ở Chương 15b:
gameplay definitions, tunables, input mapping và drop table vẫn là text; riêng
đồ thị composition native dùng `GameFeatureData.uasset`. Agent vẫn viết
manifest text, còn Python headless sinh `.uasset` như artifact phái sinh để CI
regenerate và đối chiếu. Vì vậy, `.uasset` composition không được dùng để giấu
gameplay data và không trở thành nguồn sự thật thứ hai.

Ta cũng từng dùng chữ “subsystem” như tên của hai service `UPaldarkDefinitionRegistrySubsystem` và `UPaldarkPersistenceSubsystem`, trong khi bản phác thảo ban đầu cho chúng kế thừa `UObject`. Engine không tự giữ một `UObject` trần cho ta; nếu giữ cách đó, một biến toàn cục hoặc một class trung tâm phải nắm con trỏ suốt phiên. Điều đó đi ngược L5 và L8. Code thật nay dùng `UGameInstanceSubsystem`, để Unreal cấp vòng đời và điểm truy cập theo `GameInstance`. Đây là quyết định đã chốt: “subsystem” trong hai service này là Unreal subsystem thật, không phải một danh xưng cho một object được giữ thủ công.

## 14.4 — Thực thể

Thực thể là một cá thể cụ thể. Nó có ba phần dữ liệu và ba phần này phải được phân biệt rạch ròi:

| Phần | Ví dụ | Đồng bộ mạng? | Lưu? |
|---|---|---|---|
| Định danh | mã thực thể, mã định nghĩa | có, một lần | có |
| Trạng thái bền | máu hiện tại, cấp độ, độ đói | có | có |
| Trạng thái phiên | đang nhắm ai, tiến độ hoạt hình | tùy | **không** |

```cpp
USTRUCT()
struct FPaldarkCreatureEntity
{
    GENERATED_BODY()

    // Định danh bền vững, sinh ra một lần khi cá thể được tạo, không bao giờ đổi.
    UPROPERTY() FPaldarkEntityId EntityId;

    // Mã định nghĩa. Dùng để tra bảng đăng ký lấy dữ liệu tĩnh.
    UPROPERTY() FName DefinitionId;

    UPROPERTY() int32 Level = 1;
    UPROPERTY() float Health = 0.f;
    UPROPERTY() float Hunger = 0.f;

    // Trạng thái phiên: dựng lại được, không lưu, không nằm trong bản lưu.
    UPROPERTY(Transient) FPaldarkEntityId CurrentTargetId;
};
```

Khi tạo thực thể, `EntityIdentity.Create` nhận một `FPaldarkEntityCreateContext` gồm `DefinitionId`, `Owner`, `Reason` và `CorrelationId`. Context không có fragment override: mảnh và trạng thái ban đầu là trách nhiệm của tính năng tạo thực thể, không được đẩy vào Identity vì như vậy Identity sẽ trở thành chủ gameplay.

Ranh giới quan trọng nhất trong bảng trên là dòng cuối, và nó lấy thẳng từ bài học của Verse ở Chương 9: **thứ gì dựng lại được thì không lưu.** Lưu trạng thái phiên là cách nhanh nhất để làm hỏng khả năng tương thích ngược của file lưu, vì trạng thái phiên đổi liên tục theo mỗi lần chỉnh sửa cách trình bày.

Còn một ranh giới nữa cần nói rõ: **thực thể không phải actor.** Actor là biểu diễn của thực thể trong thế giới, và nó có thể không tồn tại — con vật đang ở trong hộp lưu trữ, đang ở căn cứ mà người chơi đi xa, đang ở vùng chưa nạp. Thực thể thì vẫn còn. Nhầm hai thứ này là nguồn gốc của cả một họ lỗi khó chịu: nhân bản khi nạp lại, mất dữ liệu khi hủy actor, tham chiếu treo.

Nên luật: **mọi tham chiếu tới một cá thể đều đi qua mã định danh của nó, không đi qua con trỏ actor.** Cần actor thì hỏi hệ thống quản lý; nó trả về actor nếu đang có, trả về rỗng nếu chưa nạp — và rỗng là một câu trả lời bình thường, không phải lỗi.

## 14.5 — Bản lưu

Bản lưu chỉ chứa những gì không dựng lại được:

- Định danh và mã định nghĩa của mọi thực thể đang tồn tại
- Trạng thái bền của chúng
- Các quan hệ: ai sở hữu ai, ai đang làm việc ở đâu, cái gì nằm trong cái gì
- Trạng thái thế giới: thời gian, các nút công nghệ đã mở, tiến độ

Không chứa: dữ liệu tĩnh (đã có trong định nghĩa), trạng thái phiên, trạng thái giao diện, bất cứ thứ gì suy ra được từ những cái trên. Mọi quan hệ bền dùng `FPaldarkEntityId`, không dùng `FGuid` trần trong API công khai và không dùng actor pointer.

Ba luật của lưu trữ:

**Luật 1 — Có số phiên bản lược đồ.** Mỗi khối lưu mang một số. Khi định dạng đổi, số tăng, và phải có hàm chuyển từ phiên bản cũ sang mới. Bỏ luật này thì lần đầu tiên đổi định dạng sẽ mất toàn bộ file lưu của người chơi.

**Luật 2 — Mỗi tính năng lưu khối riêng.** Không có một struct lưu tổng cho cả game. Mỗi tính năng khai báo một khối, có tên và số phiên bản riêng, và tự chịu trách nhiệm đọc/ghi/di trú khối của mình.

Đây lại là luật L5 áp cho lưu trữ, và không có nó thì tệp lưu sẽ thành ngã tư đông nhất của dự án — mọi tính năng đều phải thêm trường vào một struct chung.

**Luật 3 — Thiếu khối là hợp lệ.** Nếu một tính năng bị tắt hoặc chưa từng chạy, khối của nó không có trong file. Đọc file thiếu khối phải chạy bình thường, không phải báo hỏng. Không có luật này thì không bao giờ bật tắt được tính năng.

```cpp
USTRUCT()
struct FPaldarkSaveChunk
{
    GENERATED_BODY()

    // Tên khối, theo quy ước tiền tố ở L9. Ví dụ: "Work", "Capture".
    UPROPERTY() FName ChunkId;

    // Phiên bản lược đồ của riêng khối này.
    UPROPERTY() int32 SchemaVersion = 1;

    // Nội dung đã tuần tự hóa. Chỉ chủ của khối biết cách đọc.
    UPROPERTY() TArray<uint8> Payload;
};
```

## 14.6 — Đi hết một vòng

Lấy một ví dụ chạy xuyên cả bốn khái niệm, để thấy chúng khớp vào nhau:

1. Agent làm hệ sinh vật viết `Creature.Fluffbeast.json`, đặt trong plugin của mình.
2. Agent làm hệ làm việc đã định nghĩa loại mảnh `Work.Capable` từ trước, trong plugin của nó.
3. Lúc khởi động, bộ quét tìm thấy file, thấy mảnh `Work.Capable`, tra được loại, dựng struct, đưa vào bảng đăng ký.
4. Lúc chơi, người chơi bắt được một con. Hệ bắt giữ tạo một thực thể mới với mã định danh mới và mã định nghĩa `Creature.Fluffbeast`.
5. Người chơi giao nó cho một trạm khai khoáng. Hệ làm việc tra định nghĩa, tìm mảnh `Work.Capable`, thấy mức khai khoáng bằng 2, và chấp nhận phân công.
6. Người chơi thoát game. Hệ sinh vật lưu khối của nó gồm thực thể; hệ làm việc lưu khối của nó gồm quan hệ phân công.
7. Người chơi vào lại. Hai khối được đọc, thực thể sống lại, phân công được nối lại qua mã định danh.

Đáng để ý ở bước 2 và bước 5: **hai agent không hề nói chuyện với nhau.** Người làm sinh vật chỉ cần biết tên mảnh `Work.Capable` và hình dạng của nó — hai thứ nằm trong danh mục khái niệm ở Chương 12. Người làm hệ làm việc không cần biết `Creature.Fluffbeast` tồn tại.

Đó là toàn bộ điều mà chương này muốn chứng minh: **hợp đồng dữ liệu đúng thì phối hợp không cần giao tiếp.**

## 14.7 — Chỗ còn để ngỏ

- **Định dạng cấu hình.** JSON dễ đọc, dễ sinh, dễ kiểm; nhưng với những bảng phẳng hàng nghìn dòng như bảng chỉ số sinh vật thì CSV gọn hơn nhiều và diff dễ nhìn hơn. Đề xuất: cho phép cả hai, CSV cho bảng phẳng và JSON cho dữ liệu có cấu trúc. Chưa chốt.
- **Nạp lại lúc đang chạy.** Sửa file cấu hình rồi nạp lại mà không khởi động lại game sẽ rút ngắn vòng lặp thử nghiệm rất nhiều, nhưng làm phức tạp lời hứa "bảng đóng băng sau khi nạp". Để lại cho giai đoạn sau.
- **Tra mảnh có đủ nhanh không.** Mỗi lần tra là một lần duyệt danh sách mảnh. Ở quy mô Palworld gần như chắc chắn không sao, nhưng chưa có số đo.

---

**Bằng chứng cho chương này.** Mô hình định nghĩa – thực thể – mảnh là OBSERVED từ kiến trúc vật phẩm của Lyra và cách plugin ở Chương 10 mở rộng nó, sau đó được tài liệu này áp rộng ra mọi loại dữ liệu (INFERRED). Quyết định dùng file văn bản thay cho asset nhị phân là thiết kế riêng của Paldark, lý do đã nêu ở Chương 8 mục 8.4. Việc Unreal 5.6 không tự cook các file JSON trong `Data/` và manifest `Feature/*.feature.json`, khiến packaging script phải copy tường minh, là OBSERVED từ Movement vertical slice. Việc `UPaldarkDefinitionRegistrySubsystem` và `UPaldarkPersistenceSubsystem` kế thừa `UGameInstanceSubsystem` là EXTRACTED từ code đã biên dịch. Nguyên tắc chỉ lưu dữ liệu bền và dựng lại phần trình bày là OBSERVED từ mô hình persistence của Verse, khảo sát khóa 16. Các trường ví dụ như mức độ thành thạo theo loại việc và hệ số điều chỉnh tỷ lệ bắt phản ánh các trường có thật trong `PalCharacterParameterDatabaseRow.h` và `EPalWorkSuitability.h` (EXTRACTED), nhưng tên và giá trị dùng ở đây là của Paldark, không sao chép dữ liệu gốc. Các đoạn mã C++ còn lại là phác thảo hợp đồng, chưa biên dịch.

### Hợp đồng đọc và hợp đồng giao dịch

Item container có hai mặt hợp đồng độc lập. `Paldark.Core.ItemRead` chỉ dành
cho truy vấn (`ReadItem`, `ReadQuantity`); Combat, Capture hoặc một consumer
chỉ đọc có thể implement contract này mà không trở thành writer. Các mutation
đi qua `Paldark.Core.ItemTransaction`, gồm consume nguyên tử một danh sách và
add item với correlation id và failure reason. Inventory implement cả hai vì
nó là owner của quantity, còn feature requester chỉ resolve đúng contract mà
nó cần. Không gộp hai mặt này vào một interface tên “Read”, vì tên contract
phải phản ánh quyền ghi thực tế và không ép implementer tương lai phụ thuộc
vào mutation API.
