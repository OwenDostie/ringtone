import { ClientGame } from "../shared/game_types.ts";

import { ref, reactive, readonly, onMounted, onBeforeUnmount } from 'vue';

const state = reactive<ClientGame>({
numPlayers: 1,
turn: 0,
turnLengths: [],
});

export { state }

export function startGame(num_players, turnLengths) {
    state.numPlayers = num_players;
    state.turnLengths = turnLengths;
}