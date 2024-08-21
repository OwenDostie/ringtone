<template>
  <div class="app-container">
    <div class="game-container">
      <div :class="{'flash-red': turnEnded && !submittedFile}" class="top-section">
        <h2>GAME TIME</h2>
        <h2> TURN: {{ turnNumber }}/{{ lobbyMembers.length }}</h2>
        <Timer class="timer" :running="turnRunning" @stopTimer="stopTimer"/>
        <div class="lobby-code">
          <h3>Connected to lobby with code: {{ lobbyCode }}</h3>
        </div>
      </div>

      <div class="main-content">
        <div class="chat-container">
          <Chat />
        </div>

        <div class="lobby-container">
          <h3>Lobby Member List</h3>
          <ul>
            <li v-for="member in lobbyMembers" :key="member" class="lobby-member">
              {{ member }}
            </li>
          </ul>
          <div id="audio-files-container">
            <div v-if="audioFile">
              <label>{{ audioFileName }}</label>
              <audio controls :src="audioFile"></audio>
            </div>
          </div>
        </div>

        <div class="userActions">
          <div class="upload-container">
            <input type="file" @change="handleFileUpload" />
            <button @click="uploadFile">Upload File</button>
            <p v-if="uploadMessage">{{ uploadMessage }}</p>
          </div>
          <div class="start-button" v-if="isHost">
            <button @click="onClickStart" type="button">Start game</button><br>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
  import { defineComponent, inject, ref, computed } from 'vue';
  import { WebSocketState } from '../websocket';
  import Timer from './Timer.vue'
  import Chat from './Chat.vue'


  export default defineComponent({
  inject: ['websocketState'], 
  name: 'GamePage',
  components: {
    Timer,
    Chat
  },
  data() {
    return {
      selectedFile: null,
      submittedFile: false,
      uploadMessage: '',
      turnRunning: false,
      isHost: false,
      audioFile: null as string | null,
    };
  },
  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    async uploadFile() {
      if (!this.selectedFile) {
        this.uploadMessage = "Please select a file to upload.";
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          this.uploadMessage = "File uploaded successfully!";
          this.submittedFile = true;
        } else {
          this.uploadMessage = "Failed to upload file.";
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        this.uploadMessage = "An error occurred during file upload.";
      }
    },
    onClickStart(){
      const msg = {
        type: 'game_start_request'
      }
      this.sendMessage(JSON.stringify(msg));

    },
    stopTimer(){
      this.turnRunning = false;
    },
  },
  setup() {
    const websocketState = inject<WebSocketState>('websocketState');
    const sendMessage = inject<(message: string) => void>('sendMessage');

    if (!websocketState || !sendMessage) {
      throw new Error('WebSocket state function not provided');
    }
    console.log('lobbyMembers:', websocketState.lobbyMembers);
    console.log('lobbyCode:', websocketState.lobbyCode);
    const isHost = computed(() => websocketState.lobbyHost == websocketState.name)
    const lobbyMembers = computed(() => websocketState.lobbyMembers)
    const lobbyCode = computed(() => websocketState.lobbyCode)

    const turnRunning = computed(() => websocketState.turnRunning);
    const turnEnded = computed(() => websocketState.turnEnded);
    const turnNumber = computed(() => websocketState.turnNumber);

    return {
      lobbyMembers: lobbyMembers,
      lobbyCode: lobbyCode,
      isHost: isHost,
      turnRunning: turnRunning,
      turnEnded: turnEnded,
      turnNumber: turnNumber,
      sendMessage
    };
  },
  watch: {
    turnEnded(turnNowStarting, turnNowEnding) {
      console.log("watch working" + turnNowEnding)
      if (!turnNowStarting) {
        this.submittedFile = false;
      }
    }
  },
  computed: {
    audioFileName(): string | null {
      return this.audioFile ? this.audioFile.split('/').pop() : null;
    }
  },
  mounted() {
    const socket = this.websocketState.socket;
    socket.addEventListener('message', (event: MessageEvent) => {
      const messageObj = JSON.parse(event.data);

      if (messageObj.type === 'audio_file') {
        this.audioFile = messageObj.filename; 
        console.log("got audio file: " + this.audioFile)
      }
    });
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


.app-container {
  height: 100vh;
  margin: 0;
  overflow: hidden; /* Prevent scrolling */
}

.game-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0; /* Remove default padding */
  box-sizing: border-box;
}

.top-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 5px;
  padding: 5px; /* Small padding for spacing */
}

.lobby-code {
  margin-left: 10px;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 5px;
  padding: 5px; /* Small padding for spacing */
}

.chat-container {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 100px); /* Adjust height to prevent overflow */
  border: 1px solid #ccc;
  border-radius: 5px;
  overflow: hidden;
}

.lobby-container {
  flex: 2;
  padding: 5px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
  text-align: left;
}

.lobby-container h3 {
  margin-bottom: 5px;
}

.lobby-member {
  list-style: none;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.lobby-member:last-child {
  border-bottom: none;
}

.upload-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 5px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  margin-top: 5px;
}

input[type="file"] {
  margin-bottom: 5px;
}
</style>

<style>
/* Global Styles */
html, body {
  height: 100%;
  margin: 0;
  overflow: hidden; /* Prevent scrolling on the page */
  font-family: Arial, sans-serif;
  box-sizing: border-box;
}

body {
  padding: 0;
}

.flash-red {
  animation: flash-red 1s infinite;
}

@keyframes flash-red {
  0% {
    background-color: white;
  }
  50% {
    background-color: red;
  }
  100% {
    background-color: white;
  }
}
</style>