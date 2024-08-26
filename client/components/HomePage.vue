<template>
  <h2>RINGTONE</h2>
  <div :class="{ shake: invalidName }">
    <label for="fname">Enter your name:</label>
    <input v-model="userName" type="text" id="fname" name="fname">
    <br><br>
  </div>
  <div :class="{ shake: invalidLobbyCode }">
    <label for="clientLobbyCode">Enter the lobby code:</label>
    <input v-model="clientLobbyCode" type="text" id="clientLobbyCode" name="clientLobbyCode"><br><br>
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
    <button @click="onClickJoinLobby" type="button" :disabled="!isConnected || invalidName || invalidLobbyCode" class="button">Join Lobby!</button>
    <button @click="onClickHostLobby" type="button" :disabled="!isConnected || invalidName" class="button">Host a Lobby!</button>
    <router-link to="/songbrowser">
      <button type="button" :disabled="!isConnected" class="button">Browse Songs</button>
    </router-link>
  </div>
  <div v-if="lobbyCode != 'failed'">{{ joinLobbyFailureMessage }}</div>
  <div v-else-if="lobbyCode == 'failed'">{{ serverError }}</div>
  <span>{{ hostLobbyFailureMessage }}</span>
</template>

<script lang="ts">
import { defineComponent, ref, watch, inject, computed } from 'vue'
import { useRouter } from 'vue-router' // Import the router function
import { WebSocketState } from '../websocket' // Adjust the import path as needed

export default defineComponent({
  name: 'HomePage',
  setup() {
    const websocketState = inject<WebSocketState>('websocketState')
    const sendMessage = inject<(message: string) => void>('sendMessage')
    const userName = ref<string>('')
    const clientLobbyCode = ref<string>('')
    const invalidName = ref<boolean>(true)
    const invalidLobbyCode = ref<boolean>(true)
    const hostLobbyFailureMessage = ref('')
    const joinLobbyFailureMessage = ref('')

    watch(userName, (newValue) => {
      invalidName.value = newValue.trim() === ''
    })
    watch(clientLobbyCode, (newValue) => {
      clientLobbyCode.value = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
      invalidLobbyCode.value = clientLobbyCode.value.length != 4
    })

    // Websocket stuff?
    if (!websocketState || !sendMessage) {
      throw new Error('WebSocket state or sendMessage function not provided')
    }
    if (websocketState.lobbyCode == 'failed') {
      joinLobbyFailureMessage.value = websocketState.err
    }
    const lobbyCode = computed(() => websocketState.lobbyCode)
    const serverError = computed(() => websocketState.err)
    const isConnected = computed(() => websocketState.isConnected)

    function validateAction(action: 'join' | 'host'): string | undefined {
      let errorMessage: string | undefined = undefined
      if (!websocketState.isConnected) {
        errorMessage = 'Can\'t ${action}, WebSocket is sus!'
      } 
      else if (invalidName == true) { 
        errorMessage = 'Can\'t ${action}, name is sus!'
      }
      else if (invalidLobbyCode == true && action == 'join') {
        errorMessage = 'Can\'t ${action}, lobby code is sus!'
      }
      return errorMessage
    }

    function onClickJoinLobby(): void {
      const errorMessage = validateAction('join')
      if (errorMessage !== undefined) { 
        console.error(errorMessage)
        return 
      }

      const msg = {
        type: 'join_request',
        user_name: userName.value.trim(), // Trim whitespace
        lobby_code: clientLobbyCode.value,
        date: Date.now()
      }
      console.log(clientLobbyCode.value)
      sendMessage(JSON.stringify(msg))
    }

    function onClickHostLobby(): void {
      const errorMessage = validateAction('host')
      if (errorMessage !== undefined) { 
        console.error(errorMessage)
        return 
      }

      const msg = {
        type: 'host_request',
        hoster_name: userName.value.trim(), // Trim whitespace
        date: Date.now()
      }
      sendMessage(JSON.stringify(msg));
    }  

    function onClickBrowseSongs(): void {

    }

    // Track or persist these variables or something
    return {
      userName,
      clientLobbyCode,
      invalidName,
      invalidLobbyCode,
      lobbyCode,
      onClickJoinLobby,
      onClickHostLobby,
      hostLobbyFailureMessage,
      joinLobbyFailureMessage,
      serverError,
      isConnected,
    }
  }
})

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
