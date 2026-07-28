const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  global.io = io; // Make io globally accessible

  // Basic connection handler for Socket.io
  io.on('connection', (socket) => {
    socket.on('joinServer', async (serverId) => {
      socket.join(`server_${serverId}`);
      socket.emit('log', `[NOVA] Connected to terminal stream for server ${serverId}\r\n`);
      
      try {
        const Docker = require('dockerode');
        const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });
        
        // Find container ID from database
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(process.cwd(), 'data.json');
        if (fs.existsSync(dbPath)) {
          const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          const server = db.pteroServers?.find(s => s.id === serverId);
          if (server) {
             const containerName = `nova-server-${serverId}`;
             const container = docker.getContainer(containerName);
             
             try {
               const info = await container.inspect();
               if (info.State.Running) {
                 // Send last 100 lines of logs
                 const logsBuffer = await container.logs({ stdout: true, stderr: true, tail: 100 });
                 if (logsBuffer) {
                    socket.emit('log', logsBuffer.toString('utf8').replace(/\n/g, '\r\n') + '\r\n');
                 }
                 
                 // Attach stream if not already handled elsewhere (this is safe to call multiple times as long as we don't leak listeners)
                 if (!global.activeStreams) global.activeStreams = {};
                 if (!global.activeStreams[containerName]) {
                    const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });
                    global.activeStreams[containerName] = stream;
                    stream.on('data', (chunk) => {
                      global.io.to(`server_${serverId}`).emit("log", chunk.toString().replace(/\n/g, '\r\n'));
                    });
                    stream.on('end', () => {
                      delete global.activeStreams[containerName];
                    });
                 }
               }
             } catch(e) {
                // Container might not exist yet
             }
          }
        }
      } catch(e) {
        console.error("Socket join error", e);
      }
    });
    
    socket.on('leaveServer', (serverId) => {
      socket.leave(`server_${serverId}`);
    });
  });

  httpServer.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
}).catch(err => {
  console.error("Error starting server:", err);
  process.exit(1);
});
