import { User, Lobby, LobbyList } from "../shared/lobby_types.ts"
import { fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { join, extname } from "https://deno.land/std/path/mod.ts";
import { serve } from "https://deno.land/std@0.167.0/http/server.ts";
import { mimeTypes } from "https://deno.land/std@0.167.0/media_types/mod.ts";

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
const uploadDir = './uploads'; // Directory where files will be uploaded

let lobby_list: LobbyList = new LobbyList();
let user_sockets = new Map<string, WebSocket>();

console.log("fuck");

await Deno.mkdir(uploadDir, { recursive: true }).catch((error) => {
  if (error instanceof Deno.errors.AlreadyExists) {
    console.log("Upload directory already exists");
  } else {
    throw error;
  }
});

serve(async (request) => {
  const url = new URL(request.url); 
  const pathname = url.pathname;     
  if (request.method === "POST" && pathname === "/upload") {
    console.log("got a file");
    // Handle file upload
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (file) {
      console.log("file valid");
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await Deno.writeFile(`./uploads/${file.name}`, uint8Array);
      return new Response("File uploaded successfully", { status: 200 });
    }

    return new Response("No file uploaded", { status: 400 });
  }
  else if (request.method === "GET" && pathname.startsWith("/uploads/")) {
    // Serve the audio file from the uploads directory
    const filePath = `.${pathname}`;
    try {
      const file = await Deno.open(filePath, {read: true});
      const fileExt = extname(filePath);
      const contentType = mimeTypes[fileExt] || "application/octet-stream";

      const headers = new Headers();
      headers.set("content-type", contentType);
      headers.set("cache-control", "public, max-age=31536000"); // Cache for 1 year
      return new Response(file.readable, {
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

  // If the request is a websocket upgrade,
  // we need to use the Deno.upgradeWebSocket helper
  else if (request.headers.get("upgrade") === "websocket") {
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
        case 'chat_message': {
          const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
          if (!lobby) {
            console.log(`couldn't find lobby with id ${message_obj.lobby_code}`);
            return;
          }
          message_obj.sender = user.name;
          message_obj.timestamp = Date.now().toString(); //override this for now

          lobby.broadcast_chat_message(message_obj.message, user_sockets)
          break;
        }
        case 'host_request': {

          user.set_name(message_obj.hoster_name);
          const new_lobby = lobby_list.add_lobby(user);

          user.set_lobby_code(new_lobby.code);
          new_lobby.broadcast_lobby_update(user_sockets);
          break;

        }
        case 'join_request': {
          const requested_lobby = lobby_list.get_lobby_with_code(message_obj.lobby_code);
          
          if (!requested_lobby) {
            console.log(`couldn't find lobby with id ${message_obj.lobby_code}`);
            user.send_failed_lobby_join_message(message_obj.lobby_code, user_sockets);
            return;
          }

          user.set_name(message_obj.user_name);
          user.set_lobby_code(message_obj.lobby_code);
          lobby_list.add_user_to_lobby(user, message_obj.lobby_code);
          
          requested_lobby.broadcast_lobby_update(user_sockets);
          break;
        }
        case 'game_start_request': {
          const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
          if (!lobby) {
            console.log('couldnt start that shit');
            return;
          }
          lobby.game.start();
          lobby.broadcast_game_start(user_sockets);
        }
        case 'round_ready': {

        }
        case 'round_end': {

        }
      }
    };

    socket.onclose = () => {
      lobby_list.remove_user_from_lobby(user, user.lobby_code);
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
}, { port: 80 });