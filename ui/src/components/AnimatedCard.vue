<template>
  <div
    :style="{width: '20%', margin: '0 0 10px', border: 'solid black 2px', backgroundColor: card.locationType === 'last-card-played' ? 'orange' : card.locationType === 'unused' ? 'green' : 'lightblue'}"
    @click="playCard(card.id)">
    <pre>{{ formatCard(card, true)}}</pre>
    <h5 :style="{display: lastPlayedCard === undefined ? 'none' : ''}">{{ card.locationType !== "player-hand" ? ""
    : areCompatible(card, lastPlayedCard) ? "Playable" : "Cannot Play"}}
    </h5>
  </div>
</template>

<script setup lang="ts">
import { Card, formatCard, areCompatible } from '../../../server/model'

interface Props {
  card?: Card,
  lastPlayedCard?: Card
}
const props = withDefaults(defineProps<Props>(), {
  card: undefined,
  lastPlayedCard: undefined
})

const emit = defineEmits<{
  (e: 'change', cardId: string): void
}>()

function playCard(cardId: string) {
  emit('change', cardId)
}
</script>