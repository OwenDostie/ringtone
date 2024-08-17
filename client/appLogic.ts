
import { ref } from 'vue';
import { reactive, readonly, onMounted, onBeforeUnmount } from 'vue';

export interface WebSocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    lobbyMembers: string[];
    lobbyCode: string | null;
  }
  
  const state = reactive<WebSocketState>({
    socket: null,
    isConnected: false,
    lobbyMembers: [],
    lobbyCode: null,
  });


function connectWebsocket() {
    const wsUri = "ws://127.0.0.1/";

    if (state.socket) {
        console.warn('WebSocket already connected.');
        return;
    }
    const socket = new WebSocket(wsUri);

    socket.onopen = (e) => {
    console.log("CONNECTED");
        state.isConnected = true;
    };

    socket.onclose = (e) => {
    console.log("DISCONNECTED");
    };

    socket.onmessage = (e) => {
    console.log(`RECEIVED: ${e.data}`);

    const message_obj = JSON.parse(e.data);

        // big switch case for handling mesasges from the server
        switch(message_obj.type) {
            case 'lobby_update':
            console.log('got a message for lobby update')
            state.lobbyMembers = message_obj.members;
            state.lobbyCode = message_obj.code;
        }

    };
    socket.onerror = (e) => {
    console.log(`ERROR: ${e.data}`);
    }

    state.socket = socket;
}

function disconnectWebsocket() {
    if (state.socket) {
      state.socket.close();
    }
}

export function sendMessage(message: string) {
    if (state.socket && state.isConnected) {
      state.socket.send(message);
    } else {
      console.warn('Cannot send message: WebSocket is not connected.');
    }
}


export function setupWebsocket() {
    onMounted(() => {
      connectWebsocket();
    });
  
    onBeforeUnmount(() => {
      disconnectWebsocket();
    });
  
    return {
      state: readonly(state),
      sendMessage,
    };
  }
