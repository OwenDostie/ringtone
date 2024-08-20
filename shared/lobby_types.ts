import * as uuid from "jsr:@std/uuid";
import { ServerGame } from "./game_types.ts";

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

    add_user_to_lobby(user: User, lobby_code: string) {
        let success = false;
        this.lobby_list.forEach((lobby) => {
            if (lobby.code == lobby_code) {
                lobby.add_user(user);
                console.log(`added user ${user.name} to lobby with code ${lobby.code}`);
                success = true;
            }
        })
        if (!success) {
            console.log(`when adding, culd not find lobby with code ${lobby_code}`);
        }
    }

    remove_user_from_lobby(user: User, lobby_code: string) {
        let success = false;
    
        this.lobby_list = this.lobby_list.filter((lobby) => {
            if (lobby.code === lobby_code) {
                lobby.remove_user(user);
                console.log(`removed user ${user.name} from lobby with code ${lobby.code}`);
                success = true;
    
                if (lobby.user_list.length === 0) {
                    console.log(`lobby with code ${lobby.code} is empty and will be removed`);
                    return false; // Remove the lobby from the list
                }
            }
            return true; // Keep the lobby in the list
        });
    
        if (!success) {
            console.log(`when removing, could not find lobby with code ${lobby_code}`);
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

export class Lobby {
    readonly lobbyCodeLength = 4;

    id: string;
    game: ServerGame;
    code: string;
    host: User;
    user_list: User[];

    constructor(host: User) {
        this.host = host;
        this.user_list = [];
        this.add_user(host);
        this.code = this.generateLobbyCode();
        this.game = new ServerGame();
        this.game.set_directory(`./uploads/${this.code}/game/`)
    }

    printUsers() {
        console.log(`Users in lobby ${this.code}:`);
        this.user_list.forEach((user, index) => {
            console.log(`${index + 1}. Username: ${user.name}, User ID: ${user.id}`);
        });
    }

    add_user(user: User) {
        this.user_list.push(user);
    }

    remove_user(user_to_remove: User) {
        this.user_list = this.user_list.filter(user => user.id !== user_to_remove.id);
        console.log("removed " +  user_to_remove.name + " new user list  :")
        this.printUsers();
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
    
    broadcast_game_start(socket_map: Map<string, WebSocket | null> ) {
        const game_start_message = {
            type: 'game_start',
        }
        this.broadcast(JSON.stringify(game_start_message), socket_map);
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
        await this.game.submit_file(user, file);

        if (this.game.all_users_submitted(this.user_list)) {
            console.log("all users have submitted!");
            this.broadcast_audio_files(socket_map);
        }
    }

    async broadcast_audio_files(socket_map: Map<string, WebSocket | null>) {
        const allFiles = await this.game.getAllFiles();
        const fileUrls = allFiles.map(file => this.game.directory + file);

        this.broadcast(JSON.stringify({
        type: 'audio_files',
        files: fileUrls,
        }), socket_map);
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

    send_failed_lobby_join_message(bad_code: string, socket_map: Map<string, WebSocket | null>) {
        const failed_Join_lobby_msg = {
            type: 'failed_join_lobby',
            error_message: `Couldn't find a lobby with message ${bad_code}.`
        }

        this.send_message(JSON.stringify(failed_Join_lobby_msg), socket_map);
    }
}