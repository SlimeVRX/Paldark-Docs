import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { bookSidebar } from './sidebar'

const siteUrl = 'https://slimevrx.github.io/Paldark-Docs/'

export default withMermaid(
  defineConfig({
    lang: 'vi-VN',
    title: 'Paldark V5 — UE 5.6.1',
    titleTemplate: ':title · Paldark',
    description:
      'Decision package cho Paldark V5: refactor toàn bộ KYWorld trên UE 5.6.1 với Core được khóa trước, gameplay parity và human gate.',
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
      ['meta', { property: 'og:title', content: 'Paldark V5 — KYWorld C++ parity trên UE 5.6.1' }],
      [
        'meta',
        {
          property: 'og:description',
          content: 'Core Technical Design, gameplay dependency roadmap, Blueprint conversion standard và Completion Contract trước khi code.',
        },
      ],
      ['meta', { property: 'og:image', content: `${siteUrl}og.png` }],
      ['meta', { property: 'og:image:width', content: '1734' }],
      ['meta', { property: 'og:image:height', content: '907' }],
      ['meta', { property: 'og:image:alt', content: 'Paldark V5 — KYWorld C++ parity trên UE 5.6.1' }],
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
      siteTitle: 'Paldark V5 · UE 5.6.1',
      nav: [
        { text: 'V5 · Quyết định hiện hành', link: '/V5/' },
        { text: 'Core TDD', link: '/V5/02-core-technical-design' },
        { text: 'Gameplay roadmap', link: '/V5/03-gameplay-roadmap' },
        { text: 'V4 · Lưu trữ', link: '/V4/' },
        {
          text: 'Nghiên cứu & bằng chứng',
          items: [
            { text: 'Tư liệu nghiên cứu · lưu trữ', link: '/NghienCuu/paldark-composability-harness' },
            { text: 'Sổ bằng chứng', link: '/PhuLuc/A-so-bang-chung' },
            { text: 'ADR-001 · hồ sơ lịch sử', link: '/Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding' },
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
        message: 'Paldark V5 là nguồn quyết định hiện hành; Paldark V4 được giữ như evidence và hồ sơ lịch sử.',
        copyright: 'Paldark Docs · SlimeVRX',
      },
    },
  }),
)
