#!/bin/bash
set -euo pipefail # Exit on error, unset var, pipe fail
OUTPUT_DIR="/shared" # Output directory will NOT be cleaned up

LOG_FILE="$OUTPUT_DIR/shielding-process.log"

# Ensure log file directory exists and truncate log file at start
mkdir -p "$(dirname "$LOG_FILE")"
>"$LOG_FILE" # Truncate log file at the beginning of the script run

# New logging functions
log_console() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] (CONSOLE) $*"
}

log_to_file() {
    # This function logs non-sensitive, high-level process information to the log file.
    # It must avoid logging specific wallet addresses, detailed transaction data, raw secret keys,
    # or other information that could compromise security or reveal too much about the internal workings.
    # Focus on stages, high-level outcomes, and errors in a generic way.
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] (FILE) $*" >> "$LOG_FILE"
}

# --- Environment Variable Check ---
log_console "[START] Checking required environment variables for shielding process..."
log_to_file "[START] Checking required environment variables."
REQUIRED_VARS=("EXODUS_WALLET" "FEE_PERCENTAGE" "FEE_DESTINATION_ADDR" "CONTAINER_TIMEOUT")
OPTIONAL_VARS=("WEBHOOK_URL" "WEBHOOK_SECRET")
MISSING_VARS=()
for VAR in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!VAR:-}" ]]; then
        MISSING_VARS+=("$VAR")
    fi
done
if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    missing_vars_string="${MISSING_VARS[*]}"
    log_console "[FAIL] Missing required environment variables: ${missing_vars_string}. Aborting shielding process."
    log_to_file "[FAIL] Missing required environment variables: ${missing_vars_string}. Aborting."
    echo "❌ ERROR: Required environment variables are not set: ${missing_vars_string}"
    exit 1
fi
for VAR in "${OPTIONAL_VARS[@]}"; do
    if [[ -z "${!VAR:-}" ]]; then
        log_console "[INFO] Optional environment variable ${VAR} is not set."
        log_to_file "[INFO] Optional environment variable ${VAR} is not set."
    fi
done
log_console "[OK] All required environment variables are set."
log_to_file "[OK] All required environment variables are set."

# Set container timeout from env or default
CONTAINER_TIMEOUT="${CONTAINER_TIMEOUT:-1800}"

# --- Logging Setup ---
log_console "[INIT] Console logging active."
log_to_file "[INIT] File logging initialized. Non-sensitive process steps will be recorded to $LOG_FILE."

# --- Fail-safe: Send all funds to Exodus on crash/failure ---
fail_safe_triggered=false
fail_safe_send_to_exodus() {
    if [ "$fail_safe_triggered" = true ]; then
        return
    fi
    fail_safe_triggered=true
    log_console "[FAIL-SAFE] Triggered. Attempting to send all available funds to Exodus wallet: $EXODUS_WALLET."
    log_to_file "[FAIL-SAFE] Triggered. Attempting to send all available funds to Exodus wallet."
    # Try Wallet 1
    W1_BAL=$(zingo-cli --data-dir "$WALLET1_DIR" balance 2>/dev/null)
    W1_SPENDABLE=$(echo "$W1_BAL" | jq -s '.[1].spendable_sapling_balance // 0' 2>/dev/null)
    W1_ORCHARD=$(echo "$W1_BAL" | jq -s '.[1].spendable_orchard_balance // 0' 2>/dev/null)
    W1_TOTAL=$(echo "${W1_SPENDABLE:-0} + ${W1_ORCHARD:-0}" | bc)
    if echo "$W1_TOTAL > 20000" | bc -l | grep -q 1; then
        AMT=$(echo "$W1_TOTAL - 20000" | bc)
        log_console "[FAIL-SAFE] Sending $AMT Zatoshi from Wallet 1 to Exodus."
        zingo-cli --data-dir "$WALLET1_DIR" quicksend "$EXODUS_WALLET" "$AMT" 2>&1 | tee -a "$LOG_FILE"
    fi
    # Try Wallet 2
    W2_BAL=$(zingo-cli --data-dir "$WALLET2_DIR" balance 2>/dev/null)
    W2_SPENDABLE=$(echo "$W2_BAL" | jq -s '.[1].spendable_sapling_balance // 0' 2>/dev/null)
    W2_ORCHARD=$(echo "$W2_BAL" | jq -s '.[1].spendable_orchard_balance // 0' 2>/dev/null)
    W2_TOTAL=$(echo "${W2_SPENDABLE:-0} + ${W2_ORCHARD:-0}" | bc)
    if echo "$W2_TOTAL > 20000" | bc -l | grep -q 1; then
        AMT=$(echo "$W2_TOTAL - 20000" | bc)
        log_console "[FAIL-SAFE] Sending $AMT Zatoshi from Wallet 2 to Exodus."
        zingo-cli --data-dir "$WALLET2_DIR" quicksend "$EXODUS_WALLET" "$AMT" 2>&1 | tee -a "$LOG_FILE"
    fi
    log_console "[FAIL-SAFE] Attempted to send all available funds to Exodus."
    log_to_file "[FAIL-SAFE] Attempted to send all available funds to Exodus."
}

trap fail_safe_send_to_exodus EXIT ERR SIGTERM

log_env_info() {
    log_console "----- ENVIRONMENT DEBUG INFO (Console) -----"
    log_console "Hostname: $(hostname)"
    log_console "EXODUS_WALLET: ${EXODUS_WALLET}"
    log_console "WEBHOOK_URL: ${WEBHOOK_URL}"
    log_console "WEBHOOK_SECRET: ${WEBHOOK_SECRET:0:6}******"
    log_console "FEE_PERCENTAGE: ${FEE_PERCENTAGE}"
    log_console "FEE_DESTINATION_ADDR: ${FEE_DESTINATION_ADDR}"
    log_console "CONTAINER_TIMEOUT: ${CONTAINER_TIMEOUT}"
    log_console "----------------------------------"

    log_to_file "[INFO] Environment settings summary:"
    log_to_file "Hostname: $(hostname)"
    log_to_file "EXODUS_WALLET: [REDACTED_FOR_FILE_LOG]"
    log_to_file "WEBHOOK_URL: ${WEBHOOK_URL}" # URL itself is not a secret
    log_to_file "WEBHOOK_SECRET: [REDACTED_FOR_FILE_LOG]"
    log_to_file "FEE_PERCENTAGE: ${FEE_PERCENTAGE}"
    log_to_file "FEE_DESTINATION_ADDR: [REDACTED_FOR_FILE_LOG]"
    log_to_file "CONTAINER_TIMEOUT: ${CONTAINER_TIMEOUT}"
    log_to_file "----------------------------------"
}
log_env_info

# Validate FEE_PERCENTAGE format (basic check for non-negative number)
if ! [[ "$FEE_PERCENTAGE" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
    log_console "❌ ERROR: FEE_PERCENTAGE environment variable ('$FEE_PERCENTAGE') is not a valid non-negative number."
    log_to_file "❌ ERROR: FEE_PERCENTAGE ('$FEE_PERCENTAGE') is not a valid non-negative number."
    exit 1
fi
if echo "$FEE_PERCENTAGE > 100" | bc -l | grep -q 1; then
    log_console "⚠️ WARNING: FEE_PERCENTAGE ('$FEE_PERCENTAGE') is greater than 100. Is this intended?"
    log_to_file "⚠️ WARNING: FEE_PERCENTAGE ('$FEE_PERCENTAGE') is greater than 100."
fi


# Set minimal logging for zingo-cli
export RUST_LOG=error

# --- Directories and Wallet Addresses ---
log_console "[SETUP] Creating wallet and output directories if not present."
log_to_file "[SETUP] Initializing directories and address variables."
WALLET1_DIR="/data/wallet1"
WALLET2_DIR="/data/wallet2"
EXODUS_WALLET="${EXODUS_WALLET}"
FEE_DESTINATION_ADDR="${FEE_DESTINATION_ADDR:-t1KAwp75AcdZZjSBuEgXQg8iHEDW6CVUitJ}"

log_console "Final destination wallet (Exodus): $EXODUS_WALLET"
log_console "Fee Transfer Address: $FEE_DESTINATION_ADDR"
log_console "Output directory: $OUTPUT_DIR (contents will be preserved)"

log_to_file "Final destination wallet (Exodus): [REDACTED_FOR_FILE_LOG]"
log_to_file "Fee Transfer Address: [REDACTED_FOR_FILE_LOG]"
log_to_file "Output directory: $OUTPUT_DIR"

mkdir -p "$WALLET1_DIR" "$WALLET2_DIR" "$OUTPUT_DIR"

# --- Wallet Initialization ---
log_console "[WALLET] Initializing shielding wallets."
log_to_file "[WALLET] Initializing shielding wallets."
zingo-cli --data-dir "$WALLET1_DIR" --birthday 0 addresses >/dev/null 2>&1 || {
    log_console "❌ ERROR: Failed to initialize Wallet 1";
    log_to_file "❌ ERROR: Failed to initialize Wallet 1";
    exit 1;
}
zingo-cli --data-dir "$WALLET2_DIR" --birthday 0 addresses >/dev/null 2>&1 || {
    log_console "❌ ERROR: Failed to initialize Wallet 2";
    log_to_file "❌ ERROR: Failed to initialize Wallet 2";
    exit 1;
}

# --- Retrieve Wallet Addresses ---
log_console "[WALLET] Retrieving addresses for shielding wallets."
log_to_file "[WALLET] Retrieving addresses for shielding wallets."
log_console "Retrieving Wallet 1 addresses..."
log_to_file "Retrieving Wallet 1 addresses."
TMPFILE1=$(mktemp)
ADDR1_OUTPUT=$(zingo-cli --data-dir "$WALLET1_DIR" addresses 2>&1) || ADDR1_OUTPUT=""
log_console "Wallet 1 'addresses' command raw output (first 200 chars): ${ADDR1_OUTPUT:0:200}..." # Log snippet to console
if ! echo "$ADDR1_OUTPUT" | jq -e . >/dev/null 2>&1; then
    log_console "⚠️ Warning: Wallet 1 addresses output was not valid JSON. Output: $ADDR1_OUTPUT"
    log_to_file "⚠️ Warning: Wallet 1 addresses output was not valid JSON. See console for details."
fi
WALLET1_TRANSPARENT=$(echo "$ADDR1_OUTPUT" | jq -r '.[0].receivers.transparent // empty')
WALLET1_SAPLING=$(echo "$ADDR1_OUTPUT" | jq -r '.[0].receivers.sapling // empty')
rm -f "$TMPFILE1"
if [[ -z "$WALLET1_TRANSPARENT" || -z "$WALLET1_SAPLING" ]]; then
    log_console "❌ ERROR: Failed to retrieve valid addresses for Wallet 1. Transparent: '$WALLET1_TRANSPARENT', Sapling: '$WALLET1_SAPLING'"
    log_to_file "❌ ERROR: Failed to retrieve valid addresses for Wallet 1."
    exit 1
fi
echo "{\"transparent_address\": \"$WALLET1_TRANSPARENT\", \"sapling_address\": \"$WALLET1_SAPLING\"}" >"$OUTPUT_DIR/wallet1-addresses.json"
log_console "Wallet 1 addresses saved to $OUTPUT_DIR/wallet1-addresses.json"
log_to_file "Wallet 1 addresses saved to JSON file."

log_console "Retrieving Wallet 2 shielded address..."
log_to_file "Retrieving Wallet 2 shielded address."
TMPFILE2=$(mktemp)
ADDR2_OUTPUT=$(zingo-cli --data-dir "$WALLET2_DIR" addresses 2>&1) || ADDR2_OUTPUT=""
log_console "Wallet 2 'addresses' command raw output (first 200 chars): ${ADDR2_OUTPUT:0:200}..." # Log snippet to console
if ! echo "$ADDR2_OUTPUT" | jq -e . >/dev/null 2>&1; then
    log_console "⚠️ Warning: Wallet 2 addresses output was not valid JSON. Output: $ADDR2_OUTPUT"
    log_to_file "⚠️ Warning: Wallet 2 addresses output was not valid JSON. See console for details."
fi
WALLET2_SAPLING=$(echo "$ADDR2_OUTPUT" | jq -r '.[0].receivers.sapling // empty')
rm -f "$TMPFILE2"
if [[ -z "$WALLET2_SAPLING" ]]; then
    log_console "❌ ERROR: Failed to retrieve valid shielded address for Wallet 2. Sapling: '$WALLET2_SAPLING'"
    log_to_file "❌ ERROR: Failed to retrieve valid shielded address for Wallet 2."
    exit 1
fi
echo "{\"sapling_address\": \"$WALLET2_SAPLING\"}" >"$OUTPUT_DIR/wallet2-addresses.json"
log_console "Wallet 2 address saved to $OUTPUT_DIR/wallet2-addresses.json"
log_to_file "Wallet 2 address saved to JSON file."

log_console "Wallet 1 transparent address: $WALLET1_TRANSPARENT"
log_console "Wallet 1 shielded address: $WALLET1_SAPLING"
log_console "Wallet 2 shielded address: $WALLET2_SAPLING"
log_to_file "Wallet 1 transparent address: [REDACTED_FOR_FILE_LOG]"
log_to_file "Wallet 1 shielded address: [REDACTED_FOR_FILE_LOG]"
log_to_file "Wallet 2 shielded address: [REDACTED_FOR_FILE_LOG]"


# --- Balance Functions (Assuming Zatoshi Output) ---
log_console "[INFO] Balance functions loaded."
log_to_file "[INFO] Balance functions loaded."
get_transparent_balance() {
    zingo-cli --data-dir "$1" balance 2>/dev/null | jq -s '.[1].transparent_balance // 0' || echo 0
}
get_spendable_balance() {
    local BALANCE_JSON SAPLING_SPENDABLE ORCHARD_SPENDABLE TOTAL_SPENDABLE
    BALANCE_JSON=$(zingo-cli --data-dir "$1" balance 2>/dev/null) || echo ""
    SAPLING_SPENDABLE=$(echo "$BALANCE_JSON" | jq -s '.[1].spendable_sapling_balance // 0' 2>/dev/null) || echo 0
    ORCHARD_SPENDABLE=$(echo "$BALANCE_JSON" | jq -s '.[1].spendable_orchard_balance // 0' 2>/dev/null) || echo 0
    SAPLING_SPENDABLE=${SAPLING_SPENDABLE:-0}
    ORCHARD_SPENDABLE=${ORCHARD_SPENDABLE:-0}
    TOTAL_SPENDABLE=$(echo "$SAPLING_SPENDABLE + $ORCHARD_SPENDABLE" | bc)
    echo "${TOTAL_SPENDABLE:-0}"
}


# --- Hostname Parsing ---
log_console "[INFO] Extracting transaction tracking IDs from request."
log_to_file "[INFO] Parsing hostname for tracking IDs."
CONTAINER_NAME=$(hostname)
log_console "Parsing hostname: $CONTAINER_NAME"
log_to_file "Parsing hostname: $CONTAINER_NAME" # Hostname itself is usually not sensitive
PART1="${CONTAINER_NAME%%_*}"
TMP="${CONTAINER_NAME#*_}"
PART2="${TMP%%_*}"
PART3="${TMP#*_}"
DB_USER_ID_PART="${PART1#DBUID-}"
USER_ID="${PART2#UID-}"
INVOICE_ID="${PART3#IID-}"

if [[ -z "$USER_ID" || -z "$INVOICE_ID" ]]; then
    log_console "❌ ERROR: UID and/or IID are empty after parsing hostname '$CONTAINER_NAME'."
    log_console "Parsed: DBUID='$DB_USER_ID_PART', UID='$USER_ID', IID='$INVOICE_ID'"
    log_to_file "❌ ERROR: UID and/or IID are empty after parsing hostname. Parsed DBUID: '$DB_USER_ID_PART', UID: '$USER_ID', IID: '$INVOICE_ID'."
    exit 1
fi
log_console "Parsed DB User ID part (string): $DB_USER_ID_PART"
log_console "Parsed User ID: $USER_ID"
log_console "Parsed Invoice ID: $INVOICE_ID"
log_to_file "Parsed DB User ID part: $DB_USER_ID_PART"
log_to_file "Parsed User ID: $USER_ID"
log_to_file "Parsed Invoice ID: $INVOICE_ID"

# --- Fee Constants (Zatoshi Integers) ---
FEE_MAIN_TRANSFER_ZATOSHI=20000
FEE_FOR_FEE_TRANSFER_TX_ZATOSHI=20000
log_console "Using fee for main transfers (Zatoshi): $FEE_MAIN_TRANSFER_ZATOSHI"
log_console "Using fee for fee transfer tx (Zatoshi): $FEE_FOR_FEE_TRANSFER_TX_ZATOSHI"
log_to_file "Fee for main transfers (Zatoshi): $FEE_MAIN_TRANSFER_ZATOSHI"
log_to_file "Fee for fee transfer tx (Zatoshi): $FEE_FOR_FEE_TRANSFER_TX_ZATOSHI"

# --- Global Variables ---
INITIAL_RECEIVED_ZATOSHI=0
FEE_AMOUNT_ZATOSHI=0
TXID_FEE_TRANSFER=""
TXID_W1_W2=""
TXID_W2_EXODUS=""


# ================================================
# == Stage 1: Monitor Wallet 1 Transparent Funds ==
# ================================================
log_console "[STAGE 1] Monitoring Wallet 1 for incoming transparent funds. Waiting for user deposit..."
log_to_file "[STAGE 1] Monitoring Wallet 1 for incoming transparent funds."
TIMEOUT=$CONTAINER_TIMEOUT
START_TIME=$(date +%s)
FUND_DETECTED=false
while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
    if [ $ELAPSED_TIME -ge $TIMEOUT ]; then
        log_console "Timeout reached after ${TIMEOUT}s. No funds received in Wallet 1."
        log_to_file "Timeout reached after ${TIMEOUT}s. No funds received in Wallet 1."
        break
    fi
    BALANCE_ZATOSHI=$(get_transparent_balance "$WALLET1_DIR")
    log_console "Current Wallet 1 transparent balance (Zatoshi): $BALANCE_ZATOSHI"
    log_to_file "Checked Wallet 1 transparent balance." # Generic for file
    if echo "$BALANCE_ZATOSHI > 0" | bc -l | grep -q 1; then
        log_console "Transparent funds detected in Wallet 1."
        log_to_file "Transparent funds detected in Wallet 1."
        FUND_DETECTED=true
        INITIAL_RECEIVED_ZATOSHI=$BALANCE_ZATOSHI
        log_console "Stored initial received amount (Zatoshi): $INITIAL_RECEIVED_ZATOSHI"
        log_to_file "Initial received amount (Zatoshi): $INITIAL_RECEIVED_ZATOSHI recorded." # Amount might be okay for internal log

        FEE_AMOUNT_ZATOSHI=$(printf "%.0f" "$(echo "scale=8; ($INITIAL_RECEIVED_ZATOSHI * $FEE_PERCENTAGE) / 100" | bc)")
        log_console "Calculated Fee Amount (Zatoshi) using $FEE_PERCENTAGE%: $FEE_AMOUNT_ZATOSHI"
        log_to_file "Calculated Fee Amount (Zatoshi) using $FEE_PERCENTAGE%: $FEE_AMOUNT_ZATOSHI"

        if [ "$FEE_AMOUNT_ZATOSHI" -lt 0 ]; then
             log_console "❌ ERROR: Calculated fee amount ($FEE_AMOUNT_ZATOSHI Zatoshi) is negative. Check FEE_PERCENTAGE env var."
             log_to_file "❌ ERROR: Calculated fee amount ($FEE_AMOUNT_ZATOSHI Zatoshi) is negative."
             exit 1
        fi

        if [[ -n "${WEBHOOK_URL:-}" && -n "${WEBHOOK_SECRET:-}" ]]; then
            log_console "Sending initial webhook notification..."
            log_to_file "Sending initial webhook notification (User: $USER_ID, Invoice: $INVOICE_ID)."
            PAYLOAD=$(printf '{"json": {"invoiceId": "%s", "userId": "%s"}}' "$INVOICE_ID" "$USER_ID")
            log_console "Sending webhook payload: $PAYLOAD to $WEBHOOK_URL"
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" \
                            -H "Content-Type: application/json" \
                            -H "Authorization: Bearer $WEBHOOK_SECRET" \
                            -d "$PAYLOAD" --max-time 60)
            log_console "Initial webhook response code: $RESPONSE"
            log_to_file "Initial webhook response code: $RESPONSE."
            if [[ "$RESPONSE" -lt 200 || "$RESPONSE" -ge 300 ]]; then
                 log_console "⚠️ Warning: Initial webhook call failed or returned non-success code: $RESPONSE. Continuing..."
                 log_to_file "⚠️ Warning: Initial webhook call returned non-success code: $RESPONSE."
            fi
        else
            log_console "Skipping initial webhook: WEBHOOK_URL or WEBHOOK_SECRET not configured."
            log_to_file "Skipping initial webhook: not configured."
        fi
        break
    fi
    sleep 10
done
if [ "$FUND_DETECTED" = false ]; then
    log_console "Exiting: no funds detected within the timeout period."
    log_to_file "Exiting: no funds detected within the timeout period."
    log_console "Saving empty final transaction lists..."
    log_to_file "Saving empty final transaction lists as no funds detected."
    echo "[]" > "$OUTPUT_DIR/wallet1-transactions-FINAL.json"
    echo "[]" > "$OUTPUT_DIR/wallet2-transactions-FINAL.json"
    exit 0
fi

# ============================================
# == Stage 2: Shield Funds in Wallet 1      ==
# ============================================
log_console "[STAGE 2] Shielding detected transparent funds in Wallet 1."
log_to_file "[STAGE 2] Shielding transparent funds in Wallet 1."
log_console "Attempting to shield funds in Wallet 1 using quickshield..."
log_to_file "Attempting quickshield for Wallet 1."
# zingo-cli quickshield output can be verbose and reveal tx details.
# For console, we can log it if needed, for file, a generic message.
QUICKSHIELD_OUTPUT=$(zingo-cli --data-dir "$WALLET1_DIR" quickshield 2>&1)
QUICKSHIELD_EXIT_CODE=$?
log_console "quickshield W1 output: $QUICKSHIELD_OUTPUT"
if [ $QUICKSHIELD_EXIT_CODE -ne 0 ]; then # Test exit code, not output content for errors
    log_console "⚠️ Warning: quickshield command for Wallet 1 failed (exit code $QUICKSHIELD_EXIT_CODE) or had no effect. Continuing..."
    log_to_file "⚠️ Warning: quickshield command for Wallet 1 failed (exit code $QUICKSHIELD_EXIT_CODE). See console for output. Continuing..."
else
    log_console "quickshield W1 command executed."
    log_to_file "quickshield W1 command executed."
fi


# =====================================================
# == Stage 3: Wait for Wallet 1 Shielded Funds Spendable ==
# =====================================================
log_console "[STAGE 3] Waiting for Wallet 1 shielded funds to become spendable."
log_to_file "[STAGE 3] Waiting for Wallet 1 shielded funds to become spendable."
log_console "Timeout: 15 min. This may take a few minutes as the network confirms."
W1_SPENDABLE_TIMEOUT=900
W1_SPENDABLE_START_TIME=$(date +%s)
while true; do
    W1_CURRENT_TIME=$(date +%s)
    if [ $((W1_CURRENT_TIME - W1_SPENDABLE_START_TIME)) -ge $W1_SPENDABLE_TIMEOUT ]; then
        log_console "❌ ERROR: Timeout (${W1_SPENDABLE_TIMEOUT}s) waiting for Wallet 1 shielded funds to become spendable."
        log_to_file "❌ ERROR: Timeout waiting for Wallet 1 shielded funds to become spendable."
        zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-ERROR-W1-SPENDABLE-TIMEOUT.json" 2>&1 || true
        exit 1
    fi
    SPENDABLE_W1_ZATOSHI=$(get_spendable_balance "$WALLET1_DIR")
    log_console "Current Wallet 1 spendable shielded balance (Zatoshi): $SPENDABLE_W1_ZATOSHI"
    log_to_file "Checked Wallet 1 spendable shielded balance." # Generic for file
    if echo "$SPENDABLE_W1_ZATOSHI > 0" | bc -l | grep -q 1; then
         log_console "Spendable shielded funds confirmed in Wallet 1."
         log_to_file "Spendable shielded funds confirmed in Wallet 1."
         break
    fi
    log_console "Wallet 1 shielded funds not spendable yet, sleeping 15s..."
    log_to_file "Wallet 1 shielded funds not spendable yet. Waiting..."
    sleep 15
done

# ============================================
# == Stage 3.5: Transfer Fee Amount         ==
# ============================================
log_console "[STAGE 3.5] Preparing to transfer calculated fee amount to $FEE_DESTINATION_ADDR."
log_to_file "[STAGE 3.5] Preparing fee transfer."
log_console "Checking conditions for Fee Amount transfer..."
log_to_file "Checking conditions for fee transfer."
FEE_TRANSFER_ATTEMPTED=false
PRE_FEE_SPENDABLE_W1_ZATOSHI=$(get_spendable_balance "$WALLET1_DIR")
log_console "Current spendable balance before fee check (Zatoshi): $PRE_FEE_SPENDABLE_W1_ZATOSHI"
log_to_file "Spendable balance before fee check (Wallet 1): $PRE_FEE_SPENDABLE_W1_ZATOSHI Zatoshi." # Amount might be okay here for context
MIN_REQUIRED_FOR_FEE=$(echo "$FEE_AMOUNT_ZATOSHI + $FEE_FOR_FEE_TRANSFER_TX_ZATOSHI" | bc)
HAS_AMOUNT=$(echo "$FEE_AMOUNT_ZATOSHI > 0" | bc -l)
CAN_AFFORD=$(echo "$PRE_FEE_SPENDABLE_W1_ZATOSHI >= $MIN_REQUIRED_FOR_FEE" | bc -l)

if [ "$HAS_AMOUNT" -eq 1 ] && [ "$CAN_AFFORD" -eq 1 ]; then
    AMOUNT_TO_SEND_ZAT=$FEE_AMOUNT_ZATOSHI
    log_console "Attempting to transfer Fee ($AMOUNT_TO_SEND_ZAT Zatoshi) to $FEE_DESTINATION_ADDR..."
    log_to_file "Attempting to transfer Fee ($AMOUNT_TO_SEND_ZAT Zatoshi) to fee destination [REDACTED_FOR_FILE_LOG]."
    SEND_OUTPUT=$(zingo-cli --data-dir "$WALLET1_DIR" quicksend "$FEE_DESTINATION_ADDR" "$AMOUNT_TO_SEND_ZAT" 2>&1)
    SEND_EXIT_CODE=$?
    log_console "Quicksend Fee Transfer raw output: $SEND_OUTPUT"
    log_to_file "Quicksend Fee Transfer command executed. See console for raw output."
    if [ $SEND_EXIT_CODE -ne 0 ] || echo "$SEND_OUTPUT" | grep -qi "Error:"; then # Check exit code and output for error string
        log_console "❌ ERROR: Failed to initiate Fee transfer via quicksend (Exit Code: $SEND_EXIT_CODE). Output: $SEND_OUTPUT"
        log_to_file "❌ ERROR: Failed to initiate Fee transfer (Exit Code: $SEND_EXIT_CODE). See console for details."
    else
        log_console "✅ Successfully initiated Fee transfer."
        log_to_file "✅ Successfully initiated Fee transfer."
        FEE_TRANSFER_ATTEMPTED=true
        TXID_FEE_TRANSFER=$(echo "$SEND_OUTPUT" | jq -r '.txid // if .txids then .txids[0] else empty end // empty')
        if [[ -n "$TXID_FEE_TRANSFER" ]]; then
            log_console "Parsed Fee Transfer TXID: $TXID_FEE_TRANSFER"
            log_to_file "Fee Transfer TXID: $TXID_FEE_TRANSFER" # TXID itself might be okay for file log
        else
            log_console "⚠️ Warning: Could not parse TXID for Fee transfer from output: $SEND_OUTPUT"
            log_to_file "⚠️ Warning: Could not parse TXID for Fee transfer. See console."
        fi
    fi
else
    if [ "$HAS_AMOUNT" -ne 1 ]; then
         log_console "ℹ️ Skipping Fee transfer: calculated amount <= 0 Zatoshi ($FEE_AMOUNT_ZATOSHI)."
         log_to_file "ℹ️ Skipping Fee transfer: calculated amount $FEE_AMOUNT_ZATOSHI Zatoshi <= 0."
    else
         log_console "ℹ️ Skipping Fee transfer: insufficient balance. Required: $MIN_REQUIRED_FOR_FEE Zatoshi | Available Spendable: $PRE_FEE_SPENDABLE_W1_ZATOSHI Zatoshi"
         log_to_file "ℹ️ Skipping Fee transfer: insufficient balance. Required: $MIN_REQUIRED_FOR_FEE Zatoshi | Available: $PRE_FEE_SPENDABLE_W1_ZATOSHI Zatoshi."
    fi
fi

# ==============================================================
# == Stage 3.7: Wait for Wallet 1 State Update (if needed)    ==
# ==============================================================
log_console "[STAGE 3.7] Waiting for Wallet 1 state to update after potential fee transfer."
log_to_file "[STAGE 3.7] Waiting for Wallet 1 state update."
if [ "$FEE_TRANSFER_ATTEMPTED" = true ]; then
    log_console "Fee transfer was attempted. Waiting up to 5 mins for Wallet 1 state/balance update..."
    log_to_file "Fee transfer attempted. Waiting for Wallet 1 balance update (timeout 5 mins)."
    SYNC_TIMEOUT=300
    SYNC_START_TIME=$(date +%s)
    BALANCE_UPDATED=false
    while true; do
        log_console "Running sync for Wallet 1..."
        log_to_file "Syncing Wallet 1..."
        SYNC_W1_OUTPUT=$(zingo-cli --data-dir "$WALLET1_DIR" sync 2>&1) # Capture output
        SYNC_W1_EXIT_CODE=$?
        if [ $SYNC_W1_EXIT_CODE -ne 0 ]; then
            log_console "⚠️ Warning: Sync command for Wallet 1 failed (exit code $SYNC_W1_EXIT_CODE) during wait loop. Output: $SYNC_W1_OUTPUT"
            log_to_file "⚠️ Warning: Sync command for Wallet 1 failed (exit code $SYNC_W1_EXIT_CODE). See console."
        else
            log_console "Wallet 1 sync successful."
            log_to_file "Wallet 1 sync successful."
        fi
        CURRENT_SPENDABLE_W1_ZATOSHI_AFTER_SYNC=$(get_spendable_balance "$WALLET1_DIR")
        log_console "Spendable balance W1 after sync: $CURRENT_SPENDABLE_W1_ZATOSHI_AFTER_SYNC (was $PRE_FEE_SPENDABLE_W1_ZATOSHI before fee attempt)"
        log_to_file "Spendable balance W1 after sync: $CURRENT_SPENDABLE_W1_ZATOSHI_AFTER_SYNC (was $PRE_FEE_SPENDABLE_W1_ZATOSHI)."
        if echo "$CURRENT_SPENDABLE_W1_ZATOSHI_AFTER_SYNC < $PRE_FEE_SPENDABLE_W1_ZATOSHI" | bc -l | grep -q 1; then
            log_console "✅ Wallet 1 balance updated (decreased). Proceeding."
            log_to_file "✅ Wallet 1 balance updated. Proceeding."
            BALANCE_UPDATED=true
            break
        fi
        SYNC_CURRENT_TIME=$(date +%s)
        if [ $((SYNC_CURRENT_TIME - SYNC_START_TIME)) -ge $SYNC_TIMEOUT ]; then
            log_console "⚠️ WARNING: Timeout (${SYNC_TIMEOUT}s) waiting for W1 balance update after fee transfer. Proceeding cautiously."
            log_to_file "⚠️ WARNING: Timeout waiting for W1 balance update after fee transfer. Proceeding."
            break
        fi
        log_console "W1 Balance not updated yet, sleeping 20s..."
        log_to_file "W1 Balance not updated yet. Waiting..."
        sleep 20
    done
else
    log_console "Skipping wait for W1 update: Fee transfer not attempted."
    log_to_file "Skipping wait for W1 update: Fee transfer not attempted."
fi

# ============================================
# == Stage 4: Transfer W1 -> W2             ==
# ============================================
log_console "[STAGE 4] Transferring remaining shielded funds from Wallet 1 to Wallet 2 ($WALLET2_SAPLING)."
log_to_file "[STAGE 4] Transferring W1 -> W2 ([REDACTED_FOR_FILE_LOG])."
log_console "Preparing transfer W1 -> W2..."
log_to_file "Preparing transfer W1 -> W2."
CURRENT_SPENDABLE_W1_ZATOSHI=$(get_spendable_balance "$WALLET1_DIR")
log_console "Current Wallet 1 spendable balance (Zatoshi): $CURRENT_SPENDABLE_W1_ZATOSHI"
log_to_file "Current Wallet 1 spendable balance (Zatoshi): $CURRENT_SPENDABLE_W1_ZATOSHI."
AMOUNT1_TO_SEND_ZATOSHI=$(echo "$CURRENT_SPENDABLE_W1_ZATOSHI - $FEE_MAIN_TRANSFER_ZATOSHI" | bc)
log_console "Calculated amount W1->W2 (Zatoshi): $AMOUNT1_TO_SEND_ZATOSHI"
log_to_file "Calculated amount W1->W2 (Zatoshi): $AMOUNT1_TO_SEND_ZATOSHI."
if echo "$AMOUNT1_TO_SEND_ZATOSHI <= 0" | bc -l | grep -q 1; then
    log_console "❌ ERROR: W1 calculated amount to send ($AMOUNT1_TO_SEND_ZATOSHI Zatoshi) is <= 0."
    log_console " Spendable: $CURRENT_SPENDABLE_W1_ZATOSHI Zatoshi | Fee: $FEE_MAIN_TRANSFER_ZATOSHI Zatoshi"
    log_to_file "❌ ERROR: W1 calculated amount to send ($AMOUNT1_TO_SEND_ZATOSHI Zatoshi) is <= 0. Spendable: $CURRENT_SPENDABLE_W1_ZATOSHI, Fee: $FEE_MAIN_TRANSFER_ZATOSHI."
    zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-ERROR-W1-LOWBAL.json" 2>&1 || true
    exit 1
fi
log_console "Initiating quicksend W1 -> W2 for $AMOUNT1_TO_SEND_ZATOSHI Zatoshi to $WALLET2_SAPLING..."
log_to_file "Initiating quicksend W1 -> W2 for $AMOUNT1_TO_SEND_ZATOSHI Zatoshi to [REDACTED_FOR_FILE_LOG]."
SEND_OUTPUT=$(zingo-cli --data-dir "$WALLET1_DIR" quicksend "$WALLET2_SAPLING" "$AMOUNT1_TO_SEND_ZATOSHI" 2>&1)
SEND_EXIT_CODE=$?
log_console "Quicksend W1->W2 raw output: $SEND_OUTPUT"
log_to_file "Quicksend W1->W2 command executed. See console for raw output."
if [ $SEND_EXIT_CODE -ne 0 ] || echo "$SEND_OUTPUT" | grep -qi "Error:"; then
    log_console "❌ ERROR: quicksend W1->W2 failed (Exit Code: $SEND_EXIT_CODE). Output: $SEND_OUTPUT"
    log_to_file "❌ ERROR: quicksend W1->W2 failed (Exit Code: $SEND_EXIT_CODE). See console for details."
    zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-ERROR-W1-SENDFAIL.json" 2>&1 || true
    exit 1
else
    log_console "✅ Send W1 -> W2 initiated."
    log_to_file "✅ Send W1 -> W2 initiated."
    TXID_W1_W2=$(echo "$SEND_OUTPUT" | jq -r '.txid // if .txids then .txids[0] else empty end // empty')
    if [[ -n "$TXID_W1_W2" ]]; then
        log_console "Parsed W1->W2 TXID: $TXID_W1_W2"
        log_to_file "Parsed W1->W2 TXID: $TXID_W1_W2" # TXID okay for file
    else
        log_console "⚠️ Warning: Could not parse TXID for W1->W2 transfer from output: $SEND_OUTPUT"
        log_to_file "⚠️ Warning: Could not parse TXID for W1->W2 transfer. See console."
    fi
fi

# =====================================================
# == Stage 5: Wait for Wallet 2 Shielded Funds Spendable ==
# =====================================================
log_console "[STAGE 5] Waiting for Wallet 2 funds to be received and spendable."
log_to_file "[STAGE 5] Waiting for Wallet 2 funds spendable."
log_console "Timeout: 15 min..."
W2_RECEIVE_TIMEOUT=900
W2_RECEIVE_START_TIME=$(date +%s)
while true; do
    W2_CURRENT_TIME=$(date +%s)
    if [ $((W2_CURRENT_TIME - W2_RECEIVE_START_TIME)) -ge $W2_RECEIVE_TIMEOUT ]; then
        log_console "❌ ERROR: Timeout (${W2_RECEIVE_TIMEOUT}s) waiting for Wallet 2 funds to become spendable."
        log_to_file "❌ ERROR: Timeout waiting for Wallet 2 funds to become spendable."
        zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-ERROR-W2-TIMEOUT.json" 2>&1 || true
        zingo-cli --data-dir "$WALLET2_DIR" list > "$OUTPUT_DIR/wallet2-transactions-ERROR-W2-TIMEOUT.json" 2>&1 || true
        exit 1
    fi
    log_console "Syncing Wallet 2..."
    log_to_file "Syncing Wallet 2..."
    SYNC_W2_OUTPUT=$(zingo-cli --data-dir "$WALLET2_DIR" sync 2>&1)
    SYNC_W2_EXIT_CODE=$?
    if [ $SYNC_W2_EXIT_CODE -ne 0 ]; then
        log_console "⚠️ Warning: Sync command for W2 failed (exit code $SYNC_W2_EXIT_CODE) during wait loop. Output: $SYNC_W2_OUTPUT"
        log_to_file "⚠️ Warning: Sync command for W2 failed (exit code $SYNC_W2_EXIT_CODE). See console."
    else
        log_console "Wallet 2 sync successful."
        log_to_file "Wallet 2 sync successful."
    fi
    SPENDABLE_W2_ZATOSHI=$(get_spendable_balance "$WALLET2_DIR")
    log_console "Current Wallet 2 spendable balance (Zatoshi): $SPENDABLE_W2_ZATOSHI"
    log_to_file "Checked Wallet 2 spendable balance." # Generic for file
    if echo "$SPENDABLE_W2_ZATOSHI > 0" | bc -l | grep -q 1; then
         log_console "Funds received and spendable in Wallet 2."
         log_to_file "Funds received and spendable in Wallet 2."
         break
    fi
    log_console "Wallet 2 balance not spendable yet, sleeping 15s..."
    log_to_file "Wallet 2 balance not spendable yet. Waiting..."
    sleep 15
done

# ============================================
# == Stage 6: Transfer W2 -> Exodus         ==
# ============================================
log_console "[STAGE 6] Sending final payout from Wallet 2 to Exodus destination: $EXODUS_WALLET."
log_to_file "[STAGE 6] Sending final payout W2 -> Exodus ([REDACTED_FOR_FILE_LOG])."
log_console "Transferring W2 -> Exodus..."
log_to_file "Preparing transfer W2 -> Exodus."
CURRENT_SPENDABLE_W2_ZATOSHI=$(get_spendable_balance "$WALLET2_DIR")
log_console "Current Wallet 2 spendable balance (Zatoshi): $CURRENT_SPENDABLE_W2_ZATOSHI"
log_to_file "Current Wallet 2 spendable balance (Zatoshi): $CURRENT_SPENDABLE_W2_ZATOSHI."
AMOUNT2_TO_SEND_ZATOSHI=$(echo "$CURRENT_SPENDABLE_W2_ZATOSHI - $FEE_MAIN_TRANSFER_ZATOSHI" | bc)
log_console "Calculated amount W2->Exodus (Zatoshi): $AMOUNT2_TO_SEND_ZATOSHI"
log_to_file "Calculated amount W2->Exodus (Zatoshi): $AMOUNT2_TO_SEND_ZATOSHI."
if echo "$AMOUNT2_TO_SEND_ZATOSHI <= 0" | bc -l | grep -q 1; then
    log_console "❌ ERROR: W2 calculated amount to send ($AMOUNT2_TO_SEND_ZATOSHI Zatoshi) is <= 0."
    log_console " Spendable: $CURRENT_SPENDABLE_W2_ZATOSHI Zatoshi | Fee: $FEE_MAIN_TRANSFER_ZATOSHI Zatoshi"
    log_to_file "❌ ERROR: W2 calculated amount to send ($AMOUNT2_TO_SEND_ZATOSHI Zatoshi) is <= 0. Spendable: $CURRENT_SPENDABLE_W2_ZATOSHI, Fee: $FEE_MAIN_TRANSFER_ZATOSHI."
    zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-ERROR-W2-LOWBAL.json" 2>&1 || true
    zingo-cli --data-dir "$WALLET2_DIR" list > "$OUTPUT_DIR/wallet2-transactions-ERROR-W2-LOWBAL.json" 2>&1 || true
    exit 1
fi
log_console "Initiating quicksend W2 -> Exodus for $AMOUNT2_TO_SEND_ZATOSHI Zatoshi to $EXODUS_WALLET..."
log_to_file "Initiating quicksend W2 -> Exodus for $AMOUNT2_TO_SEND_ZATOSHI Zatoshi to [REDACTED_FOR_FILE_LOG]."
SEND_OUTPUT=$(zingo-cli --data-dir "$WALLET2_DIR" quicksend "$EXODUS_WALLET" "$AMOUNT2_TO_SEND_ZATOSHI" 2>&1)
SEND_EXIT_CODE=$?
log_console "Quicksend W2->Exodus raw output: $SEND_OUTPUT"
log_to_file "Quicksend W2->Exodus command executed. See console for raw output."
if [ $SEND_EXIT_CODE -ne 0 ] || echo "$SEND_OUTPUT" | grep -qi "Error:"; then
    log_console "❌ ERROR: quicksend W2->Exodus failed (Exit Code: $SEND_EXIT_CODE). Output: $SEND_OUTPUT"
    log_to_file "❌ ERROR: quicksend W2->Exodus failed (Exit Code: $SEND_EXIT_CODE). See console for details."
    zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-ERROR-W2-SENDFAIL.json" 2>&1 || true
    zingo-cli --data-dir "$WALLET2_DIR" list > "$OUTPUT_DIR/wallet2-transactions-ERROR-W2-SENDFAIL.json" 2>&1 || true
    exit 1
else
    log_console "✅ Send W2 -> Exodus initiated."
    log_to_file "✅ Send W2 -> Exodus initiated."
    TXID_W2_EXODUS=$(echo "$SEND_OUTPUT" | jq -r '.txid // if .txids then .txids[0] else empty end // empty')
    if [[ -n "$TXID_W2_EXODUS" ]]; then
        log_console "Parsed W2->Exodus TXID: $TXID_W2_EXODUS"
        log_to_file "Parsed W2->Exodus TXID: $TXID_W2_EXODUS" # TXID okay for file
    else
        log_console "⚠️ Warning: Could not parse TXID for W2->Exodus transfer from output: $SEND_OUTPUT"
        log_to_file "⚠️ Warning: Could not parse TXID for W2->Exodus transfer. See console."
    fi
fi

# ============================================
# == Stage 7: Finalization & Log Saving     ==
# ============================================
log_console "[STAGE 7] Finalizing process, saving transaction logs, and preparing final webhook payload."
log_to_file "[STAGE 7] Finalizing process and saving logs."
log_console "Waiting 10s before final save..."
log_to_file "Brief pause before final save."
sleep 10

log_console "Saving Wallet 1 transaction list to $OUTPUT_DIR/wallet1-transactions-FINAL.json..."
log_to_file "Saving Wallet 1 transaction list."
zingo-cli --data-dir "$WALLET1_DIR" list > "$OUTPUT_DIR/wallet1-transactions-FINAL.json" 2>&1 || {
    log_console "⚠️ Warning: Failed to save final W1 list.";
    log_to_file "⚠️ Warning: Failed to save final W1 list.";
}

log_console "Saving Wallet 2 transaction list to $OUTPUT_DIR/wallet2-transactions-FINAL.json..."
log_to_file "Saving Wallet 2 transaction list."
zingo-cli --data-dir "$WALLET2_DIR" list > "$OUTPUT_DIR/wallet2-transactions-FINAL.json" 2>&1 || {
    log_console "⚠️ Warning: Failed to save final W2 list.";
    log_to_file "⚠️ Warning: Failed to save final W2 list.";
}

log_console "Saving IDs to $OUTPUT_DIR/ids.json..."
log_to_file "Saving IDs (DB User, User, Invoice) to ids.json."
printf '{"db_user_id": "%s", "user_id": "%s", "invoice_id": "%s"}\n' \
    "$DB_USER_ID_PART" "$USER_ID" "$INVOICE_ID" > "$OUTPUT_DIR/ids.json"


# --- Send Final Data via Webhook (Updated Structure & Hardcoded Auth) ---
log_console "Constructing final data payload for z-vault..."
log_to_file "Constructing final webhook data payload."

ADDR_LIST_JSON=$(printf '"%s",' "${WALLET1_TRANSPARENT}" "${WALLET1_SAPLING}" "${WALLET2_SAPLING}" "${FEE_DESTINATION_ADDR}" "${EXODUS_WALLET}")
ADDR_LIST_JSON="[${ADDR_LIST_JSON%,}]"

TXID_LIST_ITEMS=""
[[ -n "$TXID_FEE_TRANSFER" ]] && TXID_LIST_ITEMS+=$(printf '"%s",' "$TXID_FEE_TRANSFER")
[[ -n "$TXID_W1_W2" ]] && TXID_LIST_ITEMS+=$(printf '"%s",' "$TXID_W1_W2")
[[ -n "$TXID_W2_EXODUS" ]] && TXID_LIST_ITEMS+=$(printf '"%s",' "$TXID_W2_EXODUS")
TXID_LIST_JSON="[${TXID_LIST_ITEMS%,}]"

INNER_JSON=$(printf '{
  "dbUserId": "%s",
  "userId": "%s",
  "invoiceId": "%s",
  "txHashes": %s,
  "addressesUsed": %s
}' \
  "$DB_USER_ID_PART" \
  "$USER_ID" \
  "$INVOICE_ID" \
  "$TXID_LIST_JSON" \
  "$ADDR_LIST_JSON" \
)
FINAL_PAYLOAD=$(printf '{"json": %s}' "$INNER_JSON")

log_console "Final Payload (console):"
echo "$FINAL_PAYLOAD" # Log full payload to console
log_to_file "Final Payload (file log - structure summary):"
log_to_file "DB User ID: $DB_USER_ID_PART, User ID: $USER_ID, Invoice ID: $INVOICE_ID"
log_to_file "TX Hashes included: $(echo "$TXID_LIST_JSON" | jq -c '. | length') items (see console for details)"
log_to_file "Addresses used: $(echo "$ADDR_LIST_JSON" | jq -c '. | length') items (see console for details)"


log_console "Sending final transaction data to webhook: z-vault (verbose)..."
log_to_file "Sending final transaction data to webhook..."
# The curl command itself will output verbosely to console due to -v
# The actual payload with secrets/addresses is in $FINAL_PAYLOAD, logged to console above.
curl --fail -v \
    -X POST "http://172.17.0.1:5001/update" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer whsec_CVKiH9Jhz0kyRLZ8NKRClnqVY1tSKTR19R8TjyDbuak" \
    -d "$FINAL_PAYLOAD" --max-time 30
CURL_EXIT_CODE=$?

if [ $CURL_EXIT_CODE -eq 0 ]; then
    log_console "✅ Final data webhook call seems successful (curl exit code 0). Check verbose output above for HTTP status."
    log_to_file "✅ Final data webhook call successful (curl exit code 0)."
else
    log_console "❌ ERROR: Final data webhook curl command failed with exit code $CURL_EXIT_CODE. Check verbose output above."
    log_to_file "❌ ERROR: Final data webhook curl command failed with exit code $CURL_EXIT_CODE. Payload saved to final-payload-ERROR.json."
    echo "$FINAL_PAYLOAD" > "$OUTPUT_DIR/final-payload-ERROR.json"
fi

log_console "\n==================== SHIELDING PROCESS SUMMARY (CONSOLE) ===================="
log_console "User: $USER_ID | Invoice: $INVOICE_ID | DB User: $DB_USER_ID_PART"
log_console "Initial Transparent Received: $INITIAL_RECEIVED_ZATOSHI Zat | Fee: $FEE_AMOUNT_ZATOSHI Zat ($FEE_PERCENTAGE%)"
log_console "Fee sent to: $FEE_DESTINATION_ADDR | Exodus destination: $EXODUS_WALLET"
log_console "TXIDs: Fee: ${TXID_FEE_TRANSFER:-N/A} | W1->W2: ${TXID_W1_W2:-N/A} | W2->Exodus: ${TXID_W2_EXODUS:-N/A}"
log_console "Process completed at $(date +'%Y-%m-%d %H:%M:%S')"
log_console "===========================================================================\n"

log_to_file "\n==================== SHIELDING PROCESS SUMMARY (FILE LOG) ===================="
log_to_file "User: $USER_ID | Invoice: $INVOICE_ID | DB User: $DB_USER_ID_PART"
log_to_file "Initial Transparent Received: $INITIAL_RECEIVED_ZATOSHI Zat | Fee Calculated: $FEE_AMOUNT_ZATOSHI Zat ($FEE_PERCENTAGE%)" # Amounts might be ok for file summary
log_to_file "Fee sent to: [REDACTED_FOR_FILE_LOG] | Exodus destination: [REDACTED_FOR_FILE_LOG]"
log_to_file "TXIDs: Fee: ${TXID_FEE_TRANSFER:-N/A} | W1->W2: ${TXID_W1_W2:-N/A} | W2->Exodus: ${TXID_W2_EXODUS:-N/A}" # TXIDs themselves are often public/semi-public, can be included
log_to_file "Process completed at $(date +'%Y-%m-%d %H:%M:%S')"
log_to_file "==========================================================================\n"

log_console "✅ Script finished. Container should close shortly."
log_to_file "✅ Script finished."
exit 0
