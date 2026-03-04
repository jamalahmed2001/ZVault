#!/bin/bash
set -e

log() {
  echo "[$(date +'%H:%M:%S')] $*"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log "Starting release build..."
rm -rf release
mkdir -p release/ZPAY release/Z-vault-admin

# --- Backend (ZPAY) ---
log "[1/4] Packaging backend (ZPAY)"
cd ZPAY
log "  Building backend from source..."
pnpm build || true
if [ ! -f dist/index.js ]; then
  log "ERROR: tsc produced no output. Check ZPAY/src for issues."
  exit 1
fi
log "  Copying dist to release/ZPAY/dist..."
cp -r dist ../release/ZPAY/dist
log "  Copying package files..."
cp package.json ../release/ZPAY/
cp pnpm-lock.yaml ../release/ZPAY/
[ -f Readme.md ] && cp Readme.md ../release/ZPAY/ || true
[ -f tsconfig.json ] && cp tsconfig.json ../release/ZPAY/ || true
log "  Copying create-db.sql..."
cp create-db.sql ../release/ZPAY/
for f in .env* *.sql *.pem; do
  [ -e "$f" ] && cp -f "$f" ../release/ZPAY/
done
log "  Copying shared directory..."
cp -r shared ../release/ZPAY/
cd "$SCRIPT_DIR"
log "[2/4] ✓ Backend packaged"

# --- Frontend (Z-vault-admin) ---
log "[3/4] Building frontend (Z-vault-admin) - MUST rebuild to bake env vars"
cd "$SCRIPT_DIR/Z-vault-admin"
log "  Removing old dist..."
rm -rf dist

# Always run pnpm install - it's fast if node_modules is complete, fixes if incomplete
log "  Installing/verifying dependencies (pnpm is smart - fast if already installed)..."
pnpm install

log "  Building with Vite (baking VITE_API_KEY and VITE_API_BASE_URL into bundle)..."
pnpm build
log "  Removing source maps..."
find dist -name "*.map" -type f -delete
log "  Copying dist to release..."
cp -r dist "$SCRIPT_DIR/release/Z-vault-admin/"
[ -d public ] && cp -r public "$SCRIPT_DIR/release/Z-vault-admin/" || true
cp package.json "$SCRIPT_DIR/release/Z-vault-admin/"
cp pnpm-lock.yaml "$SCRIPT_DIR/release/Z-vault-admin/"
[ -f README.md ] && cp README.md "$SCRIPT_DIR/release/Z-vault-admin/" || true
for f in .env* *.sql *.pem; do
  [ -e "$f" ] && cp -f "$f" "$SCRIPT_DIR/release/Z-vault-admin/"
done
cd "$SCRIPT_DIR"
log "[4/4] ✓ Frontend built and packaged"

# --- Deployment files ---
log "Copying deployment files..."
cp deploy.sh release/
[ -f ecosystem.config.js ] && cp ecosystem.config.js release/
[ -f zcash-wallets.tar ] && cp zcash-wallets.tar release/ && log "  ✓ Copied zcash-wallets.tar"

log "✓ All components packaged in ./release/"
