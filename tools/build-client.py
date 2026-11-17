#!/usr/bin/env python3
"""Build client.js from tools/client-template.js.

The wallpaper picker is generated from images in assets/ at build time (or from
an optional wallpaper-catalog.json for custom labels/groups). No third-party
artwork ships in this repository -- add your own images to assets/ first.

Usage: python3 tools/build-client.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
BUNDLE = TOOLS.parent
TEMPLATE = TOOLS / "client-template.js"
CLIENT = BUNDLE / "client.js"
ASSETS_DIR = BUNDLE / "assets"
CATALOG_FILE = BUNDLE / "wallpaper-catalog.json"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg", ".gif"}

ZH = {
    "title": "自定义壁纸",
    "description": "自定义背景壁纸。可从图库或 URL 换图，调填充方式、遮罩、透明度与模糊；一套配置，深浅主题自动适配，松手即存。",
    "enabled": "启用壁纸",
    "preview": "预览 Preview",
    "preset": "预设方案",
    "presetOriginal": "原版",
    "presetSoft": "淡雅",
    "presetClear": "清晰",
    "presetEyeCare": "护眼",
    "presetCustom": "自定义",
    "imageSource": "图片来源",
    "sourceUrl": "图片 URL",
    "sourceLibrary": "本地图库",
    "imageUrl": "图片地址",
    "assetName": "选择壁纸",
    "assetCustom": "自定义文件名…",
    "assetFileName": "或手动输入文件名",
    "fit": "填充方式",
    "fitFixed": "固定宽度",
    "fitCover": "铺满 (cover)",
    "fitContain": "完整 (contain)",
    "fixedWidth": "固定宽度 (px)",
    "positionX": "水平取景 (%)",
    "positionY": "垂直取景 (%)",
    "opacity": "壁纸不透明度 (%)",
    "scrim": "可读性遮罩 (%)",
    "panelAlpha": "面板不透明度 (%)",
    "wallpaperBlur": "壁纸模糊 (px)",
    "glassBlur": "面板毛玻璃 (px)",
    "reset": "恢复原版预设",
    "assetHint": "图片在插件 assets/ 目录，可自行添加后手动输入文件名",
    "saveHint": "滑块松手才保存；改动即时生效",
}

EN = {
    "title": "Custom wallpaper",
    "description": "Custom background wallpaper. Pick an image from the library or a URL, adjust fit, scrim, opacity and blur; one shared setting adapts to both themes. Changes save on release.",
    "enabled": "Enable wallpaper",
    "preview": "Preview",
    "preset": "Preset",
    "presetOriginal": "Original",
    "presetSoft": "Soft",
    "presetClear": "Clear",
    "presetEyeCare": "Eye care",
    "presetCustom": "Custom",
    "imageSource": "Image source",
    "sourceUrl": "Image URL",
    "sourceLibrary": "Local library",
    "imageUrl": "Image URL",
    "assetName": "Choose wallpaper",
    "assetCustom": "Custom file name…",
    "assetFileName": "Or type a file name",
    "fit": "Fit",
    "fitFixed": "Fixed width",
    "fitCover": "Cover (crop)",
    "fitContain": "Contain (full)",
    "fixedWidth": "Fixed width (px)",
    "positionX": "Focus X (%)",
    "positionY": "Focus Y (%)",
    "opacity": "Wallpaper opacity (%)",
    "scrim": "Readability scrim (%)",
    "panelAlpha": "Panel opacity (%)",
    "wallpaperBlur": "Wallpaper blur (px)",
    "glassBlur": "Frosted glass (px)",
    "reset": "Reset to original preset",
    "assetHint": "Images live in the plugin's assets/ folder; add your own and type its name",
    "saveHint": "Sliders save on release; changes apply immediately",
}

# The row title comes from the locale files (single source of truth), so the
# Plugin Manager name and the settings-row heading can never drift apart.
LOCALES = ("en", "zh", "de", "es", "fr", "ja", "pt", "ru")
TITLES = {
    p.stem: json.loads(p.read_text(encoding="utf-8"))["meta"]["title"]
    for p in (BUNDLE / "locale").glob("*.json")
}
DICT = {}
for code in LOCALES:
    DICT[code] = dict(ZH if code == "zh" else EN)
    DICT[code]["title"] = TITLES.get(code, EN["title"])


def titleize(stem: str) -> str:
    words = [w for w in re.split(r"[-_\s]+", stem) if w]
    if not words:
        return stem
    return " ".join(w[:1].upper() + w[1:] for w in words)


def scan_assets() -> list[dict]:
    """Derive picker entries from the files the user placed in assets/."""
    entries = []
    for p in sorted(ASSETS_DIR.iterdir(), key=lambda q: q.name.lower()):
        if not p.is_file() or p.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        stem = p.stem
        head = stem.split("-", 1)[0]
        group = titleize(head) if "-" in stem else "Wallpapers"
        label = titleize(stem)
        entries.append({"file": p.name, "zh": label, "en": label,
                        "groupZh": group, "groupEn": group})
    return entries


def from_catalog() -> list[dict]:
    """Optional richer labels/groups; see wallpaper-catalog.example.json."""
    raw = json.loads(CATALOG_FILE.read_text(encoding="utf-8"))
    result = []
    for e in raw:
        zh, en = e.get("zh") or titleize(Path(e["file"]).stem), e.get("en") or titleize(Path(e["file"]).stem)
        result.append({"file": e["file"], "zh": zh, "en": en,
                       "groupZh": zh.split(" · ")[0], "groupEn": en.split(" · ")[0]})
    return result


ASSETS = from_catalog() if CATALOG_FILE.exists() else scan_assets()


def main() -> None:
    text = TEMPLATE.read_text(encoding="utf-8")
    out = (text
           .replace("__DICT__", json.dumps(DICT, ensure_ascii=False))
           .replace("__ASSETS__", json.dumps(ASSETS, ensure_ascii=False)))
    CLIENT.write_text(out, encoding="utf-8")
    print("library entries:", len(ASSETS), "(from catalog)" if CATALOG_FILE.exists() else "(scanned from assets/)")
    print("client.js:", CLIENT.stat().st_size, "bytes ->", CLIENT)


if __name__ == "__main__":
    main()
