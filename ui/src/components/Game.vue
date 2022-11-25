<template>
  <div>
    <Navbar :name="user?.name" />
    <b-jumbotron class="text-center w-100" header="Omega Kickers" lead="First to 3 wins!" />
    <div v-if="!showGame">{{ count }}</div>
    <div v-if="showGame" class="d-flex flex-column justify-content-center align-items-center">
      <h3 class="font-weight-bold">Score: {{ team1Score }} - {{ team2Score }}</h3>
      <div class="d-flex flex-row justify-content-center align-items-center">
        <img src="../../img/goal.png" width="75px" height="125px" />
        <div class="position-relative border" id="field" :style="{ width: '65vw', height: '55vh' }">
          <PlayerName :key="i" v-for="player, i in team1" :teamIndex="0" :xPos="team1Pos[i].xPos - 1"
            :yPos="team1Pos[i].yPos - 3" :name="player" :currentPlayer="user.preferred_username" />
          <Player :key="i + team1.length" :id="i" :xPos="team1Pos[i].xPos" :yPos="team1Pos[i].yPos" :teamIndex="0"
            v-for="player, i in team1" />
          <PlayerName :key="i + team1.length + team2.length" v-for="player, i in team2" :teamIndex="1"
            :xPos="team2Pos[i].xPos - 1" :yPos="team2Pos[i].yPos - 3" :name="player"
            :currentPlayer="user.preferred_username" />
          <Player :key="i + team1.length + team2.length * 2" :id="i + (numPlayers / 2)" :xPos="team2Pos[i].xPos"
            :yPos="team2Pos[i].yPos" :teamIndex="1" v-for="player, i in team2" />
          <Ball id="ball" :xPos="ballPos.xPos" :yPos="ballPos.yPos" />
        </div>
        <img src="../../img/goal.png" width="75px" height="125px" />
      </div>
      <b-button class="mt-4" @click="leaveGame">Leave Game</b-button>
    </div>

    <form method="POST" action="/api/logout" id="logoutForm" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue'
import Navbar from '../components/Navbar.vue'
import { io } from "socket.io-client"
import router from '@/main'
import Player from '../components/Player.vue'
import PlayerName from '../components/PlayerName.vue'
import Ball from '../components/Ball.vue'

const socket = io()
const user = ref({} as any)
let config: Ref<{ ballSpeed: number, playerSpeed: number, obstacles: boolean, keepers: boolean }> = ref({} as any)
let count = ref('')
let xPos = ref(0)
let yPos = ref(0)
let team = ref(-1)
let teamIdx = ref(-1)
let team1Score = ref(0)
let team2Score = ref(0)
let showGame = ref(false)
let team1: Ref<string[]> = ref([])
let team2: Ref<string[]> = ref([])
let team1Pos: Ref<{ xPos: number, yPos: number }[]> = ref([])
let team2Pos: Ref<{ xPos: number, yPos: number }[]> = ref([])
let ballPos: Ref<{ xPos: number, yPos: number }> = ref({ xPos: 24, yPos: 30 })
let numPlayers = ref(0)

socket.on('game-config', (gameConfig: { ballSpeed: number, playerSpeed: number, obstacles: boolean, keepers: boolean }) => {
  config.value = gameConfig
})

socket.on('back-to-home', () => {
  router.push('/')
})

socket.on('countdown', (countDown: string) => {
  console.log('countdown', user.value.preferred_username)
  count.value = countDown
  if (countDown === 'Go!') {
    setTimeout(() => {
      showGame.value = true
    }, 1000)
  }
})

socket.on('updated-teams', (updatedTeam1: string[], updatedTeam2: string[]) => {
  team1.value = updatedTeam1
  team2.value = updatedTeam2
})

socket.on('start-position-info', (posObj: { xPos: number, yPos: number }, team1Positions: { xPos: number, yPos: number }[], team2Positions: { xPos: number, yPos: number }[]) => {
  xPos.value = posObj.xPos
  yPos.value = posObj.yPos
  team1Pos.value = team1Positions
  team2Pos.value = team2Positions
})

socket.on('team-info', (teamStr: string, teamOne: string[], teamTwo: string[], num: number) => {
  team.value = teamStr == 'team1Pos' ? 0 : 1
  team1.value = teamOne
  team2.value = teamTwo
  numPlayers.value = num
  teamIdx.value = team.value === 0 ? team1.value.indexOf(user.value.preferred_username) : team2.value.indexOf(user.value.preferred_username)
})

socket.on('updated-player-positions-reply', (team1Positions: { xPos: number, yPos: number }[], team2Positions: { xPos: number, yPos: number }[]) => {
  team1Pos.value = team1Positions
  team2Pos.value = team2Positions
})

function leaveGame() {
  socket.emit('leave-game')
}

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  socket.emit('token', user.value.token)

  setTimeout(() => {
    socket.emit('update-game-start', user.value.preferred_username)
  }, 400)
})

window.addEventListener('keydown', (event) => {
  const teamPosArray = team.value === 0 ? team1Pos.value : team2Pos.value
  if (event.key === 'ArrowLeft') {
    teamPosArray[teamIdx.value].xPos -= config.value.playerSpeed
  } else if (event.key === 'ArrowUp') {
    teamPosArray[teamIdx.value].yPos -= config.value.playerSpeed
  } else if (event.key === 'ArrowRight') {
    teamPosArray[teamIdx.value].xPos += config.value.playerSpeed
  } else if (event.key === 'ArrowDown') {
    teamPosArray[teamIdx.value].yPos += config.value.playerSpeed
  }
  // check collisions here
  // emit event to server which will emit to all clients in the room
  socket.emit('updated-player-positions', team1Pos.value, team2Pos.value)
})
</script>