<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { page } = useData()

const sections: Array<[string, string]> = [
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

const section = computed(() => {
  if (page.value.relativePath === 'index.md') return 'Paldark · Chuyên khảo canonical'
  if (page.value.relativePath === '00-MucLuc.md') return 'Paldark · Bản đồ đọc'
  return sections.find(([prefix]) => page.value.relativePath.startsWith(prefix))?.[1] ?? 'Paldark Docs'
})

const tocLink = computed(() => withBase('/00-MucLuc'))

const status = computed(() => {
  const path = page.value.relativePath
  if (path === 'index.md') {
    return {
      kind: 'current',
      label: 'Nguồn quyết định hiện hành',
      detail: 'Chuyên khảo KYWorld C++ parity · phiên bản bằng chứng 2026-08-16',
      link: '',
    }
  }
  if (historicalPages.has(path)) {
    return {
      kind: 'historical',
      label: 'Lớp kiến trúc lịch sử',
      detail: 'Giữ để truy vết quá trình; không dùng để mở scope hoặc ghi đè chuyên khảo hiện hành.',
      link: withBase('/'),
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
      <a v-if="status.link" :href="status.link">Mở chuyên khảo hiện hành</a>
    </div>
  </div>
</template>
