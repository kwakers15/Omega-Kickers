import Vue from 'vue'
import VueRouter from 'vue-router'
import App from '@/App.vue'
import Game from '@/components/Game.vue'
import Config from '@/components/Config.vue'
import Home from '@/components/Home.vue'
import TeamSelection from '@/components/TeamSelection.vue'

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue"

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)
Vue.use(VueRouter)

const router = new VueRouter({
  mode: "history",
  routes: [
    {
      path: "/config",
      component: Config,
    },
    {
      path: "/game/:playerIndex",
      component: Game,
      props(route) {
        return {
          playerIndex: route.params.playerIndex
        }
      }
    },
    {
      path: "/home",
      component: Home
    },
    {
      path: "/team/:playerIndex",
      component: TeamSelection
    }
  ],
})

Vue.config.productionTip = false
Vue.config.devtools = true

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  render: h => h(App),
})
