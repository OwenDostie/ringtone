<template>
  <div>
    <div class="floating-nav">
      <a href="https://github.com/OwenDostie/ringtone" target="_blank">
        <img src="/client/assets/img/ringtone.png" class="logotype"></img>
      </a>
      <img :src="state.isConnected ? 'socketConnected.png' : 'socketDisconnected.png'" class="websocket-indicator" :title="JSON.stringify(state)"></img>
    </div>
      <router-view />
  </div>
</template>;

<script lang="ts">
import { defineComponent, provide } from 'vue';
import { setupWebsocket } from './websocket.ts';

export default defineComponent({
  setup() {
    const { state, sendMessage } = setupWebsocket();

    // Provide WebSocket state and actions globally
    provide('websocketState', state);
    provide('sendMessage', sendMessage);

    return { state };
  }
});
</script>

<style scoped>
.floating-nav {
  position: absolute;
  display: flex;
  top: 7px;
  left: 7px;
}
.logotype {
  width: min(120px, 100vw);
  height: auto
}
.websocket-indicator {
  width: 12px;
  height: 12px;
  padding: 12px;
}
</style>