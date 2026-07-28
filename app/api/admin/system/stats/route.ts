import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const ramUsage = Math.round((usedMemory / totalMemory) * 100);

    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    // Rough approximation of CPU usage percentage from loadavg or CPUs
    let cpuUsage = Math.round(loadAvg[0] * 10) / 10;
    if (cpuUsage > 100) cpuUsage = 100;

    return NextResponse.json({
      cpuUsage: isNaN(cpuUsage) ? 5 : cpuUsage,
      totalMemory,
      freeMemory,
      usedMemory,
      ramUsage: isNaN(ramUsage) ? 20 : ramUsage,
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      cpus: cpus.length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
