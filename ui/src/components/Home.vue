<template>
  <div>
    <b-navbar>
      <b-navbar-nav>
        <b-nav-item v-if="user?.name == null" href="/api/login">Login</b-nav-item>
        <b-nav-item v-if="user?.name" @click="logout">Logout</b-nav-item>
      </b-navbar-nav>
    </b-navbar>
    <b-jumbotron class="text-center w-100" header="Omega Kickers" lead="Created by Minjun Kwak" />
    <div class="d-flex flex-column justify-content-center align-items-center">
      <b-form-group label="Display Name:" label-for="name-input">
        <b-form-input disabled id="name-input" v-model="user.preferred_username"></b-form-input>
      </b-form-group>
      <b-button class="mt-4 w-25" @click="handleCreate()">
        Create a game
      </b-button>
      <b-button class="mt-4 w-25" @click="handleJoin()">
        Join a game
      </b-button>
      <b-form-invalid-feedback class="font-weight-bold text-center mt-4" :state="!errorMsg">Please login!
      </b-form-invalid-feedback>
      <form method="POST" action="/api/logout" id="logoutForm" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, provide } from 'vue'
import { io } from "socket.io-client"

const socket = io()
const user = ref({} as any)
let errorMsg = ref(false)
provide("user", user)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  socket.emit('token', user.value.token)
})

function handleCreate() {
  if (user.value?.name == null) {
    errorMsg.value = true
    return
  }
}

function handleJoin() {
  if (user.value?.name == null) {
    errorMsg.value = true
    return
  }
}

function logout() {
  ; (window.document.getElementById('logoutForm') as HTMLFormElement).submit()
}

</script>