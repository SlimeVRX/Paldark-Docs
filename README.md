# Paldark Docs

Paldark Docs có một nguồn quyết định canonical ở trang chủ: **Tái cấu trúc KYWorld bằng C++ mà không đánh mất gameplay**. Chuyên khảo hợp nhất source audit, chronology 539 commit, retrospective PaldarkKit, Cordis/DeepSeek Harness, Lyra/UEFN, kiến trúc feature capsule, branch-by-abstraction, parity gates và quy trình Sol–Luna–fresh review. Sáu quyển, ADR và route nghiên cứu cũ là archive/reference corpus; chúng không tự mở scope triển khai.

Đọc tại: **https://slimevrx.github.io/Paldark-Docs/**

## Nội dung

- chuyên khảo KYWorld C++ parity canonical ở index.md
- route nghiên cứu cũ ở NghienCuu/paldark-composability-harness.md được giữ như trang lưu trữ/link compatibility
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
