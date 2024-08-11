export class LobbyList {

    lobbie_list: Lobby[];

    constructor() {
        this.lobbie_list = [];
    }

    add_lobbie(host: User) {
        let new_lobbie_valid = false;
        let new_lobbie = new Lobby(host);

        while (!new_lobbie_valid) {
            
            // Check the lobbie list to make sure the generated code isn't already in use
            let new_lobbie_code_valid = true;
            this.lobbie_list.forEach((lobbie) => {
                if (lobbie.code == new_lobbie.code) {
                    new_lobbie_code_valid = false;
                }
            })
            new_lobbie_valid = new_lobbie_code_valid;
            
            // Lobby was not valid, code already in use. Make a new one.
            if (!new_lobbie_valid) {
                new_lobbie = new Lobby(host);
            }
        }

        this.lobbie_list.push(new_lobbie);
        console.log(`successfully created lobbie with code ${new_lobbie.code}`);
    }

    add_user_to_lobbie(user: User, lobbie_code: string) {
        let success = false;
        this.lobbie_list.forEach((lobbie) => {
            if (lobbie.code == lobbie_code) {
                lobbie.add_user(user);
                console.log(`added user ${user.name} to lobbie with code ${lobbie.code}`);
                success = true;
            }
        })
        if (!success) {
            console.log(`culd not find lobbie with code ${lobbie_code}`);
        }
    }
}

export class Lobby {
    readonly lobbieCodeLength = 4;

    id: string;
    code: string;
    host: User;
    user_list: User[];

    constructor(host: User) {
        this.host = host;
        this.user_list = [];
        this.add_user(host);
        this.code = this.generateLobbyCode();
    }

    add_user(user: User) {
        this.user_list.push(user);
    }

    generateLobbyCode(): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;

        for (let i = 0; i < this.lobbieCodeLength; i++) {
            const randomIndex = Math.floor(Math.random() * charactersLength);
            result += characters[randomIndex];
        }

        console.log(`new lobbie code is ${result}`);
        return result;
    }
}

export class User {
    name: string;
    id: string;

    constructor(name: string) {
        this.name = name;
    }
}