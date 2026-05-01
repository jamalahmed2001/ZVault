#!/bin/bash
set -euo pipefail

# Minimal container entrypoint — wallet orchestration is driven by the host
# TypeScript engine via `docker exec`. This script only keeps the container alive.

export RUST_LOG=error

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Container started. Awaiting orchestration via docker exec."

# Create wallet directories on the shared volume so data persists across restarts
mkdir -p /shared/wallet1 /shared/wallet2

# Create log file for /shared-log endpoint (orchestrator will append)
{
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ========== CONTAINER BOOTSTRAP =========="
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Wallet dirs: /shared/wallet1, /shared/wallet2"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Orchestrator will drive flow via docker exec."
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] =========================================="
} > /shared/shielding-process.log

# Signal readiness
echo '{"ready":true,"ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > /shared/container-ready.json

# Keep container alive indefinitely — tini handles signal forwarding
exec tail -f /dev/null
