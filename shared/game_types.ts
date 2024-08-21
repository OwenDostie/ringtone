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
    subDirectories: Map<string, string> = new Map<string, string>(); 
    turnLengths: number[] = [];
    running: boolean = false;
    turnRunning: boolean = false;
    submitted_files: Map<string, string[]> = new Map<string, string[]>(); 
    turnSequences: Map<string, string[]> = new Map<string, string[]>(); 
     
    set_num_players(numPlayers: number) {
        this.numPlayers = numPlayers
    }

    set_turn_lengths(turnLengths: number[]) {
        this.turnLengths = turnLengths;
    }

    generateTurnSequences(user_list) {
         
        let subDirectories: string[] = [];
        user_list.forEach(user => {
            console.log(user.name +  "user getting subdirectory: " + this.subDirectories.get(user.name))
            subDirectories.push(this.subDirectories.get(user.name)!);
        })
        
        console.log("TURN SEQUENCES:")
        user_list.forEach((user, index) => {
            console.log("user " + user.name)
            for (let turn = 0; turn < this.numPlayers; turn++) {
                this.turnSequences.get(user.name)!.push(subDirectories[(index + turn) % this.numPlayers]);

                console.log("turn " + (turn + 1) + " subdirectory: " + subDirectories[(index + turn) % this.numPlayers]);
            }
            console.log("\n")
        });
    }

    start_turn(callback: ()=> void) {
        this.turn++;
        this.running = true;
        console.log("turn " + this.turn +"starting! waiting " + this.turnLengths[this.turn - 1] + " ms")

        setTimeout(() => this.finish_turn(callback), this.turnLengths[this.turn - 1] * 1000)
    }

    finish_turn(callback: () => void) {
        this.turnRunning = false;
        console.log("turn " + this.turn + "finished!")
        callback();
    }

    increment_turn() {
        this.turn++;
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

    async submit_file(user: User, file: File) {
        const fileNameArr = file.name.replace(/\s+/g, '').split('.');
        const sanitizedFileName = fileNameArr[0];
        const fileExt = fileNameArr[1];
        console.log("file name santiized:" + sanitizedFileName)
        let filePath;

        if (this.turn = 1) {
            filePath = join(this.directory, sanitizedFileName)
            // the order that you submit files will determine the order of passing songs here
            this.subDirectories.set(user.name, sanitizedFileName)
            console.log(user.name + "setting subdirectory: " + this.subDirectories.get(user.name) )
            this.turnSequences.set(user.name, []);
            mkdir_if_ne(this.directory + sanitizedFileName) 
        } else {
            filePath = join(this.directory, this.turnSequences.get(user.name)![this.turn - 1]);
        }
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await Deno.writeFile(filePath + '/' + String(this.turn) + user.name + '.' + fileExt, uint8Array);
        this.submitted_files.set(user.id, this.turnSequences[this.turn - 1]);
    }

    all_users_submitted(user_list: User[]): boolean {
        let ret_val = user_list.every(user => {
                const user_submitted = this.submitted_files.has(user.id);
                if (user_submitted) console.log(`${user.name} has submitted a file`)
                return user_submitted;
        });
        if (ret_val && this.turn == 1) {
            this.generateTurnSequences(user_list);
        }

        if (ret_val) {
            this.submitted_files.clear();
        }

        return ret_val
    }
}


export interface ClientGame extends GameInterface {
}

enum GameModes {
    Classic
}