<template>
  <b-button-group>
    <b-button :variant="toggle ? 'dark' : 'light'" @click="switchToggle">On</b-button>
    <b-button :variant="toggle ? 'light' : 'dark'" @click="switchToggle">Off</b-button>
  </b-button-group>
</template>
<script setup lang="ts">
// props
interface Props {
  toggle?: boolean,
  switchToggle?: Function
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  toggle: false,
})

</script>