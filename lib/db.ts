import fs from 'fs';
import path from 'path';
import vpsConfig from '@/app/config/sections/vps.json';
import gamesConfig from '@/app/config/sections/games.json';
import dedicatedConfig from '@/app/config/sections/dedicated.json';
import discordConfig from '@/app/config/sections/discord.json';
import webhostingConfig from '@/app/config/sections/webhosting.json';

const DB_PATH = path.join(process.cwd(), 'data.json');

export interface Order {
  orderId: string;
  product: string;
  price: number | string;
  user: {
    email: string;
  };
  status: string;
  gatewayOrderId?: string;
  slottedAmount?: number;
  upiIntent?: string;
  lastFinalPrice?: number;
  couponCode?: string;
  discount?: number;
  originalPrice?: number;
  paymentVerified?: boolean;
  timestamp: number;
  clientConfig?: Record<string, any>;
  deliveryDetails?: string;
  utr?: string;
  provisionedServerId?: string;
}

export interface Egg {
  id: string;
  name: string;
  description: string;
  nest: string;
  docker_image: string;
  startup_command: string;
  author: string;
}

export interface PteroServer {
  id: string;
  name: string;
  ownerEmail: string;
  node: string;
  allocation: string;
  eggId: string;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
  };
  docker_image: string;
  startup_command: string;
  nest?: string;
  allowedEggs?: string[];
  environment?: Record<string, string>;
  status: 'offline' | 'online' | 'suspended';
  ipAlias?: string;
  containerId?: string;
}

export interface Node {
  id: string;
  name: string;
  fqdn: string;
  memory: number;
  disk: number;
  status: 'online' | 'offline';
}

export interface Allocation {
  id: string;
  nodeId: string;
  ip: string;
  alias: string;
  port: number;
  assignedToServerId: string | null;
}

export interface DB {
  orders: Order[];
  users?: any[];
  eggs?: Egg[];
  pteroServers?: PteroServer[];
  nodes?: Node[];
  allocations?: Allocation[];
  settings?: {
    orderChannelId?: string;
    clearLogsChannelId?: string;
    coupons?: { code: string; discount: number; uses: number; maxUses: number }[];
    productEggs?: Record<string, string>;
    [key: string]: any;
  };
}

const NODE_STARTUP_CMD = `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z \${NODE_PACKAGES} ]]; then /usr/local/bin/npm install \${NODE_PACKAGES}; fi; if [[ ! -z \${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall \${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; if [ ! -z "\${MAIN_FILE}" ] && [ -f "/home/container/\${MAIN_FILE}" ]; then /usr/local/bin/node "/home/container/\${MAIN_FILE}" \${NODE_ARGS}; else /usr/local/bin/node index.js \${NODE_ARGS}; fi`;
const PYTHON_STARTUP_CMD = `if [[ -d .git ]] && [[ "{{AUTO_UPDATE}}" == "1" ]]; then git pull; fi; if [[ ! -z "{{PY_PACKAGES}}" ]]; then pip install -U --prefix .local {{PY_PACKAGES}}; fi; if [[ -f /home/container/\${REQUIREMENTS_FILE} ]]; then pip install -U --prefix .local -r \${REQUIREMENTS_FILE}; fi; /usr/local/bin/python /home/container/{{PY_FILE}}`;
const GMOD_STARTUP_CMD = `./srcds_run -game garrysmod -console -port {{SERVER_PORT}} +ip 0.0.0.0 +host_workshop_collection {{WORKSHOP_ID}} +map {{SRCDS_MAP}} +gamemode {{GAMEMODE}} -strictportbind -norestart +sv_setsteamaccount {{STEAM_TOKEN}} +maxplayers {{MAX_PLAYERS}}  -tickrate {{TICKRATE}}  $( [ "$LUA_REFRESH" == "1" ] || printf %s '-disableluarefresh' )`;
const CS2_STARTUP_CMD = `LD_LIBRARY_PATH="$HOME/game/bin/linuxsteamrt64:$LD_LIBRARY_PATH" ./game/bin/linuxsteamrt64/cs2 -dedicated $( [ "$VAC_ENABLED" == "1" ] || printf %s ' -insecure' ) -ip 0.0.0.0 -port {{SERVER_PORT}} -tv_port {{TV_PORT}} -maxplayers {{MAX_PLAYERS}} $( [ "$RCON_ENABLED" == "0" ] || printf %s ' -usercon' ) +game_mode {{GAME_MODE}} +game_type {{GAME_TYPE}} +map {{SRCDS_MAP}} +hostname "{{SERVER_NAME}}" +sv_password "{{SERVER_PASSWORD}}" +rcon_password "{{RCON_PASSWORD}}" +sv_setsteamaccount {{STEAM_GSLT}}`;
const RUST_STARTUP_CMD = `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; cargo run --release`;
const ARK_STARTUP_CMD = `rmv() { echo  "stopping server"; rcon -t rcon -a 127.0.0.1:\${RCON_PORT} -p \${ARK_ADMIN_PASSWORD} saveworld &&rcon -t rcon -a 127.0.0.1:\${RCON_PORT} -p \${ARK_ADMIN_PASSWORD} DoExit && wait \${ARK_PID}; echo "Server Closed"; exit; }; trap rmv 15 2; cd ShooterGame/Binaries/Linux && ./ShooterGameServer {{SERVER_MAP}}?listen?SessionName="{{SESSION_NAME}}"?ServerPassword={{ARK_PASSWORD}}?ServerAdminPassword={{ARK_ADMIN_PASSWORD}}?Port={{SERVER_PORT}}?RCONPort={{RCON_PORT}}?QueryPort={{QUERY_PORT}}?RCONEnabled=True?MaxPlayers={{MAX_PLAYERS}}?GameModIds=\\"{{MOD_ID}}\\"$( [ "$BATTLE_EYE" == "1" ] || printf %s ' -NoBattlEye' ) -server -automanagedmods {{ARGS}} -log & ARK_PID=$! ; until echo "waiting for rcon connection..."; (rcon -t rcon -a 127.0.0.1:\${RCON_PORT} -p \${ARK_ADMIN_PASSWORD})<&0 & wait $!; do sleep 5; done`;
const VALHEIM_STARTUP_CMD = `./valheim_server.x86_64 -nographics -batchmode -name "{{SERVER_NAME}}" -port {{SERVER_PORT}} -world "{{WORLD}}" -password "{{PASSWORD}}" -public {{PUBLIC_SERVER}} -saveinterval {{BACKUP_INTERVAL}} -backups {{BACKUP_COUNT}} -backupshort {{BACKUP_SHORTTIME}} -backuplong {{BACKUP_LONGTIME}} $( [[ {{ENABLE_CROSSPLAY}} -eq 1 ]] && echo " -crossplay ") > >(sed -uE "{{CONSOLE_FILTER}}") & trap "{{STOP}}" 15; wait $!`;

const MINECRAFT_STARTUP_CMD = `java -Xms128M -Xmx{{SERVER_MEMORY}}M -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}`;

const DUMMY_EGGS_TO_REMOVE = [
  "web_apache", "ada_lang", "bun_js", "cpp_gcc", "csharp_dotnet", "deno_js", 
  "discord_bot_node", "discord_bot_python", "docker_engine", "elixir_runtime", 
  "fivem_gta", "flutter_web", "golang_122", "godot_server", "haskell_ghc", 
  "java_8", "java_17", "java_21", "kotlin_jvm", "lua_lang", 
  "mongodb_server", "mysql_server", "nodejs_18", "nodejs_22", "nextjs_app", 
  "ocaml_lang", "python_310", "python_312", "php_83", "postgresql_server", 
  "palworld_server", "rust_lang", "ruby_lang", "redis_server", "swift_lang", "sqlite_db", 
  "ts_node", "terraria_server", "ubuntu_sandbox", "wordpress_app", "xml_server", 
  "zig_lang", "zomboid_server"
];

const DEFAULT_EGGS: Egg[] = [
  { id: "minecraft_java", name: "Minecraft Java (Paper / Purpur)", description: "High performance Java server for Minecraft plugins, Forge, and Fabric modpacks", nest: "Minecraft", docker_image: "ghcr.io/pterodactyl/yolks:java_17", startup_command: MINECRAFT_STARTUP_CMD, author: "NOVA X" },
  { id: "nodejs_20", name: "Node.js Generic", description: "Modern Node.js runtime for Discord bots, Express apps, and scripts", nest: "Discord Bot", docker_image: "ghcr.io/ptero-eggs/yolks:nodejs_20", startup_command: NODE_STARTUP_CMD, author: "parker@parkervcp.com" },
  { id: "python_311", name: "Python Generic", description: "Python runtime optimized for discord.py, AI scripts, and bots", nest: "Discord Bot", docker_image: "ghcr.io/pterodactyl/yolks:python_311", startup_command: PYTHON_STARTUP_CMD, author: "NOVA X" },
  { id: "web_hosting_nginx", name: "Nginx Web Hosting", description: "Fast Nginx web server with static HTML and PHP support", nest: "Web Hosting", docker_image: "registry.gitlab.com/tenten8401/pterodactyl-nginx", startup_command: "./start.sh", author: "NOVA X" },
  { id: "gmod_game", name: "Garry's Mod Dedicated Server", description: "Valve Source Engine sandbox game server with Lua addon support", nest: "Game Servers", docker_image: "ghcr.io/pterodactyl/games:gmod", startup_command: GMOD_STARTUP_CMD, author: "NOVA X" },
  { id: "cs2_game", name: "Counter-Strike 2 Dedicated", description: "Official CS2 Dedicated Server with SourceMod & Metamod support", nest: "Game Servers", docker_image: "ghcr.io/pterodactyl/games:cs2", startup_command: CS2_STARTUP_CMD, author: "NOVA X" },
  { id: "rust_game", name: "Rust Survival Server", description: "Facepunch Rust dedicated survival server with Oxide/uMod support", nest: "Game Servers", docker_image: "ghcr.io/pterodactyl/games:rust", startup_command: RUST_STARTUP_CMD, author: "NOVA X" },
  { id: "ark_survival", name: "Ark: Survival Evolved", description: "Multiplayer survival action-adventure game with dinosaurs and primeval creatures", nest: "Game Servers", docker_image: "ghcr.io/ptero-eggs/games:source", startup_command: ARK_STARTUP_CMD, author: "dev@shepper.fr" },
  { id: "valheim_server", name: "Valheim Viking Survival", description: "Viking exploration and survival game server for co-op players", nest: "Game Servers", docker_image: "ghcr.io/ptero-eggs/games:valheim", startup_command: VALHEIM_STARTUP_CMD, author: "NOVA X" }
];

function syncHostingEggs(db: DB) {
  try {
    if (!db.eggs) db.eggs = [];
    const eggsDir = path.join(process.cwd(), 'hosting eggs');
    if (fs.existsSync(eggsDir)) {
      const files = fs.readdirSync(eggsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const contentStr = fs.readFileSync(path.join(eggsDir, file), 'utf8');
            const content = JSON.parse(contentStr);
            const eggName = content.name || file.replace('.json', '');
            
            // Map file/egg name to clean id or match existing
            let targetId = 'imported_' + eggName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const lowerName = eggName.toLowerCase();
            if (lowerName.includes('node') || lowerName.includes('js')) targetId = 'nodejs_20';
            else if (lowerName.includes('python')) targetId = 'python_311';
            else if (lowerName.includes('garry') || lowerName.includes('gmod')) targetId = 'gmod_game';
            else if (lowerName.includes('counter-strike') || lowerName.includes('cs2')) targetId = 'cs2_game';
            else if (lowerName.includes('rust')) targetId = 'rust_game';
            else if (lowerName.includes('ark')) targetId = 'ark_survival';
            else if (lowerName.includes('valheim')) targetId = 'valheim_server';
            else if (lowerName.includes('nginx')) targetId = 'web_hosting_nginx';

            const dockerImg = content.image || content.docker_images ? (typeof content.docker_images === 'object' ? Object.values(content.docker_images)[0] : content.docker_images) : 'ghcr.io/pterodactyl/yolks:java_17';
            const startup = content.startup || '';
            const author = content.author || 'NOVA X';
            const nest = content.nest || (lowerName.includes('bot') || lowerName.includes('node') || lowerName.includes('python') ? 'Discord Bot' : lowerName.includes('nginx') || lowerName.includes('web') ? 'Web Hosting' : 'Game Servers');

            const existing = db.eggs.find((e: Egg) => e.id === targetId || e.name.toLowerCase() === eggName.toLowerCase());
            if (existing) {
              if (startup) existing.startup_command = startup;
              if (dockerImg) existing.docker_image = String(dockerImg);
              existing.nest = nest;
            } else {
              db.eggs.push({
                id: targetId,
                name: eggName,
                description: content.description || `${eggName} server engine`,
                nest: nest,
                docker_image: String(dockerImg),
                startup_command: startup,
                author: author
              });
            }
          } catch (err) {
            // Ignore parse error for individual file
          }
        }
      }
    }
  } catch (err) {
    console.error('Error syncing hosting eggs:', err);
  }
}

function getAllWebsiteStoreProducts() {
  const allProducts: any[] = [];
  const allEngines = ["minecraft_java", "gmod_game", "cs2_game", "rust_game", "ark_survival", "valheim_server", "nodejs_20", "python_311", "web_hosting_nginx"];
  const lightEngines = ["nodejs_20", "python_311", "web_hosting_nginx"];

  // 1. VPS
  for (const plans of Object.values(vpsConfig.plans)) {
    for (const p of (plans as any[])) {
      const ram = p.ram || p.memory || 4096;
      allProducts.push({
        id: p.id,
        name: p.name,
        category: "☁️ Cloud VPS",
        price: typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/[^\d]/g, '')) || 499,
        ram: ram,
        cpu: p.cpu || p.vcpu || 200,
        storage: p.storage || p.disk || 50,
        eggId: "nodejs_20",
        allowedEggs: ram >= 2048 ? allEngines : lightEngines,
        description: "High speed KVM Cloud VPS container with NVMe SSD storage and full terminal access.",
        features: ["KVM Virtualization Speed", "Dedicated NVMe SSD Storage", "Full Root Terminal Access", "1 Gbps DDoS Shielded Network"],
        color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400"
      });
    }
  }

  // 2. Games
  for (const game of gamesConfig.games) {
    let defaultEgg = "minecraft_java";
    const gid = game.id.toLowerCase();
    if (gid.includes("discord")) continue; // Skip discord here as it is handled in section 4
    if (gid.includes("gmod") || gid.includes("garry")) defaultEgg = "gmod_game";
    else if (gid.includes("cs")) defaultEgg = "cs2_game";
    else if (gid.includes("rust")) defaultEgg = "rust_game";
    else if (gid.includes("ark")) defaultEgg = "ark_survival";
    else if (gid.includes("valheim")) defaultEgg = "valheim_server";

    const cat = "🎮 Game Servers";

    for (const plans of Object.values(game.plans)) {
      for (const p of (plans as any[])) {
        const ram = p.ram || p.memory || 4096;
        allProducts.push({
          id: p.id,
          name: `${game.name} - ${p.name}`,
          category: cat,
          price: typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/[^\d]/g, '')) || 299,
          ram: ram,
          cpu: p.cpu || p.vcpu || 200,
          storage: p.storage || p.disk || 30,
          eggId: defaultEgg,
          allowedEggs: ram >= 2048 ? allEngines : lightEngines,
          description: p.description || `Dedicated server container for ${game.name}.`,
          features: ["Instant Automated Provisioning", "DDoS Shielded Routing", "Automated Backups", "24/7 Support"],
          color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400"
        });
      }
    }
  }

  // 3. Dedicated
  for (const plans of Object.values(dedicatedConfig.plans)) {
    for (const p of (plans as any[])) {
      const ram = p.ram || p.memory || 8192;
      allProducts.push({
        id: p.id,
        name: p.name,
        category: "🖥️ Dedicated Servers",
        price: typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/[^\d]/g, '')) || 1999,
        ram: ram,
        cpu: p.cpu || p.vcpu || 400,
        storage: p.storage || p.disk || 100,
        eggId: "minecraft_java",
        allowedEggs: allEngines,
        description: "Dedicated VDS Powerhouse with isolated CPU resources and ultra-low latency.",
        features: ["Isolated Dedicated CPU Cores", "Enterprise NVMe Storage", "Unmetered 10 Gbps Bandwidth", "24/7 Priority VIP Support"],
        color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400"
      });
    }
  }

  // 4. Discord
  for (const plans of Object.values(discordConfig.plans)) {
    for (const p of (plans as any[])) {
      const ram = p.ram || p.memory || 1024;
      allProducts.push({
        id: p.id,
        name: p.name,
        category: "🤖 Discord Bots",
        price: typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/[^\d]/g, '')) || 40,
        ram: ram,
        cpu: p.cpu || p.vcpu || 100,
        storage: p.storage || p.disk || 10,
        eggId: "nodejs_20",
        allowedEggs: ram >= 2048 ? allEngines : lightEngines,
        description: "24/7 online hosting for discord.js or python bots with instant git pull.",
        features: ["Always-On 99.9% Uptime Guarantee", "Node.js & Python Support", "Web terminal & file manager", "Zero sleep delays"],
        color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400"
      });
    }
  }

  // 5. Webhosting
  for (const plans of Object.values(webhostingConfig.plans)) {
    for (const p of (plans as any[])) {
      const ram = p.ram || p.memory || 2048;
      allProducts.push({
        id: p.id,
        name: `Web Hosting - ${p.name}`,
        category: "🌐 Web Hosting",
        price: typeof p.price === 'number' ? p.price : parseInt(String(p.price).replace(/[^\d]/g, '')) || 59,
        ram: ram,
        cpu: p.cpu || p.vcpu || 150,
        storage: p.storage || p.disk || 25,
        eggId: "web_hosting_nginx",
        allowedEggs: ram >= 2048 ? allEngines : lightEngines,
        description: "Fast Nginx web server with PHP-FPM, MySQL integration, and SSL support.",
        features: ["Nginx High Concurrency Routing", "PHP 8.2 & 8.3 with Composer", "Free Subdomain & SSL Ready", "SFTP & Web FTP Access"],
        color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400"
      });
    }
  }

  const seen = new Set();
  return allProducts.filter(p => {
    if (!p || !p.id) return false;
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export const DEFAULT_STORE_PRODUCTS = getAllWebsiteStoreProducts();

export function readDB(): DB {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      const db = JSON.parse(data);
      if (!db.orders) db.orders = [];
      if (!db.settings) db.settings = {};
      if (!db.settings.storeProducts || !Array.isArray(db.settings.storeProducts) || !db.settings.syncedAllWebsitePlansV3) {
        if (!db.settings.storeProducts || !Array.isArray(db.settings.storeProducts)) {
          db.settings.storeProducts = [...DEFAULT_STORE_PRODUCTS];
        } else {
          const seen = new Set();
          db.settings.storeProducts = db.settings.storeProducts.filter((p: any) => {
            if (!p || !p.id) return false;
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
        }
        db.settings.syncedAllWebsitePlansV3 = true;
      }
      if (!db.settings.customNests || !Array.isArray(db.settings.customNests)) {
        db.settings.customNests = [];
      }
      if (!db.settings.deletedNests || !Array.isArray(db.settings.deletedNests)) {
        db.settings.deletedNests = [];
      }
      if (!db.settings.nests || !Array.isArray(db.settings.nests)) {
        db.settings.nests = [
          "Game Servers",
          "Minecraft",
          "Discord Bot",
          "Web Hosting",
          "Databases",
          "Voice Servers",
          "General"
        ];
      }
      db.settings.nests = db.settings.nests.filter((n: string) => !db.settings.deletedNests.includes(n) && !db.settings.deletedNests.includes(n.toLowerCase()));

      if (!db.eggs) db.eggs = [];
      const wipedAll = db.settings.eggsWipedAll === true;
      const deletedIds = Array.isArray(db.settings.deletedEggIds) ? db.settings.deletedEggIds : [];

      if (!db.settings.eggsInitializedV3) {
        if (!wipedAll && db.eggs.length === 0 && deletedIds.length === 0) {
          db.eggs = [...DEFAULT_EGGS];
        }
        db.settings.eggsInitializedV3 = true;
      }

      if (wipedAll) {
        // When wipe-all was used, only block DEFAULT_EGGS from reappearing
        // User-added eggs (not in DEFAULT_EGGS) should survive
        const defaultEggIds = DEFAULT_EGGS.map(e => e.id);
        db.eggs = db.eggs.filter((e: Egg) => !defaultEggIds.includes(e.id) && !DUMMY_EGGS_TO_REMOVE.includes(e.id) && !deletedIds.includes(e.id));
      } else {
        db.eggs = db.eggs.filter((e: Egg) => !DUMMY_EGGS_TO_REMOVE.includes(e.id) && !deletedIds.includes(e.id));
      }

      if (!db.pteroServers) db.pteroServers = [];

      for (const srv of db.pteroServers) {
        const matchingEgg = db.eggs.find((e: Egg) => e.id === srv.eggId);
        if (matchingEgg) {
          srv.startup_command = matchingEgg.startup_command;
          srv.docker_image = matchingEgg.docker_image;
          srv.nest = matchingEgg.nest || "General";
        }
      }

      return db;
    }
  } catch (error) {
    console.error('Error reading DB:', error);
  }
  const defaultDb: DB = { orders: [], eggs: [...DEFAULT_EGGS], pteroServers: [] };
  syncHostingEggs(defaultDb);
  return defaultDb;
}

export function writeDB(db: DB) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

export function newOrderId(): string {
  return "AK" + Date.now().toString(36).toUpperCase();
}

export function assignAllocationToServer(db: DB, serverId: string, nodeId?: string): { nodeName: string; allocation: string } {
  if (!db.allocations) db.allocations = [];
  if (!db.nodes || db.nodes.length === 0) {
    db.nodes = [
      { id: "node_1", name: "Node 1", fqdn: "0.0.0.0", memory: 32768, disk: 500, status: 'online' },
      { id: "node_2", name: "Node 2 (NVMe Pro)", fqdn: "0.0.0.0", memory: 65536, disk: 1000, status: 'online' }
    ];
  }

  const usedAllocations = new Set<string>();
  if (db.pteroServers) {
    db.pteroServers.forEach(s => {
      if (s.allocation) usedAllocations.add(s.allocation);
    });
  }

  const isFree = (a: any) => !a.assignedToServerId && !usedAllocations.has(`${a.ip}:${a.port}`);

  let alloc = undefined;
  if (nodeId && nodeId !== "all") {
    alloc = db.allocations.find(a => a.nodeId === nodeId && isFree(a));
  }
  if (!alloc) {
    alloc = db.allocations.find(a => isFree(a));
  }

  if (alloc) {
    alloc.assignedToServerId = serverId;
    const node = db.nodes.find(n => n.id === alloc.nodeId);
    return { nodeName: node?.name || "Node 1", allocation: `${alloc.ip}:${alloc.port}` };
  }

  // Generate new allocation on the target node if no free allocation exists
  const targetNodeId = (nodeId && nodeId !== "all") ? nodeId : db.nodes[0].id;
  const targetNode = db.nodes.find(n => n.id === targetNodeId) || db.nodes[0];
  
  let maxPort = 25565;
  for (const a of db.allocations) {
    if (a.port >= maxPort) maxPort = a.port;
  }
  let newPort = maxPort + 1;
  while (usedAllocations.has(`${targetNode.fqdn || "0.0.0.0"}:${newPort}`)) {
    newPort++;
  }
  
  const newAlloc: Allocation = {
    id: "alloc_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    nodeId: targetNode.id,
    ip: targetNode.fqdn || "0.0.0.0",
    alias: targetNode.fqdn || "0.0.0.0",
    port: newPort,
    assignedToServerId: serverId
  };
  db.allocations.push(newAlloc);

  return { nodeName: targetNode.name, allocation: `${newAlloc.ip}:${newAlloc.port}` };
}

export function releaseAllocationFromServer(db: DB, serverId: string, allocationStr?: string) {
  if (!db.allocations) return;
  db.allocations.forEach(a => {
    if (a.assignedToServerId === serverId || (allocationStr && `${a.ip}:${a.port}` === allocationStr)) {
      a.assignedToServerId = null;
    }
  });
}
