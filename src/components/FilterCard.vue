<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import AttrTag from '@/components/AttrTag.vue'

const store = useGameStore()

type AttrType = 'Quality' | 'Element' | 'Weapon' | 'Region'
type ModelKey = 'qualities' | 'elements' | 'weapons' | 'regions'

const filterGroups = computed<
  { title: string; type: AttrType; items: string[]; model: ModelKey }[]
>(() => [
  { title: 'Quality', type: 'Quality', items: store.options.qualities, model: 'qualities' },
  { title: 'Element', type: 'Element', items: store.options.elements, model: 'elements' },
  { title: 'Weapon', type: 'Weapon', items: store.options.weapons, model: 'weapons' },
  { title: 'Region', type: 'Region', items: store.options.regions, model: 'regions' },
])
</script>

<template>
  <div class="card">
    <h2>✨ 2. Select Remaining Possibilities</h2>
    <p class="csv-instructions" style="margin-top: -10px; margin-bottom: 20px">
      Uncheck the attributes that have been eliminated by the game. Keep the possible ones checked.
    </p>

    <div v-for="group in filterGroups" :key="group.model" class="filter-group">
      <div class="filter-title">Possible {{ group.title }}s</div>
      <div class="checkbox-grid">
        <label v-for="item in group.items" :key="item" class="checkbox-label">
          <input type="checkbox" :value="item" v-model="store.selected[group.model]" />
          <AttrTag :type="group.type" :value="item" />
        </label>
      </div>
    </div>

    <div class="filter-group">
      <div class="filter-title">Version Range</div>
      <div class="version-inputs">
        <label>
          Bottom / Min Limit:
          <input type="number" step="0.1" v-model="store.minVersion" />
        </label>
        <label>
          Top / Max Limit:
          <input type="number" step="0.1" v-model="store.maxVersion" />
        </label>
      </div>
    </div>

    <div class="btn-group">
      <button class="btn btn-secondary" @click="store.reset()">↺ Reset All Filters</button>
      <button class="btn" @click="store.process()">✦ Update Pool &amp; Find Best Guess ✦</button>
    </div>
  </div>
</template>
