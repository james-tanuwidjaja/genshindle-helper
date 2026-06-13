<script setup lang="ts">
import { computed } from 'vue'
import { elementIcon, weaponIcon, regionIcon, elementColor } from '@/lib/genshinAssets'

type AttrType = 'Quality' | 'Element' | 'Weapon' | 'Region'

const props = defineProps<{
  type: AttrType
  value: string | number
}>()

const icon = computed<string | null>(() => {
  if (props.type === 'Element') return elementIcon(props.value)
  if (props.type === 'Weapon') return weaponIcon(props.value)
  if (props.type === 'Region') return regionIcon(props.value)
  return null
})

const color = computed(() => {
  if (props.type === 'Quality') {
    return String(props.value) === '5' ? 'var(--quality-5)' : 'var(--quality-4)'
  }
  if (props.type === 'Element') return elementColor(props.value)
  return 'inherit'
})

const isQuality = computed(() => props.type === 'Quality')
</script>

<template>
  <span v-if="isQuality" class="quality-star" :style="{ color }"> {{ value }}★ </span>
  <span v-else class="attr-tag">
    <img v-if="icon" :src="icon" class="asset-icon" :alt="String(value)" />
    <span :style="{ color, fontWeight: type === 'Element' ? 'bold' : 'normal' }">
      {{ value }}
    </span>
  </span>
</template>

<style scoped>
.attr-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.quality-star {
  font-weight: bold;
  font-size: 1.1rem;
}
</style>
