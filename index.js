/** Host half: declare the live, user-editable configuration namespace. */
import z from '@deepseek-ai/schemastery'

/** Every field is volatile so a settings edit repaints without restarting the plugin. */
export const Config = z.object({
  enabled: z.boolean().default(true).volatile(),
  preset: z.union(['original', 'soft', 'clear', 'eyeCare', 'custom']).default('original').volatile(),

  // One image, shared by both themes.
  imageSource: z.union(['library', 'url']).default('library').volatile(),
  imageUrl: z.string().default('').volatile(),
  assetName: z.string().default('illustration-official-landscape.jpg').volatile(),

  // One set of display and appearance values. The veil/surface colours are
  // chosen by CSS per theme, so there is no second copy of these settings.
  fit: z.union(['cover', 'contain', 'fixed']).default('fixed').volatile(),
  fixedWidth: z.number().step(1).min(320).max(7680).default(1920).volatile(),
  positionX: z.number().step(1).min(0).max(100).default(50).volatile(),
  positionY: z.number().step(1).min(0).max(100).default(50).volatile(),
  opacity: z.number().step(1).min(0).max(100).default(100).volatile(),
  scrim: z.number().step(1).min(0).max(95).default(12).volatile(),
  panelAlpha: z.number().step(1).min(0).max(100).default(26).volatile(),
  wallpaperBlur: z.number().step(1).min(0).max(60).default(0).volatile(),
  glassBlur: z.number().step(1).min(0).max(40).default(0).volatile(),
})

export function apply(ctx) {
  // Registers `custom-wallpaper` in the official settings document and lets
  // Plugin Manager render a configuration form for the schema above.
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({}, ctx.fiber))
  })
}
