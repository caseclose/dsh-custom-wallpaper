# dsh-custom-wallpaper

A configurable custom wallpaper plugin for the **DeepSeek Harness** Web UI.

Set any image as the background behind the whole app, with a live-preview
settings row, a grouped wallpaper picker, presets and per-theme veil colours.

> ⚠️ **This repository contains no third-party artwork.** The only bundled
> image is `assets/default.svg`, an original placeholder. You supply the
> wallpapers yourself — see [Adding wallpapers](#adding-wallpapers). Do not
> commit copyrighted game art or downloaded stock photos to a public fork.

## Features

- **One shared configuration**: a single image and one set of values for both
  light and dark themes. CSS switches the veil / surface colours automatically
  (white veil in light mode, black veil in dark mode); no duplicate settings.
- **Image sources**: a local library (`assets/`, grouped dropdown) or any image URL.
- **Display**: `cover` / `contain` / fixed pixel width, plus X/Y focus.
- **Appearance**: wallpaper opacity, readability scrim, panel translucency,
  wallpaper blur and frosted-glass blur.
- **Presets**: Original / Soft / Clear / Eye care, or Custom.
- Settings persist in DSH's official settings document, survive restarts and
  apply immediately (`.volatile()` fields).

## Install

From npm (after publishing):

```sh
dsh plugin --profile web add dsh-custom-wallpaper
```

From a local checkout:

```sh
dsh plugin --profile web add /path/to/dsh-custom-wallpaper
```

Then reload the Web page. Configure it in
**Settings → General → Custom wallpaper** (or **Settings → Plugins** for the
generated full form).

## Adding wallpapers

1. Put your images in `assets/` (JPG / PNG / WebP / AVIF / SVG).
2. Run `python3 tools/build-client.py` (or `npm run build`).
3. Reload the page — new files appear in the picker.

Entries are derived by scanning `assets/` at build time. For nicer labels and
custom groups, copy `wallpaper-catalog.example.json` to
`wallpaper-catalog.json` and edit it. Both files are metadata only; neither
contains images.

## Configuration

| Field | Meaning |
|---|---|
| `enabled` | Remove the wallpaper and all overrides when off |
| `preset` | `original` / `soft` / `clear` / `eyeCare` / `custom` |
| `imageSource` | `library` / `url` |
| `imageUrl`, `assetName` | URL or library file name |
| `fit` | `fixed` / `cover` / `contain` |
| `fixedWidth`, `positionX`, `positionY` | Size and focus |
| `opacity`, `scrim`, `panelAlpha` | Wallpaper / veil / panel strength |
| `wallpaperBlur`, `glassBlur` | Optional blur effects |

## Development

```sh
python3 tools/build-client.py   # regenerate client.js
node tools/smoke-test.js        # headless checks
npm pack --dry-run              # inspect the publishable tarball
```

`tools/client-template.js` is the source of the browser module;
`tools/build-client.py` injects the dictionaries and the asset list into it.
The Host half is `index.js` (Config schema), activated by `cordis.patch.yml`.

## Copyright

- Plugin code: MIT, see [LICENSE](LICENSE).
- `icon.svg` and `assets/default.svg`: original artwork for this project.
- Wallpapers you add: whatever license **you** hold. Game artwork (e.g.
  Wuthering Waves © KURO GAMES, Honkai: Star Rail © miHoYo / HoYoverse) and
  stock photos are **not** covered by this repository's license and are not
  distributed here.

Third-party rights remain with their respective owners. Use such images only
in ways their own terms allow.
