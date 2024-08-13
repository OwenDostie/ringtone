import { User, Lobby, LobbyList } from "./lobby_types.ts"
import { fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { join, extname } from "https://deno.land/std/path/mod.ts";

const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const staticDir = fromFileUrl(new URL("../dist/", import.meta.url));

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
          case 'game_start_request': {
          }
          case 'round_ready': {

          }
          case 'round_end': {

          }
        }
      };

      socket.onclose = () => {
        // Remove user connected to this socket from lobby.
        lobby_list.remove_user_from_lobby(user, user.lobby_code);
        // Remove user from the socket map
        user_sockets.delete(user.id);
        console.log("DISCONNECTED");
      }
      socket.onerror = (error) => console.error("ERROR:", error);

      return response;
    } else {
      try {
        // Extract the pathname from the request URL
        const url = new URL(request.url, `http://${request.headers.get("host")}`);
        const urlPath = url.pathname === "/" ? "/index.html" : url.pathname;
        const filePath = join(staticDir, urlPath);
        const fileExt = extname(filePath);
        const contentType = mimeTypes[fileExt] || "application/octet-stream";
    
        const file = await Deno.readFile(filePath);
        return new Response(file, {
          status: 200,
          headers: {
            "content-type": contentType,
          },
        });
      } catch (error) {
        console.error("Error serving file:", error);
        if (error instanceof Deno.errors.NotFound) {
          return new Response("404 Not Found", { status: 404 });
        } else {
          return new Response("500 Internal Server Error", { status: 500 });
        }
      }
    }
  }
},{ port: 80 });