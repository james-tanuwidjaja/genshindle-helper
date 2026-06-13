// Build-time icon map. Vite resolves each PNG to a content-hashed URL anchored
// to the configured `base`, so icons load correctly both locally and on GitHub
// Pages without any runtime path detection.
const iconModules = import.meta.glob<string>('../assets/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

type Category = 'elements' | 'weapons' | 'regions'

// Turn "../assets/elements/pyro.png" -> { elements: { pyro: "<hashed url>" }, ... }
const icons: Record<Category, Record<string, string>> = {
  elements: {},
  weapons: {},
  regions: {},
}
for (const [path, url] of Object.entries(iconModules)) {
  const match = path.match(/\/assets\/(\w+)\/(.+)\.png$/)
  if (!match) continue
  const category = match[1] as Category
  const name = match[2].toLowerCase()
  if (icons[category]) icons[category][name] = url
}

// Per-element accent colors (ported from the original assets.js).
export const elementColors: Record<string, string> = {
  pyro: '#EC4923',
  hydro: '#00BFFF',
  anemo: '#359697',
  electro: '#945DC4',
  dendro: '#608A00',
  cryo: '#46A8BA',
  geo: '#DEBD6C',
}

export function elementIcon(name: string | number): string | null {
  return icons.elements[String(name).toLowerCase()] ?? null
}

export function weaponIcon(name: string | number): string | null {
  return icons.weapons[String(name).toLowerCase()] ?? null
}

export function regionIcon(name: string | number): string | null {
  return icons.regions[String(name).toLowerCase()] ?? null
}

export function elementColor(name: string | number): string {
  return elementColors[String(name).toLowerCase()] ?? 'inherit'
}
