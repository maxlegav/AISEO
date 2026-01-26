# AISEO Assets - To Be Replaced

⚠️ **IMPORTANT:** All assets in this directory are placeholders from Auto-Invoice and must be replaced with AISEO branding.

## Assets Requiring Replacement

### Logos
- [ ] `AutoLogo.png` → Replace with AISEO logo (high-res)
- [ ] `logo.png` → Replace with AISEO logo (standard)
- [ ] `logoAndName.png` → Replace with AISEO logo with text

### Favicons & Icons
- [ ] `favicon.ico` → AISEO favicon (16x16, 32x32, 48x48)
- [ ] `favicon-16x16.png` → AISEO 16x16
- [ ] `favicon-32x32.png` → AISEO 32x32
- [ ] `apple-touch-icon.png` → AISEO iOS icon (180x180)
- [ ] `android-chrome-192x192.png` → AISEO Android icon (192x192)
- [ ] `android-chrome-512x512.png` → AISEO Android icon (512x512)
- [ ] `mstile-150x150.png` → AISEO Windows tile (150x150)
- [ ] `safari-pinned-tab.svg` → AISEO Safari tab icon (SVG, monochrome)

## Design Guidelines

### AISEO Brand Colors (from UX Design spec)
- **Primary Blue:** #3B82F6
- **Success Green:** #10B981
- **Error Red:** #EF4444
- **Warning Orange:** #F59E0B
- **Neutral Gray:** #6B7280

### Logo Requirements
- Must work on both light and dark backgrounds
- SVG format preferred for scalability
- PNG exports at 1x, 2x, 3x for Retina displays
- Monochrome variant for favicons

### Favicon Requirements
- Use Favicon Generator (e.g., realfavicongenerator.net)
- Upload AISEO logo
- Generate all sizes and formats
- Test on multiple browsers and devices

## Quick Steps to Replace

1. **Get AISEO Logo from Designer**
   - Request SVG master file
   - Request PNG exports (multiple sizes)
   - Request monochrome variant

2. **Generate Favicons**
   - Use https://realfavicongenerator.net/
   - Upload AISEO logo (512x512 PNG recommended)
   - Download favicon package
   - Replace all files in public/

3. **Update References**
   - Check components for hardcoded image paths
   - Update site.webmanifest (already updated)
   - Update browserconfig.xml (already updated)
   - Test all pages to ensure logos display correctly

4. **Delete This File**
   - Once all assets replaced, delete ASSETS_TODO.md

## References in Code

Search codebase for these references:
- `AutoLogo.png`
- `logo.png`
- `logoAndName.png`

Update all imports to point to new AISEO assets.

---

**Note:** Configuration files (site.webmanifest, browserconfig.xml) have been pre-updated for AISEO. Only asset files need replacement.
