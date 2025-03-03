export interface FridgeItem {
  id: string
  name: string | string[]  // 支持字符串或字符串数组
  quantity: number
  owner: string | string[]  // 支持字符串或字符串数组
  createdAt: string
  updatedAt: string
}

export interface FridgeRecord {
  id: string
  itemName: string | string[]
  quantity: number
  owner: string | string[]
  type: 'add' | 'remove' | 'increment' | 'decrement' | 'removeAll'  // 修改操作类型
  timestamp: string
} 