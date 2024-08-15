import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import './style.css'
import App from './App.vue'
import { setup_websocket } from './appLogic'

createApp(App).mount('#app')

setup_websocket();