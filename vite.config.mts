import { defineConfig } from 'npm:vite@^5.2.10';
import vue from 'npm:@vitejs/plugin-vue@^5.0.4';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      external: ['vue'], // Externalize 'vue'
    },
  },
});