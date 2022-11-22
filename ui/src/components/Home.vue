<template>
  <div>
    <Navbar :name="user?.name" />
    <b-jumbotron class="text-center w-100" header="Omega Kickers" lead="Created by Minjun Kwak" />
    <div class="d-flex flex-column justify-content-center align-items-center">
      <b-form-group label="Display Name:" label-for="name-input">
        <b-form-input disabled id="name-input" v-model="user.preferred_username"></b-form-input>
      </b-form-group>
      <b-button class="mt-4 w-25" @click="handleCreate()">
        Create a game
      </b-button>
      <b-button class="mt-4 w-25" @click="handleJoin($bvModal)">
        Join a game
      </b-button>
      <b-modal id="join-code-modal" title="Enter Join Code" @ok="goToTeamPage()">
        <b-form-input v-model="joinCode" placeholder="Code"></b-form-input>
      </b-modal>
      <b-form-invalid-feedback class="font-weight-bold text-center mt-4" :state="!showError">
        {{ errorMsg }}
      </b-form-invalid-feedback>
      <form method="POST" action="/api/logout" id="logoutForm" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { io } from "socket.io-client"
import Navbar from '../components/Navbar.vue'
import router from '@/main'

const socket = io()
const user = ref({} as any)
const loginErrorMsg = 'Please login!'
const invalidCodeErrorMsg = 'Invalid join code!'
const duplicateUserErrorMsg = 'User is already in group!'
const fullErrorMsg = 'Group is full!'
let errorMsg = ref('')
let showError = ref(false)
const joinCode = ref('')

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  socket.emit('token', user.value.token)
})

function handleCreate() {
  if (user.value?.name == null) {
    showError.value = true
    errorMsg.value = loginErrorMsg
    return
  }
  // go to team selection view
  socket.emit('create', user.value.preferred_username)
  router.push('/team')
}

function handleJoin(modal: any) {
  if (user.value?.name == null) {
    showError.value = true
    errorMsg.value = loginErrorMsg
    return
  }
  // open up modal for user to type in join code
  modal.show('join-code-modal')
}

function goToTeamPage() {
  socket.emit('join', user.value.preferred_username, joinCode.value)
  socket.on('join-reply', (result: { full: boolean, duplicateUser: boolean, joined: boolean }) => {
    if (result.joined) {
      router.push('/team')
    } else {
      showError.value = true
      if (result.full) {
        errorMsg.value = fullErrorMsg
      } else if (result.duplicateUser) {
        errorMsg.value = duplicateUserErrorMsg
      } else {
        errorMsg.value = invalidCodeErrorMsg
      }
    }
  })

}

</script>