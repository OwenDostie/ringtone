# ringtone

# DOCKER
in project folder run `docker compose up -d` (-d flag is daemon mode)
for logs run `docker compose logs` will show output (only when container is runnning)
to stop run `docker compose down -v` (-v makes sure volumes are also removed)
to restart run `docker compose restart`
to ssh (or run another command) `docker exec -it app /bin/sh` (this goes to the container named app and runs /bin/sh (alpine doesn't have bash)
to list containers `docker compose ps` or `docker ps`, this shows network name etc.
`docker-compose.yml` and `Dockerfile` hold all the config stuff

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

## How to host in google compute
Create a repository in docker hub. There are other ways of registering a container but this is a simple one. It has to be public if it's on docker hub.

Tag image and link to repository name (ours is ringtone)
`docker tag ringtone owendostie/ringtone:latest`

Push image to repository
`docker push owendostie/ringtone:latest`

Create the free-tier google compute instance and link the public url of the docker image. 

Run the VM from the google cloud console, ssh in, and then `deno task start`

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

## owen todo
### docker
- pick a cloud provider/ecosystem
    - google compute engine offers 1 free instance of e2 micro in certain regions / month and 30gb disk 
    - https://cloud.google.com/free/docs/compute-getting-started
- test web server there
- create database/file store locally
    - sync behavior so that files are copied to one of our local machine (incase image dies etc.). We can grab the json metadata also. 
- ffmpeg for client-side audio conversion

### misc 
- unselectable text
- dark mode stuff
- docker

## known bugs
when you join a lobby from the same browser/ new tab, it will show two of the secon'd tabs user 
lobby explodes if the only person in it refreshes
open in incognito is a white screen initially
audio player is working weirdly / not really working on owens' computer 
home screen inputs shake upon first load
no joining when the game is ongoing or that names already in there
shouldn't upload before starting
shouldn't upload multipelt imes

downlad button not showing
check mark appearing after first person uplaods
turn number not increasing after first turn

LOBBY SOMETIMES JUST NOT FOUND??? OR CAM BEING DUMB
DRAG AND DROP

show ready
ding or something when chat comes in
ringtune in top left should bring you to honme page
uploading file starts the timer
refresh first time
turn automatically running
rejoining needs timer update
refreshing makes you rejoin with another self
chat censorshop
can't find lobby

