<template>
  <div class="mx-3 my-3">
    <b-jumbotron header="Config Editor" />
    <b-container fluid class="my-4">
      <b-row>
        <b-col xs="12" sm="9">
          <b-overlay :show="busy" :opacity="0.85" :blur="'2px'" rounded="sm">
            <b-form>
              <b-form-group label="Number of Decks:" label-for="num-decks-input">
                <b-form-input id="num-decks-input" v-model="currentConfig.numberOfDecks" placeholder="2" number />
              </b-form-group>
              <b-form-group label="Rank Limit:" label-for="rank-limit-input">
                <b-form-input id="rank-limit-input" v-model="currentConfig.rankLimit" placeholder="2" number />
              </b-form-group>
              <b-form-invalid-feedback :state="!errorMsg">{{ "Invalid config parameters" }}</b-form-invalid-feedback>
              <b-button class="mt-2 mb-2" @click="saveConfig()">
                Save
              </b-button>
            </b-form>
          </b-overlay>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { io } from "socket.io-client"

let currentConfig = ref({ numberOfDecks: null, rankLimit: null })
let errorMsg = ref(false)
let busy = ref(false)
const socket = io()

onMounted(() => {
  busy.value = true
  socket.emit('get-config')
  socket.on('get-config-reply', (config) => {
    currentConfig.value = { ...config }
    busy.value = false
  })
})

function saveConfig() {
  busy.value = true
  socket.emit('update-config', currentConfig.value)
  socket.on('update-config-reply', (result) => {
    !result ? errorMsg.value = true : errorMsg.value = false
    busy.value = false
  })
}
</script>