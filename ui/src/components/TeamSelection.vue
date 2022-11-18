<template>
  <div>
    <Navbar :name="user?.name" />
    <b-button @click="socket.emit('join-room', user.preferred_username, '120558')">hello</b-button>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Navbar from '../components/Navbar.vue'
import { io } from "socket.io-client"

const socket = io()
const user = ref({} as any)

onMounted(async () => {
  user.value = await (await fetch("/api/user")).json()
  socket.emit('token', user.value.token)
  setTimeout(() => {
    socket.emit('create-room', user.value.preferred_username)
  }, 500)
})

</script>