import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setup_websocket } from './appLogic'

createApp(App).mount('#app')

setup_websocket();