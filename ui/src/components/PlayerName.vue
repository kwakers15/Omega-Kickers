<template>
  <span :style="{ position: 'absolute', top: computedYPos + 'vh', left: computedXPos + 'vw' }">{{ computedName }}</span>
</template>
<script setup lang="ts">
import { computed, toRefs } from 'vue'
// props
interface Props {
  xPos: number,
  yPos: number,
  teamIndex: number
  name: string,
  currentPlayer: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  xPos: 0,
  yPos: 0,
  teamIndex: -1,
  name: '',
  currentPlayer: ''
})

const { xPos, yPos, teamIndex, currentPlayer, name } = toRefs(props)

const computedYPos = computed(() => {
  return yPos.value

})
const computedXPos = computed(() => {
  return teamIndex.value === 0 ? xPos.value : xPos.value + 50
})

const computedName = computed(() => {
  return currentPlayer.value === name.value ? 'You' : name.value
})

</script>