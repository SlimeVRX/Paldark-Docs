# Paldark Docs

Toàn bộ tài liệu thiết kế và kiến trúc Paldark được biên soạn thành một cuốn sách kỹ thuật trực tuyến.

Đọc tại: **https://slimevrx.github.io/Paldark-Docs/**

## Nội dung

- 6 quyển, 46 chương chính
- giáo trình thực hành và danh mục sống
- phụ lục nguồn, bằng chứng và câu hỏi mở
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
