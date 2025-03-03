<script setup lang="ts">
import FridgeManager from './components/FridgeManager.vue'
</script>

<template>
  <a-layout class="layout">
    <a-layout-header>
      <h1>冰箱物品管理系统</h1>
    </a-layout-header>
    <a-layout-content>
      <FridgeManager />
    </a-layout-content>
  </a-layout>
</template>

<style>
.layout {
  min-height: 100vh;
}
section {
  height: 100vh;
}

.ant-layout-header {
  display: flex;
  align-items: center;
  padding: 0 50px;
}

.ant-layout-header h1 {
  color: white;
  margin: 0;
}

.ant-layout-content {
  padding: 0 50px;
  background: #f0f2f5;
  overflow: auto;
}
</style>
