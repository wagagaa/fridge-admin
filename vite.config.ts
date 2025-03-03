import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // 监听所有可用的网络接口
    port: 5173, // 指定端口号（可选）
  },
  plugins: [vue()],
})
