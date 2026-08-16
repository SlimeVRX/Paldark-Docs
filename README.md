# Paldark Docs

Paldark Docs hiện có một bài nghiên cứu canonical ở trang chủ: **Paldark: từ scaffolding tính năng đến gameplay có thể kiểm chứng**. Bài viết hợp nhất chẩn đoán 15 hệ thống, evidence ladder, mô hình component, clean-room reconstruction và harness Human/Sol/Luna; các chương cũ vẫn được giữ như archive/reference corpus.

Đọc tại: **https://slimevrx.github.io/Paldark-Docs/**

## Nội dung

- bài nghiên cứu canonical ở index.md
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
