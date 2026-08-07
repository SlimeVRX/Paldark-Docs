# Phụ lục G — DeepWiki là lớp trình bày, không phải nguồn sự thật

DeepWiki trông giống một cuốn wiki hoàn chỉnh: có overview, topology, trang con, sơ đồ và đường về source. Chính vẻ hoàn chỉnh ấy dễ làm người đọc quên rằng mọi trang được sinh ra từ một snapshot và snapshot thì tiếp tục già đi sau mỗi commit.

File `Documents/DeepWiki/Wiki-—-SlimeVRX-Soliz-Devin-PaldarkKit.md` được tổng hợp từ snapshot GitHub `638298d1`. Cấu trúc overview → topology → child pages → system pages → diagrams → relevant source files vẫn là tham chiếu tốt cho cách trình bày web. Nội dung của nó, tuy vậy, **không còn là baseline kiến trúc hiện tại**.

## G.1 — Các claim đã lỗi thời hoặc cần hạ độ tin cậy

Các dòng dưới đây không nói bản render “sai từ đầu”. Chúng cho thấy điều gì đã thay đổi sau snapshot hoặc claim nào vốn được trình bày chắc hơn bằng chứng mà audit mới tìm thấy.

| Claim trong bản render | Kết quả audit mới |
|---|---|
| Mọi gameplay system là một standalone GameFeature plugin | ADR-001 đề xuất `system ≠ GameFeature`; ShooterCore/Lyra cũng không buộc plugin-per-noun. |
| CI là referee và headless validation chứng minh integrity | #135–#157 chỉ có static Python checks; một check fail từ base trên cả 23 PR; không có UE compile/cook/gameplay check độc lập. |
| Current status tập trung Movement/PlayerPresentation | HEAD #178 đã thêm nhiều code HUD/AI/capture/world, nhưng vertical loop vẫn có blocker Interaction/Work. |
| Global event channels là integration contract đủ an toàn | Static audit tìm được schema mismatch dù cả producer/consumer compile; raw bus cần freeze và thay dần. |
| Feature lifecycle validation/log xanh tương đương gameplay chạy | Nhiều system chỉ được gọi từ `RunQA`/flag; normal-play score #157 chỉ khoảng 7%. |

## G.2 — Thứ tự nguồn sự thật

1. Code tại commit được nêu rõ.
2. Evidence ledger + ADR đã duyệt trong `Documents/Paldark/`.
3. Human test evidence gắn build/correlation.
4. Course/KYWorld/reference với nhãn nguồn.
5. DeepWiki/rendered page.

Khi bản render mâu thuẫn với code hoặc ADR, đường sửa phải đi ngược về source document và evidence rồi mới regenerate. Hand-edit một claim chỉ trong DeepWiki tạo ra hai sự thật: người đọc thấy bản mới, còn agent vẫn đọc nguồn cũ; lần sinh kế tiếp sẽ lại ghi đè phần sửa tay.

## G.3 — Cấu trúc page chuẩn khi regenerate

Một trang được sinh lại nên đưa người đọc đi từ câu hỏi tới bằng chứng theo cùng một thứ tự:

1. **Question/Player value** — trang này trả lời gì?
2. **Current evidence status** — snapshot, E/V/P, confidence.
3. **First-principles model** — state, owner, transition, invariant.
4. **Architecture mapping** — module/API/GameFeature/Experience contribution.
5. **Implementation mapping** — file/commit với nhãn `[C++]`/`[Asset]`/`[Doc]`.
6. **Normal flow + failure flow** — diagram nhỏ nhất có ích.
7. **Human test card** — input, expected visible/log, output cần trả.
8. **Open questions** — input/output cụ thể.
9. **Related pages** — prerequisite, consumer, owner.

Overview vì thế không được suy chữ “done” từ số plugin, số file hay một dòng log xanh. Nó phải đọc đồng thời ba chiều Engineering, Playable và Parity, rồi đặt feature lên evidence chain bảy trạng thái. Cấu trúc đẹp chỉ có giá trị khi nó không làm mờ độ chắc của claim.

## G.4 — Điều kiện regenerate

Một lần regenerate chỉ đáng làm khi nguồn phía dưới đã ổn định đủ để bản render không lập tức lỗi thời. Các gate tối thiểu là:

- ADR-001 được approve/reject và source docs cập nhật;
- Chương 36–42 được commit;
- link/evidence check pass;
- snapshot commit mới được ghi vào header;
- claim runtime không vượt quá human evidence.

Cho tới khi các gate ấy khép, file hiện tại chỉ là **tham chiếu về layout**, không phải tài liệu dùng để ra quyết định. DeepWiki là cửa sổ nhìn vào nguồn sự thật; nó không thay thế căn phòng phía sau cửa sổ.
