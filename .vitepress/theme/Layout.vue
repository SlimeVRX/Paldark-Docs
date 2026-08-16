<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import PageContext from './PageContext.vue'

const { Layout } = DefaultTheme

const SIDEBAR_STORAGE_KEY = 'paldark-sidebar-collapsed'
const sidebarCollapsed = ref(false)

function syncSidebarState() {
  document.documentElement.classList.toggle(
    'paldark-sidebar-collapsed',
    sidebarCollapsed.value,
  )
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  syncSidebarState()

  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed.value))
  } catch {
    // The toggle still works for this page when persistent storage is unavailable.
  }
}

onMounted(() => {
  try {
    sidebarCollapsed.value =
      localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
  } catch {
    sidebarCollapsed.value = false
  }

  syncSidebarState()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('paldark-sidebar-collapsed')
})
</script>

<template>
  <Layout>
    <template #nav-bar-content-before>
      <button
        class="sidebar-toggle"
        type="button"
        aria-controls="VPSidebarNav"
        :aria-expanded="!sidebarCollapsed"
        :aria-label="sidebarCollapsed ? 'Hiện mục lục sách' : 'Thu gọn mục lục sách'"
        :title="sidebarCollapsed ? 'Hiện mục lục sách' : 'Thu gọn mục lục sách'"
        @click="toggleSidebar"
      >
        <span class="sidebar-toggle__icon" aria-hidden="true" />
      </button>
    </template>

    <template #doc-before>
      <PageContext />
    </template>

    <template #sidebar-nav-after>
      <div class="book-stats" aria-label="Thống kê sách">
        <span>6 quyển</span>
        <span>46 chương</span>
        <span>69 trang</span>
      </div>
    </template>
  </Layout>
</template>
