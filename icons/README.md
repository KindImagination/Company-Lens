# Icons

This directory contains placeholder icons for the Kununu Badge extension.

## Converting SVG to PNG

The extension requires PNG icons in multiple sizes. To convert the provided `icon.svg` to PNG:

### Option 1: Online Converter
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to PNG at these sizes:
   - 16x16 → save as `icon16.png`
   - 32x32 → save as `icon32.png`
   - 48x48 → save as `icon48.png`
   - 128x128 → save as `icon128.png`

### Option 2: Using ImageMagick (if installed)
```bash
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 32x32 icon32.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

### Option 3: Using Inkscape (if installed)
```bash
inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon32.png --export-width=32 --export-height=32
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

## Temporary Workaround

If you don't want to convert icons right now, Chrome will still load the extension but may show a warning. The extension will function normally.

For a quick fix, you can create simple colored squares as placeholder PNGs using any image editor or online tool.

