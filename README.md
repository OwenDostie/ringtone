# ringtone

## How to run the server
```
deno task start
```

## stack
- runtime - deno
- front end: vue
- websocket
- tone.js

## requirements
- cross-platform server setup w/ deno
- single server process handles rooms and active games
- client side lobby ux for room code + username + pick game mode + see other players
- client side midi daw w/ playback, editing, saving
- way of transferring midi files from client to server and vice versa. with maybe project file metadata

## would be nice
- tsl on websocket aka wss
- front-end framework
- embed ai chat bot that makes the song for you
- banned names
- pen testing
- fetch api / axios for client/server communication
- common types between client and server

## links
- react - https://react.dev/learn
- deno - https://docs.deno.com/runtime/manual/getting_started/web_frameworks/
- tone.js - https://tonejs.github.io/
- signal (example daw) - https://github.com/ryohey/signal
- vue & deno tutorial https://docs.deno.com/runtime/tutorials/how_to_with_npm/vue/
    - this also says if you run this command you can create a template project with ANY FRONTEND FRAMEOWKR
```
deno run --allow-read --allow-write --allow-env npm:create-vite-extra@latest
```

## yapping with matt
- sveltekit has a deno adapter. can share types between frontend and backend.
- websocket
- matt would use sveltekit, no experience doing sync state but first guess is websocket. suggested starting with a chat. node is the default runtime that seems to have the fewest problems just because its the default. sveltekit has an adapter so that it can run on any rumtime. there's another one out there called bun which seems to be an improvement. vite comes with sveltekit / is the default. 
