import { User, Lobby, LobbyList } from "./types.ts"

let lobby_list: LobbyList = new LobbyList();
let user_sockets = new Map<string, WebSocket>();

Deno.serve({
  port: 80,
  handler: async (request) => {
    // If the request is a websocket upgrade,
    // we need to use the Deno.upgradeWebSocket helper
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);

      let user = new User();

      socket.onopen = () => {
        console.log("CONNECTED");
        user_sockets.set(user.id, socket);
      };

      socket.onmessage = (event) => {
        console.log(`RECEIVED: ${event.data}`);
        const message_obj = JSON.parse(event.data);

        console.log("got a message from the client", message_obj);

        // Big switch case for handling different types of messages from the client
        switch(message_obj.type) {
          case 'host_request': {

            user.set_name(message_obj.hoster_name);
            const new_lobby = lobby_list.add_lobby(user);;

            new_lobby.broadcast_lobby_update(user_sockets);
            break;

          }
          case 'join_request': {

            const requested_lobby = lobby_list.get_lobby_with_code(message_obj.lobby_code);
             
            if (!requested_lobby) {
              console.log(`couldn't find lobby with id ${message_obj.lobby_code}`);
              return;
            }

            user.set_name(message_obj.user_name);
            lobby_list.add_user_to_lobby(user, message_obj.lobby_code);
            
            requested_lobby.broadcast_lobby_update(user_sockets);
            break;
          }
        }
      };

      socket.onclose = () => {
        // Remove user connected to this socket from lobby.
        lobby_list.remove_user_from_lobby(user, user.lobby_code);
        console.log("DISCONNECTED");
      }
      socket.onerror = (error) => console.error("ERROR:", error);

      return response;
    } else {
      // If the request is a normal HTTP request,
      // we serve the client HTML file.
      const file = await Deno.open("./client/index.html", { read: true });
      return new Response(file.readable);
    }

  },
});
