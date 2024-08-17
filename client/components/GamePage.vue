<template>
  <h2>GamePage</h2>
  <div id="lobbyInfo">
    <h2>connected to lobby with code: </h2>
      <h2 id="lobbyCode"></h2>
      <br>
    <h3>lobby member list</h3><br>
      <ul id="membersList"></ul>
  <div id="output"></div>
  </div>
</template>

<script lang="ts">
  import {defineComponent} from 'vue'

  export default defineComponent({
  name: 'GamePage'
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