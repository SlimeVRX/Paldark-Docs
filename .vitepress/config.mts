import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { bookSidebar } from './sidebar'

const siteUrl = 'https://slimevrx.github.io/Paldark-Docs/'

export default withMermaid(
  defineConfig({
    lang: 'vi-VN',
    title: 'Tái dựng KYWorld bằng C++ — Paldark',
    titleTemplate: ':title · Paldark',
    description:
      'Kế hoạch tái dựng KYWorld bằng C++ theo clean-room: từ hành vi đã quan sát đến gameplay có thể kiểm chứng, rồi mới xem xét tích hợp PaldarkKit.',
    base: '/Paldark-Docs/',
    cleanUrls: true,
    lastUpdated: true,
    srcExclude: ['README.md'],
    sitemap: { hostname: siteUrl },
    head: [
      ['meta', { name: 'theme-color', content: '#f7f7f8' }],
      ['meta', { name: 'color-scheme', content: 'light dark' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'Paldark Docs' }],
      ['meta', { property: 'og:locale', content: 'vi_VN' }],
      ['meta', { property: 'og:title', content: 'Tái dựng KYWorld bằng C++ — Paldark' }],
      [
        'meta',
        {
          property: 'og:description',
          content: 'Kế hoạch canonical tái dựng KYWorld bằng C++: clean-room lab, CR-0…CR-8, human gate và adapter PaldarkKit.',
        },
      ],
      ['meta', { property: 'og:image', content: `${siteUrl}og.png` }],
      ['meta', { property: 'og:image:width', content: '1734' }],
      ['meta', { property: 'og:image:height', content: '907' }],
      ['meta', { property: 'og:image:alt', content: 'Tái dựng KYWorld bằng C++ — gameplay có thể kiểm chứng' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:image', content: `${siteUrl}og.png` }],
    ],
    transformHead({ pageData }) {
      const path = pageData.relativePath
        .replace(/(^|\/)index\.md$/, '$1')
        .replace(/\.md$/, '')
      const canonical = new URL(path, siteUrl).toString()
      return [
        ['link', { rel: 'canonical', href: canonical }],
        ['meta', { property: 'og:url', content: canonical }],
      ]
    },
    markdown: {
      lineNumbers: true,
      image: { lazyLoading: true },
    },
    mermaid: {
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        primaryColor: '#eef4ff',
        primaryTextColor: '#172033',
        primaryBorderColor: '#94b6f5',
        lineColor: '#64748b',
        secondaryColor: '#f4f5f7',
        tertiaryColor: '#fff7ed',
      },
    },
    themeConfig: {
      siteTitle: 'Paldark — Kế hoạch KYWorld C++',
      nav: [
        { text: 'Kế hoạch KYWorld C++', link: '/' },
        { text: 'Sách Paldark', link: '/00-MucLuc' },
        {
          text: 'Nghiên cứu & bằng chứng',
          items: [
            { text: 'Nền composability và harness', link: '/NghienCuu/paldark-composability-harness' },
            { text: 'Sổ bằng chứng', link: '/PhuLuc/A-so-bang-chung' },
            { text: 'ADR-001 hiện hành', link: '/Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding' },
            { text: 'Danh mục khái niệm', link: '/DanhMuc/khai-niem' },
            { text: 'Danh mục quyền ghi', link: '/DanhMuc/quyen-ghi' },
            { text: 'Bản đồ tài liệu', link: '/PhuLuc/ban-do-tai-lieu' },
          ],
        },
        {
          text: 'SlimeVRX / Paldark-Docs',
          link: 'https://github.com/SlimeVRX/Paldark-Docs',
        },
      ],
      sidebar: bookSidebar,
      outline: { level: [2, 3], label: 'Trong trang này' },
      search: {
        provider: 'local',
        options: {
          locales: {
            root: {
              translations: {
                button: {
                  buttonText: 'Tìm kiếm',
                  buttonAriaLabel: 'Tìm trong sách',
                },
                modal: {
                  displayDetails: 'Hiện chi tiết',
                  resetButtonTitle: 'Xóa tìm kiếm',
                  backButtonTitle: 'Đóng tìm kiếm',
                  noResultsText: 'Không tìm thấy kết quả cho',
                  footer: {
                    selectText: 'chọn',
                    selectKeyAriaLabel: 'phím Enter',
                    navigateText: 'di chuyển',
                    navigateUpKeyAriaLabel: 'mũi tên lên',
                    navigateDownKeyAriaLabel: 'mũi tên xuống',
                    closeText: 'đóng',
                    closeKeyAriaLabel: 'phím Escape',
                  },
                },
              },
            },
          },
        },
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/SlimeVRX/Paldark-Docs' },
      ],
      editLink: {
        pattern: 'https://github.com/SlimeVRX/Paldark-Docs/edit/main/:path',
        text: 'Sửa trang này trên GitHub',
      },
      lastUpdated: {
        text: 'Cập nhật lần cuối',
        formatOptions: {
          dateStyle: 'medium',
          timeStyle: 'short',
        },
      },
      docFooter: {
        prev: 'Chương trước',
        next: 'Chương tiếp theo',
      },
      darkModeSwitchLabel: 'Giao diện',
      lightModeSwitchTitle: 'Chuyển sang giao diện sáng',
      darkModeSwitchTitle: 'Chuyển sang giao diện tối',
      sidebarMenuLabel: 'Mục lục sách',
      returnToTopLabel: 'Lên đầu trang',
      skipToContentLabel: 'Đi tới nội dung',
      externalLinkIcon: true,
      footer: {
        message: 'Kế hoạch tái dựng KYWorld C++ canonical và kho lưu trữ kiến trúc, evidence, giáo trình của Paldark.',
        copyright: 'Paldark Docs · SlimeVRX',
      },
    },
  }),
)
