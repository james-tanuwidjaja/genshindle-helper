<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import '@/assets/load-card.css'

const store = useGameStore()
const isDragging = ref(false)
const fileName = ref('')

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    fileName.value = file.name
    store.loadFile(file)
  }
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file?.name.endsWith('.csv')) {
    fileName.value = file.name
    store.loadFile(file)
  }
}
</script>

<template>
  <div class="card">
    <h2>🌸 1. Load Character Data</h2>

    <label
      class="file-upload-zone"
      :class="{ 'is-dragging': isDragging, 'has-file': !!fileName }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <span class="upload-icon">{{ fileName ? '✅' : '📂' }}</span>
      <span class="upload-main">{{ fileName || 'Drop CSV here or click to browse' }}</span>
      <span v-if="!fileName" class="upload-hint">.csv files only</span>
      <input type="file" accept=".csv" class="upload-input" @change="onFileChange" />
    </label>

    <div class="csv-instructions">
      Required headers:
      <strong>Character, Quality, Element, Weapon, Region, Version</strong>
    </div>
    <div class="status-msg" style="margin-top: 10px">
      {{ store.loadStatus }}
    </div>
  </div>
</template>
