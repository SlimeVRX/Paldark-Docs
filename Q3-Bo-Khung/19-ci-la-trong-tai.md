# Chương 19 — CI là trọng tài

Chương 9 và Chương 11 đã nói cùng một câu theo hai cách: luật không kiểm được bằng máy chỉ là lời khuyên. Một người có thể rất kỷ luật trong tuần đầu, nhưng một nghìn agent sẽ tạo ra một nghìn cách hiểu “chắc là vẫn đúng”. CI không thay thế review; nó làm phần review lặp đi lặp lại trở thành một phép kiểm có kết quả giống nhau.

Paldark không nên chờ đến lúc build game mới phát hiện hai plugin include thẳng vào nhau, một tag nằm sai namespace hoặc một feature quên khai báo save chunk. Những lỗi đó phải bị chặn khi chưa cần mở Unreal. Càng đưa phép kiểm xuống sớm, feedback càng rẻ.

## 19.1 — Những script repo đang có

Đây là các script thật đang nằm trong `scripts/ci/`, không phải danh sách tưởng tượng:

| Script | Điều đang kiểm | Có thể tái dùng cho Paldark? |
|---|---|---|
| `check_markdown_links.py` | Quét link tương đối trong `Documents` và `PaldarkV3`, báo file đích không tồn tại | Giữ nguyên; áp dụng trực tiếp cho docs plugin |
| `check_paldarkv2_headers.py` | Chặn public header include concrete class header sai boundary; cho phép một số base include | Giữ thuật toán, đổi root và allow-list theo module Paldark mới |
| `check_paldarkv2_tags.py` | Đối chiếu native GameplayTag declaration/definition với `DefaultGameplayTags.ini` và expected set | Tái dùng parser, nhưng Paldark mới nên kiểm prefix/owner và registration thay vì một file expected trung tâm |
| `validate_paldarklab.py` | Kiểm descriptor, module/loading phase, Build.cs, entrypoint, target và wiring experience | Tái dùng kiểu validator manifest/descriptor; viết adapter cho plugin feature |
| `validate_paldarkv3.py` | Kiểm topology module, dependency DAG, target, persistence evidence, test space, docs và golden slice | Tái dùng cách fail-fast/contract fragments; không bê nguyên expected module map vào Paldark plugin |

`check_markdown_links.py` là ví dụ nhỏ nhưng đúng tinh thần: nó không chạy game, đọc file, resolve path và fail nếu link gãy. `validate_paldarkv3.py` là ví dụ lớn hơn: vẫn engine-independent nhưng đã kiểm được module map, dependency DAG và các fragment contract. Hai kiểu này nên là tầng đầu của CI.

Ngược lại, `validate_paldarkv3.py` đang kiểm topology cố định của PaldarkV3, như Engine 5.6, module set, target và các tài liệu G-001/F5/F6. Tái dùng cách viết `require`, parse JSON/INI và duyệt DAG thì được; tái dùng nguyên danh sách module cho plugin Work thì sai. Script phải kiểm luật, không được biến kiến trúc hiện tại của một project thành luật vĩnh viễn.

## 19.2 — Bảng trọng tài L1–L12

| Luật | Script kiểm | Thuật toán đủ để viết | Vi phạm |
|---|---|---|---|
| L1 — một feature, một plugin, một chủ | `validate_feature_boundaries.py` | Lấy `git diff --name-only`, tìm plugin root gần nhất, đối chiếu owner manifest và bảng phân công; chặn file ngoài root trừ allow-list | Lỗi |
| L2 — không biết tên feature khác | `check_feature_includes.py` | Quét `#include`, tên channel và direct class reference; resolve đường dẫn về `Plugins/Features/<Other>` | Lỗi |
| L3 — lớp cơ sở bất động | `check_frozen_core.py` | So diff với danh sách `CoreFrozenPaths`; nếu thêm field/function vào base header hoặc cpp thì fail | Lỗi |
| L4 — Public tối thiểu | `check_public_boundaries.py` | Quét include trong `Public/`, cấm concrete class của feature khác; cho phép type/interface allow-list | Lỗi |
| L5 — thêm file, không sửa enum/switch trung tâm | `check_extension_patterns.py` | AST/text scan enum tập trung, switch trên type đã đăng ký và danh sách tổng; báo vị trí file/line | Lỗi |
| L6 — định nghĩa/mảnh/thực thể | `validate_data_shape.py` | Parse definition, bắt `id/schema/fragments`; resolve fragment registry; kiểm entity/save schema không nhét definition-only field | Lỗi |
| L7 — cấu hình là text | `check_text_configuration.py` | Quét `Data/` và `Feature/`, fail `.uasset`/`.umap` trong config; parse JSON/CSV và kiểm schema | Lỗi |
| L8 — một state, một chủ ghi | `validate_ownership.py` | Đọc `owns_state` từ manifest, lập index state→owner; scan mutation function/field write và so với index | Lỗi |
| L9 — danh từ có prefix owner | `check_namespaces.py` | Quét tag, channel, id, command, log category; lấy owner từ plugin path, kiểm prefix `Paldark.<Owner>.` | Lỗi |
| L10 — dependency ở một file | `validate_feature_manifest.py` | Parse đúng một `Feature/<Name>.feature.json`; so interface/listens/emits/components/data với code và registry thực | Lỗi |
| L11 — C++ tối đa, Blueprint presentation | `check_blueprint_policy.py` | Asset audit parent class, replicated variable, forbidden state nodes và node budget; fail Blueprint không có C++ parent | Lỗi/cảnh báo node |
| L12 — mutation có log chuẩn | `check_mutation_logging.py` + test runtime | AST tìm owner mutation, kiểm log/correlation trong cùng function; runtime test tái hiện và parse `PD|...` | Lỗi |

Không phải mọi phép kiểm đều nên là regex. `check_feature_includes.py` có thể bắt đầu bằng text scanner, nhưng `validate_ownership.py` cần hiểu declaration, function và field write đủ để không báo giả. Còn Blueprint policy bắt buộc có một bước đọc asset registry/Unreal metadata; Python ngoài engine chỉ kiểm được những metadata đã export.

## 19.3 — Các quy tắc từ Chương 12–18

| Quy tắc | Script kiểm | Cách kiểm | Vi phạm |
|---|---|---|---|
| Khái niệm dùng chung phải có tên, định nghĩa, owner, người dùng và “không phải là gì” | `validate_concept_catalog.py` | Parse catalog văn bản, kiểm đủ năm trường, id duy nhất, owner tồn tại | Cảnh báo trước, lỗi khi merge |
| State có đúng một owner và owner là feature thật | `validate_ownership.py` | Gom các manifest và catalog quyền ghi, bắt duplicate hoặc owner không tồn tại | Lỗi |
| Definition id là text, global unique, không đổi khi đã lưu | `validate_data_shape.py` + `check_save_ids.py` | Quét toàn bộ JSON/CSV; so id với snapshot manifest; reject numeric-only hoặc duplicate | Lỗi |
| Fragment không tham chiếu fragment khác và không bắt buộc mọi definition | `validate_fragment_contracts.py` | Parse schema/registration, cấm nested fragment reference và required fragment toàn cục | Lỗi |
| Entity dùng stable id, không dùng actor pointer | `check_persistence_refs.py` | Quét save schema/serialization fields, cấm UObject pointer trong bản lưu; yêu cầu `FPaldarkEntityId`/text id | Lỗi |
| Save chunk riêng, version riêng, thiếu chunk hợp lệ | `validate_save_chunks.py` | Đối chiếu manifest chunk với registry codec; test đọc file thiếu chunk; kiểm migration version tăng | Lỗi |
| Data registry quét thư mục, không có danh sách tổng | `validate_data_registry.py` | Tìm file `Data/**/*.json/csv`, parse mọi id; fail code chứa central all-items list | Lỗi |
| Registration không dùng file chung | `check_self_registration.py` | Quét `.cpp` có `Registry::Get().Add`, tag macro, command macro, save registration; đối chiếu owner | Cảnh báo thiếu, lỗi duplicate |
| Static registry không phụ thuộc global initialization | `check_registry_pattern.py` | Tìm `Get()` có function-local static; cảnh báo global registry object và registration trước accessor | Lỗi |
| Kênh message, tag, command có prefix L9 | `check_namespaces.py` | Dùng cùng namespace scanner cho literal và macro declaration | Lỗi |
| Interface và channel có hình dạng tên khác nhau | `check_contract_names.py` | Interface phải là `Paldark.<Owner>.<Name>`; event là `Paldark.<Owner>.Event.<Name>`; result là `Paldark.<Owner>.Result.<Name>`; `Mount` không được xuất hiện như channel | Lỗi |
| Mỗi feature có setup/status/trigger command | `validate_feature_commands.py` | Đọc manifest, phân loại command theo hậu tố, kiểm literal registration tồn tại | Lỗi |
| Mutation log có timestamp/session/correlation/requester/target/field/before/after/reason | `check_log_contract.py` + `parse_runtime_logs.py` | Static scan format string; runtime fixture parse key-value, kiểm correlation nối được chuỗi | Lỗi |
| Playtest có expected/actual/log correlation | `validate_playtest_records.py` | Parse bảng Markdown, kiểm cột bắt buộc và corr tồn tại trong fixture log | Lỗi tài liệu |

Các script có thể dùng chung parser. Ví dụ `check_namespaces.py` không nên có tám bản sao cho tag, command và log; nó nhận vào các extractor và một hàm lấy owner. Mục tiêu là một khái niệm “owner” được kiểm giống nhau ở mọi danh mục.

## 19.4 — Ba tầng kiểm tra

### Tầng 1 — Không cần Unreal, chạy mỗi commit

Đây là tầng có feedback nhanh nhất và nên bắt càng nhiều càng tốt:

- parse JSON/CSV/manifest;
- kiểm id, prefix, duplicate và reference;
- kiểm plugin boundary, include và dependency DAG;
- kiểm Public/Private;
- kiểm save chunk/version/migration declaration;
- kiểm command/tag/channel registration bằng source scan;
- kiểm Markdown links, checklist và playtest record;
- kiểm `.uasset` không lọt vào thư mục cấu hình.

Các script hiện có `check_markdown_links.py`, `check_paldarkv2_headers.py`, `check_paldarkv2_tags.py` và phần lớn `validate_paldarkv3.py` chứng minh tầng này khả thi. Nó nên chạy trên mỗi pull request, thậm chí trước khi agent gửi branch.

### Tầng 2 — Cần compile hoặc Unreal commandlet

Tầng này kiểm những điều text không đủ biết:

- C++ registration thật sự link và module load;
- `UCLASS` parent, reflection metadata và Blueprint parent;
- factory fragment dựng được đúng struct;
- payload message đúng size/schema;
- Asset Manager hoặc registry tìm được asset;
- Build.cs dependency có thật;
- migration codec compile và round-trip bản lưu.

`validate_paldarklab.py` cho thấy descriptor/Build.cs/entrypoint có thể kiểm riêng; phần compile và commandlet nên được giữ thành gate khác để lỗi không bị trộn với lỗi topology.

### Tầng 3 — Chạy game, PIE, dedicated server hoặc packaged build

Chỉ runtime mới trả lời được:

- authority có thật sự là server không;
- hai client có cùng state sau replication không;
- mutation có log đúng correlation không;
- command setup/status/trigger đi qua public contract thật không;
- save/load sau restart có giữ entity id và quan hệ không;
- Blueprint presentation có phản ứng đúng `OnRep` không;
- hiệu năng và timing có chịu được số lượng actor thực tế không.

`validate_paldarkv3.py` đã gọi tên các loại bằng chứng như persistence F5, packaged crash qualification F6, deterministic test space và G-001 preview. Đó là mẫu tốt: tầng runtime không nên được thay bằng câu “đã chạy thử”.

## 19.5 — CI không bắt được mọi thứ

CI không biết hai khái niệm khác tên nhưng cùng nghĩa. Nó có thể thấy `Work.Assignment` và `Worker.Job` đều unique, nhưng không hiểu hai agent vừa tạo hai từ cho cùng một state. Chỗ này cần danh mục khái niệm và mắt người.

CI cũng không biết thiết kế sai nhưng hoàn toàn tuân luật. Một feature có plugin riêng, manifest đúng, owner duy nhất và log đủ, nhưng chọn sai authority hoặc tạo vòng lặp gameplay tệ — máy vẫn xanh. Tương tự, schema có thể hợp lệ nhưng progression vô nghĩa, drop rate mất cân bằng hoặc worker làm quá nhanh.

Blueprint node budget cũng không chứng minh presentation tốt. Một Blueprint 20 node có thể giấu một quyết định sai trong một custom event; một Animation Blueprint 100 node có thể chỉ là locomotion hợp lệ. Đây là lý do cảnh báo phải mở ra review, không được biến một con số thành ảo tưởng an toàn.

Cuối cùng, CI không biết evidence có nói thật về runtime hay không nếu test fixture không bao phủ tình huống. Nó chỉ biết log parse được. Người review vẫn phải hỏi: test có tái hiện đúng bug không, state owner có đúng trong gameplay không, và một tính năng mới có thật sự cần thêm khái niệm hay chỉ đang đặt tên lại cái cũ?

## 19.6 — Một pipeline đề xuất

Mỗi pull request Paldark nên đi qua thứ tự:

1. `check_markdown_links.py` và format/document checks.
2. Data/manifest/namespace/ownership/registry checks.
3. Header/dependency/frozen-core checks.
4. Build và commandlet registration checks.
5. Runtime smoke test với command setup/status/trigger.
6. Multiplayer/save/playtest qualification nếu feature chạm authority, entity hoặc chunk.

Nếu tầng 1 fail, không chạy tầng 3 để che mất lỗi rẻ hơn. Nếu tầng 2 pass nhưng compile fail, báo đúng loại lỗi là contract đã hợp lệ nhưng implementation chưa dựng được. Nếu runtime fail, log correlation và playtest record phải đi cùng failure report.

Đây là ý nghĩa của “CI là trọng tài”: nó không quyết định game có hay không, cũng không thay người thiết kế. Nó chỉ đảm bảo mọi người đang chơi theo cùng một hình dạng, và khi hình dạng đó bị phá thì báo ngay cho đúng người.

---

**Bằng chứng cho chương này.** Năm script `check_markdown_links.py`, `check_paldarkv2_headers.py`, `check_paldarkv2_tags.py`, `validate_paldarklab.py` và `validate_paldarkv3.py` là OBSERVED trong `scripts/ci/`; mô tả parser, module DAG, descriptor, tag/header boundary và evidence contract bám source thật. Các script `validate_feature_boundaries.py`, `check_feature_includes.py`, `validate_ownership.py` và các script còn lại trong bảng là đề xuất mới (INFERRED), chưa tồn tại trong repo. Phân tầng engine-independent/compile/runtime là thiết kế vận hành dựa trên cấu trúc validator hiện có; CI không bắt được trùng nghĩa, thiết kế sai, cân bằng và chất lượng coverage là giới hạn thực tế (UNKNOWN nếu chưa có benchmark).
