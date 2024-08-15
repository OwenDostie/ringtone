<template>
  <div id="app">
    <h2>RINGTONE</h2>
    <label for="fname">enter your name:</label>
    <input type="text" id="fname" name="fname"><br><br>
    <label for="lobbyId">enter the lobby id:</label>
    <input type="text" id="lobbyId" name="lobbyId">
    <button @click="onClickJoinLobby" type="button">join lobby!</button> <br><br>
    <button @click="onClickHost" type="button">host a lobby!</button> 
    <div id="lobbyInfo">
      <h2>connected to lobby with code: </h2>
        <h2 id="lobbyCode"></h2>
        <br>
      <h3>lobby member list</h3><br>
        <ul id="membersList"></ul>
    <div id="output"></div>
    </div>
  </div>
</template>

<script lang="ts">
  import { onClickHost, onClickJoinLobby } from './appLogic.ts'
  import {defineComponent} from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

  export default defineComponent({
  name: 'App',
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
