// Pure data logic ported from the original script.js. No DOM access here — these
// functions take data and return data, so the Vue/Pinia layer stays declarative.

export interface Character {
  Character: string
  Quality: string
  Element: string
  Weapon: string
  Region: string
  Version: number
}

export interface ParsedData {
  dataset: Character[]
  qualities: string[]
  elements: string[]
  weapons: string[]
  regions: string[]
  minVer: number
  maxVer: number
}

export interface Filters {
  qualities: string[]
  elements: string[]
  weapons: string[]
  regions: string[]
  minVer: number
  maxVer: number
}

export type Recommendation =
  | { type: 'none' }
  | { type: 'solved'; target: Character }
  | {
      type: 'guess'
      selection: Character
      worstCase: number
      inPool: boolean
      poolSize: number
    }

// Parse CSV text into a dataset plus the unique attribute sets and version range.
// Throws an Error if a required header is missing.
export function parseCSV(text: string): ParsedData {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) {
    throw new Error('CSV appears to be empty.')
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const charIdx = headers.indexOf('character')
  const qualIdx = headers.indexOf('quality')
  const elemIdx = headers.indexOf('element')
  const weapIdx = headers.indexOf('weapon')
  const regIdx = headers.indexOf('region')
  const verIdx = headers.indexOf('version')

  if (
    charIdx === -1 ||
    qualIdx === -1 ||
    elemIdx === -1 ||
    weapIdx === -1 ||
    regIdx === -1 ||
    verIdx === -1
  ) {
    throw new Error('CSV structure is missing one or more required headers.')
  }

  const dataset: Character[] = []
  const qualities = new Set<string>()
  const elements = new Set<string>()
  const weapons = new Set<string>()
  const regions = new Set<string>()
  let minVer = 999
  let maxVer = 0

  const maxIdx = Math.max(charIdx, qualIdx, elemIdx, weapIdx, regIdx, verIdx)

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const cols = lines[i].split(',').map((c) => c.trim())
    if (cols.length <= maxIdx) continue

    const charObj: Character = {
      Character: cols[charIdx],
      Quality: cols[qualIdx],
      Element: cols[elemIdx],
      Weapon: cols[weapIdx],
      Region: cols[regIdx],
      Version: parseFloat(cols[verIdx]),
    }

    dataset.push(charObj)
    qualities.add(charObj.Quality)
    elements.add(charObj.Element)
    weapons.add(charObj.Weapon)
    regions.add(charObj.Region)

    if (charObj.Version < minVer) minVer = charObj.Version
    if (charObj.Version > maxVer) maxVer = charObj.Version
  }

  return {
    dataset,
    qualities: [...qualities].sort(),
    elements: [...elements].sort(),
    weapons: [...weapons].sort(),
    regions: [...regions].sort(),
    minVer,
    maxVer,
  }
}

// Filter the dataset down to the still-possible candidates. The `*` arrays hold
// the currently-checked values (compared case-insensitively).
export function filterPool(dataset: Character[], filters: Filters): Character[] {
  const q = filters.qualities.map((v) => v.toString().toLowerCase())
  const e = filters.elements.map((v) => v.toLowerCase())
  const w = filters.weapons.map((v) => v.toLowerCase())
  const r = filters.regions.map((v) => v.toLowerCase())
  const lo = Number.isFinite(filters.minVer) ? filters.minVer : 0
  const hi = Number.isFinite(filters.maxVer) ? filters.maxVer : 999

  return dataset.filter(
    (target) =>
      q.includes(target.Quality.toString().toLowerCase()) &&
      e.includes(target.Element.toLowerCase()) &&
      w.includes(target.Weapon.toLowerCase()) &&
      r.includes(target.Region.toLowerCase()) &&
      target.Version >= lo &&
      target.Version <= hi,
  )
}

// Minimax: pick the candidate that minimizes the worst-case remaining pool size.
// Returns a discriminated union the UI can render directly.
export function calculateBestNextGuess(pool: Character[], dataset: Character[]): Recommendation {
  if (pool.length === 0) return { type: 'none' }
  if (pool.length === 1) return { type: 'solved', target: pool[0] }

  let optimalSelection: Character | null = null
  let lowestMaxGroup = Infinity
  let choiceInPool = false

  for (const candidate of dataset) {
    const signatureGroups: Record<string, number> = {}

    for (const target of pool) {
      const q = target.Quality.toString() === candidate.Quality.toString()
      const e = target.Element.toLowerCase() === candidate.Element.toLowerCase()
      const w = target.Weapon.toLowerCase() === candidate.Weapon.toLowerCase()
      const r = target.Region.toLowerCase() === candidate.Region.toLowerCase()

      let v = 'equal'
      if (target.Version > candidate.Version) v = 'up'
      else if (target.Version < candidate.Version) v = 'down'

      const patternKey = `${q}-${e}-${w}-${r}-${v}`
      signatureGroups[patternKey] = (signatureGroups[patternKey] || 0) + 1
    }

    const currentMaxGroup = Math.max(...Object.values(signatureGroups))
    const currentInPool = pool.some((p) => p.Character === candidate.Character)

    if (
      currentMaxGroup < lowestMaxGroup ||
      (currentMaxGroup === lowestMaxGroup && currentInPool && !choiceInPool)
    ) {
      lowestMaxGroup = currentMaxGroup
      optimalSelection = candidate
      choiceInPool = currentInPool
    }
  }

  // pool.length >= 2 guarantees a selection was found.
  return {
    type: 'guess',
    selection: optimalSelection as Character,
    worstCase: lowestMaxGroup,
    inPool: choiceInPool,
    poolSize: pool.length,
  }
}
