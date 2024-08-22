# ringtone

## get dependencies
install deno

install denon for hot reloading
`deno install -qAf --unstable https://deno.land/x/denon/denon.ts`
## How to run the server
```
deno task start
```

## How to build + run image w/ docker
```
docker build -t ringtone .
docker run --rm -it -p 80:80 ringtone
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
- players have a time bank
- allow host to pick the amount of time

## links
- react - https://react.dev/learn
- cam recommended svg store - https://thenounproject.com/
- deno - https://docs.deno.com/runtime/manual/getting_started/web_frameworks/
- tone.js - https://tonejs.github.io/
- signal (example daw) - https://github.com/ryohey/signal
- vue & deno tutorial https://docs.deno.com/runtime/tutorials/how_to_with_npm/vue/
    - this also says if you run this command you can create a template project with ANY FRONTEND FRAMEOWKR
- do more player orders than just a circle
- docker examples - https://github.com/docker/awesome-compose
```
deno run --allow-read --allow-write --allow-env npm:create-vite-extra@latest
```

## owen todo
### docker
- pick a cloud provider/ecosystem
- test web server there
- create database/file store locally
- ffmpeg for client-side audio conversion


### misc 
- unselectable text
- dark mode stuff
- docker

## known bugs
when you joikjn a lobby from the same browser/ new tab, it will show two of the secon'd tabs user 
lobby explodes if the only person in it refreshes
open in incognito is a white screen initially
audio player is working weirdly / not really working on owens' computer 
home screen inputs shake upon first load
delete uploads when users disconnect
