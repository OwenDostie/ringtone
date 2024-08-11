# ringtone

## How to run the server
```
deno run --allow-net=0.0.0.0:80 --allow-read=client/index.html server/main.ts
```

## stack
- runtime - deno
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

## links
- react - https://react.dev/learn
- deno - https://docs.deno.com/runtime/manual/getting_started/web_frameworks/
- tone.js - https://tonejs.github.io/


