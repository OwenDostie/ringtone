
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
            console.log(`got a message for lobby update, lobby ocde ${message_obj.code}`)
            state.lobbyMembers.length = 0; // Clear the array while maintaining reactivity
            state.lobbyMembers.push(...message_obj.members); // Push the new members
            state.lobbyCode = ''; // Temporarily set to empty string
            state.lobbyCode = message_obj.code; // Now set to the actual code
            console.log(`lobby asdfkjasd;lkfjcode:${state.lobbyCode}`)
            break;
        }

    };
    socket.onerror = (e) => {
    console.log(`ERROR: ${e.data}`);
    }

    state.socket = socket;
}

export { state };

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
