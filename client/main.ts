import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setup_websocket } from './appLogic'
import router from "./router/index.ts";

const app = createApp(App);
app.use(router);
app.mount("#app");

setup_websocket();