<template>
  <b-container>
    <b-row align-h="center" class="mt-4 mb-4">
      Team {{ teamNum }}
    </b-row>
    <b-row :id="i" v-for="i in maxPlayers / 2" v-bind:key="i"
      class="border border-dark rounded-sm d-flex justify-content-center align-items-center mb-1 pt-5 pb-5">
      {{ roster[i - 1] }}
    </b-row>
    <b-row class="d-flex justify-content-center align-items-center">
      <b-button @click="() => teamNum == 1 ? action(1) : action(2)" class="mt-4">
        Join
      </b-button>
    </b-row>
  </b-container>
</template>
<script setup lang="ts">
// props
interface Props {
  maxPlayers?: number
  teamNum?: number
  roster?: string[] | undefined,
  action?: Function
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  maxPlayers: 0,
  teamNum: 0,
  roster: undefined,
  action: () => { }
})
</script>