<template>
  <div>
    <Navbar :name="user?.name" />
    <b-jumbotron class="text-center w-100" header="Omega Kickers" lead="Created by Minjun Kwak" />
    <div class="d-flex flex-column justify-content-center align-items-center">
      <b-form-group label="Display Name:" label-for="name-input">
        <b-form-input disabled id="name-input" v-model="user.preferred_username"></b-form-input>
      </b-form-group>
      <b-button class="mt-4 w-25" @click="handleCreate($router)">
        Create a game
      </b-button>
      <b-button class="mt-4 w-25" @click="handleJoin()">
        Join a game
      </b-button>
      <b-form-invalid-feedback class="font-weight-bold text-center mt-4" :state="!errorMsg">
        Please login!
      </b-form-invalid-feedback>
      <form method="POST" action="/api/logout" id="logoutForm" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { io } from "socket.io-client"
import Navbar from '../components/Navbar.vue'

const socket = io()
const user = ref({} as any)
let errorMsg = ref(false)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  socket.emit('token', user.value.token)
})

function handleCreate(router: any) {
  if (user.value?.name == null) {
    errorMsg.value = true
    return
  }
  // go to team selection view
  router.push('/team')
}

function handleJoin() {
  if (user.value?.name == null) {
    errorMsg.value = true
    return
  }
  // open up modal for user to type in join code
}



</script>