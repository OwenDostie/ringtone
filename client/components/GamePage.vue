<template>
  <h2>GAME TIME</h2>
  <div> 
    <Timer :running="turnRunning"/>
  </div>
  <div id="lobbyInfo">
    <h2>connected to lobby with code: {{ lobbyCode }} </h2>
    <h3>lobby member list</h3><br>
      <li v-for="member in lobbyMembers" :key="member">{{ member }}</li>
  </div>
  <div>
    <input type="file" @change="handleFileUpload" />
    <button @click="uploadFile">Upload File</button>
    <p v-if="uploadMessage">{{ uploadMessage }}</p>
  </div>
  <Chat />
</template>

<script lang="ts">
  import { defineComponent, inject, ref } from 'vue';
  import { WebSocketState } from '../websocket';
  import Timer from './Timer.vue'
  import Chat from './Chat.vue'

  const sendMessage = inject<(message: string) => void>('sendMessage');

  export default defineComponent({
  inject: ['websocketState'], // Inject the websocketState
  name: 'GamePage',
  components: {
    Timer,
    Chat
  },
  props: {
    isHost: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      selectedFile: null,
      uploadMessage: '',
      turnRunning: true,
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
        } else {
          this.uploadMessage = "Failed to upload file.";
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        this.uploadMessage = "An error occurred during file upload.";
      }
    },
  },
  setup() {
    const websocketState = inject<WebSocketState>('websocketState');

    if (!websocketState) {
      throw new Error('WebSocket state function not provided');
    }
    console.log('lobbyMembers:', websocketState.lobbyMembers);
    console.log('lobbyCode:', websocketState.lobbyCode);

    return {
      lobbyMembers: websocketState.lobbyMembers,
      lobbyCode: websocketState.lobbyCode,
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