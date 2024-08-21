<template>
  <div class="chat-container">
    <div class="chat-history" ref="history">
      <p v-for="(message, index) in messages" :key="index" class="chat-message">{{ formatMessage(message) }}</p>
    </div>
    <input v-model="newMessage" @keyup.enter="sendChat" :placeholder="chatPlaceholders[Math.floor(Math.random() * chatPlaceholders.length)]"/>
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import { ChatMessage } from '../../shared/lobby_types';
import { inject } from 'vue';


export default {
  inject: ['websocketState'], 
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
      chatPlaceholders: ["i\'m so talented", "let me cook", "it\'s a heater", "this is so fun"],
      newMessage: ''
    };
  },
  mounted() {
    this.websocketState.socket.addEventListener('message', this.receiveMessage);
  },
  beforeUnmount() {
    this.websocketState.socket.removeEventListener('message', this.receiveMessage);
  },
  methods: {
    formatMessage(message: ChatMessage) {
      const time: string = moment(message.timestamp, 'MMMM Do YYYY, h:mm:ss a').format('h:mm:ss a');
      return `${message.sender} (${time}): ${message.content}`;
    },
    sendChat() {
      if (this.newMessage.trim()) {
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
        const data = JSON.parse(event.data);
        if (data.type != 'chat_update') {
          return;
        }

        const chatMessage: ChatMessage = {
          sender: data.message.sender,
          content: data.message.content,
          timestamp: data.message.timestamp,
        };

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
  text-align: left; 
  margin: 5px 0;
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