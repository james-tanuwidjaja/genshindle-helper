import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import defaultCsv from '@/data/characters.csv?raw'
import {
  parseCSV,
  filterPool,
  calculateBestNextGuess,
  type Character,
  type Recommendation,
} from '@/lib/logic'

interface AttributeState {
  qualities: string[]
  elements: string[]
  weapons: string[]
  regions: string[]
}

// Central state for the solver: the loaded dataset, the user's attribute
// selections, and the computed pool / recommendation.
export const useGameStore = defineStore('game', () => {
  const loadStatus = ref('Loading default character data…')
  const dataLoaded = ref(false)

  const dataset = ref<Character[]>([])
  const options = reactive<AttributeState>({
    qualities: [],
    elements: [],
    weapons: [],
    regions: [],
  })
  const selected = reactive<AttributeState>({
    qualities: [],
    elements: [],
    weapons: [],
    regions: [],
  })
  const versionBounds = reactive({ min: 0, max: 0 })
  const minVersion = ref(0)
  const maxVersion = ref(0)

  // Results are only shown once the user has run the solver at least once.
  const hasResults = ref(false)
  const pool = ref<Character[]>([])
  const recommendation = ref<Recommendation | null>(null)

  function loadCsvText(text: string, successMessage: (count: number) => string) {
    try {
      const parsed = parseCSV(text)
      dataset.value = parsed.dataset
      options.qualities = parsed.qualities
      options.elements = parsed.elements
      options.weapons = parsed.weapons
      options.regions = parsed.regions
      // Start with every attribute possible (all checked).
      selected.qualities = [...parsed.qualities]
      selected.elements = [...parsed.elements]
      selected.weapons = [...parsed.weapons]
      selected.regions = [...parsed.regions]
      versionBounds.min = parsed.minVer
      versionBounds.max = parsed.maxVer
      minVersion.value = parsed.minVer
      maxVersion.value = parsed.maxVer
      hasResults.value = false
      pool.value = []
      recommendation.value = null
      loadStatus.value = successMessage(parsed.dataset.length)
      dataLoaded.value = true
    } catch (err) {
      loadStatus.value = `⚠️ ${(err as Error).message}`
    }
  }

  // Auto-load the bundled default dataset.
  function loadDefault() {
    loadCsvText(defaultCsv, (count) => `🌸 Success: Loaded ${count} characters dynamically!`)
  }

  // Load a user-supplied CSV file (manual upload).
  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) =>
      loadCsvText(
        String(e.target?.result ?? ''),
        (count) => `🌸 Success: Loaded ${count} characters from your file!`,
      )
    reader.readAsText(file)
  }

  function process() {
    pool.value = filterPool(dataset.value, {
      qualities: selected.qualities,
      elements: selected.elements,
      weapons: selected.weapons,
      regions: selected.regions,
      minVer: parseFloat(String(minVersion.value)) || 0,
      maxVer: parseFloat(String(maxVersion.value)) || 999,
    })
    recommendation.value = calculateBestNextGuess(pool.value, dataset.value)
    hasResults.value = true
  }

  function reset() {
    selected.qualities = [...options.qualities]
    selected.elements = [...options.elements]
    selected.weapons = [...options.weapons]
    selected.regions = [...options.regions]
    minVersion.value = versionBounds.min
    maxVersion.value = versionBounds.max
    process()
  }

  return {
    loadStatus,
    dataLoaded,
    dataset,
    options,
    selected,
    versionBounds,
    minVersion,
    maxVersion,
    hasResults,
    pool,
    recommendation,
    loadDefault,
    loadFile,
    process,
    reset,
  }
})
