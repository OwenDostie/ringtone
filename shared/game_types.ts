import { Lobby } from "./lobby_types.ts"
export interface GameInterface {
    numPlayers: number;
    turn: number;
    turnLengths: number[];
    running: boolean;
}
export class ServerGame implements GameInterface {
    numPlayers: number = 1;
    id: string = '';
    turn: number = 0;
    relative_directory: string = ''; 
    turnLengths: number[] = [];
    running: boolean = false;

    start(){
        if(this.running) {
            console.log('game already running');
            return;
        }

        this.turn++;
        this.running = true;
    }

    setNumPlayers(num_players: number){
        this.numPlayers = num_players;
    }

}

export interface ClientGame extends GameInterface {
}

enum GameModes {
    Classic
}