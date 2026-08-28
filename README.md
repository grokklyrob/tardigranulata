# tardigranulata

A dark, full-viewport [Spark](https://github.com/sparkjsdev/spark) viewer for a Gaussian splat of a neon line-art tardigrade.

The splat is a nearly flat painted card (not a round creature). It was generated with [fal.ai SAM 3D Objects](https://fal.ai) from a 2D drawing, then loaded locally as `assets/tardigrade.ply`.

Spark is a THREE.js 3D Gaussian splatting renderer built by [World Labs](https://www.worldlabs.ai).

## Run locally

No build step. Serve the repo root over HTTP (import maps and the `.ply` need a static server, not `file://`):

```bash
python -m http.server 8080
```

or

```bash
npx serve
```

Then open the printed localhost URL.

Drag to orbit, scroll to zoom.

## Credits

- Renderer: [Spark](https://github.com/sparkjsdev/spark) by World Labs (`@sparkjsdev/spark` 2.1.0, `three` 0.180.0)
- Splat: SAM 3D Objects (fal.ai) from a neon line-art tardigrade drawing
