import { User, Lobby, LobbyList } from "./types.ts"

let lobbie_list: LobbyList = new LobbyList();

Deno.serve({
  port: 80,
  handler: async (request) => {
    // If the request is a websocket upgrade,
    // we need to use the Deno.upgradeWebSocket helper
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);

      socket.onopen = () => {
        console.log("CONNECTED");
      };
      socket.onmessage = (event) => {
        console.log(`RECEIVED: ${event.data}`);
        const message_obj = JSON.parse(event.data);

        console.log("got a message from the client", message_obj);

        // Big switch case for handling different types of messages from the client

        switch(message_obj.type) {

          case 'host_request':
            lobbie_list.add_lobbie(message_obj.hoster_name);
            break;

          case 'join_request':
            lobbie_list.add_user_to_lobbie(new User(message_obj.user_name), message_obj.lobbie_code);
            break;
        }
      };

      socket.onclose = () => console.log("DISCONNECTED");
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
