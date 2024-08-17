<template>
<<<<<<< Updated upstream
  <div>
    <a href="https://github.com/OwenDostie/ringtone">
      <img src="/client/assets/img/ringtone.png" class="logotype"></img>
    </a>
    <audio src="/ringtone1.mp3" autoplay></audio>
    <router-view />
  </div>
</template>;

<style scoped>
.logotype {
  position: absolute;
  top: 12px;
  left: 12px;
  width: min(120px, 100vw);
  height: auto
}
</style>
=======
  <router-view />
</template>;

<script lang="ts">
import { defineComponent, provide } from 'vue';
import { setupWebsocket, sendMessage } from './appLogic.ts';

export default defineComponent({
  setup() {
    const { state } = setupWebsocket();

    // Provide WebSocket state and actions globally
    provide('websocketState', state);
    provide('sendMessage', sendMessage);

    return {};
  }
});
</script>
>>>>>>> Stashed changes
