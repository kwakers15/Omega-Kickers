<template>
  <div>
    <b-jumbotron class="text-center" header="Config Editor">
      <hr class="my-4">
      <h4 class="font-weight-normal">Omega Kickers</h4>
    </b-jumbotron>
    <b-container class="my-4">
      <b-row align-h="center">
        <b-col xs="12" sm="9">
          <b-overlay :show="busy" :opacity="0.85" :blur="'2px'" rounded="sm">
            <b-form>
              <b-form-group label="Ball Speed:" label-for="ball-speed-input">
                <b-form-input id="ball-speed-input" v-model="currentConfig.ballSpeed" placeholder="5" number />
              </b-form-group>
              <b-form-invalid-feedback class="mb-2" :state="!ballSpeedError">{{ errorMsg }}</b-form-invalid-feedback>
              <b-form-group label="Player Speed:" label-for="player-speed-input">
                <b-form-input id="player-speed-input" v-model="currentConfig.playerSpeed" placeholder="5" number />
              </b-form-group>
              <b-form-invalid-feedback class="mb-2" :state="!playerSpeedError">{{ errorMsg }}</b-form-invalid-feedback>
              <b-form-group label="Obstacles:">
                <ConfigButtonGroup :toggle="currentConfig.obstacles" :switch-toggle="switchObstacleToggle" />
              </b-form-group>
              <b-form-group label="Goalkeepers:">
                <ConfigButtonGroup :toggle="currentConfig.keepers" :switch-toggle="switchKeeperToggle" />
              </b-form-group>
              <b-row align-h="start">
                <b-col cols="2">
                  <b-button class="mt-2 mb-2 w-100" @click="saveConfig()">
                    Save
                  </b-button>
                </b-col>
                <b-col cols="2">
                  <b-alert :show="dismissAlert" variant="light" @dismissed="dismissAlert = 0"
                    @dismiss-count-down="countDownChanged">
                    <b-icon font-scale="2" :icon="errorIcon ? 'x-square' : 'check-square'"
                      :variant="errorIcon ? 'danger' : 'success'" />
                  </b-alert>
                </b-col>
                <b-col cols="6" />
              </b-row>
            </b-form>
          </b-overlay>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { io } from "socket.io-client"
import ConfigButtonGroup from './ConfigButtonGroup.vue';

let currentConfig = ref({ ballSpeed: 0, playerSpeed: 0, obstacles: false, keepers: false })
let ballSpeedError = ref(false)
let playerSpeedError = ref(false)
const errorMsg = "Enter a number!"
let busy = ref(false)
let errorIcon = ref(false)
let dismissAlert = ref(0)
let dismissSecs = ref(3)
const socket = io()

onMounted(() => {
  busy.value = true
  socket.emit('get-config')
  socket.on('get-config-reply', (config) => {
    currentConfig.value = { ...config }
    busy.value = false
  })
})

function switchObstacleToggle() {
  currentConfig.value.obstacles = !currentConfig.value.obstacles
}

function switchKeeperToggle() {
  currentConfig.value.keepers = !currentConfig.value.keepers
}

function countDownChanged(dismissCountDown: number) {
  dismissAlert.value = dismissCountDown
}

function saveConfig() {
  busy.value = true
  socket.emit('update-config', currentConfig.value)
  socket.on('update-config-reply', (result) => {
    result.ballError ? ballSpeedError.value = true : ballSpeedError.value = false
    result.playerError ? playerSpeedError.value = true : playerSpeedError.value = false
    busy.value = false
    result.updated ? errorIcon.value = false : errorIcon.value = true
    dismissAlert.value = dismissSecs.value
  })
}
</script>