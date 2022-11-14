<template>
  <div class="d-flex flex-column justify-content-center align-items-center">
    <b-jumbotron class="text-center w-100" header="Omega Kickers" lead="Created by Minjun Kwak" />
    <b-form-group label="Display Name:" label-for="name-input">
      <b-form-input id="name-input" v-model="playerName" placeholder="Player 1"></b-form-input>
    </b-form-group>
    <b-button class="mt-4 w-25" @click="handleCreate()">
      Create a game
    </b-button>
    <b-button class="mt-4 w-25" @click="handleJoin()">
      Join a game
    </b-button>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

let playerName = ref("Player 1")

function handleCreate() {

}

function handleJoin() {

}
</script>