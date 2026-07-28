import { Order, DB, PteroServer, Egg, writeDB, assignAllocationToServer } from './db';
import { createServerContainer } from './docker';

export async function autoProvisionServerForOrder(order: Order, db: DB): Promise<PteroServer | null> {
  // 1. Check if already provisioned
  if (order.provisionedServerId) {
    const existing = db.pteroServers?.find(s => s.id === order.provisionedServerId);
    if (existing) return existing;
  }

  try {
    const clientConfig = order.clientConfig || {};
    const productStr = order.product || "";
    
    // Check if product exists in Store Products (Catalog defined by Admin)
    const storeProducts = db.settings?.storeProducts || [];
    const matchedStoreProduct = storeProducts.find((p: any) => 
      p.id === clientConfig.planId || 
      p.id === clientConfig.productId || 
      p.name.toLowerCase() === productStr.toLowerCase() ||
      productStr.toLowerCase().includes(p.name.toLowerCase())
    );

    const eggs = db.eggs || [];
    let selectedEgg: Egg | undefined;
    let ram = 1024;
    let cpu = 100;
    let disk = 10240;

    if (matchedStoreProduct) {
      if (matchedStoreProduct.ram) ram = Number(matchedStoreProduct.ram);
      if (matchedStoreProduct.cpu) cpu = Number(matchedStoreProduct.cpu);
      if (matchedStoreProduct.storage) disk = Number(matchedStoreProduct.storage) * 1024;
      if (matchedStoreProduct.eggId) {
        selectedEgg = eggs.find(e => e.id === matchedStoreProduct.eggId);
      }
    }

    // 2. Determine RAM (in MB) if not overridden by catalog product
    if (!matchedStoreProduct || !matchedStoreProduct.ram) {
      if (clientConfig.ram) {
        const ramStr = String(clientConfig.ram);
        const gbMatch = ramStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
        const mbMatch = ramStr.match(/(\d+)\s*MB/i);
        if (gbMatch) ram = Math.round(parseFloat(gbMatch[1]) * 1024);
        else if (mbMatch) ram = parseInt(mbMatch[1]);
        else if (!isNaN(Number(ramStr))) ram = Number(ramStr);
      } else {
        const gbMatch = productStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
        const mbMatch = productStr.match(/(\d+)\s*MB/i);
        if (gbMatch) ram = Math.round(parseFloat(gbMatch[1]) * 1024);
        else if (mbMatch) ram = parseInt(mbMatch[1]);
      }
    }

    // 3. Determine CPU (in %) if not overridden
    if (!matchedStoreProduct || !matchedStoreProduct.cpu) {
      if (clientConfig.cpu) {
        const cpuStr = String(clientConfig.cpu);
        const coreMatch = cpuStr.match(/(\d+)\s*Core/i);
        const pctMatch = cpuStr.match(/(\d+)\s*%/i);
        if (coreMatch) cpu = parseInt(coreMatch[1]) * 100;
        else if (pctMatch) cpu = parseInt(pctMatch[1]);
        else if (!isNaN(Number(cpuStr))) cpu = Number(cpuStr);
      } else {
        const coreMatch = productStr.match(/(\d+)\s*Core/i);
        const pctMatch = productStr.match(/(\d+)%/);
        if (coreMatch) cpu = parseInt(coreMatch[1]) * 100;
        else if (pctMatch) cpu = parseInt(pctMatch[1]);
      }
    }

    // 4. Determine Disk Storage (in MB) if not overridden
    if (!matchedStoreProduct || !matchedStoreProduct.storage) {
      if (clientConfig.storage || clientConfig.disk) {
        const storeStr = String(clientConfig.storage || clientConfig.disk);
        const gbMatch = storeStr.match(/(\d+(?:\.\d+)?)\s*GB/i);
        const mbMatch = storeStr.match(/(\d+)\s*MB/i);
        if (gbMatch) disk = Math.round(parseFloat(gbMatch[1]) * 1024);
        else if (mbMatch) disk = parseInt(mbMatch[1]);
        else if (!isNaN(Number(storeStr))) disk = Number(storeStr);
      } else {
        const gbMatch = productStr.match(/(\d+(?:\.\d+)?)\s*GB(?:\s*NVMe)?/i);
        if (gbMatch) disk = Math.round(parseFloat(gbMatch[1]) * 1024);
      }
    }

    // 5. Select Egg based on Admin product mapping or automatic keyword matching
    const productEggs = db.settings?.productEggs || {};
    const typeKey = String(clientConfig.type || clientConfig.category || "").toLowerCase();
    
    // Check admin mappings first
    if (!selectedEgg && typeKey && productEggs[typeKey]) {
      selectedEgg = eggs.find(e => e.id === productEggs[typeKey]);
    }
    if (!selectedEgg) {
      for (const [key, eggId] of Object.entries(productEggs)) {
        if (productStr.toLowerCase().includes(key.toLowerCase())) {
          selectedEgg = eggs.find(e => e.id === eggId);
          if (selectedEgg) break;
        }
      }
    }

    // Fallback keyword matching if not mapped in admin
    if (!selectedEgg) {
      const lowerProd = productStr.toLowerCase();
      if (lowerProd.includes('garry') || lowerProd.includes('gmod')) {
        selectedEgg = eggs.find(e => e.id === 'gmod_game') || eggs.find(e => e.nest === 'Game Servers');
      } else if (lowerProd.includes('ark')) {
        selectedEgg = eggs.find(e => e.id === 'ark_survival') || eggs.find(e => e.nest === 'Game Servers');
      } else if (lowerProd.includes('valheim')) {
        selectedEgg = eggs.find(e => e.id === 'valheim_server') || eggs.find(e => e.nest === 'Game Servers');
      } else if (lowerProd.includes('rust')) {
        selectedEgg = eggs.find(e => e.id === 'rust_game') || eggs.find(e => e.nest === 'Game Servers');
      } else if (lowerProd.includes('cs2') || lowerProd.includes('counter-strike')) {
        selectedEgg = eggs.find(e => e.id === 'cs2_game') || eggs.find(e => e.nest === 'Game Servers');
      } else if (typeKey === 'games' || lowerProd.includes('minecraft') || lowerProd.includes('game')) {
        selectedEgg = eggs.find(e => e.nest === 'Minecraft' || e.id === 'minecraft_java' || e.nest === 'Game Servers') || eggs[0];
      } else if (typeKey === 'discord' || lowerProd.includes('bot') || lowerProd.includes('discord')) {
        if (lowerProd.includes('py') || lowerProd.includes('python')) {
          selectedEgg = eggs.find(e => e.id === 'python_311' || e.id === 'discord_bot_python') || eggs.find(e => e.nest === 'Discord Bot');
        } else {
          selectedEgg = eggs.find(e => e.id === 'nodejs_20' || e.id === 'discord_bot_node') || eggs.find(e => e.nest === 'Discord Bot');
        }
      } else if (typeKey === 'webhosting' || lowerProd.includes('web') || lowerProd.includes('hosting') || lowerProd.includes('nginx')) {
        selectedEgg = eggs.find(e => e.id === 'web_hosting_nginx' || e.nest === 'Web Hosting');
      } else {
        selectedEgg = eggs[0]; // fallback to first egg
      }
    }

    if (!selectedEgg && eggs.length > 0) {
      selectedEgg = eggs[0];
    }

    if (!selectedEgg) {
      console.error("No eggs available in DB to provision server.");
      return null;
    }

    // 6. Create Server object
    const serverId = "srv_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const allocResult = assignAllocationToServer(db, serverId, matchedStoreProduct?.nodeId);
    const newServer: PteroServer = {
      id: serverId,
      name: `${order.product} (#${order.orderId})`,
      ownerEmail: order.user.email,
      node: allocResult.nodeName,
      allocation: allocResult.allocation,
      eggId: selectedEgg.id,
      nest: selectedEgg.nest || "General",
      allowedEggs: matchedStoreProduct?.allowedEggs || [],
      limits: {
        memory: ram,
        swap: 0,
        disk: disk,
        io: 500,
        cpu: cpu
      },
      docker_image: selectedEgg.docker_image,
      startup_command: selectedEgg.startup_command,
      status: 'offline'
    };

    // 7. Create container
    await createServerContainer(newServer);

    // 8. Attach to DB & update Order
    if (!db.pteroServers) db.pteroServers = [];
    db.pteroServers.push(newServer);

    order.provisionedServerId = newServer.id;
    order.deliveryDetails = `✅ INSTANT PROVISIONING SUCCESS\n\nServer Name: ${newServer.name}\nServer ID: ${newServer.id}\nSoftware / Engine: ${selectedEgg.name}\nAllocated Resources: ${ram}MB RAM | ${cpu}% CPU | ${disk}MB Storage\n\nYour server is ready! Go to 'My Servers' in your Client Portal to manage, start, or access the console.`;

    writeDB(db);
    return newServer;
  } catch (err) {
    console.error("Error auto-provisioning server for order:", err);
    return null;
  }
}
