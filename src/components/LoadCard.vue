<script setup lang="ts">
import { useGameStore } from '@/stores/game'

const store = useGameStore()

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) store.loadFile(file)
}
</script>

<template>
  <div class="card">
    <h2>🌸 1. Load Character Data</h2>
    <input type="file" accept=".csv" @change="onFileChange" />
    <div class="csv-instructions">
      Required headers:
      <strong>Character, Quality, Element, Weapon, Region, Version</strong>
    </div>
    <div class="status-msg" style="margin-top: 10px">
      {{ store.loadStatus }}
    </div>
  </div>
</template>
