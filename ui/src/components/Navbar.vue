<template>
  <b-navbar>
    <b-navbar-nav>
      <b-nav-item v-if="name == null" href="/api/login">Login</b-nav-item>
      <b-nav-item v-if="name" @click="logout">Logout</b-nav-item>
      <b-nav-item>
        <b-icon icon="house-door-fill" @click="goHome()"></b-icon>
      </b-nav-item>
    </b-navbar-nav>
    <b-navbar-nav class="ml-auto">
      <b-nav-item>
        <b-icon icon="gear-fill" @click="goToConfig()"></b-icon>
      </b-nav-item>
    </b-navbar-nav>
  </b-navbar>
</template>
<script setup lang="ts">
import router from '@/main'

// props
interface Props {
  name?: string | null
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  name: null
})

function goHome() {
  router.push('/')
}

function goToConfig() {
  router.push('/config')
}

function logout() {
  ; (window.document.getElementById('logoutForm') as HTMLFormElement).submit()
}
</script>