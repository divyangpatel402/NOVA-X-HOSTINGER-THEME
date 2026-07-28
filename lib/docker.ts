import Docker from "dockerode";
import fs from "fs-extra";
import path from "path";
import { readDB, writeDB } from "./db";

// Handle Sandbox environments
export const isSandbox = !fs.existsSync("/var/run/docker.sock") && process.platform !== "win32";

export const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

// Mock state for sandbox demo
const mockState: Record<string, boolean> = {};
const mockStartedAt: Record<string, number> = {};

const DOCKER_IMAGE = "itzg/minecraft-server";

export const getVersions = async (type: string = "PAPER") => {
  const normalizedType = type.toUpperCase();
  if (normalizedType === "VELOCITY") {
    return ["latest", "3.3.0-SNAPSHOT"];
  }
  if (normalizedType === "BUNGEECORD" || normalizedType === "WATERFALL") {
    return ["latest"];
  }
  
  return [
    "latest", "1.21.4", "1.21.3", "1.21.1", "1.21", 
    "1.20.6", "1.20.5", "1.20.4", "1.20.2", "1.20.1", "1.20", 
    "1.19.4", "1.19.3", "1.19.2", "1.19.1", "1.19", 
    "1.18.2", "1.18.1", "1.18", "1.17.1", "1.17", "1.16.5", "1.16.4", "1.16.3", "1.16.2", "1.16.1", "1.15.2", "1.15.1", "1.15", 
    "1.14.4", "1.14.3", "1.14.2", "1.14.1", "1.14", "1.13.2", "1.13.1", "1.13", "1.12.2", "1.12.1", "1.12", "1.11.2", "1.10.2", 
    "1.9.4", "1.8.8", "1.7.10"
  ];
};

export const getContainerStatus = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    const isRunning = mockState[id] || false;
    return { State: { Running: isRunning, Status: isRunning ? "running" : "exited" } };
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info;
  } catch (e) {
    return null;
  }
};

export const createServerContainer = async (serverData: any) => {
  if (isSandbox) {
    mockState[serverData.id] = false;
    return "mock-container-id-" + serverData.id;
  }

  const rawImage = (serverData.docker_image || "").toLowerCase();
  const explicitType = (serverData.type || "").toUpperCase();
  const explicitNest = (serverData.nest || "").toLowerCase();
  
  const isNonMinecraft = rawImage.includes("node") || rawImage.includes("python") || rawImage.includes("bot") || rawImage.includes("discord") || rawImage.includes("rust") || rawImage.includes("go") || rawImage.includes("php") || rawImage.includes("ruby") || explicitNest.includes("node") || explicitNest.includes("python") || explicitNest.includes("bot");
  
  const isMinecraft = !isNonMinecraft && (
    rawImage.includes("minecraft") || 
    rawImage.includes("java") || 
    rawImage.includes("itzg") || 
    ["PAPER", "VANILLA", "FORGE", "SPIGOT", "PURPUR", "VELOCITY", "BUNGEECORD", "WATERFALL", "FABRIC", "QUILT", "MODPACK", "MINECRAFT"].includes(explicitType) ||
    (!serverData.docker_image && !serverData.type)
  );

  const validMcTypes = ["VANILLA", "FORGE", "BUKKIT", "SPIGOT", "PAPER", "FOLIA", "PURPUR", "FABRIC", "QUILT", "SPONGEVANILLA", "CUSTOM", "MAGMA", "MOHIST", "GTNH", "AIRPLANE", "PUFFERFISH", "CANYON", "LIMBO", "NANOLIMBO", "CRUCIBLE", "LEAF", "YOUER", "BANNER", "NEOFORGE", "VELOCITY", "BUNGEECORD", "WATERFALL", "MODPACK", "MINECRAFT"];
  let serverType = explicitType || (isMinecraft ? "PAPER" : "NODEJS");
  
  if (isMinecraft && !validMcTypes.includes(serverType)) {
    serverType = "PAPER"; // Fallback to PAPER if a bug set type to a nest name like 'GAME SERVERS'
  }

  const isProxy = ["VELOCITY", "BUNGEECORD", "WATERFALL"].includes(serverType);
  let dockerImage = serverData.docker_image || (isMinecraft ? "itzg/minecraft-server" : "ghcr.io/pterodactyl/yolks:nodejs_20");

  if (isMinecraft) {
    dockerImage = isProxy ? "itzg/bungeecord" : "itzg/minecraft-server";
  }

  // Pull image if not exists
  console.log(`Ensuring ${dockerImage} is pulled...`);
  try {
    await new Promise((resolve, reject) => {
      docker.pull(dockerImage, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, onFinished, onProgress);
        function onFinished(err: any, output: any) {
          if (err) return reject(err);
          resolve(output);
        }
        function onProgress(event: any) {}
      });
    });
  } catch (err) {
    console.error(`Failed to pull ${dockerImage}:`, err);
  }

  const serverDir = path.join(process.cwd(), ".data", "servers", serverData.id);
  await fs.ensureDir(serverDir);

  const port = serverData.allocation ? serverData.allocation.split(':')[1] : 25565;
  const memory = serverData.limits?.memory || 1024;
  
  // Base environment variables
  const envVars = [
    `SERVER_MEMORY=${memory}`,
    `SERVER_PORT=${port}`,
  ];

  // Apply custom environment variables if they exist
  if (serverData.environment) {
    Object.entries(serverData.environment).forEach(([key, val]) => {
      envVars.push(`${key}=${val}`);
    });
  }

  let containerConfig: any = {
    Image: dockerImage,
    name: `nova-server-${serverData.id}`,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    ExposedPorts: {
      [`${port}/tcp`]: {}
    },
    HostConfig: {
      PortBindings: {
        [`${port}/tcp`]: [{ HostPort: `${port}` }]
      },
      Binds: [`${serverDir}:/home/container`]
    }
  };

  if (isMinecraft) {
    // Minecraft specific logic for itzg/minecraft-server
    envVars.push(
      `TYPE=${serverType}`,
      `VERSION=${serverData.version || "latest"}`,
      `MEMORY=${memory}M`,
      `INIT_MEMORY=128M`
    );
    if (!isProxy) {
      envVars.push(
        `EULA=TRUE`,
        `ENABLE_RCON=true`,
        `RCON_PASSWORD=admin`,
        `JVM_OPTS=-DPaper.IgnoreWorldDataVersion=true`,
        `JVM_DD_OPTS=Paper.IgnoreWorldDataVersion=true,paper.ignoreWorldDataVersion=true`
      );
    }
    containerConfig.HostConfig.Binds = [`${serverDir}:${isProxy ? '/server' : '/data'}`];
  } else {
    // Generic Pterodactyl Yolk Logic (Node.js, Python, Rust, Go, Bots, etc)
    const startupCmd = serverData.startup_command || 'node index.js';
    
    // Inject standard Pterodactyl environment variables with fallback defaults
    envVars.push(
      `STARTUP=${startupCmd}`,
      `MAIN_FILE=${serverData.main_file || serverData.environment?.MAIN_FILE || "index.js"}`,
      `PY_FILE=${serverData.environment?.PY_FILE || serverData.main_file || "main.py"}`,
      `REQUIREMENTS_FILE=${serverData.environment?.REQUIREMENTS_FILE || "requirements.txt"}`,
      `SERVER_JARFILE=${serverData.server_jarfile || serverData.environment?.SERVER_JARFILE || "server.jar"}`,
      `SERVER_MEMORY=${memory}`,
      `SERVER_IP=0.0.0.0`,
      `SERVER_PORT=${port}`,
      `AUTO_UPDATE=${serverData.environment?.AUTO_UPDATE || "0"}`,
      `NODE_PACKAGES=${serverData.environment?.NODE_PACKAGES || ""}`,
      `UNNODE_PACKAGES=${serverData.environment?.UNNODE_PACKAGES || ""}`,
      `PY_PACKAGES=${serverData.environment?.PY_PACKAGES || ""}`,
      `MAX_PLAYERS=${serverData.environment?.MAX_PLAYERS || "32"}`,
      `SERVER_NAME=${serverData.environment?.SERVER_NAME || serverData.name || "My Server"}`,
      `RCON_PORT=${serverData.environment?.RCON_PORT || "27015"}`,
      `QUERY_PORT=${serverData.environment?.QUERY_PORT || "27016"}`
    );
    
    // We execute the parsed command via bash -c with smart auto-detection for MAIN_FILE and PY_FILE if missing
    const bashCmd = `
      cd /home/container
      if [ -z "$MAIN_FILE" ] || [ ! -f "$MAIN_FILE" ]; then
        for f in index.js bot.js app.js server.js main.js index.ts main.ts app.ts; do
          if [ -f "$f" ]; then MAIN_FILE="$f"; break; fi
        done
      fi
      if [ -z "$PY_FILE" ] || [ ! -f "$PY_FILE" ]; then
        if [ ! -z "$MAIN_FILE" ] && [ -f "$MAIN_FILE" ] && [[ "$MAIN_FILE" == *.py ]]; then
          PY_FILE="$MAIN_FILE"
        else
          for f in main.py bot.py app.py server.py index.py; do
            if [ -f "$f" ]; then PY_FILE="$f"; break; fi
          done
        fi
      fi
      export MAIN_FILE
      export PY_FILE
      export REQUIREMENTS_FILE
      export SERVER_JARFILE
      export SERVER_MEMORY="${memory}"
      export SERVER_PORT="${port}"
      echo -e "\\033[1m:/home/container$\\033[0m $STARTUP"
      eval "$(echo "$STARTUP" | sed -e 's/{{/\${/g' -e 's/}}/\}/g')"
    `;
    containerConfig.Cmd = ["/bin/bash", "-c", bashCmd];
    
    // Always bind to /home/container and set workdir for yolkes
    containerConfig.WorkingDir = "/home/container";
  }

  containerConfig.Env = envVars;

  const container = await docker.createContainer(containerConfig);
  return container.id;
};

export const startContainer = async (containerId: string, serverId: string, serverData?: any) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    
    // @ts-ignore
    if (global.io) {
       // @ts-ignore
       global.io.to(`server_${serverId}`).emit("log", `[System] Server started (Sandbox Mode).\r\n`);
    }
    return;
  }
  
  if (serverData) {
    try {
      const oldContainer = docker.getContainer(containerId);
      const info = await oldContainer.inspect();
      if (info.State.Running) await oldContainer.stop();
      await oldContainer.remove({ force: true });
    } catch(e) {}
    await createServerContainer(serverData);
  }

  try {
    const container = docker.getContainer(containerId);
    await container.start();
  } catch (e: any) {
    if (serverData && (e.statusCode === 404 || (e.message && e.message.includes('no such container')))) {
      await createServerContainer(serverData);
      const container = docker.getContainer(containerId);
      await container.start();
    } else {
      throw e;
    }
  }
  // Automatically attach after starting so logs stream to the UI
  await attachContainerSocket(containerId, serverId);
};

export const stopContainer = async (containerId: string, serverId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = false;
    // @ts-ignore
    if (global.io) {
       // @ts-ignore
       global.io.to(`server_${serverId}`).emit("log", `[System] Server stopped (Sandbox Mode).\r\n`);
    }
    return;
  }
  const container = docker.getContainer(containerId);
  await container.stop();
};

export const restartContainer = async (containerId: string, serverId: string, serverData?: any) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    mockState[id] = true;
    // @ts-ignore
    if (global.io) {
       // @ts-ignore
       global.io.to(`server_${serverId}`).emit("log", `[System] Server restarted (Sandbox Mode).\r\n`);
    }
    return;
  }
  
  if (serverData) {
    try {
      const oldContainer = docker.getContainer(containerId);
      const info = await oldContainer.inspect();
      if (info.State.Running) await oldContainer.stop();
      await oldContainer.remove({ force: true });
    } catch(e) {}
    await createServerContainer(serverData);
  }

  try {
    const container = docker.getContainer(containerId);
    await container.start();
  } catch (e: any) {
    if (serverData && (e.statusCode === 404 || (e.message && e.message.includes('no such container')))) {
      await createServerContainer(serverData);
      const container = docker.getContainer(containerId);
      await container.start();
    } else {
      throw e;
    }
  }
  await attachContainerSocket(containerId, serverId);
};

export const deleteContainer = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    delete mockState[id];
    return;
  }
  const container = docker.getContainer(containerId);
  try {
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop();
    }
    await container.remove({ force: true });
  } catch (err) {
    console.error("Error deleting container", err);
  }
};

export const getContainerLogs = async (containerId: string): Promise<string> => {
  if (isSandbox) return "[System] Sandbox mode. No historical logs available.\r\n";
  try {
    const container = docker.getContainer(containerId);
    const logsBuffer = await container.logs({ stdout: true, stderr: true, tail: 100 });
    return logsBuffer.toString('utf8');
  } catch (e) {
    return "";
  }
};

// @ts-ignore
if (!global.activeStreams) global.activeStreams = {};
// @ts-ignore
const getActiveStreams = () => global.activeStreams;

export const attachContainerSocket = async (containerId: string, serverId: string) => {
  if (isSandbox) {
    return;
  }
  try {
    const container = docker.getContainer(containerId);
    if (!getActiveStreams()[containerId]) {
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      getActiveStreams()[containerId] = stream;
      stream.on('data', (chunk) => {
        // @ts-ignore
        if (global.io) {
          // @ts-ignore
          global.io.to(`server_${serverId}`).emit("log", chunk.toString());
        }
      });
      stream.on('end', () => {
        delete getActiveStreams()[containerId];
      });
    }
  } catch(e) {
    console.error("Attach error", e);
  }
};

export const sendContainerCommand = async (containerId: string, serverId: string, command: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    // @ts-ignore
    if (global.io) {
       // @ts-ignore
       global.io.to(`server_${serverId}`).emit("log", `> ${command}\r\n`);
    }
    return;
  }
  
  // Echo the command back to the console UI
  // @ts-ignore
  if (global.io) {
    // @ts-ignore
    global.io.to(`server_${serverId}`).emit("log", `> ${command}\r\n`);
  }

  if (getActiveStreams()[containerId]) {
    getActiveStreams()[containerId].write(command + "\n");
  } else {
    try {
      const container = docker.getContainer(containerId);
      const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
      getActiveStreams()[containerId] = stream;
      stream.write(command + "\n");
      stream.on('data', (chunk) => {
        // Will be broadcasted due to existing or new attach
      });
    } catch(e) {
       console.error("Command error", e);
    }
  }
};

export const getContainerStats = async (containerId: string) => {
  if (isSandbox) {
    const id = containerId.replace("mock-container-id-", "");
    if (!mockState[id]) return { cpu: 0, ram: 0, disk: 0, uptimeMs: 0, netRxMB: 0, netTxMB: 0 };
    
    // Stable pseudo-random mock stats
    const timeSec = Math.floor(Date.now() / 5000);
    const floatPseudo = (Math.sin(timeSec + id.charCodeAt(0)) + 1) / 2;
    const started = mockStartedAt[id] || (Date.now() - 3600000 * ((id.charCodeAt(0) % 12) + 1));
    mockStartedAt[id] = started;
    const uptimeMs = Math.max(0, Date.now() - started);
    
    return {
      cpu: floatPseudo * 10 + 2,
      ram: 600 + (floatPseudo * 50 - 25),
      disk: 2.1,
      uptimeMs,
      netRxMB: Number((14.2 + floatPseudo * 5.5).toFixed(2)),
      netTxMB: Number((45.8 + floatPseudo * 18.2).toFixed(2))
    };
  }
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (!info.State.Running) {
      return { cpu: 0, ram: 0, disk: 0, uptimeMs: 0, netRxMB: 0, netTxMB: 0 };
    }
    const statsResult = await container.stats({ stream: false });
    
    let cpuPercent = 0.0;
    try {
      const cpuDelta = statsResult.cpu_stats.cpu_usage.total_usage - statsResult.precpu_stats.cpu_usage.total_usage;
      const systemDelta = statsResult.cpu_stats.system_cpu_usage - statsResult.precpu_stats.system_cpu_usage;
      if (systemDelta > 0.0 && cpuDelta > 0.0) {
        const cpus = statsResult.cpu_stats.online_cpus || statsResult.cpu_stats.cpu_usage.percpu_usage?.length || 1;
        cpuPercent = (cpuDelta / systemDelta) * cpus * 100.0;
      }
    } catch(e) {}

    let ramMB = 0.0;
    try {
      const stats = statsResult.memory_stats.stats as any || {};
      const cache = stats.cache || stats.inactive_file || stats.total_inactive_file || 0;
      const usedMemory = statsResult.memory_stats.usage - cache;
      ramMB = usedMemory / 1024 / 1024;
    } catch(e) {}

    let uptimeMs = 0;
    try {
      if (info.State.StartedAt) {
        const started = new Date(info.State.StartedAt).getTime();
        if (!isNaN(started) && started > 0) {
          uptimeMs = Math.max(0, Date.now() - started);
        }
      }
    } catch(e) {}

    let netRxMB = 0.0;
    let netTxMB = 0.0;
    try {
      if (statsResult.networks) {
        Object.values(statsResult.networks).forEach((net: any) => {
          netRxMB += (net.rx_bytes || 0) / 1024 / 1024;
          netTxMB += (net.tx_bytes || 0) / 1024 / 1024;
        });
      }
    } catch(e) {}

    return {
      cpu: cpuPercent,
      ram: ramMB,
      disk: 2.1,
      uptimeMs,
      netRxMB: Number(netRxMB.toFixed(2)),
      netTxMB: Number(netTxMB.toFixed(2))
    };
  } catch (e) {
    return { cpu: 0, ram: 0, disk: 0, uptimeMs: 0, netRxMB: 0, netTxMB: 0 };
  }
};

