<template>
  <h2>RINGTONE</h2>
  <label for="fname">Enter your name:</label>
  <input v-model="userName" type="text" id="fname" name="fname"><br><br>

  <label for="lobbyId">Enter the lobby id:</label>
  <input v-model="lobbyId" type="text" id="lobbyId" name="lobbyId"><br><br>

  <button @click="onClickJoinLobby" type="button">Join Lobby!</button><br><br>
  <button @click="onClickHost" type="button">Host a Lobby!</button>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from 'vue';
import { useRouter } from 'vue-router'; // Import the router function
import { WebSocketState } from '../appLogic'; // Adjust the import path as needed

export default defineComponent({
  name: 'HomePage',
  setup() {
    const router = useRouter(); // Access the router instance
    const websocketState = inject<WebSocketState>('websocketState');
    const sendMessage = inject<(message: string) => void>('sendMessage');

    if (!websocketState || !sendMessage) {
      throw new Error('WebSocket state or sendMessage function not provided');
    }

    const userName = ref<string>('');
    const lobbyId = ref<string>('');

    function onClickJoinLobby() {
      if (!websocketState.isConnected) {
        console.error("Cannot send message: WebSocket is not connected");
        return;
      }

      const msg = {
        type: 'join_request',
        user_name: userName.value,
        lobby_code: lobbyId.value,
        date: Date.now(),
      };
      console.log(`Trying to join lobby ${msg.lobby_code}`);
      sendMessage(JSON.stringify(msg));
      router.push('/game'); // Use the router to navigate
    }

    function onClickHost() {
      if (!websocketState.isConnected) {
        console.error("Cannot send message: WebSocket is not connected");
        return;
      }

      const msg = {
        type: 'host_request',
        hoster_name: userName.value,
        date: Date.now(),
      };
      console.log(`Sent my name to the server :3`);
      sendMessage(JSON.stringify(msg));
      router.push('/game'); // Use the router to navigate
    }

    return {
      userName,
      lobbyId,
      lobbyMembers: websocketState.lobbyMembers,
      lobbyCode: websocketState.lobbyCode,
      onClickJoinLobby,
      onClickHost,
    };
  },
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
