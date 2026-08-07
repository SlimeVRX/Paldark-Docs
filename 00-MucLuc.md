# Thiết kế Paldark — Mục lục

Một mục lục thường chỉ cho biết bài nào nằm ở đâu. Mục lục của Paldark còn phải cho thấy vì sao bài sau cần bài trước, bởi cuốn sách này theo đuổi một câu hỏi xuyên suốt: **làm sao để rất nhiều người, hoặc rất nhiều AI agent, cùng dựng lại một game như Palworld mà công việc của họ vẫn ghép được vào nhau?**

Ta sẽ không nhảy thẳng vào module và pipeline. Trước hết, ta học cách đọc một game từ cảm giác người chơi; sau đó nhìn những vết nứt xuất hiện khi nhiều người cùng viết; cuối cùng mới đóng các kết luận ấy thành hợp đồng, quyền ghi, test và CI. Bạn có thể nhảy vào giữa để tra cứu, nhưng đọc tuần tự sẽ giúp những quyết định tưởng như cứng nhắc trở nên có nguyên nhân.

## Quyển 1 — Đọc một game

Ta chưa vội nói về Unreal Engine. Năm chương đầu tập nhìn một phiên chơi như một chuỗi cảm giác, hành vi và trạng thái, rồi đi ngược từ thứ người chơi thấy tới những hệ thống buộc phải tồn tại phía sau.

1. [Nhìn một game thì nhìn cái gì](Q1-Doc-Mot-Game/01-nhin-mot-game-thi-nhin-cai-gi.md)
2. [Palworld có gì vui](Q1-Doc-Mot-Game/02-palworld-co-gi-vui.md)
3. [Catalog tính năng](Q1-Doc-Mot-Game/03-catalog-tinh-nang.md)
4. [Từ tính năng ra trạng thái](Q1-Doc-Mot-Game/04-tu-tinh-nang-ra-trang-thai.md)
5. [Bản đồ hệ thống và thứ tự dựng](Q1-Doc-Mot-Game/05-ban-do-he-thong.md)

## Quyển 2 — Vấn đề của nghìn người cùng code

Khi bản đồ hệ thống đã lộ ra, câu hỏi đổi từ “cần xây gì?” thành “ai có thể cùng xây mà không giẫm lên nhau?”. Sáu chương này quan sát chỗ một codebase đông người thường vỡ, rồi đọc Lyra và UEFN như những bằng chứng thiết kế chứ không như đáp án để sao chép.

6. [Vì sao codebase vỡ khi đông người](Q2-Van-De-Nghin-Nguoi/06-vi-sao-codebase-vo-khi-dong-nguoi.md)
7. [Lyra chữa được gì](Q2-Van-De-Nghin-Nguoi/07-lyra-chua-duoc-gi.md)
8. [Lyra lấy của ta bao nhiêu](Q2-Van-De-Nghin-Nguoi/08-cai-gia-cua-lyra.md)
9. [UEFN dạy thêm gì](Q2-Van-De-Nghin-Nguoi/09-uefn-day-them-gi.md)
10. [Bằng chứng rằng modular có thật](Q2-Van-De-Nghin-Nguoi/10-bang-chung-modular-co-that.md)
11. [Luật kiến trúc Paldark](Q2-Van-De-Nghin-Nguoi/11-luat-kien-truc-paldark.md)

## Quyển 3 — Bộ khung

Những bài học ở hai quyển đầu đến đây mới hóa thành bộ khung cụ thể. Khái niệm có danh mục, trạng thái có một chủ ghi, module có ranh giới, tính năng tự đăng ký, còn log, test và CI giữ vai trò trọng tài khi trí nhớ của con người không còn đủ sức bao quát dự án.

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

Một bộ khung chỉ đáng tin khi nó chịu được sức nặng của gameplay thật. Từ di chuyển tới kinh tế, mười sáu chương của Quyển 4 lần lượt đặt từng hệ thống lên cùng một bàn mổ: người chơi cảm thấy gì, trạng thái nằm ở đâu, ai có quyền đổi nó, và bằng chứng nào cho thấy vòng chơi thực sự khép kín.

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

Đến đây, “đã có code” vẫn chưa đồng nghĩa với “đã có game”. Quyển 5 dừng lại để đo tiến độ bằng các mức bằng chứng, nhìn thẳng vào độ phức tạp còn lại và chuyển kinh nghiệm dựng từng hệ thống thành một lộ trình học có thể lặp lại.

36. [Kiểm toán thật PR #135–#157 và tiến độ 21–35](Q5-Lo-Trinh/36-danh-gia-tien-do.md)
37. [Đo độ phức tạp và lộ trình còn lại](Q5-Lo-Trinh/37-do-phuc-tap-va-lo-trinh.md)
38. [Giáo trình 15 khoá Paldark dựa trên 13 nguồn học](Q5-Lo-Trinh/38-giao-trinh-15-khoa-hoc.md)

## Quyển 6 — Kiến trúc VibeCoding và hợp tác người–AI

Khi người cộng tác không chỉ là con người mà còn có nhiều AI agent, tốc độ viết code tăng nhanh hơn khả năng giữ kiến trúc hội tụ. Tám chương cuối đặt design gate, chia write-set, thiết kế đường bàn giao và buộc log/test phải kết thúc ở một bằng chứng người thật có thể kiểm tra.

39. [ADR-001: Kiến trúc hội tụ cho VibeCoding đa tác nhân](Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding.md)
40. [Giao thức VibeCoding đa tác nhân](Q6-Kien-Truc-VibeCoding/40-giao-thuc-vibecoding-da-agent.md)
41. [Log và bàn giao test cho người thật](Q6-Kien-Truc-VibeCoding/41-log-va-ban-giao-test-cho-nguoi.md)
42. [Sprint 12 giờ sau design gate](Q6-Kien-Truc-VibeCoding/42-sprint-12-gio-sau-design-gate.md)
43. [Human gate ADR-001: Capture tới Work output](Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md)
44. [CI/CD tự kiểm chứng cho PaldarkV5](Q6-Kien-Truc-VibeCoding/44-ci-cd-tu-kiem-chung-paldarkv5.md)
45. [Test case nhỏ và vòng tự kiểm chứng của AI](Q6-Kien-Truc-VibeCoding/45-test-case-nho-va-vong-tu-kiem-chung.md)
46. [Bộ công cụ kiểm thử Epic cho Paldark](Q6-Kien-Truc-VibeCoding/46-bo-cong-cu-kiem-thu-epic.md)

## Lộ trình học mở rộng — Khóa 27 Bạn đồng hành

Chương 27 cho ta kiến trúc của một bạn đồng hành; khóa học này đưa kiến trúc ấy xuống từng bước thực hành. Sáu bài đã biên soạn đi từ phân rã yêu cầu tới máy trạng thái, tri giác, điều hướng và điểm nối với hệ Work; chúng là phần hiện có của đề cương 11 bài ở Chương 38.

1. [Bài 00 — Vì sao hệ thống này tồn tại](KhoaHoc/M27-Ban-Dong-Hanh/00-tai-sao-he-thong-nay-ton-tai.md)
2. [Bài 01 — Phân rã ngược](KhoaHoc/M27-Ban-Dong-Hanh/01-phan-ra-nguoc.md)
3. [Bài 02 — Đối chiếu KYWorld và khóa học](KhoaHoc/M27-Ban-Dong-Hanh/02-doi-chieu-kyworld-va-khoa-hoc.md)
4. [Bài 03 — Máy trạng thái trong code](KhoaHoc/M27-Ban-Dong-Hanh/03-may-trang-thai-trong-code.md)
5. [Bài 04 — Tri giác và ranh giới quyết định](KhoaHoc/M27-Ban-Dong-Hanh/04-tri-giac-va-ranh-gioi-quyet-dinh.md)
6. [Bài 05 — Nối hành vi với công việc](KhoaHoc/M27-Ban-Dong-Hanh/05-noi-hanh-vi-voi-cong-viec.md)

Mẫu máy đọc được:

- [Task packet v1 và Human test card v1](Templates/index.md)

## Ba tài liệu sống

Một cuốn sách có thể ổn định, nhưng dự án mà nó mô tả vẫn tiếp tục thay đổi. Vì vậy ba tài liệu dưới đây không cố đóng vai chương sách: chúng là các sổ sống, được nhiều người cập nhật để cho biết dự án đang dùng danh từ nào, trạng thái thuộc về ai và công việc đang nằm trong tay người nào. Chương 12 giải thích cách đọc chúng.

- [DanhMuc/khai-niem.md](DanhMuc/khai-niem.md) — mọi danh từ dùng chung
- [DanhMuc/quyen-ghi.md](DanhMuc/quyen-ghi.md) — trạng thái nào thuộc về ai
- [DanhMuc/phan-cong.md](DanhMuc/phan-cong.md) — ai đang làm gì

## Phụ lục

Phụ lục là nơi cuốn sách để lộ đường chỉ khâu của mình. Nếu phần chính đưa ra một kết luận, các trang này cho bạn lần về bằng chứng, độ tin cậy, câu hỏi còn mở và nguồn tham chiếu đã dẫn tới kết luận đó.

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
