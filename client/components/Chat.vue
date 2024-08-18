<template>
  <div class="chat-container">
    <div class="chat-history" ref="history">
      <p v-for="(message, index) in messages" :key="index" class="chat-message">{{ formatMessage(message) }}</p>
    </div>
    <input v-model="newMessage" @keyup.enter="sendChat" placeholder="Chat with your team!" />
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import { ChatMessage } from '../../shared/lobby_types';
import { inject } from 'vue';


export default {
  inject: ['websocketState'], // Inject the websocketState
  name: 'Chat',
  setup() {
    const sendMessage = inject<(message: string) => void>('sendMessage');
    if (!sendMessage) {
      throw new Error("no sendmssage");
    }
    return {
      sendMessage
    };
  },
  data() {
    return {
      messages: [] as ChatMessage[],
      newMessage: ''
    };
  },
  mounted() {
    // Listen for messages from the WebSocket and add them to the chat
    this.websocketState.socket.addEventListener('message', this.receiveMessage);
  },
  beforeUnmount() {
    // Clean up the WebSocket event listener
    this.websocketState.socket.removeEventListener('message', this.receiveMessage);
  },
  methods: {
    formatMessage(message: ChatMessage) {
      const time = message.timestamp.toLocaleTimeString('en-US', { hour12: false });
      return `${message.sender} (${time}): ${message.content}`;
    },
    sendChat() {
      if (this.newMessage.trim()) {
        // Send the message through the WebSocket
        const message: ChatMessage = {
          sender: '',  // todo (omar) : add user data state eventually 
          content: this.newMessage,
          timestamp: moment().toDate().toISOString(),
        }

        const msg = {
          type: 'chat_message',
          message: message 
        }
        this.sendMessage(JSON.stringify(msg));

        this.newMessage = '';
        this.scrollToBottom();
      }
    },
    receiveMessage(event) {
      try {
        // Parse the incoming JSON message
        const data = JSON.parse(event.data);

          // Convert the message timestamp to a Date object
        const chatMessage: ChatMessage = {
          sender: data.message.sender,
          content: data.message.content,
          timestamp: new Date(data.message.timestamp) // Convert timestamp to Date
        };


          // Add the received message to the chat history
        this.messages.push(chatMessage);
        this.scrollToBottom;
      }
      catch (error) {
        console.error('Error parsing message:', error);
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        this.$refs.history.scrollTop = this.$refs.history.scrollHeight;
      });
    }
  }
};
</script>

<style scoped>
.chat-message {
  text-align: left; /* Align messages to the left */
  margin: 5px 0;    /* Add some spacing between messages */
}
.chat-container {
  display: flex;
  flex-direction: column;
  height: 200px;
  border: 1px solid #ccc;
  padding: 10px;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding: 5px;
}

input {
  padding: 5px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 3px;
}
</style>