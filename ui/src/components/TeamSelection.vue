<template>
  <div>
    <Navbar :name="user?.name" />
    <b-jumbotron class="text-center w-100" header="Omega Kickers" lead="Created by Minjun Kwak" />
    <div class="mt-5" v-if="maxPlayers > 0">
      <b-container>
        <b-row class="h5">
          Join Code: {{ joinCode }}
        </b-row>
        <b-row>
          <b-col>
            <TeamColumn :action="handleJoin" :roster="teamOneRoster" :teamNum="1" :maxPlayers="maxPlayers" />
          </b-col>
          <b-col>
            <TeamColumn :action="handleJoin" :roster="teamTwoRoster" :teamNum="2" :maxPlayers="maxPlayers" />
          </b-col>
        </b-row>
        <b-row class="mt-4 d-flex justify-content-center align-items-center">
          <p>Players not joined:</p>
          <ul :style="{ columns: '2' }">
            <li class="mr-4" v-bind:key="i" v-for="player, i in unassignedPlayers">{{ player }}</li>
          </ul>
        </b-row>
        <b-row class="mt-4">
          <b-col cols="2">
            <b-button @click="leaveRoom">Leave Room</b-button>
          </b-col>
          <b-col cols="2"></b-col>
          <b-col cols="4" class="d-flex justify-content-center align-items-center">
            <b-button :disabled="teamOneRoster.length + teamTwoRoster.length < maxPlayers" @click="startGame">Start Game
            </b-button>
          </b-col>
          <b-col cols="4"></b-col>
        </b-row>
      </b-container>
      <form method="POST" action="/api/logout" id="logoutForm" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue'
import Navbar from '../components/Navbar.vue'
import TeamColumn from '../components/TeamColumn.vue'
import { io } from "socket.io-client"
import router from '@/main'

const socket = io()
const user = ref({} as any)
const maxPlayers = ref(0)
let joinCode = ref('')
let unassignedPlayers: Ref<string[]> = ref([])
let teamOneRoster: Ref<string[]> = ref([])
let teamTwoRoster: Ref<string[]> = ref([])

socket.on('updated-teams', (rosterOne: string[], rosterTwo: string[], unassignedRoster: string[]) => {
  teamOneRoster.value = rosterOne
  teamTwoRoster.value = rosterTwo
  unassignedPlayers.value = unassignedRoster
})

socket.on('back-to-home', () => {
  router.push('/')
})

socket.on('go-to-game', () => {
  router.push('/game')
})

socket.on('join-code', (code: string) => {
  joinCode.value = code
})

socket.on('get-max-players-reply', (players: number) => {
  maxPlayers.value = players
})

function leaveRoom() {
  socket.emit('leave-room')
}

function startGame() {
  socket.emit('start-game', user.value.preferred_username)
}

function handleJoin(team: number) {
  const selectedRoster = team == 1 ? teamOneRoster : teamTwoRoster
  const index = unassignedPlayers.value.indexOf(user.value.preferred_username)
  if (index != -1 && selectedRoster.value.length < maxPlayers.value / 2) {
    unassignedPlayers.value.splice(index, 1)
  }
  if (team == 1 && selectedRoster.value.indexOf(user.value.preferred_username) == -1 && selectedRoster.value.length < maxPlayers.value / 2) {
    teamTwoRoster.value = teamTwoRoster.value.filter((player: string) => player !== user.value.preferred_username)
    selectedRoster.value.push(user.value.preferred_username)
    socket.emit('switch-teams', user.value.preferred_username, selectedRoster.value, teamTwoRoster.value, unassignedPlayers.value)
  } else if (team == 2 && selectedRoster.value.indexOf(user.value.preferred_username) == -1 && selectedRoster.value.length < maxPlayers.value / 2) {
    teamOneRoster.value = teamOneRoster.value.filter((player: string) => player !== user.value.preferred_username)
    selectedRoster.value.push(user.value.preferred_username)
    socket.emit('switch-teams', user.value.preferred_username, teamOneRoster.value, selectedRoster.value, unassignedPlayers.value)
  }
}

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  socket.emit('token', user.value.token)
  setTimeout(() => {
    socket.emit('get-max-players')
    socket.emit('updated-team-page', user.value.preferred_username)
  }, 400)
})

</script>