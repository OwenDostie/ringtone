<template>
  <h2>GamePage</h2>
  <div id="lobbyInfo">
    <h2>connected to lobby with code:{{ computedLobbyCode }} </h2>
    <br>
    <h3>lobby member list</h3><br>
      <ul>
        <li v-for="member in lobbyMembers" :key="member">{{ member }}</li>
      </ul>
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject, computed } from 'vue';
  import { WebSocketState } from '../appLogic';

  export default defineComponent({
  name: 'GamePage',
  setup() {
    const websocketState = inject<WebSocketState>('websocketState');
    const sendMessage = inject<(message: Record<string, any>) => void>('sendMessage');

    if (!websocketState || !sendMessage) {
      throw new Error('WebSocket state or sendMessage function not provided');
    }
    console.log('lobbyMembers:', websocketState.lobbyMembers);
    console.log('lobbyCode:', websocketState.lobbyCode);

    const computedLobbyCode = computed(() => websocketState.lobbyCode);

    return {
      lobbyMembers: websocketState.lobbyMembers,
      computedLobbyCode
    };
  }

  });
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>