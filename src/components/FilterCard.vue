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

// The slider works on indices into the sorted, de-duplicated version list. It
// snaps to the closest existing version so the thumb stays sensible even when a
// value has been typed into the number inputs that isn't an exact CSV version.
function indexOfVersion(v: number): number {
  const versions = store.versions
  if (!versions.length) return 0
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < versions.length; i++) {
    const diff = Math.abs(versions[i] - v)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  return best
}

const minIndex = computed<number>({
  get: () => indexOfVersion(store.minVersion),
  set: (i) => {
    const clamped = Math.min(Number(i), maxIndex.value)
    store.minVersion = store.versions[clamped]
  },
})

const maxIndex = computed<number>({
  get: () => indexOfVersion(store.maxVersion),
  set: (i) => {
    const clamped = Math.max(Number(i), minIndex.value)
    store.maxVersion = store.versions[clamped]
  },
})

// In exact mode a single thumb sets both bounds to the same version.
const exactIndex = computed<number>({
  get: () => indexOfVersion(store.minVersion),
  set: (i) => {
    const v = store.versions[Number(i)]
    store.minVersion = v
    store.maxVersion = v
  },
})

// Exact-mode number input: typing a value writes it to both bounds directly,
// so any version (even one not present in the CSV) can be entered.
const exactVersion = computed<number>({
  get: () => store.minVersion,
  set: (v) => {
    store.minVersion = v
    store.maxVersion = v
  },
})

function toggleExact() {
  store.exactMode = !store.exactMode
  if (store.exactMode) {
    // Collapse the range to a single value (keep the current lower bound).
    store.maxVersion = store.minVersion
  } else {
    // Re-open the range up to the dataset's highest version.
    store.maxVersion = store.versionBounds.max
  }
}

// Percentages for the highlighted segment of the track between the two thumbs.
const rangeFill = computed(() => {
  const n = store.versions.length - 1
  if (n <= 0) return { left: '0%', right: '0%' }
  return {
    left: `${(minIndex.value / n) * 100}%`,
    right: `${100 - (maxIndex.value / n) * 100}%`,
  }
})

// Guard number inputs: only push to store when a finite number is entered.
// On blur, if the current text is invalid, revert the input to the last store value.
function handleVersionInput(field: 'min' | 'max' | 'exact', e: Event) {
  const n = parseFloat((e.target as HTMLInputElement).value)
  if (!Number.isFinite(n)) return
  if (field === 'min') store.minVersion = n
  else if (field === 'max') store.maxVersion = n
  else { store.minVersion = n; store.maxVersion = n }
}

function revertIfInvalid(storeVal: number, e: Event) {
  const input = e.target as HTMLInputElement
  if (!Number.isFinite(parseFloat(input.value))) {
    input.value = Number.isFinite(storeVal) ? String(storeVal) : ''
  }
}

// Left-percentage position of each thumb, used to anchor the floating tooltip.
const thumbPositions = computed(() => {
  const n = store.versions.length - 1
  if (n <= 0) return { min: '0%', max: '100%', exact: '0%' }
  return {
    min: `${(minIndex.value / n) * 100}%`,
    max: `${(maxIndex.value / n) * 100}%`,
    exact: `${(exactIndex.value / n) * 100}%`,
  }
})
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

    <div v-if="store.versions.length" class="filter-group">
      <div class="filter-title version-header">
        <span>Version Range</span>
        <label class="exact-toggle">
          <input type="checkbox" :checked="store.exactMode" @change="toggleExact" />
          Exact version
        </label>
      </div>

      <template v-if="!store.exactMode">
        <div class="range-slider">
          <div class="range-track"></div>
          <div class="range-track-fill" :style="{ left: rangeFill.left, right: rangeFill.right }"></div>
          <div class="thumb-tooltip" :style="{ left: thumbPositions.min }">
            {{ Number.isFinite(store.minVersion) ? store.minVersion.toFixed(1) : '—' }}
          </div>
          <div class="thumb-tooltip" :style="{ left: thumbPositions.max }">
            {{ Number.isFinite(store.maxVersion) ? store.maxVersion.toFixed(1) : '—' }}
          </div>
          <input
            type="range"
            class="range-input"
            :min="0"
            :max="store.versions.length - 1"
            step="1"
            v-model.number="minIndex"
            aria-label="Minimum version"
          />
          <input
            type="range"
            class="range-input"
            :min="0"
            :max="store.versions.length - 1"
            step="1"
            v-model.number="maxIndex"
            aria-label="Maximum version"
          />
        </div>
        <div class="version-inputs">
          <label>
            Min:
            <input
              type="number"
              step="0.1"
              :value="store.minVersion"
              @input="handleVersionInput('min', $event)"
              @blur="revertIfInvalid(store.minVersion, $event)"
            />
          </label>
          <label>
            Max:
            <input
              type="number"
              step="0.1"
              :value="store.maxVersion"
              @input="handleVersionInput('max', $event)"
              @blur="revertIfInvalid(store.maxVersion, $event)"
            />
          </label>
        </div>
      </template>

      <template v-else>
        <div class="range-slider">
          <div class="range-track"></div>
          <div class="thumb-tooltip" :style="{ left: thumbPositions.exact }">
            {{ Number.isFinite(store.minVersion) ? store.minVersion.toFixed(1) : '—' }}
          </div>
          <input
            type="range"
            class="range-input"
            :min="0"
            :max="store.versions.length - 1"
            step="1"
            v-model.number="exactIndex"
            aria-label="Exact version"
          />
        </div>
        <div class="version-inputs version-inputs-center">
          <label>
            Version:
            <input
              type="number"
              step="0.1"
              :value="store.minVersion"
              @input="handleVersionInput('exact', $event)"
              @blur="revertIfInvalid(store.minVersion, $event)"
            />
          </label>
        </div>
      </template>
    </div>

    <div class="btn-group">
      <button class="btn btn-secondary" @click="store.reset()">↺ Reset All Filters</button>
      <button class="btn" @click="store.process()">✦ Update Pool &amp; Find Best Guess ✦</button>
    </div>
  </div>
</template>

<style scoped>
.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.exact-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
}

.exact-toggle input {
  cursor: pointer;
  accent-color: var(--accent-pink);
}

/* Dual-thumb slider: two overlapping range inputs sharing one track. */
.range-slider {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
  margin: 28px 4px 0;
}

.thumb-tooltip {
  position: absolute;
  top: -26px;
  transform: translateX(-50%);
  background: var(--accent-pink);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}

.thumb-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--accent-pink);
}

.range-track,
.range-track-fill {
  position: absolute;
  height: 6px;
  border-radius: 3px;
}

.range-track {
  left: 0;
  right: 0;
  background: var(--border-color);
}

.range-track-fill {
  background: var(--accent-pink);
}

.range-input {
  position: absolute;
  left: 0;
  width: 100%;
  margin: 0;
  height: 24px;
  background: none;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--accent-pink);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
}

.range-input::-moz-range-thumb {
  pointer-events: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--accent-pink);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
}

.version-inputs {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  font-size: 0.9rem;
  color: var(--text-main);
}

.version-inputs-center {
  justify-content: center;
}

.version-inputs label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.version-inputs input[type='number'] {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text-main);
  font-size: 0.9rem;
}

.version-inputs input[type='number']:focus {
  outline: none;
  border-color: var(--accent-pink);
}
</style>
