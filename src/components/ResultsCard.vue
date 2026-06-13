<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { elementIcon } from '@/lib/genshinAssets'
import AttrTag from '@/components/AttrTag.vue'

const store = useGameStore()

// Narrow the discriminated union into typed computed values so the template
// stays simple and type-safe.
const isNone = computed(() => store.recommendation?.type === 'none')
const solved = computed(() =>
  store.recommendation?.type === 'solved' ? store.recommendation : null,
)
const guess = computed(() => (store.recommendation?.type === 'guess' ? store.recommendation : null))
const recElementIcon = computed(() =>
  guess.value ? elementIcon(guess.value.selection.Element) : null,
)
</script>

<template>
  <div class="results-layout">
    <div class="card">
      <h3>Candidate Pool ({{ store.pool.length }} remaining)</h3>
      <div class="pool-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>★</th>
              <th>Element</th>
              <th>Weapon</th>
              <th>Region</th>
              <th>Ver</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in store.pool" :key="c.Character">
              <td>
                <strong>{{ c.Character }}</strong>
              </td>
              <td><AttrTag type="Quality" :value="c.Quality" /></td>
              <td><AttrTag type="Element" :value="c.Element" /></td>
              <td><AttrTag type="Weapon" :value="c.Weapon" /></td>
              <td><AttrTag type="Region" :value="c.Region" /></td>
              <td>{{ c.Version.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Best Next Guess Strategy</h3>

      <p v-if="isNone" style="color: #d32f2f; font-weight: bold">
        No characters match the current filters. Please re-check your options.
      </p>

      <div v-else-if="solved" class="recommendation-box">
        <p>Only one choice left! Target found:</p>
        <div class="highlight-name">🌟 {{ solved?.target.Character }}</div>
      </div>

      <div v-else-if="guess" class="recommendation-box">
        <p style="color: var(--text-muted); font-weight: bold; margin-bottom: 5px">
          Suggested Next Guess:
        </p>
        <div class="highlight-name">
          {{ guess?.selection.Character }}
          <img v-if="recElementIcon" :src="recElementIcon" class="asset-icon" alt="" />
        </div>
        <p style="margin-top: 15px; font-size: 0.95rem; line-height: 1.5">
          <strong>Strategy Analysis:</strong> Guessing
          <b>{{ guess?.selection.Character }}</b> safely breaks the remaining
          {{ guess?.poolSize }} candidates into distinct profiles based on the game's feedback. In
          the absolute worst-case scenario, the candidate pool will instantly shrink down to a
          maximum of <strong>{{ guess?.worstCase }}</strong> item(s).
        </p>
        <p class="strategy-note">
          <template v-if="guess?.inPool">
            🎯 <b>In Pool:</b> This character is among the remaining candidates. You win instantly
            if they are the target.
          </template>
          <template v-else>
            ⚠️ <b>Sacrificial Pick:</b> This character is an outside tactical pick designed
            specifically to partition the remaining pool cleanly.
          </template>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pool-scroll {
  max-height: 500px;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.strategy-note {
  font-size: 0.85rem;
  color: var(--text-muted);
  background: var(--bg-page);
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
}
</style>
