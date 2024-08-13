
import { ref } from 'vue';

const websocket = ref<WebSocket | null>(null); // Reactive reference to store the WebSocket instance

export function setup_websocket() {
    const wsUri = "ws://127.0.0.1/";
    websocket.value = new WebSocket(wsUri);

    websocket.value.onopen = (e) => {
    writeToScreen("CONNECTED");
    };

    websocket.value.onclose = (e) => {
    writeToScreen("DISCONNECTED");
    };

    websocket.value.onmessage = (e) => {
    writeToScreen(`RECEIVED: ${e.data}`);

    const message_obj = JSON.parse(e.data);

    // big switch case for handling mesasges from the server
    switch(message_obj.type) {
        case 'lobby_update':
        console.log('got a message for lobby update')
        updateLobbyMemberList(message_obj.members);
        updateLobbyCode(message_obj.code);
    }
    };

    websocket.value.onerror = (e) => {
    writeToScreen(`ERROR: ${e.data}`);
    };
}

function writeToScreen(message) {
    const output = document.querySelector("#output");
    output.insertAdjacentHTML("afterbegin", `<p>${message}</p>`);
}

function updateLobbyMemberList(members) {
    const membersList = document.querySelector("#membersList");
    membersList.innerHTML = '';

    members.forEach(member => {
        const listItem = document.createElement('li');
        listItem.textContent = member;
        membersList.appendChild(listItem);
    });
}

function updateLobbyCode(code) {
    const lobbyCode = document.querySelector("#lobbyCode");
    lobbyCode.innerHTML = code;
}

export function onClickJoinLobby() {
    const msg = {
        type: "join_request",
        user_name: document.getElementById("fname").value,
        lobby_code: document.getElementById("lobbyId").value,
        date: Date.now(),
    }
    writeToScreen(`tryna JOIN UP lobby ${msg.lobby_code}`);
    websocket.value.send(JSON.stringify(msg));
}

export function onClickHost() {
    const msg = {
        type: "host_request",
        hoster_name: document.getElementById("fname").value,
        date: Date.now(),
    }
    writeToScreen(`sent my name to teh server :3}`);
    websocket.value.send(JSON.stringify(msg));
}