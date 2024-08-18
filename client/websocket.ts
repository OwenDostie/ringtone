
import { useRouter } from 'vue-router'; // Import the router function
import { ref, reactive, readonly, onMounted, onBeforeUnmount } from 'vue';

export interface WebSocketState {
    socket: WebSocket | null;
    name: string;
    isConnected: boolean;
    lobbyMembers: string[];
    lobbyCode: string | null;
    lobbyHost: string | null;
    turn: number;
    turnRunning: boolean;
    err: string;
  }
  
  const state = reactive<WebSocketState>({
    socket: null,
    name: 'missingno',
    isConnected: false,
    lobbyMembers: [],
    lobbyCode: null,
    lobbyHost: null,
    turn: 0,
    turnRunning: false,
    err: '',
  });

function connectWebsocket() {
    const wsUri = "ws://127.0.0.1/";
    const router = useRouter(); // Access the router instance

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
            case 'lobby_update': {
                console.log(`got a message for lobby update, lobby ocde ${message_obj.code}`)
                state.lobbyMembers.length = 0; 
                state.lobbyMembers.push(...message_obj.members); 
                state.lobbyCode = ''; 
                state.lobbyCode = message_obj.code; 
                state.lobbyHost = ''; 
                state.lobbyHost = message_obj.host
                state.name = message_obj.name;
                router.push('/game'); 
                break;
            }
            case 'failed_join_lobby': {
                state.lobbyCode = 'failed'
                state.err = message_obj.error_message
                break;
            }
            case 'game_start': {
                if (state.turnRunning) {
                  console.log("this shouldn't happen")
                  state.turnRunning = false;
                }
                console.log("tryan start game");
                state.turnRunning = true;
                break;
            }
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
