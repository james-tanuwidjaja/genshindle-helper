<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import LoadCard from '@/components/LoadCard.vue'
import FilterCard from '@/components/FilterCard.vue'
import ResultsCard from '@/components/ResultsCard.vue'

const store = useGameStore()

onMounted(() => {
  if (!store.dataLoaded) store.loadDefault()
})
</script>

<template>
  <div class="container">
    <LoadCard />
    <FilterCard v-if="store.dataLoaded" />
    <ResultsCard v-if="store.hasResults" />
  </div>
</template>
