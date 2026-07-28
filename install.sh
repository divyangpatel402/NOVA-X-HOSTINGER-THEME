#!/bin/bash

# ==========================================
# Nova Hosting Panel - Auto VPS Installer
# ==========================================

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit
fi

echo -e "\n* Nova Hosting Panel Auto-Installer"
echo "* https://github.com/divyangpatel402/NOVA-X-HOSTINGER-THEME"
echo -e "\nWhat would you like to do?\n"
echo "[0] Install Nova Hosting Panel"
echo "[1] Uninstall Nova Hosting Panel"
echo ""
read -p "* Input 0-1: " CHOICE < /dev/tty

if [ "$CHOICE" == "1" ] || [ "$CHOICE" == "2" ] || [ "$CHOICE" == "uninstall" ]; then
    echo -e "\n* Uninstalling Nova Hosting Panel & Deleting Game Servers..."
    
    # 1. Stop and remove all game server Docker containers
    echo "* Stopping and removing Docker game servers..."
    docker ps -a -q --filter "name=nova-server-" | xargs -r docker rm -f 2>/dev/null || true
    docker ps -a -q --filter "ancestor=itzg/minecraft-server" | xargs -r docker rm -f 2>/dev/null || true
    docker ps -a -q --filter "ancestor=itzg/bungeecord" | xargs -r docker rm -f 2>/dev/null || true
    docker ps -a -q | xargs -I {} sh -c 'docker inspect {} 2>/dev/null | grep -q "nova-panel" && docker rm -f {}' 2>/dev/null || true

    # 2. Stop PM2 process
    echo "* Stopping PM2 panel process..."
    pm2 stop nova-panel 2>/dev/null || true
    pm2 delete nova-panel 2>/dev/null || true
    pm2 save --force 2>/dev/null || true
    
    # 3. Stop caddy and remove SSL config
    echo "* Removing SSL configuration..."
    systemctl stop caddy 2>/dev/null || true
    rm -f /etc/caddy/Caddyfile
    
    # 4. Remove all panel files, server worlds, backups, and database data
    echo "* Deleting all server files, backups, and panel data..."
    rm -rf /var/www/nova-panel
    
    echo -e "\n✅ Nova Hosting Panel and all hosted game servers have been completely uninstalled and deleted!"
    exit 0
elif [ "$CHOICE" == "0" ] || [ "$CHOICE" == "install" ]; then
    echo -e "\n* Starting Nova Panel Installation..."
else
    echo "* Invalid choice. Exiting."
    exit 1
fi

# 0. Configure APT for Cloud VPS / EC2 (Fix "Waiting for headers" & IPv6 timeout hangs)
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a
export NEEDRESTART_SUSPEND=1
export DEBCONF_NONINTERACTIVE_SEEN=true

mkdir -p /etc/apt/apt.conf.d >/dev/null 2>&1
echo 'Acquire::ForceIPv4 "true";' > /etc/apt/apt.conf.d/99force-ipv4
echo 'Acquire::Retries "3";' >> /etc/apt/apt.conf.d/99force-ipv4
echo 'Acquire::http::Timeout "15";' >> /etc/apt/apt.conf.d/99force-ipv4
echo 'Acquire::ftp::Timeout "15";' >> /etc/apt/apt.conf.d/99force-ipv4

# Release any stuck dpkg / apt locks from background auto-upgrades
killall -9 apt apt-get dpkg unattended-upgrade needrestart >/dev/null 2>&1 || true
rm -f /var/lib/apt/lists/lock /var/cache/apt/archives/lock /var/lib/dpkg/lock* >/dev/null 2>&1 || true
dpkg --configure -a >/dev/null 2>&1 || true

# 1. Update system (Skip apt-get upgrade to prevent needrestart curses prompt and 30-min kernel lockups)
echo -e "\n[+] Updating system package lists..."
apt-get update -qq -y >/dev/null 2>&1
apt-get install -qq -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" ca-certificates curl gnupg git sudo debian-keyring debian-archive-keyring apt-transport-https >/dev/null 2>&1

# 2. Install Node.js (v20 via fast Keyring method to avoid setup script hangs)
echo -e "\n[+] Installing Node.js v20..."
mkdir -p /etc/apt/keyrings >/dev/null 2>&1
curl -fsSL -4 https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes >/dev/null 2>&1
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update -qq -y >/dev/null 2>&1
apt-get install -qq -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" nodejs >/dev/null 2>&1

# 3. Install Docker
echo -e "\n[+] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL -4 https://get.docker.com -o get-docker.sh >/dev/null 2>&1
    sh get-docker.sh >/dev/null 2>&1 || apt-get install -qq -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" docker.io >/dev/null 2>&1
    rm -f get-docker.sh >/dev/null 2>&1 || true
else
    echo "Docker is already installed."
fi

# 4. Install PM2
echo -e "\n[+] Installing PM2..."
npm install -g pm2 --silent >/dev/null 2>&1

# 5. Install Caddy (For Auto-SSL & Reverse Proxy)
echo -e "\n[+] Installing Caddy Server..."
curl -1sLf -4 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes >/dev/null 2>&1
curl -1sLf -4 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq -y >/dev/null 2>&1
apt-get install -qq -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" caddy >/dev/null 2>&1

# 6. Clone the GitHub Repository
echo -e "\n[+] Cloning Panel Repository..."
mkdir -p /var/www >/dev/null 2>&1
cd /var/www
# Remove existing folder if re-installing
rm -rf nova-panel >/dev/null 2>&1
# Using your provided github link:
git clone -q https://github.com/divyangpatel402/NOVA-X-HOSTINGER-THEME.git nova-panel >/dev/null 2>&1
cd nova-panel

# If the code was pushed with the /theme folder, enter it
if [ -d "theme" ]; then
    cd theme
fi

# 7. Install Node modules
echo -e "\n[+] Installing Panel Dependencies..."
npm install --silent >/dev/null 2>&1

# 8. Run the interactive installer (install.js)
echo -e "\n[+] Starting Interactive Setup..."
node install.js < /dev/tty

# 8.5 Configure Firewall (UFW)
echo -e "\n[+] Configuring Firewall (Unlocking Ports)..."
ufw allow 80/tcp >/dev/null 2>&1
ufw allow 443/tcp >/dev/null 2>&1
ufw allow 3000/tcp >/dev/null 2>&1
ufw allow 3000/udp >/dev/null 2>&1
ufw reload >/dev/null 2>&1

# 9. Build and start Next.js application first
echo -e "\n⏳ [PLEASE WAIT 1-2 MINUTES] Building Next.js Application (Do not close terminal)..."
npm run build || { echo -e "\n❌ [ERROR] Next.js build failed! Please check code errors above."; exit 1; }

echo -e "\n[+] Cleaning up old processes & ports..."
pm2 delete all >/dev/null 2>&1 || true
killall -9 node >/dev/null 2>&1 || true
fuser -k 3000/tcp >/dev/null 2>&1 || true
sleep 2

echo -e "\n[+] Starting Nova Panel Service in PM2..."
export NODE_ENV=production
pm2 start server.js --name "nova-panel" >/dev/null 2>&1
pm2 save >/dev/null 2>&1
pm2 startup >/dev/null 2>&1 || true
sleep 3

# 10. Configure Caddy for the Domain AFTER server is running
echo -e "\n[+] Configuring Web Server (HTTPS)..."
DOMAIN=$(grep PANEL_DOMAIN .env | cut -d '=' -f2)

if [ -n "$DOMAIN" ]; then
cat <<EOF > /etc/caddy/Caddyfile
$DOMAIN {
    reverse_proxy 127.0.0.1:3000
}
EOF
    # Stop apache/nginx to free up port 80 for Caddy
    systemctl stop apache2 nginx >/dev/null 2>&1 || true
    systemctl disable apache2 nginx >/dev/null 2>&1 || true
    
    systemctl restart caddy >/dev/null 2>&1
    systemctl enable caddy >/dev/null 2>&1
    echo "✅ SSL Certificate & Domain Configured for $DOMAIN"
else
    echo "❌ Domain not found in .env, skipping SSL setup."
fi

echo -e "\n=========================================="
echo "✅ Nova Hosting Panel successfully installed!"
echo "Aapka panel ab https://$DOMAIN par live hai."
echo "==========================================\n"
