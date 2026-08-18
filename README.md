# Paldark Docs

Paldark Docs tách rõ hai thế hệ. **Paldark V5** là nguồn quyết định hiện hành cho một target duy nhất UE 5.8.1: KYWorld reference, PaldarkV5 candidate, Core Technical Design, gameplay dependency roadmap, MCP/conversion pipeline, Feature Dossier/Human Gate và Completion Contract. **Paldark V4** gồm chuyên khảo UE 5.4, sáu quyển, ADR và snapshot cũ; toàn bộ được giữ làm archive/evidence và không tự mở scope implementation mới.

Đọc tại: **https://slimevrx.github.io/Paldark-Docs/**

## Nội dung

- cổng chọn phiên bản ở `index.md`
- decision package V5 trong `V5/`
- hồ sơ V4 trong `V4/` và các route sách cũ được giữ nguyên
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
