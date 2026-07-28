import crypto from "crypto";
import fs from "fs-extra";
import path from "path";
import bcrypt from "bcrypt";

const SFTP_PORT = 2022; // Using 2022 as standard panel SFTP port
const HOST_KEYS_DIR = path.join(process.cwd(), ".data", "ssh");
const SFTP_DB_FILE = path.join(process.cwd(), ".data", "sftp_users.json");

const readSFTPDB = async () => {
  try {
    if (await fs.pathExists(SFTP_DB_FILE)) {
      return await fs.readJson(SFTP_DB_FILE);
    }
  } catch (e) {}
  return [];
};

const writeSFTPDB = async (data: any) => {
  await fs.ensureDir(path.dirname(SFTP_DB_FILE));
  await fs.writeJson(SFTP_DB_FILE, data, { spaces: 2 });
};

// Initialize SSH keys and SFTP server
export async function initSFTPServer() {
  try {
    const ssh2 = await import("ssh2");
    const { Server } = ssh2.default || ssh2;

    await fs.ensureDir(HOST_KEYS_DIR);
    
    let hostKeyPath = path.join(HOST_KEYS_DIR, "host_rsa");
    if (!fs.existsSync(hostKeyPath)) {
      const { privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs1", format: "pem" },
      });
      fs.writeFileSync(hostKeyPath, privateKey);
    }

    if (!fs.existsSync(SFTP_DB_FILE)) {
      await writeSFTPDB([]);
    }

    const hostKey = fs.readFileSync(hostKeyPath);

    const server = new Server({ hostKeys: [hostKey] }, (client: any) => {
      let sftpUser: any = null;

      client.on("authentication", async (ctx: any) => {
        try {
          if (ctx.method !== "password") {
            return ctx.reject();
          }

          const users = await readSFTPDB();
          const user = users.find((u: any) => u.username === ctx.username);

          if (!user) {
            return ctx.reject();
          }

          const match = await bcrypt.compare(ctx.password, user.passwordHash);
          if (match) {
            sftpUser = user;
            ctx.accept();
          } else {
            ctx.reject();
          }
        } catch (err) {
          console.error("SFTP auth error:", err);
          ctx.reject();
        }
      });

      client.on("ready", () => {
        client.on("session", (accept: any) => {
          const session = accept();
          session.on("sftp", (acceptSftp: any) => {
            if (!sftpUser) {
              return;
            }

            const sftpStream = acceptSftp();
            console.log("SFTP session started for user:", sftpUser.username);
            
            sftpStream.on("OPEN", (reqid: any) => {
              sftpStream.status(reqid, 4); // SSH_FX_FAILURE
            });
            sftpStream.on("READDIR", (reqid: any) => {
              sftpStream.status(reqid, 4);
            });
            sftpStream.on("STAT", (reqid: any) => {
              sftpStream.status(reqid, 4);
            });
          });
        });
      });
      
      client.on("error", () => {});
    });

    server.listen(SFTP_PORT, "0.0.0.0", () => {
      console.log(`> SFTP Server listening on port ${SFTP_PORT}`);
    });
  } catch (err) {
    console.log("SFTP Server init skipped or ssh2 not installed:", (err as any).message);
  }
}

export async function createSftpUser(serverId: string) {
  const users = await readSFTPDB();
  
  const existing = users.find((u: any) => u.serverId === serverId);
  if (existing) {
    const pass = existing.plainPassword || "nova_sftp_secret";
    return { username: existing.username, password: pass, plainPassword: pass };
  }

  const username = "nova_" + crypto.randomBytes(3).toString("hex");
  const password = crypto.randomBytes(8).toString("hex") + "!";
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: crypto.randomUUID(),
    serverId,
    username,
    passwordHash,
    plainPassword: password, // kept for easy retrieval in panel
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeSFTPDB(users);

  return { username, password, plainPassword: password };
}

export async function resetSftpPassword(serverId: string) {
  const users = await readSFTPDB();
  const userIndex = users.findIndex((u: any) => u.serverId === serverId);
  
  if (userIndex === -1) {
    return await createSftpUser(serverId);
  }

  const password = crypto.randomBytes(8).toString("hex") + "!";
  users[userIndex].passwordHash = await bcrypt.hash(password, 10);
  users[userIndex].plainPassword = password;
  users[userIndex].updatedAt = new Date().toISOString();

  await writeSFTPDB(users);

  return { username: users[userIndex].username, password, plainPassword: password };
}

export async function getSftpUser(serverId: string) {
  const users = await readSFTPDB();
  const found = users.find((u: any) => u.serverId === serverId);
  if (found) {
    const pass = found.plainPassword || "nova_sftp_secret";
    return { ...found, password: pass, plainPassword: pass };
  }
  return null;
}

export async function deleteSftpUser(serverId: string) {
  const users = await readSFTPDB();
  const filtered = users.filter((u: any) => u.serverId !== serverId);
  await writeSFTPDB(filtered);
}
