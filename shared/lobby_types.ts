import * as uuid from "jsr:@std/uuid";
import { ServerGame } from "./game_types.ts";

export interface ChatMessage {
    sender: string
    content: string
    timestamp: Date
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
        this.lobby_list.forEach((lobby) => {
            if (lobby.code == lobby_code) {
                lobby.remove_user(user);
                console.log(`removed user ${user.name} from lobby with code ${lobby.code}`);
                success = true;
            }
        })
        if (!success) {
            console.log(`when removing, culd not find lobby with code ${lobby_code}`);
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
        console.log(`lobbylsit: couldn't find lobby with id ${lobby_code}`);

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
    }

    add_user(user: User) {
        this.user_list.push(user);
    }

    remove_user(user_to_remove: User) {
        this.user_list.filter(user => user.id !== user_to_remove.id);
    }

    broadcast(message: any, socket_map: Map<string, WebSocket> ) {
        this.user_list.forEach(user => {
            const socket = socket_map.get(user.id);
            if (socket) {
                console.log(`found a socket for user ${user.name}`);
                socket.send(message);
            }
        })
    }
    
    broadcast_game_start(socket_map: Map<string, WebSocket> ) {
        const game_start_message = {
            type: 'game_start',
        }
        this.broadcast(JSON.stringify(game_start_message), socket_map);


    }
    
    broadcast_chat_message(message: ChatMessage, socket_map: Map<string, WebSocket> ) {
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

    broadcast_lobby_update(socket_map: Map<string, WebSocket>) {
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
}

export class User {
    name: string;
    id: string;
    lobby_code: string;

    constructor() {
        this.id = uuid.v1.generate();
        // Create UUID for connected socket
    }

    set_name(name: string) {
        this.name = name;
    }

    set_lobby_code(lobby_code: string) {
        this.lobby_code = lobby_code;
    }

    send_message(message: any, socket_map: Map<string, WebSocket> ) {
        const socket = socket_map.get(this.id);
        if (socket) {
            socket.send(message);
        }
    }

    send_failed_lobby_join_message(bad_code: string, socket_map: Map<string, WebSocket>) {
        const failed_Join_lobby_msg = {
            type: 'failed_join_lobby',
            error_message: `Couldn't find a lobby with message ${bad_code}.`
        }

        this.send_message(JSON.stringify(failed_Join_lobby_msg), socket_map);
    }
}