#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

blender -b --python blender/run_ponton_g.py

echo
printf 'Generated:\n'
printf '  blender/ponton_g.blend\n'
printf '  public/assets/models/ponton-g.glb\n'
printf '  public/assets/models/ponton-g.manifest.json\n'
printf '  public/assets/previews/ponton-g-preview.png\n'
