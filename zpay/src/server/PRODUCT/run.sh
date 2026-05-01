#!/bin/bash
set -euo pipefail

# Minimal container entrypoint - wallet orchestration is driven by the host
# TypeScript engine via 'docker exec'. This script only keeps the container alive.

export RUST_LOG=error

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Container started. Awaiting orchestration via docker exec."

# Create wallet directories on the shared volume so data persists across restarts.
# Make them world-writable so the host orchestrator (running as a non-root user)
# can drop log entries and metadata files into the same dir without ownership wars.
mkdir -p /shared/wallet1 /shared/wallet2
chmod 0777 /shared /shared/wallet1 /shared/wallet2 2>/dev/null || true

# IMPORTANT: do NOT create /shared/shielding-process.log here. The host
# TypeScript engine is the sole writer for that file and will create it on
# its first appendSharedLog call. Letting the container create it would
# leave it root-owned and silently break appendSharedLog.

# Signal readiness (separate file - safe to create as root, host does not write to this)
echo '{"ready":true,"ts":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > /shared/container-ready.json
chmod 0666 /shared/container-ready.json 2>/dev/null || true

# Keep container alive indefinitely - tini handles signal forwarding
exec tail -f /dev/null
