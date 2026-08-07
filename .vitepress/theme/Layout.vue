<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PageContext from './PageContext.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <PageContext />
    </template>

    <template #sidebar-nav-after>
      <div class="book-stats" aria-label="Thống kê sách">
        <span>6 quyển</span>
        <span>46 chương</span>
        <span>133k từ</span>
      </div>
    </template>
  </Layout>
</template>
