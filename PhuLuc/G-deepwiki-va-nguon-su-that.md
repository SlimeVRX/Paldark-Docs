# Phụ lục G — DeepWiki là lớp trình bày, không phải nguồn sự thật

File `Documents/DeepWiki/Wiki-—-SlimeVRX-Soliz-Devin-PaldarkKit.md` là bản tổng hợp sinh từ snapshot GitHub `638298d1`. Cấu trúc của nó hữu ích cho cách trình bày web: overview → topology → child pages → system pages → diagrams → relevant source files. Nội dung của nó **không còn là baseline kiến trúc hiện tại**.

## G.1 — Các claim đã lỗi thời hoặc cần hạ độ tin cậy

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

Khi render mâu thuẫn code hoặc ADR, sửa source document/evidence trước rồi regenerate. Không hand-edit một claim chỉ trong file DeepWiki vì lần sinh sau sẽ ghi đè và các agent khác vẫn đọc source cũ.

## G.3 — Cấu trúc page chuẩn khi regenerate

Mỗi page nên có:

1. **Question/Player value** — trang này trả lời gì?
2. **Current evidence status** — snapshot, E/V/P, confidence.
3. **First-principles model** — state, owner, transition, invariant.
4. **Architecture mapping** — module/API/GameFeature/Experience contribution.
5. **Implementation mapping** — file/commit với nhãn `[C++]`/`[Asset]`/`[Doc]`.
6. **Normal flow + failure flow** — diagram nhỏ nhất có ích.
7. **Human test card** — input, expected visible/log, output cần trả.
8. **Open questions** — input/output cụ thể.
9. **Related pages** — prerequisite, consumer, owner.

Overview không được tuyên bố “done” từ số plugin, số file hoặc log. Nó phải đọc dashboard ba chiều Engineering/Playable/Parity và evidence chain bảy trạng thái.

## G.4 — Điều kiện regenerate

Regenerate DeepWiki sau khi:

- ADR-001 được approve/reject và source docs cập nhật;
- Chương 36–42 được commit;
- link/evidence check pass;
- snapshot commit mới được ghi vào header;
- claim runtime không vượt quá human evidence.

Tới lúc đó, file hiện tại chỉ là **reference về layout**, không phải tài liệu ra quyết định.
