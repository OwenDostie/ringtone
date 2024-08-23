# ringtone
A web-based game for making music *together* (on the internet).

## Setup
- [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) the repository
- [Install Deno](https://docs.deno.com/runtime/manual/getting_started/installation/)
- Install Denon (optional for hot reload) `deno install -qAf --unstable https://deno.land/x/denon/denon.ts`

## Run Server (Locally)
`deno task start`, `deno task dev` or `deno task dev-unix`

These are all some form of alias for `deno run --allow-read --allow-write --allow-env npm:create-vite-extra@latest`, see [deno.json](deno.json) or [denon.json](denon.json) for details.

## Deploy Server
Using [Deno Deploy](https://deno.com/deploy)

# wip stuff

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
- auto splice progression together with good transitions

## links
- react - https://react.dev/learn
- cam recommended svg store - https://thenounproject.com/
- deno - https://docs.deno.com/runtime/manual/getting_started/web_frameworks/
- tone.js - https://tonejs.github.io/
- signal (example daw) - https://github.com/ryohey/signal
- vue & deno tutorial https://docs.deno.com/runtime/tutorials/how_to_with_npm/vue/
    - this also says if you run this command you can create a template project with ANY FRONTEND FRAMEOWKR
- do more player orders than just a circle
```
deno run --allow-read --allow-write --allow-env npm:create-vite-extra@latest
```

## owen todo

### misc 
- unselectable text
- dark mode stuff

## known bugs
when you join a lobby from the same browser/ new tab, it will show two of the secon'd tabs user 
lobby explodes if the only person in it refreshes
open in incognito is a white screen initially
audio player is working weirdly / not really working on owens' computer 
home screen inputs shake upon first load
no joining when the game is ongoing or that names already in there
shouldn't upload before starting
shouldn't upload multipelt imes