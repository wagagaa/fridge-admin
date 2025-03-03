<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import type { FridgeRecord } from '../types/item'
import { Modal, message } from 'ant-design-vue'
import { Button } from 'ant-design-vue'

const records = ref<FridgeRecord[]>([])

// 计算记录数量
const recordsLength = computed(() => records.value.length)

// 从 localStorage 加载记录
const loadRecords = () => {
  const savedRecords = localStorage.getItem('fridgeRecords')
  if (savedRecords) {
    records.value = JSON.parse(savedRecords)
  } else {
    // 如果没有记录，确保将数组清空
    records.value = []
  }
}

// 暴露更新方法和记录数量给父组件
defineExpose({ loadRecords, recordsLength })

const searchName = ref('')
const searchOwner = ref('')

// 过滤记录
const filteredRecords = computed(() => {
  return records.value.filter(record => {
    const nameMatch = !searchName.value || 
      (typeof record.itemName === 'string' ? 
        record.itemName.toLowerCase().includes(searchName.value.toLowerCase()) :
        record.itemName[0]?.toLowerCase().includes(searchName.value.toLowerCase()))
    
    const ownerMatch = !searchOwner.value || 
      (typeof record.owner === 'string' ? 
        record.owner.toLowerCase().includes(searchOwner.value.toLowerCase()) :
        record.owner[0]?.toLowerCase().includes(searchOwner.value.toLowerCase()))
    
    return nameMatch && ownerMatch
  })
})

// 删除记录
const deleteRecord = (id: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    onOk: () => {
      const records = JSON.parse(localStorage.getItem('fridgeRecords') || '[]')
      const newRecords = records.filter((r: FridgeRecord) => r.id !== id)
      localStorage.setItem('fridgeRecords', JSON.stringify(newRecords))
      loadRecords()
      message.success('删除成功')
    }
  })
}

// 定义表格列配置
const tableColumns = [
  { 
    title: '时间', 
    dataIndex: 'timestamp',
    customRender: ({ text }: { text: string }) => new Date(text).toLocaleString()
  },
  { 
    title: '操作类型', 
    dataIndex: 'type',
    customRender: ({ text }: { text: string }) => {
      switch (text) {
        case 'add': return '添加'
        case 'increment': return '+1'
        case 'decrement': return '-1'
        case 'removeAll': return '取出全部'
        default: return text
      }
    }
  },
  { title: '物品名称', dataIndex: 'itemName' },
  { 
    title: '剩余数量', 
    dataIndex: 'quantity',
    customRender: ({ text }: { text: number }) => h('span', {
      class: text > 0 ? 'positive' : 'negative'
    }, text > 0 ? `+${text}` : text)
  },
  { title: '存入人', dataIndex: 'owner' },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center' as const,
    fixed: 'right' as const,
    customRender: ({ record }: { record: FridgeRecord }) => h(Button, {
      type: 'link',
      danger: true,
      onClick: () => deleteRecord(record.id)
    }, () => '删除')
  }
]

onMounted(() => {
  loadRecords()
})
</script>

<template>
  <div class="records-list">
    <!-- 添加搜索框 -->
    <div class="search-form">
      <a-input
        v-model:value="searchName"
        placeholder="搜索物品名称"
        allow-clear
        style="width: 200px; margin-right: 16px"
      />
      <a-input
        v-model:value="searchOwner"
        placeholder="搜索存入人"
        allow-clear
        style="width: 200px"
      />
    </div>

    <a-table
      v-if="records.length"
      :dataSource="filteredRecords"
      :columns="tableColumns"
      :scroll="{ y: 300 }"
      :pagination="false"
    />
    <a-empty v-else description="暂无操作记录" />
  </div>
</template>

<style scoped>
.records-list {
  width: 100%;
  max-height: 400px;
}

.positive {
  color: #52c41a;
}

.negative {
  color: #ff4d4f;
}

.search-form {
  margin-bottom: 16px;
  float: right;
}
</style> 