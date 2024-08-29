
import { useRouter, useRoute } from 'vue-router'; // Import the router function
import { ref, reactive, readonly, onMounted, onBeforeUnmount } from 'vue';
import { UserInterface } from '../shared/lobby_types';

export interface WebSocketState {
    socket: WebSocket | null;
    name: string;
    isConnected: boolean;
    lobbyMembers: UserInterface[];
    lobbyCode: string | null;
    lobbyHost: string | null;
    turnRunning: boolean;
    turnEnded: boolean;
    timerEnded: boolean;
    turnNumber: number;
    turnLength: number;
    err: string;
  }
  
  const state = reactive<WebSocketState>({
    socket: null,
    name: 'missingno',
    isConnected: false,
    lobbyMembers: [],
    lobbyCode: null,
    lobbyHost: null,
    turnRunning: false,
    turnEnded: false,
    timerEnded: false,
    turnNumber: 0,
    turnLength: 0,
    err: '',
  });

  export function resetWebsocketState() {
    state.lobbyMembers = [];
    state.lobbyCode = null;
    state.lobbyHost = null;
    state.turnRunning= false;
    state.turnEnded= false;
    state.timerEnded= false;
    state.turnNumber = 0;
    state.turnLength= 0;
    state.err= ''
  }

  function getSessionData() {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [name, value] = cookie.split('=');
      
      // Ensure both name and value are present
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      
      return acc;
    }, {});
  
    console.log("All cookies:", cookies);
    console.log("Session ID:", cookies.sessionId);
    console.log("Lobby ID:", cookies.lobbyId);
    console.log("Username:", cookies.username);

    if (!cookies.sessionId){
      document.cookie = "testCookie=testValue; path=/";
      console.log("test cookie: " + document.cookie); // Check if this logs the correct cookie
    }
  
    return {
      sessionId: cookies.sessionId || null,
      lobbyId: cookies.lobbyId || null,
      username: cookies.username || null,
    };
  }

function connectWebsocket() {
  const router = useRouter();
  const route = useRoute();

  if (state.socket) {
      console.warn('WebSocket already connected.');
      return;
  }


const maxRetries = 5;  // Maximum number of retry attempts
let retryCount = 0;
function attemptConnection() {

    const sessionData = getSessionData();

    if (!sessionData.sessionId) {
        if (retryCount < maxRetries) {
            console.warn(`Session ID is missing. Retrying... (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            setTimeout(attemptConnection, 1000);  // Retry after 1 second
        } else {
            console.error("Session ID is missing after multiple attempts. Cannot establish WebSocket connection.");
            return;
        }
    } else {
        console.log("Session ID retrieved. Establishing WebSocket connection...");

        const sessionId = sessionData.sessionId;
        console.log("Trying to establish WebSocket connection with session ID " + sessionId);

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const wsUri = `${protocol}://${hostname}${port}/socket?sessionId=${sessionId}`;
        console.log("WebSocket URI: " + wsUri);

        const socket = new WebSocket(wsUri);

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

            switch(message_obj.type) {
                case 'lobby_update': {
                    console.log(`Got a message for lobby update, lobby code ${message_obj.code}`);
                    state.lobbyMembers.length = 0; 
                    state.lobbyMembers.push(...message_obj.members); 
                    state.lobbyCode = message_obj.code; 
                    state.lobbyHost = message_obj.host;
                    state.name = message_obj.name;
                    if (!state.turnRunning) {
                      state.turnLength = message_obj.turn_length
                    }
                    state.turnRunning = message_obj.turnRunning
                    state.turnNumber = message_obj.turn_number

                    document.cookie = `lobbyId=${encodeURIComponent(message_obj.code)}; path=/; SameSite=Strict`;
                    document.cookie = `username=${encodeURIComponent(message_obj.name)}; path=/; SameSite=Strict`;

                    router.push('/game'); 
                    break;
                }
                case 'failed_join_lobby': {
                    state.lobbyCode = 'failed';
                    state.err = message_obj.error_message;
                    break;
                }
                case 'game_start': {
                    if (state.turnRunning) {
                        console.log("This shouldn't happen");
                        state.turnRunning = false;
                    }
                    console.log("Trying to start game");
                    state.turnRunning = true;
                    state.turnEnded = false;
                    state.turnLength = message_obj.start_time
                    if (!message_obj.new_game) {
                        state.turnNumber++;
                    } else {
                        state.turnNumber = 1;
                    }
                    break;
                }
                case 'game_end': {
                    state.turnRunning = false;
                    state.turnEnded = true;
                    break;
                }
            }
        };

        socket.onerror = (e) => {
            console.log(`ERROR: ${e.data}`);
        };

        state.socket = socket;
    }
  }

  attemptConnection();
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
      resetWebsocketState,
    };
  }
