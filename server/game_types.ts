import { Lobby } from "./lobby_types.ts"
export class Game {
    id: string;
    lobby: Lobby;
    numPlayers: number;
    turn: number;
    relative_directory: string; 
}