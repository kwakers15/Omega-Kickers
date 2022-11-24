<template>
  <div
    :style="{ top: computedYPos + 'vh', left: computedXPos + 'vw', position: 'absolute', width: '1vw', height: '6vh', backgroundColor: 'black' }">
  </div>
</template>
<script setup lang="ts">
import { computed, toRefs } from 'vue'
// props
interface Props {
  xPos: number,
  yPos: number,
  teamIndex: number,
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  xPos: 0,
  yPos: 0,
  teamIndex: -1,
})

const { xPos, yPos, teamIndex } = toRefs(props)

const computedYPos = computed(() => {
  console.log('computedYPos', yPos.value)
  return yPos.value

})
const computedXPos = computed(() => {
  const computed = teamIndex.value === 0 ? xPos.value : xPos.value + 50
  console.log('computedXPos', computed)
  return computed
})

</script>