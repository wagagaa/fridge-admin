<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import type { FridgeItem, FridgeRecord } from '../types/item'
import FridgeRecords from './FridgeRecords.vue'
import { message, Modal, Button } from 'ant-design-vue'

interface NewItem {
  name: string[]
  quantity: number
  owner: string[]
}

const items = ref<FridgeItem[]>([])
const newItem = ref<NewItem>({
  name: [],
  quantity: 1,
  owner: []
})

// 存储已有的物品名称和存入人
const existingNames = computed(() => [...new Set(items.value.map(item => item.name))])
const existingOwners = computed(() => [...new Set(items.value.map(item => item.owner))])

// 从 localStorage 加载数据
const loadItems = () => {
  const savedItems = localStorage.getItem('fridgeItems')
  if (savedItems) {
    items.value = JSON.parse(savedItems)
  }
}

// 保存数据到 localStorage
const saveItems = () => {
  localStorage.setItem('fridgeItems', JSON.stringify(items.value))
}

const recordsRef = ref()

// 修改添加记录方法
const addRecord = (record: Omit<FridgeRecord, 'id' | 'timestamp'>) => {
  const records = JSON.parse(localStorage.getItem('fridgeRecords') || '[]')
  const newRecord: FridgeRecord = {
    ...record,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  }
  records.unshift(newRecord)
  localStorage.setItem('fridgeRecords', JSON.stringify(records))
  recordsRef.value?.loadRecords()
  return true
}

// 修改提示方法
const showError = (msg: string) => {
  message.error(msg)
}

const showSuccess = (msg: string) => {
  message.success(msg)
}

// 修改确认方法
const confirm = (msg: string, onOk: () => void) => {
  Modal.confirm({
    title: '确认',
    content: msg,
    onOk
  })
}

// 修改添加物品方法
const addItem = () => {
  const name = newItem.value.name[0]
  const owner = newItem.value.owner[0]

  if (!name || !owner) {
    showError('请填写物品名称和存入人')
    return
  }

  const item: FridgeItem = {
    id: Date.now().toString(),
    name,
    quantity: newItem.value.quantity,
    owner,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const success = addRecord({
    itemName: name,
    quantity: item.quantity,
    owner,
    type: 'add'
  })

  if (success) {
    items.value.push(item)
    saveItems()
    showSuccess('添加成功')

    newItem.value = {
      name: [],
      quantity: 1,
      owner: []
    }
  }
}

// 取出物品
const removeItem = (id: string) => {
  const item = items.value.find(item => item.id === id)
  if (item) {
    addRecord({
      itemName: item.name,
      quantity: 0,
      owner: item.owner,
      type: 'removeAll'
    })
  }
  items.value = items.value.filter(item => item.id !== id)
  saveItems()
}

// 修改数量
const updateQuantity = (item: FridgeItem, amount: number) => {
  item.quantity += amount
  item.updatedAt = new Date().toISOString()
  
  addRecord({
    itemName: item.name,
    quantity: item.quantity,
    owner: item.owner,
    type: amount > 0 ? 'increment' : 'decrement'
  })
  
  if (item.quantity <= 0) {
    removeItem(item.id)
  } else {
    saveItems()
  }
}

// 修改清空方法
const clearAllItems = () => {
  if (!items.value.length) {
    showError('冰箱已经是空的了')
    return
  }
  
  confirm('确定要清空所有物品吗？', () => {
    items.value.forEach(item => {
      addRecord({
        itemName: item.name,
        quantity: 0,
        owner: item.owner,
        type: 'removeAll'
      })
    })
    items.value = []
    saveItems()
    showSuccess('已清空所有物品')
  })
}

// 获取记录数量
const getRecordsLength = computed(() => recordsRef.value?.recordsLength || 0)

// 修改清空方法
const clearAllRecords = () => {
  if (!getRecordsLength.value) {
    showError('没有可清空的记录')
    return
  }
  
  confirm('确定要清空所有操作记录吗？', () => {
    localStorage.removeItem('fridgeRecords')
    recordsRef.value?.loadRecords()
    showSuccess('已清空所有记录')
  })
}

// 修改表格列配置
const tableColumns = [
  { title: '物品名称', dataIndex: 'name' },
  { title: '数量', dataIndex: 'quantity' },
  { title: '存入人', dataIndex: 'owner' },
  { 
    title: '存入时间', 
    dataIndex: 'createdAt',
    customRender: ({ text }: { text: string }) => new Date(text).toLocaleString()
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    align: 'center' as const,
    fixed: 'right' as const,
    customRender: ({ record }: { record: FridgeItem }) => h('div', { 
      class: 'action-buttons' 
    }, [
      h(Button, {
        type: 'primary',
        size: 'small',
        onClick: () => updateQuantity(record, 1)
      }, () => '+1'),
      h(Button, {
        size: 'small',
        onClick: () => updateQuantity(record, -1)
      }, () => '-1'),
      h(Button, {
        type: 'primary',
        danger: true,
        size: 'small',
        onClick: () => removeItem(record.id)
      }, () => '取出全部')
    ])
  }
]

// 修改选项格式，过滤掉空值并确保是字符串类型
const nameOptions = computed(() => 
  existingNames.value
    .filter(name => name && (typeof name === 'string' ? name.trim() : String(name[0] || '').trim())) // 处理数组和字符串
    .map(name => ({ 
      value: typeof name === 'string' ? name : name[0] || '', 
      label: typeof name === 'string' ? name : name[0] || '' 
    }))
)

const ownerOptions = computed(() => 
  existingOwners.value
    .filter(owner => owner && (typeof owner === 'string' ? owner.trim() : String(owner[0] || '').trim())) // 处理数组和字符串
    .map(owner => ({ 
      value: typeof owner === 'string' ? owner : owner[0] || '', 
      label: typeof owner === 'string' ? owner : owner[0] || '' 
    }))
)

// 添加搜索过滤函数
const filterOption = (input: string, option: any) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 修改处理函数
const handleNameChange = (value: string[]) => {
  const lastValue = value[value.length - 1]
  if (lastValue?.trim()) {
    newItem.value.name = [lastValue]
  }
}

const handleOwnerChange = (value: string[]) => {
  const lastValue = value[value.length - 1]
  if (lastValue?.trim()) {
    newItem.value.owner = [lastValue]
  }
}

const searchItemName = ref('')
const searchItemOwner = ref('')

// 过滤物品列表
const filteredItems = computed(() => {
  return items.value.filter(item => {
    const nameMatch = !searchItemName.value || 
      (typeof item.name === 'string' ? 
        item.name.toLowerCase().includes(searchItemName.value.toLowerCase()) :
        item.name[0]?.toLowerCase().includes(searchItemName.value.toLowerCase()))
    
    const ownerMatch = !searchItemOwner.value || 
      (typeof item.owner === 'string' ? 
        item.owner.toLowerCase().includes(searchItemOwner.value.toLowerCase()) :
        item.owner[0]?.toLowerCase().includes(searchItemOwner.value.toLowerCase()))
    
    return nameMatch && ownerMatch
  })
})

onMounted(() => {
  loadItems()
})
</script>

<template>
  <a-card class="fridge-manager">
    <!-- 添加物品表单 -->
    <a-form layout="inline" class="add-item-form">
      <a-form-item label="物品名称">
        <a-select
          v-model:value="newItem.name"
          :options="nameOptions"
          placeholder="物品名称"
          show-search
          mode="tags"
          :max-tag-count="1"
          :token-separators="[',']"
          :filter-option="filterOption"
          :allow-clear="true"
          style="width: 200px"
          @change="handleNameChange"
        />
      </a-form-item>

      <a-form-item label="数量">
        <a-input-number 
          v-model:value="newItem.quantity" 
          :min="1"
        />
      </a-form-item>

      <a-form-item label="存入人">
        <a-select
          v-model:value="newItem.owner"
          :options="ownerOptions"
          placeholder="存入人"
          show-search
          mode="tags"
          :max-tag-count="1"
          :token-separators="[',']"
          :filter-option="filterOption"
          :allow-clear="true"
          style="width: 200px"
          @change="handleOwnerChange"
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="addItem">
          添加
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 物品列表 -->
    <div class="list-section">
      <div class="list-header">
        <h2>物品列表</h2>
        <div class="search-form">
          <a-input
            v-model:value="searchItemName"
            placeholder="搜索物品名称"
            allow-clear
            style="width: 200px; margin-right: 16px"
          />
          <a-input
            v-model:value="searchItemOwner"
            placeholder="搜索存入人"
            allow-clear
            style="width: 200px"
          />
          <a-button 
            v-if="items.length" 
            type="primary" 
            danger
            @click="clearAllItems"
          >
            清空所有物品
          </a-button>
        </div>
      </div>

      <a-table
        v-if="items.length"
        :dataSource="filteredItems"
        :columns="tableColumns"
        :pagination="false"
      />
      <a-empty v-else description="冰箱里还没有物品" />
    </div>

    <!-- 记录列表 -->
    <div class="list-section">
      <div class="list-header">
        <h2>操作记录</h2>
        <a-button 
          v-if="getRecordsLength" 
          type="primary" 
          danger
          @click="clearAllRecords"
        >
          清空所有记录
        </a-button>
      </div>
      <FridgeRecords ref="recordsRef" />
    </div>
  </a-card>
</template>

<style scoped>
.fridge-manager {
  margin: 20px;
}

.add-item-form {
  margin-bottom: 24px;
}

.list-section {
  margin-top: 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 4px;  /* 减小按钮间距 */
  justify-content: center;  /* 居中对齐 */
}
:deep(.ant-table) .action-buttons button {
  margin-right: 8px;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

h2 {
  margin: 0;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

:deep(.ant-select) {
  width: 200px;  /* 设置输入框宽度 */
}

:deep(.ant-select-selection-overflow) {
  flex-wrap: nowrap;
}

:deep(.ant-select-selection-item) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

.operator-form {
  display: none;
}

.search-form {
  margin-bottom: 16px;
}
</style> 