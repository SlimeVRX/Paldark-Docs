# Paldark Docs

Paldark Docs hiện có kế hoạch canonical ở trang chủ: **Tái dựng KYWorld bằng C++ — từ hành vi đã quan sát đến gameplay có thể kiểm chứng**. Kế hoạch giải thích vì sao tạm dừng mở rộng PaldarkKit, cách dùng KYWorld như behavioral reference trong clean-room lab, lộ trình CR-0…CR-8, các gate human và điều kiện adapter tích hợp về sau. [Nghiên cứu composability và harness](NghienCuu/paldark-composability-harness.md) được giữ như nền tảng bằng chứng; sáu quyển cũ vẫn là archive/reference corpus.

Đọc tại: **https://slimevrx.github.io/Paldark-Docs/**

## Nội dung

- kế hoạch tái dựng KYWorld C++ canonical ở index.md
- nghiên cứu composability/harness ở NghienCuu/paldark-composability-harness.md
- 6 quyển, 46 chương chính làm kho lưu trữ và nguồn truy vết
- giáo trình thực hành và danh mục sống
- phụ lục nguồn, bằng chứng, ADR, template và câu hỏi mở
- tìm kiếm toàn văn, sơ đồ Mermaid, chế độ tối và điều hướng theo chương

## Phát triển cục bộ

```bash
pnpm install
pnpm docs:dev
```

Kiểm tra trước khi xuất bản:

```bash
pnpm docs:check
pnpm docs:build
```

Mỗi lần đẩy thay đổi lên `main`, GitHub Actions sẽ build và xuất bản lại GitHub Pages.
