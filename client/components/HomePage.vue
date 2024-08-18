<template>
  <h2>RINGTONE</h2>
  <div :class="{ shake: invalidName }">
  <label for="fname">Enter your name:</label>
  <input v-model="userName" type="text" id="fname" name="fname"><br><br>
  </div>

  <div :class="{ shake: invalidLobbyCode }">
    <label for="requestedLobbyCode">Enter the lobby code:</label>
    <input v-model="requestedLobbyCode" type="text" id="requestedLobbyCode" name="requestedLobbyCode"><br><br>
  </div>

  <button @click="onClickJoinLobby" type="button">Join Lobby!</button><br>
  <div v-if="lobbyCode != 'failed'">{{ joinLobbyFailureMessage }}</div>
  <div v-else-if="lobbyCode == 'failed'"> {{ serverError }}</div>
  <br>
  <br>
  <button @click="onClickHost" type="button">Host a Lobby!</button><br>
  <span>{{ hostLobbyFailureMessage }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, inject, computed } from 'vue';
import { useRouter } from 'vue-router'; // Import the router function
import { WebSocketState } from '../appLogic'; // Adjust the import path as needed

export default defineComponent({
  name: 'HomePage',
  setup() {
    const router = useRouter(); // Access the router instance
    const websocketState = inject<WebSocketState>('websocketState');
    const sendMessage = inject<(message: string) => void>('sendMessage');
    const invalidName = ref(false)
    const invalidLobbyCode = ref(false)
    const hostLobbyFailureMessage = ref('')
    const joinLobbyFailureMessage = ref('')

    if (!websocketState || !sendMessage) {
      throw new Error('WebSocket state or sendMessage function not provided');
    }

    const userName = ref<string>('');
    const requestedLobbyCode = ref<string>('');

    if (websocketState.lobbyCode == 'failed') {
      joinLobbyFailureMessage.value = websocketState.err;
    }
    const lobbyCode = computed(() => websocketState.lobbyCode)
    const serverError = computed(() => websocketState.err)

    function onClickJoinLobby() {
      if (!websocketState.isConnected) {
        const join_fail_msg: string = "WebSocket is not connected.";
        console.error(join_fail_msg);
        joinLobbyFailureMessage.value = join_fail_msg;
        
        return;
      }

      if (userName.value == '') {
        joinLobbyFailureMessage.value = "Please enter a name!";
        invalidName.value = true;
        return;
      }

      if (requestedLobbyCode.value.length != 4) {
        joinLobbyFailureMessage.value = "Please enter a 4 digit lobby code!";
        invalidLobbyCode.value = true;
        return;
      }

      const msg = {
        type: 'join_request',
        user_name: userName.value,
        lobby_code: requestedLobbyCode.value,
        date: Date.now(),
      };
      console.log(`Trying to join lobby ${msg.lobby_code}`);
      sendMessage(JSON.stringify(msg));
    }

    function onClickHost() {
      if (!websocketState.isConnected) {
        const join_fail_msg: string = "WebSocket is not connected.";
        console.error(join_fail_msg);
        hostLobbyFailureMessage.value = join_fail_msg;
        
        return;
      }

      if (userName.value == '') {
        hostLobbyFailureMessage.value = "Please enter a name!";
        invalidName.value = true;
        return;
      }

      const msg = {
        type: 'host_request',
        hoster_name: userName.value,
        date: Date.now(),
      };
      console.log(`Sent my name to the server :3`);
      sendMessage(JSON.stringify(msg));
    }

    return {
      userName,
      requestedLobbyCode,
      lobbyCode,
      onClickJoinLobby,
      onClickHost,
      invalidName,
      invalidLobbyCode,
      hostLobbyFailureMessage,
      joinLobbyFailureMessage,
      serverError,
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

.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
