<template>
  <div>
    <div class="floating-nav">
      <a href="https://github.com/OwenDostie/ringtone" target="_blank">
        <img src="/client/assets/img/ringtone.png" class="logotype"></img>
      </a>
      <p>{{ state.isConnected }}</p>
    </div>
      <audio src="/ringtone1.mp3" autoplay></audio>
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
  display: flexbox;
  top: 12px;
  left: 12px;
}
.logotype {
  width: min(120px, 100vw);
  height: auto
}
</style>