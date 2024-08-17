<template>
  <h2>RINGTONE</h2>
  <label for="fname">enter your name:</label>
  <input type="text" id="fname" name="fname"><br><br>
  <label for="lobbyId">enter the lobby id:</label>
  <input type="text" id="lobbyId" name="lobbyId">
  <router-link to=":game">
  <button @click="onClickJoinLobby" type="button">join lobby!</button> <br><br>
  </router-link>
  <router-link to=":game">
  <button @click="onClickHost" type="button">host a lobby!</button> 
  </router-link>
</template>

<script lang="ts">
  import { onClickHost, onClickJoinLobby } from '../appLogic.ts'
  import {defineComponent} from 'vue'

  export default defineComponent({
  name: 'HomePage',
  methods: {
   onClickHost, onClickJoinLobby 
  }
  });
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
