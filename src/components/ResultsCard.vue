<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { elementIcon } from '@/lib/genshinAssets'
import AttrTag from '@/components/AttrTag.vue'
import { computeBreakdown } from '@/lib/logic'
import type { Character } from '@/lib/logic'

const store = useGameStore()

const isNone = computed(() => store.recommendation?.type === 'none')
const solved = computed(() =>
  store.recommendation?.type === 'solved' ? store.recommendation : null,
)
const guess = computed(() => (store.recommendation?.type === 'guess' ? store.recommendation : null))

// Which alternative (if any) the user has selected to preview
const displayedChar = ref<Character | null>(null)

// Reset preview whenever the solver produces a new recommendation
watch(guess, () => {
  displayedChar.value = null
})

// The character currently displayed (primary or a selected alternative)
const activeChar = computed(() => displayedChar.value ?? guess.value?.selection ?? null)

// inPool status for whatever is currently being displayed
const activeInPool = computed(() => {
  if (!guess.value) return false
  if (!displayedChar.value) return guess.value.inPool
  return (
    guess.value.alternatives.find(
      (a) => a.selection.Character === displayedChar.value!.Character,
    )?.inPool ?? false
  )
})

// Primary + all tied alternatives combined into one list for the chip row
const allOptimalChars = computed(() => {
  if (!guess.value) return []
  return [
    { selection: guess.value.selection, inPool: guess.value.inPool },
    ...guess.value.alternatives,
  ]
})

// Breakdown recomputed for whichever character is active
const activeBreakdown = computed(() => {
  if (!guess.value) return []
  if (!displayedChar.value) return guess.value.breakdown
  return computeBreakdown(displayedChar.value, store.pool, guess.value.worstCase)
})

const recElementIcon = computed(() =>
  activeChar.value ? elementIcon(activeChar.value.Element) : null,
)

// --- Guess feedback state (local UI only) ---
const activeGuess = ref<Character | null>(null)
const feedbackQuality = ref<boolean | null>(null)
const feedbackElement = ref<boolean | null>(null)
const feedbackWeapon = ref<boolean | null>(null)
const feedbackRegion = ref<boolean | null>(null)
const feedbackVersion = ref<'exact' | 'higher' | 'lower' | null>(null)

const inFeedbackMode = computed(() => activeGuess.value !== null)

function startGuess(char?: Character) {
  const target = char ?? activeChar.value
  if (!target) return
  activeGuess.value = target
  feedbackQuality.value =
    feedbackElement.value =
    feedbackWeapon.value =
    feedbackRegion.value =
    feedbackVersion.value =
      null
}

function cancelGuess() {
  activeGuess.value = null
}

function handleCorrect() {
  cancelGuess()
  store.reset()
}

function applyGuessResult() {
  const char = activeGuess.value
  if (!char) return

  if (feedbackQuality.value === true) store.selected.qualities = [char.Quality]
  else if (feedbackQuality.value === false)
    store.selected.qualities = store.selected.qualities.filter((q) => q !== char.Quality)

  if (feedbackElement.value === true) store.selected.elements = [char.Element]
  else if (feedbackElement.value === false)
    store.selected.elements = store.selected.elements.filter((e) => e !== char.Element)

  if (feedbackWeapon.value === true) store.selected.weapons = [char.Weapon]
  else if (feedbackWeapon.value === false)
    store.selected.weapons = store.selected.weapons.filter((w) => w !== char.Weapon)

  if (feedbackRegion.value === true) store.selected.regions = [char.Region]
  else if (feedbackRegion.value === false)
    store.selected.regions = store.selected.regions.filter((r) => r !== char.Region)

  const vers = store.versions
  if (feedbackVersion.value === 'exact') {
    store.minVersion = char.Version
    store.maxVersion = char.Version
    store.exactMode = true
  } else if (feedbackVersion.value === 'higher') {
    const nextIdx = vers.findIndex((v) => v > char.Version)
    if (nextIdx !== -1) {
      store.minVersion = vers[nextIdx]
      if (store.exactMode) {
        store.exactMode = false
        store.maxVersion = store.versionBounds.max
      }
    }
  } else if (feedbackVersion.value === 'lower') {
    const prevVers = [...vers].reverse()
    const idx = prevVers.findIndex((v) => v < char.Version)
    if (idx !== -1) {
      store.maxVersion = prevVers[idx]
      if (store.exactMode) {
        store.exactMode = false
        store.minVersion = store.versionBounds.min
      }
    }
  }

  store.process()
  cancelGuess()
}

// Parses a raw signature key into colored chip descriptors for the breakdown rows
type ChipInfo = { label: string; state: 'match' | 'wrong' | 'hint' }
function parseKeyToChips(key: string): ChipInfo[] {
  const [q, e, w, r, v] = key.split('-')
  return [
    { label: q === 'true' ? 'Quality ✓' : 'Quality ✗', state: q === 'true' ? 'match' : 'wrong' },
    { label: e === 'true' ? 'Element ✓' : 'Element ✗', state: e === 'true' ? 'match' : 'wrong' },
    { label: w === 'true' ? 'Weapon ✓' : 'Weapon ✗', state: w === 'true' ? 'match' : 'wrong' },
    { label: r === 'true' ? 'Region ✓' : 'Region ✗', state: r === 'true' ? 'match' : 'wrong' },
    {
      label: v === 'equal' ? 'Ver =' : v === 'up' ? 'Ver ↑' : 'Ver ↓',
      state: v === 'equal' ? 'match' : 'hint',
    },
  ]
}
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
              <th></th>
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
              <td>
                <button class="btn-row-guess" @click="startGuess(c)" title="Use as Guess">▶</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Best Next Guess Strategy</h3>

      <!-- FEEDBACK MODE -->
      <div v-if="inFeedbackMode" class="feedback-box">
        <p class="feedback-header">
          What did Genshindle show for <strong>{{ activeGuess!.Character }}</strong>?
        </p>

        <div class="feedback-attr-row">
          <span class="feedback-label">Quality</span>
          <AttrTag type="Quality" :value="activeGuess!.Quality" />
          <div class="toggle-group">
            <button
              :class="['toggle-btn', feedbackQuality === true && 'active-match']"
              @click="feedbackQuality = feedbackQuality === true ? null : true"
            >
              ✓ Match
            </button>
            <button
              :class="['toggle-btn', feedbackQuality === false && 'active-wrong']"
              @click="feedbackQuality = feedbackQuality === false ? null : false"
            >
              ✗ Wrong
            </button>
          </div>
        </div>

        <div class="feedback-attr-row">
          <span class="feedback-label">Element</span>
          <AttrTag type="Element" :value="activeGuess!.Element" />
          <div class="toggle-group">
            <button
              :class="['toggle-btn', feedbackElement === true && 'active-match']"
              @click="feedbackElement = feedbackElement === true ? null : true"
            >
              ✓ Match
            </button>
            <button
              :class="['toggle-btn', feedbackElement === false && 'active-wrong']"
              @click="feedbackElement = feedbackElement === false ? null : false"
            >
              ✗ Wrong
            </button>
          </div>
        </div>

        <div class="feedback-attr-row">
          <span class="feedback-label">Weapon</span>
          <AttrTag type="Weapon" :value="activeGuess!.Weapon" />
          <div class="toggle-group">
            <button
              :class="['toggle-btn', feedbackWeapon === true && 'active-match']"
              @click="feedbackWeapon = feedbackWeapon === true ? null : true"
            >
              ✓ Match
            </button>
            <button
              :class="['toggle-btn', feedbackWeapon === false && 'active-wrong']"
              @click="feedbackWeapon = feedbackWeapon === false ? null : false"
            >
              ✗ Wrong
            </button>
          </div>
        </div>

        <div class="feedback-attr-row">
          <span class="feedback-label">Region</span>
          <AttrTag type="Region" :value="activeGuess!.Region" />
          <div class="toggle-group">
            <button
              :class="['toggle-btn', feedbackRegion === true && 'active-match']"
              @click="feedbackRegion = feedbackRegion === true ? null : true"
            >
              ✓ Match
            </button>
            <button
              :class="['toggle-btn', feedbackRegion === false && 'active-wrong']"
              @click="feedbackRegion = feedbackRegion === false ? null : false"
            >
              ✗ Wrong
            </button>
          </div>
        </div>

        <div class="feedback-attr-row">
          <span class="feedback-label">Version</span>
          <span class="version-value">{{ activeGuess!.Version.toFixed(1) }}</span>
          <div class="toggle-group">
            <button
              :class="['toggle-btn', feedbackVersion === 'exact' && 'active-match']"
              @click="feedbackVersion = feedbackVersion === 'exact' ? null : 'exact'"
            >
              = Exact
            </button>
            <button
              :class="['toggle-btn', feedbackVersion === 'higher' && 'active-hint']"
              @click="feedbackVersion = feedbackVersion === 'higher' ? null : 'higher'"
            >
              ↑ Higher
            </button>
            <button
              :class="['toggle-btn', feedbackVersion === 'lower' && 'active-hint']"
              @click="feedbackVersion = feedbackVersion === 'lower' ? null : 'lower'"
            >
              ↓ Lower
            </button>
          </div>
        </div>

        <div class="feedback-actions">
          <button class="feedback-cancel-btn" @click="cancelGuess()">✕ Cancel</button>
          <button class="feedback-correct-btn" @click="handleCorrect()">🎯 Correct! (Reset)</button>
          <button class="btn" @click="applyGuessResult()">✦ Apply to Filter</button>
        </div>
      </div>

      <!-- NORMAL RECOMMENDATION MODE -->
      <template v-else>
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
            {{ activeChar?.Character }}
            <img v-if="recElementIcon" :src="recElementIcon" class="asset-icon" alt="" />
          </div>
          <p style="margin-top: 15px; font-size: 0.95rem; line-height: 1.5">
            <strong>Strategy Analysis:</strong> Guessing
            <b>{{ activeChar?.Character }}</b> safely breaks the remaining
            {{ guess?.poolSize }} candidates into distinct profiles based on the game's feedback. In
            the absolute worst-case scenario, the candidate pool will instantly shrink down to a
            maximum of <strong>{{ guess?.worstCase }}</strong> item(s).
          </p>
          <p class="strategy-note">
            <template v-if="activeInPool">
              🎯 <b>In Pool:</b> This character is among the remaining candidates. You win instantly
              if they are the target.
            </template>
            <template v-else>
              ⚠️ <b>Sacrificial Pick:</b> This character is an outside tactical pick designed
              specifically to partition the remaining pool cleanly.
            </template>
          </p>

          <!-- Primary action: Use as Guess + all optimal chips — above the breakdown -->
          <button class="btn-use-guess" @click="startGuess()">▶ Use as Guess</button>

          <div v-if="allOptimalChars.length > 1" class="alternatives-section">
            <span class="alt-title">All optimal:</span>
            <button
              v-for="opt in allOptimalChars.slice(0, 8)"
              :key="opt.selection.Character"
              :class="[
                'alt-chip',
                { 'alt-in-pool': opt.inPool, 'alt-active': opt.selection.Character === activeChar?.Character },
              ]"
              @click="
                displayedChar =
                  opt.selection.Character === activeChar?.Character ? displayedChar : opt.selection
              "
            >
              {{ opt.selection.Character }}
            </button>
            <span v-if="allOptimalChars.length > 8" class="alt-overflow">
              +{{ allOptimalChars.length - 8 }} more
            </span>
          </div>

          <!-- Outcome breakdown -->
          <div class="breakdown-section">
            <div class="breakdown-title">Possible Outcomes</div>
            <details
              v-for="grp in activeBreakdown"
              :key="grp.key"
              class="breakdown-row"
              :class="{ 'row-worst': grp.isWorstCase, 'row-win': grp.isWin }"
            >
              <summary class="breakdown-summary">
                <div class="sig-chips">
                  <span
                    v-for="chip in parseKeyToChips(grp.key)"
                    :key="chip.label"
                    :class="['sig-chip', `chip-${chip.state}`]"
                    >{{ chip.label }}</span
                  >
                </div>
                <span class="sig-count"
                  >{{ grp.count }} candidate{{ grp.count !== 1 ? 's' : '' }}</span
                >
                <span v-if="grp.isWin" class="row-badge win-badge">🎯 Win!</span>
                <span v-else-if="grp.isWorstCase" class="row-badge worst-badge">Worst</span>
              </summary>
              <div class="char-list">
                {{ grp.characters.map((c) => c.Character).join(', ') }}
              </div>
            </details>
          </div>
        </div>
      </template>
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

/* Pool table row guess button */
.btn-row-guess {
  background: none;
  border: 1.5px solid var(--border-color);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--accent-pink);
  transition: all 0.15s;
  padding: 0;
}
.btn-row-guess:hover {
  background: var(--accent-pink);
  color: #fff;
  border-color: var(--accent-pink);
}

/* "Use as Guess" gold button */
.btn-use-guess {
  margin-top: 14px;
  width: 100%;
  background: var(--accent-gold);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(255, 177, 43, 0.3);
}
.btn-use-guess:hover {
  filter: brightness(0.9);
  transform: translateY(-1px);
}

/* All optimal chips */
.alternatives-section {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.alt-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: bold;
}
.alt-chip {
  background: var(--bg-page);
  border: 1.5px solid var(--border-color);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s;
}
.alt-chip:hover:not(.alt-active) {
  border-color: var(--accent-pink);
  color: var(--accent-pink);
}
.alt-in-pool {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
  font-weight: 600;
}
.alt-active {
  background: var(--accent-pink);
  color: #fff;
  border-color: var(--accent-pink);
  font-weight: 600;
}
.alt-in-pool.alt-active {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
}
.alt-overflow {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Outcome breakdown */
.breakdown-section {
  margin-top: 16px;
}
.breakdown-title {
  font-weight: bold;
  color: var(--accent-pink);
  font-size: 0.9rem;
  margin-bottom: 8px;
}
.breakdown-row {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 4px;
  overflow: hidden;
}
.breakdown-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 7px 10px;
  list-style: none;
  user-select: none;
  flex-wrap: wrap;
}
.breakdown-summary::-webkit-details-marker {
  display: none;
}
.breakdown-summary::before {
  content: '▶';
  font-size: 0.6rem;
  color: var(--text-muted);
  transition: transform 0.15s;
  flex-shrink: 0;
}
.breakdown-row[open] .breakdown-summary::before {
  transform: rotate(90deg);
}
.row-worst > .breakdown-summary {
  background: #fff0f0;
}
.row-win > .breakdown-summary {
  background: #f0fff4;
}

/* Colored attribute chips in breakdown rows */
.sig-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.sig-chip {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 5px;
  white-space: nowrap;
}
.chip-match {
  background: #e6f9ed;
  color: #2e7d32;
}
.chip-wrong {
  background: #fde8e8;
  color: #c62828;
}
.chip-hint {
  background: #fff8e1;
  color: #795300;
}

.sig-count {
  margin-left: auto;
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 600;
  white-space: nowrap;
}
.row-badge {
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 20px;
  white-space: nowrap;
}
.worst-badge {
  background: #fde8e8;
  color: #c62828;
}
.win-badge {
  background: #e6f9ed;
  color: #2e7d32;
}
.char-list {
  padding: 6px 12px 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
  line-height: 1.6;
}

/* Feedback form */
.feedback-box {
  background: #fff;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
  box-shadow: var(--shadow-soft);
}
.feedback-header {
  color: var(--text-muted);
  font-weight: bold;
  margin-bottom: 14px;
  font-size: 0.95rem;
}
.feedback-attr-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}
.feedback-attr-row:last-of-type {
  border-bottom: none;
}
.feedback-label {
  font-weight: bold;
  color: var(--accent-pink);
  min-width: 65px;
  font-size: 0.9rem;
}
.version-value {
  font-weight: bold;
  color: var(--text-main);
}
.toggle-group {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
}
.toggle-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 2px solid var(--border-color);
  background: #fff;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.toggle-btn:hover {
  border-color: var(--accent-pink);
  color: var(--accent-pink);
}
.toggle-btn.active-match {
  background: #e6f9ed;
  border-color: #4caf50;
  color: #2e7d32;
}
.toggle-btn.active-wrong {
  background: #fde8e8;
  border-color: #e53935;
  color: #b71c1c;
}
.toggle-btn.active-hint {
  background: #fff8e1;
  border-color: var(--accent-gold);
  color: #795300;
}
.feedback-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.feedback-cancel-btn {
  background: transparent;
  border: 2px solid var(--border-color);
  color: var(--text-muted);
  border-radius: 25px;
  padding: 7px 18px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}
.feedback-cancel-btn:hover {
  border-color: var(--accent-pink);
  color: var(--accent-pink);
}
.feedback-correct-btn {
  background: #e6f9ed;
  border: 2px solid #4caf50;
  color: #2e7d32;
  border-radius: 25px;
  padding: 7px 18px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.15s;
}
.feedback-correct-btn:hover {
  background: #4caf50;
  color: #fff;
}
</style>
