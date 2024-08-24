<template>
  <div class="app-container">
    <div class="game-container">
      <div :class="{'flash-red': timerEnded && !submittedFile}" class="top-section">
        <h2>GAME TIME</h2>
        <h2> TURN: {{ turnNumber }}/{{ lobbyMembers.length }}</h2>
        <Timer class="timer" ref="timerRef" :running="turnRunning" @endTimer="endTimer"/>
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
              <span v-if="submittedFile" class="check-mark">✔️</span>
              <span v-if="isHost" class="crown">👑</span>
            </li>
          </ul>

          <div id="audio-container">
            <div v-if="audioFiles.length > 0">
              <div v-for="file in audioFiles" :key="file" class="audio-file">
                <label>{{ getDirectoryAboveFilename(file) }}</label><br>
                <audio :src="file" controls></audio>
              </div>
            </div>

            <div v-if="finalAudioFiles.length > 0" class="audio-container">
              <div v-for="(finalSong, songIndex) in finalAudioFiles" :key="songIndex" class="audio-file">
                <label>{{ getDirectoryAboveFilename(finalSong[0]) }}</label><br>
                <div v-for="(file, fileIndex) in finalSong" :key="songIndex + '-' + fileIndex" class="audio-file">
                  <audio :src="file" controls></audio>
                  <a :href="file" :download="getFilename(file)" class="download-button">Download</a>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="userActions">
          <div class="upload-container">
            <input type="file" @change="handleFileUpload" />
            <button @click="uploadFile">upload mp3</button>
            <p v-if="uploadMessage">{{ uploadMessage }}</p>
          </div>
          <div class="start-button" v-if="isHost && turnNumber == 0">
            <button @click="onClickStart" type="button">start game</button><br>
          </div>
          <div class="start-button" v-if="isHost && turnNumber != 0 && turnNumber < lobbyMembers.length && turnEnded">
            <button @click="onClickStart" type="button">start turn {{ turnNumber + 1 }}</button><br>
          </div>
          <div class="start-button" v-if="isHost && turnNumber >= lobbyMembers.length && turnEnded">
            <button @click="onClickNewGame" type="button">new game</button><br>
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
      timerEnded: false,
      isHost: false,
      audioFiles: [] as string[],
    };
  },
  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    async uploadFile() {
      if (!this.selectedFile ) {
        this.uploadMessage = "please select a file!";
        return;
      } else if (!this.turnRunning && !this.turnEnded) {
        this.uploadMessage = "watchu uploading for boi?";
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
          this.uploadMessage = "file uploaded successfully!";
          this.submittedFile = true;
        } else {
          const errorMessage = await response.text();
          this.uploadMessage = errorMessage;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        this.uploadMessage = "an error occurred during file upload.";
      }
    },
    onClickStart(){
      const msg = {
        type: 'game_start_request'
      }
      this.sendMessage(JSON.stringify(msg));
    },
    onClickNewGame() {
      const msg = {
        type: 'new_game_request'
      }
      this.sendMessage(JSON.stringify(msg));
    },
    endTimer(){
      this.timerEnded = true;
      this.turnRunning = false;
    },
    getDirectoryAboveFilename(filePath: string) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      return parts.length > 1 ? parts[parts.length - 2] : '';
    },
    getFilename(filePath: string) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');
      return parts.length > 1 ? parts[parts.length - 1] : '';
    }
  },
  setup() {
    const websocketState = inject<WebSocketState>('websocketState');
    const sendMessage = inject<(message: string) => void>('sendMessage');

    if (!websocketState || !sendMessage) {
      throw new Error('WebSocket state function not provided');
    }

    const isHost = computed(() => websocketState.lobbyHost === websocketState.name);
    const lobbyMembers = computed(() => websocketState.lobbyMembers);
    const lobbyCode = computed(() => websocketState.lobbyCode);
    const turnRunning = computed(() => websocketState.turnRunning);
    const turnEnded = computed(() => websocketState.turnEnded);
    const turnNumber = computed(() => websocketState.turnNumber);

    const audioFiles = ref<string[]>([]);
    const timerRef = ref(null);

    const finalAudioFiles = ref<string[][]>([]);

    // Establish WebSocket connection and event listener
    const socket = websocketState.socket;

    if (!socket ) {
      throw new Error('socket not provided');
    }

    socket.addEventListener('message', (event: MessageEvent) => {
    const messageObj = JSON.parse(event.data);

    if (messageObj.type === 'audio_files' && Array.isArray(messageObj.filenames)) {
        console.log("Received audio files from server:", messageObj.filenames);
        audioFiles.value = messageObj.filenames;
        finalAudioFiles.value = [];
    }

    if (messageObj.type === 'final_audio_files' && Array.isArray(messageObj.filenames)) {
        console.log("Received final audio files from server:", messageObj.filenames);
        audioFiles.value = [];
        finalAudioFiles.value = messageObj.filenames.filter(fileArray => Array.isArray(fileArray) && fileArray.length > 0);
    }
});

    return {
      timerRef,
      audioFiles,
      finalAudioFiles,
      lobbyMembers,
      lobbyCode,
      isHost,
      turnRunning,
      turnEnded,
      turnNumber,
      sendMessage
    };
  },
  watch: {
    turnEnded(turnNowEnding, turnNowStarting) {
      console.log("watch working" + turnNowEnding)
      if (turnNowEnding) {
        this.submittedFile = false;
        this.timerEnded = false;
      }
      if (turnNowEnding) {
        if (this.timerRef.value) {
          this.timerRef.value.stop(); // Call the stop method on the Timer component
        }
      }
    }
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.check-mark, .crown {
  margin-left: 10px;
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
.audio-container {
  max-height: 400px; /* Set a maximum height for the container */
  overflow-y: auto;  /* Enable vertical scrolling if content overflows */
  border: 1px solid #ccc; /* Optional: Add a border for better visual separation */
  padding: 10px; /* Optional: Add some padding for spacing */
}

.audio-file {
  margin-bottom: 15px; /* Add some space between audio files */
  display: flex;
  align-items: center;
}

label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.download-button {
  margin-left: 10px; /* Space between audio player and download button */
  text-decoration: none;
  color: #007bff;
  font-size: 14px;
}

.download-button:hover {
  text-decoration: underline;
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