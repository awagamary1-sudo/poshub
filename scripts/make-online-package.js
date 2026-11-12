/**
 * Generates the clean, production-ready online hosting package for PosHub.
 * Folder: poshub-online/
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'poshub-online');

console.log('Generating online deployment package in:', TARGET);

// Helper to remove directory recursively
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Helper to copy directory recursively with filter
function copyDir(src, dest, filter = () => true) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (!filter(entry.name, srcPath)) continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, filter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Clean target
removeDir(TARGET);
fs.mkdirSync(TARGET, { recursive: true });

// 2. Setup API
console.log('-> Packaging api/ ...');
const apiDest = path.join(TARGET, 'api');
fs.mkdirSync(apiDest, { recursive: true });

const apiFiles = [
  'app.js',
  'server.js',
  'shard.js',
  'package.json',
  'package-lock.json',
  'ecosystem.config.js',
  '.env.example',
  'README.md',
  'LICENSE',
];

for (const file of apiFiles) {
  const p = path.join(ROOT, 'api', file);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(apiDest, file));
  }
}

// Copy api/src, api/json, api/utils
copyDir(path.join(ROOT, 'api', 'src'), path.join(apiDest, 'src'));
copyDir(path.join(ROOT, 'api', 'json'), path.join(apiDest, 'json'));
copyDir(path.join(ROOT, 'api', 'utils'), path.join(apiDest, 'utils'));

// Copy required api scripts
const apiScriptsDest = path.join(apiDest, 'scripts');
fs.mkdirSync(apiScriptsDest, { recursive: true });
const neededScripts = [
  'patch-whatsapp-media.cjs',
  'validate-config.js',
  'test-db.js',
];
for (const s of neededScripts) {
  const sp = path.join(ROOT, 'api', 'scripts', s);
  if (fs.existsSync(sp)) {
    fs.copyFileSync(sp, path.join(apiScriptsDest, s));
  }
}

// Create uploads and logs dirs
fs.mkdirSync(path.join(apiDest, 'uploads'), { recursive: true });
fs.writeFileSync(path.join(apiDest, 'uploads', '.gitkeep'), '');
fs.mkdirSync(path.join(apiDest, 'logs'), { recursive: true });
fs.writeFileSync(path.join(apiDest, 'logs', '.gitkeep'), '');

// Generate pre-filled production .env with secure random keys
const hex = (bytes) => crypto.randomBytes(bytes).toString('hex');
const productionEnv = `# =================================================================
# PosHub Production Environment Configuration
# Generated on: ${new Date().toISOString()}
# Domain: https://posghana.shop
# =================================================================

# Server Port & Mode
PORT=5000
NODE_ENV=production

# Public URL used in receipts, emails, and external webhooks
PUBLIC_SERVER_URL=https://posghana.shop

# MongoDB Database Connection
# Default assumes local MongoDB running on standard port 27017
# Or replace with MongoDB Atlas connection string:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/PosnicPro?retryWrites=true&w=majority
MONGODB_URI=mongodb://127.0.0.1:27017/PosnicPro
MAX_POOL_SIZE=10

# Cryptographic Keys (Auto-generated unique keys for this deployment)
JWT_SECRET=${hex(48)}
SESSION_SECRET=${hex(48)}
ENCRYPTION_KEY=${hex(16)}
ENCRYPTION_IV=${hex(8)}
KIOSK_API_KEY=${hex(32)}

# Session & JWT Expiration
JWT_EXPIRES_IN=30d
JWT_COOKIE_EXPIRES_IN=30

# Optional AWS S3 File Storage (If unset, uploads are stored locally in api/uploads)
S3_KEY=
S3_SECRET=
S3_BUCKET=
S3_REGION=eu-west-1

# Optional SMS / Email Provider keys
BREVO_API_KEY=
MSG91_AUTH_KEY=
MSG91_TEMPLATE_ID=
`;

fs.writeFileSync(path.join(apiDest, '.env.production'), productionEnv, 'utf8');
fs.writeFileSync(path.join(apiDest, '.env'), productionEnv, 'utf8');

// 3. Setup Frontend
console.log('-> Packaging frontend/ ...');
const frontendDest = path.join(TARGET, 'frontend');
fs.mkdirSync(frontendDest, { recursive: true });

// Copy public (compiled) and static
copyDir(path.join(ROOT, 'frontend', 'public'), path.join(frontendDest, 'public'));
copyDir(path.join(ROOT, 'frontend', 'static'), path.join(frontendDest, 'static'));

// 4. Setup Order & Menu
console.log('-> Packaging order/ and menu/ ...');
copyDir(path.join(ROOT, 'order'), path.join(TARGET, 'order'));
copyDir(path.join(ROOT, 'menu'), path.join(TARGET, 'menu'));

// 5. Setup Languages
console.log('-> Packaging languages/ ...');
copyDir(path.join(ROOT, 'languages'), path.join(TARGET, 'languages'));

// 6. Setup Docs
console.log('-> Packaging docs/ ...');
const docsDest = path.join(TARGET, 'docs');
fs.mkdirSync(docsDest, { recursive: true });
const openApiSource = path.join(ROOT, 'docs', 'openapi.json');
if (fs.existsSync(openApiSource)) {
  fs.copyFileSync(openApiSource, path.join(docsDest, 'openapi.json'));
}

// 7. Write root deployment scripts and configurations
console.log('-> Creating production configs & scripts...');

// Nginx Config
const nginxConfig = `# Nginx Configuration for PosHub POS (posghana.shop)
# Place in: /etc/nginx/sites-available/posghana.shop
# Symlink: ln -s /etc/nginx/sites-available/posghana.shop /etc/nginx/sites-enabled/

server {
    listen 80;
    listen [::]:80;
    server_name posghana.shop www.posghana.shop;

    # Allow Let's Encrypt domain verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name posghana.shop www.posghana.shop;

    # SSL Certificates (Managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/posghana.shop/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/posghana.shop/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Upload file size limit (product images, company logos)
    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json application/javascript image/svg+xml;

    # Reverse proxy to Node.js backend
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Real-time WebSocket connection
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
    }
}
`;
fs.writeFileSync(path.join(TARGET, 'nginx.conf'), nginxConfig, 'utf8');

// Root ecosystem.config.js for PM2
const pm2Config = `// PM2 process manager configuration for PosHub POS
module.exports = {
  apps: [
    {
      name: "poshub-web",
      script: "server.js",
      cwd: "./api",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1500M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      time: true,
      out_file: "./api/logs/pm2-out.log",
      error_file: "./api/logs/pm2-error.log",
      merge_logs: true,
    },
  ],
};
`;
fs.writeFileSync(path.join(TARGET, 'ecosystem.config.js'), pm2Config, 'utf8');

// Systemd service unit file
const systemdUnit = `[Unit]
Description=PosHub POS Web Application
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/poshub/api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5000
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
`;
fs.writeFileSync(path.join(TARGET, 'poshub.service'), systemdUnit, 'utf8');

// Automated Deploy Script for Ubuntu / Debian VPS
const deployScript = `#!/usr/bin/env bash
# =============================================================================
# PosHub POS - Automated VPS Setup & Deployment Script
# Supports: Ubuntu 22.04 LTS / 24.04 LTS, Debian 12
# Domain: posghana.shop
# =============================================================================
set -euo pipefail

echo ""
echo "=========================================================="
echo "         PosHub POS Automated VPS Deployment             "
echo "=========================================================="
echo ""

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run this script with sudo or as root:"
  echo "    sudo bash deploy.sh"
  exit 1
fi

DOMAIN="posghana.shop"
APP_DIR="/var/www/poshub"
CURRENT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

echo "[1/7] Updating package repositories..."
apt-get update -qq
apt-get install -y -qq curl gnupg git ufw nginx certbot python3-certbot-nginx ca-certificates

# 1. Install Node.js 22 LTS if not already installed
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "[2/7] Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
fi
echo "      Node.js version: $(node -v)"
echo "      NPM version: $(npm -v)"

# 2. Install MongoDB 8.0 Community Edition if not present
if ! command -v mongod >/dev/null 2>&1; then
  echo "[3/7] Installing MongoDB 8.0..."
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
  UBUNTU_CODENAME="$(. /etc/os-release && echo "\$UBUNTU_CODENAME")"
  [ -z "\$UBUNTU_CODENAME" ] && UBUNTU_CODENAME="noble"
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu \${UBUNTU_CODENAME}/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -qq
  apt-get install -y -qq mongodb-org >/dev/null
fi

systemctl enable --now mongod >/dev/null 2>&1 || true
sleep 2
if systemctl is-active --quiet mongod; then
  echo "      MongoDB is active and running."
else
  echo "      [!] Note: MongoDB service not started automatically, check 'systemctl status mongod'"
fi

# 3. Install PM2 globally
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[4/7] Installing PM2 process manager..."
  npm install -g pm2 --silent
fi

# 4. Copy files to production directory if running from somewhere else
echo "[5/7] Setting up application files in \${APP_DIR}..."
mkdir -p "\${APP_DIR}"
if [ "\${CURRENT_DIR}" != "\${APP_DIR}" ]; then
  cp -r "\${CURRENT_DIR}"/* "\${APP_DIR}/"
fi

cd "\${APP_DIR}/api"

echo "      Installing API production dependencies (npm install --omit=dev)..."
npm install --omit=dev --no-audit --no-fund

# Ensure production .env exists
if [ ! -f "\${APP_DIR}/api/.env" ]; then
  if [ -f "\${APP_DIR}/api/.env.production" ]; then
    cp "\${APP_DIR}/api/.env.production" "\${APP_DIR}/api/.env"
  fi
fi

# Create logs directory
mkdir -p "\${APP_DIR}/api/logs"
mkdir -p "\${APP_DIR}/api/uploads"

# 5. Start application with PM2
echo "[6/7] Starting PosHub with PM2..."
cd "\${APP_DIR}"
pm2 delete poshub-web >/dev/null 2>&1 || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

# 6. Configure Nginx
echo "[7/7] Configuring Nginx reverse proxy..."
cp "\${APP_DIR}/nginx.conf" "/etc/nginx/sites-available/\${DOMAIN}"
# Create HTTP-only initial config so Nginx can reload before SSL certificate is issued
cat > "/etc/nginx/sites-available/\${DOMAIN}" <<NGINX_INIT
server {
    listen 80;
    listen [::]:80;
    server_name \${DOMAIN} www.\${DOMAIN};

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }
}
NGINX_INIT

ln -sf "/etc/nginx/sites-available/\${DOMAIN}" "/etc/nginx/sites-enabled/\${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Setup UFW Firewall
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
echo "y" | ufw enable >/dev/null 2>&1 || true

SERVER_IP=\$(hostname -I | awk '{print \$1}')

echo ""
echo "=========================================================="
echo "          PosHub POS Deployment Successful!             "
echo "=========================================================="
echo ""
echo "  Web URL:      http://\${DOMAIN} (or http://\${SERVER_IP})"
echo "  Backend Port: http://127.0.0.1:5000"
echo "  PM2 Status:   pm2 status"
echo "  Logs:         pm2 logs poshub-web"
echo ""
echo "  Next Step (SSL Certificate):"
echo "  Point your domain DNS A-record to \${SERVER_IP} then run:"
echo "    sudo certbot --nginx -d \${DOMAIN} -d www.\${DOMAIN}"
echo ""
echo "=========================================================="
`;
fs.writeFileSync(path.join(TARGET, 'deploy.sh'), deployScript, { encoding: 'utf8', mode: 0o755 });

// Quick Start Script
const startScript = `#!/usr/bin/env bash
cd "$(dirname "$0")/api"
node server.js
`;
fs.writeFileSync(path.join(TARGET, 'start.sh'), startScript, { encoding: 'utf8', mode: 0o755 });

// Dockerfile
const dockerfile = `FROM node:22-alpine

WORKDIR /app

# Install native dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy package manifests first for optimal caching
COPY api/package*.json ./api/
RUN cd api && npm install --omit=dev --no-audit

# Copy application directories
COPY api ./api
COPY frontend/public ./frontend/public
COPY frontend/static ./frontend/static
COPY order ./order
COPY menu ./menu
COPY languages ./languages
COPY docs ./docs

# Set working directory to api
WORKDIR /app/api

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
`;
fs.writeFileSync(path.join(TARGET, 'Dockerfile'), dockerfile, 'utf8');

// Docker Compose
const dockerCompose = `version: '3.8'

services:
  mongodb:
    image: mongo:8.0
    restart: always
    volumes:
      - mongo_data:/data/db
    ports:
      - "127.0.0.1:27017:27017"

  poshub:
    build: .
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://mongodb:27017/PosnicPro
      - PUBLIC_SERVER_URL=https://posghana.shop
    depends_on:
      - mongodb
    volumes:
      - ./api/uploads:/app/api/uploads
      - ./api/logs:/app/api/logs

volumes:
  mongo_data:
`;
fs.writeFileSync(path.join(TARGET, 'docker-compose.yml'), dockerCompose, 'utf8');

// Dockerignore
const dockerignore = `node_modules
api/node_modules
.git
.github
*.log
api/logs/*
dist
`;
fs.writeFileSync(path.join(TARGET, '.dockerignore'), dockerignore, 'utf8');

// Comprehensive README.md for deployment
const readme = `# PosHub POS - Online Web Deployment Package

This package contains the complete online web version of **PosHub POS**, pre-built and configured for hosting on a VPS (Hostinger, DigitalOcean, Linode, AWS EC2, or any Ubuntu/Debian server) under your domain **https://posghana.shop**.

---

## Package Architecture

\`\`\`
poshub-online/
├── api/                      # Node.js + Express backend API
│   ├── server.js             # HTTP server entry point & WebSocket service
│   ├── app.js                # Express app & static file routing
│   ├── src/                  # Core controllers, models, routes & services
│   ├── package.json          # Production dependencies
│   ├── .env.production       # Generated production secrets
│   ├── logs/                 # Output log files
│   └── uploads/              # Uploaded shop logos and attachments
├── frontend/
│   ├── public/               # Pre-compiled, minified, fingerprinted web frontend
│   └── static/               # Fonts, icons, and static images
├── order/                    # Customer online ordering and checkout portal
├── menu/                     # Digital menu system
├── languages/                # Language localization dictionaries (44 languages)
├── docs/                     # OpenAPI specifications
├── deploy.sh                 # 1-command automated VPS installation script
├── ecosystem.config.js       # PM2 production process configuration
├── nginx.conf                # Nginx reverse proxy configuration for posghana.shop
├── docker-compose.yml        # Optional Docker deployment
├── Dockerfile                # Production Docker container definition
└── README.md                 # This guide
\`\`\`

---

## Method 1: Automated 1-Command Deployment on Ubuntu VPS (Recommended)

### Prerequisites:
- A VPS running **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** (e.g., Hostinger KVM VPS).
- Domain DNS A-Record pointed to your VPS IP:
  - \`posghana.shop\` -> \`<YOUR_VPS_IP>\`
  - \`www.posghana.shop\` -> \`<YOUR_VPS_IP>\`

### Step 1: Upload Files to Your VPS
You can upload the entire \`poshub-online\` folder or the zip archive \`poshub-online.zip\` using:
- **Hostinger hPanel File Manager** (upload & extract to \`/var/www/poshub\`)
- Or via **SCP / SFTP / rsync**:
  \`\`\`bash
  scp -r poshub-online root@<YOUR_VPS_IP>:/var/www/poshub
  \`\`\`

### Step 2: Run the Deployment Script
SSH into your VPS as \`root\` and run:
\`\`\`bash
cd /var/www/poshub
sudo bash deploy.sh
\`\`\`

The script automatically:
1. Installs Node.js 22 LTS, MongoDB 8.0, Nginx, Certbot, and PM2.
2. Installs production dependencies (\`npm install --omit=dev\`).
3. Starts the backend application under PM2 with automatic startup on reboot.
4. Configures Nginx reverse proxy on port 80/443 and enables the UFW firewall.

### Step 3: Install Free SSL Certificate (HTTPS)
Once your domain DNS has propagated to the VPS IP, run:
\`\`\`bash
sudo certbot --nginx -d posghana.shop -d www.posghana.shop
\`\`\`
Certbot will issue and automatically configure your Let's Encrypt SSL certificate and auto-renewal.

---

## Method 2: Manual Installation Steps

If you want to configure each component manually:

### 1. Install Node.js & MongoDB
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx mongodb-org
sudo systemctl enable --now mongod
\`\`\`

### 2. Install Dependencies & Start PM2
\`\`\`bash
cd /var/www/poshub/api
npm install --omit=dev
sudo npm install -g pm2
cd /var/www/poshub
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

### 3. Nginx Setup
Copy \`nginx.conf\` to \`/etc/nginx/sites-available/posghana.shop\`:
\`\`\`bash
sudo cp nginx.conf /etc/nginx/sites-available/posghana.shop
sudo ln -s /etc/nginx/sites-available/posghana.shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

---

## Method 3: Docker Deployment

If you prefer using Docker and Docker Compose:
\`\`\`bash
cd /var/www/poshub
docker compose up -d --build
\`\`\`
This will spin up both the MongoDB container and the PosHub application container on port 5000.

---

## Default Login & Shop Setup

- Open your browser at: **\`https://posghana.shop\`** (or \`http://<YOUR_VPS_IP>\`)
- First-time installation wizard will prompt you to set up your store and super admin account.
- If migrating existing database from your local machine, use \`mongodump\` and \`mongorestore\`:
  \`\`\`bash
  # Local:
  mongodump --db=PosnicPro --out=./db-backup

  # VPS:
  mongorestore --db=PosnicPro ./db-backup/PosnicPro
  \`\`\`

## Useful Maintenance Commands

| Action | Command |
|---|---|
| Check app status | \`pm2 status\` |
| View live logs | \`pm2 logs poshub-web\` |
| Restart app | \`pm2 restart poshub-web\` |
| Reload Nginx | \`sudo systemctl reload nginx\` |
| MongoDB status | \`sudo systemctl status mongod\` |
`;

fs.writeFileSync(path.join(TARGET, 'README.md'), readme, 'utf8');

console.log('✅ Online hosting package generated successfully at:', TARGET);

