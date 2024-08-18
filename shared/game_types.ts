import { Lobby } from "./lobby_types.ts"
export interface GameInterface {
    numPlayers: number;
    turn: number;
    turnLengths: number[];
}


export interface ServerGame extends GameInterface {
    lobby: Lobby;
    id: string;
    relative_directory: string; 
}

export interface ClientGame extends GameInterface {
}


enum GameModes {
    Classic
}