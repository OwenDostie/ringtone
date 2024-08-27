import { Lobby, User } from "./lobby_types.ts"
import { join } from "https://deno.land/std@0.167.0/path/mod.ts";
import { mkdir_if_ne } from "../server/main.ts";
import { Storage } from "npm:@google-cloud/storage";

export interface GameInterface {
    numPlayers: number;
    turn: number;
    turnLengths: number[];
    running: boolean;
    turnRunning: boolean;
}
// Initialize Google Cloud Storage client
const serviceAccountJson = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON");
if (!serviceAccountJson) {
throw new Error("Google Cloud service account JSON is not set in environment variables");
}

const serviceAccount = JSON.parse(serviceAccountJson);
const storage = new Storage({ credentials: serviceAccount });
const bucket = storage.bucket("ringtone-storage-omar");

export class ServerGame implements GameInterface {
    numPlayers: number = 0;
    id: string = '';
    turn: number = 0;
    directory: string = ''; 
    subDirectories: Map<string, string> = new Map<string, string>(); 
    turnLengths: number[] = [];
    running: boolean = false;
    turnRunning: boolean = false;
    submitted_files: Map<string, string> = new Map<string, string>(); 
    turnSequences: Map<string, string[]> = new Map<string, string[]>(); 
 
    set_num_players(numPlayers: number) {
        this.numPlayers = numPlayers
    }

    set_turn_lengths(turnLengths: number[]) {
        this.turnLengths = turnLengths;
    }

    restart() {
        this.turn = 0
    }

    generateTurnSequences(user_list) {
         
        let subDirectories: string[] = [];
        user_list.forEach(user => {
            console.log(user.id +  "user getting subdirectory: " + this.subDirectories.get(user.id))
            subDirectories.push(this.subDirectories.get(user.id)!);
        })
        
        console.log("TURN SEQUENCES:")
        user_list.forEach((user, index) => {
            console.log("user " + user.id)
            for (let turn = 0; turn < this.numPlayers; turn++) {
                this.turnSequences.get(user.id)!.push(subDirectories[(index + turn) % this.numPlayers]);

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
        if (!this.turnRunning) {
            console.log("turn " + this.turn + "is already finished!")
            return;
        }
        this.turnRunning = false;
        console.log("turn " + this.turn + "finished!")
        callback();
    }

    increment_turn() {
        this.turn++;
    }

    set_directory(directory: string) {
        this.directory = directory
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
        console.log("File name sanitized:" + sanitizedFileName + "\n turn:" + this.turn);

        let objectKey;

        if (this.turn == 1) {
            objectKey = `${this.directory}/${sanitizedFileName}`;
            this.subDirectories.set(user.id, sanitizedFileName);
            console.log(user.id + " setting subdirectory: " + this.subDirectories.get(user.id));
            this.turnSequences.set(user.id, []);
        } else {
            objectKey = `${this.directory}/${this.turnSequences.get(user.id)![this.turn - 1]}`;
        }

        const fullObjectKey = `${objectKey}/${this.turn}_${user.id}.${fileExt}`;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            const gcFile = bucket.file(fullObjectKey);
            const writeStream = gcFile.createWriteStream({
                resumable: false,
                contentType: file.type,
            });

            writeStream.on("finish", () => {
                console.log(`File uploaded successfully to Google Cloud Storage: ${fullObjectKey}`);
            });

            writeStream.on("error", (err) => {
                console.error("Error during file upload:", err);
                // Additional error handling logic if needed
            });

            writeStream.end(uint8Array); // End the stream after writing the data

            this.submitted_files.set(user.id, fullObjectKey);
        } catch (error) {
            console.error("Upload failed:", error);
        }
    }
    all_users_submitted(user_list: User[]): boolean {
        let ret_val = user_list.every(user => {
                const user_submitted = this.submitted_files.has(user.id);
                if (user_submitted) console.log(`${user.id} has submitted a file`)
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