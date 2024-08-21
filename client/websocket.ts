
import { useRouter, useRoute } from 'vue-router'; // Import the router function
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
    turnEnded: boolean;
    turnNumber: number;
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
    turnEnded: false,
    turnNumber: 0,
    err: '',
  });

function getSessionData() {
  const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    acc[name] = decodeURIComponent(value);
    return acc;
  }, {});

  console.log("cookies: " + cookies.sessionId + ", " + cookies.lobbyId + ", " + cookies.username);

  return {
    sessionId: cookies.sessionId || null,
    lobbyId: cookies.lobbyId || null,
    username: cookies.username || null,
  };
}

function connectWebsocket() {
    const wsUri = "ws://127.0.0.1/";
    const router = useRouter();
    const route = useRoute();

    if (state.socket) {
        console.warn('WebSocket already connected.');
        return;
    }

    const sessionData = getSessionData();
    const sessionId = sessionData.sessionId;
    console.log("tryna establisdh ws connection with sessin id " + sessionId)
    const socket = new WebSocket(`ws://localhost:80/socket?sessionId=${sessionId}`);

    socket.onopen = (e) => {
      console.log("CONNECTED");
      state.isConnected = true;

      const isOnGameRoute = route.path === '/game';

      if (isOnGameRoute && sessionData.lobbyId && sessionData.username) {
          sendMessage(JSON.stringify({
              type: 'join_request',
              lobby_code: sessionData.lobbyId,
              user_name: sessionData.username,
          }));
      }
    };

    socket.onclose = (e) => {
    console.log("DISCONNECTED");
    };

    socket.onmessage = (e) => {
      console.log(`RECEIVED: ${e.data}`);

      const message_obj = JSON.parse(e.data);

      // big switch case for handling ws mesasges from the server
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

              document.cookie = `lobbyId=${encodeURIComponent(message_obj.code)}; path=/; SameSite=Strict`;
              document.cookie = `username=${encodeURIComponent(message_obj.name)}; path=/; SameSite=Strict`;

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
              state.turnEnded = false;
              state.turnNumber++;
              break;
          }
          case 'game_end': {
              state.turnRunning = false;
              state.turnEnded = true;
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
