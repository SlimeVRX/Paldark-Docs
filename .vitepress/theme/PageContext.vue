<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page } = useData()

const sections: Array<[string, string]> = [
  ['V5/', 'Paldark V5 · Decision package'],
  ['V4/', 'Paldark V4 · Hồ sơ lưu trữ'],
  ['Q1-', 'Quyển 1 · Đọc một game'],
  ['Q2-', 'Quyển 2 · Vấn đề của nghìn người'],
  ['Q3-', 'Quyển 3 · Bộ khung'],
  ['Q4-', 'Quyển 4 · Dựng lại Palworld'],
  ['Q5-', 'Quyển 5 · Đánh giá và lộ trình'],
  ['Q6-', 'Quyển 6 · VibeCoding đa tác nhân'],
  ['KhoaHoc/', 'Giáo trình thực hành'],
  ['DanhMuc/', 'Danh mục sống'],
  ['PhuLuc/', 'Phụ lục và nguồn'],
  ['Templates/', 'Mẫu làm việc'],
]

const historicalPages = new Set([
  'NghienCuu/paldark-composability-harness.md',
  'Q2-Van-De-Nghin-Nguoi/11-luat-kien-truc-paldark.md',
  'Q3-Bo-Khung/13-ban-do-module.md',
  'Q3-Bo-Khung/15-dang-ky-khong-can-file-dung-chung.md',
  'Q6-Kien-Truc-VibeCoding/39-kien-truc-hoi-tu-vibecoding.md',
])

const snapshotPages = new Set([
  'Q5-Lo-Trinh/36-danh-gia-tien-do.md',
  'Q6-Kien-Truc-VibeCoding/42-sprint-12-gio-sau-design-gate.md',
  'Q6-Kien-Truc-VibeCoding/43-human-gate-adr-001-capture-to-work.md',
])

const v4Prefixes = [
  'Q1-',
  'Q2-',
  'Q3-',
  'Q4-',
  'Q5-',
  'Q6-',
  'KhoaHoc/',
  'DanhMuc/',
  'PhuLuc/',
  'Templates/',
  'NghienCuu/',
]

const section = computed(() => {
  if (page.value.relativePath === 'index.md') return 'Paldark V5 · Cổng quyết định'
  if (page.value.relativePath === '00-MucLuc.md') return 'Paldark V4 · Bản đồ đọc lưu trữ'
  return sections.find(([prefix]) => page.value.relativePath.startsWith(prefix))?.[1] ?? 'Paldark Docs'
})

const tocLink = computed(() => {
  const path = page.value.relativePath
  return withBase(path.startsWith('V5/') || path === 'index.md' ? '/V5/' : '/00-MucLuc')
})

const status = computed(() => {
  const path = page.value.relativePath
  if (path === 'index.md') {
    return {
      kind: 'current',
      label: 'Paldark V5 · nguồn quyết định hiện hành',
      detail: 'UE 5.6.1-only · PRE-CODE · Core và gameplay plan đang chờ owner duyệt',
      link: '',
    }
  }
  if (path.startsWith('V5/')) {
    return {
      kind: 'current',
      label: 'V5 · design review',
      detail: 'Proposal trước code; chỉ decision ghi ACCEPTED BY OWNER mới là constraint đã chốt.',
      link: withBase('/V5/07-open-decisions'),
    }
  }
  if (snapshotPages.has(path)) {
    return {
      kind: 'snapshot',
      label: 'Hồ sơ theo thời điểm',
      detail: 'Các trạng thái và phần trăm chỉ áp dụng cho commit được ghi trong trang.',
      link: '',
    }
  }
  if (
    path.startsWith('V4/')
    || path === '00-MucLuc.md'
    || historicalPages.has(path)
    || v4Prefixes.some((prefix) => path.startsWith(prefix))
  ) {
    return {
      kind: 'historical',
      label: 'Paldark V4 · archived',
      detail: 'Giữ để truy vết và làm evidence; không được ghi đè decision V5.',
      link: withBase('/V5/'),
    }
  }
  return null
})
</script>

<template>
  <div class="page-context-wrap">
    <div class="page-context">
      <span>{{ section }}</span>
      <a :href="tocLink">Mục lục</a>
    </div>
    <div v-if="status" class="page-status" :class="`is-${status.kind}`">
      <strong>{{ status.label }}</strong>
      <span>{{ status.detail }}</span>
      <a v-if="status.link" :href="status.link">Mở nguồn quyết định V5</a>
    </div>
  </div>
</template>
