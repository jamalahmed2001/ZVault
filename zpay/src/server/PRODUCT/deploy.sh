#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- ZPAY/Z-vault-admin Automated Deployment Script ---${NC}"



# 1. Check/Install Node.js (v16+)
if ! command -v node &> /dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 16 ]; then
  echo -e "${YELLOW}Node.js not found or too old. Installing Node.js 22 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo -e "${GREEN}Node.js found: $(node -v)${NC}"
fi

# 2. Check/Install pnpm
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}pnpm not found. Installing pnpm...${NC}"
  npm install -g pnpm
else
  echo -e "${GREEN}pnpm found: $(pnpm -v)${NC}"
fi

# 3. Check/Install Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker $USER
  echo -e "${YELLOW}Docker installed. You may need to log out and back in for group changes to take effect.${NC}"
else
  echo -e "${GREEN}Docker found: $(docker --version)${NC}"
fi

# Build or load Docker image. Prefer rebuild on server for correct platform (arm64/amd64).
DEPLOY_DIR="."
[ -f ./release/dockerfile ] && DEPLOY_DIR="./release"
if [ -f "$DEPLOY_DIR/dockerfile" ] && [ -f "$DEPLOY_DIR/run.sh" ]; then
  echo -e "${YELLOW}Building Docker image (zcash-wallets) for host platform...${NC}"
  (cd "$DEPLOY_DIR" && docker build -f dockerfile -t zcash-wallets .) && echo -e "${GREEN}Docker image built.${NC}" || \
  echo -e "${RED}Docker build failed. Trying to load from tar if present.${NC}"
fi
if ! docker image inspect zcash-wallets &>/dev/null; then
  if [ -f ./zcash-wallets.tar ]; then
    echo -e "${YELLOW}Loading Docker image from ./zcash-wallets.tar...${NC}"
    docker load -i ./zcash-wallets.tar
  elif [ -f ./release/zcash-wallets.tar ]; then
    echo -e "${YELLOW}Loading Docker image from ./release/zcash-wallets.tar...${NC}"
    docker load -i ./release/zcash-wallets.tar
  else
    echo -e "${YELLOW}No zcash-wallets image. Build from release/ or provide zcash-wallets.tar.${NC}"
  fi
fi

# 4. Check/Install PostgreSQL
if ! command -v psql &> /dev/null; then
  echo -e "${YELLOW}PostgreSQL not found. Installing PostgreSQL...${NC}"
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
else
  echo -e "${GREEN}PostgreSQL found: $(psql --version)${NC}"
fi

# Determine PostgreSQL version and pg_hba.conf path
POSTGRES_VERSION_RAW=$(psql --version 2>/dev/null | awk '/psql \(PostgreSQL\)/ {print $3}')
if [ -z "$POSTGRES_VERSION_RAW" ]; then
    echo -e "${RED}Critical: Could not determine PostgreSQL version using 'psql --version'. Exiting.${NC}"
    exit 1
fi
POSTGRES_VERSION_MAJOR=$(echo "$POSTGRES_VERSION_RAW" | cut -d. -f1)

PG_HBA_FILE_PATH="/etc/postgresql/${POSTGRES_VERSION_MAJOR}/main/pg_hba.conf"
echo -e "${YELLOW}Anticipated PostgreSQL pg_hba.conf path: $PG_HBA_FILE_PATH${NC}"

if [ ! -f "$PG_HBA_FILE_PATH" ]; then
    echo -e "${RED}Critical: pg_hba.conf file not found at the anticipated path: $PG_HBA_FILE_PATH.${NC}"
    echo -e "${RED}If your pg_hba.conf is in a different location, please update the PG_HBA_FILE_PATH variable in this script.${NC}"
    echo -e "${RED}Exiting due to missing pg_hba.conf.${NC}"
    exit 1
fi
echo -e "${GREEN}Found pg_hba.conf at: $PG_HBA_FILE_PATH${NC}"

# Backup pg_hba.conf before any modifications
PG_HBA_BACKUP_PATH="${PG_HBA_FILE_PATH}.bak_deploy_sh_$(date +%F_%T)"
echo -e "${YELLOW}Backing up $PG_HBA_FILE_PATH to $PG_HBA_BACKUP_PATH...${NC}"
sudo cp "$PG_HBA_FILE_PATH" "$PG_HBA_BACKUP_PATH"
if [ $? -ne 0 ]; then
    echo -e "${RED}Critical: Failed to backup pg_hba.conf. Exiting to prevent unintended changes.${NC}"
    exit 1
fi
echo -e "${GREEN}Backup of pg_hba.conf created successfully at $PG_HBA_BACKUP_PATH.${NC}"

# --- Temporarily set 'postgres' user to 'trust' authentication ---
echo -e "${YELLOW}Attempting to temporarily set 'local all postgres' to 'trust' in $PG_HBA_FILE_PATH for initial password setup...${NC}"
ORIGINAL_POSTGRES_AUTH_LINE_COUNT=$(sudo grep -c "^\s*local\s\+all\s\+postgres\s\+" "$PG_HBA_FILE_PATH")

# This sed command finds a line like 'local all postgres METHOD # COMMENT' and changes METHOD to 'trust', preserving the comment.
if sudo sed -E -i.deploy_sh_pre_trust_bak "s%^(\s*local\s+all\s+postgres\s+)([^#\s]+)(\s*#.*)?$%\1trust\3%" "$PG_HBA_FILE_PATH"; then
    # Verify the change
    if ! sudo grep -q "^\s*local\s\+all\s\+postgres\s\+trust" "$PG_HBA_FILE_PATH"; then
        if [ "$ORIGINAL_POSTGRES_AUTH_LINE_COUNT" -eq 0 ]; then
            echo -e "${YELLOW}No existing 'local all postgres' line found. Appending 'local all postgres trust'.${NC}"
            echo "local all postgres trust" | sudo tee -a "$PG_HBA_FILE_PATH" > /dev/null
            if ! sudo grep -q "^\s*local\s\+all\s\+postgres\s\+trust" "$PG_HBA_FILE_PATH"; then
                 echo -e "${RED}Critical: Failed to append 'local all postgres trust' to $PG_HBA_FILE_PATH. Restore from $PG_HBA_BACKUP_PATH and check manually. Exiting.${NC}"
                 exit 1
            fi
        else
            echo -e "${RED}Critical: Failed to modify existing 'local all postgres' line to 'trust' in $PG_HBA_FILE_PATH. Sed may have failed or line format unexpected. Restore from $PG_HBA_BACKUP_PATH. Exiting.${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}'local all postgres' authentication temporarily set to 'trust'.${NC}"
else
    echo -e "${RED}Critical: sed command failed while trying to set 'trust' auth in $PG_HBA_FILE_PATH. Restore from $PG_HBA_BACKUP_PATH. Exiting.${NC}"
    exit 1
fi

# Restart PostgreSQL to apply 'trust' authentication
echo -e "${YELLOW}Restarting PostgreSQL service to apply 'trust' authentication...${NC}"
if sudo systemctl restart postgresql; then
    echo -e "${GREEN}PostgreSQL service restarted successfully (trust auth).${NC}"
else
    echo -e "${RED}Critical: Failed to restart PostgreSQL after setting 'trust' auth. Check PostgreSQL logs.${NC}"
    echo -e "${YELLOW}Attempting to restore pg_hba.conf from $PG_HBA_BACKUP_PATH...${NC}"
    sudo cp "$PG_HBA_BACKUP_PATH" "$PG_HBA_FILE_PATH" && echo -e "${GREEN}pg_hba.conf restored from backup.${NC}" || echo -e "${RED}Failed to restore pg_hba.conf from backup!${NC}"
    exit 1
fi

# Set password for postgres user (now under 'trust' authentication)
POSTGRES_PASSWORD="postgres" # User should change this in production
echo -e "${YELLOW}Setting password for 'postgres' SQL user to '$POSTGRES_PASSWORD'.${NC}"
if sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';"; then
    echo -e "${GREEN}Password for 'postgres' SQL user set successfully.${NC}"
else
    echo -e "${RED}Critical: Failed to set password for 'postgres' SQL user even with 'trust' auth. Check PostgreSQL logs.${NC}"
    echo -e "${YELLOW}Attempting to restore pg_hba.conf from $PG_HBA_BACKUP_PATH and restart PostgreSQL...${NC}"
    sudo cp "$PG_HBA_BACKUP_PATH" "$PG_HBA_FILE_PATH" && sudo systemctl restart postgresql && echo -e "${GREEN}pg_hba.conf restored and PostgreSQL restarted.${NC}" || echo -e "${RED}Failed to restore pg_hba.conf or restart PostgreSQL!${NC}"
    exit 1
fi

# --- Revert 'postgres' user to 'md5' authentication ---
echo -e "${YELLOW}Setting 'local all postgres' authentication to 'md5' in $PG_HBA_FILE_PATH...${NC}"
# This sed command changes 'local all postgres trust # COMMENT' specifically to 'local all postgres md5 # COMMENT'
if sudo sed -E -i "s%^(\s*local\s+all\s+postgres\s+)trust(\s*#.*)?$%\1md5\2%" "$PG_HBA_FILE_PATH"; then
    if ! sudo grep -q "^\s*local\s\+all\s\+postgres\s\+md5" "$PG_HBA_FILE_PATH"; then
        echo -e "${RED}Error: Failed to set 'local all postgres' to 'md5' in $PG_HBA_FILE_PATH after setting password. The 'trust' line might have been unexpected. Check file manually. Main backup: $PG_HBA_BACKUP_PATH. Continuing, but DB setup may fail.${NC}"
    else
        echo -e "${GREEN}'local all postgres' authentication set to 'md5'.${NC}"
    fi
else
    echo -e "${RED}Error: sed command failed while trying to set 'md5' auth in $PG_HBA_FILE_PATH. Continuing, but DB setup may fail. Main backup: $PG_HBA_BACKUP_PATH.${NC}"
fi

# Restart PostgreSQL to apply 'md5' authentication
echo -e "${YELLOW}Restarting PostgreSQL service to apply 'md5' authentication...${NC}"
if sudo systemctl restart postgresql; then
    echo -e "${GREEN}PostgreSQL service restarted successfully ('md5' auth).${NC}"
else
    echo -e "${RED}Critical: Failed to restart PostgreSQL after setting 'md5' auth. Database operations will likely fail. Main backup: $PG_HBA_BACKUP_PATH. Exiting.${NC}"
    exit 1
fi

# 5. Setup PostgreSQL database and run schema
DB_NAME="ZPAY"
echo -e "${GREEN}Setting up PostgreSQL database and running schema...${NC}"
if sudo -u postgres PGPASSWORD="$POSTGRES_PASSWORD" psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  echo -e "${YELLOW}Database $DB_NAME already exists.${NC}"
else
  sudo -u postgres PGPASSWORD="$POSTGRES_PASSWORD" createdb $DB_NAME
  echo -e "${GREEN}Database $DB_NAME created.${NC}"
fi

if [ -f ZPAY/create-db.sql ]; then
  echo -e "${GREEN}Applying database schema from ZPAY/create-db.sql...${NC}"
  sudo -u postgres PGPASSWORD="$POSTGRES_PASSWORD" psql $DB_NAME < ZPAY/create-db.sql
else
  echo -e "${YELLOW}No ZPAY/create-db.sql found. Skipping schema import.${NC}"
fi

# 6. Backend setup
# Install pm2 if not present
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}pm2 not found. Installing pm2 globally...${NC}"
  npm install -g pm2
else
  echo -e "${GREEN}pm2 found: $(pm2 -v)${NC}"
fi

cd ZPAY
pnpm install --prod
pnpm add pino-pretty
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env file found in backend. Please create and configure it before starting the API.${NC}"
  BACKEND_PORT=80
else
  echo -e "${GREEN}.env file found.${NC}"
  # Extract API_PORT from .env or use default
  BACKEND_PORT=$(grep -E '^API_PORT=' .env | cut -d'=' -f2 | tr -d '[:space:]')
  if [ -z "$BACKEND_PORT" ]; then
    BACKEND_PORT=5001
  fi
fi

echo -e "${GREEN}Starting backend API (ZPAY) on port $BACKEND_PORT using pm2...${NC}"
# Stop any existing pm2 process with the same name
pm2 delete zpay-backend || true
pm2 start dist/index.js --name zpay-backend --time
pm2 save
pm2 status

echo -e "${GREEN}Backend started with pm2. Use 'pm2 logs zpay-backend' to view logs, 'pm2 restart zpay-backend' to restart, and 'pm2 stop zpay-backend' to stop.${NC}"
echo -e "${YELLOW}Backend API is running on port $BACKEND_PORT${NC}"
cd ..

# 7. Frontend setup
echo -e "${GREEN}Setting up frontend (Z-vault-admin)...${NC}"
cd Z-vault-admin
pnpm install --prod || true
cd ..
FRONTEND_PORT=5173

# Install serve if not present
if ! command -v serve &> /dev/null; then
  echo -e "${YELLOW}serve not found. Installing serve globally...${NC}"
  npm install -g serve
else
  echo -e "${GREEN}serve found: $(serve --version)${NC}"
fi

# Start frontend with pm2
pm2 delete zvault-frontend || true
pm2 start "serve -s Z-vault-admin/dist -l tcp://0.0.0.0:$FRONTEND_PORT" --name zvault-frontend
pm2 save
pm2 status

echo -e "${GREEN}Frontend started with pm2. Use 'pm2 logs zvault-frontend' to view logs, 'pm2 restart zvault-frontend' to restart, and 'pm2 stop zvault-frontend' to stop.${NC}"
echo -e "${YELLOW}Frontend static files are being served on port $FRONTEND_PORT${NC}"
# Suggest a port for static serving (Vite default)
echo -e "${YELLOW}A common port for static serving is $FRONTEND_PORT (Vite default). Configure your web server as needed.${NC}"

echo -e "${GREEN}--- Deployment Complete! ---${NC}"
echo -e "${YELLOW}Backend API running. Frontend ready to be served. Configure your .env and web server as needed.${NC}"
