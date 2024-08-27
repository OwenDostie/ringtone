import * as uuid from "jsr:@std/uuid";
import { join, extname } from "https://deno.land/std/path/mod.ts"
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { ServerGame } from "./game_types.ts";
import { Storage } from "npm:@google-cloud/storage";

async function getFilesStartingWithNumber(directory: string, number: string): Promise<string[]> {
    const files = [];
    
    for await (const dirEntry of Deno.readDir(directory)) {
      if (dirEntry.isFile && dirEntry.name.startsWith(number)) {
        files.push(dirEntry.name);
      }
    }
  
    return files;
}

async function getAllFiles(directory: string): Promise<string[]> {
    const files = [];
    console.log("checking fi;les in direcotry " + directory)
    
    for await (const dirEntry of Deno.readDir(directory)) {
      if (dirEntry.isFile) {
        files.push(dirEntry.name);
      }
    }
  
    return files;
}

export interface ChatMessage {
    sender: string
    content: string
    timestamp: string 
}

export interface Chat {
    messages: ChatMessage[],
}

export class LobbyList {
    lobby_list: Lobby[];

    constructor() {
        this.lobby_list = [];
    }

    add_lobby(host: User): Lobby {
        let new_lobby_valid = false;
        let new_lobby = new Lobby(host);

        while (!new_lobby_valid) {
            
            // Check the lobby list to make sure the generated code isn't already in use
            new_lobby_valid = true;
            this.lobby_list.forEach((lobby) => {
                if (lobby.code == new_lobby.code) {
                    new_lobby_valid = false;
                }
            })
            
            // Lobby was not valid, code already in use. Make a new one.
            if (!new_lobby_valid) {
                console.log('making a new lobby cuz that one was shit');
                new_lobby = new Lobby(host);
            }
        }

        this.lobby_list.push(new_lobby);

        console.log(`successfully created lobby with code ${new_lobby.code}`);
        return new_lobby;
    }

    add_user_to_lobby(user: User, lobby_code: string): boolean {
        let success = false;
        this.lobby_list.forEach((lobby) => {
            if (lobby.code == lobby_code && 
                !lobby.user_list.some(lobby_user => {user.id == lobby_user.id}) && 
                (!lobby.game.running || lobby.left_user_list.some(left_user => left_user.id == user.id))) {

                lobby.add_user(user);
                console.log(`added user ${user.name} to lobby with code ${lobby.code}`);
                success = true;
            }
        })
        if (!success) {
            console.log(`when adding, culd not find lobby with code ${lobby_code}`);
            return false;
        }
        return true;
    }

    async remove_user_from_lobby(user: User, lobby_code: string, socket_map) {
        let success = false;
    
        this.lobby_list = await Promise.all(this.lobby_list.filter(async (lobby) => {
            if (lobby.code === lobby_code) {
                lobby.remove_user(user, socket_map);
                console.log(`Removed user ${user.name} from lobby with code ${lobby.code}`);
                success = true;
    
                if (lobby.user_list.length === 0) {
                    console.log(`Lobby with code ${lobby.code} is empty and will be removed`);
    
                    try {
                        const [files] = await bucket.getFiles({ prefix: `${lobby.directory}/` });
                        if (files.length > 0) {
                            await Promise.all(files.map(file => file.delete()));
                            console.log(`All files for lobby ${lobby.code} have been deleted from Google Cloud Storage.`);
                        } else {
                            console.warn(`No files found in Google Cloud Storage for lobby ${lobby.code}.`);
                        }
                    } catch (error) {
                        console.error(`Failed to delete files from Google Cloud Storage for lobby ${lobby.code}:`, error);
                    }
    
                    return false; 
                }
            }
            return true; 
        }).map(async promise => await promise));
    
        if (!success) {
            console.log(`When removing, could not find lobby with code ${lobby_code}`);
        }
    }

    get_lobby_with_code(lobby_code: string): Lobby | undefined {
        let ret_val: Lobby | undefined = undefined;
        this.lobby_list.forEach( lobby => {
            console.log(`looking at lobby: ${lobby.code}`);
            if (lobby.code == lobby_code) {
                ret_val = lobby;
            }
        })

        return ret_val;
    }
}

// Initialize Google Cloud Storage client
const serviceAccountJson = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON");
if (!serviceAccountJson) {
throw new Error("Google Cloud service account JSON is not set in environment variables");
}
const serviceAccount = JSON.parse(serviceAccountJson);
const storage = new Storage({ credentials: serviceAccount });
const bucket = storage.bucket("ringtone-storage-omar");

export class Lobby {
    readonly lobbyCodeLength = 4;

    id: string;
    game: ServerGame;
    code: string;
    directory: string;
    host: User;
    user_list: User[];
    left_user_list: User[];

    constructor(host: User) {
        this.host = host;
        this.user_list = [];
        this.left_user_list = [];
        this.add_user(host);
        this.code = this.generateLobbyCode();
        this.directory = `uploads/${this.code}`
        this.game = new ServerGame();
        this.game.set_directory(join(this.directory, 'game'))
    }

    restart_game(socket_map: Map<string, WebSocket | null>) {
         this.game.restart()
         this.start_game_turn(socket_map)
    }

    start_game_turn(socket_map: Map<string, WebSocket | null>, turnLengths?: number[]) {
        if(this.game.turn == 0 && turnLengths && turnLengths.length > 0) {
            // if first time starting game
            this.game.set_turn_lengths(turnLengths)
        } else if (this.game.turn == 0) {
            console.log("setting turn lengths to 5s");
            this.game.set_turn_lengths(new Array(this.user_list.length).fill(8 * 60)) // 8 min default
        }

        this.game.set_num_players(this.user_list.length);
        this.game.start_turn(() => this.broadcast_game_end(socket_map));
    }

    printUsers() {
        console.log(`Users in lobby ${this.code}:`);
        this.user_list.forEach((user, index) => {
            console.log(`${index + 1}. Username: ${user.name}, User ID: ${user.id}`);
        });
    }

    add_user(user: User) {
        let user_returning: boolean = false;

        if (this.user_list.some(lobby_user => {user.id == lobby_user.id})) {
            return;
        }
        this.left_user_list.forEach( left_user => {
            console.log(`user that left: name: ${left_user.name}, id: ${left_user.id}\n user joining: ${user.name} ${user.id}`);
            if (user.id == left_user.id) {

                this.user_list.push(left_user)
                user_returning = true;
            }
        });
        if (!user_returning) {
            this.user_list.push(user);
        }
    }

    remove_user(user_to_remove: User, socket_map) {
        this.user_list = this.user_list.filter(user => user.id !== user_to_remove.id);
        if (this.host == user_to_remove && this.user_list.length > 0) {
            this.host = this.user_list[0];
        }
        console.log("removed " +  user_to_remove.name + " new user list  :")
        this.left_user_list.push(user_to_remove);
        this.printUsers();
        this.broadcast_lobby_update(socket_map)
    }

    broadcast(message: any, socket_map: Map<string, WebSocket | null> ) {
        this.user_list.forEach(user => {
            const socket = socket_map.get(user.id);
            if (socket) {
                console.log(`found a socket for user ${user.name}`);
                socket.send(message);
            }
        })
    }

    broadcast_game_start(new_game: boolean, socket_map: Map<string, WebSocket | null> ) {
        const game_start_message = {
            type: 'game_start',
            new_game: new_game,
        }
        this.broadcast(JSON.stringify(game_start_message), socket_map);
    }

    broadcast_game_end(socket_map: Map<string, WebSocket | null> ) {
        const game_end_message = {
            type: 'game_end',
        }
        this.broadcast(JSON.stringify(game_end_message), socket_map);
    }

    broadcast_chat_message(message: ChatMessage, socket_map: Map<string, WebSocket | null> ) {
        const msg = {
            type: 'chat_update',
            message: message,
            
        }
        this.user_list.forEach(user => {
            const socket = socket_map.get(user.id);
            if (socket) {
                console.log(`broadcasting chat msg ${message.content}`);
                socket.send(JSON.stringify(msg));
            }
        })
    }

    make_lobby_update_message_string(user: User): string {
        const members = this.user_list.map(user => user.name);
        const lobby_update_message = {
            type: 'lobby_update',
            name: user.name,
            members: members,
            code: this.code,
            host: this.host.name,
        }

        console.log("sending lobby update: " + JSON.stringify(lobby_update_message))
        return JSON.stringify(lobby_update_message);
    }

    broadcast_lobby_update(socket_map: Map<string, WebSocket | null>) {
        this.user_list.forEach(user => {
            const socket = socket_map.get(user.id);
            if (socket) {
                console.log(`found a socket for user ${user.name}`);
                socket.send(this.make_lobby_update_message_string(user));
            }
        })
    }

    generateLobbyCode(): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;

        for (let i = 0; i < this.lobbyCodeLength; i++) {
            const randomIndex = Math.floor(Math.random() * charactersLength);
            result += characters[randomIndex];
        }

        console.log(`new lobby code is ${result}`);
        return result;
    }

    print_user_list() {
        for (const user of this.user_list) {
            console.log("name: " + user.name + "\t id: " + user.id + "\n");
        }
    }
    async submit_file(user: User, file: File, socket_map: Map<string, WebSocket | null>) {
        const fileNameArr = file.name.replace(/\s+/g, '').split('.');
        const sanitizedFileName = fileNameArr[0];
        const fileExt = fileNameArr[1];
        let objectKey;
    
        if (this.game.turn == 1) {
            objectKey = `${this.directory}/game/${sanitizedFileName}`;
            this.game.subDirectories.set(user.name, sanitizedFileName);
            console.log(`${user.name} setting subdirectory: ${this.game.subDirectories.get(user.name)}`);
            this.game.turnSequences.set(user.name, []);
        } else {
            objectKey = `${this.directory}/game/${this.game.turnSequences.get(user.name)![this.game.turn - 1]}`;
        }
    
        const fullObjectKey = `${objectKey}/${this.game.turn}_${user.name}.${fileExt}`;
    
        console.log(`Preparing to upload file for user ${user.name}`);
        console.log(`File name: ${file.name}`);
        console.log(`Sanitized file name: ${sanitizedFileName}`);
        console.log(`Full object key: ${fullObjectKey}`);
    
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
    
            const gcFile = bucket.file(fullObjectKey);
    
            // Wrap the upload in a Promise to ensure we wait for the upload to finish
            await new Promise<void>((resolve, reject) => {
                const writeStream = gcFile.createWriteStream({
                    resumable: false,
                    contentType: file.type,
                });
    
                writeStream.on("finish", async () => {
                    console.log(`File uploaded successfully to Google Cloud Storage: ${fullObjectKey}`);
    
                    // Immediately check if the file is available in the bucket
                    try {
                        const [files] = await bucket.getFiles({ prefix: fullObjectKey });
                        if (files.length > 0) {
                            console.log(`Uploaded file found in bucket: ${files[0].name}`);
                        } else {
                            console.error(`Uploaded file not found in bucket for key: ${fullObjectKey}`);
                        }
                    } catch (checkError) {
                        console.error(`Error checking file in bucket after upload: ${checkError}`);
                    }
    
                    resolve(); // Resolve the promise when upload is complete
                });
    
                writeStream.on("error", (err) => {
                    console.error("Error during file upload:", err);
                    reject(err); // Reject the promise if an error occurs
                });
    
                writeStream.end(uint8Array);
            });
    
            this.game.submitted_files.set(user.id, fullObjectKey);
    
            if (this.game.all_users_submitted(this.user_list)) {
                console.log("All users have submitted! Turn: " + this.game.turn);
                if (this.game.turn == this.game.numPlayers) {
                    console.log("Game is over! Broadcasting final files");
                    await this.broadcast_audio_files(socket_map); // Ensure broadcasting happens after upload
                } else {
                    console.log("Passing file to next person");
                    await this.pass_audio_files(socket_map); // Ensure file passing happens after upload
                }
                this.broadcast_game_end(socket_map);
            }
        } catch (error) {
            console.error("Upload failed:", error);
        }
    }
    
    async getAllFilesInSubDirectory(subdirectory: string): Promise<string[]> {
        const files: string[] = [];
        const subdirectoryPath = join(this.game.directory, subdirectory);
        
        for await (const entry of Deno.readDir(subdirectoryPath)) {
            if (entry.isFile) {
                files.push(join(subdirectoryPath, entry.name));
            }
        }
        return files;
    }

    async broadcast_audio_files(socket_map: Map<string, WebSocket | null>) {
        let fileUrls: string[][] = [];
    
        const fileUrlsPromises = Array.from(this.game.subDirectories.values()).map(async (subdirectory) => {
            const folderUrl = `${this.directory}/game/${subdirectory}`;
            console.log(`Looking for files in folder: ${folderUrl}`);
            const [files] = await bucket.getFiles({ prefix: folderUrl });
    
            if (files.length === 0) {
                console.warn(`No files found in folder: ${folderUrl}`);
            } else {
                console.log(`Found files: ${files.map(file => file.name).join(', ')}`);
            }
    
            return files.map(file => `https://storage.googleapis.com/${bucket.name}/${file.name}`);
        });
    
        fileUrls = await Promise.all(fileUrlsPromises);
    
        console.log("Final audio files being sent to client: ", fileUrls);
    
        this.broadcast(JSON.stringify({
            type: 'final_audio_files',
            filenames: fileUrls,
        }), socket_map);
    }
    
    async pass_audio_files(socket_map: Map<string, WebSocket | null>) {
        this.user_list.forEach(async user => {
            const socket = socket_map.get(user.id);
    
            const folderUrl = `${this.directory}/game/${this.game.turnSequences.get(user.name)![this.game.turn]}`;
            console.log(`Looking for files to pass in folder: ${folderUrl}`);
            const [files] = await bucket.getFiles({ prefix: folderUrl });
    
            if (files.length === 0) {
                console.warn(`No files found in folder: ${folderUrl}`);
            } else {
                console.log(`Found files: ${files.map(file => file.name).join(', ')}`);
            }
    
            const message = {
                type: 'audio_files',
                filenames: files.map(file => `https://storage.googleapis.com/${bucket.name}/${file.name}`),
            };
    
            if (socket) {
                console.log(`Sending file URLs to user ${user.name}: ${message.filenames.join(', ')}`);
                socket.send(JSON.stringify(message));
            }
        });
    }
}


export class User {
    name: string;
    id: string;
    lobby_code: string;

    constructor() {
    }

    set_name(name: string) {
        this.name = name;
    }

    set_lobby_code(lobby_code: string) {
        this.lobby_code = lobby_code;
    }

    send_message(message: any, socket_map: Map<string, WebSocket | null> ) {
        const socket = socket_map.get(this.id);
        if (socket) {
            socket.send(message);
        }
    }

    send_failed_lobby_join_message(error_message: string, socket_map: Map<string, WebSocket | null>) {
        const failed_Join_lobby_msg = {
            type: 'failed_join_lobby',
            error_message: error_message
        }

        this.send_message(JSON.stringify(failed_Join_lobby_msg), socket_map);
    }
}