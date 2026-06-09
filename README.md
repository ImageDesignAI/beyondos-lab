# BeyondOS Lab

The research-lab landing page for **Beyond / BeyondOS** — an AI research lab building the
foundational workflows for how interactive content gets *made, operated, and monetised.*

Positioned in the spirit of a frontier research lab (à la General Intuition) and built on the
**Makermint** design system (Geist / Geist Mono, mint-on-ink palette).

## Stack

Plain **HTML / CSS / JS** — no build step, no framework, no dependencies to install. Open
`index.html` in a browser or serve the folder statically.

```
.
├── index.html            # the page
├── css/
│   ├── tokens.css        # Makermint design system — colors + type tokens
│   └── lab.css           # page styles (theme, layout, hero, mission, footer, field panel)
├── js/
│   ├── beyond-field.js   # generative monospace glyph/tilemap field (fixed backdrop + mission art panel)
│   ├── beyond-scene.js   # original 8-bit platformer pixel world (hero backdrop)
│   ├── beyond-flappy.js  # original endless-flyer pixel scene (mission art panel)
│   └── main.js           # page bootstrap — mounts scenes, sticky header, tabs, smooth scroll, field panel
└── assets/
    └── favicon.ico
```

### Visual notes
- **Dark, austere, mint-warmed.** Mint accents on deep ink keep it on-brand (Beyond, not a clone).
- **Hero** sits in a solid card over an *original* 8-bit pixel world (sky, clouds, hills, floating
  blocks + coin, goal flag, and a mint "agent" sprite) with an animated glyph field drifting on top.
- **Mission** uses a full-width left-aligned title and a two-column split: stacked text rows on the
  left, an *original* Flappy-genre pixel scene (mint bird, gapped pillars) as the art panel on the right.
- A diegetic **"Field"** control (bottom-right) tunes the glyph field's cell size, density, motion,
  and glyph set. Hidden on small screens.
- Fully responsive — single-column stacking at phone widths.

All pixel/canvas art is **original** (drawn from scratch); no third-party game IP is used.

## Run locally

Any static server works, e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Provenance

Recreated from a Claude Design handoff bundle (`BeyondOS Lab.html` prototype). The design-time React
"Tweaks" overlay from the prototype is intentionally **not** shipped here — it was a theme/field
authoring tool, not a product feature. The accent/theme system it drove remains available
programmatically via `window.__applyMode(mode)` and `window.__applyAccent("R G B")`.

## TODO / placeholders
- `About`, `Privacy`, `Terms` footer links point to `#` — wire real URLs.
- `Atinum Ventures` investor link is a `#` placeholder pending its URL.
- `Consumer` / `Enterprise` top tabs toggle active state only; no content/views behind them yet.
