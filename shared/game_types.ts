import { Lobby, User } from "./lobby_types.ts"
import { join } from "https://deno.land/std@0.167.0/path/mod.ts";
import { mkdir_if_ne } from "../server/main.ts";
export interface GameInterface {
    numPlayers: number;
    turn: number;
    turnLengths: number[];
    running: boolean;
    turnRunning: boolean;
}
export class ServerGame implements GameInterface {
    numPlayers: number = 1;
    id: string = '';
    turn: number = 0;
    directory: string = ''; 
    turnLengths: number[] = [];
    running: boolean = false;
    turnRunning: boolean = false;
    submitted_files: Map<string, string[]> = new Map<string, string[]>(); 

    start(){
        if(this.running) {
            console.log('game already running');
            return;
        }

        this.turn++;
        this.running = true;
    }

    set_directory(directory: string) {
        this.directory = directory
        mkdir_if_ne(directory)
    }

    setNumPlayers(num_players: number){
        this.numPlayers = num_players;
    }

    async getAllFiles(): Promise<string[]> {
        const files: string[] = [];
        for await (const entry of Deno.readDir(this.directory)) {
        if (entry.isFile) {
            files.push(entry.name);
        }
        }
        return files;
    }

    // Method to handle a file submission
    async submit_file(user: User, file: File) {
        const sanitizedFileName = file.name.replace(/\s+/g, '');
        const filePath = join(this.directory, sanitizedFileName);
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await Deno.writeFile(filePath, uint8Array);

        if (!this.submitted_files.has(user.id)) {
        this.submitted_files.set(user.id, []);
        }
        this.submitted_files.get(user.id)!.push(filePath);

        // You might want to perform additional actions here, like checking submissions
    }

    // Method to check if all users have submitted a file
    all_users_submitted(user_list: User[]): boolean {
        return user_list.every(user => {
            const files = this.submitted_files.get(user.id);
            const user_submitted = files && files.length > 0;
            console.log(`${user.name} has submitted a file`)
            return user_submitted;
        });
    }
}


export interface ClientGame extends GameInterface {
}

enum GameModes {
    Classic
}