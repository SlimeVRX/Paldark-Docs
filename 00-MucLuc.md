# Thiết kế Paldark — Mục lục

Bộ tài liệu này trả lời một câu hỏi: **làm sao để rất nhiều người, hoặc rất nhiều AI agent, cùng dựng lại được một game như Palworld mà công việc của họ ghép được vào nhau?**

Nó đi theo một mạch liên tục, không phải một tập hợp bài rời. Đọc từ đầu tới cuối thì mỗi phần đều dùng lại kết luận của phần trước. Nhảy vào giữa thì vẫn đọc được, nhưng sẽ gặp những kết luận chưa được chứng minh.

## Quyển 1 — Đọc một game

Học cách nhìn một game và rút ra được cần dựng những gì.

1. [Nhìn một game thì nhìn cái gì](Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi.md)
2. [Palworld có gì vui](Q1-Doc-Mot-Game/02-palworld-co-gi-vui.md)
3. [Catalog tính năng](Q1-Doc-Mot-Game/03-catalog-tinh-nang.md)
4. [Từ tính năng ra trạng thái](Q1-Doc-Mot-Game/04-tu-tinh-nang-ra-trang-thai.md)
5. [Bản đồ hệ thống và thứ tự dựng](Q1-Doc-Mot-Game/05-ban-do-he-thong.md)

## Quyển 2 — Vấn đề của nghìn người cùng code

Vì sao codebase vỡ khi đông người, và những ai đã giải bài toán này rồi.

6. [Vì sao codebase vỡ khi đông người](Q2-Van-De-Nghin-Nguoi/06-vi-sao-codebase-vo-khi-dong-nguoi.md)
7. [Lyra chữa được gì](Q2-Van-De-Nghin-Nguoi/07-lyra-chua-duoc-gi.md)
8. [Lyra lấy của ta bao nhiêu](Q2-Van-De-Nghin-Nguoi/08-cai-gia-cua-lyra.md)
9. [UEFN dạy thêm gì](Q2-Van-De-Nghin-Nguoi/09-uefn-day-them-gi.md)
10. [Bằng chứng rằng modular có thật](Q2-Van-De-Nghin-Nguoi/10-bang-chung-modular-co-that.md)
11. [Luật kiến trúc Paldark](Q2-Van-De-Nghin-Nguoi/11-luat-kien-truc-paldark.md)

## Quyển 3 — Bộ khung

Bộ khung cụ thể: module, dữ liệu, đăng ký, ranh giới, kiểm chứng.

12. [Danh mục khái niệm và quyền ghi](Q3-Bo-Khung/12-danh-muc-khai-niem-va-quyen-ghi.md)
13. [Bản đồ module](Q3-Bo-Khung/13-ban-do-module.md)
14. [Hợp đồng dữ liệu](Q3-Bo-Khung/14-hop-dong-du-lieu.md)
15. [Đăng ký không cần file dùng chung](Q3-Bo-Khung/15-dang-ky-khong-can-file-dung-chung.md)
15b. [Game Features và Modular Gameplay](Q3-Bo-Khung/15b-game-features-va-modular-gameplay.md)
16. [Một tính năng gồm những gì](Q3-Bo-Khung/16-mot-tinh-nang-gom-nhung-gi.md)
17. [Blueprint được làm gì](Q3-Bo-Khung/17-blueprint-duoc-lam-gi.md)
18. [Log, test và bằng chứng](Q3-Bo-Khung/18-log-test-va-bang-chung.md)
19. [CI là trọng tài](Q3-Bo-Khung/19-ci-la-trong-tai.md)

## Quyển 4 — Dựng lại Palworld

Áp bộ khung lên từng hệ thống, theo thứ tự chơi được.

20. [Nền, và cách đọc quyển này](Q4-Dung-Lai-Palworld/20-nen-va-cach-doc-quyen-nay.md)

21. [Di chuyển và input](Q4-Dung-Lai-Palworld/21-di-chuyen-va-input.md)
22. [Tương tác và thu thập](Q4-Dung-Lai-Palworld/22-tuong-tac-va-thu-thap.md)
23. [Vật phẩm và túi đồ](Q4-Dung-Lai-Palworld/23-vat-pham-va-tui-do.md)
24. [Chế tạo](Q4-Dung-Lai-Palworld/24-che-tao.md)
25. [Chiến đấu](Q4-Dung-Lai-Palworld/25-chien-dau.md)
26. [Bắt giữ](Q4-Dung-Lai-Palworld/26-bat-giu.md)
27. [Bạn đồng hành](Q4-Dung-Lai-Palworld/27-ban-dong-hanh.md)
28. [Xây dựng](Q4-Dung-Lai-Palworld/28-xay-dung.md)
29. [Làm việc và tự động hóa](Q4-Dung-Lai-Palworld/29-lam-viec-va-tu-dong-hoa.md)
30. [Tiến trình và công nghệ](Q4-Dung-Lai-Palworld/30-tien-trinh-va-cong-nghe.md)
31. [Thế giới và nhịp sống](Q4-Dung-Lai-Palworld/31-the-gioi-va-sinh-san.md)
32. [Hang động và trùm](Q4-Dung-Lai-Palworld/32-hang-dong-va-trum.md)
33. [Lưu trữ](Q4-Dung-Lai-Palworld/33-luu-tru.md)
34. [Nhiều người chơi](Q4-Dung-Lai-Palworld/34-nhieu-nguoi-choi.md)
35. [Nhân giống và kinh tế](Q4-Dung-Lai-Palworld/35-nhan-giong-va-kinh-te.md)

## Quyển 5 — Đánh giá và lộ trình

Tự chấm điểm những gì đã dựng, đo độ phức tạp còn lại, và biến mỗi hệ thống thành một khoá học.

36. [Kiểm toán thật PR #135–#157 và tiến độ 21–35](Q5-Lo-Trinh/36-danh-gia-tien-do.md)
37. [Đo độ phức tạp và lộ trình còn lại](Q5-Lo-Trinh/37-do-phuc-tap-va-lo-trinh.md)
38. [Giáo trình 15 khoá Paldark dựa trên 13 nguồn học](Q5-Lo-Trinh/38-giao-trinh-15-khoa-hoc.md)

## Quyển 6 — Kiến trúc VibeCoding và hợp tác người–AI

Hội tụ codebase hiện có, đặt design gate, chia write-set cho nhiều agent và biến log/test thành một hợp đồng với người chơi thật.

39. [ADR-001: Kiến trúc hội tụ cho VibeCoding đa tác nhân](Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding.md)
40. [Giao thức VibeCoding đa tác nhân](Q6-Kien-Truc-VibeCoding/40-giao-thuc-vibecoding-da-agent.md)
41. [Log và bàn giao test cho người thật](Q6-Kien-Truc-VibeCoding/41-log-va-ban-giao-test-cho-nguoi.md)
42. [Sprint 12 giờ sau design gate](Q6-Kien-Truc-VibeCoding/42-sprint-12-gio-sau-design-gate.md)
43. [Human gate ADR-001: Capture tới Work output](Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md)
44. [CI/CD tự kiểm chứng cho PaldarkV5](Q6-Kien-Truc-VibeCoding/44-ci-cd-tu-kiem-chung-paldarkv5.md)
45. [Test case nhỏ và vòng tự kiểm chứng của AI](Q6-Kien-Truc-VibeCoding/45-test-case-nho-va-vong-tu-kiem-chung.md)
46. [Bộ công cụ kiểm thử Epic cho Paldark](Q6-Kien-Truc-VibeCoding/46-bo-cong-cu-kiem-thu-epic.md)

## Lộ trình học mở rộng — Khóa 27 Bạn đồng hành

Khóa thực hành nối Chương 27 với state machine, tri giác, điều hướng và hệ Work. Đây là sáu bài đã biên soạn từ đề cương 11 bài ở Chương 38.

1. [Bài 00 — Vì sao hệ thống này tồn tại](KhoaHoc/M27-Ban-Dong-Hanh/00-tai-sao-he-thong-nay-ton-tai.md)
2. [Bài 01 — Phân rã ngược](KhoaHoc/M27-Ban-Dong-Hanh/01-phan-ra-nguoc.md)
3. [Bài 02 — Đối chiếu KYWorld và khóa học](KhoaHoc/M27-Ban-Dong-Hanh/02-doi-chieu-kyworld-va-khoa-hoc.md)
4. [Bài 03 — Máy trạng thái trong code](KhoaHoc/M27-Ban-Dong-Hanh/03-may-trang-thai-trong-code.md)
5. [Bài 04 — Tri giác và ranh giới quyết định](KhoaHoc/M27-Ban-Dong-Hanh/04-tri-giac-va-ranh-gioi-quyet-dinh.md)
6. [Bài 05 — Nối hành vi với công việc](KhoaHoc/M27-Ban-Dong-Hanh/05-noi-hanh-vi-voi-cong-viec.md)

Mẫu máy đọc được:

- [Task packet v1 và Human test card v1](Templates/index.md)

## Ba tài liệu sống

Khác với các chương ở trên — viết một lần rồi ổn định — ba file dưới đây lớn lên theo dự án và mọi người cùng cập nhật. Chương 12 giải thích cách dùng chúng.

- [DanhMuc/khai-niem.md](DanhMuc/khai-niem.md) — mọi danh từ dùng chung
- [DanhMuc/quyen-ghi.md](DanhMuc/quyen-ghi.md) — trạng thái nào thuộc về ai
- [DanhMuc/phan-cong.md](DanhMuc/phan-cong.md) — ai đang làm gì

## Phụ lục

- [A — Sổ bằng chứng](PhuLuc/A-so-bang-chung.md)
- [B — Câu hỏi mở](PhuLuc/B-cau-hoi-mo.md)
- [C — Trạng thái submodule](PhuLuc/C-trang-thai-submodule.md)
- [D — Kiểm kê 13 khoá học và độ tin cậy nguồn](PhuLuc/D-kiem-ke-13-khoa-hoc.md)
- [E — Case study KYWorld](PhuLuc/E-case-study-kyworld.md)
- [F — Nguồn Unreal/Lyra/UEFN chính thức](PhuLuc/F-nguon-chinh-thuc.md)
- [G — DeepWiki và nguồn sự thật](PhuLuc/G-deepwiki-va-nguon-su-that.md)
- [H — Ma trận donor PaldarkLab/V2/V3/Kit](PhuLuc/H-ma-tran-donor-paldark.md)
- [Bản đồ tài liệu tham chiếu](PhuLuc/ban-do-tai-lieu.md) — 13 khoá học và KYWorld ánh xạ tới chương 21–35

## Trạng thái

::: info Lưu ý biên tập
Phần dưới là snapshot triển khai theo commit, không phải kiến thức bất biến. Kiến trúc hiện hành được chốt tại [ADR-001 — Chương 39](Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding.md); hồ sơ tiến độ chi tiết nằm ở Chương 36, 42 và 43.
:::

Snapshot kiểm toán PR #135–#157 là `5e70218d`; mốc #178 được static-audit là `09e9b5e7`; vertical spine mới nằm ở `61c3aaac`. Sau #157, điểm ước lượng là 56,7% engineering, 7,0% normal-play path và 9,5% Palworld parity; ở #178 là 61,9%, 15,0% và 12,0%; sau `61c3aaac` là 65,9%, 25,7% và 14,2%. Các điểm có sai số ±5; cột normal-play sau `61c3aaac` mới là static path coverage và chưa thay thế human runtime acceptance.

Giai đoạn hiện tại là **human gate** của ADR-001. ADR-001 ở Chương 39 đã được Soliz duyệt; vertical spine đầu tiên nằm ở commit `61c3aaac`, đạt `DESIGNED`, `SOURCE_PRESENT`, `COMPILED` và static `INTEGRATED`. `PLAYER_OBSERVABLE`, `USER_VERIFIED` và `PARITY_EVIDENCED` vẫn chờ kết quả test card ở Chương 43. Gate kỹ thuật của agent là compile C++/UHT/link; không cook, package, multiplayer runtime hay babysit CI nếu Soliz không đổi scope.

Lịch sử build/package cũ vẫn là evidence lịch sử, không được tự động coi là bằng chứng cho HEAD hiện tại. Mọi feature dùng chuỗi trạng thái `DESIGNED → SOURCE_PRESENT → COMPILED → INTEGRATED → PLAYER_OBSERVABLE → USER_VERIFIED → PARITY_EVIDENCED` thay cho một chữ “done”.

Bộ tài liệu cũ trong `Documents/Book/` vẫn được giữ làm nguồn số liệu Palworld đã trích xuất, và được dẫn nguồn ở các khối bằng chứng.
