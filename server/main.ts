import { User, Lobby, LobbyList } from "../shared/lobby_types.ts"
import { setCookie, getCookies } from "https://deno.land/std/http/cookie.ts";
import * as uuid from "jsr:@std/uuid";
import { fromFileUrl } from "https://deno.land/std/path/mod.ts"
import { join, extname } from "https://deno.land/std/path/mod.ts"
import { serve } from "https://deno.land/std@0.167.0/http/server.ts"
import { mimeTypes } from "https://deno.land/std@0.167.0/media_types/mod.ts"
import { Storage } from "npm:@google-cloud/storage";
import { ChatMessage } from "../shared/lobby_types.ts"
import moment from "npm:moment";

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
  ".wav": "audio/wav", 
  ".mp3": "audio/mpeg",
};

const staticDir = fromFileUrl(new URL("../dist/", import.meta.url));
const uploadDir = './uploads'; // Directory where files will be uploaded

// Initialize Google Cloud Storage client
const serviceAccountJson = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON");
if (!serviceAccountJson) {
  throw new Error("Google Cloud service account JSON is not set in environment variables");
}
const serviceAccount = JSON.parse(serviceAccountJson);
const storage = new Storage({ credentials: serviceAccount });
const bucket = storage.bucket("ringtone-storage-omar");

let lobby_list: LobbyList = new LobbyList();
let user_sockets = new Map<string, WebSocket | null>();
let user_session_ids = new Map<string, User>();

export async function mkdir_if_ne(directory: string) {
  await Deno.mkdir(directory, { recursive: true }).catch((error) => {
    if (error instanceof Deno.errors.AlreadyExists) {
      console.log("Upload directory already exists")
    } else {
      throw error
    }
  })
}

function setSessionCookie(headers: Headers, sessionId: string, lobbyId?: string, username?: string) {
  setCookie(headers, {
    name: "sessionId",
    value: sessionId,
    secure: true, 
    sameSite: "None",
  });

  if (lobbyId) {
    setCookie(headers, {
      name: "lobbyId",
      value: lobbyId,
      secure: true, 
      sameSite: "None", 
    });
  }
  if (username)  {
    setCookie(headers, {
      name: "username",
      value: username,
      secure: true,
      sameSite: "None", 
    });
  }
}
serve(async (request) => {
  const url = new URL(request.url);
  let pathname = url.pathname;

  const cookies = getCookies(request.headers);
  let sessionId = cookies.sessionId;
  console.log("session id is " + sessionId);
  let user: User;

  if (!sessionId) {
    sessionId = uuid.v1.generate();

    user = new User();
    user.id = sessionId;

    user_sockets.set(user.id, null); 
    user_session_ids.set(user.id, user);

    const headers = new Headers();
    setSessionCookie(headers, sessionId);
    return new Response(null, { status: 200, headers });
  } else {
    if (!user_session_ids.has(sessionId)) {
      user = new User();
      user.id = sessionId;
      user_sockets.set(user.id, null);
      user_session_ids.set(user.id, user);
    } else {
      user = user_session_ids.get(sessionId);
      console.log(`user ${user.name} exists!`);
    }
  }

  if (request.method === "POST" && pathname === "/upload") {
    console.log("got a file");
    // Handle file upload
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (file) {
      // Check if the file is an MP3 or WAV
      const fileName = file.name.toLowerCase();
      const fileType = file.type; // MIME type

      if ((fileName.endsWith('.mp3') && fileType === 'audio/mpeg') || 
          (fileName.endsWith('.wav') && fileType === 'audio/wav')) {
        console.log("file valid");
        console.log(`use ${sessionId} lobby code is ${user?.lobby_code}`);
        const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
        lobby?.submit_file(user, file, user_sockets);
        return new Response("upload success!", { status: 200 });
      } else {
        console.log("Invalid file type. Only MP3 or WAV files are allowed.");
        return new Response("mp3 or wav files only please!", { status: 400 });
      }
    }

    return new Response("no valid file.", { status: 400 });
  }

  else if (request.method === "GET" && pathname.startsWith("/uploads/")) {
    // Serve the audio file from the uploads directory
    const filePath = `.${pathname}`;
    const currentWorkingDirectory = Deno.cwd();
    console.log("Current Working Directory:", currentWorkingDirectory);
    try {
      const file = await Deno.open(filePath, { read: true });
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
  else if (request.method === "GET" && pathname.startsWith("/api/clips")) {
    const url = new URL(request.url);
    const songFolderPath = url.searchParams.get("songFolderPath");
  
    if (!songFolderPath) {
      return new Response(
        JSON.stringify({ error: 'Missing songFolderPath query parameter' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  
    try {
      const files = await getFilesInFolder("saved/" + songFolderPath);
      const clips = files.map(file => ({
        name: file.name,
        url: `https://storage.googleapis.com/${bucket.name}/${file.name}` 
      }));
      const jsonResponse = JSON.stringify(clips);
      return new Response(jsonResponse, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error fetching clips:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch clips' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  else if (pathname === "/api/game-folders") {
    try {
      const folders = await getFoldersInBucket("saved/");
      const jsonResponse = JSON.stringify(folders);
      console.log('Folders response:', jsonResponse);
      return new Response(jsonResponse, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error fetching folders:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch folders' }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  else if (request.method === "GET" && pathname.startsWith("/api/songs")) {
    const url = new URL(request.url);
    const folderPath = url.searchParams.get("folderPath");
  
    if (!folderPath) {
      return new Response(
        JSON.stringify({ error: 'Missing folderPath query parameter' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  
    try {
      const folders = await getFoldersInBucket(`saved/${folderPath}/`);
  
      const jsonResponse = JSON.stringify(folders);
      return new Response(jsonResponse, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error fetching songs:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch songs' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  if (request.method === "POST" && pathname === "/copy-files") {
    console.log("Copy files request received");
    const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
    if (!lobby) {
      return new Response("Lobby not found", { status: 404 });
    }
    
    const players = lobby.user_list.map((u) => u.name).join('_');
    const timestamp = moment().format('YYYYMMDD_HHmmss');
    const destFolder = `uploads/${timestamp}_${players}/`;
    const songFolder = `uploads/${user.lobby_code}/`;

    const files = await getFilesInFolder(songFolder);
    for (const file of files) {
      const destFilePath = `${destFolder}${file.name.split('/').pop()}`;
      await copyFileInBucket(file.name, destFilePath);
    }
    console.log(`Files copied to ${destFolder}`);
    return new Response("Files copied successfully!", { status: 200 });
  }

  // If the request is a websocket upgrade,
  // we need to use the Deno.upgradeWebSocket helper
  else if (request.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(request);

    console.log("establishing ws connection with session id " + sessionId);
    if (!sessionId) {
        console.error("Session ID is missing. Cannot establish WebSocket connection.");
        socket.close();
        return response;
      }

    let user: User;
    if (!user_session_ids.has(sessionId)) {
      user = new User();
      user.id = sessionId;
      user_sockets.set(user.id, null);
      user_session_ids.set(user.id, user);
    } else {
      user = user_session_ids.get(sessionId);
      console.log(`user ${user.name} exists!`);
    }

    socket.onopen = () => {
      console.log("CONNECTED");
      user_sockets.set(user.id, socket);
    };

    socket.onmessage = async (event) => {
      console.log(`RECEIVED: ${event.data}`);
      let message_obj = JSON.parse(event.data);

      console.log("got a message from the client", message_obj);

      // Big switch case for handling different types of messages from the client
      switch (message_obj.type) {
        case 'chat_message': {
          const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
          if (!lobby) {
            console.log(`couldn't find lobby with id ${message_obj.lobby_code}`);
            return;
          }
          const chat_message: ChatMessage = {
            sender: message_obj.message.sender,
            content: message_obj.message.content,
            timestamp: message_obj.message.timestamp,
          };
          chat_message.sender = user.name;
          chat_message.timestamp = moment().format('MMMM Do YYYY, h:mm:ss a'); //override this for now

          lobby.broadcast_chat_message(chat_message, user_sockets);
          break;
        }
        case 'host_request': {
          user.set_name(message_obj.hoster_name);
          const new_lobby = lobby_list.add_lobby(user);

          user.set_lobby_code(new_lobby.code);
          user_session_ids.set(user.id, user);
          const test_user = user_session_ids.get(sessionId);
          console.log(`user ${user.name} with ${sessionId}, ${user.id} lobby code is ${test_user?.lobby_code}`);
          new_lobby.broadcast_lobby_update(user_sockets);
          break;
        }
        case 'join_request': {
          const requested_lobby = lobby_list.get_lobby_with_code(message_obj.lobby_code);
          user.set_name(message_obj.user_name);
          user_session_ids.set(user.id, user);

          if (!requested_lobby) {
            // no such lobby
            console.log(`couldn't find lobby with id ${message_obj.lobby_code}`);
            user.send_failed_lobby_join_message(`couldn't find a lobby with code: ${message_obj.lobby_code}`, user_sockets);
          } else if (requested_lobby.user_list.some(lobby_user => lobby_user.id == user.id)) {
            // id is taken
            user.send_failed_lobby_join_message(`it looks like you're already in lobby ${message_obj.lobby_code}. check your other tabs?`, user_sockets);
          } else if (requested_lobby.user_list.some(lobby_user => lobby_user.name == user.name)) {
            // user name is taken
            user.send_failed_lobby_join_message(`someone in lobby ${message_obj.lobby_code} took the name ${user.name}`, user_sockets);
          } else {
            user.set_lobby_code(message_obj.lobby_code);
            user_session_ids.set(user.id, user);
            const test_user = user_session_ids.get(sessionId);
            console.log(`user ${user.name} with ${sessionId}, ${user.id} lobby code is ${test_user?.lobby_code}`);
            if (!lobby_list.add_user_to_lobby(user, message_obj.lobby_code)) {
              user.send_failed_lobby_join_message(`lobby ${message_obj.lobby_code} is in the middle of a game! .. or something`, user_sockets);
            }

            requested_lobby.broadcast_lobby_update(user_sockets);
          }

          break;
        }
        case 'game_start_request': {
          const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
          if (!lobby) {
            console.log('couldnt start that shit');
            return;
          }
          lobby.broadcast_game_start(false, user_sockets);

          lobby.start_game_turn(user_sockets);
          break;
        }

        case 'new_game_request': {
          const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
          if (!lobby) {
            console.log('couldnt start that shit');
            return;
          }
          lobby.broadcast_game_start(true, user_sockets);

          lobby.restart_game(user_sockets);
          break;
        }
        case 'round_ready': {
          // handle round ready event
          break;
        }
        case 'round_end': {
          // handle round end event
          break;
        }
        case 'save_files': {
          console.log("got save files request")
          const lobby = lobby_list.get_lobby_with_code(user.lobby_code);
          if (!lobby) {
            console.log('No lobby found for user.');
            return;
          }
        
          const playerNames = lobby.user_list.map((user) => user.name);
          await copyGameToSaved(user.lobby_code, playerNames);
          
          socket.send(JSON.stringify({ type: 'files_saved', success: true }));
          break;
        }
      }
    };

    socket.onclose = () => {
      lobby_list.remove_user_from_lobby(user, user.lobby_code, user_sockets);
      user_sockets.delete(user.id);
      console.log("DISCONNECTED");
    };
    socket.onerror = (error) => console.error("ERROR:", error);

    return response;
  } else {
    const url = new URL(request.url, `http://${request.headers.get("host")}`);
    let pathname = url.pathname;

    if (pathname === "/") {
      pathname = "/index.html";
    }

    const filePath = join(staticDir, pathname);

    try {
      const file = await Deno.readFile(filePath);
      const fileExt = extname(filePath);
      const contentType = mimeTypes[fileExt] || "application/octet-stream";

      return new Response(file, {
        status: 200,
        headers: {
          "content-type": contentType,
        },
      });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        try {
          // If the file is not found, serve index.html
          const indexFile = await Deno.readFile(join(staticDir, "index.html"));
          return new Response(indexFile, {
            status: 200,
            headers: {
              "content-type": "text/html",
            },
          });
        } catch (indexError) {
          console.error("Error serving index.html:", indexError);
          return new Response("500 Internal Server Error", { status: 500 });
        }
      } else {
        console.error("Error serving file:", error);
        return new Response("500 Internal Server Error", { status: 500 });
      }
    }
  }
}, { port: 80 });
async function getFoldersInBucket(prefix: string) {
  try {
    const [files] = await bucket.getFiles({ prefix });
    console.log('Retrieved files:', files.map(file => file.name));

    // Determine the folder level based on the prefix length
    const prefixLength = prefix.split('/').length;
    console.log(`prefix length : ${prefixLength}`)

    // Manually extract folder names from file paths
    const folders = new Set<string>();
    files.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length > prefixLength - 1) {
        console.log(`parts  : ${parts}`)
        console.log(`mypart:  : ${parts[prefixLength - 1]}`)
        folders.add(parts[prefixLength - 1]); // Extract folder at the level directly after the prefix
      }
    });

    const extractedFolders = Array.from(folders);

    console.log('Extracted folders:', extractedFolders);
    return extractedFolders;
  } catch (error) {
    console.error('Error getting folders in bucket:', error);
    return [];
  }
}

async function getFilesInFolder(folderPath: string) {
  const [files] = await bucket.getFiles({ prefix: folderPath });
  return files.map(file => ({
    name: file.name,
    url: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
  }));
}
async function copyFileInBucket(sourceFilePath: string, destFilePath: string) {
  const file = bucket.file(sourceFilePath);
  await file.copy(bucket.file(destFilePath));
  console.log(`File copied from ${sourceFilePath} to ${destFilePath}`);
}
async function copyGameToSaved(lobbyCode: string, playerNames: string[]) {
  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const gameFolderName = `${timestamp}_${playerNames.join("_")}`;

  const sourceFolder = `uploads/${lobbyCode}/game/`;
  const targetFolder = `saved/${gameFolderName}/`;

  console.log(`Copying all files from ${sourceFolder} to ${targetFolder}`);

  const [files] = await bucket.getFiles({ prefix: sourceFolder });

  const copyPromises = files.map(async (file) => {
    const targetFileName = file.name.replace(sourceFolder, targetFolder);

    const [copiedFile] = await file.copy(bucket.file(targetFileName));
    console.log(`Copied ${file.name} to ${copiedFile.name}`);
  });

  await Promise.all(copyPromises);
  console.log("All files successfully copied to the saved folder.");
}