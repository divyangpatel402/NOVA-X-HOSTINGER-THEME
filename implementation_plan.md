# Port All Jtg-main Working Features into Nova Panel (faa)

## Background

The user wants all working hosting functionality from `Jtg-main` (a Vite+Express panel) ported into the main `faa` project (a Next.js panel called "Nova Panel"). Both projects share the same Docker-based Minecraft/generic server hosting approach but `Jtg-main` has several features that are either missing or partially implemented in `faa`.

## Analysis: What Jtg-main Has vs What faa Already Has

### ✅ Already Present in faa (no action needed)
- Docker container create/start/stop/restart/delete
- File Manager (list, upload, delete, rename, save, create file/dir)
- Plugin Manager (Modrinth, Spigot, Hangar)
- Mod Manager (Modrinth)
- Server Properties editor
- Server Backups (create, list, delete)
- Server Settings (version change)
- Startup Manager (env vars, docker image, startup cmd)
- Sub Users Manager
- SFTP component
- Live Console with Socket.io
- Server creation with Egg/Nest system

### 🔴 Missing in faa — Need to Port from Jtg-main

| Feature | Jtg-main Location | faa Status |
|---|---|---|
| **Live Container Stats (CPU/RAM/Disk)** | `docker.ts → getContainerStats()` | ❌ Missing — No stats API |
| **Send Console Command to Docker** | `servers.ts → sendCommand route` + `docker.ts → sendContainerCommand()` | ❌ Console input doesn't actually send to Docker |
| **Container auto-recreate on missing** | `controllers/servers.ts → startServer` | ❌ Missing — fails if container deleted |
| **Server Suspend** | `controllers/servers.ts → updateSuspend` | ❌ Missing |
| **Resource Update (RAM/CPU/Disk)** | `controllers/servers.ts → updateResources` | ❌ Missing |
| **IP Alias per server** | `controllers/servers.ts → updateIpAlias` | ❌ Missing |
| **Owner transfer** | `controllers/servers.ts → updateOwner` | ❌ Missing |
| **File Zip** | `controllers/servers.ts → zipFiles` | ❌ Missing |
| **File Unzip (Extract)** | `controllers/servers.ts → unzipFile` | ❌ Missing — user specifically asked for this |
| **Backup Download** | `controllers/servers.ts → downloadBackup` | ❌ Missing |
| **Playit Tunnel integration** | `routes/servers.ts → playit routes` | ❌ Missing |
| **SFTP server (SSH2)** | `services/sftp.ts` | ❌ Missing — only UI component exists, no actual SFTP server |
| **API Key system** | `routes/api-keys.ts` | ❌ Missing |
| **System Stats (OS CPU/RAM)** | `routes/system.ts → /stats` | ❌ Missing |
| **Panel Settings (branding, bg)** | `routes/system.ts → /settings` | ❌ Missing |

## Proposed Changes

### 1. Docker Service — Add `getContainerStats`
#### [MODIFY] [docker.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/lib/docker.ts)
- Add `getContainerStats()` function from Jtg-main to compute live CPU%, RAM usage, and disk
- Fix `startContainer` to auto-recreate if container is missing (404 handling)
- Fix `restartContainer` to auto-recreate if container is missing

---

### 2. Console Command API — Send commands to Docker
#### [NEW] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/command/route.ts)
- POST endpoint that receives `{ command }` and calls `sendContainerCommand()`

#### [MODIFY] [page.tsx](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/admin/servers/[id]/page.tsx)
- Fix console input to actually send command to the API (currently only adds to local logs)

#### [MODIFY] [page.tsx](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/client/servers/[id]/page.tsx)
- Same fix for client-side console

---

### 3. Server Stats API
#### [NEW] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/stats/route.ts)
- GET endpoint that returns live CPU/RAM/disk stats from Docker container

#### [MODIFY] Both admin and client server pages
- Add live stats polling (every 5s) and display CPU/RAM gauges in sidebar

---

### 4. File Manager — Add Zip/Unzip/Extract
#### [MODIFY] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/files/route.ts)
- Add `action: 'zip'` and `action: 'unzip'` handlers to the POST method

#### [MODIFY] [FileManager.tsx](file:///c:/Users/pclog/OneDrive/Desktop/faa/components/FileManager.tsx)
- Add "Extract" button for .zip files
- Add "Compress" button for selected files

---

### 5. Backup Download
#### [MODIFY] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/backups/route.ts)
- Add GET with `?filename=xxx` to serve backup file download

#### [MODIFY] [ServerBackups.tsx](file:///c:/Users/pclog/OneDrive/Desktop/faa/components/ServerBackups.tsx)
- Add Download button

---

### 6. Server Suspend/Unsuspend
#### [MODIFY] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/route.ts)
- Add `action: 'suspend'` and `action: 'unsuspend'` handlers

#### [MODIFY] Admin server page
- Add Suspend/Unsuspend button in sidebar

---

### 7. Resource Update (RAM/CPU/Disk live)
#### [NEW] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/resources/route.ts)
- PUT endpoint to update server RAM/CPU/disk limits

---

### 8. SFTP Server
#### [NEW] [sftp.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/lib/sftp.ts)
- Port the full SFTP service from Jtg-main

#### [MODIFY] [server.js](file:///c:/Users/pclog/OneDrive/Desktop/faa/server.js)
- Initialize SFTP server on startup

#### [NEW] SFTP API routes for create/reset/get/delete
#### [MODIFY] [ServerSFTP.tsx](file:///c:/Users/pclog/OneDrive/Desktop/faa/components/ServerSFTP.tsx)
- Connect to real SFTP API endpoints

---

### 9. Playit Tunnel
#### [NEW] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/servers/[id]/playit/route.ts)
- GET, POST (start/stop/reset) endpoints for Playit tunnel management

---

### 10. API Keys
#### [NEW] [route.ts](file:///c:/Users/pclog/OneDrive/Desktop/faa/app/api/admin/api-keys/route.ts)
- GET (list), POST (create), DELETE (delete) API key management

---

## Verification Plan

### Automated Tests
- `npm run build` to ensure no TypeScript/compilation errors

### Manual Verification
1. Deploy to VPS via install script
2. Test all features: console command send, file extract, backup download, stats, suspend, SFTP, Playit

> [!IMPORTANT]
> This is a large migration with ~15 features to port. I'll implement them in priority order starting with the most critical user-requested features: **Console command send**, **File Extract**, **Live Stats**, **Backup Download**, then the rest.
